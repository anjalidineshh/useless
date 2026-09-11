import {
  HandLandmarker,
  FaceLandmarker,
  FilesetResolver,
  type HandLandmarkerResult,
  type FaceLandmarkerResult,
} from '@mediapipe/tasks-vision';

export type NormalizedPoint = { x: number; y: number; z: number };
export type HandLandmark = NormalizedPoint;

export interface FaceData {
  landmarks: NormalizedPoint[];
  mouth: {
    upperLip: NormalizedPoint;
    lowerLip: NormalizedPoint;
    leftCorner: NormalizedPoint;
    rightCorner: NormalizedPoint;
    center: { x: number; y: number };
    isOpen: boolean;
    openRatio: number;
    width: number;
    height: number;
  };
  headTop: NormalizedPoint;
  chin: NormalizedPoint;
  nose: NormalizedPoint;
  leftCheek: NormalizedPoint;
  rightCheek: NormalizedPoint;
  tiltAngle: number;
}

export interface VisionResult {
  face: FaceData | null;
  rawFaceLandmarks: NormalizedPoint[][];
  rawHandLandmarks: NormalizedPoint[][];
  confidence: number;
}

type VisionCallback = (result: VisionResult, fps: number, latency: number) => void;

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';
const HAND_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const FACE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

class CameraEngineClass {
  private handLandmarker: HandLandmarker | null = null;
  private faceLandmarker: FaceLandmarker | null = null;
  private stream: MediaStream | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private animFrameId: number | null = null;
  private callback: VisionCallback | null = null;
  private lastTime = 0;
  private frameCount = 0;
  private fps = 30;
  private fpsTimer = 0;
  public isReady = false;
  public isRunning = false;

  async initialize(): Promise<void> {
    if (this.isReady) return;
    try {
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);

      // Initialize Hand and Face landmarkers in parallel
      const [handLM, faceLM] = await Promise.allSettled([
        HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: HAND_MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.45,
          minHandPresenceConfidence: 0.45,
          minTrackingConfidence: 0.45,
        }),
        FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: 0.45,
          minFacePresenceConfidence: 0.45,
          minTrackingConfidence: 0.45,
          outputFaceBlendshapes: false,
        }),
      ]);

      if (handLM.status === 'fulfilled') this.handLandmarker = handLM.value;
      if (faceLM.status === 'fulfilled') this.faceLandmarker = faceLM.value;

      this.isReady = true;
    } catch (err) {
      console.warn('MediaPipe GPU initialization warning, falling back:', err);
      this.isReady = true;
    }
  }

  async startCamera(videoEl: HTMLVideoElement, onResult: VisionCallback): Promise<void> {
    this.videoEl = videoEl;
    this.callback = onResult;

    // Start video stream immediately for zero-latency camera preview
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
      },
      audio: false,
    });

    videoEl.srcObject = this.stream;
    await new Promise<void>(resolve => {
      videoEl.onloadeddata = () => resolve();
    });
    await videoEl.play();

    this.isRunning = true;

    // Initialize vision models if not ready
    if (!this.isReady) {
      await this.initialize();
    }

    this.loop();
  }

  stopCamera(): void {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.videoEl) {
      this.videoEl.srcObject = null;
      this.videoEl = null;
    }
  }

  private loop = (): void => {
    if (!this.isRunning || !this.videoEl) return;

    const now = performance.now();
    const latency = Math.round(now - this.lastTime);
    this.lastTime = now;

    // FPS counter
    this.frameCount++;
    if (now - this.fpsTimer >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTimer = now;
    }

    let rawFaceLandmarks: NormalizedPoint[][] = [];
    let rawHandLandmarks: NormalizedPoint[][] = [];
    let faceData: FaceData | null = null;
    let confidence = 0;

    if (this.videoEl.readyState >= 2) {
      try {
        if (this.faceLandmarker) {
          const fRes: FaceLandmarkerResult = this.faceLandmarker.detectForVideo(this.videoEl, now);
          if (fRes.faceLandmarks && fRes.faceLandmarks.length > 0) {
            rawFaceLandmarks = fRes.faceLandmarks;
            faceData = this.processFace(rawFaceLandmarks[0]);
            confidence = 96;
          }
        }

        if (this.handLandmarker) {
          const hRes: HandLandmarkerResult = this.handLandmarker.detectForVideo(this.videoEl, now);
          if (hRes.landmarks && hRes.landmarks.length > 0) {
            rawHandLandmarks = hRes.landmarks;
            confidence = Math.max(confidence, Math.round((hRes.handedness?.[0]?.[0]?.score || 0.9) * 100));
          }
        }
      } catch {
        // Frame dropped or busy
      }

      this.callback?.(
        {
          face: faceData,
          rawFaceLandmarks,
          rawHandLandmarks,
          confidence,
        },
        this.fps,
        latency
      );
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private processFace(lm: NormalizedPoint[]): FaceData {
    // MediaPipe Face Mesh key landmark indices:
    // 10: Forehead top / hairline
    // 152: Chin bottom
    // 1: Nose tip
    // 13: Upper lip inner center
    // 14: Lower lip inner center
    // 61: Left mouth corner (subject's right)
    // 291: Right mouth corner (subject's left)
    // 234: Left cheek outer
    // 454: Right cheek outer
    const headTop = lm[10] || { x: 0.5, y: 0.2, z: 0 };
    const chin = lm[152] || { x: 0.5, y: 0.8, z: 0 };
    const nose = lm[1] || { x: 0.5, y: 0.5, z: 0 };
    const upperLip = lm[13] || { x: 0.5, y: 0.6, z: 0 };
    const lowerLip = lm[14] || { x: 0.5, y: 0.65, z: 0 };
    const leftCorner = lm[61] || { x: 0.42, y: 0.62, z: 0 };
    const rightCorner = lm[291] || { x: 0.58, y: 0.62, z: 0 };
    const leftCheek = lm[234] || { x: 0.35, y: 0.5, z: 0 };
    const rightCheek = lm[454] || { x: 0.65, y: 0.5, z: 0 };

    const mouthWidth = Math.hypot(rightCorner.x - leftCorner.x, rightCorner.y - leftCorner.y);
    const mouthHeight = Math.hypot(lowerLip.x - upperLip.x, lowerLip.y - upperLip.y);
    const openRatio = mouthWidth > 0 ? mouthHeight / mouthWidth : 0;
    const isOpen = openRatio > 0.18; // mouth clearly open

    const mouthCenter = {
      x: (leftCorner.x + rightCorner.x + upperLip.x + lowerLip.x) / 4,
      y: (leftCorner.y + rightCorner.y + upperLip.y + lowerLip.y) / 4,
    };

    const tiltAngle = Math.atan2(rightCorner.y - leftCorner.y, rightCorner.x - leftCorner.x) * (180 / Math.PI);

    return {
      landmarks: lm,
      mouth: {
        upperLip,
        lowerLip,
        leftCorner,
        rightCorner,
        center: mouthCenter,
        isOpen,
        openRatio,
        width: mouthWidth,
        height: mouthHeight,
      },
      headTop,
      chin,
      nose,
      leftCheek,
      rightCheek,
      tiltAngle,
    };
  }
}

export const CameraEngine = new CameraEngineClass();
