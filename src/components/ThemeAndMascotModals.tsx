import React from 'react';
import { Palette, Sparkles, X } from 'lucide-react';
import {
  CustomThemeTokens,
  MascotHealthMetrics,
  MascotType,
  UserPreferences,
} from '../types/froyo';
import { PRESET_THEMES } from '../lib/theme';
import { MascotCompanion, MASCOT_CATALOG } from './MascotCompanion';

interface ThemeStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdatePreferences: (next: UserPreferences) => void;
}

export const ThemeStudioModal: React.FC<ThemeStudioModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
}) => {
  if (!isOpen) return null;

  const handleColorTokenChange = (key: keyof CustomThemeTokens, value: string) => {
    onUpdatePreferences({
      ...preferences,
      themeMode: 'custom',
      customTheme: {
        ...preferences.customTheme,
        [key]: value,
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      data-testid="theme-studio-modal"
    >
      <div className="w-full max-w-xl rounded-3xl bg-froyo-surface border border-froyo-border shadow-froyo-lg p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-froyo-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-froyo-accent/15 text-froyo-accent flex items-center justify-center">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-froyo-text">
                Dynamic Theme Engine
              </h2>
              <p className="text-xs text-froyo-muted">
                Real-time CSS custom property injection across canvas, surfaces & accents
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

        {/* Preset Theme Profiles */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-froyo-muted mb-2.5">
            Curated Aesthetic Profiles
          </label>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(PRESET_THEMES).map(([key, preset]) => {
              const isSelected =
                (key === 'pastel-pink' && preferences.themeMode === 'pastel-pink') ||
                (key === 'dark' && preferences.themeMode === 'dark') ||
                (preferences.themeMode === 'custom' &&
                  preferences.customTheme.bgCanvas === preset.tokens.bgCanvas);

              return (
                <button
                  key={key}
                  type="button"
                  data-testid={`preset-theme-${key}`}
                  onClick={() =>
                    onUpdatePreferences({
                      ...preferences,
                      themeMode:
                        key === 'pastel-pink'
                          ? 'pastel-pink'
                          : key === 'dark'
                          ? 'dark'
                          : 'custom',
                      customTheme: preset.tokens,
                    })
                  }
                  className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-2 border-froyo-accent bg-froyo-elevated/80 shadow-sm'
                      : 'border-froyo-border bg-froyo-canvas/50 hover:border-froyo-accent/50'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-froyo-text">{preset.label}</div>
                    <div className="text-[11px] font-mono text-froyo-muted mt-0.5">
                      {preset.tokens.bgCanvas} · {preset.tokens.accentPrimary}
                    </div>
                  </div>
                  <div className="flex -space-x-1.5">
                    <span
                      className="w-5 h-5 rounded-full border border-black/10"
                      style={{ backgroundColor: preset.tokens.bgCanvas }}
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-black/10"
                      style={{ backgroundColor: preset.tokens.accentPrimary }}
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-black/10"
                      style={{ backgroundColor: preset.tokens.textPrimary }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fine-Grained CSS Variable Customizer */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-froyo-muted mb-2.5">
            Custom CSS Variable Overrides
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(
              [
                { key: 'bgCanvas', label: 'Primary Canvas' },
                { key: 'bgSurface', label: 'Surface / Cards' },
                { key: 'borderSubtle', label: 'Soft Borders' },
                { key: 'accentPrimary', label: 'Primary Accent' },
                { key: 'accentSecondary', label: 'Secondary Rose' },
                { key: 'textPrimary', label: 'Typography' },
              ] as const
            ).map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between p-2.5 rounded-xl bg-froyo-elevated/60 border border-froyo-border cursor-pointer"
              >
                <span className="text-xs font-medium text-froyo-text">{item.label}</span>
                <input
                  type="color"
                  data-testid={`custom-color-${item.key}`}
                  value={preferences.customTheme[item.key]}
                  onChange={(e) => handleColorTokenChange(item.key, e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-froyo-accent text-white shadow-sm hover:opacity-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

interface MascotSanctuaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMascot: MascotType;
  onSelectMascot: (mascot: MascotType) => void;
  healthMetrics: MascotHealthMetrics;
  healthOverride: number | null;
  onChangeHealthOverride: (score: number | null) => void;
}

export const MascotSanctuaryModal: React.FC<MascotSanctuaryModalProps> = ({
  isOpen,
  onClose,
  activeMascot,
  onSelectMascot,
  healthMetrics,
  healthOverride,
  onChangeHealthOverride,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      data-testid="mascot-sanctuary-modal"
    >
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto froyo-scroll rounded-3xl bg-froyo-surface border border-froyo-border shadow-froyo-lg p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-froyo-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-froyo-accent/15 text-froyo-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-froyo-text">
                Companion Mascot Sanctuary & Health Decay Engine
              </h2>
              <p className="text-xs text-froyo-muted">
                Choose your companion and inspect all 3 developmental health states
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

        {/* Live Formula Breakdown Card */}
        <div className="rounded-2xl bg-froyo-elevated/70 border border-froyo-border p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-froyo-accent">
              Real-Time Health Decay Algorithm
            </span>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-froyo-surface border border-froyo-border text-froyo-text">
              H = {healthMetrics.score} / 100 ({healthMetrics.state.toUpperCase()})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-froyo-surface border border-froyo-border">
              <div className="text-froyo-muted">Daily Completion (50% weight)</div>
              <div className="font-bold text-sm text-froyo-text mt-1">
                {healthMetrics.completedToday} / {healthMetrics.dueToday} tasks (+
                {Math.round(healthMetrics.todayRatio * 50)} HP)
              </div>
            </div>
            <div className="p-3 rounded-xl bg-froyo-surface border border-froyo-border">
              <div className="text-froyo-muted">Weekly Completion (50% weight)</div>
              <div className="font-bold text-sm text-froyo-text mt-1">
                {healthMetrics.completedThisWeek} / {healthMetrics.dueThisWeek} tasks (+
                {Math.round(healthMetrics.weekRatio * 50)} HP)
              </div>
            </div>
            <div className="p-3 rounded-xl bg-froyo-surface border border-froyo-border">
              <div className="text-froyo-muted">Overdue Decay Penalty</div>
              <div className="font-bold text-sm text-red-500 mt-1">
                {healthMetrics.overdueCount} overdue (-{healthMetrics.overduePenalty} HP)
              </div>
            </div>
          </div>

          {/* Health Tier Simulator Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-froyo-border">
            <span className="text-xs text-froyo-muted">
              State Preview Override (Test Flourishing / Neutral / Rotting states):
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onChangeHealthOverride(null)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                  healthOverride === null
                    ? 'bg-froyo-accent text-white border-froyo-accent'
                    : 'bg-froyo-surface text-froyo-text border-froyo-border'
                }`}
              >
                Live Formula
              </button>
              <button
                type="button"
                data-testid="simulate-health-flourishing"
                onClick={() => onChangeHealthOverride(92)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                  healthOverride === 92
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-froyo-surface text-froyo-text border-froyo-border'
                }`}
              >
                Flourishing (92 HP)
              </button>
              <button
                type="button"
                data-testid="simulate-health-neutral"
                onClick={() => onChangeHealthOverride(58)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                  healthOverride === 58
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-froyo-surface text-froyo-text border-froyo-border'
                }`}
              >
                Neutral (58 HP)
              </button>
              <button
                type="button"
                data-testid="simulate-health-degraded"
                onClick={() => onChangeHealthOverride(22)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                  healthOverride === 22
                    ? 'bg-red-500 text-white border-red-500'
                    : 'bg-froyo-surface text-froyo-text border-froyo-border'
                }`}
              >
                Rotting / Degraded (22 HP)
              </button>
            </div>
          </div>
        </div>

        {/* 4 Companion Mascot Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(Object.keys(MASCOT_CATALOG) as MascotType[]).map((mKey) => {
            const info = MASCOT_CATALOG[mKey];
            const selected = activeMascot === mKey;
            return (
              <div
                key={mKey}
                data-testid={`select-mascot-${mKey}`}
                onClick={() => onSelectMascot(mKey)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-4 ${
                  selected
                    ? 'border-2 border-froyo-accent bg-froyo-elevated/80 shadow-froyo-sm'
                    : 'border-froyo-border bg-froyo-surface hover:border-froyo-accent/50'
                }`}
              >
                <MascotCompanion
                  mascot={mKey}
                  healthState={healthMetrics.state}
                  healthScore={healthMetrics.score}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-froyo-accent/15 text-froyo-accent">
                      {info.category}
                    </span>
                    {selected && (
                      <span className="text-[11px] font-bold text-froyo-accent">Active</span>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-base text-froyo-text mt-1">
                    {info.name}
                  </h3>
                  <p className="text-xs text-froyo-muted">{info.subtitle}</p>
                  <p className="text-[11px] text-froyo-text mt-1.5 leading-snug">
                    {healthMetrics.state === 'flourishing'
                      ? info.flourishingDesc
                      : healthMetrics.state === 'degraded'
                      ? info.degradedDesc
                      : info.neutralDesc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
