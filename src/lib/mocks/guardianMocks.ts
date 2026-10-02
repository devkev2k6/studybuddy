import type {
  BlockerConfig,
  FocusEventFeedState,
  FocusFeedItem,
  FocusSession,
  StudyNote,
} from '../../types/guardian';

/**
 * Pre-computed study notes with rich, realistic computer science and engineering lecture takeaways.
 */
export const mockStudyNotes: StudyNote[] = [
  {
    id: 'note_cs6824_consensus_raft',
    sourceTitle: 'CS 6824: Distributed Systems — Consensus via Raft Protocol',
    keyTakeaways: [
      'Deconstructs consensus into three independent sub-problems: Leader Election, Log Replication, and Safety Invariants.',
      'Leader Election utilizes randomized election timeouts (150ms–300ms) and term monotonicity to prevent split votes under network partitions.',
      'Log Matching Property ensures that if two logs contain an entry with identical index and term, all preceding entries are guaranteed identical.',
      'Commit safety rule dictates that an entry is committed once stored on a quorum (majority) of servers, tolerating (N-1)/2 fail-stop faults.',
      'Dynamic membership reconfiguration relies on joint consensus two-phase handshakes to eliminate transient split-brain topologies.',
    ],
    summary:
      'A rigorous exploration of the Raft consensus algorithm contrasted with Paxos. The lecture establishes formal safety proofs, heartbeats for lease renewals, log compaction snapshots, and fault recovery guarantees under volatile network topologies.',
    handwrittenRenderUrl:
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=1200',
    createdAt: '2026-10-02T10:15:00.000Z',
  },
  {
    id: 'note_ece4310_virtual_memory',
    sourceTitle: 'ECE 4310: Computer Architecture & Systems — Virtual Memory & TLB Dynamics',
    keyTakeaways: [
      'Two-tier address translation maps Virtual Page Numbers (VPN) to Physical Frame Numbers (PFN) via 4-level x86-64 page tables (PML4 to PT).',
      'Translation Lookaside Buffer (TLB) hits achieve ~1ns memory access; TLB misses impose a 10–50ns page table walk overhead across main memory caches.',
      'Demand paging defers frame allocation until execution time, intercepting hardware page faults (CR2 register inspection) to stream pages from swap.',
      'Belady’s Anomaly illustrates vulnerability in FIFO page replacement; the Second Chance (Clock) and LRU approximations optimize real-world hit ratios.',
      'Thrashing occurs when the aggregate working sets of active processes exceed physical DRAM capacity, collapsing CPU throughput.',
    ],
    summary:
      'Detailed systems-level breakdown of memory hierarchy and page translation hardware. Covers multi-level paging structures, inverted page tables, page eviction metrics, memory fragmentation mitigations, and kernel-space copy-on-write (CoW) optimizations.',
    handwrittenRenderUrl: null,
    createdAt: '2026-10-02T14:30:00.000Z',
  },
  {
    id: 'note_cs4210_compiler_ast',
    sourceTitle: 'CS 4210: Compilers & Language Runtimes — AST Parsing & Hindley-Milner Type Inference',
    keyTakeaways: [
      'Context-Free Grammars parsed via LALR(1) tables synthesize unambiguous Abstract Syntax Trees (AST) with preserved operator associativity.',
      'Semantic analysis constructs scoped hierarchical symbol tables to validate variable lifetime, shadowing, and type declarations.',
      'Hindley-Milner (Damas-Milner) inference derives principal types automatically using Robinson’s First-Order Unification algorithm.',
      'Static Single Assignment (SSA) intermediate representation normalizes control flow graphs with Φ-functions for dominant optimization passes.',
      'Optimizations applied directly on SSA include dead-code pruning, common subexpression elimination (CSE), and loop-invariant code motion (LICM).',
    ],
    summary:
      'An end-to-end traversal of compiler front-end and middle-end engineering. Focuses on transforming source tokens into AST representations, constraint-based type unification, polymorphic let-binding, and translation to Static Single Assignment form for LLVM emission.',
    handwrittenRenderUrl:
      'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=1200',
    createdAt: '2026-10-02T18:00:00.000Z',
  },
];

