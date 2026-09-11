import type { HandLandmark } from './CameraEngine';

// MediaPipe hand landmark indices
export const LANDMARK = {
  WRIST: 0,
  THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
  INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
  MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
  RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
  PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20,
} as const;

export type GestureType =
  | 'none' | 'open' | 'pinch' | 'grab' | 'point'
  | 'swipe_left' | 'swipe_right' | 'swipe_up' | 'swipe_down'
  | 'circular_cw' | 'circular_ccw' | 'tilt_left' | 'tilt_right' | 'push' | 'slap';

export interface HandState {
  position: { x: number; y: number; z: number };
  velocity: { vx: number; vy: number; speed: number };
  gesture: GestureType;
  pinchDistance: number;
  isCircular: boolean;
  circularDirection: 'cw' | 'ccw' | 'none';
  wristAngle: number; // degrees, for tilt/pour detection
  fingersClosed: boolean[];
}

const SMOOTHING = 0.65; // higher = smoother but more lag
const PINCH_THRESHOLD = 0.06;
const GRAB_THRESHOLD = 0.08;
const SWIPE_SPEED = 0.015;

class GestureEngineClass {
  private smoothedLandmarks: HandLandmark[][] = [];
  private positionHistory: Array<{ x: number; y: number; t: number }> = [];
  private angleAccumulator = 0;
  private lastAngle = 0;
  private hasLastAngle = false;

  process(rawLandmarks: HandLandmark[][]): HandState[] {
    if (!rawLandmarks.length) {
      this.smoothedLandmarks = [];
      this.positionHistory = [];
      this.angleAccumulator = 0;
      this.hasLastAngle = false;
      return [];
    }

    // Smooth landmarks
    this.smoothedLandmarks = rawLandmarks.map((hand, hi) => {
      if (!this.smoothedLandmarks[hi]) return hand;
      return hand.map((lm, li) => ({
        x: this.smoothedLandmarks[hi][li].x * SMOOTHING + lm.x * (1 - SMOOTHING),
        y: this.smoothedLandmarks[hi][li].y * SMOOTHING + lm.y * (1 - SMOOTHING),
        z: this.smoothedLandmarks[hi][li].z * SMOOTHING + lm.z * (1 - SMOOTHING),
      }));
    });

    return this.smoothedLandmarks.map(hand => this.analyzeHand(hand));
  }

  private analyzeHand(lm: HandLandmark[]): HandState {
    const wrist = lm[LANDMARK.WRIST];

    // Position (normalized 0-1, mirrored for natural feel)
    const position = { x: 1 - wrist.x, y: wrist.y, z: wrist.z };

    // Velocity
    const now = performance.now();
    this.positionHistory.push({ x: position.x, y: position.y, t: now });
    if (this.positionHistory.length > 6) this.positionHistory.shift();
    let vx = 0, vy = 0, speed = 0;
    if (this.positionHistory.length >= 2) {
      const oldest = this.positionHistory[0];
      const newest = this.positionHistory[this.positionHistory.length - 1];
      const dt = (newest.t - oldest.t) / 1000 || 0.001;
      vx = (newest.x - oldest.x) / dt;
      vy = (newest.y - oldest.y) / dt;
      speed = Math.sqrt(vx * vx + vy * vy);
    }

    // Finger tip distances to wrist
    const tips = [LANDMARK.THUMB_TIP, LANDMARK.INDEX_TIP, LANDMARK.MIDDLE_TIP, LANDMARK.RING_TIP, LANDMARK.PINKY_TIP];
    const mcps = [LANDMARK.THUMB_MCP, LANDMARK.INDEX_MCP, LANDMARK.MIDDLE_MCP, LANDMARK.RING_MCP, LANDMARK.PINKY_MCP];
    const fingersClosed = tips.map((tip, i) => dist(lm[tip], lm[mcps[i]]) < GRAB_THRESHOLD * 2.5);

    // Pinch: thumb tip ↔ index tip
    const pinchDistance = dist(lm[LANDMARK.THUMB_TIP], lm[LANDMARK.INDEX_TIP]);
    const isPinch = pinchDistance < PINCH_THRESHOLD;
    const isGrab = fingersClosed.filter(Boolean).length >= 4;
    const isOpen = fingersClosed.filter(Boolean).length <= 1;
    const isPoint = !fingersClosed[1] && fingersClosed[2] && fingersClosed[3] && fingersClosed[4];

    // Wrist angle (for tilt/pour detection)
    const indexMcp = lm[LANDMARK.INDEX_MCP];
    const pinkyMcp = lm[LANDMARK.PINKY_MCP];
    const wristAngle = Math.atan2(indexMcp.y - pinkyMcp.y, indexMcp.x - pinkyMcp.x) * (180 / Math.PI);

    // Circular motion detection
    let isCircular = false;
    let circularDirection: 'cw' | 'ccw' | 'none' = 'none';
    if (this.positionHistory.length >= 6) {
      const center = { x: mean(this.positionHistory.map(p => p.x)), y: mean(this.positionHistory.map(p => p.y)) };
      const latest = this.positionHistory[this.positionHistory.length - 1];
      const angle = Math.atan2(latest.y - center.y, latest.x - center.x);
      if (this.hasLastAngle) {
        let delta = angle - this.lastAngle;
        if (delta > Math.PI) delta -= 2 * Math.PI;
        if (delta < -Math.PI) delta += 2 * Math.PI;
        this.angleAccumulator += delta;
      }
      this.lastAngle = angle;
      this.hasLastAngle = true;
      if (Math.abs(this.angleAccumulator) > Math.PI * 1.2) {
        isCircular = true;
        circularDirection = this.angleAccumulator > 0 ? 'cw' : 'ccw';
      }
    }

    // Reset circular accumulator if speed is low
    if (speed < 0.01) { this.angleAccumulator *= 0.9; }

    // Swipe detection
    let gesture: GestureType = 'none';
    if (isGrab) gesture = 'grab';
    else if (isPinch) gesture = 'pinch';
    else if (isPoint) gesture = 'point';
    else if (isOpen) gesture = 'open';
    if (speed > 0.28) {
      gesture = 'slap';
    } else if (speed > SWIPE_SPEED) {
      if (Math.abs(vx) > Math.abs(vy) * 1.5) {
        gesture = vx > 0 ? 'swipe_right' : 'swipe_left';
      } else if (Math.abs(vy) > Math.abs(vx) * 1.5) {
        gesture = vy > 0 ? 'swipe_down' : 'swipe_up';
      }
    }
    if (isCircular && speed > 0.005) {
      gesture = circularDirection === 'cw' ? 'circular_cw' : 'circular_ccw';
    }

    return { position, velocity: { vx, vy, speed }, gesture, pinchDistance, isCircular, circularDirection, wristAngle, fingersClosed };
  }

  getSmoothedLandmarks(): HandLandmark[][] { return this.smoothedLandmarks; }
}

function dist(a: HandLandmark, b: HandLandmark) {
  return Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2 + (a.z-b.z)**2);
}
function mean(arr: number[]) { return arr.reduce((a,b) => a+b, 0) / arr.length; }

export const GestureEngine = new GestureEngineClass();
