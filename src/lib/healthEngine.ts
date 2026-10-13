import { endOfWeek, format, isWithinInterval, parseISO, startOfWeek } from 'date-fns';
import { FroyoTask, MascotHealthMetrics, MascotHealthState } from '../types/froyo';

/**
 * Calculates the real-time Companion Mascot Health Score H in [0, 100]:
 * H = ((Completed Today / Due Today) * 50) + ((Completed This Week / Due This Week) * 50) - Overdue Penalty
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

  const dueTodayTasks = tasks.filter((t) => t.due_date === todayStr);
  const completedToday = dueTodayTasks.filter((t) => t.completed).length;
  const dueToday = dueTodayTasks.length;

  const dueThisWeekTasks = tasks.filter((t) => {
    if (!t.due_date) return false;
    try {
      const parsed = parseISO(t.due_date);
      return isWithinInterval(parsed, { start: weekStart, end: weekEnd });
    } catch {
      return false;
    }
  });
  const completedThisWeek = dueThisWeekTasks.filter((t) => t.completed).length;
  const dueThisWeek = dueThisWeekTasks.length;

  // Overdue tasks: due strictly before todayStr and not completed
  const overdueTasks = tasks.filter((t) => t.due_date && t.due_date < todayStr && !t.completed);
  const overdueCount = overdueTasks.length;
  const overduePenalty = overdueCount * 12;

  const todayRatio = dueToday > 0 ? completedToday / dueToday : 1;
  const weekRatio = dueThisWeek > 0 ? completedThisWeek / dueThisWeek : 1;

  const rawFormulaScore = todayRatio * 50 + weekRatio * 50 - overduePenalty;
  const clampedScore = Math.max(0, Math.min(100, Math.round(rawFormulaScore)));
  const finalScore =
    typeof overrideScore === 'number' ? Math.max(0, Math.min(100, Math.round(overrideScore))) : clampedScore;

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
    dueToday,
    todayRatio,
    completedThisWeek,
    dueThisWeek,
    weekRatio,
    overdueCount,
    overduePenalty,
  };
}
