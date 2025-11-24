import { GoogleGenAI } from "@google/genai";
import { Report, Member, TCF, Language } from '../types';

export const analyzeReports = async (
  reports: Report[],
  members: Member[],
  tcfs: TCF[],
  language: Language = 'en'
): Promise<string> => {
  if (!process.env.API_KEY) {
    return language === 'fa' 
      ? "کلید API وجود ندارد. لطفا محیط خود را تنظیم کنید."
      : "API Key is missing. Please configure your environment.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Prepare context data
  const dataContext = reports.map(r => {
    const member = members.find(m => m.id === r.memberId)?.name || 'Unknown';
    const tcf = tcfs.find(t => t.id === r.tcfId)?.name || 'Unknown';
    return `Date: ${new Date(r.timestamp).toLocaleDateString()}, Time: ${r.startTime}, Member: ${member}, TCF: ${tcf}, Description: ${r.description || 'N/A'}`;
  }).join('\n');

  const langInstruction = language === 'fa' 
    ? "Please provide the analysis and response entirely in Persian (Farsi)." 
    : "Provide the response in English.";

  const prompt = `
    You are an intelligent operations analyst. Analyze the following TCF (Task Control Form) report data.
    Identify patterns, workload distribution among members, and any anomalies based on the descriptions and timing.
    Provide a concise summary and 3 key actionable insights.
    ${langInstruction}
    
    Data:
    ${dataContext}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || (language === 'fa' ? "تحلیلی ایجاد نشد." : "No analysis could be generated.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return language === 'fa' ? "خطا در تحلیل گزارش‌ها." : "Failed to analyze reports due to an error.";
  }
};