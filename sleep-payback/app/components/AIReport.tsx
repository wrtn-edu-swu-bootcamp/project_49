"use client";

import { Brain, Clock, Coffee, Moon, AlertCircle, CheckCircle } from "lucide-react";
import type { AIReportData } from "../types";

interface AIReportProps {
  report: AIReportData | null;
  isLoading: boolean;
}

export default function AIReport({ report, isLoading }: AIReportProps) {
  if (isLoading) {
    return (
      <div className="ac-card p-6 md:p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 bg-purple-100 border-3 border-purple-400 rounded-full px-6 py-3 mb-4">
            <Brain className="w-6 h-6 text-purple-600 animate-pulse" />
            <span className="text-lg font-bold text-purple-700">AI가 계산 중...</span>
          </div>
          <div className="text-4xl mb-2">🦝</div>
          <p className="text-amber-700 font-medium">잠시만 기다려주세요!</p>
        </div>

        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-24 rounded-xl border-2 border-amber-200"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="ac-card p-6 md:p-8">
        <div className="text-center mb-6">
          <div className="inline-block bg-gradient-to-r from-purple-400 to-pink-400 border-3 border-purple-700 rounded-full px-6 py-3 mb-2">
            <h3 className="text-2xl font-bold text-white" style={{ textShadow: '2px 2px 0px rgba(100,0,100,0.3)' }}>
              🤖 AI 분석 결과
            </h3>
          </div>
          <p className="text-amber-700 font-medium">결과가 여기에 나타나요</p>
        </div>

        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-6xl mb-4">💤</div>
          <div className="bg-white border-3 border-amber-900 rounded-2xl p-6 max-w-sm">
            <p className="text-amber-900 font-medium text-center mb-2">
              왼쪽에서 정보를 입력하고
            </p>
            <p className="text-green-600 font-bold text-center text-lg">
              AI 분석 받기 버튼을 눌러보세요!
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getFocusInfo = (score: number) => {
    if (score >= 80) return { 
      color: "#10b981", 
      emoji: "🌟",
      message: "오늘 집중력 최고!",
      nookComment: "완벽해요!"
    };
    if (score >= 60) return { 
      color: "#3b82f6", 
      emoji: "💪",
      message: "업무하기 좋아요!",
      nookComment: "잘 하고 있어요!"
    };
    if (score >= 40) return { 
      color: "#f59e0b", 
      emoji: "😐",
      message: "집중이 조금 어려워요",
      nookComment: "조심하세요!"
    };
    return { 
      color: "#ef4444", 
      emoji: "😴",
      message: "많이 피곤하시겠어요",
      nookComment: "쉬어야 해요!"
    };
  };

  const focusInfo = getFocusInfo(report.focusScore);

  return (
    <div className="ac-card p-6 md:p-8">
      <div className="text-center mb-6">
        <div className="inline-block bg-gradient-to-r from-purple-400 to-pink-400 border-3 border-purple-700 rounded-full px-6 py-3 mb-2">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2 justify-center" style={{ textShadow: '2px 2px 0px rgba(100,0,100,0.3)' }}>
            <Brain className="w-6 h-6" />
            AI 분석 결과
          </h3>
        </div>
        <p className="text-amber-700 font-medium">💡 맞춤 회복 플랜</p>
      </div>

      <div className="space-y-4">
        {/* 집중력 - 크게 강조 */}
        <div className="bg-gradient-to-br from-yellow-100 to-green-100 border-3 border-green-400 rounded-2xl p-6">
          <div className="text-center">
            <div className="text-sm text-green-700 font-bold mb-2">⚡ 오늘의 컨디션</div>
            <div className="text-7xl mb-3">{focusInfo.emoji}</div>
            <div className="text-6xl font-bold mb-2" style={{ color: focusInfo.color }}>
              {report.focusScore}
              <span className="text-3xl">/100</span>
            </div>
            <p className="text-lg font-bold text-amber-900 mb-2">{focusInfo.message}</p>
            <div className="bg-white border-2 border-amber-900 rounded-full px-4 py-2 inline-block">
              <p className="text-sm text-amber-800">🦝 &quot;{focusInfo.nookComment}&quot;</p>
            </div>
          </div>
          <div className="mt-4 w-full bg-white border-2 border-gray-300 rounded-full h-4">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${report.focusScore}%`,
                backgroundColor: focusInfo.color,
              }}
            ></div>
          </div>
        </div>

        {/* 실천 항목들 - 동물의숲 카드 스타일 */}
        <div className="grid gap-4">
          {/* 낮잠 */}
          <div className="bg-blue-50 border-3 border-blue-300 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-400 border-3 border-blue-600 rounded-full flex items-center justify-center text-2xl">
                💤
              </div>
              <div className="flex-1">
                <div className="text-xs text-blue-600 font-bold">전략적 낮잠</div>
                <div className="text-sm text-blue-500">잠깐 자면 회복!</div>
              </div>
            </div>
            <div className="bg-white border-2 border-blue-400 rounded-xl p-3">
              <div className="text-3xl font-bold text-blue-600">
                {report.napGuide.time}
                <span className="text-lg text-blue-500"> 시에 </span>
                {report.napGuide.duration}
                <span className="text-lg text-blue-500">분</span>
              </div>
            </div>
          </div>

          {/* 카페인 */}
          <div className="bg-amber-50 border-3 border-amber-300 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-amber-400 border-3 border-amber-600 rounded-full flex items-center justify-center text-2xl">
                ☕
              </div>
              <div className="flex-1">
                <div className="text-xs text-amber-600 font-bold">카페인 중단</div>
                <div className="text-sm text-amber-500">이 시간 이후 NO!</div>
              </div>
            </div>
            <div className="bg-white border-2 border-amber-400 rounded-xl p-3">
              <div className="text-3xl font-bold text-amber-600">
                {report.caffeineStopTime}
                <span className="text-lg text-amber-500"> 이후</span>
              </div>
            </div>
          </div>

          {/* 취침 시간 */}
          <div className="bg-indigo-50 border-3 border-indigo-300 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-indigo-400 border-3 border-indigo-600 rounded-full flex items-center justify-center text-2xl">
                🌙
              </div>
              <div className="flex-1">
                <div className="text-xs text-indigo-600 font-bold">오늘 밤 취침</div>
                <div className="text-sm text-indigo-500">빚 갚으러 가요!</div>
              </div>
            </div>
            <div className="bg-white border-2 border-indigo-400 rounded-xl p-3">
              <div className="text-3xl font-bold text-indigo-600">
                {report.bedtime}
                <span className="text-lg text-indigo-500"> 까지</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI 분석 */}
        <div className="bg-white border-3 border-amber-900 rounded-2xl p-5">
          <h4 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI 분석
          </h4>
          <p className="text-amber-800 leading-relaxed">{report.analysis}</p>
        </div>

        {/* 실천 목록 */}
        {report.recommendations.length > 0 && (
          <div className="bg-green-50 border-3 border-green-300 rounded-2xl p-5">
            <h4 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              ✅ 오늘의 실천 항목
            </h4>
            <ul className="space-y-3">
              {report.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-3 bg-white border-2 border-green-300 p-3 rounded-xl">
                  <div className="w-7 h-7 bg-green-500 border-2 border-green-700 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <span className="flex-1 text-green-900 font-medium">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 응원 메시지 */}
        <div className="bg-gradient-to-r from-yellow-100 to-amber-100 border-3 border-yellow-400 rounded-2xl p-4 text-center">
          <p className="text-lg font-bold text-amber-900">
            💪 꾸준히 관리하면 건강한 수면 습관을 만들 수 있어요!
          </p>
        </div>
      </div>
    </div>
  );
}