import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCircle2,
  Clock,
  Radio,
  Send,
  ShieldAlert,
  Smartphone,
  Users,
  X,
} from 'lucide-react';
import { BroadcastNotification } from '../types/froyo';

interface AdminBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminEmail: string;
  totalTokensCount: number;
  recentBroadcasts: BroadcastNotification[];
  onSendBroadcast: (title: string, body: string, priority: 'normal' | 'high') => Promise<void>;
}

export const AdminBroadcastModal: React.FC<AdminBroadcastModalProps> = ({
  isOpen,
  onClose,
  adminEmail,
  totalTokensCount,
  recentBroadcasts,
  onSendBroadcast,
}) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high'>('high');
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setIsSending(true);
    setFeedback(null);
    try {
      await onSendBroadcast(title.trim(), body.trim(), priority);
      setFeedback({
        type: 'success',
        message: `Broadcast successfully pushed to ${Math.max(1, totalTokensCount)} registered devices!`,
      });
      setTitle('');
      setBody('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Broadcast failed to dispatch';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 overflow-y-auto"
        data-testid="admin-broadcast-modal"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="w-full max-w-2xl rounded-3xl bg-froyo-surface border border-froyo-border shadow-froyo-lg p-6 space-y-6 my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-froyo-border pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center border border-rose-300/40 shadow-sm">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-extrabold text-xl text-froyo-text">
                    Admin Push Broadcast Center
                  </h2>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 border border-red-500/30 uppercase tracking-widest">
                    RBAC Admin Only
                  </span>
                </div>
                <p className="text-xs text-froyo-muted">
                  Push instant web notifications & foreground toasts to all user FCM tokens
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-froyo-elevated text-froyo-muted hover:text-froyo-text"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Admin Identity Badge */}
          <div className="p-3.5 rounded-2xl bg-froyo-canvas border border-froyo-border flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-froyo-text font-medium">
              <ShieldAlert className="w-4 h-4 text-emerald-500" />
              <span>
                Authorized Administrator:{' '}
                <strong className="text-froyo-accent font-mono">{adminEmail}</strong>
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-froyo-muted">
              <div className="flex items-center gap-1.5" title="Active FCM tokens across database">
                <Smartphone className="w-4 h-4 text-froyo-accent" />
                <span>
                  <strong className="text-froyo-text">{Math.max(1, totalTokensCount)}</strong> Active
                  Devices
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-500" />
                <span>All Subscribers</span>
              </div>
            </div>
          </div>

          {/* Feedback Banner */}
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 border ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
              }`}
              data-testid="admin-broadcast-feedback"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedback.message}</span>
            </motion.div>
          )}

          {/* Broadcast Composer Form */}
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="broadcast-form">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-froyo-muted mb-1.5">
                Notification Headline
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 🍨 New Sanctuary Accessories Dropped!"
                data-testid="broadcast-title-input"
                className="w-full text-xs px-3.5 py-2.5 rounded-2xl bg-froyo-canvas border border-froyo-border text-froyo-text focus:outline-none focus:ring-2 focus:ring-froyo-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-froyo-muted mb-1.5">
                Message Body
              </label>
              <textarea
                required
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="e.g. Earn 25 Froyo Coins on priority tasks this weekend to unlock the 8-Bit Pixel Shades."
                data-testid="broadcast-body-input"
                className="w-full text-xs px-3.5 py-2.5 rounded-2xl bg-froyo-canvas border border-froyo-border text-froyo-text focus:outline-none focus:ring-2 focus:ring-froyo-accent resize-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-froyo-muted">Priority:</span>
                <button
                  type="button"
                  onClick={() => setPriority('high')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                    priority === 'high'
                      ? 'bg-red-500 text-white border-red-500 shadow-sm'
                      : 'bg-froyo-canvas text-froyo-muted border-froyo-border'
                  }`}
                >
                  High (Heads Up)
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('normal')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                    priority === 'normal'
                      ? 'bg-froyo-accent text-white border-froyo-accent shadow-sm'
                      : 'bg-froyo-canvas text-froyo-muted border-froyo-border'
                  }`}
                >
                  Standard
                </button>
              </div>

              <button
                type="submit"
                disabled={isSending || !title.trim() || !body.trim()}
                data-testid="broadcast-submit-btn"
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-froyo-accent text-white shadow-froyo-md hover:opacity-95 transition-opacity disabled:opacity-50"
              >
                {isSending ? (
                  <span>Dispatching to FCM...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Broadcast to All Users</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Historical Broadcasts Log */}
          {recentBroadcasts.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-froyo-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-froyo-muted">
                  Recent Broadcast Transmissions
                </span>
                <span className="text-[11px] text-froyo-muted font-medium">
                  {recentBroadcasts.length} sent
                </span>
              </div>

              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {recentBroadcasts.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-2xl bg-froyo-canvas border border-froyo-border text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-froyo-text truncate">{b.title}</span>
                      <div className="flex items-center gap-1 text-[10px] text-froyo-muted shrink-0">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <p className="text-froyo-muted line-clamp-1">{b.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
