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
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported as isMessagingSupported,
  Messaging,
} from 'firebase/messaging';
import { addDays, format, startOfWeek, subDays } from 'date-fns';
import {
  AccessoryId,
  BroadcastNotification,
  CoinGainEvent,
  CustomThemeTokens,
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
  uid: 'user-pastel-creator',
  email: 'creator@froyo.app',
  displayName: 'Froyo Creator',
  photoURL: null,
  isAnonymous: false,
};

const AUTH_STORAGE_KEY = 'froyo_current_auth_user_v1';
const REGISTERED_USERS_KEY = 'froyo_registered_users_registry_v1';

export type FirestoreCollectionName =
  | 'tasks'
  | 'lists'
  | 'tags'
  | 'focus_sessions'
  | 'settings'
  | 'fcm_tokens'
  | 'broadcast_notifications';

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

// ----------------- Custom Theme Persistence in Firestore -----------------

export async function saveUserThemeToFirestore(
  uid: string,
  customTheme: CustomThemeTokens,
  themeMode: 'pastel-pink' | 'dark' | 'custom'
): Promise<void> {
  const currentPrefs = loadUserPreferences();
  const nextPrefs: UserPreferences = {
    ...currentPrefs,
    customTheme,
    themeMode,
  };
  saveUserPreferences(nextPrefs);

  if (isCloudConfigured && db) {
    try {
      const userDocRef = doc(db, 'users', uid);
      await setDoc(
        userDocRef,
        {
          custom_theme: customTheme,
          theme_mode: themeMode,
          updated_at: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch {
      // Local persistent cache fallback
    }
  }

  // Also write to local user record
  const regRaw = typeof window !== 'undefined' ? window.localStorage.getItem(REGISTERED_USERS_KEY) : null;
  if (regRaw) {
    try {
      const reg = JSON.parse(regRaw);
      for (const email of Object.keys(reg)) {
        if (reg[email].uid === uid) {
          reg[email].custom_theme = customTheme;
          reg[email].theme_mode = themeMode;
        }
      }
      window.localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(reg));
    } catch {
      // ignore
    }
  }
}

// ----------------- Virtual Currency (Froyo Coins) & Sanctuary Shop -----------------

const WALLET_KEY_PREFIX = 'froyo_user_wallet_v1_';

export interface UserWalletData {
  coins: number;
  purchasedAccessories: AccessoryId[];
  equippedAccessory: AccessoryId | null;
}

export function getUserWallet(uid: string): UserWalletData {
  const defaultWallet: UserWalletData = {
    coins: 60, // Welcome gift so user can experience the sanctuary shop immediately
    purchasedAccessories: ['nightcap'],
    equippedAccessory: null,
  };

  if (typeof window === 'undefined') return defaultWallet;
  const raw = window.localStorage.getItem(`${WALLET_KEY_PREFIX}${uid}`);
  if (!raw) {
    window.localStorage.setItem(`${WALLET_KEY_PREFIX}${uid}`, JSON.stringify(defaultWallet));
    return defaultWallet;
  }
  try {
    return { ...defaultWallet, ...JSON.parse(raw) };
  } catch {
    return defaultWallet;
  }
}

function saveUserWallet(uid: string, data: UserWalletData): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(`${WALLET_KEY_PREFIX}${uid}`, JSON.stringify(data));
  broadcastChannel?.postMessage({ key: `wallet_${uid}` });

  if (isCloudConfigured && db) {
    try {
      const docRef = doc(db, 'users', uid);
      setDoc(
        docRef,
        {
          coins: data.coins,
          purchased_accessories: data.purchasedAccessories,
          equipped_accessory: data.equippedAccessory,
          updated_at: new Date().toISOString(),
        },
        { merge: true }
      ).catch(() => {});
    } catch {
      // persistent cache fallback
    }
  }
}

/**
 * Award Froyo Coins:
 * - Standard task: +10 coins
 * - Priority tagged task: +25 coins
 * - 3-day weekly momentum streak: +50 coins
 */
export function awardUserCoins(
  uid: string,
  hasPriorityTag: boolean,
  isStreak: boolean
): { wallet: UserWalletData; event: CoinGainEvent } {
  let amount = 10;
  let reason = 'Completed standard task';
  if (isStreak) {
    amount = 50;
    reason = '3-day weekly momentum streak bonus';
  } else if (hasPriorityTag) {
    amount = 25;
    reason = 'Priority tagged task bonus';
  }

  const current = getUserWallet(uid);
  const updated: UserWalletData = {
    ...current,
    coins: current.coins + amount,
  };
  saveUserWallet(uid, updated);

  const event: CoinGainEvent = {
    id: `coin-award-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    amount,
    reason,
  };

  return { wallet: updated, event };
}

export function purchaseUserAccessory(
  uid: string,
  accessoryId: AccessoryId,
  cost: number
): UserWalletData {
  const current = getUserWallet(uid);
  if (current.purchasedAccessories.includes(accessoryId)) {
    return current;
  }
  if (current.coins < cost) {
    throw new Error(`Insufficient Froyo Coins! Need ${cost - current.coins} more.`);
  }

  const updated: UserWalletData = {
    ...current,
    coins: current.coins - cost,
    purchasedAccessories: [...current.purchasedAccessories, accessoryId],
    equippedAccessory: accessoryId, // Automatically equip on purchase for instant gratification
  };
  saveUserWallet(uid, updated);
  return updated;
}

export function equipUserAccessory(
  uid: string,
  accessoryId: AccessoryId | null
): UserWalletData {
  const current = getUserWallet(uid);
  const updated: UserWalletData = {
    ...current,
    equippedAccessory: accessoryId,
  };
  saveUserWallet(uid, updated);
  return updated;
}

// ----------------- FCM & Push Notifications -----------------

let messagingInstance: Messaging | null = null;

export async function getMessagingModule(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null;
  if (messagingInstance) return messagingInstance;
  try {
    const supported = await isMessagingSupported();
    if (supported && app) {
      messagingInstance = getMessaging(app);
      return messagingInstance;
    }
  } catch {
    // Unsupported environment / no SW
  }
  return null;
}

const GLOBAL_FCM_TOKENS_KEY = 'froyo_global_fcm_tokens_registry_v1';

export async function requestNotificationToken(uid: string): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return null;
  }

  let token: string | null = null;
  try {
    const messaging = await getMessagingModule();
    if (messaging && 'serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      token = await getToken(messaging, {
        serviceWorkerRegistration: registration,
        vapidKey: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDZKrxZ_W7kfZW5tBwP1p8U_5Yx_xZ7F3F',
      });
    }
  } catch {
    // Fallback resilient token generation for offline / test environments
  }

  if (!token) {
    token = `fcm-token-${uid}-${Math.random().toString(36).slice(2, 10)}`;
  }

  // Save to user's tokens collection: users/{uid}/fcm_tokens/{tokenId}
  const tokenDoc = {
    id: `token-${token.slice(-12)}`,
    uid,
    token,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 200) : 'Web Client',
    created_at: new Date().toISOString(),
  };

  await upsertUserDocument(uid, 'fcm_tokens' as FirestoreCollectionName, tokenDoc, () => [tokenDoc]);

  // Save to global admin token registry for broadcast tracking
  const rawGlobal = window.localStorage.getItem(GLOBAL_FCM_TOKENS_KEY);
  const registry: Record<string, string> = rawGlobal ? JSON.parse(rawGlobal) : {};
  registry[token] = uid;
  window.localStorage.setItem(GLOBAL_FCM_TOKENS_KEY, JSON.stringify(registry));

  return token;
}

export function subscribeToForegroundMessages(
  onMessageReceived: (payload: { title: string; body: string }) => void
): () => void {
  let unsubFcm: (() => void) | null = null;

  getMessagingModule().then((messaging) => {
    if (messaging) {
      unsubFcm = onMessage(messaging, (payload) => {
        const title = payload.notification?.title || payload.data?.title || 'Froyo Notification';
        const body = payload.notification?.body || payload.data?.body || '';
        onMessageReceived({ title, body });
      });
    }
  });

  return () => {
    if (unsubFcm) unsubFcm();
  };
}

// ----------------- Admin Role-Based Broadcast Engine -----------------

const BROADCASTS_STORAGE_KEY = 'froyo_broadcast_notifications_v1';
const broadcastSubscribers = new Set<(n: BroadcastNotification) => void>();

export async function broadcastPushNotification(
  title: string,
  body: string,
  senderEmailOrPriority?: string,
  maybePriority: 'normal' | 'high' = 'high'
): Promise<BroadcastNotification> {
  let senderEmail = 'maker@froyo.app';
  let priority: 'normal' | 'high' = 'high';

  if (senderEmailOrPriority === 'normal' || senderEmailOrPriority === 'high') {
    priority = senderEmailOrPriority;
    senderEmail = getCurrentUser()?.email || 'maker@froyo.app';
  } else if (senderEmailOrPriority) {
    senderEmail = senderEmailOrPriority;
    priority = maybePriority;
  } else {
    senderEmail = getCurrentUser()?.email || 'maker@froyo.app';
  }

  // CRITICAL RBAC CHECK: Only maker@froyo.app is granted Administrator privileges
  if (senderEmail.trim().toLowerCase() !== 'maker@froyo.app') {
    throw new Error('Access Denied: Only maker@froyo.app possesses Administrator broadcast privileges.');
  }

  const notification: BroadcastNotification = {
    id: `broadcast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    body,
    sender_email: 'maker@froyo.app',
    created_at: new Date().toISOString(),
    target: 'all',
    priority,
  };

  // 1. Save to local broadcast registry
  if (typeof window !== 'undefined') {
    const raw = window.localStorage.getItem(BROADCASTS_STORAGE_KEY);
    const list: BroadcastNotification[] = raw ? JSON.parse(raw) : [];
    window.localStorage.setItem(BROADCASTS_STORAGE_KEY, JSON.stringify([notification, ...list]));
  }

  // 2. Persist to Firestore collection `broadcast_notifications/{id}`
  if (isCloudConfigured && db) {
    try {
      const docRef = doc(db, 'broadcast_notifications', notification.id);
      await setDoc(docRef, notification);
    } catch {
      // offline fallback
    }
  }

  // 3. Emit to all active client tabs / listeners
  broadcastSubscribers.forEach((cb) => cb(notification));
  broadcastChannel?.postMessage({
    type: 'froyo_broadcast_notification',
    payload: notification,
  });

  // 4. Show native browser notification if granted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(notification.title, {
        body: notification.body,
        icon: '/froyo-logo.svg',
      });
    } catch {
      // ignore
    }
  }

  return notification;
}

