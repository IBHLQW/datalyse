import { GoogleGenAI } from "@google/genai";
import { DataRow, DataInsight } from "../types";

let aiInstance: GoogleGenAI | null = null;

export const getAIInstance = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

export const generateDataInsights = async (dataSample: DataRow[]): Promise<DataInsight> => {
  const ai = getAIInstance();
  
  const dataString = JSON.stringify(dataSample.slice(0, 50)); // Send a sample
  
  const prompt = `
    You are an expert data analyst. Analyze this dataset sample and provide executive insights.
    Dataset sample: ${dataString}
    
    Return a response in JSON format with the following structure:
    {
      "title": "A concise title for the report",
      "summary": "A high-level overview of what the data shows",
      "keyFindings": ["3-5 clear, data-driven findings"],
      "recommendations": ["3 actionable next steps based on the findings"]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result as DataInsight;
  } catch (error) {
    console.error("AI Insight Generation Error:", error);
    return {
      title: "Data Analysis Report",
      summary: "Could not generate AI insights at this time.",
      keyFindings: ["Data analysis failed to produce automated findings."],
      recommendations: ["Ensure your data is correctly formatted and try again."]
    };
  }
};
