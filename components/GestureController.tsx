import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useApp } from '../contexts/AppContext';

const GestureController: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const { activeTab, setActiveTab, settings } = useApp();
  const [detectedGesture, setDetectedGesture] = useState<string | null>(null);
  const activeTabRef = useRef(activeTab);

  // Keep ref in sync so gesture loop doesn't need effect to re-run on tab change
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // State refs for smooth gesture handling
  const lastGestureTime = useRef<number>(0);
  const isPinchHeldRef = useRef(false); // one click per pinch; reset when user releases
  const waveHistoryX = useRef<number[]>([]); // open palm wave direction
  const isLoaded = useRef(false);

  useEffect(() => {
    if (!settings.enableGestures) return;

    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: number;

    const setupMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        isLoaded.current = true;
        startWebcam();
      } catch (e) {
        console.error("Failed to load MediaPipe:", e);
      }
    };

    const startWebcam = async () => {
      if (videoRef.current && navigator.mediaDevices) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener("loadeddata", predictWebcam);
        } catch (err) {
          console.error("Webcam not accessible:", err);
        }
      }
    };

    const predictWebcam = () => {
      if (!handLandmarker || !videoRef.current || !isLoaded.current) return;
      
      // Fix: Ensure video has dimensions before processing to avoid MediaPipe errors
      if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
        try {
            const startTimeMs = performance.now();
            const results = handLandmarker.detectForVideo(videoRef.current, startTimeMs);

            if (results.landmarks && results.landmarks.length > 0) {
                const landmarks = results.landmarks[0];
                processLandmarks(landmarks);
            } else {
                setDetectedGesture(null);
            }
        } catch (e) {
            console.error("MediaPipe detection error:", e);
        }
      }

      animationFrameId = requestAnimationFrame(predictWebcam);
    };

    setupMediaPipe();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (videoRef.current && videoRef.current.srcObject) {
         const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
         tracks.forEach(track => track.stop());
      }
      if(handLandmarker) handLandmarker.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.enableGestures]);

  const processLandmarks = (landmarks: any[]) => {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    const wrist = landmarks[0];

    // 1. Move Cursor (Index Tip)
    // Mirror X coordinates for natural feeling
    const x = (1 - indexTip.x) * window.innerWidth;
    const y = indexTip.y * window.innerHeight;

    if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${x}px, ${y}px)`;
    }

    // 2. Detect Gestures
    
    // Calculate Pinch Distance (Thumb to Index)
    const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
    
    // Calculate Fingers Extended (Distance from wrist)
    const fingersExtended = [indexTip, middleTip, ringTip, pinkyTip].filter(tip => 
        Math.hypot(tip.x - wrist.x, tip.y - wrist.y) > 0.2
    ).length;

    const now = Date.now();

    // -- Fist: Pause --
    if (fingersExtended === 0) {
        setDetectedGesture("⏸️ Paused");
        return; // Stop processing other gestures
    }

    // -- Pinch: Click once per pinch (release then pinch again to click again) --
    if (pinchDist < 0.05) {
        setDetectedGesture("🤏 Click");
        // Fire only once while user holds pinch; they must release and pinch again for another click
        if (!isPinchHeldRef.current) {
            isPinchHeldRef.current = true;
            const element = document.elementFromPoint(x, y);
            if (element && element instanceof HTMLElement && !element.closest('[data-gesture-ignore]')) {
                element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y }));
                const ripple = document.createElement('div');
                ripple.className = 'fixed rounded-full bg-white/50 animate-ping pointer-events-none z-50';
                ripple.style.left = `${x - 10}px`;
                ripple.style.top = `${y - 10}px`;
                ripple.style.width = '20px';
                ripple.style.height = '20px';
                document.body.appendChild(ripple);
                setTimeout(() => ripple.remove(), 500);
            }
        }
    } else {
        // User released pinch; allow next pinch to trigger a click
        isPinchHeldRef.current = false;
    }

    // -- Open Palm: Wave left = Undo, Wave right = Redo --
    if (fingersExtended === 4 && pinchDist > 0.1) {
        // Track palm position (wrist X) for wave direction
        waveHistoryX.current.push(wrist.x);
        if (waveHistoryX.current.length > 8) waveHistoryX.current.shift();

        if (waveHistoryX.current.length === 8) {
            const start = waveHistoryX.current[0];
            const end = waveHistoryX.current[7];
            const diff = start - end;

            if (now - lastGestureTime.current > 400) {
                // Wave left (hand moves left, X decreases) -> Undo
                if (diff > 0.12) {
                    setDetectedGesture("✋⬅️ Undo");
                    handleNavigation("Back");
                    lastGestureTime.current = now;
                }
                // Wave right (hand moves right, X increases) -> Redo
                else if (diff < -0.12) {
                    setDetectedGesture("✋➡️ Redo");
                    handleNavigation("Next");
                    lastGestureTime.current = now;
                } else {
                    setDetectedGesture("✋ Open palm");
                }
            } else {
                setDetectedGesture("✋ Open palm");
            }
        } else {
            setDetectedGesture("✋ Open palm");
        }
    } else if (fingersExtended === 1) {
        setDetectedGesture("👆 Pointer");
    }
  };

  const handleNavigation = (direction: string) => {
    const tabs = ['dashboard', 'tasks', 'calendar', 'routines', 'settings'];
    const currentIndex = tabs.indexOf(activeTabRef.current);
    
    // Mapping actions to Undo/Redo logic as requested
    if (direction === "Next") {
        setDetectedGesture("➡️ Redo");
        const next = (currentIndex + 1) % tabs.length;
        setActiveTab(tabs[next]);
    } else {
        setDetectedGesture("⬅️ Undo");
        const prev = (currentIndex - 1 + tabs.length) % tabs.length;
        setActiveTab(tabs[prev]);
    }
  };

  if (!settings.enableGestures) return null;

  return (
    <>
        {/* Custom Cursor */}
        <div 
            ref={cursorRef} 
            className="fixed w-6 h-6 rounded-full border-2 border-primary bg-white/30 backdrop-blur-sm pointer-events-none z-[100] transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.6)]"
        >
            <div className="w-1 h-1 bg-white rounded-full"></div>
        </div>

        {/* Camera Preview */}
        <div className="fixed bottom-24 right-4 w-32 h-24 bg-black rounded-lg overflow-hidden border-2 border-primary shadow-lg z-40 group">
            <video ref={videoRef} className="w-full h-full object-cover transform scale-x-[-1] opacity-50 group-hover:opacity-100 transition-opacity" autoPlay playsInline muted />
            {detectedGesture && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-xs font-bold backdrop-blur-sm animate-pulse">
                {detectedGesture}
                </div>
            )}
        </div>
    </>
  );
};

export default GestureController;