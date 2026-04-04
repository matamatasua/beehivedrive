// ============================================
// BeehiveDrive Core Types
// ============================================

// --- Question Types ---

export type Track = "written_knowledge" | "traffic_safety";

export type QuestionType =
  | "multiple_choice"
  | "slider"
  | "drag_match"
  | "swipe"
  | "tap_diagram"
  | "reorder"
  | "scenario";

export type DifficultyTier = 1 | 2 | 3 | 4;

export type ConfusionType =
  | "double_negative"
  | "close_answer"
  | "all_above"
  | "scenario_distractor"
  | "absolute_language"
  | null;

export type FatalFiveCategory =
  | "speeding"
  | "distracted"
  | "impaired"
  | "seatbelt"
  | "aggressive"
  | null;

export type Confidence = "sure" | "unsure" | "guess";

export interface QuestionOption {
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface Question {
  id: string;
  track: Track;
  categoryId: string;
  text: string;
  questionType: QuestionType;
  options: QuestionOption[];
  correctAnswer: string;
  explanation: string;
  aiExplanation: string | null;
  mnemonic: string | null;
  difficulty: DifficultyTier;
  confusionType: ConfusionType;
  utahCodeRef: string | null;
  handbookChapter: string | null;
  imageUrl: string | null;
  globalMissRate: number;
  fatalFiveCategory: FatalFiveCategory;
  // Slider-specific
  sliderMin?: number;
  sliderMax?: number;
  sliderCorrectValue?: number;
  sliderUnit?: string;
}

// --- Category Types ---

export interface Category {
  id: string;
  name: string;
  slug: string;
  track: Track;
  handbookChapter: string | null;
  mapCity: string;
  mapOrder: number;
  icon: string;
  description: string;
  questionCount: number;
}

// --- User Types ---

export type LicenseType = "original" | "renewal" | "transfer";
export type AgeGroup = "teen" | "adult";
export type LicenseLevel = "learner" | "provisional" | "full";

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  licenseType: LicenseType;
  ageGroup: AgeGroup;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  licenseLevel: LicenseLevel;
  onboardingComplete: boolean;
  createdAt: string;
}

// --- Progress Types (Leitner Box System) ---

export type LeitnerBox = 1 | 2 | 3 | 4 | 5;

export interface UserProgress {
  id: string;
  userId: string;
  questionId: string;
  leitnerBox: LeitnerBox;
  timesSeen: number;
  timesCorrect: number;
  lastConfidence: Confidence | null;
  nextReview: string | null;
  lastReviewed: string | null;
}

// --- Session Types ---

export type SessionType =
  | "quick_quiz"
  | "practice"
  | "exam_sim"
  | "numbers_gauntlet"
  | "boss_battle"
  | "challenge_100"
  | "diagnostic";

export interface Session {
  id: string;
  userId: string;
  track: Track;
  sessionType: SessionType;
  startedAt: string;
  completedAt: string | null;
  totalQuestions: number;
  correctCount: number;
  scorePercent: number | null;
  livesRemaining: number;
  xpEarned: number;
}

export interface SessionAnswer {
  id: string;
  sessionId: string;
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  confidence: Confidence;
  timeSpentMs: number;
  answeredAt: string;
}

// --- Achievement Types ---

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: AchievementCriteria;
}

export interface AchievementCriteria {
  type: "category_mastery" | "streak" | "xp_total" | "perfect_session" | "boss_defeat" | "exam_pass";
  category?: string;
  threshold?: number;
  value?: number;
}

export interface UserAchievement {
  userId: string;
  achievementId: string;
  earnedAt: string;
}

// --- Game State Types ---

export interface GameState {
  lives: number;
  maxLives: number;
  currentXp: number;
  comboCount: number;
  comboMultiplier: number;
  questionsAnswered: number;
  questionsCorrect: number;
  sessionType: SessionType;
}

export interface QuizResult {
  question: Question;
  selectedAnswer: string;
  isCorrect: boolean;
  confidence: Confidence;
  timeSpentMs: number;
  xpEarned: number;
}

// --- Readiness Score ---

export interface ReadinessScore {
  overall: number; // 0-100
  byCategory: Record<string, number>;
  prediction: "not_ready" | "almost" | "ready" | "very_ready";
  weakAreas: string[];
  strongAreas: string[];
  recommendation: string;
}

// --- Road Trip Map ---

export interface MapStop {
  city: string;
  categorySlug: string;
  x: number; // SVG coordinates
  y: number;
  mastery: number; // 0-100
  locked: boolean;
  funFact: string;
}
