import { GoogleGenAI, Type } from "@google/genai";
import { Plan } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const reviewPlans = async (plans: Plan[]): Promise<string> => {
  if (plans.length === 0) {
    return "It looks like you haven't added any plans for tomorrow yet. Start by adding a few key tasks!";
  }

  const planList = plans.map(p => `- [${p.priority.toUpperCase()}] ${p.content}`).join('\n');

  const prompt = `
    You are an expert productivity coach. Review the following list of tasks planned for tomorrow:
    
    ${planList}
    
    Provide a concise, friendly response (under 100 words). 
    1. Acknowledge the workload.
    2. Give 1 specific tip to ensure these get done (e.g., about prioritization or breaks).
    3. Be encouraging.
    Format as plain text, no markdown headers.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Keep up the good work!";
  } catch (error) {
    console.error("Error generating AI review:", error);
    return "I'm having trouble connecting to the productivity cloud right now, but your plan looks solid!";
  }
};

export const generateSchedule = async (plans: Plan[], startTime: string = "09:30"): Promise<{id: string, suggestedTime: string}[]> => {
  if (plans.length === 0) return [];

  const planData = plans.map(p => ({
    id: p.id,
    content: p.content,
    priority: p.priority,
    duration: p.estimatedDuration || 30 // Default to 30 mins if not provided
  }));

  const prompt = `
    Create an optimal schedule for these tasks. 
    Start time: ${startTime}.
    
    Tasks:
    ${JSON.stringify(planData)}

    Rules:
    1. **Time Format**: STRICTLY use 24-hour format (e.g. "09:30", "14:00", "18:15"). DO NOT use AM/PM.
    2. **Working Hours**: 09:30 to 24:00 (Midnight).
    3. **Lunch Break**: 12:00 to 13:30. 
    4. **Dinner Break**: 18:00 to 18:30. 
    5. **Rest Time**: 00:00 to 09:30.
    
    Logic:
    - **CRITICAL**: Long tasks ARE ALLOWED to span across Lunch or Dinner breaks. 
      - Example: A 3-hour task starting at 11:00 is perfectly fine. It implies the user works 11:00-12:00, takes a break, and resumes 13:30-15:30.
    - **CONSTRAINT**: You simply must ensure the **Start Time** of a task does not fall *inside* a break.
      - If a calculated start time is 12:15, move it to 13:30.
      - If a calculated start time is 18:10, move it to 18:30.
    - When calculating when the *next* task begins, account for the break time if the previous task spanned across it.
    - Respect estimated durations.
    - Group similar tasks if possible.
    - Return a valid JSON array of objects containing only 'id' and 'suggestedTime'.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              suggestedTime: { type: Type.STRING }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "[]");
    return result;
  } catch (error) {
    console.error("Error optimizing schedule:", error);
    return [];
  }
};