/**
 * Default blocker configuration populated with educational domains,
 * lecture portals, and official technical documentation resources.
 */
export const defaultBlockerConfig: BlockerConfig = {
  mode: 'STUDY_ONLY',
  whitelistedDomains: [
    // Online Course Platforms & Universities
    'coursera.org',
    'edx.org',
    'ocw.mit.edu',
    'khanacademy.org',
    'nptel.ac.in',
    'physicswallah.live',
    'pw.live',
    'udacity.com',
    'stanford.edu',
    'harvard.edu',

    // Official Documentation & Developer Reference
    'developer.mozilla.org',
    'docs.python.org',
    'en.cppreference.com',
    'typescriptlang.org',
    'react.dev',
    'rust-lang.org',
    'devdocs.io',

    // Knowledge & Technical Research
    'wikipedia.org',
    'arxiv.org',
    'sciencedirect.com',
    'ieeexplore.ieee.org',
    'github.com',
    'stackoverflow.com',
    'geeksforgeeks.org',
    'leetcode.com',
  ],
};

/**
 * Initial or active baseline focus session state.
 */
export const initialFocusSession: FocusSession = {
  id: 'session_guardian_live_01',
  status: 'active',
  distractionCount: 0,
  lastDistractionReason: null,
  sessionStartTime: '2026-10-02T20:00:00.000Z',
};

/**
 * Simulated live focus event feed containing 5 timestamped states
 * demonstrating transitions from focused to distracted and idle states.
 */
export const simulatedFocusFeed: FocusFeedItem[] = [
  {
    id: 'session_guardian_live_01',
    status: 'active',
    distractionCount: 0,
    lastDistractionReason: null,
    sessionStartTime: '2026-10-02T20:00:00.000Z',
    timestamp: '2026-10-02T20:05:00.000Z',
    note: 'Deep focus established. Gaze centered on IDE and lecture material.',
  },
  {
    id: 'session_guardian_live_01',
    status: 'distracted',
    distractionCount: 1,
    lastDistractionReason: 'gaze_away',
    sessionStartTime: '2026-10-02T20:00:00.000Z',
    timestamp: '2026-10-02T20:12:30.000Z',
    note: 'User gaze deflected away from primary viewport for >15 seconds.',
  },
  {
    id: 'session_guardian_live_01',
    status: 'active',
    distractionCount: 1,
    lastDistractionReason: 'gaze_away',
    sessionStartTime: '2026-10-02T20:00:00.000Z',
    timestamp: '2026-10-02T20:14:00.000Z',
    note: 'User recentered focus. Audio cue played, attention restored to study workspace.',
  },
  {
    id: 'session_guardian_live_01',
    status: 'distracted',
    distractionCount: 2,
    lastDistractionReason: 'phone_detected',
    sessionStartTime: '2026-10-02T20:00:00.000Z',
    timestamp: '2026-10-02T20:23:45.000Z',
    note: 'Computer vision guardian detected secondary handheld device (mobile phone) in frame.',
  },
  {
    id: 'session_guardian_live_01',
    status: 'idle',
    distractionCount: 3,
    lastDistractionReason: 'absent',
    sessionStartTime: '2026-10-02T20:00:00.000Z',
    timestamp: '2026-10-02T20:31:00.000Z',
    note: 'User absent from webcam frame for over 5 minutes. Session marked idle.',
  },
];

// Ergonomic export aliases for versatile consumer integration
export const mockFocusFeed: FocusFeedItem[] = simulatedFocusFeed;
export const mockFocusEventFeed: FocusFeedItem[] = simulatedFocusFeed;
export const mockFocusSessionFeed: FocusSession[] = simulatedFocusFeed;
export const mockBlockerConfig: BlockerConfig = defaultBlockerConfig;
export const mockFocusSession: FocusSession = initialFocusSession;
