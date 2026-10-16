import { endOfWeek, format, isWithinInterval, parseISO, startOfWeek } from 'date-fns';
import { FroyoTask, MascotHealthMetrics, MascotHealthState } from '../types/froyo';

/**
 * Calculates the real-time Companion Mascot Health Score H in [0, 100]:
 * H = ((Completed Today / Due Today) * 50) + ((Completed This Week / Due This Week) * 50) - Overdue Penalty
 *
 * Universal Mascot Health:
 * Checking off tasks from ANY list—whether linked to the calendar or completely unlinked—
 * feeds into the daily and weekly progress metrics, ensuring continuous gamification.
 *
 * State thresholds:
 * - Flourishing: H >= 75
 * - Neutral: 40 <= H < 75
 * - Degraded ("Rotting"): H < 40
 */
export function calculateMascotHealth(
  tasks: FroyoTask[],
  referenceDate: Date = new Date(),
  overrideScore?: number | null
): MascotHealthMetrics {
  const todayStr = format(referenceDate, 'yyyy-MM-dd');
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 });

  // 1. Daily Calculation (Universal across all lists)
  // Tasks with explicit due date of today
  const datedDueToday = tasks.filter((t) => t.due_date === todayStr);
  const completedDatedToday = datedDueToday.filter((t) => t.completed);

  // Unlinked / standalone tasks completed today (via completed_at or updated_at or unscheduled completed)
  const unlinkedCompletedToday = tasks.filter((t) => {
    if (t.due_date === todayStr) return false; // Already counted in datedDueToday
    if (!t.completed) return false;
    const completedDate = t.completed_at?.slice(0, 10) || t.updated_at?.slice(0, 10);
    return completedDate === todayStr || (!t.due_date && t.completed);
  });

  const completedToday = completedDatedToday.length + unlinkedCompletedToday.length;
  // Denominator reflects dated commitments plus any spontaneous tasks accomplished today
  const dueToday = Math.max(datedDueToday.length + unlinkedCompletedToday.length, completedToday > 0 ? completedToday : 0);

  // 2. Weekly Calculation (Universal across all lists)
  const datedDueThisWeek = tasks.filter((t) => {
    if (!t.due_date) return false;
    try {
      const parsed = parseISO(t.due_date);
      return isWithinInterval(parsed, { start: weekStart, end: weekEnd });
    } catch {
      return false;
    }
  });
  const completedDatedWeek = datedDueThisWeek.filter((t) => t.completed);

  // Unlinked / standalone tasks completed within current week boundary
  const unlinkedCompletedWeek = tasks.filter((t) => {
    if (t.due_date && isWithinInterval(parseISO(t.due_date), { start: weekStart, end: weekEnd })) {
      return false; // Already counted above
    }
    if (!t.completed) return false;
    try {
      const timestamp = t.completed_at || t.updated_at;
      if (!timestamp) return false;
      const parsed = parseISO(timestamp.slice(0, 10));
      return isWithinInterval(parsed, { start: weekStart, end: weekEnd });
    } catch {
      return !t.due_date && t.completed;
    }
  });

  const completedThisWeek = completedDatedWeek.length + unlinkedCompletedWeek.length;
  const dueThisWeek = Math.max(
    datedDueThisWeek.length + unlinkedCompletedWeek.length,
    completedThisWeek > 0 ? completedThisWeek : 0
  );

  // 3. Overdue Penalty: dated tasks strictly before today and not completed
  const overdueTasks = tasks.filter((t) => t.due_date && t.due_date < todayStr && !t.completed);
  const overdueCount = overdueTasks.length;
  const overduePenalty = overdueCount * 12;

  // Ratios: If nothing is due, default to 100% (1.0) so user isn't penalized for a clear desk
  const todayRatio = dueToday > 0 ? completedToday / dueToday : 1;
  const weekRatio = dueThisWeek > 0 ? completedThisWeek / dueThisWeek : 1;

  // Raw score with clamp [0, 100]
  const rawFormulaScore = todayRatio * 50 + weekRatio * 50 - overduePenalty;
  const clampedScore = Math.max(0, Math.min(100, Math.round(rawFormulaScore)));
  const finalScore =
    typeof overrideScore === 'number'
      ? Math.max(0, Math.min(100, Math.round(overrideScore)))
      : clampedScore;

  let state: MascotHealthState = 'neutral';
  if (finalScore >= 75) {
    state = 'flourishing';
  } else if (finalScore < 40) {
    state = 'degraded';
  }

  return {
    score: finalScore,
    state,
    completedToday,
    dueToday: Math.max(dueToday, completedToday),
    todayRatio: Math.min(1, todayRatio),
    completedThisWeek,
    dueThisWeek: Math.max(dueThisWeek, completedThisWeek),
    weekRatio: Math.min(1, weekRatio),
    overdueCount,
    overduePenalty,
  };
}
