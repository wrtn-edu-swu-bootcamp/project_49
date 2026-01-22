"use client";

interface SleepDebtGaugeProps {
  debt: number;
}

export default function SleepDebtGauge({ debt }: SleepDebtGaugeProps) {
  const normalizedDebt = Math.min(debt, 10);
  const percentage = (normalizedDebt / 10) * 100;

  const getDebtStatus = () => {
    if (debt === 0) return { 
      color: "#10b981", 
      label: "완벽!", 
      emoji: "🎉",
      message: "축하합니다! 수면 부채가 없어요!",
      comment: "완벽한 수면 상태예요!"
    };
    if (debt < 2) return { 
      color: "#3b82f6", 
      label: "양호", 
      emoji: "😊",
      message: "조금만 더 노력하면 완벽해요!",
      comment: "잘 하고 계세요!"
    };
    if (debt < 4) return { 
      color: "#f59e0b", 
      label: "주의", 
      emoji: "😐",
      message: "부채가 쌓이고 있어요.",
      comment: "관리가 필요해 보여요!"
    };
    if (debt < 6) return { 
      color: "#ef4444", 
      label: "경고", 
      emoji: "😫",
      message: "부채가 많이 쌓였네요...",
      comment: "회복 계획이 필요합니다!"
    };
    return { 
      color: "#dc2626", 
      label: "위험", 
      emoji: "🚨",
      message: "수면 부채가 너무 많아요!",
      comment: "즉시 관리가 필요합니다!"
    };
  };

  const status = getDebtStatus();

  return (
    <div className="relative">
      {/* 메인 게이지 - 컴팩트 버전 */}
      <div className="relative w-full h-36 flex items-center justify-center">
        {/* SVG 원형 게이지 */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
          {/* 배경 원 */}
          <circle
            cx="100"
            cy="100"
            r="70"
            fill="none"
            stroke="#d4a574"
            strokeWidth="14"
          />
          {/* 진행 원 */}
          <circle
            cx="100"
            cy="100"
            r="70"
            fill="none"
            stroke={status.color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 70}`}
            strokeDashoffset={`${2 * Math.PI * 70 * (1 - percentage / 100)}`}
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 6px ${status.color})`,
            }}
          />
        </svg>

        {/* 중앙 - 부채 정보 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl mb-1">{status.emoji}</div>
          <div className="text-4xl font-bold text-amber-900 number-animate">
            {debt.toFixed(1)}
            <span className="text-xl text-amber-700 ml-1">시간</span>
          </div>
          <div
            className="mt-1.5 px-3 py-0.5 rounded-full text-xs font-bold border-2"
            style={{
              backgroundColor: `${status.color}20`,
              borderColor: status.color,
              color: status.color,
            }}
          >
            {status.label}
          </div>
        </div>
      </div>

      {/* 상태 설명 - 컴팩트 */}
      <div className="mt-4">
        <div className="bg-white border-2 border-amber-900 rounded-xl p-3 shadow">
          <div className="text-center">
            <p className="text-amber-900 font-medium text-sm mb-0.5">{status.message}</p>
            <p className="text-amber-700 text-xs">{status.comment}</p>
          </div>
        </div>
      </div>

      {/* 회복 예상 - 컴팩트 */}
      {debt > 0 && (
        <div className="mt-3 ac-card p-3 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-amber-700 font-medium mb-0.5">📅 예상 회복 기간</div>
              <div className="text-xl font-bold text-green-600">
                약 {Math.ceil(debt * 4)}일
              </div>
            </div>
            <div className="text-3xl">💰</div>
          </div>
          <div className="mt-1.5 text-xs text-amber-600">
            * 매일 충분히 자면 회복할 수 있어요!
          </div>
        </div>
      )}

      {/* 완벽한 상태 - 컴팩트 */}
      {debt === 0 && (
        <div className="mt-3 ac-card p-3 bg-gradient-to-r from-yellow-100 to-green-100 border-3 border-yellow-400">
          <div className="text-center">
            <div className="text-2xl mb-1">🎊</div>
            <p className="text-base font-bold text-green-700">완벽한 수면 상태!</p>
            <p className="text-xs text-green-600 mt-0.5">이 상태를 계속 유지하세요!</p>
          </div>
        </div>
      )}
    </div>
  );
}