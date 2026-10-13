import React from 'react';
import { Database, ShieldCheck, Sliders, User, Volume2, X } from 'lucide-react';
import { FroyoUser, UserPreferences } from '../types/froyo';

interface AccountDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: FroyoUser | null;
  onOpenAuth: () => void;
}

export const AccountDetailsModal: React.FC<AccountDetailsModalProps> = ({
  isOpen,
  onClose,
  user,
  onOpenAuth,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      data-testid="account-details-modal"
    >
      <div className="w-full max-w-md rounded-3xl bg-froyo-surface border border-froyo-border shadow-froyo-lg p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-froyo-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-froyo-accent/15 text-froyo-accent flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-froyo-text">Account Details</h2>
              <p className="text-xs text-froyo-muted">Firebase Auth profile & Firestore routing</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-froyo-elevated text-froyo-muted hover:text-froyo-text"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {user ? (
          <div className="space-y-3.5 text-xs">
            <div className="p-3.5 rounded-2xl bg-froyo-elevated/80 border border-froyo-border space-y-2">
              <div className="flex justify-between">
                <span className="text-froyo-muted font-medium">Display Name:</span>
                <span className="font-bold text-froyo-text">{user.displayName || 'Froyo User'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-froyo-muted font-medium">Email:</span>
                <span className="font-mono font-bold text-froyo-accent">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-froyo-muted font-medium">UID:</span>
                <span className="font-mono text-[11px] text-froyo-text max-w-[200px] truncate">
                  {user.uid}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-froyo-border">
                <span className="text-froyo-muted font-medium">Firestore Path:</span>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-froyo-surface text-froyo-text">
                  users/{user.uid}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>Offline persistence active via persistentLocalCache.</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 space-y-3">
            <p className="text-xs text-froyo-muted">
              You are currently using Froyo as a guest. Sign in to sync your data across devices.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="px-4 py-2 rounded-xl font-bold text-xs bg-froyo-accent text-white"
            >
              Sign In or Register
            </button>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-froyo-elevated text-froyo-text border border-froyo-border hover:bg-froyo-canvas"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdatePreferences: (next: UserPreferences) => void;
}

export const ConfigurationModal: React.FC<ConfigurationModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      data-testid="configuration-modal"
    >
      <div className="w-full max-w-md rounded-3xl bg-froyo-surface border border-froyo-border shadow-froyo-lg p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-froyo-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-froyo-accent/15 text-froyo-accent flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-froyo-text">Configuration</h2>
              <p className="text-xs text-froyo-muted">Preferences, daily targets & defaults</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-froyo-elevated text-froyo-muted hover:text-froyo-text"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-froyo-muted mb-1.5">
              Daily Focus Target (Minutes)
            </label>
            <div className="flex items-center gap-2">
              {[60, 90, 120, 180, 240].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() =>
                    onUpdatePreferences({ ...preferences, dailyFocusGoalMinutes: mins })
                  }
                  className={`flex-1 py-2 rounded-xl font-bold border transition-all ${
                    preferences.dailyFocusGoalMinutes === mins
                      ? 'bg-froyo-accent text-white border-froyo-accent shadow-sm'
                      : 'bg-froyo-elevated text-froyo-text border-froyo-border hover:border-froyo-accent'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-froyo-elevated/70 border border-froyo-border space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-froyo-text font-semibold">
                <Database className="w-4 h-4 text-froyo-accent" />
                <span>Offline Cache Mode</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-500 uppercase">
                persistentLocalCache
              </span>
            </div>
            <p className="text-[11px] text-froyo-muted">
              Data is automatically indexed and cached locally in multi-tab indexedDB storage.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-froyo-accent text-white"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
