import type { NormalizedPoint, FaceData } from './CameraEngine';
import type { HandState, GestureType } from './GestureEngine';

class DemoModeClass {
  private mouseX = 0.5;
  private mouseY = 0.5;
  private isMouseDown = false;
  private isRightDown = false;
  private wristAngle = 0;
  private posHistory: Array<{ x: number; y: number; t: number }> = [];
  private active = false;
  private angleAccumulator = 0;
  private lastAngle = 0;
  private hasLastAngle = false;
  private simulatedMouthOpen = false;

  enable() {
    this.active = true;
    window.addEventListener('mousemove', this.onMove);
    window.addEventListener('mousedown', this.onDown);
    window.addEventListener('mouseup', this.onUp);
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('contextmenu', this.onCtx);
  }

  disable() {
    this.active = false;
    window.removeEventListener('mousemove', this.onMove);
    window.removeEventListener('mousedown', this.onDown);
    window.removeEventListener('mouseup', this.onUp);
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('contextmenu', this.onCtx);
  }

  private onMove = (e: MouseEvent) => {
    this.mouseX = Math.max(0.05, Math.min(0.95, e.clientX / window.innerWidth));
    this.mouseY = Math.max(0.05, Math.min(0.95, e.clientY / window.innerHeight));
    this.posHistory.push({ x: this.mouseX, y: this.mouseY, t: performance.now() });
    if (this.posHistory.length > 20) this.posHistory.shift();
  };

  private onDown = (e: MouseEvent) => {
    if (e.button === 0) {
      this.isMouseDown = true;
      this.simulatedMouthOpen = true;
    }
    if (e.button === 2) this.isRightDown = true;
  };

  private onUp = (e: MouseEvent) => {
    if (e.button === 0) this.isMouseDown = false;
    if (e.button === 2) this.isRightDown = false;
  };

