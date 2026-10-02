/**
 * Core domain types for Study Guardian.
 * Zero external runtime dependencies.
 */

export type FocusStatus = 'active' | 'distracted' | 'idle';

export type DistractionReason = 'gaze_away' | 'absent' | 'phone_detected';

export interface FocusSession {
  id: string;
  status: FocusStatus;
  distractionCount: number;
  lastDistractionReason: DistractionReason | null;
  sessionStartTime: string;
}

export type BlockerMode = 'BLOCK_ALL' | 'STUDY_ONLY' | 'ALLOW_ALL';

export interface BlockerConfig {
  mode: BlockerMode;
  whitelistedDomains: string[];
}

export interface StudyNote {
  id: string;
  sourceTitle: string;
  keyTakeaways: string[];
  summary: string;
  handwrittenRenderUrl: string | null;
  createdAt: string;
}

/**
 * State snapshot for simulated or live focus event feeds.
 */
export interface FocusEventFeedState extends FocusSession {
  timestamp: string;
  note?: string;
}

export type FocusFeedItem = FocusEventFeedState;
