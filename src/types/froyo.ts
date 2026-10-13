export type MascotType =
  | 'flora'
  | 'fauna'
  | 'mythical'
  | 'mechanical'
  | 'chihuahua'
  | 'german_shepherd'
  | 'cupcake'
  | 'capybara'
  | 'pickle';

export type MascotHealthState = 'flourishing' | 'neutral' | 'degraded';

export type FocusMascotActivity = 'sleeping' | 'reading' | 'meditating';

export type FocusTimerMode = 'pomodoro' | 'custom' | 'stopwatch';

export interface FroyoUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  isAnonymous?: boolean;
}

export interface PriorityTag {
  id: string;
  name: string;
  color: string; // Hex color e.g. #FF85A1
  created_at: string;
}

export interface TaskList {
  id: string;
  name: string;
  icon: string;
  color: string;
  created_at: string;
}

export interface FroyoTask {
  id: string;
  parent_id: string | null;
  title: string;
  notes?: string;
  completed: boolean;
  due_date: string | null; // YYYY-MM-DD or null for standalone unscheduled tasks
  scheduled_time?: string | null; // HH:mm optional event time
  is_event?: boolean; // Plotted concurrently on calendar day blocks
  list_id: string | null; // null = Weekly Board, or standalone list ID
  tag_ids: string[];
  order: number;
  created_at: string;
  updated_at: string;
}

export interface FocusSessionLog {
  id: string;
  mode: FocusTimerMode;
  duration_minutes: number;
  duration_seconds: number;
  task_id: string | null;
  task_title: string | null;
  mascot_id: MascotType;
  activity: FocusMascotActivity;
  started_at: string;
  completed_at: string;
  date: string; // YYYY-MM-DD
}

export interface CustomThemeTokens {
  bgCanvas: string;
  bgSurface: string;
  bgElevated: string;
  borderSubtle: string;
  accentPrimary: string;
  accentSecondary: string;
  textPrimary: string;
  textMuted: string;
}

export interface UserPreferences {
  themeMode: 'pastel-pink' | 'dark' | 'custom';
  customTheme: CustomThemeTokens;
  activeMascot: MascotType;
  dailyFocusGoalMinutes: number;
  splitRatio: number; // Percentage width of left pane (30..70)
}

export interface MascotHealthMetrics {
  score: number; // H in [0, 100]
  state: MascotHealthState;
  completedToday: number;
  dueToday: number;
  todayRatio: number;
  completedThisWeek: number;
  dueThisWeek: number;
  weekRatio: number;
  overdueCount: number;
  overduePenalty: number;
}
