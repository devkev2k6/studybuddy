/**
 * Focus detection engine using MediaPipe FaceLandmarker or heuristic fallback.
 * Zero server-side video transfer; runs entirely client-side.
 */

import type { DistractionReason, FocusStatus, GazeMetrics } from '../../types/guardian';

export interface Landmark3D {
  x: number;
  y: number;
  z?: number;
}

export interface GazeAngles {
  yaw: number;
  pitch: number;
  isLookingAway: boolean;
  isLookingDown: boolean;
  isGazeAway: boolean;
}

export interface FocusTrackerOptions {
  wasmLoaderCdn?: string;
  modelAssetPath?: string;
  absenceThresholdMs?: number;
  gazeAwayThresholdMs?: number;
  onDistraction?: (reason: DistractionReason) => void;
  onFocusRestored?: () => void;
}

export interface FrameTrackingResult {
  status: FocusStatus;
  lastDistractionReason: DistractionReason | null;
  distractionCount: number;
  gazeMetrics: GazeMetrics;
  faceDetected: boolean;
  stateChanged: boolean;
}

const DEFAULT_WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const DEFAULT_MODEL_PATH =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

/**
 * Calculates 3D head yaw and pitch from facial landmarks.
 * Landmarks used:
 * - Nose tip: index 1
 * - Left eye outer corner: index 33
 * - Right eye outer corner: index 263
 * - Forehead glabella: index 10
 * - Chin: index 152
 */
export function calculateGazeAngles(landmarks: Landmark3D[]): GazeAngles {
  if (!landmarks || landmarks.length < 264) {
    return {
      yaw: 0,
      pitch: 0,
      isLookingAway: false,
      isLookingDown: false,
      isGazeAway: false,
    };
  }

  const nose = landmarks[1];
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  const forehead = landmarks[10];
  const chin = landmarks[152];

  // Interocular calculations
  const eyeMidX = (leftEye.x + rightEye.x) / 2;
  const eyeDist = Math.max(Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y), 0.001);

  // 1. Yaw calculation (looking away horizontally)
  // MediaPipe: left eye is user's right side, right eye is user's left side in camera mirror
  const eyeDx = rightEye.x - leftEye.x;
  const eyeDz = (rightEye.z ?? 0) - (leftEye.z ?? 0);
  const yawFrom3D = Math.atan2(eyeDz, Math.max(Math.abs(eyeDx), 0.001)) * (180 / Math.PI);

  // Projection ratio: nose horizontal offset relative to eyes center
  const noseRatio = (nose.x - eyeMidX) / (eyeDist * 0.5);
  const clampedNoseRatio = Math.max(-1, Math.min(1, noseRatio));
  const yawFromProjection = Math.asin(clampedNoseRatio) * (180 / Math.PI);

  // Blended Yaw in degrees (-90 to +90)
  const yaw = Number(((yawFrom3D * 0.5) + (yawFromProjection * 0.5)).toFixed(2));

  // 2. Pitch calculation (head tilt up or down towards phone)
  // Distance from forehead to chin
  const faceHeight = Math.max(Math.hypot(chin.x - forehead.x, chin.y - forehead.y), 0.001);
  const chinDz = (chin.z ?? 0) - (forehead.z ?? 0);
  const pitch3D = Math.atan2(chinDz, faceHeight) * (180 / Math.PI);

  // Perspective ratio: when tilting head down, upper face expands and chin foreshortens
  const upperFace = nose.y - forehead.y;
  const lowerFace = chin.y - nose.y;
  const verticalRatio = (upperFace - lowerFace) / Math.max(upperFace + lowerFace, 0.001);
  const pitchProjection = verticalRatio * 40;

  // Positive pitch means head is tilted downwards (e.g. looking at a desk/phone)
  const pitch = Number(((pitch3D * 0.5) + (pitchProjection * 0.5)).toFixed(2));

  // Thresholds specified in requirements:
  // - Yaw exceeds ±25° (looking away horizontally)
  // - Pitch drops > 20° (looking down at phone)
  const isLookingAway = Math.abs(yaw) > 25;
  const isLookingDown = pitch > 20;
  const isGazeAway = isLookingAway || isLookingDown;

  return {
    yaw,
    pitch,
    isLookingAway,
    isLookingDown,
    isGazeAway,
  };
}

