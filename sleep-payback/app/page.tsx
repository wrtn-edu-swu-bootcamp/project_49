"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Moon, Sun, Sparkles, Activity, Coffee, Clock, Bed, Bell, Check, Edit2, Trash2, X, Calendar, ChevronLeft, ChevronRight, TrendingUp, Download, Upload, Target, Flame, Lightbulb, Palette, Award, Zap, FileText, Smile, Frown, Meh, User, LogOut, ChevronDown, UserX, Cloud, CloudOff } from "lucide-react";
import {
  isFirebaseConfigured,
  getAllSleepHistory,
  saveSleepHistory,
  deleteSleepHistory as deleteFirestoreSleepHistory,
  saveUserProfile,
  getUserProfile,
  saveUserSettings,
  getUserSettings,
  deleteAllUserData,
} from "../lib/firestore";

interface SleepData {
  targetSleep: number;
  sleepStart: string; // "23:00" 형태
  sleepEnd: string; // "07:00" 형태
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
  sleepStart: string;
  sleepEnd: string;
  actualSleep: number; // 계산된 값
  debt: number;
  caffeineIntake: number;
  fatigueLevel: number;
  morningCondition?: number; // 1-5 (기상 컨디션)
  note?: string; // 수면 일기
  sleepScore?: number; // 종합 수면 점수
  aiReport?: AIReport; // AI 분석 결과 (전체 객체)
  todos?: TodoItem[]; // 투두 리스트
}

