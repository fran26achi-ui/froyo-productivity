# Froyo — High-Aesthetic Productivity, Companion Gamification & Ambient Focus Suite

**Froyo** merges an adjustable split-screen weekly planner and calendar with infinitely nested task hierarchies, WCAG-compliant custom hex priority tags, a dynamic CSS variable theme engine, a companion mascot health decay system, and a low-stimulus ambient focus workspace with historical analytics.

---

## Core Architectural Modules

### 1. Dynamic Theme Engine & Adjustable Split-Screen Layout
- **Split-Screen Workspace (`src/App.tsx`, `src/components/InteractiveCalendarPane.tsx`)**:
  - Left pane: **Weekly To-Do Workspace & Standalone Custom Lists** (`Ideas`, `Personal Backlog`, plus user-created lists).
  - Right pane: **Interactive Calendar Grid** (Month & Week views) where dated tasks and scheduled events (`is_event`) are plotted concurrently.
  - Clicking any calendar date filters the task pane; dragging any task card onto a calendar day reschedules its deadline in Firestore.
- **Dynamic CSS Variable Theme Engine (`src/lib/theme.ts`, `src/index.css`)**:
  - Ships with the **Default Pastel Pink Profile** (`--bg-canvas: #FFF5F7`, `--bg-surface: #FFFFFF`, `--border-subtle: #FCE7ED`, `--accent-primary: #FF85A1`, `--text-primary: #3D3135`) and **Deep Mauve / Charcoal Dark Mode** (`#181316`).
  - Full live customizer for overriding individual CSS color variables.

### 2. Recursive Task Hierarchy & Custom Hex Priority Tags
- **Self-Referencing Hierarchy (`src/components/RecursiveTaskTree.tsx`)**:
  - Tasks reference `parent_id` for infinite nested subtask expansion with Framer Motion layout transitions.
- **Custom Hex Tags**:
  - Create arbitrary priority tags bound to any hex code; `getAccessibleTagStyles()` computes relative luminance to guarantee readable text contrast over soft background tints.

### 3. Companion Mascot Gamification & Health Decay System
- **4 Vector Companion Mascots (`src/components/MascotCompanion.tsx`)**:
  1. **Flora**: *Mochi Sprout* (Sakura Succulent)
  2. **Fauna**: *Neko-Byte* (Cyber-Cat Shiba)
  3. **Mythical**: *Pyro Puffs* (Baby Starlight Dragon)
  4. **Mechanical**: *Beeper-01* (Desktop Companion Bot)
- **Real-Time Health Decay Formula (`src/lib/healthEngine.ts`)**:
  $$H = \left(\frac{\text{Completed Today}}{\text{Due Today}} \times 50\right) + \left(\frac{\text{Completed This Week}}{\text{Due This Week}} \times 50\right) - (\text{Overdue Penalty})$$
  - **Flourishing ($H \ge 75$)**: Blooming flowers, glowing battery, animated sparkle particles.
  - **Neutral ($40 \le H < 75$)**: Calm idle breathing animations.
  - **Degraded / "Rotting" ($H < 40$)**: Wilting leaves, cracked pot, rust patches, and electric sparks.

### 4. Ambient Focus Workspace & Historical Analytics
- **Drift-Compensated Timers (`src/components/FocusAndAnalyticsView.tsx`)**:
  - Supports **Pomodoro 25/5**, **Custom Duration Countdowns**, and **Count-Up Stopwatch**.
  - Starting a session transitions the viewport into a low-stimulus dark canvas (`body.froyo-ambient-focus`) with the active mascot performing relaxing loops (`Sleeping`, `Reading`, or `Meditating`).
- **Analytics Dashboard**:
  - Logs sessions to `users/{uid}/focus_sessions` and renders Total Focus Hours, Daily Target vs. Actual progress, Historical Streak counters, and a 28-day Session Distribution Heatmap.

---

## Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run Playwright End-to-End Test Suite
npm run test:e2e
```
