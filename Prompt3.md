### Task: Phase 3 — High-Impact Golden Path Dashboard & UI Integration

#### 1. Context & Objectives
We are building the primary user dashboard for Study Guardian. It connects the Phase 1 types and Phase 2 logic engines into a cohesive, high-contrast interface designed for a 90-second hackathon presentation.

The interface must bring together:
1. Live Focus Cam monitor with real-time detection telemetry and audio alarm status.
2. The 3-Mode Distraction Blocker control (All Sites Allowed / Study Sites Only / All Sites Blocked).
3. The Transcript-to-Notes studio with automated summarization and a stylized "Handwritten Notebook" preview card.

---

#### 2. Target Files
- `src/app/page.tsx` or `src/components/dashboard/GuardianDashboard.tsx`: Main dashboard container.
- `src/components/vision/FocusCameraCard.tsx`: Webcam viewport with active tracking overlay.
- `src/components/blocker/SiteBlockerControl.tsx`: Interactive site filtering module.
- `src/components/notes/NotesStudio.tsx`: Transcript input, generation trigger, and visual note renderer.

---

#### 3. Component Specifications

##### A. Focus Camera Card (`FocusCameraCard.tsx`)
- Embed live `<video>` feed connected via `useFocusSession()`.
- Add a floating badge indicating status:
  - Focused: Subtle emerald pill (`● Tracking — Focused`).
  - Distracted: Pulsing amber/red pill (`⚠ Distracted: Gaze Away / Absent`).
- Telemetry bar below video showing:
  - Focus Score percentage (calculated based on session duration vs. distractions).
  - Distraction counter badge.
- Include a hidden/discrete "Quick Demo Trigger" button to immediately force distraction state for judges.

##### B. 3-Mode Site Blocker (`SiteBlockerControl.tsx`)
- Segmented toggle control featuring the TL's 3 required states:
  1. `Allow All Sites` (Default open state).
  2. `Study Sites Only` (Whitelists YouTube/PW, ChatGPT, Gemini, Coursera, documentation).
  3. `Block All Sites` (Strict lockdown mode).
- Visual feedback: Display an interactive whitelist tag list. If in "Block All Sites" mode, render a mock browser preview window showing an active "Distraction Blocked — Return to Session" defensive shield.

##### C. Notes Studio & "Handwritten" Render (`NotesStudio.tsx`)
- Input area with a "Load Sample Lecture Transcript" 1-click button (pre-fills 300 words of complex technical text from mock data).
- Action button: "Generate AI Study Notes" with loading skeleton animation.
- Output Viewer:
  - Split toggle: "Clean Digital" vs. "Handwritten Sheet".
  - For the "Handwritten Sheet" view: render on a lined notebook background card using a clean handwritten web font (e.g., `Caveat` or `Indie Flower` via Google Fonts / `@font-face`) with slightly randomized slight rotation (±0.5deg) and colored highlighter accents for key takeaways.

---

#### 4. UX & Defensive Standards
- Zero Layout Shifts: Skeletons must match final component dimensions.
- Empty States: If no notes have been generated yet, show an inviting placeholder explaining the workflow.
- High-Contrast Aesthetics: Modern dark-slate dashboard theme with clean borders (`border-slate-800`), crisp typography, and intentional status colors.

---

#### 5. Verification & Acceptance Criteria
- Full user journey is functional end-to-end: starting camera -> toggling blocker modes -> auto-filling transcript -> generating notes.
- Zero broken console warnings or TypeScript errors on compilation.