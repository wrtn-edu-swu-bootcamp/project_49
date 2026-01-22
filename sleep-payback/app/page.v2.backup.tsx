"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Sparkles, Activity, Coffee, Clock, Bed, Bell, Check, Edit2, Trash2, X, Calendar, ChevronLeft, ChevronRight, TrendingUp, Download, Upload, Target, Flame, Lightbulb } from "lucide-react";

interface SleepData {
  targetSleep: number;
  actualSleep: number;
  caffeineIntake: number;
  fatigueLevel: number;
}

interface AIReport {
  focusScore: number;
  napGuide: { time: string; duration: number };
  caffeineStopTime: string;
  bedtime: string;
  analysis: string;
  recommendations: string[];
}

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

interface SleepHistory {
  date: string;
  targetSleep: number;
  actualSleep: number;
  debt: number;
  caffeineIntake: number;
  fatigueLevel: number;
}

export default function Home() {
  // const { data: session, status: authStatus } = useSession();
  // const router = useRouter();
  const [theme, setTheme] = useState<"day" | "night">("day");
  const [data, setData] = useState<SleepData>({
    targetSleep: 8,
    actualSleep: 6,
    caffeineIntake: 2,
    fatigueLevel: 3,
  });
  const [report, setReport] = useState<AIReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [alarmSet, setAlarmSet] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [history, setHistory] = useState<SleepHistory[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [chartPeriod, setChartPeriod] = useState<7 | 30>(7);
  const [bedtimeAlarmSet, setBedtimeAlarmSet] = useState(false);
  const [bedtimeAlarmTime, setBedtimeAlarmTime] = useState("22:00");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    // Load todos from localStorage
    const saved = localStorage.getItem("sleep-todos");
    if (saved) {
      setTodos(JSON.parse(saved));
    }
    // Load history from localStorage
    const savedHistory = localStorage.getItem("sleep-history");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
    // Load bedtime alarm settings
    const savedAlarm = localStorage.getItem("bedtime-alarm");
    if (savedAlarm) {
      const alarmData = JSON.parse(savedAlarm);
      setBedtimeAlarmSet(alarmData.enabled);
      setBedtimeAlarmTime(alarmData.time);
    }
  }, [theme]);

  // Load data when selected date changes
  useEffect(() => {
    const dayHistory = getHistoryForDate(selectedDate);
    if (dayHistory) {
      setData({
        targetSleep: dayHistory.targetSleep,
        actualSleep: dayHistory.actualSleep,
        caffeineIntake: dayHistory.caffeineIntake,
        fatigueLevel: dayHistory.fatigueLevel,
      });
    }
  }, [selectedDate]);

  useEffect(() => {
    // Save todos to localStorage
    if (todos.length > 0) {
      localStorage.setItem("sleep-todos", JSON.stringify(todos));
    }
  }, [todos]);

  const debt = Math.max(0, data.targetSleep - data.actualSleep);

  const getDebtStatus = () => {
    if (debt === 0) return { label: "완벽", color: "success" };
    if (debt < 2) return { label: "양호", color: "success" };
    if (debt < 4) return { label: "주의", color: "warning" };
    return { label: "위험", color: "danger" };
  };

  const analyze = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, sleepDebt: debt }),
      });
      if (res.ok) {
        const result = await res.json();
        setReport(result);
        // Convert recommendations to todos
        const newTodos = result.recommendations.map((rec: string) => ({
          id: Date.now().toString() + Math.random(),
          text: rec,
          completed: false,
        }));
        setTodos(newTodos);
        
        // Save to history with selected date
        const newHistory = {
          date: selectedDate,
          targetSleep: data.targetSleep,
          actualSleep: data.actualSleep,
          debt: debt,
          caffeineIntake: data.caffeineIntake,
          fatigueLevel: data.fatigueLevel,
        };
        
        const updatedHistory = [...history.filter(h => h.date !== selectedDate), newHistory];
        setHistory(updatedHistory);
        localStorage.setItem("sleep-history", JSON.stringify(updatedHistory));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const setAlarm = () => {
    if (!report) return;
    
    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          setAlarmSet(true);
          alert(`알람이 설정되었습니다!\n${report.caffeineStopTime}에 알림을 드릴게요 ☕`);
          
          // Parse time and set alarm
          const timeMatch = report.caffeineStopTime.match(/(\d+)시/);
          if (timeMatch) {
            const targetHour = parseInt(timeMatch[1]);
            const now = new Date();
            const alarmTime = new Date();
            alarmTime.setHours(targetHour, 0, 0, 0);
            
            if (alarmTime <= now) {
              alarmTime.setDate(alarmTime.getDate() + 1);
            }
            
            const timeUntilAlarm = alarmTime.getTime() - now.getTime();
            
            setTimeout(() => {
              new Notification("카페인 중단 시간", {
                body: `${report.caffeineStopTime} 이후에는 카페인을 피하세요!`,
                icon: "/favicon.ico",
              });
            }, timeUntilAlarm);
          }
        } else {
          alert("알림 권한이 필요합니다.");
        }
      });
    } else {
      alert("이 브라우저는 알림을 지원하지 않습니다.");
    }
  };

  const toggleBedtimeAlarm = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          const newState = !bedtimeAlarmSet;
          setBedtimeAlarmSet(newState);
          
          const alarmData = {
            enabled: newState,
            time: bedtimeAlarmTime,
          };
          localStorage.setItem("bedtime-alarm", JSON.stringify(alarmData));
          
          if (newState) {
            alert(`매일 ${bedtimeAlarmTime}에 취침 알림을 보내드릴게요! 🌙`);
            scheduleDailyBedtimeAlarm();
          } else {
            alert("취침 알림이 해제되었습니다.");
          }
        } else {
          alert("알림 권한이 필요합니다.");
        }
      });
    } else {
      alert("이 브라우저는 알림을 지원하지 않습니다.");
    }
  };

  const scheduleDailyBedtimeAlarm = () => {
    const [hours, minutes] = bedtimeAlarmTime.split(':').map(Number);
    const now = new Date();
    const alarmTime = new Date();
    alarmTime.setHours(hours, minutes, 0, 0);
    
    if (alarmTime <= now) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }
    
    const timeUntilAlarm = alarmTime.getTime() - now.getTime();
    
    setTimeout(() => {
      if (bedtimeAlarmSet) {
        new Notification("취침 시간", {
          body: `지금 자면 목표 수면 시간을 달성할 수 있어요!`,
          icon: "/favicon.ico",
        });
        // Schedule next day
        scheduleDailyBedtimeAlarm();
      }
    }, timeUntilAlarm);
  };

  const exportData = () => {
    const data = {
      history,
      todos,
      bedtimeAlarm: { enabled: bedtimeAlarmSet, time: bedtimeAlarmTime },
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sleep-debt-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('데이터를 내보냈습니다! 💾');
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.history) {
          setHistory(data.history);
          localStorage.setItem("sleep-history", JSON.stringify(data.history));
        }
        
        if (data.todos) {
          setTodos(data.todos);
          localStorage.setItem("sleep-todos", JSON.stringify(data.todos));
        }
        
        if (data.bedtimeAlarm) {
          setBedtimeAlarmSet(data.bedtimeAlarm.enabled);
          setBedtimeAlarmTime(data.bedtimeAlarm.time);
          localStorage.setItem("bedtime-alarm", JSON.stringify(data.bedtimeAlarm));
        }
        
        alert('데이터를 가져왔습니다! ✅');
      } catch (error) {
        alert('파일을 읽을 수 없습니다. 올바른 백업 파일인지 확인해주세요.');
      }
    };
    reader.readAsText(file);
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const startEdit = (id: string, text: string) => {
    setEditingId(id);
    setEditText(text);
  };

  const saveEdit = () => {
    if (editingId) {
      setTodos(todos.map(t => t.id === editingId ? { ...t, text: editText } : t));
      setEditingId(null);
      setEditText("");
    }
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const deleteHistoryDate = (dateStr: string) => {
    const updatedHistory = history.filter(h => h.date !== dateStr);
    setHistory(updatedHistory);
    localStorage.setItem("sleep-history", JSON.stringify(updatedHistory));
  };

  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const getHistoryForDate = (dateStr: string) => {
    return history.find(h => h.date === dateStr);
  };

  const getDebtColor = (debt: number) => {
    if (debt === 0) return "var(--success)";
    if (debt < 2) return "var(--success)";
    if (debt < 4) return "var(--warning)";
    return "var(--danger)";
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const selectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setShowCalendar(false);
  };

  const formatSelectedDate = () => {
    const date = new Date(selectedDate + 'T00:00:00');
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate === today) return "오늘";
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}년 ${month}월 ${day}일`;
  };

  const getMonthStats = () => {
    const monthHistory = history.filter(h => {
      const historyDate = new Date(h.date);
      return historyDate.getMonth() === currentMonth.getMonth() && 
             historyDate.getFullYear() === currentMonth.getFullYear();
    });

    if (monthHistory.length === 0) return null;

    const totalDebt = monthHistory.reduce((sum, h) => sum + h.debt, 0);
    const avgDebt = totalDebt / monthHistory.length;
    const avgActual = monthHistory.reduce((sum, h) => sum + h.actualSleep, 0) / monthHistory.length;
    const avgTarget = monthHistory.reduce((sum, h) => sum + h.targetSleep, 0) / monthHistory.length;
    const goodDays = monthHistory.filter(h => h.debt < 2).length;
    const badDays = monthHistory.filter(h => h.debt >= 4).length;

    return {
      daysRecorded: monthHistory.length,
      avgDebt: avgDebt.toFixed(1),
      avgActual: avgActual.toFixed(1),
      avgTarget: avgTarget.toFixed(1),
      totalDebt: totalDebt.toFixed(1),
      goodDays,
      badDays,
    };
  };

  const getChartData = () => {
    const days = chartPeriod;
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayHistory = getHistoryForDate(dateStr);
      
      data.push({
        date: dateStr,
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        debt: dayHistory?.debt || 0,
        actual: dayHistory?.actualSleep || 0,
        target: dayHistory?.targetSleep || 8,
      });
    }
    
    return data;
  };

  const getStreak = () => {
    if (history.length === 0) return 0;
    
    const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < sortedHistory.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];
      
      const dayData = sortedHistory.find(h => h.date === expectedDateStr);
      if (dayData && dayData.debt < 2) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const getGoalProgress = () => {
    const last7Days = chartData.slice(-7);
    const goodDays = last7Days.filter(d => d.debt < 2).length;
    return { current: goodDays, target: 7 };
  };

  const getInsights = () => {
    if (history.length < 7) return [];
    
    const insights = [];
    const last7Days = history.slice(-7);
    
    // 요일별 패턴
    const dayOfWeekData: { [key: number]: number[] } = {};
    history.forEach(h => {
      const dayOfWeek = new Date(h.date).getDay();
      if (!dayOfWeekData[dayOfWeek]) dayOfWeekData[dayOfWeek] = [];
      dayOfWeekData[dayOfWeek].push(h.debt);
    });
    
    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    let worstDay = 0;
    let worstAvg = 0;
    
    Object.entries(dayOfWeekData).forEach(([day, debts]) => {
      const avg = debts.reduce((a, b) => a + b, 0) / debts.length;
      if (avg > worstAvg) {
        worstAvg = avg;
        worstDay = parseInt(day);
      }
    });
    
    if (worstAvg > 2) {
      insights.push({
        icon: "📅",
        title: "요일별 패턴",
        text: `${dayNames[worstDay]}에 평균 ${worstAvg.toFixed(1)}시간의 수면 부채가 발생해요. 이 날은 특별히 신경 써보세요!`,
      });
    }
    
    // 트렌드
    const recentAvg = last7Days.reduce((sum, h) => sum + h.debt, 0) / last7Days.length;
    const olderHistory = history.slice(-14, -7);
    if (olderHistory.length >= 7) {
      const olderAvg = olderHistory.reduce((sum, h) => sum + h.debt, 0) / olderHistory.length;
      const diff = recentAvg - olderAvg;
      
      if (diff > 0.5) {
        insights.push({
          icon: "📈",
          title: "상승 추세",
          text: `최근 7일간 수면 부채가 평균 ${diff.toFixed(1)}시간 증가했어요. 조금 더 일찍 잠자리에 드는 건 어떨까요?`,
        });
      } else if (diff < -0.5) {
        insights.push({
          icon: "📉",
          title: "개선 중!",
          text: `최근 7일간 수면 부채가 평균 ${Math.abs(diff).toFixed(1)}시간 감소했어요. 계속 잘하고 계세요! 💪`,
        });
      }
    }
    
    // 카페인 패턴
    const highCaffeineDays = history.filter(h => h.caffeineIntake > 3);
    if (highCaffeineDays.length > 0) {
      const avgDebtWithCaffeine = highCaffeineDays.reduce((sum, h) => sum + h.debt, 0) / highCaffeineDays.length;
      const lowCaffeineDays = history.filter(h => h.caffeineIntake <= 3);
      if (lowCaffeineDays.length > 0) {
        const avgDebtWithoutCaffeine = lowCaffeineDays.reduce((sum, h) => sum + h.debt, 0) / lowCaffeineDays.length;
        if (avgDebtWithCaffeine > avgDebtWithoutCaffeine + 0.5) {
          insights.push({
            icon: "☕",
            title: "카페인 영향",
            text: `카페인 섭취가 많은 날 수면 부채가 ${(avgDebtWithCaffeine - avgDebtWithoutCaffeine).toFixed(1)}시간 더 많아요. 카페인 조절을 시도해보세요!`,
          });
        }
      }
    }
    
    // 목표 근접
    if (goalProgress.current >= 5) {
      insights.push({
        icon: "🎯",
        title: "목표 근접!",
        text: `이번 주 ${goalProgress.current}일 달성! ${7 - goalProgress.current}일만 더 하면 주간 목표 완료예요!`,
      });
    }
    
    return insights;
  };

  const status = getDebtStatus();
  const monthStats = getMonthStats();
  const chartData = getChartData();
  const streak = getStreak();
  const goalProgress = getGoalProgress();
  const insights = getInsights();

  // if (authStatus === "loading") {
  //   return (
  //     <div style={{
  //       minHeight: "100vh",
  //       display: "flex",
  //       alignItems: "center",
  //       justifyContent: "center",
  //       background: "var(--bg-primary)",
  //     }}>
  //       <div style={{ textAlign: "center" }}>
  //         <div style={{ width: "48px", height: "48px", border: "4px solid var(--border)", borderTop: "4px solid var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }}></div>
  //         <p style={{ color: "var(--text-secondary)" }}>로딩 중...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // if (!session) {
  //   return null;
  // }

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "60px" }}>
      {/* Header */}
      <header style={{
        position: "sticky",
        top: 0,
        background: "var(--bg-primary)",
        borderBottom: "1px solid var(--border)",
        padding: "16px 0",
        zIndex: 100,
        backdropFilter: "blur(10px)",
        backgroundColor: theme === "day" ? "rgba(255, 255, 255, 0.9)" : "rgba(15, 23, 42, 0.9)",
      }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "4px", letterSpacing: "-0.5px" }}>수면 관리</h1>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "500" }}>Sleep Debt Manager</p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                background: showCalendar ? "var(--accent)" : "var(--bg-secondary)",
                color: showCalendar ? "white" : "var(--text-primary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!showCalendar) {
                  e.currentTarget.style.background = "var(--accent-light)";
                  e.currentTarget.style.borderColor = "var(--accent)";
                }
              }}
              onMouseLeave={(e) => {
                if (!showCalendar) {
                  e.currentTarget.style.background = "var(--bg-secondary)";
                  e.currentTarget.style.borderColor = "var(--border)";
                }
              }}
              title="캘린더"
            >
              <Calendar size={18} />
            </button>
            <div style={{ position: "relative" }}>
              <button
                onClick={() => document.getElementById('file-import')?.click()}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  background: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--accent-light)";
                  e.currentTarget.style.borderColor = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--bg-secondary)";
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
                title="데이터 가져오기"
              >
                <Upload size={18} />
              </button>
              <input
                id="file-import"
                type="file"
                accept=".json"
                onChange={importData}
                style={{ display: "none" }}
              />
            </div>
            <button
              onClick={exportData}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                background: "var(--bg-secondary)",
                color: "var(--text-primary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--accent-light)";
                e.currentTarget.style.borderColor = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--bg-secondary)";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
              title="데이터 내보내기"
            >
              <Download size={18} />
            </button>
            <button
              onClick={() => setTheme(theme === "day" ? "night" : "day")}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                background: "var(--bg-secondary)",
                color: "var(--text-primary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--accent-light)";
                e.currentTarget.style.borderColor = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--bg-secondary)";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
              title={theme === "day" ? "다크 모드" : "라이트 모드"}
            >
              {theme === "day" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </div>
      </header>

      <div className="container" style={{ paddingTop: "40px" }}>
        {/* Calendar Modal */}
        {showCalendar && (
          <div className="card fade-in" style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "600" }}>수면 기록</h2>
              <button
                onClick={() => setShowCalendar(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Month Navigation */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <button
                onClick={prevMonth}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px",
                }}
              >
                <ChevronLeft size={20} />
              </button>
              <div style={{ fontSize: "16px", fontWeight: "600" }}>
                {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
              </div>
              <button
                onClick={nextMonth}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px",
                }}
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Calendar Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "20px" }}>
              {["일", "월", "화", "수", "목", "금", "토"].map(day => (
                <div key={day} style={{
                  textAlign: "center",
                  fontSize: "12px",
                  fontWeight: "600",
                  padding: "8px 0",
                  color: "var(--text-secondary)",
                }}>
                  {day}
                </div>
              ))}
              
              {(() => {
                const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
                const days = [];
                
                // Empty cells before first day
                for (let i = 0; i < startingDayOfWeek; i++) {
                  days.push(<div key={`empty-${i}`} />);
                }
                
                // Days of month
                for (let day = 1; day <= daysInMonth; day++) {
                  const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayHistory = getHistoryForDate(dateStr);
                  const isToday = dateStr === new Date().toISOString().split('T')[0];
                  
                  days.push(
                    <div
                      key={day}
                      style={{
                        aspectRatio: "1",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "8px",
                        background: dateStr === selectedDate ? "var(--accent)" : dayHistory ? "var(--bg-primary)" : "transparent",
                        border: isToday ? "2px solid var(--accent)" : dayHistory ? "1px solid var(--border)" : "none",
                        position: "relative",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onClick={() => selectDate(dateStr)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (dayHistory && window.confirm(`${dateStr} 기록을 삭제하시겠습니까?`)) {
                          deleteHistoryDate(dateStr);
                        }
                      }}
                      onMouseEnter={(e) => {
                        if (dateStr !== selectedDate) {
                          e.currentTarget.style.background = "var(--bg-primary)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (dateStr !== selectedDate) {
                          e.currentTarget.style.background = dayHistory ? "var(--bg-primary)" : "transparent";
                        }
                      }}
                      title={dayHistory ? `우클릭으로 삭제` : "클릭하여 선택"}
                    >
                      <div style={{
                        fontSize: "13px",
                        fontWeight: isToday ? "700" : "500",
                        color: dateStr === selectedDate ? "white" : "var(--text-primary)",
                      }}>
                        {day}
                      </div>
                      {dayHistory && (
                        <div style={{
                          fontSize: "10px",
                          fontWeight: "700",
                          color: dateStr === selectedDate ? "white" : getDebtColor(dayHistory.debt),
                          marginTop: "2px",
                        }}>
                          {dayHistory.debt.toFixed(1)}h
                        </div>
                      )}
                    </div>
                  );
                }
                
                return days;
              })()}
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: "16px", fontSize: "12px", justifyContent: "center", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "4px", background: "var(--success)" }} />
                <span>양호</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "4px", background: "var(--warning)" }} />
                <span>주의</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "4px", background: "var(--danger)" }} />
                <span>위험</span>
              </div>
            </div>

            <div style={{
              padding: "12px",
              background: "var(--bg-primary)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              fontSize: "12px",
              color: "var(--text-secondary)",
              textAlign: "center",
            }}>
              💡 날짜를 클릭하면 해당 날짜의 데이터를 수정할 수 있어요<br/>
              우클릭하면 기록을 삭제할 수 있어요
            </div>

            {/* Monthly Report */}
            {monthStats && (
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px" }}>이번 달 통계</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
                  <div style={{
                    padding: "12px",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                  }}>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>기록 일수</div>
                    <div style={{ fontSize: "20px", fontWeight: "700", color: "var(--accent)" }}>{monthStats.daysRecorded}일</div>
                  </div>
                  <div style={{
                    padding: "12px",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                  }}>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>평균 부채</div>
                    <div style={{ fontSize: "20px", fontWeight: "700", color: "var(--danger)" }}>{monthStats.avgDebt}h</div>
                  </div>
                  <div style={{
                    padding: "12px",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                  }}>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>평균 수면</div>
                    <div style={{ fontSize: "20px", fontWeight: "700" }}>{monthStats.avgActual}h</div>
                  </div>
                  <div style={{
                    padding: "12px",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                  }}>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>총 부채</div>
                    <div style={{ fontSize: "20px", fontWeight: "700", color: "var(--warning)" }}>{monthStats.totalDebt}h</div>
                  </div>
                </div>
                <div style={{ marginTop: "12px", display: "flex", gap: "10px", fontSize: "12px" }}>
                  <div style={{
                    flex: 1,
                    padding: "10px",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    textAlign: "center",
                  }}>
                    <div style={{ color: "var(--success)", fontWeight: "700", fontSize: "16px" }}>{monthStats.goodDays}</div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "11px" }}>양호한 날</div>
                  </div>
                  <div style={{
                    flex: 1,
                    padding: "10px",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    textAlign: "center",
                  }}>
                    <div style={{ color: "var(--danger)", fontWeight: "700", fontSize: "16px" }}>{monthStats.badDays}</div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "11px" }}>위험한 날</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Desktop: 2-column layout */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "24px",
        }}
        className="desktop-layout">
          {/* Left Column: Input */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Debt Display with Circular Gauge */}
            <div className="card" style={{ textAlign: "center", padding: "32px 24px" }}>
              {/* Status Badge & Goal in One Line */}
              <div style={{ 
                display: "flex", 
                gap: "8px", 
                marginBottom: "20px", 
                justifyContent: "center",
                flexWrap: "wrap",
                alignItems: "center",
              }}>
                <span className={`badge badge-${status.color}`} style={{ fontSize: "12px", fontWeight: "600" }}>
                  {status.label}
                </span>
                {streak > 0 && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 10px",
                    background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "white",
                  }}>
                    <Flame size={12} />
                    {streak}일 연속
                  </div>
                )}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 10px",
                  background: "var(--accent-light)",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "var(--accent)",
                }}>
                  <Target size={12} />
                  {goalProgress.current}/7일
                </div>
              </div>
              
              {/* Circular Gauge */}
              <div style={{ position: "relative", width: "180px", height: "180px", margin: "0 auto 16px" }}>
                <svg viewBox="0 0 200 200" style={{ transform: "rotate(-90deg)" }}>
                  {/* Background Circle */}
                  <circle
                    cx="100"
                    cy="100"
                    r="85"
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="12"
                  />
                  {/* Progress Circle */}
                  <circle
                    cx="100"
                    cy="100"
                    r="85"
                    fill="none"
                    stroke={status.color === "success" ? "var(--success)" : status.color === "warning" ? "var(--warning)" : "var(--danger)"}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(Math.min(debt, 10) / 10) * 534} 534`}
                    style={{ transition: "stroke-dasharray 1s ease" }}
                  />
                </svg>
                {/* Center Text */}
                <div style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                }}>
                  <div style={{
                    fontSize: "48px",
                    fontWeight: "700",
                    color: "var(--accent)",
                    lineHeight: 1,
                  }}>
                    {debt.toFixed(1)}
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
                    시간
                  </div>
                </div>
              </div>
              
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "16px" }}>현재 수면 부채</p>
              
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", fontSize: "13px" }}>
                <div>
                  <div style={{ color: "var(--text-secondary)", marginBottom: "4px" }}>목표</div>
                  <div style={{ fontSize: "18px", fontWeight: "600" }}>{data.targetSleep}h</div>
                </div>
                <div style={{ fontSize: "20px", color: "var(--text-secondary)" }}>−</div>
                <div>
                  <div style={{ color: "var(--text-secondary)", marginBottom: "4px" }}>실제</div>
                  <div style={{ fontSize: "18px", fontWeight: "600" }}>{data.actualSleep}h</div>
                </div>
                <div style={{ fontSize: "20px", color: "var(--text-secondary)" }}>=</div>
                <div>
                  <div style={{ color: "var(--text-secondary)", marginBottom: "4px" }}>부채</div>
                  <div style={{ fontSize: "18px", fontWeight: "600", color: "var(--danger)" }}>{debt}h</div>
                </div>
              </div>
            </div>

            {/* Input Form */}
            <div className="card" style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "600" }}>수면 정보</h2>
                <div style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "var(--accent)",
                  background: "var(--accent-light)",
                  padding: "6px 12px",
                  borderRadius: "8px",
                }}>
                  {formatSelectedDate()}
                </div>
              </div>
              
              <div style={{ display: "grid", gap: "20px" }}>
                <div>
                  <label style={{ fontSize: "14px", fontWeight: "600", marginBottom: "10px", display: "block", color: "var(--text-primary)" }}>목표 수면 시간</label>
                  <input
                    type="number"
                    min="4"
                    max="12"
                    step="0.5"
                    value={data.targetSleep}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val >= 4 && val <= 12) setData({ ...data, targetSleep: val });
                    }}
                    style={{
                      width: "100%",
                      padding: "12px",
                      fontSize: "16px",
                      fontWeight: "600",
                      textAlign: "center",
                      border: "2px solid var(--border)",
                      borderRadius: "12px",
                      background: "var(--bg-secondary)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <div style={{ textAlign: "center", marginTop: "6px", fontSize: "12px", color: "var(--text-secondary)" }}>
                    권장: 7-9시간
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "14px", fontWeight: "600", marginBottom: "10px", display: "block", color: "var(--text-primary)" }}>실제 수면 시간</label>
                  <input
                    type="number"
                    min="0"
                    max="16"
                    step="0.5"
                    value={data.actualSleep}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val >= 0 && val <= 16) setData({ ...data, actualSleep: val });
                    }}
                    style={{
                      width: "100%",
                      padding: "12px",
                      fontSize: "16px",
                      fontWeight: "600",
                      textAlign: "center",
                      border: "2px solid var(--border)",
                      borderRadius: "12px",
                      background: "var(--bg-secondary)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <div style={{ textAlign: "center", marginTop: "6px", fontSize: "12px", color: "var(--text-secondary)" }}>
                    어제 밤 수면 기록
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <label style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>카페인 섭취량</label>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--accent)" }}>{data.caffeineIntake}잔</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={data.caffeineIntake}
                    onChange={(e) => setData({ ...data, caffeineIntake: parseInt(e.target.value) })}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "11px", color: "var(--text-secondary)" }}>
                    <span>0잔</span>
                    <span>10잔</span>
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <label style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>피로도</label>
                    <span style={{ fontSize: "14px", fontWeight: "600" }}>
                      {["최고", "좋음", "보통", "피곤", "힘듦"][data.fatigueLevel - 1]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={data.fatigueLevel}
                    onChange={(e) => setData({ ...data, fatigueLevel: parseInt(e.target.value) })}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "11px", color: "var(--text-secondary)" }}>
                    <span>1</span>
                    <span>3</span>
                    <span>5</span>
                  </div>
                </div>
              </div>

              <button
                onClick={analyze}
                disabled={loading}
                className="btn-primary"
                style={{ width: "100%", marginTop: "20px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                {loading ? (
                  <>
                    <div style={{ width: "16px", height: "16px", border: "2px solid white", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }}></div>
                    분석 중...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    AI 분석 받기
                  </>
                )}
              </button>

              {/* Bedtime Alarm Setting */}
              <div style={{ marginTop: "20px", padding: "16px", background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "4px" }}>🌙 취침 알림</div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>매일 정해진 시간에 알림</div>
                  </div>
                  <button
                    onClick={toggleBedtimeAlarm}
                    style={{
                      padding: "8px 16px",
                      background: bedtimeAlarmSet ? "var(--success)" : "var(--accent)",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "13px",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    {bedtimeAlarmSet ? "ON" : "OFF"}
                  </button>
                </div>
                <input
                  type="time"
                  value={bedtimeAlarmTime}
                  onChange={(e) => {
                    setBedtimeAlarmTime(e.target.value);
                    if (bedtimeAlarmSet) {
                      const alarmData = { enabled: true, time: e.target.value };
                      localStorage.setItem("bedtime-alarm", JSON.stringify(alarmData));
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    fontWeight: "600",
                    textAlign: "center",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Results */}
          <div>
            {/* Trend Chart */}
            <div className="card fade-in" style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <TrendingUp size={18} style={{ color: "var(--accent)" }} />
                  <h2 style={{ fontSize: "18px", fontWeight: "600" }}>수면 트렌드</h2>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => setChartPeriod(7)}
                    style={{
                      padding: "6px 12px",
                      background: chartPeriod === 7 ? "var(--accent)" : "var(--bg-secondary)",
                      color: chartPeriod === 7 ? "white" : "var(--text-primary)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "13px",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    7일
                  </button>
                  <button
                    onClick={() => setChartPeriod(30)}
                    style={{
                      padding: "6px 12px",
                      background: chartPeriod === 30 ? "var(--accent)" : "var(--bg-secondary)",
                      color: chartPeriod === 30 ? "white" : "var(--text-primary)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "13px",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    30일
                  </button>
                </div>
              </div>

              {/* Chart SVG */}
              <div style={{ position: "relative", height: "200px", marginBottom: "12px" }}>
                <svg width="100%" height="200" style={{ overflow: "visible" }}>
                  {/* Grid lines */}
                  {[0, 2, 4, 6, 8, 10].map((val, i) => (
                    <g key={i}>
                      <line
                        x1="0"
                        y1={180 - (val / 10) * 160}
                        x2="100%"
                        y2={180 - (val / 10) * 160}
                        stroke="var(--border)"
                        strokeWidth="1"
                        opacity="0.3"
                      />
                      <text
                        x="0"
                        y={180 - (val / 10) * 160 - 5}
                        fill="var(--text-secondary)"
                        fontSize="10"
                        opacity="0.6"
                      >
                        {val}h
                      </text>
                    </g>
                  ))}

                  {/* Line chart */}
                  {chartData.length > 1 && (
                    <>
                      {/* Debt line */}
                      <polyline
                        points={chartData
                          .map((d, i) => {
                            const x = (i / (chartData.length - 1)) * 100;
                            const y = 180 - Math.min(d.debt / 10, 1) * 160;
                            return `${x}%,${y}`;
                          })
                          .join(" ")}
                        fill="none"
                        stroke="var(--danger)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Actual sleep line */}
                      <polyline
                        points={chartData
                          .map((d, i) => {
                            const x = (i / (chartData.length - 1)) * 100;
                            const y = 180 - Math.min(d.actual / 10, 1) * 160;
                            return `${x}%,${y}`;
                          })
                          .join(" ")}
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.6"
                      />

                      {/* Data points */}
                      {chartData.map((d, i) => {
                        const x = (i / (chartData.length - 1)) * 100;
                        const y = 180 - Math.min(d.debt / 10, 1) * 160;
                        return (
                          <circle
                            key={i}
                            cx={`${x}%`}
                            cy={y}
                            r="4"
                            fill="var(--danger)"
                            stroke="white"
                            strokeWidth="2"
                          />
                        );
                      })}
                    </>
                  )}
                </svg>
              </div>

              {/* Legend */}
              <div style={{ display: "flex", gap: "16px", justifyContent: "center", fontSize: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "16px", height: "3px", background: "var(--danger)", borderRadius: "2px" }} />
                  <span>수면 부채</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "16px", height: "3px", background: "var(--accent)", borderRadius: "2px", opacity: 0.6 }} />
                  <span>실제 수면</span>
                </div>
              </div>

              {/* Stats */}
              {chartData.filter(d => d.debt > 0).length > 0 && (
                <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                  <div style={{ textAlign: "center", padding: "10px", background: "var(--bg-primary)", borderRadius: "8px" }}>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>평균</div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--danger)" }}>
                      {(chartData.reduce((sum, d) => sum + d.debt, 0) / chartData.filter(d => d.debt > 0).length || 0).toFixed(1)}h
                    </div>
                  </div>
                  <div style={{ textAlign: "center", padding: "10px", background: "var(--bg-primary)", borderRadius: "8px" }}>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>최고</div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--success)" }}>
                      {Math.min(...chartData.map(d => d.debt)).toFixed(1)}h
                    </div>
                  </div>
                  <div style={{ textAlign: "center", padding: "10px", background: "var(--bg-primary)", borderRadius: "8px" }}>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>최악</div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--danger)" }}>
                      {Math.max(...chartData.map(d => d.debt)).toFixed(1)}h
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* AI Insights */}
            {insights.length > 0 && (
              <div className="card fade-in" style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                  <Lightbulb size={18} style={{ color: "var(--accent)" }} />
                  <h2 style={{ fontSize: "18px", fontWeight: "600" }}>인사이트</h2>
                </div>
                <div style={{ display: "grid", gap: "12px" }}>
                  {insights.map((insight, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "14px",
                        background: "var(--bg-primary)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                      }}
                    >
                      <div style={{ display: "flex", gap: "10px", alignItems: "start" }}>
                        <div style={{ fontSize: "24px", flexShrink: 0 }}>{insight.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>
                            {insight.title}
                          </div>
                          <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                            {insight.text}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report && (
              <div className="card fade-in">
                <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px" }}>AI 분석 결과</h2>
                
                {/* Focus Score */}
                <div style={{
                  padding: "20px",
                  background: "var(--accent-light)",
                  borderRadius: "12px",
                  marginBottom: "20px",
                  textAlign: "center",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px" }}>
                    <Activity size={18} style={{ color: "var(--accent)" }} />
                    <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>집중력 점수</span>
                  </div>
                  <div style={{ fontSize: "42px", fontWeight: "700", color: "var(--accent)" }}>
                    {report.focusScore}<span style={{ fontSize: "22px" }}>/100</span>
                  </div>
                </div>

                {/* Recommendations Grid */}
                <div style={{ display: "grid", gap: "10px", marginBottom: "20px" }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "14px",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                  }}>
                    <Clock size={18} style={{ color: "var(--accent)", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "2px" }}>낮잠</div>
                      <div style={{ fontSize: "14px", fontWeight: "600" }}>{report.napGuide.time} · {report.napGuide.duration}분</div>
                    </div>
                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "14px",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                  }}>
                    <Coffee size={18} style={{ color: "var(--warning)", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "2px" }}>카페인 중단</div>
                      <div style={{ fontSize: "14px", fontWeight: "600" }}>{report.caffeineStopTime} 이후</div>
                    </div>
                    <button
                      onClick={setAlarm}
                      style={{
                        padding: "6px 12px",
                        background: alarmSet ? "var(--success)" : "var(--accent)",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "12px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontWeight: "600",
                      }}
                    >
                      <Bell size={14} />
                      {alarmSet ? "설정됨" : "알람"}
                    </button>
                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "14px",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                  }}>
                    <Bed size={18} style={{ color: "var(--accent)", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "2px" }}>취침 시간</div>
                      <div style={{ fontSize: "14px", fontWeight: "600" }}>{report.bedtime}까지</div>
                    </div>
                  </div>
                </div>

                {/* Analysis */}
                <div style={{
                  padding: "14px",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  marginBottom: "20px",
                }}>
                  <div style={{ fontSize: "13px", lineHeight: "1.6", color: "var(--text-secondary)" }}>
                    {report.analysis}
                  </div>
                </div>

                {/* Todo List */}
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px" }}>실천 항목</h3>
                  <div style={{ display: "grid", gap: "8px" }}>
                    {todos.map((todo) => (
                      <div key={todo.id} style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                        padding: "12px",
                        background: "var(--bg-primary)",
                        border: "1px solid var(--border)",
                        borderRadius: "10px",
                      }}>
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => toggleTodo(todo.id)}
                          style={{ width: "18px", height: "18px", cursor: "pointer", flexShrink: 0 }}
                        />
                        {editingId === todo.id ? (
                          <>
                            <input
                              type="text"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              style={{
                                flex: 1,
                                padding: "6px",
                                border: "1px solid var(--border)",
                                borderRadius: "6px",
                                background: "var(--bg-secondary)",
                                color: "var(--text-primary)",
                                fontSize: "13px",
                              }}
                            />
                            <button
                              onClick={saveEdit}
                              style={{
                                padding: "6px",
                                background: "var(--success)",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                              }}
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              style={{
                                padding: "6px",
                                background: "var(--text-secondary)",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                              }}
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <div style={{
                              flex: 1,
                              fontSize: "13px",
                              textDecoration: todo.completed ? "line-through" : "none",
                              opacity: todo.completed ? 0.5 : 1,
                            }}>
                              {todo.text}
                            </div>
                            <button
                              onClick={() => startEdit(todo.id, todo.text)}
                              style={{
                                padding: "6px",
                                background: "transparent",
                                color: "var(--text-secondary)",
                                border: "none",
                                cursor: "pointer",
                              }}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => deleteTodo(todo.id)}
                              style={{
                                padding: "6px",
                                background: "transparent",
                                color: "var(--danger)",
                                border: "none",
                                cursor: "pointer",
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!report && !loading && (
              <div className="card" style={{ padding: "60px 20px", textAlign: "center" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>💤</div>
                <p style={{ color: "var(--text-secondary)" }}>정보를 입력하고 AI 분석을 받아보세요</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .desktop-layout {
          display: grid !important;
          grid-template-columns: 1fr !important;
          gap: 24px !important;
        }
        @media (min-width: 1024px) {
          .desktop-layout {
            grid-template-columns: 480px 1fr !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </div>
  );
}