export default function Home() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [theme, setTheme] = useState<"basic" | "day" | "night" | "star" | "demo1" | "demo2" | "demo3">("basic");
  const [data, setData] = useState<SleepData>({
    targetSleep: 8,
    sleepStart: "23:00",
    sleepEnd: "07:00",
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
  const [morningCondition, setMorningCondition] = useState<number>(3);
  const [sleepNote, setSleepNote] = useState<string>("");
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [profileEmoji, setProfileEmoji] = useState("😊");
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(false);
  const [cloudSyncLoading, setCloudSyncLoading] = useState(false);
  
  const calendarRef = useRef<HTMLDivElement>(null);

  const profileEmojis = ["😊", "😎", "🤗", "🥰", "😴", "🌙", "⭐", "💤", "🌟", "✨", "🔥", "💪", "🎯", "🏆", "🎨", "🌈", "🦄", "🐱", "🐶", "🐼"];

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    // Load history from localStorage
    const savedHistory = localStorage.getItem("sleep-history");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
      
      // 오늘 날짜의 투두 로드
      const today = new Date().toISOString().split('T')[0];
      const parsed = JSON.parse(savedHistory);
      const todayHistory = parsed.find((h: SleepHistory) => h.date === today);
      if (todayHistory?.todos) {
        setTodos(todayHistory.todos);
      }
    }
    // Load bedtime alarm settings
    const savedAlarm = localStorage.getItem("bedtime-alarm");
    if (savedAlarm) {
      const alarmData = JSON.parse(savedAlarm);
      setBedtimeAlarmSet(alarmData.enabled);
      setBedtimeAlarmTime(alarmData.time);
    }
    // Load profile from localStorage
    const savedProfile = localStorage.getItem("user-profile");
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setProfileName(profile.name || "");
      setProfileImage(profile.image || "");
      setProfileEmoji(profile.emoji || "😊");
    } else if (session?.user) {
      // 첫 로그인 시 세션 정보로 초기화
      setProfileName(session.user.name || "");
      setProfileImage(session.user.image || "");
    }
  }, [theme, session]);

  // Firestore에서 데이터 로드 (로그인 상태일 때)
  useEffect(() => {
    const loadFromFirestore = async () => {
      if (!session?.user?.id || !isFirebaseConfigured()) {
        setCloudSyncEnabled(false);
        return;
      }

      setCloudSyncLoading(true);
      try {
        const userId = session.user.id;

        // 수면 기록 로드
        const cloudHistory = await getAllSleepHistory(userId);
        if (cloudHistory.length > 0) {
          setHistory(cloudHistory);
          localStorage.setItem("sleep-history", JSON.stringify(cloudHistory));
          
          // 오늘 날짜의 투두 로드
          const today = new Date().toISOString().split('T')[0];
          const todayHistory = cloudHistory.find((h) => h.date === today);
          if (todayHistory?.todos) {
            setTodos(todayHistory.todos);
          }
        }

        // 프로필 로드
        const cloudProfile = await getUserProfile(userId);
        if (cloudProfile) {
          setProfileName(cloudProfile.name || "");
          setProfileImage(cloudProfile.image || "");
          setProfileEmoji(cloudProfile.emoji || "😊");
          localStorage.setItem("user-profile", JSON.stringify(cloudProfile));
        }

        // 설정 로드
        const cloudSettings = await getUserSettings(userId);
        if (cloudSettings?.bedtimeAlarm) {
          setBedtimeAlarmSet(cloudSettings.bedtimeAlarm.enabled);
          setBedtimeAlarmTime(cloudSettings.bedtimeAlarm.time);
          localStorage.setItem("bedtime-alarm", JSON.stringify(cloudSettings.bedtimeAlarm));
        }

        setCloudSyncEnabled(true);
      } catch (error) {
        console.error("Firestore 데이터 로드 실패:", error);
        setCloudSyncEnabled(false);
      } finally {
        setCloudSyncLoading(false);
      }
    };

    loadFromFirestore();
  }, [session]);

  const cycleTheme = () => {
    if (theme === "basic") setTheme("day");
    else if (theme === "day") setTheme("night");
    else if (theme === "night") setTheme("star");
    else setTheme("basic");
  };

  const handleProfileSave = async () => {
    const profile = {
      name: profileName,
      image: profileImage,
      emoji: profileEmoji,
    };
    localStorage.setItem("user-profile", JSON.stringify(profile));
    
    // Firestore에도 저장 (로그인 상태일 때)
    if (session?.user?.id && cloudSyncEnabled) {
      try {
        await saveUserProfile(session.user.id, profile);
      } catch (error) {
        console.error("프로필 클라우드 저장 실패:", error);
      }
    }
    
    setShowProfileEditModal(false);
  };

  const handleDeleteAccount = async () => {
    // Firestore 데이터 삭제 (로그인 상태일 때)
    if (session?.user?.id && cloudSyncEnabled) {
      try {
        await deleteAllUserData(session.user.id);
      } catch (error) {
        console.error("Firestore 데이터 삭제 실패:", error);
      }
    }
    
    // 모든 localStorage 데이터 삭제
    localStorage.removeItem("user-profile");
    localStorage.removeItem("sleep-history");
    localStorage.removeItem("sleep-todos");
    localStorage.removeItem("bedtime-alarm");
    
    // 상태 초기화
    setHistory([]);
    setTodos([]);
    setProfileName("");
    setProfileImage("");
    setProfileEmoji("😊");
    
    // 로그아웃
    signOut({ callbackUrl: '/auth/signin' });
  };

  // Load data when selected date changes
  useEffect(() => {
    const dayHistory = getHistoryForDate(selectedDate);
    if (dayHistory) {
      setData({
        targetSleep: dayHistory.targetSleep,
        sleepStart: dayHistory.sleepStart,
        sleepEnd: dayHistory.sleepEnd,
        caffeineIntake: dayHistory.caffeineIntake,
        fatigueLevel: dayHistory.fatigueLevel,
      });
      setMorningCondition(dayHistory.morningCondition || 3);
      setSleepNote(dayHistory.note || "");
      
      // AI 분석 결과 불러오기
      if (dayHistory.aiReport) {
        setReport(dayHistory.aiReport);
      } else {
        setReport(null);
      }
      
      // 투두 리스트 불러오기
      if (dayHistory.todos) {
        setTodos(dayHistory.todos);
      }
    } else {
      // 기록이 없는 날짜로 이동 시 초기화
      setReport(null);
      setTodos([]); // 빈 배열로 초기화
    }
  }, [selectedDate]);

  // 프로필 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showProfileMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-profile-menu]')) {
          setShowProfileMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

  useEffect(() => {
    // 날짜별 투두는 히스토리에 저장되므로 여기서는 저장하지 않음
    // localStorage 투두 저장 제거 (날짜별로 히스토리에 저장됨)
  }, [todos]);

  // 실제 수면 시간 계산 (시작-종료 시간으로부터)
  const calculateActualSleep = (start: string, end: string): number => {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    let startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;
    
    // 자정을 넘긴 경우 (예: 23:00 ~ 07:00)
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }
    
    const totalMinutes = endMinutes - startMinutes;
    return totalMinutes / 60;
  };

  const actualSleep = calculateActualSleep(data.sleepStart, data.sleepEnd);
  const debt = Math.max(0, data.targetSleep - actualSleep);

  // 종합 수면 점수 계산 (100점 만점)
  const calculateSleepScore = (actualSleep: number, targetSleep: number, debt: number, caffeineIntake: number, fatigueLevel: number, morningCondition: number = 3): number => {
    let score = 100;
    
    // 1. 수면 시간 달성도 (40점)
    const sleepRatio = actualSleep / targetSleep;
    if (sleepRatio >= 1) {
      score += 0; // 목표 달성
    } else if (sleepRatio >= 0.9) {
      score -= 10;
    } else if (sleepRatio >= 0.8) {
      score -= 20;
    } else {
      score -= 40;
    }
    
    // 2. 수면 부채 (30점)
    score -= debt * 5; // 부채 1시간당 -5점
    
    // 3. 카페인 섭취 (10점)
    score -= Math.max(0, caffeineIntake - 2) * 3; // 2잔 초과부터 감점
    
    // 4. 피로도 (10점)
    score -= (fatigueLevel - 1) * 2.5;
    
    // 5. 기상 컨디션 (10점)
    score += (morningCondition - 3) * 3.3; // 3이 중립, 5면 +6.6, 1이면 -6.6
    
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const sleepScore = calculateSleepScore(actualSleep, data.targetSleep, debt, data.caffeineIntake, data.fatigueLevel, morningCondition);

  const getSleepGrade = (score: number) => {
    if (score >= 90) return { grade: "S", color: "#FFD700", label: "완벽!" };
    if (score >= 80) return { grade: "A", color: "var(--success)", label: "우수" };
    if (score >= 70) return { grade: "B", color: "var(--accent)", label: "양호" };
    if (score >= 60) return { grade: "C", color: "var(--warning)", label: "보통" };
    return { grade: "D", color: "var(--danger)", label: "주의" };
  };

  // 연속 달성 일수 계산
  const calculateStreak = (): { current: number; best: number } => {
    if (history.length === 0) return { current: 0, best: 0 };
    
    const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    
    // 오늘부터 거꾸로 체크
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedHistory.length; i++) {
      const recordDate = new Date(sortedHistory[i].date);
      recordDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);
      
      // 날짜가 연속적인지 확인
      if (recordDate.getTime() === expectedDate.getTime()) {
        if (sortedHistory[i].debt === 0) {
          tempStreak++;
          if (i === 0 || currentStreak > 0) {
            currentStreak = tempStreak;
          }
        } else {
          if (currentStreak === 0) {
            tempStreak = 0;
          }
        }
      } else {
        break;
      }
      
      bestStreak = Math.max(bestStreak, tempStreak);
    }
    
    // 전체 히스토리에서 최고 기록 찾기
    let consecutiveCount = 0;
    const allSorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    for (let i = 0; i < allSorted.length; i++) {
      if (allSorted[i].debt === 0) {
        consecutiveCount++;
        bestStreak = Math.max(bestStreak, consecutiveCount);
      } else {
        consecutiveCount = 0;
      }
    }
    
    return { current: currentStreak, best: bestStreak };
  };

  const streak = calculateStreak();

  const getDebtStatus = () => {
    if (debt === 0) return { label: "완벽", color: "success" };
    if (debt < 2) return { label: "양호", color: "success" };
    if (debt < 4) return { label: "주의", color: "warning" };
    return { label: "위험", color: "danger" };
  };

  const analyze = async () => {
    // 이미 기록이 있는 날짜인지 확인
    const existingHistory = getHistoryForDate(selectedDate);
    if (existingHistory) {
      // 덮어쓰기 확인 모달 표시
      setShowOverwriteModal(true);
      return;
    }
    
    // 기록이 없으면 바로 분석 진행
    await performAnalysis();
  };

  const performAnalysis = async () => {
    setShowOverwriteModal(false);
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, actualSleep, sleepDebt: debt }),
      });
      if (res.ok) {
        const result = await res.json();
        setReport(result);
        
        // 수면 부채 정도에 따라 다른 실천항목 생성
        let allRecommendations: string[] = [];
        
        if (debt <= 0) {
          // 부채 없음 - 유지 관리
          allRecommendations = [
            "🎉 훌륭해요! 현재 수면 패턴을 유지하세요",
            "⏰ 규칙적인 수면 시간을 계속 지켜주세요 (±30분 이내)",
            "💤 낮잠은 20분 이내로 제한하세요",
            "🍽️ 저녁 식사는 취침 3시간 전에 마무리하세요",
            "🚶 저녁 산책 20분으로 수면의 질 향상",
            "📱 잠들기 1시간 전부터 블루라이트 차단 모드",
            "🫖 카모마일 차나 페퍼민트 차로 릴렉스",
            "📖 가벼운 독서로 하루 마무리",
            "🧘 취침 전 5분 명상으로 마음 정리",
            "🌡️ 침실 온도 18-20°C 유지",
          ];
        } else if (debt <= 2) {
          // 경미한 부채 (1-2시간)
          allRecommendations = [
            "⏰ 오늘 밤 30분~1시간 일찍 잠들어보세요",
            "☕ 카페인은 오후 2시 이후 피하세요",
            "🫖 커피 대신 루이보스 차나 보리차를 마셔보세요",
            "🚶 저녁 가벼운 산책 30분 (격렬한 운동 X)",
            "💤 낮잠 20분으로 피로 해소 (오후 3시 이전)",
            "📱 취침 1시간 전부터 스마트폰 사용 줄이세요",
            "🧘 목과 어깨 스트레칭 10분",
            "🥗 저녁은 가볍게 - 샐러드나 닭가슴살, 생선",
            "🛁 미지근한 물로 샤워 (39-40°C)",
            "🎵 백색소음이나 자연의 소리 들으며 휴식",
            "🌙 침실을 최대한 어둡게 (암막 커튼)",
            "📓 걱정거리 메모하고 내려놓기",
          ];
        } else if (debt <= 4) {
          // 중간 부채 (2-4시간)
          allRecommendations = [
            "⚠️ 오늘 밤 1~1.5시간 일찍 잠드는 것을 목표로 하세요",
            "💤 낮잠 30분 필수! (오후 2-3시가 최적)",
            "☕ 카페인은 오전 중에만 1-2잔 제한",
            "🫖 오후엔 캐모마일, 라벤더, 패션플라워 차",
            "🚶 점심 후 햇빛 아래 산책 20분 (세로토닌 생성)",
            "🧘 요가나 스트레칭 15분 (특히 목, 어깨, 허리)",
            "📱 취침 2시간 전 모든 화면 끄기",
            "🥗 저녁 식사는 닭가슴살, 연어, 두부 등 가벼운 단백질",
            "🥛 잠들기 1시간 전 따뜻한 우유 한 잔",
            "🛁 취침 90분 전 따뜻한 목욕 (40-42°C)",
            "🎧 수면 유도 ASMR이나 백색소음",
            "📖 가벼운 소설 읽기 (자극적인 내용 X)",
            "🌡️ 침실 온도 18°C, 습도 40-60%",
            "🧦 따뜻한 양말 신기 (손발 체온 유지)",
            "🧘 복식호흡 5분 (4초 들이쉬고 6초 내쉬기)",
          ];
        } else if (debt <= 6) {
          // 높은 부채 (4-6시간)
          allRecommendations = [
            "🚨 오늘 밤 최소 1.5~2시간 일찍 자세요",
            "💤 낮잠 45-60분 필수! (오후 2시 이전)",
            "☕ 오늘은 카페인 완전히 피하는 게 좋아요",
            "🫖 페퍼민트, 발레리안 루트 차로 대체",
            "☀️ 낮 시간 햇빛을 충분히 쬐세요 (최소 30분)",
            "🚶 가벼운 산책 30분 (아침 or 점심 후)",
            "🏃 격렬한 운동은 피하고 요가나 필라테스",
            "🧘 전신 스트레칭 20분 (특히 하체)",
            "🥗 저녁은 매우 가볍게 - 야채 수프, 과일",
            "🍌 바나나, 아몬드, 키위 섭취 (멜라토닌 함유)",
            "🛁 취침 전 따뜻한 족욕 15분",
            "📱 오후부터 블루라이트 차단 안경 착용",
            "🎵 힐링 음악 or 자연의 소리 (빗소리, 파도)",
            "🌙 오후 8시부터 조명 50% 어둡게",
            "🧘 명상 or 마음챙김 호흡 10분",
            "📓 감사 일기 쓰기",
            "🛏️ 침구를 깨끗하고 편안하게 정돈",
            "🌡️ 실내 공기 환기 후 온도 17-19°C",
          ];
        } else {
          // 심각한 부채 (6시간 이상)
          allRecommendations = [
            "🚨🚨 심각한 수면 부족! 오늘 밤 2시간 이상 일찍 자세요",
            "💤 낮잠 60-90분 취하세요 (오후 2시 이전, 필수!)",
            "☕ 카페인과 알코올 완전히 금지",
            "🫖 캐모마일, 라벤더, 레몬밤 차 수시로 마시기",
            "⚠️ 업무/공부 강도를 줄이고 휴식을 최우선으로",
            "🏠 가능하면 오늘 하루 휴식 or 반차",
            "☀️ 아침 햇빛 30분 이상 (생체리듬 리셋)",
            "🚶 매 2시간마다 10분 가벼운 스트레칭",
            "🧘 요가 매트에 누워 전신 이완 20분",
            "🥗 하루 종일 가벼운 식사 - 소화 부담 최소화",
            "🍵 녹색 채소, 통곡물, 견과류 위주 식단",
            "🍌 멜라토닌 함유 식품: 바나나, 체리, 키위, 호두",
            "🛁 오후 8시 이후 반신욕 20분 (38-40°C)",
            "🌙 해질 무렵부터 실내 조명 최소화",
            "📱 오후 5시 이후 전자기기 사용 최소화",
            "🎧 수면 유도 ASMR이나 명상 음악",
            "🧘 취침 전 호흡 명상 15분 (심신 안정)",
            "🛏️ 침실을 완전히 어둡고 조용하게",
            "🌡️ 온도 16-18°C, 완벽한 수면 환경",
            "💊 3일 이상 지속 시 전문가 상담 필수",
            "📅 주말에 수면 부채 해소에 집중 (최소 4시간 보충)",
          ];
        }
        
        // 랜덤으로 6-8개 선택
        const shuffled = allRecommendations.sort(() => 0.5 - Math.random());
        const selectedCount = debt <= 2 ? 6 : debt <= 4 ? 7 : 8;
        const recommendations = shuffled.slice(0, selectedCount);
        
        // Convert recommendations to todos
        const newTodos = recommendations.map((rec: string) => ({
          id: Date.now().toString() + Math.random(),
          text: rec,
          completed: false,
        }));
        setTodos(newTodos);
        
        // Save to history with selected date
        const newHistory = {
          date: selectedDate,
          targetSleep: data.targetSleep,
          sleepStart: data.sleepStart,
          sleepEnd: data.sleepEnd,
          actualSleep: actualSleep,
          debt: debt,
          caffeineIntake: data.caffeineIntake,
          fatigueLevel: data.fatigueLevel,
          morningCondition: morningCondition,
          note: sleepNote,
          sleepScore: sleepScore,
          aiReport: result, // AI 분석 결과 전체 저장
          todos: newTodos, // 생성된 투두 리스트 저장
        };
        
        const updatedHistory = [...history.filter(h => h.date !== selectedDate), newHistory];
        setHistory(updatedHistory);
        localStorage.setItem("sleep-history", JSON.stringify(updatedHistory));
        
        // Firestore에도 저장 (로그인 상태일 때)
        if (session?.user?.id && cloudSyncEnabled) {
          try {
            await saveSleepHistory(session.user.id, newHistory);
          } catch (error) {
            console.error("수면 기록 클라우드 저장 실패:", error);
          }
        }
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
      Notification.requestPermission().then(async (permission) => {
        if (permission === "granted") {
          const newState = !bedtimeAlarmSet;
          setBedtimeAlarmSet(newState);
          
          const alarmData = {
            enabled: newState,
            time: bedtimeAlarmTime,
          };
          localStorage.setItem("bedtime-alarm", JSON.stringify(alarmData));
          
          // Firestore에도 저장 (로그인 상태일 때)
          if (session?.user?.id && cloudSyncEnabled) {
            try {
              await saveUserSettings(session.user.id, { bedtimeAlarm: alarmData });
            } catch (error) {
              console.error("알람 설정 클라우드 저장 실패:", error);
            }
          }
          
          if (newState) {
            alert(`매일 ${bedtimeAlarmTime}에 취침 알림을 보내드릴게요.`);
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

  const deleteHistoryDate = async (dateStr: string) => {
    const updatedHistory = history.filter(h => h.date !== dateStr);
    setHistory(updatedHistory);
    localStorage.setItem("sleep-history", JSON.stringify(updatedHistory));
    
    // Firestore에서도 삭제 (로그인 상태일 때)
    if (session?.user?.id && cloudSyncEnabled) {
      try {
        await deleteFirestoreSleepHistory(session.user.id, dateStr);
      } catch (error) {
        console.error("수면 기록 클라우드 삭제 실패:", error);
      }
    }
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

  const getDebtBackgroundColor = (debt: number, isSelected: boolean) => {
    if (isSelected) return "linear-gradient(135deg, var(--accent) 0%, rgba(251, 146, 60, 0.8) 100%)";
    if (debt === 0) return "rgba(34, 197, 94, 0.15)"; // 초록 15%
    if (debt < 2) return "rgba(34, 197, 94, 0.25)"; // 초록 25%
    if (debt < 4) return "rgba(251, 146, 60, 0.25)"; // 주황 25%
    if (debt < 6) return "rgba(239, 68, 68, 0.25)"; // 빨강 25%
    return "rgba(239, 68, 68, 0.4)"; // 빨강 40% (심각)
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
          title: "개선 중",
          text: `최근 7일간 수면 부채가 평균 ${Math.abs(diff).toFixed(1)}시간 감소했습니다. 좋은 흐름이에요.`,
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
        icon: "◎",
        title: "목표 근접",
        text: `이번 주 ${goalProgress.current}일 달성! ${7 - goalProgress.current}일만 더 하면 주간 목표 완료예요!`,
      });
    }
    
    return insights;
  };

  const status = getDebtStatus();
  const monthStats = getMonthStats();
  const chartData = getChartData();
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
        background: theme === "star" ? "rgba(13, 13, 31, 0.95)" : "var(--bg-primary)",
        borderBottom: theme === "star" ? "1px solid rgba(56, 189, 248, 0.2)" : "1px solid var(--border)",
        padding: "16px 0",
        zIndex: 100,
        backdropFilter: "blur(10px)",
        boxShadow: theme === "star" ? "0 4px 20px rgba(56, 189, 248, 0.1)" : "none",
      }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Logo Icon - Basic Quick Access */}
            <button
              onClick={() => setTheme("basic")}
              style={{
                width: "48px",
                height: "48px",
                background: theme === "basic"
                  ? "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)"
                  : theme === "star" 
                  ? "linear-gradient(135deg, #38bdf8 0%, #8b5cf6 100%)" 
                  : theme === "night"
                  ? "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)"
                  : theme === "day"
                  ? "linear-gradient(135deg, #5da5a5 0%, #ef7d4f 100%)"
                  : "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: theme === "star" 
                  ? "0 0 20px rgba(56, 189, 248, 0.4)" 
                  : theme === "night"
                  ? "0 0 15px rgba(96, 165, 250, 0.3)"
                  : "0 2px 8px rgba(59, 130, 246, 0.3)",
                transition: "all 0.3s ease",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                if (theme === "star") {
                  e.currentTarget.style.boxShadow = "0 0 30px rgba(56, 189, 248, 0.6)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                if (theme === "star") {
                  e.currentTarget.style.boxShadow = "0 0 20px rgba(56, 189, 248, 0.4)";
                }
              }}
              title="Basic 테마로 이동"
            >
              <Moon size={24} color="white" strokeWidth={2.5} />
            </button>
            
            <h1 style={{ 
              fontSize: "22px", 
              fontWeight: "800", 
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              textTransform: "uppercase",
            }}>
              Sleep Debt Manager
          </h1>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {/* 프로필 메뉴 */}
            {session && (
              <div style={{ position: "relative" }} data-profile-menu>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                    background: "var(--bg-secondary)",
                    cursor: "pointer",
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
                >
                  {(profileName || profileImage || profileEmoji !== "😊") ? (
                    // 사용자가 프로필을 설정한 경우
                    profileImage ? (
                      <img 
                        src={profileImage} 
                        alt="Profile" 
                        style={{ 
                          width: "24px", 
                          height: "24px", 
                          borderRadius: "50%",
                          objectFit: "cover",
                        }} 
                      />
                    ) : (
                      <div style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: "var(--accent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "13px",
                      }}>
                        {profileEmoji}
                      </div>
                    )
                  ) : session.user?.image ? (
                    // 프로필 미설정 + Google 이미지 있음
                    <img 
                      src={session.user.image} 
                      alt="Profile" 
                      style={{ 
                        width: "24px", 
                        height: "24px", 
                        borderRadius: "50%",
                        objectFit: "cover",
                      }} 
                    />
                  ) : (
                    // 기본 아이콘
                    <div style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: "var(--accent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                    }}>
                      {profileEmoji}
                    </div>
                  )}
                  <span style={{ 
                    fontSize: "14px", 
                    fontWeight: "500", 
                    color: "var(--text-primary)",
                    maxWidth: "120px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {profileName || session.user?.name?.split(' ')[0] || 'User'}
                  </span>
                  {/* 클라우드 동기화 상태 표시 */}
                  {cloudSyncLoading ? (
                    <div style={{
                      width: "14px",
                      height: "14px",
                      border: "2px solid var(--border)",
                      borderTopColor: "var(--accent)",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }} />
                  ) : cloudSyncEnabled ? (
                    <span title="클라우드 동기화 활성화">
                      <Cloud size={14} color="var(--success)" />
                    </span>
                  ) : (
                    <span title="로컬 저장소 사용 중">
                      <CloudOff size={14} color="var(--text-secondary)" />
                    </span>
                  )}
                  <ChevronDown size={14} color="var(--text-secondary)" />
                </button>

                {/* 드롭다운 메뉴 */}
                {showProfileMenu && (
                  <div style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    width: "220px",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    zIndex: 1000,
                    overflow: "hidden",
                  }}>
                    {/* 사용자 정보 */}
                    <div style={{ 
                      padding: "16px", 
                      borderBottom: "1px solid var(--border)",
                      background: "var(--bg-secondary)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                        {(profileName || profileImage || profileEmoji !== "😊") ? (
                          // 사용자가 프로필을 설정한 경우
                          profileImage ? (
                            <img 
                              src={profileImage} 
                              alt="Profile" 
                              style={{ 
                                width: "40px", 
                                height: "40px", 
                                borderRadius: "50%",
                                objectFit: "cover",
                              }} 
                            />
                          ) : (
                            <div style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              background: "var(--accent)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "24px",
                            }}>
                              {profileEmoji}
                            </div>
                          )
                        ) : session.user?.image ? (
                          // 프로필 미설정 + Google 이미지 있음
                          <img 
                            src={session.user.image} 
                            alt="Profile" 
                            style={{ 
                              width: "40px", 
                              height: "40px", 
                              borderRadius: "50%",
                              objectFit: "cover",
                            }} 
                          />
                        ) : (
                          // 기본 아이콘
                          <div style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background: "var(--accent)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "24px",
                          }}>
                            {profileEmoji}
                          </div>
                        )}
                        <div style={{ flex: 1, overflow: "hidden" }}>
                          <div style={{ 
                            fontSize: "14px", 
                            fontWeight: "600", 
                            color: "var(--text-primary)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}>
                            {profileName || session.user?.name || 'User'}
                          </div>
                          <div style={{ 
                            fontSize: "12px", 
                            color: "var(--text-secondary)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}>
                            {session.user?.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 메뉴 항목 */}
                    <div style={{ padding: "8px" }}>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          // localStorage에서 최신 프로필 정보 로드
                          const savedProfile = localStorage.getItem("user-profile");
                          if (savedProfile) {
                            const profile = JSON.parse(savedProfile);
                            setProfileName(profile.name || "");
                            setProfileImage(profile.image || "");
                            setProfileEmoji(profile.emoji || "😊");
                          }
                          setShowProfileEditModal(true);
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px",
                          background: "transparent",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "var(--text-primary)",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--bg-secondary)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <User size={16} />
                        프로필 편집
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowDeleteAccountModal(true);
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px",
                          background: "transparent",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "var(--text-secondary)",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--bg-secondary)";
                          e.currentTarget.style.color = "var(--danger)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "var(--text-secondary)";
                        }}
                      >
                        <UserX size={16} />
                        회원 탈퇴
                      </button>
                      <button
                        onClick={() => {
                          signOut({ callbackUrl: '/auth/signin' });
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px",
                          background: "transparent",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "var(--danger)",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <LogOut size={16} />
                        로그아웃
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 로그인하지 않은 경우 */}
            {!session && authStatus !== "loading" && (
              <button
                onClick={() => router.push('/auth/signin')}
                style={{
                  padding: "8px 16px",
                  borderRadius: "10px",
                  border: "1px solid var(--accent)",
                  background: "var(--accent)",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                로그인
              </button>
            )}

            <button
              onClick={() => {
                setShowCalendar(!showCalendar);
                if (!showCalendar) {
                  // 캘린더를 열 때 스크롤 (헤더 포함)
                  setTimeout(() => {
                    if (calendarRef.current) {
                      const yOffset = -80; // 헤더 높이 고려
                      const y = calendarRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
                      window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                  }, 100);
                }
              }}
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
              onClick={cycleTheme}
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
                boxShadow: theme === "star" ? "0 0 20px rgba(56, 189, 248, 0.3)" : "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--accent-light)";
                e.currentTarget.style.borderColor = "var(--accent)";
                if (theme === "star") {
                  e.currentTarget.style.boxShadow = "0 0 25px rgba(56, 189, 248, 0.5)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--bg-secondary)";
                e.currentTarget.style.borderColor = "var(--border)";
                if (theme === "star") {
                  e.currentTarget.style.boxShadow = "0 0 20px rgba(56, 189, 248, 0.3)";
                }
              }}
              title={
                theme === "basic" ? "Day 모드" : 
                theme === "day" ? "다크 모드" : 
                theme === "night" ? "스페이스 모드" : 
                "Basic 모드"
              }
            >
              {theme === "basic" ? <Sun size={18} /> : 
               theme === "day" ? <Moon size={18} /> : 
               theme === "night" ? <Sparkles size={18} /> : 
               <Sun size={18} />}
            </button>
          </div>
        </div>
      </header>

      <div className="container" style={{ paddingTop: "40px" }}>
        {/* Calendar Modal */}
        {showCalendar && (
          <div ref={calendarRef} className="card fade-in" style={{ marginBottom: "24px" }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "16px", maxWidth: "560px", margin: "0 auto 16px" }}>
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
                        background: dayHistory ? getDebtBackgroundColor(dayHistory.debt, dateStr === selectedDate) : "transparent",
                        border: isToday ? "2px solid var(--accent)" : dateStr === selectedDate ? "2px solid var(--accent)" : "1px solid transparent",
                        position: "relative",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        padding: "8px 4px",
                      }}
                      onClick={() => selectDate(dateStr)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (dayHistory && window.confirm(`${dateStr} 기록을 삭제하시겠습니까?`)) {
                          deleteHistoryDate(dateStr);
                        }
                      }}
                      onMouseEnter={(e) => {
                        if (dateStr !== selectedDate && dayHistory) {
                          const currentBg = getDebtBackgroundColor(dayHistory.debt, false);
                          e.currentTarget.style.background = currentBg.replace(/[\d.]+\)$/, '0.4)'); // opacity 증가
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (dateStr !== selectedDate && dayHistory) {
                          e.currentTarget.style.background = getDebtBackgroundColor(dayHistory.debt, false);
                        }
                      }}
                      title={dayHistory ? (dayHistory.note ? `${dayHistory.note}\n(우클릭으로 삭제)` : `우클릭으로 삭제`) : "클릭하여 선택"}
                    >
                      <div style={{
                        fontSize: "14px",
                        fontWeight: isToday ? "700" : "600",
                        color: dateStr === selectedDate ? "white" : "var(--text-primary)",
                      }}>
                        {day}
                      </div>
                      {dayHistory && (
                        <>
                          <div style={{
                            fontSize: "10px",
                            fontWeight: "700",
                            color: dateStr === selectedDate ? "rgba(255,255,255,0.95)" : getDebtColor(dayHistory.debt),
                            marginTop: "2px",
                          }}>
                            {dayHistory.debt > 0 ? `${dayHistory.debt.toFixed(1)}h` : '✓'}
                          </div>
                          {dayHistory.note && (
                            <div style={{
                              position: "absolute",
                              top: "2px",
                              right: "2px",
                              width: "14px",
                              height: "14px",
                              borderRadius: "3px",
                              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 1px 3px rgba(102, 126, 234, 0.5)",
                            }}>
                              <FileText size={8} color="white" />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                }
                
                return days;
              })()}
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: "12px", fontSize: "11px", justifyContent: "center", marginBottom: "16px", maxWidth: "560px", margin: "0 auto 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: "var(--success)" }} />
                <span>양호</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: "var(--warning)" }} />
                <span>주의</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: "var(--danger)" }} />
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
                {streak.current > 0 && (
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
                    {streak.current}일 연속
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
              
              {/* Sleep Score & Streak */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                {/* 수면 점수 */}
                <div style={{ 
                  padding: "20px", 
                  background: "var(--bg-primary)", 
                  borderRadius: "16px",
                  border: "1px solid var(--border)",
                  position: "relative",
                  overflow: "hidden",
                }}>
                  {/* 배경 그라데이션 효과 */}
                  <div style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: "80px",
                    height: "80px",
                    background: `radial-gradient(circle, ${getSleepGrade(sleepScore).color}20 0%, transparent 70%)`,
                    pointerEvents: "none",
                  }} />
                  
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px", fontWeight: "500", letterSpacing: "0.5px" }}>
                      SLEEP QUALITY
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "8px" }}>
                      <div style={{
                        fontSize: "48px",
                        fontWeight: "700",
                        color: getSleepGrade(sleepScore).color,
                        lineHeight: 1,
                        letterSpacing: "-2px",
                      }}>
                        {sleepScore}
                      </div>
                      <div style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: "500" }}>
                        /100
                      </div>
                    </div>
                    <div style={{
                      display: "inline-block",
                      padding: "4px 12px",
                      background: `${getSleepGrade(sleepScore).color}15`,
                      borderRadius: "20px",
                      fontSize: "11px",
                      fontWeight: "600",
                      color: getSleepGrade(sleepScore).color,
                      letterSpacing: "0.5px",
                    }}>
                      {getSleepGrade(sleepScore).label.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* 연속 달성 일수 */}
                <div style={{ 
                  padding: "20px", 
                  background: "var(--bg-primary)", 
                  borderRadius: "16px",
                  border: "1px solid var(--border)",
                  position: "relative",
                  overflow: "hidden",
                }}>
                  {/* 배경 그라데이션 효과 */}
                  <div style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: "80px",
                    height: "80px",
                    background: "radial-gradient(circle, #ff6b3520 0%, transparent 70%)",
                    pointerEvents: "none",
                  }} />
                  
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px", fontWeight: "500", letterSpacing: "0.5px" }}>
                      STREAK
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "8px" }}>
                      <div style={{
                        fontSize: "48px",
                        fontWeight: "700",
                        color: "var(--accent)",
                        lineHeight: 1,
                        letterSpacing: "-2px",
                      }}>
                        {streak.current}
                      </div>
                      <div style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: "500" }}>
                        days
                      </div>
                    </div>
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "4px 12px",
                      background: "#ff6b3515",
                      borderRadius: "20px",
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "#ff6b35",
                      letterSpacing: "0.5px",
                    }}>
                      <Zap size={12} />
                      BEST: {streak.best}
                    </div>
                  </div>
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
                  <div style={{ fontSize: "18px", fontWeight: "600" }}>{actualSleep.toFixed(1)}h</div>
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
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: "500" }}>취침</div>
                      <input
                        type="time"
                        value={data.sleepStart}
                        onChange={(e) => setData({ ...data, sleepStart: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "12px 8px",
                          fontSize: "15px",
                          fontWeight: "600",
                          textAlign: "center",
                          border: "2px solid var(--border)",
                          borderRadius: "12px",
                          background: "var(--bg-secondary)",
                          color: "var(--text-primary)",
                        }}
                      />
                    </div>
                    
                    <div style={{ fontSize: "16px", color: "var(--text-secondary)", paddingTop: "24px" }}>→</div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: "500" }}>기상</div>
                      <input
                        type="time"
                        value={data.sleepEnd}
                        onChange={(e) => setData({ ...data, sleepEnd: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "12px 8px",
                          fontSize: "15px",
                          fontWeight: "600",
                          textAlign: "center",
                          border: "2px solid var(--border)",
                          borderRadius: "12px",
                          background: "var(--bg-secondary)",
                          color: "var(--text-primary)",
                        }}
                      />
                    </div>
                  </div>
                  
                  <div style={{ 
                    textAlign: "center", 
                    padding: "10px", 
                    background: "var(--accent-light)", 
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}>
                    <div style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #a8edea 0%, #74b9ff 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 6px rgba(116, 185, 255, 0.4)",
                    }}>
                      <Bed size={12} color="white" style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.2))" }} />
                    </div>
                    총 {actualSleep.toFixed(1)}시간 수면
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

              {/* 기상 컨디션 */}
              <div style={{ marginTop: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #ffd93d 0%, #f7b731 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(255, 217, 61, 0.4)",
                    }}>
                      <Sun size={14} color="white" style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.2))" }} />
                    </div>
                    <label style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>기상 컨디션</label>
                  </div>
                  <span style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "var(--accent)",
                  }}>
                    {["최악", "안좋음", "보통", "좋음", "최고"][morningCondition - 1]}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={morningCondition}
                  onChange={(e) => setMorningCondition(parseInt(e.target.value))}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "11px", color: "var(--text-secondary)" }}>
                  <span>1</span>
                  <span>3</span>
                  <span>5</span>
                </div>
              </div>

              {/* 수면 일기 */}
              <div style={{ marginTop: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <div style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "6px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(102, 126, 234, 0.4)",
                  }}>
                    <FileText size={14} color="white" style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.2))" }} />
                  </div>
                  <label style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>
                    수면 메모
                  </label>
                </div>
                <textarea
                  value={sleepNote}
                  onChange={(e) => setSleepNote(e.target.value)}
                  placeholder="오늘 수면에 영향을 준 요인을 간단히 메모하세요 (선택)"
                  style={{
                    width: "100%",
                    minHeight: "80px",
                    padding: "12px",
                    fontSize: "14px",
                    border: "2px solid var(--border)",
                    borderRadius: "12px",
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "6px" }}>
                  예) 스트레스 많았음, 저녁에 커피 마심, 늦게 운동함 등
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
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <div style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 6px rgba(79, 172, 254, 0.4)",
                      }}>
                        <Moon size={12} color="white" style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.2))" }} />
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: "600" }}>취침 알림</div>
                    </div>
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
                <div style={{ marginBottom: "16px", display: "flex", justifyContent: "center" }}>
                  <Moon size={48} style={{ color: "var(--accent)", opacity: 0.6 }} />
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>정보를 입력하고 AI 분석을 받아보세요</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 프로필 편집 모달 */}
      {showProfileEditModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowProfileEditModal(false);
            }
          }}
        >
          <div
            style={{
              background: "var(--bg-primary)",
              borderRadius: "16px",
              padding: "32px",
              maxWidth: "520px",
              width: "100%",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
                프로필 편집
              </h2>
              <button
                onClick={() => setShowProfileEditModal(false)}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  border: "none",
                  background: "var(--bg-secondary)",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--accent-light)";
                  e.currentTarget.style.color = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--bg-secondary)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* 프로필 미리보기 */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "32px" }}>
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile Preview"
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "3px solid var(--accent)",
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling?.setAttribute('style', 'display: flex !important');
                  }}
                />
              ) : null}
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  background: "var(--accent)",
                  display: profileImage ? "none" : "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "3px solid var(--accent)",
                  fontSize: "48px",
                }}
              >
                {profileEmoji}
              </div>
            </div>

            {/* 입력 필드 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "32px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "8px" }}>
                  이름
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="이름을 입력하세요"
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "8px" }}>
                  프로필 이미지 URL
                </label>
                <input
                  type="url"
                  value={profileImage}
                  onChange={(e) => setProfileImage(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    fontFamily: "inherit",
                  }}
                />
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "6px" }}>
                  이미지 URL을 입력하거나, 비워두고 아래 이모지를 선택하세요
                </div>
              </div>

              {/* 이모지 선택 (항상 보임) */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "8px" }}>
                  프로필 이모지 {profileImage && <span style={{ fontWeight: "400", color: "var(--text-secondary)" }}>(이모지 선택 시 URL이 삭제됩니다)</span>}
                </label>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(10, 1fr)", 
                  gap: "6px",
                  padding: "10px",
                  background: "var(--bg-secondary)",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                }}>
                  {profileEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setProfileEmoji(emoji);
                        setProfileImage(""); // URL 자동 삭제
                      }}
                      style={{
                        width: "100%",
                        aspectRatio: "1",
                        borderRadius: "6px",
                        border: (!profileImage && profileEmoji === emoji) ? "2px solid var(--accent)" : "1px solid transparent",
                        background: (!profileImage && profileEmoji === emoji) ? "var(--accent-light)" : "transparent",
                        fontSize: "18px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s ease",
                        padding: "0",
                        opacity: profileImage ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!profileImage || profileEmoji !== emoji) {
                          e.currentTarget.style.background = "var(--bg-primary)";
                          e.currentTarget.style.transform = "scale(1.1)";
                          e.currentTarget.style.opacity = "1";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!profileImage && profileEmoji !== emoji) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.transform = "scale(1)";
                        } else if (profileImage) {
                          e.currentTarget.style.opacity = "0.6";
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.transform = "scale(1)";
                        }
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowProfileEditModal(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  background: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
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
              >
                취소
              </button>
              <button
                onClick={handleProfileSave}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "none",
                  background: "var(--accent)",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 회원 탈퇴 확인 모달 */}
      {showDeleteAccountModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setShowDeleteAccountModal(false)}
        >
          <div
            style={{
              background: "var(--bg-primary)",
              borderRadius: "16px",
              padding: "32px",
              maxWidth: "420px",
              width: "100%",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}>
                <UserX size={32} color="var(--danger)" />
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-primary)", margin: "0 0 12px 0" }}>
                정말 탈퇴하시겠어요?
              </h2>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.6" }}>
                탈퇴하시면 모든 수면 기록, 투두 리스트,<br />
                프로필 정보가 <strong style={{ color: "var(--danger)" }}>영구적으로 삭제</strong>됩니다.
              </p>
            </div>

            <div style={{ 
              background: "var(--bg-secondary)", 
              padding: "16px", 
              borderRadius: "10px", 
              marginBottom: "24px",
              border: "1px solid var(--border)",
            }}>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.5" }}>
                ⚠️ <strong>삭제될 데이터:</strong>
              </p>
              <ul style={{ 
                fontSize: "13px", 
                color: "var(--text-secondary)", 
                margin: "8px 0 0 0", 
                paddingLeft: "20px",
                lineHeight: "1.6",
              }}>
                <li>전체 수면 히스토리</li>
                <li>실천 항목(투두) 리스트</li>
                <li>프로필 정보 및 설정</li>
                <li>알람 설정</li>
              </ul>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowDeleteAccountModal(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  background: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
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
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "none",
                  background: "var(--danger)",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                탈퇴하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 덮어쓰기 확인 모달 */}
      {showOverwriteModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setShowOverwriteModal(false)}
        >
          <div
            style={{
              background: "var(--bg-primary)",
              borderRadius: "16px",
              padding: "32px",
              maxWidth: "420px",
              width: "100%",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(251, 146, 60, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}>
                <Sparkles size={32} color="var(--accent)" />
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-primary)", margin: "0 0 12px 0" }}>
                이미 기록이 있어요
              </h2>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.6" }}>
                {selectedDate === new Date().toISOString().split('T')[0] 
                  ? "오늘" 
                  : new Date(selectedDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}의 수면 분석 기록이 이미 있습니다.<br />
                <strong style={{ color: "var(--accent)" }}>기존 기록을 덮어쓰시겠어요?</strong>
              </p>
            </div>

            <div style={{ 
              background: "var(--bg-secondary)", 
              padding: "16px", 
              borderRadius: "10px", 
              marginBottom: "24px",
              border: "1px solid var(--border)",
            }}>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.5" }}>
                ℹ️ <strong>안내:</strong>
              </p>
              <ul style={{ 
                fontSize: "13px", 
                color: "var(--text-secondary)", 
                margin: "8px 0 0 0", 
                paddingLeft: "20px",
                lineHeight: "1.6",
              }}>
                <li>기존 AI 분석 결과가 삭제됩니다</li>
                <li>실천 항목(투두)이 새로 생성됩니다</li>
                <li>수면 히스토리는 업데이트됩니다</li>
              </ul>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowOverwriteModal(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  background: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
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
              >
                취소
              </button>
              <button
                onClick={performAnalysis}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "none",
                  background: "var(--accent)",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                덮어쓰기
              </button>
            </div>
          </div>
        </div>
      )}

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
