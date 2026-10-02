import React, { useState } from 'react';
import type { StudyNote } from '../../types/guardian';
import { generateLectureNotes } from '../../lib/ai/notesGenerator';
import { mockStudyNotes } from '../../lib/mocks/guardianMocks';

export interface NotesStudioProps {
  initialNote?: StudyNote | null;
  onNoteGenerated?: (note: StudyNote) => void;
}

const SAMPLE_LECTURE_TITLE = 'CS 6824: Distributed Systems — Consensus via Raft Protocol';

const SAMPLE_TRANSCRIPT = `Welcome to today's lecture on Distributed Systems and the Raft Consensus Algorithm. In asynchronous distributed networks, node crashes, packet dropouts, and network partitions are inevitable realities. The central objective is maintaining consistent state machine replication across a decentralized cluster without sacrificing correctness.

Raft decomposes this challenging consensus problem into three decoupled abstractions: Leader Election, Log Replication, and Safety Invariants.

First, Leader Election relies on randomized election timeouts typically configured between 150ms and 300ms. When followers fail to receive periodic AppendEntries heartbeat RPCs within this randomized window, they advance their logical term and transition to Candidate status, broadcasting RequestVote RPCs across the cluster. The term counter acts as a monotonic logical clock, guaranteeing that split-brain anomalies and stale leaders are superseded immediately.

Second, Log Replication mandates that client proposals are ingested exclusively by the designated cluster leader. The leader appends the entry to its local write-ahead log and replicates the payload to followers. Once a strict mathematical majority (a quorum of N/2 + 1 nodes) acknowledges receipt, the entry is formally committed and applied to the finite state machine.

Third, Raft guarantees the Leader Completeness Safety Invariant: a candidate can never be elected unless its log contains all previously committed entries. This ensures persistent fault-tolerance without risk of divergent history.`;

