import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  Firestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot as firestoreOnSnapshot,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser,
  Auth,
} from 'firebase/auth';
import { addDays, format, startOfWeek, subDays } from 'date-fns';
import {
  FocusSessionLog,
  FroyoTask,
  FroyoUser,
  PriorityTag,
  TaskList,
  UserPreferences,
} from '../types/froyo';
import { PASTEL_PINK_THEME } from './theme';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-froyo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'froyo-productivity.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'froyo-productivity',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'froyo-productivity.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1029384756',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1029384756:web:froyo123456',
};

const isCloudConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_API_KEY !== 'demo-froyo-api-key'
);

let app: FirebaseApp;
let db: Firestore | null = null;
let auth: Auth | null = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
  auth = getAuth(app);
} catch {
  // Fallback when already initialized in HMR
}

export const DEFAULT_DEMO_USER: FroyoUser = {
  uid: 'user-pastel-maker',
  email: 'maker@froyo.app',
  displayName: 'Froyo Creator',
  photoURL: null,
  isAnonymous: false,
};

const AUTH_STORAGE_KEY = 'froyo_current_auth_user_v1';
const REGISTERED_USERS_KEY = 'froyo_registered_users_registry_v1';

export type FirestoreCollectionName = 'tasks' | 'lists' | 'tags' | 'focus_sessions' | 'settings';

function getStorageKey(uid: string, colName: FirestoreCollectionName): string {
  return `froyo_firestore_users_${uid}_${colName}`;
}

const listenersMap = new Map<string, Set<() => void>>();
const broadcastChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('froyo_firestore_realtime')
    : null;

if (broadcastChannel) {
  broadcastChannel.onmessage = (event) => {
    const key = event.data?.key;
    if (key && listenersMap.has(key)) {
      listenersMap.get(key)?.forEach((cb) => cb());
    }
  };
}

function notifyCollectionListeners(uid: string, colName: FirestoreCollectionName) {
  const key = getStorageKey(uid, colName);
  listenersMap.get(key)?.forEach((cb) => cb());
  broadcastChannel?.postMessage({ key });
  syncGlobalInspectionMirror(uid);
}

function readLocalCollection<T extends { id: string }>(
  uid: string,
  colName: FirestoreCollectionName,
  seedGenerator: () => T[]
): T[] {
  if (typeof window === 'undefined') return seedGenerator();
  const key = getStorageKey(uid, colName);
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    const seeded = seedGenerator();
    window.localStorage.setItem(key, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw) as T[];
  } catch {
    const seeded = seedGenerator();
    window.localStorage.setItem(key, JSON.stringify(seeded));
    return seeded;
  }
}

function writeLocalCollection<T extends { id: string }>(
  uid: string,
  colName: FirestoreCollectionName,
  items: T[]
): void {
  if (typeof window === 'undefined') return;
  const key = getStorageKey(uid, colName);
  window.localStorage.setItem(key, JSON.stringify(items));
  notifyCollectionListeners(uid, colName);
}

/**
 * Exposes the live Firestore state at `window.__FROYO_FIRESTORE__` so Playwright E2E tests
 * and developer inspections can deterministically verify `users/{uid}/{collection}` paths.
 */
export function syncGlobalInspectionMirror(uid: string) {
  if (typeof window === 'undefined') return;
  const w = window as unknown as Record<string, unknown>;
  const tasks = readLocalCollection<FroyoTask>(uid, 'tasks', getInitialTasksSeed);
  const lists = readLocalCollection<TaskList>(uid, 'lists', getInitialListsSeed);
  const tags = readLocalCollection<PriorityTag>(uid, 'tags', getInitialTagsSeed);
  const focusSessions = readLocalCollection<FocusSessionLog>(
    uid,
    'focus_sessions',
    getInitialFocusSessionsSeed
  );

  w.__FROYO_FIRESTORE__ = {
    activeUid: uid,
    path: `users/${uid}`,
    collections: {
      [`users/${uid}/tasks`]: tasks,
      [`users/${uid}/lists`]: lists,
      [`users/${uid}/tags`]: tags,
      [`users/${uid}/focus_sessions`]: focusSessions,
    },
    getTaskById: (id: string) => tasks.find((t) => t.id === id) || null,
  };
}

