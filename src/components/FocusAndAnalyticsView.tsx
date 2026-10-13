import React, { useEffect, useRef, useState } from 'react';
import { format, subDays } from 'date-fns';
import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  FocusMascotActivity,
  FocusSessionLog,
  FocusTimerMode,
  FroyoTask,
  MascotHealthState,
  MascotType,
} from '../types/froyo';
import { MascotCompanion, MASCOT_CATALOG } from './MascotCompanion';

interface FocusAndAnalyticsViewProps {
  tasks: FroyoTask[];
  sessions: FocusSessionLog[];
  activeMascot: MascotType;
  healthState: MascotHealthState;
  healthScore: number;
  dailyFocusGoalMinutes: number;
  onUpdateDailyGoal: (minutes: number) => void;
  selectedTaskForFocus: FroyoTask | null;
  onSelectTaskForFocus: (task: FroyoTask | null) => void;
  onLogFocusSession: (session: Omit<FocusSessionLog, 'id'>) => void;
  isAmbientFocusActive: boolean;
  onAmbientFocusChange: (active: boolean) => void;
}

export const FocusAndAnalyticsView: React.FC<FocusAndAnalyticsViewProps> = ({
  tasks,
  sessions,
  activeMascot,
  healthState,
  healthScore,
  dailyFocusGoalMinutes,
  onUpdateDailyGoal,
  selectedTaskForFocus,
  onSelectTaskForFocus,
  onLogFocusSession,
  isAmbientFocusActive,
  onAmbientFocusChange,
}) => {
  const [mode, setMode] = useState<FocusTimerMode>('pomodoro');
  const [customMinutes, setCustomMinutes] = useState<number>(25);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [mascotActivity, setMascotActivity] = useState<FocusMascotActivity>('sleeping');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);

  const sessionStartRef = useRef<string | null>(null);
  const targetTimestampRef = useRef<number | null>(null);
  const startEpochRef = useRef<number | null>(null);

  // Sync initial timer duration when switching modes while paused
  useEffect(() => {
    if (isRunning) return;
    if (mode === 'pomodoro') {
      setSecondsRemaining(25 * 60);
    } else if (mode === 'custom') {
      setSecondsRemaining(Math.max(1, customMinutes * 60));
    } else {
      setStopwatchSeconds(0);
    }
  }, [mode, customMinutes, isRunning]);

  // Toggle body class for low-stimulus ambient dark canvas
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.toggle('froyo-ambient-focus', isAmbientFocusActive);
    return () => {
      document.body.classList.remove('froyo-ambient-focus');
    };
  }, [isAmbientFocusActive]);

  const playCompletionChime = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(528, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.7);
    } catch {
      // Ignore audio errors in headless browsers
    }
  };

  const handleCompleteSession = (elapsedSecsOverride?: number) => {
    const now = new Date();
    const totalConfiguredSecs =
      mode === 'pomodoro' ? 25 * 60 : mode === 'custom' ? customMinutes * 60 : stopwatchSeconds;
    const actualSecs =
      typeof elapsedSecsOverride === 'number'
        ? elapsedSecsOverride
        : mode === 'stopwatch'
        ? Math.max(60, stopwatchSeconds)
        : Math.max(60, totalConfiguredSecs - secondsRemaining || totalConfiguredSecs);

    const durationMins = Math.max(1, Math.round(actualSecs / 60));

    onLogFocusSession({
      mode,
      duration_minutes: durationMins,
      duration_seconds: actualSecs,
      task_id: selectedTaskForFocus?.id || null,
      task_title: selectedTaskForFocus?.title || 'Deep Focus Block',
      mascot_id: activeMascot,
      activity: mascotActivity,
      started_at: sessionStartRef.current || new Date(now.getTime() - actualSecs * 1000).toISOString(),
      completed_at: now.toISOString(),
      date: format(now, 'yyyy-MM-dd'),
    });

    playCompletionChime();
    setIsRunning(false);
    onAmbientFocusChange(false);
    if (mode === 'pomodoro') setSecondsRemaining(25 * 60);
    if (mode === 'custom') setSecondsRemaining(customMinutes * 60);
    if (mode === 'stopwatch') setStopwatchSeconds(0);
  };

  // Drift-compensated HTML5 timer loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = window.setInterval(() => {
      const nowMs = Date.now();
      if (mode === 'stopwatch') {
        if (startEpochRef.current) {
          setStopwatchSeconds(Math.floor((nowMs - startEpochRef.current) / 1000));
        }
      } else {
        if (targetTimestampRef.current) {
          const remaining = Math.max(0, Math.ceil((targetTimestampRef.current - nowMs) / 1000));
          setSecondsRemaining(remaining);
          if (remaining <= 0) {
            window.clearInterval(interval);
            const configuredSecs = mode === 'pomodoro' ? 25 * 60 : customMinutes * 60;
            handleCompleteSession(configuredSecs);
          }
        }
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [isRunning, mode, customMinutes]);

  const handleStartPause = () => {
    if (isRunning) {
      setIsRunning(false);
      onAmbientFocusChange(false);
      return;
    }

    sessionStartRef.current = new Date().toISOString();
    if (mode === 'stopwatch') {
      startEpochRef.current = Date.now() - stopwatchSeconds * 1000;
    } else {
      targetTimestampRef.current = Date.now() + secondsRemaining * 1000;
    }
    setIsRunning(true);
    onAmbientFocusChange(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    onAmbientFocusChange(false);
    if (mode === 'pomodoro') setSecondsRemaining(25 * 60);
    else if (mode === 'custom') setSecondsRemaining(customMinutes * 60);
    else setStopwatchSeconds(0);
  };

  const displaySeconds = mode === 'stopwatch' ? stopwatchSeconds : secondsRemaining;
  const formattedMinutes = String(Math.floor(displaySeconds / 60)).padStart(2, '0');
  const formattedSecs = String(displaySeconds % 60).padStart(2, '0');

  const totalSecsForRing =
    mode === 'pomodoro'
      ? 25 * 60
      : mode === 'custom'
      ? Math.max(1, customMinutes * 60)
      : 60 * 60;
  const ringProgress =
    mode === 'stopwatch'
      ? Math.min(1, (stopwatchSeconds % 3600) / 3600)
      : 1 - secondsRemaining / totalSecsForRing;

  // Compute Analytics Metrics
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayMinutes = sessions
    .filter((s) => s.date === todayStr)
    .reduce((acc, s) => acc + s.duration_minutes, 0);

  const totalFocusMinutes = sessions.reduce((acc, s) => acc + s.duration_minutes, 0);
  const totalFocusHours = (totalFocusMinutes / 60).toFixed(1);
  const dailyGoalPct = Math.min(100, Math.round((todayMinutes / Math.max(1, dailyFocusGoalMinutes)) * 100));

  // Last 7 days trend
  const last7Days = Array.from({ length: 7 }, (_, idx) => {
    const d = subDays(new Date(), 6 - idx);
    const dStr = format(d, 'yyyy-MM-dd');
    const mins = sessions
      .filter((s) => s.date === dStr)
      .reduce((sum, s) => sum + s.duration_minutes, 0);
    return {
      dateStr: dStr,
      label: format(d, 'EEE'),
      minutes: mins,
      hours: +(mins / 60).toFixed(1),
    };
  });

  // 28-Day Session Distribution Heatmap
  const heatmapDays = Array.from({ length: 28 }, (_, idx) => {
    const d = subDays(new Date(), 27 - idx);
    const dStr = format(d, 'yyyy-MM-dd');
    const mins = sessions
      .filter((s) => s.date === dStr)
      .reduce((sum, s) => sum + s.duration_minutes, 0);
    return { dateStr: dStr, minutes: mins };
  });

  // Calculate current daily streak
  let streakDays = 0;
  for (let i = 0; i < 30; i++) {
    const dStr = format(subDays(new Date(), i), 'yyyy-MM-dd');
    const hasSession = sessions.some((s) => s.date === dStr && s.duration_minutes > 0);
    if (hasSession) streakDays++;
    else if (i > 0) break;
  }

  return (
    <div
      className="h-full overflow-y-auto froyo-scroll space-y-6 pb-8"
      data-testid="focus-workspace-view"
      data-ambient-active={String(isAmbientFocusActive)}
    >
      {/* Top Grid: Ambient Focus Timer Canvas + Companion Mascot Loop */}
      <div
        className={`rounded-3xl border p-6 sm:p-8 transition-all duration-500 ${
          isAmbientFocusActive
            ? 'bg-[#120D10] border-[#352630] text-[#F7EDF0] shadow-2xl'
            : 'bg-froyo-surface border-froyo-border shadow-froyo-md'
        }`}
        data-testid="ambient-focus-stage"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Timer Controls & SVG Progress Ring */}
          <div className="lg:col-span-7 flex flex-col items-center text-center space-y-5">
            {/* Timer Mode Selector */}
            <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-froyo-elevated border border-froyo-border">
              {(
                [
                  { id: 'pomodoro', label: 'Pomodoro 25/5' },
                  { id: 'custom', label: 'Custom Countdown' },
                  { id: 'stopwatch', label: 'Stopwatch' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  data-testid={`timer-mode-${tab.id}`}
                  onClick={() => {
                    setIsRunning(false);
                    onAmbientFocusChange(false);
                    setMode(tab.id);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    mode === tab.id
                      ? 'bg-froyo-accent text-white shadow-sm'
                      : 'text-froyo-muted hover:text-froyo-text'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {mode === 'custom' && !isRunning && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-froyo-muted font-medium">Duration (mins):</span>
                {[1, 15, 25, 45, 60].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setCustomMinutes(m)}
                    className={`px-2.5 py-1 rounded-lg font-semibold border ${
                      customMinutes === m
                        ? 'bg-froyo-accent text-white border-froyo-accent'
                        : 'bg-froyo-elevated text-froyo-text border-froyo-border'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            )}

            {/* Circular Progress Ring & Digital Readout */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 220 220">
                <circle
                  cx="110"
                  cy="110"
                  r="96"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-froyo-border opacity-40"
                />
                <circle
                  cx="110"
                  cy="110"
                  r="96"
                  fill="none"
                  stroke="var(--accent-primary)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 96}
                  strokeDashoffset={2 * Math.PI * 96 * (1 - Math.max(0.02, ringProgress))}
                  className="transition-all duration-300"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] font-bold uppercase tracking-widest text-froyo-accent mb-1">
                  {isAmbientFocusActive ? 'Low-Stimulus Ambient Focus' : 'Ready to Focus'}
                </span>
                <div
                  data-testid="focus-timer-display"
                  className="font-mono font-bold text-5xl tracking-tight"
                >
                  {formattedMinutes}:{formattedSecs}
                </div>
                <p className="text-xs text-froyo-muted mt-2 max-w-[180px] truncate">
                  {selectedTaskForFocus
                    ? `Task: ${selectedTaskForFocus.title}`
                    : 'Deep Work Session'}
                </p>
              </div>
            </div>

            {/* Active Task Link Selector */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-md">
              <select
                aria-label="Bind focus session to task"
                data-testid="focus-task-select"
                value={selectedTaskForFocus?.id || ''}
                onChange={(e) => {
                  const found = tasks.find((t) => t.id === e.target.value) || null;
                  onSelectTaskForFocus(found);
                }}
                className="text-xs px-3 py-2 rounded-xl bg-froyo-elevated border border-froyo-border text-froyo-text focus:outline-none focus:ring-2 focus:ring-froyo-accent"
              >
                <option value="">General Focus Session (No specific task)</option>
                {tasks
                  .filter((t) => !t.completed)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
              </select>

              <button
                type="button"
                onClick={() => setSoundEnabled((prev) => !prev)}
                className="p-2 rounded-xl bg-froyo-elevated border border-froyo-border text-froyo-muted hover:text-froyo-accent transition-colors"
                title="Toggle completion chime"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>

            {/* Primary Timer Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                data-testid="start-focus-timer-btn"
                onClick={handleStartPause}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm bg-froyo-accent text-white shadow-froyo-md hover:opacity-95 transition-all"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause Session
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    Start Focus Session
                  </>
                )}
              </button>

              {(isRunning || stopwatchSeconds > 0 || secondsRemaining < totalSecsForRing) && (
                <button
                  type="button"
                  data-testid="complete-focus-session-btn"
                  onClick={() => handleCompleteSession(25 * 60)}
                  className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl font-semibold text-xs bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Complete & Log Session
                </button>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="p-3 rounded-2xl bg-froyo-elevated border border-froyo-border text-froyo-muted hover:text-froyo-text transition-colors"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Ambient Companion Mascot Sanctuary */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-3xl bg-froyo-elevated/50 border border-froyo-border text-center">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-froyo-accent mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Companion Focus Loop · {MASCOT_CATALOG[activeMascot].name}
            </div>

            <MascotCompanion
              mascot={activeMascot}
              healthState={healthState}
              healthScore={healthScore}
              size="xl"
              focusActivity={mascotActivity}
            />

            <p className="text-xs text-froyo-muted mt-3 max-w-xs">
              While your timer runs, {MASCOT_CATALOG[activeMascot].name} keeps you calm company in a
              distraction-free dark sanctuary.
            </p>

            {/* Activity Loop Selector */}
            <div className="mt-4 inline-flex items-center gap-1.5 p-1 rounded-xl bg-froyo-surface border border-froyo-border">
              {(
                [
                  { id: 'sleeping', label: 'Sleeping', icon: Moon },
                  { id: 'reading', label: 'Reading', icon: BookOpen },
                  { id: 'meditating', label: 'Meditating', icon: Sparkles },
                ] as const
              ).map((act) => {
                const Icon = act.icon;
                return (
                  <button
                    key={act.id}
                    type="button"
                    data-testid={`focus-activity-${act.id}`}
                    onClick={() => setMascotActivity(act.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      mascotActivity === act.id
                        ? 'bg-froyo-accent text-white'
                        : 'text-froyo-muted hover:text-froyo-text'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {act.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Historical Analytics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="analytics-kpi-cards">
        <div className="rounded-3xl bg-froyo-surface border border-froyo-border p-5 shadow-froyo-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-froyo-muted uppercase tracking-wider">
              Total Focus Hours
            </span>
            <div
              className="text-3xl font-display font-extrabold text-froyo-text mt-1"
              data-testid="analytics-total-hours"
            >
              {totalFocusHours} hrs
            </div>
            <span className="text-xs text-froyo-accent font-medium">
              {sessions.length} logged sessions ({totalFocusMinutes} mins)
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-froyo-accent/15 text-froyo-accent flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="rounded-3xl bg-froyo-surface border border-froyo-border p-5 shadow-froyo-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-froyo-muted uppercase tracking-wider">
              Daily Target vs Actual
            </span>
            <div className="text-3xl font-display font-extrabold text-froyo-text mt-1">
              {todayMinutes} / {dailyFocusGoalMinutes}m
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-emerald-500 font-semibold">{dailyGoalPct}% of goal</span>
              <button
                type="button"
                onClick={() =>
                  onUpdateDailyGoal(dailyFocusGoalMinutes === 120 ? 180 : 120)
                }
                className="text-[11px] underline text-froyo-muted hover:text-froyo-accent"
              >
                Adjust target
              </button>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
        </div>

        <div className="rounded-3xl bg-froyo-surface border border-froyo-border p-5 shadow-froyo-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-froyo-muted uppercase tracking-wider">
              Historical Focus Streak
            </span>
            <div className="text-3xl font-display font-extrabold text-froyo-text mt-1">
              {streakDays} Days
            </div>
            <span className="text-xs text-amber-500 font-semibold">
              Consistent daily momentum
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
            <Flame className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts & Distribution Heatmap Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 7-Day Focus Trend Bar Chart */}
        <div className="lg:col-span-7 rounded-3xl bg-froyo-surface border border-froyo-border p-6 shadow-froyo-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-base text-froyo-text flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-froyo-accent" />
                Weekly Focus Hours Trend
              </h3>
              <p className="text-xs text-froyo-muted">
                Tracked deep work minutes over the past 7 days
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-froyo-elevated text-froyo-accent">
              Target: {dailyFocusGoalMinutes}m/day
            </span>
          </div>

          <div className="grid grid-cols-7 gap-3 items-end h-44 pt-4 px-2">
            {last7Days.map((item) => {
              const heightPct = Math.min(
                100,
                Math.max(8, Math.round((item.minutes / Math.max(120, dailyFocusGoalMinutes)) * 100))
              );
              return (
                <div key={item.dateStr} className="flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[11px] font-mono font-semibold text-froyo-muted">
                    {item.minutes}m
                  </span>
                  <div className="w-full max-w-[38px] bg-froyo-elevated rounded-xl h-28 flex items-end p-1 overflow-hidden">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full rounded-lg bg-gradient-to-t from-froyo-accent to-froyo-accent-soft transition-all duration-500"
                    />
                  </div>
                  <span className="text-xs font-bold text-froyo-text">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 28-Day Session Distribution Heatmap */}
        <div className="lg:col-span-5 rounded-3xl bg-froyo-surface border border-froyo-border p-6 shadow-froyo-sm flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-base text-froyo-text flex items-center gap-2">
              <Activity className="w-4 h-4 text-froyo-accent" />
              Session Distribution Heatmap (28d)
            </h3>
            <p className="text-xs text-froyo-muted mb-4">
              Daily focus intensity matrix synced with Firestore
            </p>

            <div className="grid grid-cols-7 gap-2" data-testid="analytics-heatmap">
              {heatmapDays.map((cell) => {
                const intensity =
                  cell.minutes === 0
                    ? 'bg-froyo-elevated'
                    : cell.minutes < 45
                    ? 'bg-froyo-accent/30'
                    : cell.minutes < 90
                    ? 'bg-froyo-accent/65'
                    : 'bg-froyo-accent';
                return (
                  <div
                    key={cell.dateStr}
                    title={`${cell.dateStr}: ${cell.minutes} mins focused`}
                    className={`h-8 rounded-xl border border-froyo-border/60 transition-transform hover:scale-105 ${intensity}`}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-froyo-muted pt-4 border-t border-froyo-border mt-4">
            <span>Less Focus</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-froyo-elevated border border-froyo-border" />
              <span className="w-3 h-3 rounded bg-froyo-accent/30" />
              <span className="w-3 h-3 rounded bg-froyo-accent/65" />
              <span className="w-3 h-3 rounded bg-froyo-accent" />
            </div>
            <span>Peak Flow (90m+)</span>
          </div>
        </div>
      </div>

      {/* Persisted Focus Session Logs List */}
      <div className="rounded-3xl bg-froyo-surface border border-froyo-border p-6 shadow-froyo-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-base text-froyo-text flex items-center gap-2">
            <Award className="w-4 h-4 text-froyo-accent" />
            Persisted Focus Session History (`users/uid/focus_sessions`)
          </h3>
          <span
            className="text-xs font-semibold text-froyo-muted"
            data-testid="focus-session-count"
          >
            {sessions.length} total logs
          </span>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto froyo-scroll" data-testid="focus-session-log-list">
          {sessions
            .slice()
            .reverse()
            .map((log) => (
              <div
                key={log.id}
                data-testid={`focus-log-item-${log.id}`}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-froyo-elevated/60 border border-froyo-border text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] bg-froyo-accent/15 text-froyo-accent">
                    {log.mode}
                  </span>
                  <span className="font-semibold text-froyo-text">
                    {log.task_title || 'Deep Focus Session'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-froyo-muted">
                  <span className="font-mono font-bold text-froyo-text">
                    {log.duration_minutes} mins
                  </span>
                  <span>{log.date}</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
