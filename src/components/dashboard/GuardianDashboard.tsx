import React, { useEffect, useState } from 'react';
import { useFocusSession } from '../../hooks/useFocusSession';
import { FocusCameraCard } from '../vision/FocusCameraCard';
import { SiteBlockerControl } from '../blocker/SiteBlockerControl';
import { NotesStudio } from '../notes/NotesStudio';
import type { BlockerConfig } from '../../types/guardian';

export const GuardianDashboard: React.FC = () => {
  const session = useFocusSession();
  const [blockerConfig, setBlockerConfig] = useState<BlockerConfig>({
    mode: 'STUDY_ONLY',
    whitelistedDomains: [
      'coursera.org',
      'pw.live (PhysicsWallah)',
      'chatgpt.com',
      'gemini.google.com',
      'khanacademy.org',
      'developer.mozilla.org',
      'docs.python.org',
      'github.com',
      'stackoverflow.com',
      'leetcode.com',
    ],
  });

  const [sessionSeconds, setSessionSeconds] = useState<number>(0);

  // Timer tracking session duration when tracking is active
  useEffect(() => {
    if (!session.isTracking) return;

    const timer = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [session.isTracking]);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#020617',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Navigation Header */}
      <header
        style={{
          borderBottom: '1px solid #1e293b',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '12px 24px',
        }}
      >
        <div
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Logo & Tagline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                fontSize: '1.2rem',
              }}
            >
              🛡️
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    background: 'linear-gradient(90deg, #f8fafc 0%, #cbd5e1 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  STUDY GUARDIAN
                </h1>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    color: '#818cf8',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                  }}
                >
                  Hackathon Golden Path
                </span>
              </div>
              <p style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Autonomous Focus Telemetry • Adaptive Network Shield • Lecture Note Synthesizer
              </p>
            </div>
          </div>

          {/* Quick Header Indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            {/* Audio Alarm Status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                backgroundColor: '#020617',
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid #1e293b',
                color: '#94a3b8',
              }}
            >
              <span style={{ color: '#10b981' }}>🔔</span>
              <span>Web Audio Synth: <b>Armed</b></span>
            </div>

            {/* Session Timer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                backgroundColor: '#020617',
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid #1e293b',
                fontFamily: 'monospace',
              }}
            >
              <span style={{ color: session.isTracking ? '#38bdf8' : '#64748b' }}>⏱</span>
              <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{formatTime(sessionSeconds)}</span>
            </div>

            {/* Global Status Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '5px 12px',
                borderRadius: '9999px',
                backgroundColor: !session.isTracking
                  ? 'rgba(30, 41, 59, 0.7)'
                  : session.status === 'distracted'
                  ? 'rgba(244, 63, 94, 0.2)'
                  : 'rgba(16, 185, 129, 0.2)',
                color: !session.isTracking
                  ? '#94a3b8'
                  : session.status === 'distracted'
                  ? '#fda4af'
                  : '#6ee7b7',
                border: `1px solid ${
                  !session.isTracking
                    ? '#334155'
                    : session.status === 'distracted'
                    ? 'rgba(244, 63, 94, 0.5)'
                    : 'rgba(16, 185, 129, 0.5)'
                }`,
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: !session.isTracking
                    ? '#64748b'
                    : session.status === 'distracted'
                    ? '#f43f5e'
                    : '#10b981',
                }}
              />
              <span>
                {!session.isTracking
                  ? 'Standby'
                  : session.status === 'distracted'
                  ? 'Attention Diverted'
                  : 'Active Focus Session'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main
        style={{
          maxWidth: '1440px',
          width: '100%',
          margin: '0 auto',
          padding: '24px 20px 48px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          flex: 1,
        }}
      >
        {/* Top 2-Column Grid: Cam Monitor + Site Blocker */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* Card 1: Focus Cam Viewport */}
          <FocusCameraCard session={session} />

          {/* Card 2: 3-Mode Site Blocker Module */}
          <SiteBlockerControl config={blockerConfig} onChange={setBlockerConfig} />
        </section>

        {/* Bottom Section: Lecture Notes Studio */}
        <section>
          <NotesStudio />
        </section>
      </main>

      {/* Footer / Presentation Helper Bar */}
      <footer
        style={{
          borderTop: '1px solid #1e293b',
          backgroundColor: '#0b1120',
          padding: '16px 24px',
          fontSize: '0.78rem',
          color: '#64748b',
        }}
      >
        <div
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <span>
              🎯 <strong style={{ color: '#cbd5e1' }}>1. Vision Monitor:</strong> MediaPipe FaceLandmarker with 3D Yaw/Pitch Gaze Math
            </span>
            <span>
              🛡️ <strong style={{ color: '#cbd5e1' }}>2. Distraction Shield:</strong> 3-Mode Site Access & Intercept System
            </span>
            <span>
              ✍ <strong style={{ color: '#cbd5e1' }}>3. Notes Studio:</strong> AI Structured Synthesis & Stylized Handwritten Sheet
            </span>
          </div>

          <div>
            <span>Press <kbd style={{ padding: '2px 5px', borderRadius: '4px', backgroundColor: '#1e293b', color: '#cbd5e1' }}>Shift + D</kbd> to trigger demo distraction beep</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