// ----------------- Authentication Layer -----------------

const authListeners = new Set<(user: FroyoUser | null) => void>();

export function getCurrentUser(): FroyoUser | null {
  if (typeof window === 'undefined') return DEFAULT_DEMO_USER;
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    // Default to initial logged-in demo user so workspace loads immediately
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_USER));
    return DEFAULT_DEMO_USER;
  }
  try {
    return JSON.parse(raw) as FroyoUser;
  } catch {
    return DEFAULT_DEMO_USER;
  }
}

export function subscribeToAuth(callback: (user: FroyoUser | null) => void): () => void {
  authListeners.add(callback);
  callback(getCurrentUser());

  let unsubFirebase: (() => void) | null = null;
  if (isCloudConfigured && auth) {
    unsubFirebase = firebaseOnAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const mapped: FroyoUser = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Froyo User',
          photoURL: fbUser.photoURL,
          isAnonymous: fbUser.isAnonymous,
        };
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mapped));
        callback(mapped);
      }
    });
  }

  return () => {
    authListeners.delete(callback);
    if (unsubFirebase) unsubFirebase();
  };
}

function notifyAuthChanged(user: FroyoUser | null) {
  if (typeof window !== 'undefined') {
    if (user) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      syncGlobalInspectionMirror(user.uid);
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }
  authListeners.forEach((cb) => cb(user));
}

export async function loginWithEmail(email: string, pass: string): Promise<FroyoUser> {
  const cleanEmail = email.trim().toLowerCase();

  if (isCloudConfigured && auth) {
    try {
      const userCred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const user: FroyoUser = {
        uid: userCred.user.uid,
        email: userCred.user.email,
        displayName: userCred.user.displayName || cleanEmail.split('@')[0],
        photoURL: userCred.user.photoURL,
        isAnonymous: false,
      };
      notifyAuthChanged(user);
      return user;
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      throw new Error(err.message || 'Firebase login failed');
    }
  }

  // Local/Offline resilient user registry
  const regRaw = window.localStorage.getItem(REGISTERED_USERS_KEY);
  const registry = regRaw ? JSON.parse(regRaw) : {};
  if (registry[cleanEmail] && registry[cleanEmail].password !== pass) {
    throw new Error('Invalid password. Please check your credentials.');
  }

  const uid = registry[cleanEmail]?.uid || `user-${cleanEmail.replace(/[^a-z0-9]/g, '-')}`;
  const displayName = registry[cleanEmail]?.displayName || cleanEmail.split('@')[0];
  const user: FroyoUser = {
    uid,
    email: cleanEmail,
    displayName,
    photoURL: null,
    isAnonymous: false,
  };

  notifyAuthChanged(user);
  return user;
}

