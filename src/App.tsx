import React, { useEffect, useMemo, useRef, useState } from 'react';
import { endOfWeek, format, isWithinInterval, parseISO, startOfWeek } from 'date-fns';
import {
  Archive,
  Calendar as CalendarIcon,
  CalendarDays,
  ChevronDown,
  FolderPlus,
  Heart,
  ListTodo,
  LogOut,
  Moon,
  Palette,
  Plus,
  Settings,
  Sparkles,
  Sun,
  Tag as TagIcon,
  Timer,
  User,
} from 'lucide-react';
import {
  FocusSessionLog,
  FroyoTask,
  FroyoUser,
  MascotType,
  PriorityTag,
  TaskList,
  UserPreferences,
} from './types/froyo';
import {
  DEFAULT_DEMO_USER,
  deleteUserDocument,
  getInitialFocusSessionsSeed,
  getInitialListsSeed,
  getInitialTagsSeed,
  getInitialTasksSeed,
  loadUserPreferences,
  logoutUser,
  saveUserPreferences,
  subscribeToAuth,
  subscribeToUserCollection,
  upsertUserDocument,
} from './lib/firebase';
import {
  applyThemeVariables,
  DARK_MAUVE_THEME,
  getAccessibleTagStyles,
  PASTEL_PINK_THEME,
} from './lib/theme';
import { calculateMascotHealth } from './lib/healthEngine';
import { MascotCompanion, MASCOT_CATALOG } from './components/MascotCompanion';
import { RecursiveTaskTree } from './components/RecursiveTaskTree';
import { InteractiveCalendarPane } from './components/InteractiveCalendarPane';
import { FocusAndAnalyticsView } from './components/FocusAndAnalyticsView';
import { MascotSanctuaryModal, ThemeStudioModal } from './components/ThemeAndMascotModals';
import { AuthModal } from './components/AuthModal';
import { AccountDetailsModal, ConfigurationModal } from './components/AccountModals';

