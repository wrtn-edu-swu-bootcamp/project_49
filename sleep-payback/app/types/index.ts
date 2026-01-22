export interface SleepData {
  targetSleep: number;
  actualSleep: number;
  caffeineIntake: number;
  fatigueLevel: number;
}

export interface AIReportData {
  focusScore: number;
  napGuide: {
    time: string;
    duration: number;
  };
  caffeineStopTime: string;
  bedtime: string;
  analysis: string;
  recommendations: string[];
}