/**
 * Triggers a subtle synthetic browser beep using the native Web Audio API (AudioContext).
 * No external audio files or dependencies required.
 */
export function playDistractionBeep(): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioCtxClass) return;

    const ctx = new AudioCtxClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Subtle warning chime (480Hz -> 360Hz)
    osc.frequency.setValueAtTime(480, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(360, ctx.currentTime + 0.22);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.28);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 350);
  } catch {
    // Autoplay restrictions or headless browser environment fallback
  }
}

/**
 * Core Focus Tracker maintaining continuous duration tracking for absence and gaze deviation.
 */
export class FocusTracker {
  private status: FocusStatus = 'active';
  private lastDistractionReason: DistractionReason | null = null;
  private distractionCount: number = 0;

  private absentStartTime: number | null = null;
  private gazeAwayStartTime: number | null = null;

  private landmarker: unknown = null;
  private isInitializing: boolean = false;
  private isFallbackMode: boolean = false;

  private readonly absenceThresholdMs: number;
  private readonly gazeAwayThresholdMs: number;
  private readonly wasmLoaderCdn: string;
  private readonly modelAssetPath: string;
  private readonly onDistraction?: (reason: DistractionReason) => void;
  private readonly onFocusRestored?: () => void;

  constructor(options: FocusTrackerOptions = {}) {
    this.absenceThresholdMs = options.absenceThresholdMs ?? 3000; // > 3 seconds absence
    this.gazeAwayThresholdMs = options.gazeAwayThresholdMs ?? 2500; // > 2.5 seconds gaze away
    this.wasmLoaderCdn = options.wasmLoaderCdn ?? DEFAULT_WASM_CDN;
    this.modelAssetPath = options.modelAssetPath ?? DEFAULT_MODEL_PATH;
    this.onDistraction = options.onDistraction;
    this.onFocusRestored = options.onFocusRestored;
  }

