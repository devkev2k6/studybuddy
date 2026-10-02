import React, { useMemo } from 'react';
import type { UseFocusSessionReturn } from '../../hooks/useFocusSession';
import { useFocusSession } from '../../hooks/useFocusSession';
import type { DistractionReason } from '../../types/guardian';

export interface FocusCameraCardProps {
  session?: UseFocusSessionReturn;
}

export const FocusCameraCard: React.FC<FocusCameraCardProps> = ({ session: externalSession }) => {
  const internalSession = useFocusSession();
  const session = externalSession ?? internalSession;

  const {
    status,
    distractionCount,
    lastDistractionReason,
    isTracking,
    startSession,
    stopSession,
    videoRef,
    gazeMetrics,
    triggerDistraction,
  } = session;

  // Calculate live Focus Score percentage
  const focusScore = useMemo(() => {
    if (!isTracking) return 100;
    const penalty = distractionCount * 8;
    return Math.max(15, 100 - penalty);
  }, [isTracking, distractionCount]);

  const scoreColor = focusScore > 80 ? '#10b981' : focusScore > 50 ? '#f59e0b' : '#f43f5e';

  const reasonLabel = (reason: DistractionReason | null) => {
    switch (reason) {
      case 'gaze_away':
        return 'Gaze Deviation';
      case 'absent':
        return 'User Absent';
      case 'phone_detected':
        return 'Phone / Secondary Screen';
      default:
        return 'Attention Lost';
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#0b1120',
        borderRadius: '16px',
        border: '1px solid #1e293b',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header with Title and Discrete Demo Trigger */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: isTracking ? (status === 'distracted' ? '#f43f5e' : '#10b981') : '#64748b',
              boxShadow: isTracking ? `0 0 10px ${status === 'distracted' ? '#f43f5e' : '#10b981'}` : 'none',
            }}
          />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', letterSpacing: '-0.01em' }}>
            Live Focus Monitor
          </h2>
          <span
            style={{
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '2px 8px',
              borderRadius: '6px',
              backgroundColor: '#1e293b',
              color: '#94a3b8',
              fontWeight: 600,
            }}
          >
            Client Vision
          </span>
        </div>

        {/* Quick Demo Trigger for Judges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            id="quick-demo-trigger-btn"
            type="button"
            onClick={() => triggerDistraction('gaze_away')}
            title="Force distraction state transition (Dev Shortcut: Shift + D)"
            style={{
              padding: '5px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              color: '#fda4af',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.12)';
            }}
          >
            <span>⚡ Demo Alert</span>
            <kbd
              style={{
                fontSize: '0.65rem',
                backgroundColor: 'rgba(0,0,0,0.4)',
                padding: '1px 4px',
                borderRadius: '4px',
                border: '1px solid rgba(244, 63, 94, 0.3)',
              }}
            >
              ⇧D
            </kbd>
          </button>
        </div>
      </div>

      {/* Camera Viewport Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          backgroundColor: '#020617',
          borderRadius: '12px',
          overflow: 'hidden',
          border: `1px solid ${status === 'distracted' ? 'rgba(244, 63, 94, 0.5)' : '#1e293b'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'border-color 0.3s ease',
        }}
      >
        {/* Real Live Video Feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)', // Mirror user perspective
            display: isTracking ? 'block' : 'none',
          }}
        />

        {/* Inactive State Display */}
        {!isTracking && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '20px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                border: '1px solid #334155',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <div>
              <p style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.95rem' }}>Camera Stream Standby</p>
              <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '2px' }}>
                Private client-side gaze & presence tracking. No video leaves your browser.
              </p>
            </div>
            <button
              id="start-camera-btn"
              type="button"
              onClick={startSession}
              style={{
                marginTop: '4px',
                padding: '9px 18px',
                backgroundColor: '#6366f1',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#4f46e5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#6366f1';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Start Focus Cam
            </button>
          </div>
        )}

        {/* HUD Overlay Elements When Tracking */}
        {isTracking && (
          <>
            {/* Cyberpunk HUD Corner brackets */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                width: '18px',
                height: '18px',
                borderTop: '2px solid rgba(99, 102, 241, 0.6)',
                borderLeft: '2px solid rgba(99, 102, 241, 0.6)',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '18px',
                height: '18px',
                borderTop: '2px solid rgba(99, 102, 241, 0.6)',
                borderRight: '2px solid rgba(99, 102, 241, 0.6)',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                width: '18px',
                height: '18px',
                borderBottom: '2px solid rgba(99, 102, 241, 0.6)',
                borderLeft: '2px solid rgba(99, 102, 241, 0.6)',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                right: '12px',
                width: '18px',
                height: '18px',
                borderBottom: '2px solid rgba(99, 102, 241, 0.6)',
                borderRight: '2px solid rgba(99, 102, 241, 0.6)',
                pointerEvents: 'none',
              }}
            />

            {/* Floating Status Badge */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
              }}
            >
              {status === 'active' ? (
                <div
                  className="animate-pulse-emerald"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(6, 78, 59, 0.85)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(16, 185, 129, 0.6)',
                    color: '#a7f3d0',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  <span style={{ color: '#34d399', fontSize: '0.9rem' }}>●</span>
                  <span>Tracking — Focused</span>
                </div>
              ) : status === 'distracted' ? (
                <div
                  className="animate-pulse-red"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(136, 19, 55, 0.9)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(244, 63, 94, 0.7)',
                    color: '#fecdd3',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}
                >
                  <span style={{ fontSize: '0.9rem' }}>⚠</span>
                  <span>Distracted: {reasonLabel(lastDistractionReason)}</span>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(30, 41, 59, 0.85)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid #334155',
                    color: '#94a3b8',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  <span>○ Standby</span>
                </div>
              )}
            </div>

            {/* Quick Stop Floating Button */}
            <button
              id="stop-camera-btn"
              type="button"
              onClick={stopSession}
              style={{
                position: 'absolute',
                bottom: '12px',
                right: '12px',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(6px)',
                border: '1px solid #334155',
                color: '#cbd5e1',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.3)';
                e.currentTarget.style.borderColor = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.8)';
                e.currentTarget.style.borderColor = '#334155';
              }}
            >
              Stop Cam
            </button>
          </>
        )}
      </div>

      {/* Telemetry Bar Below Video */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          backgroundColor: '#020617',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid #1e293b',
        }}
      >
        {/* 1. Focus Score */}
        <div>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Focus Score
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 700, color: scoreColor, fontVariantNumeric: 'tabular-nums' }}>
              {focusScore}%
            </span>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              {focusScore >= 80 ? 'Optimal' : focusScore >= 50 ? 'Moderate' : 'Fatigued'}
            </span>
          </div>
        </div>

        {/* 2. Distractions Count Badge */}
        <div>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Distractions
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: distractionCount === 0 ? '#10b981' : '#f43f5e',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {distractionCount}
            </span>
            {distractionCount > 0 && (
              <span
                style={{
                  fontSize: '0.65rem',
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(244, 63, 94, 0.15)',
                  color: '#fda4af',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  fontWeight: 600,
                }}
              >
                Alerted
              </span>
            )}
          </div>
        </div>

        {/* 3. Gaze Telemetry */}
        <div>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Gaze Orientation
          </span>
          <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '3px', fontFamily: 'monospace' }}>
            {isTracking ? (
              <span>
                Y: <b style={{ color: Math.abs(gazeMetrics.yaw) > 25 ? '#f43f5e' : '#38bdf8' }}>{gazeMetrics.yaw}°</b>{' '}
                P: <b style={{ color: gazeMetrics.pitch > 20 ? '#f43f5e' : '#38bdf8' }}>{gazeMetrics.pitch}°</b>
              </span>
            ) : (
              <span style={{ color: '#475569' }}>Awaiting Stream</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
