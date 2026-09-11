import { useState, useEffect, useRef, useCallback } from 'react';
import { CameraEngine, type FaceData, type VisionResult, type NormalizedPoint } from '../engine/CameraEngine';
import { GestureEngine, type HandState } from '../engine/GestureEngine';
import { DemoMode } from '../engine/DemoMode';

export type CameraMode = 'idle' | 'loading' | 'live' | 'demo' | 'error';

export interface TrackingState {
  mode: CameraMode;
  face: FaceData | null;
  hands: HandState[];
  primaryHand: HandState | null;
  landmarks: NormalizedPoint[][];
  rawFaceLandmarks: NormalizedPoint[][];
  fps: number;
  latency: number;
  confidence: number;
  errorMessage: string;
  debugMode: boolean;
  toggleDebug: () => void;
}

export function useHandTracking() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [state, setState] = useState<Omit<TrackingState, 'debugMode' | 'toggleDebug'>>({
    mode: 'idle',
    face: null,
    hands: [],
    primaryHand: null,
    landmarks: [],
    rawFaceLandmarks: [],
    fps: 0,
    latency: 0,
    confidence: 0,
    errorMessage: '',
  });

  const toggleDebug = useCallback(() => {
    setDebugMode(d => !d);
  }, []);

  const handleResult = useCallback((result: VisionResult, fps: number, latency: number) => {
    const hands = GestureEngine.process(result.rawHandLandmarks);
    const smoothed = GestureEngine.getSmoothedLandmarks();

    setState(s => ({
      ...s,
      face: result.face,
      hands,
      primaryHand: hands[0] ?? null,
      landmarks: smoothed,
      rawFaceLandmarks: result.rawFaceLandmarks,
      fps: Math.min(fps, 60),
      latency,
      confidence: result.confidence,
    }));
  }, []);

  const startCamera = useCallback(async () => {
    if (!videoRef.current) return;
    setState(s => ({ ...s, mode: 'loading', errorMessage: '' }));
    try {
      await CameraEngine.startCamera(videoRef.current, handleResult);
      setState(s => ({ ...s, mode: 'live' }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Camera unavailable';
      setState(s => ({ ...s, mode: 'error', errorMessage: msg }));
    }
  }, [handleResult]);

  const stopCamera = useCallback(() => {
    CameraEngine.stopCamera();
    DemoMode.disable();
    setState(s => ({
      ...s,
      mode: 'idle',
      face: null,
      hands: [],
      primaryHand: null,
      landmarks: [],
      rawFaceLandmarks: [],
      fps: 0,
      confidence: 0,
    }));
  }, []);

  const startDemo = useCallback(() => {
    DemoMode.enable();
    setState(s => ({ ...s, mode: 'demo' }));

    let rafId: number;
    const poll = () => {
      const fakeHand = DemoMode.getFakeHandState();
      const fakeFace = DemoMode.getFakeFaceState();
      const fakeLandmarks = DemoMode.getFakeLandmarks();

      setState(s => ({
        ...s,
        face: fakeFace,
        hands: fakeHand ? [fakeHand] : [],
        primaryHand: fakeHand,
        landmarks: fakeLandmarks,
        rawFaceLandmarks: fakeFace?.landmarks ? [fakeFace.landmarks] : [],
        fps: 60,
        latency: 0,
        confidence: 99,
      }));
      rafId = requestAnimationFrame(poll);
    };
    rafId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    return () => {
      CameraEngine.stopCamera();
      DemoMode.disable();
    };
  }, []);

  return {
    videoRef,
    state: {
      ...state,
      debugMode,
      toggleDebug,
    },
    startCamera,
    stopCamera,
    startDemo,
  };
}