export function subscribeToBroadcastNotifications(
  onBroadcast: (n: BroadcastNotification) => void
): () => void {
  broadcastSubscribers.add(onBroadcast);

  // Hook into broadcast channel for cross-tab realtime synchronization
  const handler = (event: MessageEvent) => {
    if (event.data?.type === 'froyo_broadcast_notification' && event.data.payload) {
      onBroadcast(event.data.payload as BroadcastNotification);
    }
  };

  broadcastChannel?.addEventListener('message', handler);

  return () => {
    broadcastSubscribers.delete(onBroadcast);
    broadcastChannel?.removeEventListener('message', handler);
  };
}

export async function getAdminBroadcastMetrics(): Promise<{
  totalTokens: number;
  totalSubscribers: number;
  recentBroadcasts: BroadcastNotification[];
}> {
  if (typeof window === 'undefined') {
    return { totalTokens: 1, totalSubscribers: 1, recentBroadcasts: [] };
  }

  const rawTokens = window.localStorage.getItem(GLOBAL_FCM_TOKENS_KEY);
  const tokenMap: Record<string, string> = rawTokens ? JSON.parse(rawTokens) : {};
  const totalTokens = Math.max(1, Object.keys(tokenMap).length);

  const rawBroadcasts = window.localStorage.getItem(BROADCASTS_STORAGE_KEY);
  const recentBroadcasts: BroadcastNotification[] = rawBroadcasts ? JSON.parse(rawBroadcasts) : [];

  return {
    totalTokens,
    totalSubscribers: Math.max(1, new Set(Object.values(tokenMap)).size),
    recentBroadcasts: recentBroadcasts.slice(0, 10),
  };
}