export function App() {
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadUserPreferences());
  const [currentUser, setCurrentUser] = useState<FroyoUser | null>(DEFAULT_DEMO_USER);
  const [activeTab, setActiveTab] = useState<'tab1' | 'tab2'>('tab1');

  // Firestore / User Data Collections scoped to currentUser.uid
  const [tasks, setTasks] = useState<FroyoTask[]>([]);
  const [lists, setLists] = useState<TaskList[]>([]);
  const [tags, setTags] = useState<PriorityTag[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSessionLog[]>([]);

  // Workspace Navigation & Filter State
  const [activeListScope, setActiveListScope] = useState<'weekly' | 'all' | string>('weekly');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);

  // Task & Tag Composer State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>(() =>
    format(new Date(), 'yyyy-MM-dd')
  );
  const [newTaskSelectedTags, setNewTaskSelectedTags] = useState<string[]>(['tag-urgent']);
  const [showTagCreator, setShowTagCreator] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#FF85A1');
  const [showListCreator, setShowListCreator] = useState(false);
  const [newListName, setNewListName] = useState('');

  // Drag & Drop State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Modals & Menus State
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isMascotModalOpen, setIsMascotModalOpen] = useState(false);

  // Health & Focus State
  const [healthOverride, setHealthOverride] = useState<number | null>(null);
  const [selectedTaskForFocus, setSelectedTaskForFocus] = useState<FroyoTask | null>(null);
  const [isAmbientFocusActive, setIsAmbientFocusActive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Close user dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Apply dynamic CSS variables whenever preferences update
  useEffect(() => {
    applyThemeVariables(preferences);
    saveUserPreferences(preferences);
  }, [preferences]);

  // Subscribe to Firebase Auth state
  useEffect(() => {
    const unsubAuth = subscribeToAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsubAuth();
  }, []);

  const activeUid = currentUser?.uid || 'guest-user';

  // Realtime Firestore subscriptions scoped to active user
  useEffect(() => {
    const unsubTasks = subscribeToUserCollection<FroyoTask>(
      activeUid,
      'tasks',
      getInitialTasksSeed,
      setTasks
    );
    const unsubLists = subscribeToUserCollection<TaskList>(
      activeUid,
      'lists',
      getInitialListsSeed,
      setLists
    );
    const unsubTags = subscribeToUserCollection<PriorityTag>(
      activeUid,
      'tags',
      getInitialTagsSeed,
      setTags
    );
    const unsubSessions = subscribeToUserCollection<FocusSessionLog>(
      activeUid,
      'focus_sessions',
      getInitialFocusSessionsSeed,
      setFocusSessions
    );

    return () => {
      unsubTasks();
      unsubLists();
      unsubTags();
      unsubSessions();
    };
  }, [activeUid]);

  const isDark = preferences.themeMode === 'dark';

  // Mascot Health Decay Metrics
  const healthMetrics = useMemo(
    () => calculateMascotHealth(tasks, new Date(), healthOverride),
    [tasks, healthOverride]
  );

  // Filter tasks for the active list scope & calendar selection
  const filteredTasksForTree = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const matchingRootIds = new Set<string>();

    tasks.forEach((task) => {
      if (task.parent_id !== null) return;

      if (selectedCalendarDate) {
        if (task.due_date === selectedCalendarDate) {
          matchingRootIds.add(task.id);
        }
        return;
      }

      if (selectedTagFilter && !task.tag_ids.includes(selectedTagFilter)) {
        return;
      }

      if (activeListScope === 'weekly') {
        if (task.list_id !== null) return;
        if (!task.due_date) {
          matchingRootIds.add(task.id);
          return;
        }
        try {
          const d = parseISO(task.due_date);
          if (isWithinInterval(d, { start: weekStart, end: weekEnd })) {
            matchingRootIds.add(task.id);
          }
        } catch {
          matchingRootIds.add(task.id);
        }
      } else if (activeListScope === 'all') {
        matchingRootIds.add(task.id);
      } else {
        if (task.list_id === activeListScope) {
          matchingRootIds.add(task.id);
        }
      }
    });

    const includedIds = new Set<string>(matchingRootIds);
    let added = true;
    while (added) {
      added = false;
      for (const t of tasks) {
        if (t.parent_id && includedIds.has(t.parent_id) && !includedIds.has(t.id)) {
          includedIds.add(t.id);
          added = true;
        }
      }
    }

    return tasks.filter((t) => includedIds.has(t.id));
  }, [tasks, activeListScope, selectedCalendarDate, selectedTagFilter]);

  // Task & Tag CRUD operations synced to Firestore
  const handleCreateRootTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;

    const now = new Date().toISOString();
    const isStandaloneList = activeListScope !== 'weekly' && activeListScope !== 'all';
    const newTask: FroyoTask = {
      id: `task-${Date.now()}`,
      parent_id: null,
      title: trimmed,
      completed: false,
      due_date: selectedCalendarDate
        ? selectedCalendarDate
        : isStandaloneList
        ? null
        : newTaskDueDate || format(new Date(), 'yyyy-MM-dd'),
      list_id: isStandaloneList ? activeListScope : null,
      tag_ids: newTaskSelectedTags,
      order: tasks.length + 1,
      created_at: now,
      updated_at: now,
    };

    setNewTaskTitle('');
    await upsertUserDocument(activeUid, 'tasks', newTask, getInitialTasksSeed);
    triggerToast(`Task "${trimmed}" added`);
  };

  const handleAddSubtask = async (parentId: string, title: string, tagIds: string[]) => {
    const parentTask = tasks.find((t) => t.id === parentId);
    const now = new Date().toISOString();
    const subtask: FroyoTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      parent_id: parentId,
      title,
      completed: false,
      due_date: parentTask?.due_date || null,
      list_id: parentTask?.list_id || null,
      tag_ids: tagIds,
      order: tasks.length + 1,
      created_at: now,
      updated_at: now,
    };
    await upsertUserDocument(activeUid, 'tasks', subtask, getInitialTasksSeed);
  };

  const handleToggleTask = async (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;
    const updated: FroyoTask = {
      ...target,
      completed: !target.completed,
      updated_at: new Date().toISOString(),
    };
    await upsertUserDocument(activeUid, 'tasks', updated, getInitialTasksSeed);
  };

  const handleDeleteTask = async (taskId: string) => {
    const toDelete = new Set<string>([taskId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const t of tasks) {
        if (t.parent_id && toDelete.has(t.parent_id) && !toDelete.has(t.id)) {
          toDelete.add(t.id);
          changed = true;
        }
      }
    }
    for (const id of toDelete) {
      await deleteUserDocument(activeUid, 'tasks', id, getInitialTasksSeed);
    }
  };

  const handleToggleTaskTag = async (taskId: string, tagId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;
    const exists = target.tag_ids.includes(tagId);
    const nextTags = exists
      ? target.tag_ids.filter((id) => id !== tagId)
      : [...target.tag_ids, tagId];

    await upsertUserDocument(
      activeUid,
      'tasks',
      { ...target, tag_ids: nextTags, updated_at: new Date().toISOString() },
      getInitialTasksSeed
    );
  };

  const handleDropTaskOnDate = async (taskId: string, targetDateStr: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;

    const updated: FroyoTask = {
      ...target,
      due_date: targetDateStr,
      list_id: null,
      updated_at: new Date().toISOString(),
    };
    await upsertUserDocument(activeUid, 'tasks', updated, getInitialTasksSeed);
    setDraggedTaskId(null);
    triggerToast(`Rescheduled "${target.title}" to ${targetDateStr}`);
  };

  const handleQuickCreateDatedItem = async (
    title: string,
    dateStr: string,
    isEvent: boolean,
    scheduledTime: string
  ) => {
    const now = new Date().toISOString();
    const newItem: FroyoTask = {
      id: `task-${Date.now()}`,
      parent_id: null,
      title,
      completed: false,
      due_date: dateStr,
      scheduled_time: scheduledTime,
      is_event: isEvent,
      list_id: null,
      tag_ids: ['tag-review'],
      order: tasks.length + 1,
      created_at: now,
      updated_at: now,
    };
    await upsertUserDocument(activeUid, 'tasks', newItem, getInitialTasksSeed);
    triggerToast(`Scheduled "${title}" on ${dateStr}`);
  };

  const handleCreateCustomTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTagName.trim();
    if (!trimmed) return;
    const newTag: PriorityTag = {
      id: `tag-${Date.now()}`,
      name: trimmed,
      color: newTagColor,
      created_at: new Date().toISOString(),
    };
    await upsertUserDocument(activeUid, 'tags', newTag, getInitialTagsSeed);
    setNewTagName('');
    setShowTagCreator(false);
    triggerToast(`Created tag "${trimmed}" (${newTagColor})`);
  };

  const handleCreateCustomList = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newListName.trim();
    if (!trimmed) return;
    const newList: TaskList = {
      id: `list-${Date.now()}`,
      name: trimmed,
      icon: 'Archive',
      color: '#FF85A1',
      created_at: new Date().toISOString(),
    };
    await upsertUserDocument(activeUid, 'lists', newList, getInitialListsSeed);
    setNewListName('');
    setShowListCreator(false);
    setActiveListScope(newList.id);
  };

  const handleLogFocusSession = async (sessionData: Omit<FocusSessionLog, 'id'>) => {
    const newSession: FocusSessionLog = {
      ...sessionData,
      id: `session-${Date.now()}`,
    };
    await upsertUserDocument(activeUid, 'focus_sessions', newSession, getInitialFocusSessionsSeed);
    triggerToast(`Logged ${newSession.duration_minutes}m Focus Session!`);
  };

  const handleToggleLightDark = () => {
    setPreferences((prev) => {
      const nextMode = prev.themeMode === 'dark' ? 'pastel-pink' : 'dark';
      return {
        ...prev,
        themeMode: nextMode,
        customTheme: nextMode === 'dark' ? DARK_MAUVE_THEME : PASTEL_PINK_THEME,
      };
    });
  };

  const handleSignOut = async () => {
    await logoutUser();
    setIsUserMenuOpen(false);
    triggerToast('Signed out. Switched to guest mode.');
  };

  const todayPct = Math.round(healthMetrics.todayRatio * 100);
  const weekPct = Math.round(healthMetrics.weekRatio * 100);

  return (
    <div className="min-h-screen flex flex-col bg-froyo-canvas text-froyo-text selection:bg-froyo-accent/25">
      {/* 
        WIREFRAME ADOPTION: TOP NAVIGATION BAR
        - Title on left: "Froyo V1 Studio"
        - Navigation tabs: "Tab 1" and "Tab 2"
        - Far right: Circular user profile/Sign Out icon with exact 5 dropdown options
      */}
      <header
        className="sticky top-0 z-40 border-b border-froyo-border bg-froyo-surface/90 backdrop-blur-md px-4 lg:px-7 py-3 shadow-froyo-sm"
        data-testid="top-navigation-bar"
      >
        <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-4">
          {/* Left: Wireframe Title "Froyo V1 Studio" + Tab 1 / Tab 2 */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-froyo-accent to-froyo-accent-soft flex items-center justify-center text-white shadow-froyo-sm font-display font-extrabold text-lg">
                F
              </div>
              <h1
                className="font-display font-extrabold text-xl tracking-tight text-froyo-text"
                data-testid="app-title"
              >
                Froyo V1 Studio
              </h1>
            </div>

            {/* Navigation Tabs: Planner & Focus & Analytics */}
            <nav className="inline-flex items-center p-1 rounded-2xl bg-froyo-elevated border border-froyo-border">
              <button
                type="button"
                data-testid="nav-tab-1"
                onClick={() => {
                  setActiveTab('tab1');
                  setIsAmbientFocusActive(false);
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'tab1'
                    ? 'bg-froyo-surface text-froyo-text shadow-sm'
                    : 'text-froyo-muted hover:text-froyo-text'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5 text-froyo-accent" />
                <span>Planner</span>
              </button>

              <button
                type="button"
                data-testid="nav-tab-2"
                onClick={() => setActiveTab('tab2')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'tab2'
                    ? 'bg-froyo-surface text-froyo-text shadow-sm'
                    : 'text-froyo-muted hover:text-froyo-text'
                }`}
              >
                <Timer className="w-3.5 h-3.5 text-froyo-accent" />
                <span>Focus & Analytics</span>
              </button>
            </nav>
          </div>

          {/* Right: Circular User Profile Icon + Dropdown Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              data-testid="user-profile-menu-btn"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              aria-label="User Profile and Options Menu"
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-froyo-elevated to-froyo-surface border-2 border-froyo-accent flex items-center justify-center text-froyo-accent hover:shadow-froyo-sm transition-all focus:outline-none focus:ring-2 focus:ring-froyo-accent"
            >
              {currentUser?.email ? (
                <span className="font-bold text-xs uppercase">
                  {currentUser.displayName?.[0] || currentUser.email[0]}
                </span>
              ) : (
                <User className="w-5 h-5" />
              )}
            </button>

            {/* EXACT 5 OPTIONS DROPDOWN */}
            {isUserMenuOpen && (
              <div
                data-testid="user-dropdown-menu"
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-froyo-surface border border-froyo-border shadow-froyo-lg p-1.5 z-50 space-y-0.5 animate-in fade-in-50 zoom-in-95"
              >
                {/* 1. Account details */}
                <button
                  type="button"
                  data-testid="menu-opt-account-details"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsAccountModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-froyo-text hover:bg-froyo-elevated transition-colors text-left"
                >
                  <User className="w-4 h-4 text-froyo-accent" />
                  <span>Account details</span>
                </button>

                {/* 2. Configuration */}
                <button
                  type="button"
                  data-testid="menu-opt-configuration"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsConfigModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-froyo-text hover:bg-froyo-elevated transition-colors text-left"
                >
                  <Settings className="w-4 h-4 text-froyo-accent" />
                  <span>Configuration</span>
                </button>

                {/* 3. Theme engine */}
                <button
                  type="button"
                  data-testid="menu-opt-theme-engine"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsThemeModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-froyo-text hover:bg-froyo-elevated transition-colors text-left"
                >
                  <Palette className="w-4 h-4 text-froyo-accent" />
                  <span>Theme engine</span>
                </button>

                {/* 4. Dark/Light mode */}
                <button
                  type="button"
                  data-testid="menu-opt-dark-light-mode"
                  onClick={() => {
                    handleToggleLightDark();
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-froyo-text hover:bg-froyo-elevated transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    {isDark ? (
                      <Sun className="w-4 h-4 text-froyo-accent" />
                    ) : (
                      <Moon className="w-4 h-4 text-froyo-accent" />
                    )}
                    <span>Dark/Light mode</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-froyo-muted">
                    {isDark ? 'Dark' : 'Light'}
                  </span>
                </button>

                <div className="border-t border-froyo-border my-1" />

                {/* 5. Sign out */}
                {currentUser ? (
                  <button
                    type="button"
                    data-testid="menu-opt-sign-out"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    data-testid="menu-opt-sign-in"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsAuthModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-froyo-accent hover:bg-froyo-elevated transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign in / Register</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main View Container */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 lg:px-7 py-4 overflow-hidden">
        {activeTab === 'tab1' ? (
          /*
            WIREFRAME ADOPTION: SPLIT-SCREEN BODY
            - Left Column (Stacked):
              1. Top: "Mascot and progress" module
              2. Bottom: "To-do list" workspace
            - Right Column:
              Entire right column: Large interactive "Calendar"
          */
          <div
            className="h-[calc(100vh-104px)] min-h-[640px] grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch"
            data-testid="wireframe-split-screen"
          >
            {/* LEFT COLUMN: Stacked (Mascot and progress on top, To-do list underneath) */}
            <div
              className="lg:col-span-5 xl:col-span-5 h-full flex flex-col gap-4 overflow-hidden"
              data-testid="left-stacked-pane"
            >
              {/* 1. TOP MODULE: Mascot and Progress */}
              <div
                className="rounded-3xl bg-froyo-surface border border-froyo-border shadow-froyo-md p-4 sm:p-5 flex-shrink-0"
                data-testid="mascot-and-progress-module"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Companion Mascot Avatar */}
                  <div className="flex items-center gap-3.5">
                    <button
                      type="button"
                      data-testid="open-mascot-sanctuary-btn"
                      onClick={() => setIsMascotModalOpen(true)}
                      className="p-1 rounded-2xl hover:bg-froyo-elevated transition-all flex items-center justify-center cursor-pointer"
                      title="Open Mascot Sanctuary to choose companions"
                    >
                      <MascotCompanion
                        mascot={preferences.activeMascot}
                        healthState={healthMetrics.state}
                        healthScore={healthMetrics.score}
                        size="md"
                      />
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-base text-froyo-text">
                          {MASCOT_CATALOG[preferences.activeMascot]?.name || 'Mascot'}
                        </span>
                        <span
                          data-testid="mascot-health-badge"
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                            healthMetrics.state === 'flourishing'
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : healthMetrics.state === 'degraded'
                              ? 'bg-red-500/15 text-red-500'
                              : 'bg-amber-500/15 text-amber-500'
                          }`}
                        >
                          <Heart className="w-3 h-3 fill-current" />
                          {healthMetrics.score} HP
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-froyo-muted block mt-0.5">
                        {MASCOT_CATALOG[preferences.activeMascot]?.subtitle} · State:{' '}
                        <span className="uppercase text-froyo-accent font-bold">
                          {healthMetrics.state}
                        </span>
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMascotModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-froyo-elevated border border-froyo-border text-froyo-accent hover:border-froyo-accent transition-colors"
                  >
                    Switch Mascot
                  </button>
                </div>

                {/* Progress Bars Stack */}
                <div className="mt-3.5 space-y-2 pt-3 border-t border-froyo-border">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-froyo-muted mb-1">
                      <span>
                        Daily Tasks ({healthMetrics.completedToday}/{healthMetrics.dueToday})
                      </span>
                      <span className="text-froyo-accent font-mono">{todayPct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-froyo-elevated overflow-hidden">
                      <div
                        data-testid="daily-progress-bar"
                        style={{ width: `${todayPct}%` }}
                        className="h-full bg-froyo-accent transition-all duration-500 rounded-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-froyo-muted mb-1">
                      <span>
                        Weekly Momentum ({healthMetrics.completedThisWeek}/
                        {healthMetrics.dueThisWeek})
                      </span>
                      <span className="text-emerald-500 font-mono">{weekPct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-froyo-elevated overflow-hidden">
                      <div
                        data-testid="weekly-progress-bar"
                        style={{ width: `${weekPct}%` }}
                        className="h-full bg-emerald-400 transition-all duration-500 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. BOTTOM MODULE: To-Do List Workspace */}
              <div
                className="flex-1 min-h-0 flex flex-col rounded-3xl bg-froyo-surface border border-froyo-border shadow-froyo-md overflow-hidden"
                data-testid="todo-list-workspace-module"
              >
                {/* Lists & Filter Header */}
                <div className="px-5 pt-4 pb-3 border-b border-froyo-border bg-froyo-surface space-y-3 flex-shrink-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        data-testid="scope-weekly-btn"
                        onClick={() => {
                          setActiveListScope('weekly');
                          setSelectedCalendarDate(null);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          activeListScope === 'weekly' && !selectedCalendarDate
                            ? 'bg-froyo-accent text-white shadow-sm'
                            : 'bg-froyo-elevated text-froyo-muted hover:text-froyo-text'
                        }`}
                      >
                        <ListTodo className="w-3.5 h-3.5" />
                        Weekly Board
                      </button>

                      <button
                        type="button"
                        data-testid="scope-all-btn"
                        onClick={() => {
                          setActiveListScope('all');
                          setSelectedCalendarDate(null);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          activeListScope === 'all' && !selectedCalendarDate
                            ? 'bg-froyo-accent text-white shadow-sm'
                            : 'bg-froyo-elevated text-froyo-muted hover:text-froyo-text'
                        }`}
                      >
                        All Tasks
                      </button>

                      {lists.map((list) => (
                        <button
                          key={list.id}
                          type="button"
                          data-testid={`scope-list-${list.id}`}
                          onClick={() => {
                            setActiveListScope(list.id);
                            setSelectedCalendarDate(null);
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            activeListScope === list.id && !selectedCalendarDate
                              ? 'bg-froyo-accent text-white shadow-sm'
                              : 'bg-froyo-elevated text-froyo-muted hover:text-froyo-text'
                          }`}
                        >
                          <Archive className="w-3.5 h-3.5" />
                          {list.name}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => setShowListCreator((prev) => !prev)}
                        className="p-1.5 rounded-xl bg-froyo-elevated text-froyo-muted hover:text-froyo-accent border border-froyo-border"
                        title="Create Standalone Custom List"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Priority Tags Bar */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-froyo-muted mr-1">
                      Tags:
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedTagFilter(null)}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all ${
                        selectedTagFilter === null
                          ? 'bg-froyo-text text-froyo-surface border-froyo-text'
                          : 'bg-froyo-elevated text-froyo-muted border-froyo-border'
                      }`}
                    >
                      All
                    </button>
                    {tags.map((tag) => {
                      const style = getAccessibleTagStyles(tag.color, isDark);
                      const isSelected = selectedTagFilter === tag.id;
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => setSelectedTagFilter(isSelected ? null : tag.id)}
                          style={{
                            backgroundColor: style.backgroundColor,
                            borderColor: isSelected ? tag.color : style.borderColor,
                            color: style.color,
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-transform ${
                            isSelected ? 'ring-2 ring-froyo-accent scale-105' : ''
                          }`}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: style.dotColor }}
                          />
                          {tag.name}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      data-testid="toggle-tag-creator-btn"
                      onClick={() => setShowTagCreator((prev) => !prev)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-froyo-elevated text-froyo-accent border border-froyo-border hover:border-froyo-accent"
                    >
                      <TagIcon className="w-3 h-3" />
                      + Tag
                    </button>
                  </div>

                  {/* Add Tag Form */}
                  {showTagCreator && (
                    <form
                      onSubmit={handleCreateCustomTag}
                      className="flex flex-wrap items-center gap-2 p-2.5 rounded-2xl bg-froyo-elevated/80 border border-froyo-border"
                    >
                      <input
                        type="text"
                        data-testid="new-tag-name-input"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="Tag name"
                        className="flex-1 min-w-[120px] text-xs px-3 py-1.5 rounded-xl bg-froyo-surface border border-froyo-border text-froyo-text"
                      />
                      <input
                        type="color"
                        data-testid="new-tag-color-input"
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <button
                        type="submit"
                        data-testid="create-tag-btn"
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-froyo-accent text-white"
                      >
                        Save
                      </button>
                    </form>
                  )}

                  {/* Add List Form */}
                  {showListCreator && (
                    <form onSubmit={handleCreateCustomList} className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        placeholder="List name..."
                        className="flex-1 text-xs px-3 py-1.5 rounded-xl bg-froyo-canvas border border-froyo-border text-froyo-text"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-froyo-accent text-white"
                      >
                        Create
                      </button>
                    </form>
                  )}

                  {/* Root Task Input Form */}
                  <form
                    onSubmit={handleCreateRootTask}
                    className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-1"
                    data-testid="root-task-form"
                  >
                    <input
                      type="text"
                      data-testid="new-task-input"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder={
                        selectedCalendarDate
                          ? `Add task for ${selectedCalendarDate}...`
                          : 'Add new task...'
                      }
                      className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl bg-froyo-canvas border border-froyo-border text-froyo-text placeholder:text-froyo-muted focus:outline-none focus:ring-2 focus:ring-froyo-accent"
                    />

                    {activeListScope === 'weekly' && !selectedCalendarDate && (
                      <input
                        type="date"
                        aria-label="Due date"
                        data-testid="new-task-date-input"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                        className="text-xs px-2.5 py-2.5 rounded-2xl bg-froyo-canvas border border-froyo-border text-froyo-text"
                      />
                    )}

                    <button
                      type="submit"
                      data-testid="new-task-submit-btn"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-froyo-accent text-white shadow-froyo-sm hover:opacity-95"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </form>
                </div>

                {/* Task Hierarchy List */}
                <div
                  className="flex-1 overflow-y-auto froyo-scroll p-4 space-y-2.5"
                  data-testid="task-list-scroll-pane"
                >
                  {selectedCalendarDate && (
                    <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-froyo-accent/15 border border-froyo-accent/30 text-xs mb-2">
                      <span className="font-semibold text-froyo-text flex items-center gap-2">
                        <CalendarIcon className="w-3.5 h-3.5 text-froyo-accent" />
                        Filtered: {selectedCalendarDate}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedCalendarDate(null)}
                        className="text-froyo-accent font-bold hover:underline"
                      >
                        Reset
                      </button>
                    </div>
                  )}

                  {filteredTasksForTree.length === 0 ? (
                    <div className="h-44 flex flex-col items-center justify-center text-center p-4 text-froyo-muted">
                      <Sparkles className="w-6 h-6 text-froyo-accent mb-1.5 opacity-70" />
                      <p className="font-display font-bold text-xs text-froyo-text">No tasks yet</p>
                      <p className="text-[11px] mt-0.5">Add a task above or pick a calendar day.</p>
                    </div>
                  ) : (
                    <RecursiveTaskTree
                      tasks={filteredTasksForTree}
                      parentId={null}
                      tags={tags}
                      isDark={isDark}
                      onToggleTask={handleToggleTask}
                      onAddSubtask={handleAddSubtask}
                      onDeleteTask={handleDeleteTask}
                      onToggleTaskTag={handleToggleTaskTag}
                      onDragStartTask={(id) => setDraggedTaskId(id)}
                      onStartFocusOnTask={(task) => {
                        setSelectedTaskForFocus(task);
                        setActiveTab('tab2');
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Dedicated Entirely to Large Interactive Calendar */}
            <div
              className="lg:col-span-7 xl:col-span-7 h-full flex flex-col min-w-0"
              data-testid="right-calendar-column"
            >
              <InteractiveCalendarPane
                tasks={tasks}
                tags={tags}
                selectedDate={selectedCalendarDate}
                onSelectDate={setSelectedCalendarDate}
                draggedTaskId={draggedTaskId}
                onDropTaskOnDate={handleDropTaskOnDate}
                onQuickCreateDatedItem={handleQuickCreateDatedItem}
                onToggleTask={handleToggleTask}
              />
            </div>
          </div>
        ) : (
          /* TAB 2: Focus & Analytics Workspace */
          <div className="h-[calc(100vh-104px)] min-h-[640px]">
            <FocusAndAnalyticsView
              tasks={tasks}
              sessions={focusSessions}
              activeMascot={preferences.activeMascot}
              healthState={healthMetrics.state}
              healthScore={healthMetrics.score}
              dailyFocusGoalMinutes={preferences.dailyFocusGoalMinutes}
              onUpdateDailyGoal={(mins) =>
                setPreferences((prev) => ({ ...prev, dailyFocusGoalMinutes: mins }))
              }
              selectedTaskForFocus={selectedTaskForFocus}
              onSelectTaskForFocus={setSelectedTaskForFocus}
              onLogFocusSession={handleLogFocusSession}
              isAmbientFocusActive={isAmbientFocusActive}
              onAmbientFocusChange={setIsAmbientFocusActive}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(u) => {
          setCurrentUser(u);
          triggerToast(`Signed in as ${u.displayName || u.email}`);
        }}
      />

      <AccountDetailsModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        user={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      <ConfigurationModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        preferences={preferences}
        onUpdatePreferences={setPreferences}
      />

      <ThemeStudioModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        preferences={preferences}
        onUpdatePreferences={setPreferences}
      />

      <MascotSanctuaryModal
        isOpen={isMascotModalOpen}
        onClose={() => setIsMascotModalOpen(false)}
        activeMascot={preferences.activeMascot}
        onSelectMascot={(mascot: MascotType) =>
          setPreferences((prev) => ({ ...prev, activeMascot: mascot }))
        }
        healthMetrics={healthMetrics}
        healthOverride={healthOverride}
        onChangeHealthOverride={setHealthOverride}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          data-testid="froyo-toast"
          className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-2xl bg-froyo-text text-froyo-surface text-xs font-semibold shadow-froyo-lg flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-froyo-accent" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
export default App;
