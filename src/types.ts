export interface QuestionOption {
  id: string;
  text: string;
}

export interface ExamModule {
  id: string;
  name: string; // e.g. "វគ្គទី ១: មូលដ្ឋានគ្រឹះឌីជីថល"
  code: string; // e.g. "MOD-01"
  description?: string;
  color?: string; // color badge e.g. "blue", "emerald", "amber", "purple", "rose"
  createdAt?: number;
}

export interface Question {
  id: string;
  prompt: string;
  options: QuestionOption[];
  correctOptionId: string;
  explanation?: string;
  points?: number;
  category?: string;
  moduleId?: string; // Linked module/topic ID
}

export interface ShuffledQuestion {
  originalId: string;
  prompt: string;
  options: QuestionOption[];
  // Mapping back to original for grading
  originalCorrectOptionId: string;
  explanation?: string;
  points: number;
  moduleId?: string;
}

export interface ExamSessionConfig {
  id: string;
  code: string; // 6-digit room PIN e.g. 748291
  title: string;
  description: string;
  durationMinutes: number; // e.g. 5 mins, 10 mins
  passPercentage: number; // e.g. 60%
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  allowReview: boolean;
  showScoreImmediately: boolean;
  status: 'active' | 'paused' | 'ended';
  createdAt: number;
  selectedModuleId?: string; // 'all' or specific module ID for this exam
}

export interface ModuleScoreSummary {
  moduleId: string;
  moduleName: string;
  earned: number;
  total: number;
  percentage: number;
}

export interface StudentSubmission {
  id: string;
  roomId: string;
  studentName: string;
  studentId?: string;
  startedAt: number;
  submittedAt: number;
  durationSeconds: number;
  answers: Record<string, string>; // questionId -> selectedOptionId
  score: number; // raw points scored
  maxScore: number;
  percentage: number;
  isPassed: boolean;
  rank?: number;
  moduleScores?: ModuleScoreSummary[];
  details?: {
    questionId: string;
    prompt: string;
    selectedOptionText: string;
    correctOptionText: string;
    isCorrect: boolean;
    explanation?: string;
    moduleId?: string;
  }[];
}

export interface RegisteredStudent {
  id: string;
  name: string;
  studentId?: string;
  joinedAt: number;
  status?: 'waiting' | 'in_progress' | 'submitted';
  moduleId?: string;
}

export interface RoomData {
  config: ExamSessionConfig;
  modules: ExamModule[];
  questions: Question[];
  submissions: StudentSubmission[];
  registeredStudents?: RegisteredStudent[];
}

export type SidebarMenuTab = 'home' | 'leaderboard' | 'modules' | 'questions' | 'scores' | 'users' | 'settings';
export type AppView = 'admin' | 'student';
