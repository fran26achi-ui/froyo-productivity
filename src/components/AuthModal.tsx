import React, { useState } from 'react';
import { KeyRound, Mail, Sparkles, User, X } from 'lucide-react';
import { FroyoUser } from '../types/froyo';
import { loginWithEmail, registerWithEmail } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: FroyoUser) => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
}) => {
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isSignUp) {
        const user = await registerWithEmail(email, password, displayName);
        onAuthSuccess(user);
        onClose();
      } else {
        const user = await loginWithEmail(email, password);
        onAuthSuccess(user);
        onClose();
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const user = await loginWithEmail('maker@froyo.app', 'froyopastel123');
      onAuthSuccess(user);
      onClose();
    } catch {
      // If not yet in registry, register demo user
      const user = await registerWithEmail('maker@froyo.app', 'froyopastel123', 'Froyo Creator');
      onAuthSuccess(user);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      data-testid="auth-modal"
    >
      <div className="w-full max-w-md rounded-3xl bg-froyo-surface border border-froyo-border shadow-froyo-lg p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-froyo-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-froyo-accent/15 text-froyo-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-froyo-text">
                {isSignUp ? 'Create Your Froyo Account' : 'Sign in to Froyo'}
              </h2>
              <p className="text-xs text-froyo-muted">
                {isSignUp
                  ? 'Sync your mascots, calendar, and focus analytics'
                  : 'Welcome back to your ambient workspace'}
              </p>
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

        {error && (
          <div
            data-testid="auth-error-msg"
            className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 font-medium"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5" data-testid="auth-form">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-froyo-muted mb-1">
                Display Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-froyo-muted absolute left-3.5 top-3" />
                <input
                  type="text"
                  data-testid="auth-name-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Maya Chen"
                  className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-2xl bg-froyo-canvas border border-froyo-border text-froyo-text focus:outline-none focus:ring-2 focus:ring-froyo-accent"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-froyo-muted mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-froyo-muted absolute left-3.5 top-3" />
              <input
                type="email"
                required
                data-testid="auth-email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-2xl bg-froyo-canvas border border-froyo-border text-froyo-text focus:outline-none focus:ring-2 focus:ring-froyo-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-froyo-muted mb-1">Password</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-froyo-muted absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={6}
                data-testid="auth-password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-2xl bg-froyo-canvas border border-froyo-border text-froyo-text focus:outline-none focus:ring-2 focus:ring-froyo-accent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            data-testid="auth-submit-btn"
            className="w-full py-3 rounded-2xl font-bold text-xs bg-froyo-accent text-white shadow-froyo-md hover:opacity-95 transition-opacity disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="relative flex items-center justify-center my-3">
          <div className="border-t border-froyo-border w-full" />
          <span className="bg-froyo-surface px-3 text-[11px] uppercase tracking-wider text-froyo-muted">
            or
          </span>
        </div>

        <button
          type="button"
          onClick={handleDemoSignIn}
          data-testid="auth-demo-btn"
          className="w-full py-2.5 rounded-2xl font-bold text-xs bg-froyo-elevated border border-froyo-border text-froyo-text hover:border-froyo-accent transition-colors"
        >
          Quick Demo Login (maker@froyo.app)
        </button>

        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-xs text-froyo-accent font-semibold hover:underline"
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
};