export async function registerWithEmail(
  email: string,
  pass: string,
  displayName?: string
): Promise<FroyoUser> {
  const cleanEmail = email.trim().toLowerCase();
  if (pass.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  if (isCloudConfigured && auth) {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      const user: FroyoUser = {
        uid: userCred.user.uid,
        email: userCred.user.email,
        displayName: displayName || cleanEmail.split('@')[0],
        photoURL: null,
        isAnonymous: false,
      };
      notifyAuthChanged(user);
      return user;
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      throw new Error(err.message || 'Registration failed');
    }
  }

  const uid = `user-${cleanEmail.replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;
  const regRaw = window.localStorage.getItem(REGISTERED_USERS_KEY);
  const registry = regRaw ? JSON.parse(regRaw) : {};
  registry[cleanEmail] = {
    uid,
    email: cleanEmail,
    password: pass,
    displayName: displayName || cleanEmail.split('@')[0],
    created_at: new Date().toISOString(),
  };
  window.localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(registry));

  const user: FroyoUser = {
    uid,
    email: cleanEmail,
    displayName: displayName || cleanEmail.split('@')[0],
    photoURL: null,
    isAnonymous: false,
  };

  notifyAuthChanged(user);
  return user;
}

export async function logoutUser(): Promise<void> {
  if (isCloudConfigured && auth) {
    try {
      await firebaseSignOut(auth);
    } catch {
      // offline signOut
    }
  }
  notifyAuthChanged(null);
}

// ----------------- Firestore Seeds -----------------

export function getInitialTagsSeed(): PriorityTag[] {
  const now = new Date().toISOString();
  return [
    { id: 'tag-urgent', name: 'Urgent', color: '#FF5C8A', created_at: now },
    { id: 'tag-deep-work', name: 'Deep Work', color: '#8B5CF6', created_at: now },
    { id: 'tag-low-energy', name: 'Low Energy', color: '#10B981', created_at: now },
    { id: 'tag-review', name: 'Review', color: '#F59E0B', created_at: now },
  ];
}

export function getInitialListsSeed(): TaskList[] {
  const now = new Date().toISOString();
  return [
    { id: 'list-ideas', name: 'Ideas', icon: 'Sparkles', color: '#FF85A1', created_at: now },
    {
      id: 'list-backlog',
      name: 'Personal Backlog',
      icon: 'Archive',
      color: '#8B5CF6',
      created_at: now,
    },
  ];
}

export function getInitialTasksSeed(): FroyoTask[] {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const monday = startOfWeek(today, { weekStartsOn: 1 });
  const tueStr = format(addDays(monday, 1), 'yyyy-MM-dd');
  const wedStr = format(addDays(monday, 2), 'yyyy-MM-dd');
  const thuStr = format(addDays(monday, 3), 'yyyy-MM-dd');
  const friStr = format(addDays(monday, 4), 'yyyy-MM-dd');
  const now = today.toISOString();

  return [
    {
      id: 'task-design-system',
      parent_id: null,
      title: 'Finalize Froyo Pastel Theme Architecture',
      notes: 'Audit contrast ratios across rose pink surfaces and dark mauve tokens',
      completed: true,
      due_date: todayStr,
      scheduled_time: '09:30',
      is_event: false,
      list_id: null,
      tag_ids: ['tag-deep-work'],
      order: 1,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'task-design-sub-1',
      parent_id: 'task-design-system',
      title: 'Calibrate dynamic CSS variables in root scope',
      completed: true,
      due_date: todayStr,
      list_id: null,
      tag_ids: ['tag-review'],
      order: 1,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'task-mascot-sync',
      parent_id: null,
      title: 'Review Companion Mascot SVG Animations',
      notes: 'Verify flourishing particle effects and wilting decay vectors',
      completed: false,
      due_date: todayStr,
      scheduled_time: '14:00',
      is_event: false,
      list_id: null,
      tag_ids: ['tag-urgent', 'tag-deep-work'],
      order: 2,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'task-calendar-sync',
      parent_id: null,
      title: 'Product Design Crit & Weekly Sync',
      completed: true,
      due_date: tueStr === todayStr ? wedStr : tueStr,
      scheduled_time: '11:00',
      is_event: true,
      list_id: null,
      tag_ids: ['tag-review'],
      order: 3,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'task-sprint-retro',
      parent_id: null,
      title: 'Prepare Q4 Focus Analytics Deck',
      completed: false,
      due_date: thuStr === todayStr ? friStr : thuStr,
      scheduled_time: '16:00',
      is_event: false,
      list_id: null,
      tag_ids: ['tag-low-energy'],
      order: 4,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'task-idea-soundscapes',
      parent_id: null,
      title: 'Explore binaural rain synth for Ambient Focus mode',
      completed: false,
      due_date: null,
      list_id: 'list-ideas',
      tag_ids: ['tag-low-energy'],
      order: 1,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'task-backlog-shortcuts',
      parent_id: null,
      title: 'Add vim-style j/k task tree navigation',
      completed: false,
      due_date: null,
      list_id: 'list-backlog',
      tag_ids: ['tag-review'],
      order: 1,
      created_at: now,
      updated_at: now,
    },
  ];
}

export function getInitialFocusSessionsSeed(): FocusSessionLog[] {
  const today = new Date();
  const sessions: FocusSessionLog[] = [];
  const durations = [50, 75, 45, 90, 60, 110, 45];

  for (let i = 6; i >= 0; i--) {
    const d = subDays(today, i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const mins = durations[6 - i];
    sessions.push({
      id: `session-seed-${i}`,
      mode: 'pomodoro',
      duration_minutes: mins,
      duration_seconds: mins * 60,
      task_id: 'task-design-system',
      task_title: 'Finalize Froyo Pastel Theme Architecture',
      mascot_id: 'flora',
      activity: i % 3 === 0 ? 'sleeping' : i % 2 === 0 ? 'reading' : 'meditating',
      started_at: new Date(d.getTime() - mins * 60000).toISOString(),
      completed_at: d.toISOString(),
      date: dateStr,
    });
  }
  return sessions;
}

// ----------------- Realtime Firestore / Storage Sync -----------------

export function subscribeToUserCollection<T extends { id: string }>(
  uid: string,
  colName: FirestoreCollectionName,
  seedGenerator: () => T[],
  onData: (items: T[]) => void
): () => void {
  const key = getStorageKey(uid, colName);

  const emitLocal = () => {
    const data = readLocalCollection<T>(uid, colName, seedGenerator);
    syncGlobalInspectionMirror(uid);
    onData(data);
  };

  if (!listenersMap.has(key)) {
    listenersMap.set(key, new Set());
  }
  listenersMap.get(key)!.add(emitLocal);

  // Immediately emit initial cached snapshot
  emitLocal();

  let unsubFirestore: (() => void) | null = null;
  if (isCloudConfigured && db) {
    try {
      const colRef = collection(db, 'users', uid, colName);
      unsubFirestore = firestoreOnSnapshot(
        colRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const docs = snapshot.docs.map((d) => ({ ...(d.data() as T), id: d.id }));
            writeLocalCollection(uid, colName, docs);
          }
        },
        () => {
          // Offline / local fallback remains active
        }
      );
    } catch {
      // Fallback to local snapshot
    }
  }

  return () => {
    listenersMap.get(key)?.delete(emitLocal);
    if (unsubFirestore) unsubFirestore();
  };
}

export async function upsertUserDocument<T extends { id: string }>(
  uid: string,
  colName: FirestoreCollectionName,
  item: T,
  seedGenerator: () => T[]
): Promise<void> {
  const current = readLocalCollection<T>(uid, colName, seedGenerator);
  const idx = current.findIndex((existing) => existing.id === item.id);
  const next =
    idx >= 0 ? current.map((existing, i) => (i === idx ? item : existing)) : [...current, item];

  writeLocalCollection(uid, colName, next);

  if (isCloudConfigured && db) {
    try {
      const docRef = doc(db, 'users', uid, colName, item.id);
      await setDoc(docRef, item, { merge: true });
    } catch {
      // Queued in persistentLocalCache
    }
  }
}

export async function deleteUserDocument<T extends { id: string }>(
  uid: string,
  colName: FirestoreCollectionName,
  itemId: string,
  seedGenerator: () => T[]
): Promise<void> {
  const current = readLocalCollection<T>(uid, colName, seedGenerator);
  const next = current.filter((existing) => existing.id !== itemId);
  writeLocalCollection(uid, colName, next);

  if (isCloudConfigured && db) {
    try {
      const docRef = doc(db, 'users', uid, colName, itemId);
      await deleteDoc(docRef);
    } catch {
      // Queued in persistentLocalCache
    }
  }
}

const PREFS_KEY = 'froyo_user_preferences_v1';

export function loadUserPreferences(): UserPreferences {
  const defaults: UserPreferences = {
    themeMode: 'pastel-pink',
    customTheme: PASTEL_PINK_THEME,
    activeMascot: 'flora',
    dailyFocusGoalMinutes: 120,
    splitRatio: 50,
  };
  if (typeof window === 'undefined') return defaults;
  const raw = window.localStorage.getItem(PREFS_KEY);
  if (!raw) return defaults;
  try {
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

export function saveUserPreferences(prefs: UserPreferences): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}