export const NotesStudio: React.FC<NotesStudioProps> = ({
  initialNote = null,
  onNoteGenerated,
}) => {
  const [transcript, setTranscript] = useState<string>('');
  const [lectureTitle, setLectureTitle] = useState<string>('');
  const [viewMode, setViewMode] = useState<'digital' | 'handwritten'>('handwritten');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeNote, setActiveNote] = useState<StudyNote | null>(initialNote ?? mockStudyNotes[0]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLoadSample = () => {
    setLectureTitle(SAMPLE_LECTURE_TITLE);
    setTranscript(SAMPLE_TRANSCRIPT);
    setErrorMsg(null);
  };

  const handleGenerateNotes = async () => {
    if (!transcript.trim()) {
      setErrorMsg('Please input or load a lecture transcript first.');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      // First attempt to invoke API endpoint; seamlessly fallback to client generator service
      let note: StudyNote;
      try {
        const response = await fetch('/api/notes/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcriptText: transcript,
            lectureTitle: lectureTitle.trim() || undefined,
          }),
        });

        if (response.ok) {
          note = await response.json();
        } else {
          note = await generateLectureNotes({
            transcriptText: transcript,
            lectureTitle: lectureTitle.trim() || undefined,
          });
        }
      } catch {
        note = await generateLectureNotes({
          transcriptText: transcript,
          lectureTitle: lectureTitle.trim() || undefined,
        });
      }

      setActiveNote(note);
      onNoteGenerated?.(note);
    } catch (err) {
      console.error('Note generation error:', err);
      setErrorMsg('Failed to synthesize notes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#0b1120',
        borderRadius: '16px',
        border: '1px solid #1e293b',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Studio Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem' }}>📝</span>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f8fafc', letterSpacing: '-0.01em' }}>
              Lecture Transcript-to-Notes Studio
            </h2>
            <span
              style={{
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: '#a5b4fc',
                fontWeight: 600,
                border: '1px solid rgba(99, 102, 241, 0.3)',
              }}
            >
              AI Synthesizer
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '3px' }}>
            Transform audio transcripts or video lecture text into structured executive summaries and handwritten notes.
          </p>
        </div>

        {/* 1-Click Load Sample Transcript Button */}
        <button
          id="load-sample-transcript-btn"
          type="button"
          onClick={handleLoadSample}
          style={{
            padding: '7px 14px',
            backgroundColor: '#1e293b',
            color: '#38bdf8',
            border: '1px solid #334155',
            borderRadius: '8px',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#334155';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1e293b';
          }}
        >
          <span>⚡ Load Sample Lecture Transcript</span>
        </button>
      </div>

      {/* Grid: Input Area vs Output Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Input Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
              Lecture Topic or Title (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. CS 6824: Distributed Systems — Raft Consensus"
              value={lectureTitle}
              onChange={(e) => setLectureTitle(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#020617',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                padding: '9px 12px',
                fontSize: '0.85rem',
                color: '#f8fafc',
                outline: 'none',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#1e293b')}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1' }}>
                Raw Lecture Transcript
              </label>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                {transcript.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <textarea
              rows={8}
              placeholder="Paste raw speech-to-text transcript or paste lecture subtitles here..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#020617',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '0.85rem',
                color: '#f8fafc',
                lineHeight: 1.5,
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#1e293b')}
            />
          </div>

          {errorMsg && (
            <div
              style={{
                backgroundColor: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                color: '#fda4af',
                fontSize: '0.78rem',
                padding: '8px 12px',
                borderRadius: '6px',
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* Action Trigger Button */}
          <button
            id="generate-notes-btn"
            type="button"
            disabled={isLoading}
            onClick={handleGenerateNotes}
            style={{
              padding: '12px 20px',
              backgroundColor: isLoading ? '#312e81' : '#6366f1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: isLoading ? 'none' : '0 4px 16px rgba(99, 102, 241, 0.45)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) e.currentTarget.style.backgroundColor = '#4f46e5';
            }}
            onMouseLeave={(e) => {
              if (!isLoading) e.currentTarget.style.backgroundColor = '#6366f1';
            }}
          >
            {isLoading ? (
              <>
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#ffffff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                <span>Synthesizing Academic Takeaways...</span>
              </>
            ) : (
              <>
                <span>✨ Generate AI Study Notes</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Output Viewer (Clean Digital vs Handwritten Notebook) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* View Toggle Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
              Rendered Notes Card
            </span>

            <div
              style={{
                display: 'inline-flex',
                backgroundColor: '#020617',
                padding: '3px',
                borderRadius: '8px',
                border: '1px solid #1e293b',
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode('digital')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: viewMode === 'digital' ? '#1e293b' : 'transparent',
                  color: viewMode === 'digital' ? '#f8fafc' : '#64748b',
                  transition: 'all 0.2s',
                }}
              >
                Clean Digital
              </button>
              <button
                type="button"
                onClick={() => setViewMode('handwritten')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: viewMode === 'handwritten' ? '#6366f1' : 'transparent',
                  color: viewMode === 'handwritten' ? '#ffffff' : '#64748b',
                  transition: 'all 0.2s',
                }}
              >
                ✍ Handwritten Sheet
              </button>
            </div>
          </div>

          {/* Loading Skeleton Animation (Zero Layout Shifts) */}
          {isLoading && (
            <div
              style={{
                height: '420px',
                borderRadius: '12px',
                border: '1px solid #1e293b',
                backgroundColor: '#020617',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div className="skeleton-shimmer" style={{ height: '24px', width: '65%', borderRadius: '6px' }} />
              <div className="skeleton-shimmer" style={{ height: '14px', width: '90%', borderRadius: '4px' }} />
              <div className="skeleton-shimmer" style={{ height: '14px', width: '82%', borderRadius: '4px' }} />
              <div style={{ height: '1px', backgroundColor: '#1e293b', margin: '8px 0' }} />
              <div className="skeleton-shimmer" style={{ height: '16px', width: '40%', borderRadius: '4px' }} />
              <div className="skeleton-shimmer" style={{ height: '14px', width: '95%', borderRadius: '4px' }} />
              <div className="skeleton-shimmer" style={{ height: '14px', width: '92%', borderRadius: '4px' }} />
              <div className="skeleton-shimmer" style={{ height: '14px', width: '88%', borderRadius: '4px' }} />
              <div className="skeleton-shimmer" style={{ height: '14px', width: '85%', borderRadius: '4px' }} />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !activeNote && (
            <div
              style={{
                height: '420px',
                borderRadius: '12px',
                border: '1px dashed #334155',
                backgroundColor: '#020617',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                textAlign: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                }}
              >
                📖
              </div>
              <div>
                <p style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.95rem' }}>No Notes Synthesized Yet</p>
                <p style={{ color: '#64748b', fontSize: '0.8rem', maxWidth: '320px', marginTop: '4px' }}>
                  Click &ldquo;Load Sample Lecture Transcript&rdquo; and &ldquo;Generate AI Study Notes&rdquo; to experience structured key takeaways and handwritten rendering.
                </p>
              </div>
            </div>
          )}

          {/* Rendered Notes Card */}
          {!isLoading && activeNote && (
            <div>
              {viewMode === 'handwritten' ? (
                /* 1. Stylized Handwritten Notebook Sheet */
                <div
                  className="notebook-sheet font-handwriting"
                  style={{
                    minHeight: '440px',
                    padding: '28px 24px 28px 90px', // margin offset for red line
                    transform: 'rotate(-0.35deg)',
                    transition: 'transform 0.3s ease',
                    fontSize: '1.25rem',
                    lineHeight: '32px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  {/* Note Title */}
                  <h3
                    style={{
                      fontSize: '1.75rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      marginBottom: '10px',
                      lineHeight: '36px',
                      transform: 'rotate(0.2deg)',
                    }}
                  >
                    {activeNote.sourceTitle}
                  </h3>

                  {/* Summary */}
                  <p style={{ color: '#1e293b', marginBottom: '14px', lineHeight: '32px' }}>
                    <span className="highlighter-yellow" style={{ fontWeight: 700 }}>
                      Core Summary:
                    </span>{' '}
                    {activeNote.summary}
                  </p>

                  {/* Key Takeaways */}
                  <div style={{ marginTop: '12px' }}>
                    <p style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                      <span className="highlighter-cyan">Key Takeaways:</span>
                    </p>
                    <ul style={{ listStyleType: 'none', paddingLeft: '0' }}>
                      {activeNote.keyTakeaways.map((takeaway, idx) => {
                        const highlighterClass =
                          idx % 3 === 0
                            ? 'highlighter-yellow'
                            : idx % 3 === 1
                            ? 'highlighter-cyan'
                            : 'highlighter-pink';
                        return (
                          <li
                            key={idx}
                            style={{
                              marginBottom: '6px',
                              lineHeight: '32px',
                              transform: idx % 2 === 0 ? 'rotate(0.15deg)' : 'rotate(-0.2deg)',
                            }}
                          >
                            <span style={{ marginRight: '8px', color: '#6366f1', fontWeight: 700 }}>
                              ✦ [{idx + 1}]
                            </span>
                            <span className={highlighterClass}>{takeaway}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Action Items / Exercises */}
                  {activeNote.actionItems && activeNote.actionItems.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <p style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                        <span className="highlighter-pink">Action Items:</span>
                      </p>
                      <ul style={{ listStyleType: 'none', paddingLeft: '0' }}>
                        {activeNote.actionItems.map((action, idx) => (
                          <li key={idx} style={{ lineHeight: '32px' }}>
                            <span style={{ marginRight: '6px' }}>☐</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Stamp Footer */}
                  <div
                    style={{
                      marginTop: '20px',
                      display: 'flex',
                      justifyContent: 'flex-end',
                      color: '#475569',
                      fontSize: '1rem',
                    }}
                  >
                    <span>✓ Study Guardian Verified • {new Date(activeNote.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ) : (
                /* 2. Clean Digital View */
                <div
                  style={{
                    backgroundColor: '#020617',
                    borderRadius: '12px',
                    border: '1px solid #1e293b',
                    padding: '24px',
                    minHeight: '440px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#6366f1', fontWeight: 700, textTransform: 'uppercase' }}>
                      Lecture Notes
                    </span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                      {activeNote.sourceTitle}
                    </h3>
                  </div>

                  <div
                    style={{
                      backgroundColor: '#0b1120',
                      borderRadius: '8px',
                      border: '1px solid #1e293b',
                      padding: '14px',
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                      Executive Summary
                    </span>
                    <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '4px', lineHeight: 1.5 }}>
                      {activeNote.summary}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>
                      Key Takeaways
                    </span>
                    <ul style={{ listStyleType: 'none', paddingLeft: '0', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {activeNote.keyTakeaways.map((item, idx) => (
                        <li
                          key={idx}
                          style={{
                            fontSize: '0.82rem',
                            color: '#e2e8f0',
                            backgroundColor: '#0f172a',
                            padding: '10px 12px',
                            borderRadius: '6px',
                            border: '1px solid #1e293b',
                            lineHeight: 1.45,
                            display: 'flex',
                            gap: '8px',
                          }}
                        >
                          <span style={{ color: '#6366f1', fontWeight: 700 }}>#{idx + 1}</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {activeNote.actionItems && activeNote.actionItems.length > 0 && (
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>
                        Study Checklist
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                        {activeNote.actionItems.map((action, idx) => (
                          <div
                            key={idx}
                            style={{
                              fontSize: '0.8rem',
                              color: '#cbd5e1',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            <span style={{ color: '#10b981' }}>☑</span>
                            <span>{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
