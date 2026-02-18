import { FunctionDeclaration, Type } from "@google/genai";

export const toolsDeclaration: FunctionDeclaration[] = [
  {
    name: "addTask",
    description: "Add a new task to the user's list",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Title of the task" },
        date: { type: Type.STRING, description: "Date in YYYY-MM-DD format. Default to today if not specified." },
        time: { type: Type.STRING, description: "Time in HH:mm format (optional)" },
        category: { type: Type.STRING, description: "Category like 'Work', 'Personal', 'Health'" }
      },
      required: ["title", "date"]
    }
  },
  {
    name: "getTasks",
    description: "Get all current tasks to answer questions about schedule",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    }
  },
  {
    name: "addRoutine",
    description: "Add a new daily routine",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        time: { type: Type.STRING, description: "Time in HH:mm format" }
      },
      required: ["title", "time"]
    }
  }
];