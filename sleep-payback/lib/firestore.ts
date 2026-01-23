import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  collection,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";

// ============================================
// 타입 정의
// ============================================

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
  actualSleep: number;
  debt: number;
  caffeineIntake: number;
  fatigueLevel: number;
  morningCondition?: number;
  note?: string;
  sleepScore?: number;
  aiReport?: AIReport;
  todos?: TodoItem[];
}

interface UserProfile {
  name: string;
  image: string;
  emoji: string;
}

interface UserSettings {
  bedtimeAlarm: {
    enabled: boolean;
    time: string;
  };
}

// ============================================
// 프로필 관련 함수
// ============================================

/**
 * 사용자 프로필 저장
 */
export async function saveUserProfile(userId: string, profile: UserProfile): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, { profile }, { merge: true });
}

/**
 * 사용자 프로필 가져오기
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!db) return null;
  const userRef = doc(db, "users", userId);
  const docSnap = await getDoc(userRef);
  
  if (docSnap.exists() && docSnap.data().profile) {
    return docSnap.data().profile as UserProfile;
  }
  return null;
}

// ============================================
// 설정 관련 함수
// ============================================

/**
 * 사용자 설정 저장
 */
export async function saveUserSettings(userId: string, settings: UserSettings): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, { settings }, { merge: true });
}

/**
 * 사용자 설정 가져오기
 */
export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  if (!db) return null;
  const userRef = doc(db, "users", userId);
  const docSnap = await getDoc(userRef);
  
  if (docSnap.exists() && docSnap.data().settings) {
    return docSnap.data().settings as UserSettings;
  }
  return null;
}

// ============================================
// 수면 기록 관련 함수
// ============================================

/**
 * 수면 기록 저장 (단일 날짜)
 */
export async function saveSleepHistory(userId: string, history: SleepHistory): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  const historyRef = doc(db, "users", userId, "sleepHistory", history.date);
  await setDoc(historyRef, history);
}

/**
 * 수면 기록 가져오기 (단일 날짜)
 */
export async function getSleepHistory(userId: string, date: string): Promise<SleepHistory | null> {
  if (!db) return null;
  const historyRef = doc(db, "users", userId, "sleepHistory", date);
  const docSnap = await getDoc(historyRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as SleepHistory;
  }
  return null;
}

/**
 * 모든 수면 기록 가져오기
 */
export async function getAllSleepHistory(userId: string): Promise<SleepHistory[]> {
  if (!db) return [];
  const historyRef = collection(db, "users", userId, "sleepHistory");
  const q = query(historyRef, orderBy("date", "desc"));
  const querySnapshot = await getDocs(q);
  
  const histories: SleepHistory[] = [];
  querySnapshot.forEach((doc) => {
    histories.push(doc.data() as SleepHistory);
  });
  
  return histories;
}

/**
 * 수면 기록 삭제 (단일 날짜)
 */
export async function deleteSleepHistory(userId: string, date: string): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  const historyRef = doc(db, "users", userId, "sleepHistory", date);
  await deleteDoc(historyRef);
}

/**
 * 여러 수면 기록 일괄 저장 (LocalStorage → Firestore 마이그레이션용)
 */
export async function saveAllSleepHistory(userId: string, histories: SleepHistory[]): Promise<void> {
  const promises = histories.map((history) => saveSleepHistory(userId, history));
  await Promise.all(promises);
}

// ============================================
// 사용자 데이터 전체 삭제 (회원 탈퇴용)
// ============================================

/**
 * 사용자의 모든 데이터 삭제
 */
export async function deleteAllUserData(userId: string): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  
  // 1. 수면 기록 전체 삭제
  const historyRef = collection(db, "users", userId, "sleepHistory");
  const querySnapshot = await getDocs(historyRef);
  
  const deletePromises: Promise<void>[] = [];
  querySnapshot.forEach((doc) => {
    deletePromises.push(deleteDoc(doc.ref));
  });
  await Promise.all(deletePromises);
  
  // 2. 사용자 문서 삭제
  const userRef = doc(db, "users", userId);
  await deleteDoc(userRef);
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * Firebase가 설정되어 있는지 확인
 */
export function isFirebaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
}