  private onKey = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      this.simulatedMouthOpen = !this.simulatedMouthOpen;
    }
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.wristAngle = Math.max(-90, Math.min(90, this.wristAngle + e.deltaY * 0.1));
  };

  private onCtx = (e: Event) => e.preventDefault();

  getFakeHandState(): HandState | null {
    if (!this.active) return null;
    const now = performance.now();
    const recent = this.posHistory.filter(p => now - p.t < 180);
    let vx = 0, vy = 0, speed = 0;
    if (recent.length >= 2) {
      const o = recent[0], n = recent[recent.length - 1];
      const dt = (n.t - o.t) / 1000 || 0.001;
      vx = (n.x - o.x) / dt;
      vy = (n.y - o.y) / dt;
      speed = Math.sqrt(vx * vx + vy * vy);
    }

    // Circular motion
    let isCircular = false;
    let circularDirection: 'cw' | 'ccw' | 'none' = 'none';
    if (this.posHistory.length >= 8) {
      const xs = this.posHistory.map(p => p.x);
      const ys = this.posHistory.map(p => p.y);
      const cx = xs.reduce((a, b) => a + b, 0) / xs.length;
      const cy = ys.reduce((a, b) => a + b, 0) / ys.length;
      const latest = this.posHistory[this.posHistory.length - 1];
      const angle = Math.atan2(latest.y - cy, latest.x - cx);

      if (this.hasLastAngle) {
        let delta = angle - this.lastAngle;
        if (delta > Math.PI) delta -= 2 * Math.PI;
        if (delta < -Math.PI) delta += 2 * Math.PI;
        this.angleAccumulator += delta;
      }
      this.lastAngle = angle;
      this.hasLastAngle = true;

      if (Math.abs(this.angleAccumulator) > Math.PI * 1.1) {
        isCircular = true;
        circularDirection = this.angleAccumulator > 0 ? 'cw' : 'ccw';
      }
    }

    if (speed < 0.02) this.angleAccumulator *= 0.85;

    let gesture: GestureType = 'open';
    if (this.isMouseDown) gesture = 'pinch';
    if (this.isRightDown) gesture = 'grab';
    if (speed > 0.4) gesture = 'slap';
    else if (speed > 0.15) {
      if (Math.abs(vx) > Math.abs(vy) * 1.5) gesture = vx > 0 ? 'swipe_right' : 'swipe_left';
      else gesture = vy > 0 ? 'swipe_down' : 'swipe_up';
    } else if (isCircular) {
      gesture = circularDirection === 'cw' ? 'circular_cw' : 'circular_ccw';
    }

    return {
      position: { x: this.mouseX, y: this.mouseY, z: 0 },
      velocity: { vx, vy, speed },
      gesture,
      pinchDistance: this.isMouseDown ? 0.02 : 0.12,
      isCircular,
      circularDirection,
      wristAngle: this.wristAngle || vx * 20,
      fingersClosed: [this.isRightDown, this.isRightDown, this.isRightDown, this.isRightDown, this.isRightDown],
    };
  }

  getFakeFaceState(): FaceData | null {
    if (!this.active) return null;

    // Center simulated face
    const fx = 0.5;
    const fy = 0.42;

    const headTop = { x: fx, y: fy - 0.22, z: 0 };
    const chin = { x: fx, y: fy + 0.22, z: 0 };
    const nose = { x: fx, y: fy, z: 0 };
    const leftCheek = { x: fx - 0.15, y: fy + 0.04, z: 0 };
    const rightCheek = { x: fx + 0.15, y: fy + 0.04, z: 0 };

    const mouthY = fy + 0.12;
    const mouthGap = this.simulatedMouthOpen ? 0.05 : 0.015;
    const upperLip = { x: fx, y: mouthY - mouthGap / 2, z: 0 };
    const lowerLip = { x: fx, y: mouthY + mouthGap / 2, z: 0 };
    const leftCorner = { x: fx - 0.06, y: mouthY, z: 0 };
    const rightCorner = { x: fx + 0.06, y: mouthY, z: 0 };

    return {
      landmarks: [headTop, nose, upperLip, lowerLip, leftCorner, rightCorner, chin, leftCheek, rightCheek],
      mouth: {
        upperLip,
        lowerLip,
        leftCorner,
        rightCorner,
        center: { x: fx, y: mouthY },
        isOpen: this.simulatedMouthOpen,
        openRatio: this.simulatedMouthOpen ? 0.42 : 0.12,
        width: 0.12,
        height: mouthGap,
      },
      headTop,
      chin,
      nose,
      leftCheek,
      rightCheek,
      tiltAngle: 0,
    };
  }

  getFakeLandmarks(): NormalizedPoint[][] {
    if (!this.active) return [];
    const x = this.mouseX, y = this.mouseY;
    const lm: NormalizedPoint[] = [
      { x, y: y + 0.08, z: 0 },
      { x: x - 0.03, y: y + 0.05, z: 0 },
      { x: x - 0.05, y: y + 0.02, z: 0 },
      { x: x - 0.06, y: y - 0.01, z: 0 },
      { x: x - 0.07, y: y - 0.04, z: 0 },
      { x: x - 0.03, y: y - 0.02, z: 0 },
      { x: x - 0.03, y: y - 0.05, z: 0 },
      { x: x - 0.03, y: y - 0.08, z: 0 },
      { x: x - 0.03, y: y - 0.10, z: 0 },
      { x: x - 0.01, y: y - 0.02, z: 0 },
      { x: x - 0.01, y: y - 0.05, z: 0 },
      { x: x - 0.01, y: y - 0.09, z: 0 },
      { x: x - 0.01, y: y - 0.11, z: 0 },
      { x: x + 0.01, y: y - 0.02, z: 0 },
      { x: x + 0.01, y: y - 0.05, z: 0 },
      { x: x + 0.01, y: y - 0.08, z: 0 },
      { x: x + 0.01, y: y - 0.10, z: 0 },
      { x: x + 0.03, y: y - 0.01, z: 0 },
      { x: x + 0.03, y: y - 0.04, z: 0 },
      { x: x + 0.03, y: y - 0.06, z: 0 },
      { x: x + 0.03, y: y - 0.08, z: 0 },
    ];
    return [lm];
  }
}

export const DemoMode = new DemoModeClass();
