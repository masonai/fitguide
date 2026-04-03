import { GoogleGenAI } from "@google/genai";
import { Workout } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getWorkoutRecommendation(history: Workout[]): Promise<string> {
  const model = "gemini-3-flash-preview";
  
  const historySummary = history.slice(0, 5).map(w => ({
    date: w.date,
    exercises: w.exercises.map(e => `${e.name} (${e.category})`)
  }));

  const prompt = `
    당신은 전문 피트니스 코치입니다. 사용자의 최근 운동 기록을 바탕으로 다음에 할 운동을 추천해주세요.
    
    최근 기록:
    ${history.length > 0 ? JSON.stringify(historySummary, null, 2) : "기록 없음 (첫 운동 추천 필요)"}
    
    지침:
    1. 최근에 수행한 부위와 휴식이 필요한 부위를 분석하세요.
    2. 오늘 추천하는 운동 테마를 정해주세요 (예: 하체 데이, 등/이두 루틴 등).
    3. 3~5개의 구체적인 운동 종목과 권장 세트/횟수를 제안하세요.
    4. 짧고 강렬한 동기부여 팁을 한 문장으로 포함하세요.
    5. 한국어로 답변하세요.
    6. 마크다운 형식을 사용하여 깔끔하게 출력하세요.
  `;

  try {
    const response = await genAI.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text || "추천을 불러올 수 없습니다.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI 추천을 가져오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
}
