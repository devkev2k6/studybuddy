### Task: Phase 2 — Core Engine & Logic Layer (Focus Detection + Notes Generator)

#### 1. Context & Architectural Constraints
We are building the two core engines for Study Guardian based on the types defined in `src/types/guardian.ts`:
1. Client-Side Focus Monitor (MediaPipe Face Landmarker via `@mediapipe/tasks-vision` or browser heuristic fallback) to track gaze and presence without sending video to an external server.
2. Structured Notes Engine (LLM API call with deterministic offline fallback) to transform raw lecture transcripts into clean study notes with key takeaways.

Do NOT build UI layouts in this phase. Implement purely headless services, hooks, and API routes.

---

#### 2. Target Files
- `src/lib/vision/focusTracker.ts`: Focus detection logic and gaze calculations.
- `src/hooks/useFocusSession.ts`: React hook managing video stream, focus state, distraction count, and audio alerts.
- `src/lib/ai/notesGenerator.ts`: API handler/service for lecture transcript summarization.
- `src/api/notes/generate/route.ts`: API endpoint accepting lecture text and returning structured notes.

---

#### 3. Vision Engine Specifications (`focusTracker.ts` & `useFocusSession.ts`)
- Use `@mediapipe/tasks-vision` (`FaceLandmarker` with CDN wasm assets) running on camera stream:
  - Presence Check: If no face is detected for > 3 consecutive seconds, trigger `status: 'distracted'`, `lastDistractionReason: 'absent'`.
  - Gaze / Pitch / Yaw Check: Use nose tip and eye landmark coordinates. If yaw exceeds ±25° (looking away horizontally) or pitch drops > 20° (looking down at phone) for > 2.5 seconds, trigger `status: 'distracted'`, `lastDistractionReason: 'gaze_away'`.
- Web Audio Synthesizer: When state flips to `'distracted'`, trigger a subtle synthetic browser beep using the native Web Audio API (`AudioContext`) — no external audio asset dependencies needed.
- Demo Mock Mode: Implement a toggle `window.__MOCK_DISTRACTION(reason)` or a dev keypress listener (`Shift + D`) that forces a distraction state transition immediately for easy demonstration.

---

#### 4. Transcript-to-Notes API (`notesGenerator.ts` & API route)
- Input payload: `{ transcriptText: string, lectureTitle?: string }`.
- LLM Integration:
  - Check `process.env.USE_MOCK_AI === "true"` or missing API key. If active, return an entry from `src/lib/mocks/guardianMocks.ts` with a realistic 800ms artificial latency.
  - If API key is present, prompt the model (OpenAI / Gemini SDK) to return strictly JSON conforming to:
    ```json
    {
      "sourceTitle": "string",
      "summary": "2-3 concise summary sentences",
      "keyTakeaways": ["string", "string", "string", "string"],
      "actionItems": ["string", "string"]
    }
    ```
- Implement Zod schema validation on the LLM response before returning it to the caller.

---

#### 5. Verification & Acceptance Criteria
1. `useFocusSession` exports: `{ status, distractionCount, lastDistractionReason, startSession, stopSession, isTracking }`.
2. The API route returns HTTP 200 with the exact `StudyNote` payload shape on both live and mock paths.
3. Zero TypeScript compilation errors (`tsc --noEmit` exits with 0).