import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, Send, MessageSquare, X, Play, Square, Loader2, Sparkles, Globe } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Task, TaskStatus, Routine } from '../types';
import { toolsDeclaration } from '../services/geminiTools';
import { decodeAudioData, arrayBufferToBase64, base64ToUint8Array } from '../utils/audioUtils';

const AIAssistant: React.FC = () => {
  const { addTask, tasks, addRoutine, settings } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'chat' | 'voice'>('chat');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string, sources?: any[]}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('Idle');
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  
  useEffect(() => {
    // Wake word detection
    if (!('webkitSpeechRecognition' in window)) return;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        const text = lastResult[0].transcript.toLowerCase();
        if (text.includes('hey buddy')) {
            if (!isOpen) {
              setIsOpen(true);
              setMode('voice');
              // Auto-start session with greeting enabled
              startLiveSession(true); 
            }
        }
    };
    
    try {
       recognition.start();
    } catch(e) {
        console.log("Speech recognition started/not allowed");
    }

    return () => {
        recognition.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Handle Gemini Function Calls
  const handleToolCall = async (fc: any) => {
      let result = "Action failed";

      if (fc.name === 'addTask') {
          const newTask: Task = {
              id: Date.now().toString(),
              title: fc.args.title,
              date: fc.args.date || new Date().toISOString().split('T')[0],
              time: fc.args.time,
              category: fc.args.category || 'General',
              status: TaskStatus.TODO
          };
          addTask(newTask);
          result = `Task "${newTask.title}" added for ${newTask.date}.`;
      } else if (fc.name === 'getTasks') {
          result = JSON.stringify(tasks.map(t => `${t.title} at ${t.time || 'all day'} on ${t.date}`));
      } else if (fc.name === 'addRoutine') {
          const newRoutine: Routine = {
              id: Date.now().toString(),
              title: fc.args.title,
              time: fc.args.time,
              frequency: 'daily',
              active: true
          };
          addRoutine(newRoutine);
          result = `Routine "${newRoutine.title}" set for ${newRoutine.time}.`;
      }

      return {
          id: fc.id,
          name: fc.name,
          response: { result }
      };
  };

  // --- Chat Mode ---
  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsProcessing(true);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
                role: 'user',
                parts: [{ text: userMsg }]
            },
            config: {
                // Enable Google Search for Chat
                tools: [{ functionDeclarations: toolsDeclaration }, { googleSearch: {} }],
            }
        });

        const candidates = response.candidates;
        if (candidates && candidates.length > 0) {
            const content = candidates[0].content;
            const parts = content.parts;
            // Extract grounding chunks if available
            const groundingChunks = candidates[0].groundingMetadata?.groundingChunks;
            
            let modelText = "";
            let toolOutputs = "";

            for (const part of parts) {
                if (part.text) {
                    modelText += part.text;
                }
                if (part.functionCall) {
                   const toolResponse = await handleToolCall(part.functionCall);
                   toolOutputs += `\n[Action: ${toolResponse.response.result}]`;
                }
            }
            
            const sources = groundingChunks?.map((chunk: any) => chunk.web).filter(Boolean);

            setMessages(prev => [...prev, { 
              role: 'model', 
              text: modelText + toolOutputs,
              sources: sources
            }]);
        }
    } catch (error) {
        setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please check your connection." }]);
        console.error(error);
    } finally {
        setIsProcessing(false);
    }
  };

  // --- Voice Mode (Live API) ---
  const startLiveSession = async (sayHello = false) => {
      setIsListening(true);
      setVoiceStatus('Connecting...');

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextStartTimeRef.current = audioContextRef.current.currentTime;

      // Instructions with dynamic greeting check
      const instructions = `You are Buddy, a smart task assistant. ${sayHello ? "The user just woke you up with 'Hey Buddy', so greet them cheerfully immediately." : "Be concise."}`;

      const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          config: {
              responseModalities: [Modality.AUDIO],
              tools: [{ functionDeclarations: toolsDeclaration }],
              speechConfig: {
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
              },
              systemInstruction: { parts: [{ text: instructions }] }
          },
          callbacks: {
              onopen: () => {
                  setVoiceStatus('Listening');
                  startMicrophone(sessionPromise);
              },
              onmessage: async (msg: LiveServerMessage) => {
                  const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                  if (audioData && audioContextRef.current) {
                      const buffer = await decodeAudioData(
                          base64ToUint8Array(audioData),
                          audioContextRef.current
                      );
                      const source = audioContextRef.current.createBufferSource();
                      source.buffer = buffer;
                      source.connect(audioContextRef.current.destination);
                      
                      const startTime = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
                      source.start(startTime);
                      nextStartTimeRef.current = startTime + buffer.duration;
                  }

                  if (msg.toolCall) {
                     for (const fc of msg.toolCall.functionCalls) {
                        const response = await handleToolCall(fc);
                        sessionPromise.then(session => session.sendToolResponse({
                            functionResponses: response
                        }));
                     }
                  }
              },
              onclose: () => {
                  setVoiceStatus('Disconnected');
                  stopLiveSession();
              },
              onerror: (e) => {
                  console.error("Live API Error", e);
                  setVoiceStatus('Error');
              }
          }
      });
      sessionRef.current = await sessionPromise;
  };

  const startMicrophone = async (sessionPromise: Promise<any>) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: 16000 } });
        mediaStreamRef.current = stream;
        
        const audioContext = new AudioContext({ sampleRate: 16000 });
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        
        processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmData = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
                pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
            }
            const base64Audio = arrayBufferToBase64(pcmData.buffer);
            sessionPromise.then(session => {
                session.sendRealtimeInput({
                    media: { mimeType: "audio/pcm;rate=16000", data: base64Audio }
                });
            });
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
        sourceRef.current = source;
        processorRef.current = processor;
      } catch (err) {
          console.error("Mic error", err);
      }
  };

  const stopLiveSession = () => {
      setIsListening(false);
      setVoiceStatus('Idle');
      if (sessionRef.current) sessionRef.current = null;
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
      if (processorRef.current) processorRef.current.disconnect();
      if (sourceRef.current) sourceRef.current.disconnect();
      if (audioContextRef.current) audioContextRef.current.close();
  };


  if (!isOpen) {
      return (
          <button 
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-secondary rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50 animate-pulse-slow">
              <Sparkles className="w-8 h-8 text-white" />
          </button>
      );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-card rounded-2xl shadow-2xl border border-gray-700 flex flex-col z-50 overflow-hidden">
        <div className="p-4 bg-dark/50 flex justify-between items-center border-b border-gray-700">
            <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-secondary" />
                <h3 className="font-bold">Gemini Assistant</h3>
            </div>
            <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setMode(mode === 'chat' ? 'voice' : 'chat'); if(isListening) stopLiveSession(); }}
                  className={`p-1.5 rounded-lg ${mode === 'voice' ? 'bg-secondary text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                    {mode === 'voice' ? <Mic size={16}/> : <MessageSquare size={16}/>}
                </button>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                    <X size={20} />
                </button>
            </div>
        </div>

        {mode === 'chat' ? (
            <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-lg text-sm ${m.role === 'user' ? 'bg-primary text-white' : 'bg-gray-700 text-gray-200'}`}>
                                {m.text}
                            </div>
                            {m.sources && m.sources.length > 0 && (
                              <div className="mt-2 text-xs flex flex-wrap gap-2 max-w-[85%]">
                                {m.sources.map((src, idx) => (
                                  <a key={idx} href={src.uri} target="_blank" rel="noreferrer" className="flex items-center gap-1 bg-dark/50 hover:bg-dark px-2 py-1 rounded border border-gray-600 text-blue-400 truncate max-w-[150px]">
                                    <Globe size={10} /> {src.title}
                                  </a>
                                ))}
                              </div>
                            )}
                        </div>
                    ))}
                    {isProcessing && <div className="text-xs text-gray-500 flex gap-1 items-center"><Loader2 className="animate-spin w-3 h-3"/> Thinking...</div>}
                </div>
                <div className="p-3 border-t border-gray-700 flex gap-2">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Search web or add task..."
                        className="flex-1 bg-dark rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-primary outline-none"
                    />
                    <button onClick={handleSend} className="p-2 bg-primary rounded-lg text-white hover:bg-primary/90">
                        <Send size={18} />
                    </button>
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-6 bg-gradient-to-b from-card to-dark">
                <div className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${isListening ? 'bg-secondary/20 shadow-[0_0_30px_rgba(168,85,247,0.3)]' : 'bg-gray-800'}`}>
                    {isListening && <div className="absolute inset-0 rounded-full border-4 border-secondary animate-ping opacity-20"></div>}
                    <Mic className={`w-10 h-10 ${isListening ? 'text-secondary' : 'text-gray-500'}`} />
                </div>
                
                <div className="text-center">
                    <h3 className="text-xl font-bold mb-1">{isListening ? 'Listening...' : 'Ready'}</h3>
                    <p className="text-sm text-gray-400">{voiceStatus}</p>
                    <p className="text-xs text-gray-600 mt-2">Say "Hey Buddy" to wake up</p>
                </div>

                <button 
                    onClick={isListening ? stopLiveSession : () => startLiveSession(false)}
                    className={`px-8 py-3 rounded-full font-semibold flex items-center gap-2 transition-colors ${isListening ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-primary text-white hover:bg-primary/90'}`}>
                    {isListening ? <><Square size={16} fill="currentColor"/> Stop</> : <><Play size={16} fill="currentColor"/> Start Conversation</>}
                </button>
            </div>
        )}
    </div>
  );
};

export default AIAssistant;