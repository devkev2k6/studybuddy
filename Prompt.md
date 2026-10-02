### Task: Phase 1 — Schemas, State Contracts & Mock Data for Study Guardian

#### 1. Context
We are building a smart study guardian platform featuring webcam focus tracking, a site-access mode toggle, and an automated lecture transcript-to-notes generator.

#### 2. Target Deliverables
- `src/types/guardian.ts`: Core domain types.
- `src/lib/mocks/guardianMocks.ts`: Deterministic seed data for demo fallback.

#### 3. Type Definitions Required
Define TypeScript interfaces for:
1. `FocusSession`:
   - `id`: string
   - `status`: 'active' | 'distracted' | 'idle'
   - `distractionCount`: number
   - `lastDistractionReason`: 'gaze_away' | 'absent' | 'phone_detected' | null
   - `sessionStartTime`: string
2. `BlockerConfig`:
   - `mode`: 'BLOCK_ALL' | 'STUDY_ONLY' | 'ALLOW_ALL'
   - `whitelistedDomains`: string[]
3. `StudyNote`:
   - `id`: string
   - `sourceTitle`: string
   - `keyTakeaways`: string[]
   - `summary`: string
   - `handwrittenRenderUrl`: string | null
   - `createdAt`: string

#### 4. Mock Data Requirements
In `guardianMocks.ts`:
- Provide at least 3 pre-computed `StudyNote` objects with rich, realistic computer science/engineering lecture takeaways.
- Provide a default `BlockerConfig` object populated with realistic educational domains (e.g., Coursera, PhysicsWallah, Khan Academy, documentation portals).
- Export a simulated live focus event feed containing 5 timestamped states showing transitions from focused to distracted.

#### 5. Output Criteria
- Strictly valid TypeScript with no `any` types.
- Zero external runtime dependencies for the schema/mock layer.