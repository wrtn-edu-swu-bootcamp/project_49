import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetSleep, actualSleep, sleepStart, sleepEnd, caffeineIntake, fatigueLevel, sleepDebt } = body;

    // 입력 검증
    if (
      typeof targetSleep !== "number" ||
      typeof actualSleep !== "number" ||
      typeof caffeineIntake !== "number" ||
      typeof fatigueLevel !== "number"
    ) {
      return NextResponse.json(
        { error: "유효하지 않은 입력 데이터입니다." },
        { status: 400 }
      );
    }

    // API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OpenAI API 키가 설정되지 않았습니다. 더미 데이터를 반환합니다.");
      return NextResponse.json(generateDummyReport(body));
    }

    // OpenAI API 호출
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `당신은 수면 전문가입니다. 사용자의 수면 데이터를 분석하여 컨디션 회복을 위한 맞춤형 조언을 제공합니다.
          
응답은 반드시 다음 JSON 형식을 따라야 합니다:
{
  "focusScore": 숫자 (0-100),
  "napGuide": {
    "time": "HH:MM 형식",
    "duration": 숫자 (분)
  },
  "caffeineStopTime": "HH:MM 형식",
  "bedtime": "HH:MM 형식",
  "analysis": "상세한 분석 텍스트 (2-3문장)",
  "recommendations": ["실천 항목 1", "실천 항목 2", "실천 항목 3"]
}

과학적 근거:
- 1시간의 수면 부채 회복에는 약 4일 소요
- 카페인 반감기는 5-6시간
- 효과적인 낮잠은 15-20분
- 최적 낮잠 시간은 오후 2-3시`,
        },
        {
          role: "user",
          content: `다음 데이터를 분석해주세요:
- 목표 수면 시간: ${targetSleep}시간
- 실제 수면 시간: ${actualSleep}시간 (${sleepStart} ~ ${sleepEnd})
- 수면 부채: ${sleepDebt}시간
- 오늘 카페인 섭취: ${caffeineIntake}잔
- 현재 피로도: ${fatigueLevel}/5

오늘의 집중력 예상, 전략적 낮잠 가이드, 카페인 중단 시간, 권장 취침 시간, 분석 및 실천 목록을 JSON 형식으로 제공해주세요.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("AI 응답이 비어있습니다.");
    }

    const report = JSON.parse(content);

    return NextResponse.json(report);
  } catch (error) {
    console.error("AI 분석 오류:", error);
    
    // 오류 발생 시 더미 데이터 반환
    const body = await request.json();
    return NextResponse.json(generateDummyReport(body));
  }
}

// 더미 리포트 생성 함수 (API 키가 없거나 오류 시 사용)
function generateDummyReport(data: any) {
  const { targetSleep, actualSleep, caffeineIntake, fatigueLevel, sleepDebt } = data;

  // 집중력 점수 계산 (간단한 로직)
  let focusScore = 100;
  focusScore -= sleepDebt * 10; // 수면 부채 1시간당 -10점
  focusScore -= caffeineIntake * 3; // 카페인 1잔당 -3점
  focusScore -= (fatigueLevel - 1) * 5; // 피로도 1당 -5점
  focusScore = Math.max(20, Math.min(100, focusScore));

  // 낮잠 가이드
  const napTime = sleepDebt > 3 ? "14:00" : sleepDebt > 1 ? "15:00" : "권장하지 않음";
  const napDuration = sleepDebt > 3 ? 20 : sleepDebt > 1 ? 15 : 0;

  // 카페인 중단 시간 (취침 8시간 전)
  const bedtimeHour = 22 - Math.floor(sleepDebt / 2); // 부채가 많으면 더 일찍 취침
  const caffeineStopHour = bedtimeHour - 8;
  const caffeineStopTime = `${String(caffeineStopHour).padStart(2, "0")}:00`;

  // 권장 취침 시간
  const bedtime = `${String(bedtimeHour).padStart(2, "0")}:00`;

  // 분석 텍스트
  let analysis = "";
  if (sleepDebt === 0) {
    analysis = "완벽한 수면 상태입니다! 현재의 수면 패턴을 계속 유지하세요.";
  } else if (sleepDebt < 2) {
    analysis = `${sleepDebt.toFixed(1)}시간의 수면 부채가 있습니다. 오늘 밤 충분한 수면으로 쉽게 회복할 수 있습니다.`;
  } else if (sleepDebt < 4) {
    analysis = `${sleepDebt.toFixed(1)}시간의 수면 부채로 인해 오늘 집중력이 저하될 수 있습니다. 전략적 낮잠과 일찍 취침하는 것이 중요합니다.`;
  } else {
    analysis = `${sleepDebt.toFixed(1)}시간의 심각한 수면 부채입니다. 회복에 약 ${Math.ceil(sleepDebt * 4)}일이 소요될 수 있으니, 즉시 수면 패턴 개선이 필요합니다.`;
  }

  // 추천 사항
  const recommendations = [];
  
  if (sleepDebt > 0) {
    recommendations.push(`오늘 밤 ${bedtime}까지 잠자리에 들어 ${targetSleep}시간 이상 수면`);
  }
  
  if (napDuration > 0) {
    recommendations.push(`${napTime}에 ${napDuration}분간 전략적 낮잠`);
  }
  
  if (caffeineIntake > 0) {
    recommendations.push(`${caffeineStopTime} 이후 카페인 섭취 중단`);
  }
  
  recommendations.push("어두운 환경에서 수면 (암막 커튼 사용)");
  recommendations.push("취침 1시간 전 전자기기 사용 중단");
  
  if (fatigueLevel >= 4) {
    recommendations.push("짧은 산책이나 스트레칭으로 혈액 순환 개선");
  }

  return {
    focusScore: Math.round(focusScore),
    napGuide: {
      time: napTime,
      duration: napDuration,
    },
    caffeineStopTime,
    bedtime,
    analysis,
    recommendations: recommendations.slice(0, 5),
  };
}
