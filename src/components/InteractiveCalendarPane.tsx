import React, { useState } from 'react';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FilterX,
  Plus,
  Sparkles,
} from 'lucide-react';
import { FroyoTask, PriorityTag, TaskList } from '../types/froyo';

interface InteractiveCalendarPaneProps {
  tasks: FroyoTask[];
  tags: PriorityTag[];
  lists?: TaskList[];
  selectedDate: string | null;
  onSelectDate: (dateStr: string | null) => void;
  draggedTaskId: string | null;
  onDropTaskOnDate: (taskId: string, targetDateStr: string) => void;
  onQuickCreateDatedItem: (
    title: string,
    dateStr: string,
    isEvent: boolean,
    scheduledTime: string,
    isAllDay?: boolean
  ) => void;
  onToggleTask: (taskId: string) => void;
}

export const InteractiveCalendarPane: React.FC<InteractiveCalendarPaneProps> = ({
  tasks,
  tags,
  lists = [],
  selectedDate,
  onSelectDate,
  draggedTaskId,
  onDropTaskOnDate,
  onQuickCreateDatedItem,
  onToggleTask,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [quickAddDate, setQuickAddDate] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickTime, setQuickTime] = useState('10:00');
  const [quickIsEvent, setQuickIsEvent] = useState(true);
  const [quickIsAllDay, setQuickIsAllDay] = useState(false);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const currentWeekStart = startOfWeek(currentMonth, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(currentMonth, { weekStartsOn: 1 });

  const days =
    viewMode === 'month'
      ? eachDayOfInterval({ start: calendarStart, end: calendarEnd })
      : eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd });

  const weekDaysHeader = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dateStr: string) => {
    e.preventDefault();
    setDragOverDate(null);
    const transferredId = e.dataTransfer?.getData('text/plain') || draggedTaskId;
    if (transferredId) {
      onDropTaskOnDate(transferredId, dateStr);
    }
  };

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddDate || !quickTitle.trim()) return;
    onQuickCreateDatedItem(
      quickTitle.trim(),
      quickAddDate,
      quickIsEvent,
      quickIsAllDay ? '' : quickTime,
      quickIsAllDay
    );
    setQuickTitle('');
    setQuickAddDate(null);
  };

  return (
    <div
      className="h-full flex flex-col bg-froyo-surface/70 rounded-3xl border border-froyo-border shadow-froyo-md overflow-hidden"
      data-testid="calendar-pane"
    >
      {/* Calendar Header Bar */}
      <div className="px-5 py-4 border-b border-froyo-border flex flex-wrap items-center justify-between gap-3 bg-froyo-surface">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-froyo-accent/15 text-froyo-accent flex items-center justify-center">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-froyo-text leading-tight">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <p className="text-xs text-froyo-muted">
              Drag tasks onto any day card to reschedule · Click a day to filter
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedDate && (
            <button
              type="button"
              data-testid="clear-calendar-filter-btn"
              onClick={() => onSelectDate(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-froyo-accent text-white shadow-sm hover:opacity-95 transition-all"
            >
              <FilterX className="w-3.5 h-3.5" />
              Filtered: {selectedDate}
            </button>
          )}

          {/* Month / Week View Switcher */}
          <div className="inline-flex rounded-xl bg-froyo-elevated p-1 border border-froyo-border">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'month'
                  ? 'bg-froyo-surface text-froyo-text shadow-sm'
                  : 'text-froyo-muted hover:text-froyo-text'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'week'
                  ? 'bg-froyo-surface text-froyo-text shadow-sm'
                  : 'text-froyo-muted hover:text-froyo-text'
              }`}
            >
              Week
            </button>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() =>
                setCurrentMonth((prev) =>
                  viewMode === 'month' ? subMonths(prev, 1) : addDays(prev, -7)
                )
              }
              className="p-2 rounded-xl hover:bg-froyo-elevated text-froyo-muted hover:text-froyo-text transition-colors"
              aria-label="Previous period"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date())}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-froyo-elevated text-froyo-text border border-froyo-border transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() =>
                setCurrentMonth((prev) =>
                  viewMode === 'month' ? addMonths(prev, 1) : addDays(prev, 7)
                )
              }
              className="p-2 rounded-xl hover:bg-froyo-elevated text-froyo-muted hover:text-froyo-text transition-colors"
              aria-label="Next period"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Scheduled Event / Dated Task Composer */}
      {quickAddDate && (
        <form
          onSubmit={handleQuickAddSubmit}
          className="px-5 py-3 bg-froyo-elevated/90 border-b border-froyo-border flex flex-wrap items-center gap-2"
        >
          <span className="text-xs font-semibold text-froyo-accent">
            Schedule on {quickAddDate}:
          </span>
          <input
            type="text"
            autoFocus
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Event or task title..."
            className="flex-1 min-w-[160px] text-xs px-3 py-1.5 rounded-xl bg-froyo-surface border border-froyo-border text-froyo-text focus:outline-none focus:ring-2 focus:ring-froyo-accent"
          />
          {!quickIsAllDay && (
            <input
              type="time"
              value={quickTime}
              onChange={(e) => setQuickTime(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-froyo-surface border border-froyo-border text-froyo-text"
            />
          )}
          <label className="inline-flex items-center gap-1.5 text-xs text-froyo-text cursor-pointer">
            <input
              type="checkbox"
              checked={quickIsAllDay}
              onChange={(e) => setQuickIsAllDay(e.target.checked)}
              className="froyo-checkbox rounded"
            />
            Full Day
          </label>
          <label className="inline-flex items-center gap-1.5 text-xs text-froyo-text cursor-pointer">
            <input
              type="checkbox"
              checked={quickIsEvent}
              onChange={(e) => setQuickIsEvent(e.target.checked)}
              className="froyo-checkbox rounded"
            />
            Calendar Event
          </label>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-froyo-accent text-white hover:opacity-95"
          >
            Plot on Grid
          </button>
          <button
            type="button"
            onClick={() => setQuickAddDate(null)}
            className="px-2 py-1.5 text-xs text-froyo-muted hover:text-froyo-text"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 border-b border-froyo-border bg-froyo-elevated/40">
        {weekDaysHeader.map((dayName) => (
          <div
            key={dayName}
            className="py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-froyo-muted"
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Scrollable Synchronized Calendar Overlay Grid */}
      <div className="flex-1 overflow-y-auto froyo-scroll p-3">
        <div
          className={`grid grid-cols-7 gap-2 ${
            viewMode === 'week' ? 'min-h-[420px]' : 'auto-rows-[minmax(112px,1fr)]'
          }`}
        >
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = dateStr === todayStr;
            const isSelected = selectedDate === dateStr;
            const isDragTarget = dragOverDate === dateStr;

            const linkedListIds = new Set(
              lists.filter((l) => l.is_calendar_linked).map((l) => l.id)
            );
            const dayItems = tasks.filter((t) => {
              if (t.due_date !== dateStr) return false;
              // 1. Standalone calendar event plotted directly on calendar
              if (t.is_calendar_event || t.is_event) return true;
              // 2. Weekly To-Do Workspace task
              if (t.list_id === null) return true;
              // 3. Task belonging to an explicitly calendar-linked list
              if (linkedListIds.has(t.list_id)) return true;
              return false;
            });

            return (
              <div
                key={dateStr}
                data-testid={`calendar-day-${dateStr}`}
                data-date={dateStr}
                onClick={() => onSelectDate(isSelected ? null : dateStr)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverDate !== dateStr) setDragOverDate(dateStr);
                }}
                onDragLeave={() => {
                  if (dragOverDate === dateStr) setDragOverDate(null);
                }}
                onDrop={(e) => handleDrop(e, dateStr)}
                className={`group/day relative flex flex-col rounded-2xl p-2.5 border transition-all cursor-pointer select-none ${
                  isDragTarget
                    ? 'border-2 border-froyo-accent bg-froyo-accent/15 scale-[1.02] shadow-froyo-md'
                    : isSelected
                    ? 'border-2 border-froyo-accent bg-froyo-elevated/90 shadow-froyo-sm'
                    : isCurrentMonth
                    ? 'border-froyo-border bg-froyo-surface hover:border-froyo-accent/60'
                    : 'border-froyo-border/50 bg-froyo-canvas/40 opacity-60'
                }`}
              >
                {/* Day Card Top Row */}
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-bold inline-flex items-center justify-center ${
                      isToday
                        ? 'bg-froyo-accent text-white shadow-sm'
                        : isSelected
                        ? 'text-froyo-accent font-extrabold'
                        : 'text-froyo-text'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuickAddDate(dateStr);
                    }}
                    title={`Plot event/task on ${dateStr}`}
                    className="opacity-0 group-hover/day:opacity-100 p-1 rounded-lg hover:bg-froyo-elevated text-froyo-muted hover:text-froyo-accent transition-opacity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Plotted Tasks & Concurrent Events */}
                <div className="space-y-1 overflow-y-auto max-h-28 pr-0.5">
                  {dayItems.map((item) => {
                    const primaryTag = tags.find((tg) => item.tag_ids.includes(tg.id));
                    const pillColor = primaryTag?.color || '#FF85A1';

                    return (
                      <div
                        key={item.id}
                        data-testid={`calendar-plotted-item-${item.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTask(item.id);
                        }}
                        style={{
                          borderLeftColor: pillColor,
                        }}
                        className={`px-2 py-1 rounded-lg text-[11px] font-medium border-l-[3px] truncate flex items-center gap-1 transition-all ${
                          item.is_event
                            ? 'bg-froyo-accent/15 text-froyo-text font-semibold'
                            : item.completed
                            ? 'bg-froyo-elevated/60 text-froyo-muted line-through opacity-70'
                            : 'bg-froyo-elevated text-froyo-text hover:opacity-90'
                        }`}
                        title={`${item.title}${item.scheduled_time ? ` (${item.scheduled_time})` : ''}`}
                      >
                        {item.is_event ? (
                          <Clock className="w-2.5 h-2.5 text-froyo-accent flex-shrink-0" />
                        ) : item.completed ? (
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <Sparkles
                            className="w-2.5 h-2.5 flex-shrink-0"
                            style={{ color: pillColor }}
                          />
                        )}
                        <span className="truncate">
                          {item.scheduled_time ? `${item.scheduled_time} ` : ''}
                          {item.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
