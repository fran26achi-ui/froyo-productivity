import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  GripVertical,
  Plus,
  Sparkles,
  Tag as TagIcon,
  Trash2,
} from 'lucide-react';
import { FroyoTask, PriorityTag } from '../types/froyo';
import { getAccessibleTagStyles } from '../lib/theme';

interface RecursiveTaskTreeProps {
  tasks: FroyoTask[];
  parentId: string | null;
  depth?: number;
  tags: PriorityTag[];
  isDark: boolean;
  onToggleTask: (taskId: string) => void;
  onAddSubtask: (parentId: string, title: string, tagIds: string[]) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTaskTag: (taskId: string, tagId: string) => void;
  onDragStartTask: (taskId: string) => void;
  onStartFocusOnTask?: (task: FroyoTask) => void;
}

export const RecursiveTaskTree: React.FC<RecursiveTaskTreeProps> = ({
  tasks,
  parentId,
  depth = 0,
  tags,
  isDark,
  onToggleTask,
  onAddSubtask,
  onDeleteTask,
  onToggleTaskTag,
  onDragStartTask,
  onStartFocusOnTask,
}) => {
  const children = tasks
    .filter((t) => (t.parent_id ?? null) === parentId)
    .sort((a, b) => a.order - b.order || a.created_at.localeCompare(b.created_at));

  if (children.length === 0) return null;

  return (
    <div
      className={
        depth > 0
          ? 'pl-5 ml-2.5 border-l-2 border-froyo-accent/25 space-y-2 mt-2'
          : 'space-y-2.5'
      }
      data-testid={`task-tree-level-${depth}`}
    >
      <AnimatePresence initial={false}>
        {children.map((task) => (
          <TaskTreeNode
            key={task.id}
            task={task}
            allTasks={tasks}
            depth={depth}
            tags={tags}
            isDark={isDark}
            onToggleTask={onToggleTask}
            onAddSubtask={onAddSubtask}
            onDeleteTask={onDeleteTask}
            onToggleTaskTag={onToggleTaskTag}
            onDragStartTask={onDragStartTask}
            onStartFocusOnTask={onStartFocusOnTask}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface TaskTreeNodeProps {
  task: FroyoTask;
  allTasks: FroyoTask[];
  depth: number;
  tags: PriorityTag[];
  isDark: boolean;
  onToggleTask: (taskId: string) => void;
  onAddSubtask: (parentId: string, title: string, tagIds: string[]) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTaskTag: (taskId: string, tagId: string) => void;
  onDragStartTask: (taskId: string) => void;
  onStartFocusOnTask?: (task: FroyoTask) => void;
}

const TaskTreeNode: React.FC<TaskTreeNodeProps> = ({
  task,
  allTasks,
  depth,
  tags,
  isDark,
  onToggleTask,
  onAddSubtask,
  onDeleteTask,
  onToggleTaskTag,
  onDragStartTask,
  onStartFocusOnTask,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [showTagPicker, setShowTagPicker] = useState(false);

  const directSubtasks = allTasks.filter((t) => t.parent_id === task.id);
  const completedSubtasks = directSubtasks.filter((t) => t.completed).length;

  const handleCreateSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = subtaskTitle.trim();
    if (!trimmed) return;
    onAddSubtask(task.id, trimmed, task.tag_ids.slice(0, 1));
    setSubtaskTitle('');
    setAddingSubtask(false);
    setExpanded(true);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.18 }}
      data-testid={`task-item-${task.id}`}
      data-task-title={task.title}
      data-task-depth={depth}
      data-task-completed={String(task.completed)}
      data-task-due={task.due_date || ''}
      draggable
      onDragStart={(e: unknown) => {
        const dragEvent = e as React.DragEvent<HTMLDivElement>;
        if (dragEvent.dataTransfer) {
          dragEvent.dataTransfer.setData('text/plain', task.id);
          dragEvent.dataTransfer.effectAllowed = 'move';
        }
        onDragStartTask(task.id);
      }}
      className={`group rounded-2xl border bg-froyo-surface p-3.5 shadow-froyo-sm transition-all hover:shadow-froyo-md ${
        task.completed ? 'opacity-75 bg-froyo-elevated/50' : ''
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* Drag Handle */}
        <div
          className="mt-1 cursor-grab active:cursor-grabbing text-froyo-muted/50 hover:text-froyo-accent transition-colors"
          title="Drag onto Calendar date card to reschedule deadline"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Expand/Collapse Subtasks Chevron */}
        {directSubtasks.length > 0 ? (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            data-testid={`toggle-expand-${task.id}`}
            className="mt-1 p-0.5 rounded-md hover:bg-froyo-elevated text-froyo-muted transition-colors"
            aria-label={expanded ? 'Collapse subtasks' : 'Expand subtasks'}
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* Accessible Custom Checkbox */}
        <button
          type="button"
          role="checkbox"
          aria-checked={task.completed}
          data-testid={`task-checkbox-${task.id}`}
          onClick={() => onToggleTask(task.id)}
          className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${
            task.completed
              ? 'bg-froyo-accent border-froyo-accent text-white shadow-sm'
              : 'border-froyo-accent/50 hover:border-froyo-accent bg-froyo-canvas/60'
          }`}
        >
          {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Task Content & Metadata */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              data-testid={`task-title-${task.id}`}
              className={`font-medium text-sm sm:text-[15px] leading-snug break-words transition-all ${
                task.completed ? 'line-through text-froyo-muted' : 'text-froyo-text'
              }`}
            >
              {task.title}
            </span>

            {/* Action Toolbar */}
            <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
              {onStartFocusOnTask && !task.completed && (
                <button
                  type="button"
                  onClick={() => onStartFocusOnTask(task)}
                  title="Launch Ambient Focus Session for this task"
                  className="p-1.5 rounded-lg hover:bg-froyo-elevated text-froyo-muted hover:text-froyo-accent transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                data-testid={`add-subtask-btn-${task.id}`}
                onClick={() => {
                  setAddingSubtask((prev) => !prev);
                  setExpanded(true);
                }}
                title="Add nested subtask"
                className="p-1.5 rounded-lg hover:bg-froyo-elevated text-froyo-muted hover:text-froyo-accent transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTagPicker((prev) => !prev)}
                  title="Assign Priority Tags"
                  className="p-1.5 rounded-lg hover:bg-froyo-elevated text-froyo-muted hover:text-froyo-accent transition-colors"
                >
                  <TagIcon className="w-3.5 h-3.5" />
                </button>
                {showTagPicker && (
                  <div className="absolute right-0 mt-1 w-44 rounded-xl bg-froyo-surface border border-froyo-border shadow-froyo-lg p-2 z-30 space-y-1">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-froyo-muted px-2 py-0.5">
                      Priority Tags
                    </div>
                    {tags.map((t) => {
                      const active = task.tag_ids.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => onToggleTaskTag(task.id, t.id)}
                          className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs hover:bg-froyo-elevated transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: t.color }}
                            />
                            <span className="font-medium text-froyo-text">{t.name}</span>
                          </span>
                          {active && <Check className="w-3.5 h-3.5 text-froyo-accent" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => onDeleteTask(task.id)}
                title="Delete task"
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-froyo-muted hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {task.notes && (
            <p className="text-xs text-froyo-muted mt-1 line-clamp-2">{task.notes}</p>
          )}

          {/* Badges Row: Due Date, Event Time, Priority Hex Tags, Subtask Counter */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {task.due_date && (
              <span
                data-testid={`task-due-badge-${task.id}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-froyo-elevated text-froyo-muted border border-froyo-border"
              >
                <CalendarIcon className="w-3 h-3 text-froyo-accent" />
                {task.due_date}
              </span>
            )}

            {task.scheduled_time && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-froyo-accent/10 text-froyo-accent">
                <Clock className="w-3 h-3" />
                {task.scheduled_time}
                {task.is_event ? ' · Event' : ''}
              </span>
            )}

            {directSubtasks.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-froyo-elevated text-froyo-text">
                {completedSubtasks}/{directSubtasks.length} subtasks
              </span>
            )}

            {task.tag_ids.map((tagId) => {
              const tag = tags.find((item) => item.id === tagId);
              if (!tag) return null;
              const style = getAccessibleTagStyles(tag.color, isDark);
              return (
                <span
                  key={tag.id}
                  data-testid={`task-tag-pill-${tag.name.toLowerCase().replace(/\s+/g, '-')}`}
                  style={{
                    backgroundColor: style.backgroundColor,
                    borderColor: style.borderColor,
                    color: style.color,
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: style.dotColor }}
                  />
                  {tag.name}
                </span>
              );
            })}
          </div>

          {/* Inline Add Subtask Form */}
          {addingSubtask && (
            <form
              onSubmit={handleCreateSubtask}
              className="mt-3 flex items-center gap-2"
              data-testid={`subtask-form-${task.id}`}
            >
              <input
                type="text"
                autoFocus
                data-testid={`subtask-input-${task.id}`}
                value={subtaskTitle}
                onChange={(e) => setSubtaskTitle(e.target.value)}
                placeholder={`Add subtask under "${task.title}"...`}
                className="flex-1 text-xs rounded-xl px-3 py-2 bg-froyo-canvas border border-froyo-border text-froyo-text focus:outline-none focus:ring-2 focus:ring-froyo-accent"
              />
              <button
                type="submit"
                data-testid={`subtask-submit-${task.id}`}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-froyo-accent text-white hover:opacity-95 transition-opacity"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setAddingSubtask(false)}
                className="px-2.5 py-2 rounded-xl text-xs text-froyo-muted hover:bg-froyo-elevated"
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Recursive Nested Subtasks */}
      <AnimatePresence initial={false}>
        {expanded && directSubtasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
          >
            <RecursiveTaskTree
              tasks={allTasks}
              parentId={task.id}
              depth={depth + 1}
              tags={tags}
              isDark={isDark}
              onToggleTask={onToggleTask}
              onAddSubtask={onAddSubtask}
              onDeleteTask={onDeleteTask}
              onToggleTaskTag={onToggleTaskTag}
              onDragStartTask={onDragStartTask}
              onStartFocusOnTask={onStartFocusOnTask}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