  /**
   * Initializes the MediaPipe FaceLandmarker with CDN wasm assets,
   * falling back gracefully to heuristic/mock tracking if WebAssembly or network fails.
   */
  public async initialize(): Promise<void> {
    if (this.landmarker || this.isInitializing || typeof window === 'undefined') {
      return;
    }

    this.isInitializing = true;
    try {
      const vision = await import('@mediapipe/tasks-vision');
      const fileset = await vision.FilesetResolver.forVisionTasks(this.wasmLoaderCdn);

      const landmarkerInstance = await vision.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: this.modelAssetPath,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      this.landmarker = landmarkerInstance;
      this.isFallbackMode = false;
    } catch (err) {
      console.warn(
        'MediaPipe FaceLandmarker initialization failed or running in unsupported environment. Engaging browser heuristic fallback.',
        err
      );
      this.isFallbackMode = true;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Processes a video frame and updates temporal state machines.
   */
  public processFrame(
    videoElement: HTMLVideoElement | null,
    now: number = typeof performance !== 'undefined' ? performance.now() : Date.now()
  ): FrameTrackingResult {
    let faceDetected = false;
    let rawLandmarks: Landmark3D[] | null = null;

    if (
      !this.isFallbackMode &&
      this.landmarker &&
      videoElement &&
      videoElement.readyState >= 2 &&
      !videoElement.paused
    ) {
      try {
        const detector = this.landmarker as {
          detectForVideo: (
            video: HTMLVideoElement,
            timestampMs: number
          ) => { faceLandmarks?: Landmark3D[][] };
        };
        const result = detector.detectForVideo(videoElement, now);
        if (result.faceLandmarks && result.faceLandmarks.length > 0) {
          faceDetected = true;
          rawLandmarks = result.faceLandmarks[0];
        }
      } catch {
        // Fallback for frame detection drop or WebGL context reset
      }
    } else if (this.isFallbackMode && videoElement && videoElement.readyState >= 2) {
      // Heuristic fallback: if video is active and playing, consider face present
      faceDetected = true;
    }

    const gaze = rawLandmarks
      ? calculateGazeAngles(rawLandmarks)
      : {
          yaw: 0,
          pitch: 0,
          isLookingAway: false,
          isLookingDown: false,
          isGazeAway: false,
        };

    const gazeMetrics: GazeMetrics = {
      yaw: gaze.yaw,
      pitch: gaze.pitch,
      faceDetected,
      isGazeAway: gaze.isGazeAway,
      isAbsent: !faceDetected,
    };

    let stateChanged = false;

    // --- State Machine Evaluations ---
    if (!faceDetected) {
      // 1. Absence check
      this.gazeAwayStartTime = null;

      if (this.absentStartTime === null) {
        this.absentStartTime = now;
      } else if (now - this.absentStartTime > this.absenceThresholdMs) {
        if (this.status !== 'distracted' || this.lastDistractionReason !== 'absent') {
          if (this.status === 'active') {
            this.distractionCount++;
            playDistractionBeep();
            this.onDistraction?.('absent');
          }
          this.status = 'distracted';
          this.lastDistractionReason = 'absent';
          stateChanged = true;
        }
      }
    } else {
      // Face is present
      this.absentStartTime = null;

      // 2. Gaze / Pitch / Yaw check
      if (gaze.isGazeAway) {
        if (this.gazeAwayStartTime === null) {
          this.gazeAwayStartTime = now;
        } else if (now - this.gazeAwayStartTime > this.gazeAwayThresholdMs) {
          if (this.status !== 'distracted' || this.lastDistractionReason !== 'gaze_away') {
            if (this.status === 'active') {
              this.distractionCount++;
              playDistractionBeep();
              this.onDistraction?.('gaze_away');
            }
            this.status = 'distracted';
            this.lastDistractionReason = 'gaze_away';
            stateChanged = true;
          }
        }
      } else {
        // Face is present and gaze is focused
        this.gazeAwayStartTime = null;

        if (this.status === 'distracted') {
          this.status = 'active';
          stateChanged = true;
          this.onFocusRestored?.();
        }
      }
    }

    return {
      status: this.status,
      lastDistractionReason: this.lastDistractionReason,
      distractionCount: this.distractionCount,
      gazeMetrics,
      faceDetected,
      stateChanged,
    };
  }

  /**
   * Forcibly triggers a distraction state transition for testing or demo mock mode.
   */
  public triggerMockDistraction(reason: DistractionReason = 'gaze_away'): FrameTrackingResult {
    this.status = 'distracted';
    this.lastDistractionReason = reason;
    this.distractionCount++;
    playDistractionBeep();
    this.onDistraction?.(reason);

    return {
      status: this.status,
      lastDistractionReason: this.lastDistractionReason,
      distractionCount: this.distractionCount,
      gazeMetrics: {
        yaw: reason === 'gaze_away' ? 32 : 0,
        pitch: reason === 'phone_detected' ? 26 : 0,
        faceDetected: reason !== 'absent',
        isGazeAway: reason === 'gaze_away' || reason === 'phone_detected',
        isAbsent: reason === 'absent',
      },
      faceDetected: reason !== 'absent',
      stateChanged: true,
    };
  }

  /**
   * Resets internal counters and timers.
   */
  public reset(): void {
    this.status = 'active';
    this.lastDistractionReason = null;
    this.distractionCount = 0;
    this.absentStartTime = null;
    this.gazeAwayStartTime = null;
  }

  /**
   * Cleans up resources.
   */
  public destroy(): void {
    if (this.landmarker) {
      try {
        const detector = this.landmarker as { close?: () => void };
        detector.close?.();
      } catch {
        // Ignore cleanup failure
      }
      this.landmarker = null;
    }
  }

  public getStatus(): FocusStatus {
    return this.status;
  }

  public getDistractionCount(): number {
    return this.distractionCount;
  }

  public getLastDistractionReason(): DistractionReason | null {
    return this.lastDistractionReason;
  }
}
