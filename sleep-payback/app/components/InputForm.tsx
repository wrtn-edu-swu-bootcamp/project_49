"use client";

import { useState, FormEvent } from "react";
import { Sparkles } from "lucide-react";
import type { SleepData } from "../types";

interface InputFormProps {
  data: SleepData;
  onChange: (data: SleepData) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export default function InputForm({ data, onChange, onSubmit, isLoading }: InputFormProps) {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (data.targetSleep < 4 || data.targetSleep > 12) {
      newErrors.targetSleep = "목표 수면 시간은 4-12시간 사이여야 합니다.";
    }
    if (data.actualSleep < 0 || data.actualSleep > 16) {
      newErrors.actualSleep = "실제 수면 시간은 0-16시간 사이여야 합니다.";
    }
    if (data.caffeineIntake < 0 || data.caffeineIntake > 10) {
      newErrors.caffeineIntake = "카페인 섭취량은 0-10잔 사이여야 합니다.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit();
    }
  };

  const updateField = <K extends keyof SleepData>(field: K, value: number) => {
    onChange({ ...data, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="ac-card p-5">
      <div className="text-center mb-4">
        <div className="inline-block bg-gradient-to-r from-green-400 to-emerald-500 border-3 border-green-700 rounded-full px-5 py-1.5 mb-1.5">
          <h3 className="text-xl font-bold text-white" style={{ textShadow: '2px 2px 0px rgba(0,100,0,0.3)' }}>
            📝 수면 정보 입력
          </h3>
        </div>
        <p className="text-amber-700 font-medium text-sm">정확한 정보를 입력해주세요</p>
      </div>

      <div className="space-y-4">
        {/* 목표 수면 시간 - 텍스트 입력 - 컴팩트 */}
        <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
          <label className="block text-base font-bold text-green-700 mb-2 flex items-center gap-2">
            🎯 목표 수면 시간
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="4"
              max="12"
              step="0.5"
              value={data.targetSleep}
              onChange={(e) => updateField("targetSleep", parseFloat(e.target.value) || 0)}
              className="flex-1 bg-white border-2 border-green-400 rounded-lg px-3 py-2 text-xl font-bold text-green-600 text-center focus:outline-none focus:ring-3 focus:ring-green-300 transition-all"
              placeholder="8"
            />
            <span className="text-xl font-bold text-green-600">시간</span>
          </div>
          <p className="text-xs text-green-600 mt-1.5 text-center">⭐ 권장: 7-9시간</p>
          {errors.targetSleep && (
            <p className="text-red-600 text-xs mt-1.5 font-medium">{errors.targetSleep}</p>
          )}
        </div>

        {/* 실제 수면 시간 - 텍스트 입력 - 컴팩트 */}
        <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4">
          <label className="block text-base font-bold text-blue-700 mb-2 flex items-center gap-2">
            😴 어젯밤 수면 시간
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="16"
              step="0.5"
              value={data.actualSleep}
              onChange={(e) => updateField("actualSleep", parseFloat(e.target.value) || 0)}
              className="flex-1 bg-white border-2 border-blue-400 rounded-lg px-3 py-2 text-xl font-bold text-blue-600 text-center focus:outline-none focus:ring-3 focus:ring-blue-300 transition-all"
              placeholder="6"
            />
            <span className="text-xl font-bold text-blue-600">시간</span>
          </div>
          <p className="text-xs text-blue-600 mt-1.5 text-center">💤 정확한 수면 시간을 입력하세요</p>
          {errors.actualSleep && (
            <p className="text-red-600 text-xs mt-1.5 font-medium">{errors.actualSleep}</p>
          )}
        </div>

        {/* 카페인 섭취량 - 슬라이더 - 컴팩트 */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-base font-bold text-amber-700 flex items-center gap-2">
              ☕ 오늘 마신 커피
            </label>
            <div className="bg-white border-2 border-amber-400 rounded-full px-3 py-1">
              <span className="text-2xl font-bold text-amber-600">
                {data.caffeineIntake}
              </span>
              <span className="text-base text-amber-500 ml-1">잔</span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={data.caffeineIntake}
            onChange={(e) => updateField("caffeineIntake", parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-amber-600 mt-1.5 font-medium">
            <span>0잔</span>
            <span>5잔</span>
            <span>10잔</span>
          </div>
          {errors.caffeineIntake && (
            <p className="text-red-600 text-xs mt-1.5 font-medium">{errors.caffeineIntake}</p>
          )}
        </div>

        {/* 현재 피로도 - 슬라이더 - 컴팩트 */}
        <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-base font-bold text-purple-700 flex items-center gap-2">
              💪 현재 컨디션
            </label>
            <div className="bg-white border-2 border-purple-400 rounded-full px-3 py-1">
              <span className="text-lg">
                {data.fatigueLevel === 1 && "😊 최고!"}
                {data.fatigueLevel === 2 && "🙂 좋아요"}
                {data.fatigueLevel === 3 && "😐 보통"}
                {data.fatigueLevel === 4 && "😫 피곤"}
                {data.fatigueLevel === 5 && "🥱 힘들어"}
              </span>
            </div>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={data.fatigueLevel}
            onChange={(e) => updateField("fatigueLevel", parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-purple-600 mt-1.5 font-medium">
            <span>😊</span>
            <span>🙂</span>
            <span>😐</span>
            <span>😫</span>
            <span>🥱</span>
          </div>
        </div>
      </div>

      {/* 제출 버튼 - 컴팩트 */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-5 ac-button py-4 px-4 text-white font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ textShadow: '2px 2px 0px rgba(139, 69, 19, 0.5)' }}
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>분석하는 중...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>✨ AI 분석 받기</span>
          </>
        )}
      </button>
      
      <p className="text-center text-xs text-amber-700 mt-3 font-medium">
        💡 AI가 맞춤 회복 플랜을 제안해드립니다
      </p>
    </form>
  );
}