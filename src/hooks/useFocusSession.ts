import { useCallback, useEffect, useRef, useState } from 'react';
import type { DistractionReason, FocusStatus, GazeMetrics } from '../types/guardian';
import { FocusTracker } from '../lib/vision/focusTracker';

declare global {
  interface Window {
    __MOCK_DISTRACTION?: (reason?: DistractionReason) => void;
  }
}

export interface UseFocusSessionOptions {
  autoStart?: boolean;
  onDistraction?: (reason: DistractionReason) => void;
  onFocusRestored?: () => void;
  absenceThresholdMs?: number;
  gazeAwayThresholdMs?: number;
}

export interface UseFocusSessionReturn {
  status: FocusStatus;
  distractionCount: number;
  lastDistractionReason: DistractionReason | null;
  startSession: () => Promise<void>;
  stopSession: () => void;
  isTracking: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  gazeMetrics: GazeMetrics;
  triggerDistraction: (reason?: DistractionReason) => void;
}

const DEFAULT_GAZE_METRICS: GazeMetrics = {
  yaw: 0,
  pitch: 0,
  faceDetected: false,
  isGazeAway: false,
  isAbsent: true,
};

/**
 * React hook managing camera stream, real-time focus tracking,
 * audio alerts, and demo mock distraction shortcuts (Shift + D / window.__MOCK_DISTRACTION).
 */
export function useFocusSession(options: UseFocusSessionOptions = {}): UseFocusSessionReturn {
  const [status, setStatus] = useState<FocusStatus>('active');
  const [distractionCount, setDistractionCount] = useState<number>(0);
  const [lastDistractionReason, setLastDistractionReason] = useState<DistractionReason | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [gazeMetrics, setGazeMetrics] = useState<GazeMetrics>(DEFAULT_GAZE_METRICS);

  const trackerRef = useRef<FocusTracker | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const isTrackingRef = useRef<boolean>(false);

  // Initialize or get the tracker instance
  const getTracker = useCallback((): FocusTracker => {
    if (!trackerRef.current) {
      trackerRef.current = new FocusTracker({
        absenceThresholdMs: options.absenceThresholdMs,
        gazeAwayThresholdMs: options.gazeAwayThresholdMs,
        onDistraction: (reason) => {
          options.onDistraction?.(reason);
        },
        onFocusRestored: () => {
          options.onFocusRestored?.();
        },
      });
    }
    return trackerRef.current;
  }, [options]);

  /**
   * Forcibly triggers a distraction state transition immediately (for demo / dev).
   */
  const triggerDistraction = useCallback(
    (reason: DistractionReason = 'gaze_away') => {
      const tracker = getTracker();
      const result = tracker.triggerMockDistraction(reason);
      setStatus(result.status);
      setDistractionCount(result.distractionCount);
      setLastDistractionReason(result.lastDistractionReason);
      setGazeMetrics(result.gazeMetrics);
    },
    [getTracker]
  );

  /**
   * Main tracking loop running on requestAnimationFrame.
   */
  const runTrackingLoop = useCallback(() => {
    if (!isTrackingRef.current) return;

    const tracker = getTracker();
    const video = videoRef.current;

    if (video) {
      const result = tracker.processFrame(video);
      setStatus(result.status);
      setDistractionCount(result.distractionCount);
      setLastDistractionReason(result.lastDistractionReason);
      setGazeMetrics(result.gazeMetrics);
    }

    animFrameIdRef.current = requestAnimationFrame(runTrackingLoop);
  }, [getTracker]);

  /**
   * Starts video stream acquisition and the vision tracking loop.
   */
  const startSession = useCallback(async (): Promise<void> => {
    if (isTrackingRef.current) return;

    const tracker = getTracker();
    tracker.reset();
    setStatus('active');
    setDistractionCount(0);
    setLastDistractionReason(null);
    setGazeMetrics(DEFAULT_GAZE_METRICS);

    try {
      await tracker.initialize();

      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: false,
        });

        mediaStreamRef.current = stream;

        // Ensure video element exists to stream into
        if (!videoRef.current && typeof document !== 'undefined') {
          const hiddenVideo = document.createElement('video');
          hiddenVideo.autoplay = true;
          hiddenVideo.playsInline = true;
          hiddenVideo.muted = true;
          hiddenVideo.style.display = 'none';
          document.body.appendChild(hiddenVideo);
          videoRef.current = hiddenVideo;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      }

      isTrackingRef.current = true;
      setIsTracking(true);
      animFrameIdRef.current = requestAnimationFrame(runTrackingLoop);
    } catch (err) {
      console.warn('Failed to access camera or initialize tracker, starting in mock tracking mode.', err);
      isTrackingRef.current = true;
      setIsTracking(true);
      animFrameIdRef.current = requestAnimationFrame(runTrackingLoop);
    }
  }, [getTracker, runTrackingLoop]);

  /**
   * Stops video stream, cancels animation frame, and resets tracking.
   */
  const stopSession = useCallback((): void => {
    isTrackingRef.current = false;
    setIsTracking(false);

    if (animFrameIdRef.current !== null) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (trackerRef.current) {
      trackerRef.current.reset();
    }

    setStatus('idle');
  }, []);

  // Demo Mock Mode: Shift + D listener & window.__MOCK_DISTRACTION toggle
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Attach global window hook for easy demo evaluation
    window.__MOCK_DISTRACTION = (reason?: DistractionReason) => {
      triggerDistraction(reason || 'gaze_away');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        triggerDistraction('gaze_away');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      delete window.__MOCK_DISTRACTION;
    };
  }, [triggerDistraction]);

  // Clean up on component unmount
  useEffect(() => {
    if (options.autoStart) {
      startSession().catch(() => {});
    }

    return () => {
      stopSession();
      if (trackerRef.current) {
        trackerRef.current.destroy();
        trackerRef.current = null;
      }
    };
  }, [options.autoStart, startSession, stopSession]);

  return {
    status,
    distractionCount,
    lastDistractionReason,
    startSession,
    stopSession,
    isTracking,
    videoRef,
    gazeMetrics,
    triggerDistraction,
  };
}
