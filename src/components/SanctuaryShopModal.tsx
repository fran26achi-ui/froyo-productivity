import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Coins,
  Crown,
  Lock,
  Shirt,
  Sparkles,
  X,
} from 'lucide-react';
import { AccessoryId, MascotHealthMetrics, MascotType } from '../types/froyo';
import { ACCESSORIES_CATALOG } from './MascotAccessories';
import { MascotCompanion } from './MascotCompanion';

interface SanctuaryShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  purchasedAccessories: AccessoryId[];
  equippedAccessory: AccessoryId | null;
  activeMascot: MascotType;
  healthMetrics: MascotHealthMetrics;
  onBuyAccessory: (id: AccessoryId, cost: number) => void;
  onEquipAccessory: (id: AccessoryId | null) => void;
}

export const SanctuaryShopModal: React.FC<SanctuaryShopModalProps> = ({
  isOpen,
  onClose,
  coins,
  purchasedAccessories,
  equippedAccessory,
  activeMascot,
  healthMetrics,
  onBuyAccessory,
  onEquipAccessory,
}) => {
  if (!isOpen) return null;

  const accessoriesList = Object.values(ACCESSORIES_CATALOG);

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
        data-testid="sanctuary-shop-modal"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          className="w-full max-w-2xl rounded-3xl bg-froyo-surface border border-froyo-border shadow-froyo-lg p-6 space-y-6 my-auto"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-froyo-border pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-400/20 text-amber-600 flex items-center justify-center border border-amber-300/40 shadow-sm">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-extrabold text-xl text-froyo-text">
                    Sanctuary Shop
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-froyo-accent/15 text-froyo-accent border border-froyo-accent/30 uppercase tracking-wider">
                    Cosmetics
                  </span>
                </div>
                <p className="text-xs text-froyo-muted">
                  Dress up your companions with universal accessories purchased with Froyo Coins!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Wallet Badge */}
              <div
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-amber-700 dark:text-amber-300 font-bold text-sm shadow-sm"
                data-testid="shop-wallet-badge"
              >
                <Coins className="w-4 h-4 text-amber-500 animate-bounce" />
                <span>{coins}</span>
                <span className="text-[11px] font-semibold text-amber-600/80">Coins</span>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                data-testid="close-shop-modal-btn"
                className="p-2 rounded-xl hover:bg-froyo-elevated text-froyo-muted hover:text-froyo-text transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Active Mascot Live Preview Fitting Room */}
          <div className="p-4 rounded-2xl bg-froyo-canvas/70 border border-froyo-border flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-froyo-surface border border-froyo-border shadow-sm flex items-center justify-center overflow-hidden">
                <MascotCompanion
                  mascot={activeMascot}
                  healthState={healthMetrics.state}
                  healthScore={healthMetrics.score}
                  size="md"
                  equippedAccessory={equippedAccessory}
                />
              </div>
              <div>
                <div className="text-xs font-semibold text-froyo-muted uppercase tracking-wider">
                  Mascot Fitting Room
                </div>
                <div className="font-display font-bold text-base text-froyo-text">
                  Currently Wearing:
                </div>
                <div className="text-xs font-medium text-froyo-accent mt-0.5">
                  {equippedAccessory
                    ? ACCESSORIES_CATALOG[equippedAccessory]?.name || 'Equipped Accessory'
                    : 'Natural (No accessory equipped)'}
                </div>
              </div>
            </div>

            {equippedAccessory && (
              <button
                type="button"
                onClick={() => onEquipAccessory(null)}
                className="px-3.5 py-1.5 rounded-xl border border-froyo-border bg-froyo-surface text-xs font-semibold text-froyo-muted hover:text-froyo-text hover:bg-froyo-elevated transition-colors"
                data-testid="unequip-accessory-btn"
              >
                Unequip
              </button>
            )}
          </div>

          {/* Accessory Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[380px] overflow-y-auto pr-1">
            {accessoriesList.map((item) => {
              const isPurchased = purchasedAccessories.includes(item.id);
              const isEquipped = equippedAccessory === item.id;
              const canAfford = coins >= item.cost;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    isEquipped
                      ? 'bg-froyo-accent/10 border-froyo-accent shadow-froyo-sm'
                      : isPurchased
                      ? 'bg-froyo-surface border-froyo-border hover:border-froyo-accent/40'
                      : 'bg-froyo-surface/80 border-froyo-border hover:border-froyo-border'
                  }`}
                  data-testid={`shop-item-${item.id}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Accessory Mini SVG Preview */}
                    <div className="w-14 h-14 rounded-2xl bg-froyo-canvas border border-froyo-border flex items-center justify-center shrink-0 relative overflow-hidden">
                      <svg viewBox="0 0 160 160" className="w-full h-full">
                        {/* Ghost Base Mascot for Scale Reference */}
                        <ellipse cx="80" cy="90" rx="36" ry="32" fill="#E2E8F0" opacity="0.25" />
                        <MascotCompanion
                          mascot="flora"
                          healthState="neutral"
                          healthScore={50}
                          size="sm"
                          equippedAccessory={item.id}
                        />
                      </svg>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-display font-bold text-sm text-froyo-text truncate">
                          {item.name}
                        </h3>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-froyo-elevated text-froyo-muted shrink-0">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-froyo-muted line-clamp-2 mt-1 leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-froyo-border/50">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                      <span>{item.cost} Coins</span>
                    </div>

                    {isEquipped ? (
                      <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-froyo-accent text-white font-bold text-xs shadow-sm">
                        <Check className="w-3.5 h-3.5" /> Equipped
                      </span>
                    ) : isPurchased ? (
                      <button
                        type="button"
                        onClick={() => onEquipAccessory(item.id)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-froyo-elevated hover:bg-froyo-accent hover:text-white border border-froyo-border text-xs font-bold text-froyo-text transition-colors"
                        data-testid={`equip-btn-${item.id}`}
                      >
                        <Shirt className="w-3.5 h-3.5" /> Equip
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() => onBuyAccessory(item.id, item.cost)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                            : 'bg-froyo-canvas border border-froyo-border text-froyo-muted cursor-not-allowed opacity-60'
                        }`}
                        data-testid={`buy-btn-${item.id}`}
                      >
                        {canAfford ? (
                          <>
                            <Sparkles className="w-3.5 h-3.5" /> Buy ({item.cost})
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" /> Need {item.cost - coins} More
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reward Logic Explainer Footer */}
          <div className="p-3.5 rounded-2xl bg-froyo-elevated/80 border border-froyo-border text-xs text-froyo-muted flex items-center justify-between">
            <span className="font-semibold text-froyo-text">How to earn Froyo Coins:</span>
            <div className="flex items-center gap-3 font-medium text-[11px]">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">+10 standard</span>
              <span>•</span>
              <span className="text-froyo-accent font-bold">+25 priority tagged</span>
              <span>•</span>
              <span className="text-amber-500 font-bold">+50 3-day weekly streak</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
