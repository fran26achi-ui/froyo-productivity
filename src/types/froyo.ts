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

export type AccessoryId =
  | 'crown'
  | 'pixel_glasses'
  | 'nightcap'
  | 'pastel_aura'
  | 'coffee_cup';

export interface ShopAccessory {
  id: AccessoryId;
  name: string;
  category: string;
  cost: number;
  description: string;
  iconName: string;
}

export interface FroyoUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  isAnonymous?: boolean;
  coins?: number; // Virtual wallet balance
  purchased_accessories?: AccessoryId[]; // Array of purchased accessory IDs
  equipped_accessory?: AccessoryId | null; // Currently equipped accessory
  custom_theme?: CustomThemeTokens;
  theme_mode?: 'pastel-pink' | 'dark' | 'custom';
  fcm_tokens?: string[];
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
  updated_at?: string;
  is_calendar_linked?: boolean; // When true, tasks prompt for date/time and sync to calendar pane
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
  is_calendar_event?: boolean; // Created directly on the calendar; excluded from general to-do clutter
  is_all_day?: boolean; // When true, event spans whole day without a specific hour
  list_id: string | null; // null = Weekly Board, or standalone list ID
  tag_ids: string[];
  order: number;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
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
  equippedAccessory?: AccessoryId | null;
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

export interface BroadcastNotification {
  id: string;
  title: string;
  body: string;
  sender_email: string; // 'maker@froyo.app'
  created_at: string;
  target?: 'all' | string;
  priority?: 'normal' | 'high';
}

export interface CoinGainEvent {
  id: string;
  amount: number;
  reason: string;
}
