# USELESS REALITY 👁️✨

> **“Do absolutely normal things. But in augmented reality.”**  
> *You are not controlling an avatar. Your real body is the interface.*

---

## 🌟 Overview

**USELESS REALITY** is a full-screen augmented reality web application. Using local browser computer vision, it transforms your everyday chores into digital AR simulations directly overlaid on your live webcam feed.

- **Avatar-Free**: No 3D virtual avatars, no cartoon character models, and no split screens.
- **Full-Screen AR**: Your live mirrored camera feed is the full-viewport canvas.
- **Privacy-First**: Powered by local WebAssembly and WebGL neural models via `@mediapipe/tasks-vision`. **100% on-device processing** — zero video frames are ever recorded, saved, or uploaded.
- **Demo Mode**: Built-in mouse & keyboard simulation for headless environments or devices without a webcam.

---

## 🎮 The 12 Everyday AR Activities

| Activity | Tracking Points | Physical Interaction | AR Effect Over Live Camera |
| :--- | :--- | :--- | :--- |
| 🦷 **Teeth Brushing AR** | Mouth contour, Lips, Primary Hand | Move toothbrush / hand over mouth with open lips | Dynamic toothpaste foam lather over teeth, bristle scrub audio, dental zone progress |
| 🚿 **Virtual Shower AR** | Forehead / Head top lateral tracking | Stand under stream, move head left/right | AR shower head tracks head position, water stream splashes off hair, shampoo mode |
| 💆 **Hair Washing AR** | Scalp / Head top, Hand circular gestures | Circular scalp rubbing gestures near head | Multiplying soap foam lather on hair, rinse cascades |
| 🧼 **Face Scrub AR** | Left & right cheeks, Hand rubbing | Rub hands against cheeks | Soap lather deposits on real cheeks, rinse wave washes face clean |
| 🍽️ **Dishwashing AR** | Secondary palm, Primary hand | Hold palm flat, scrub with other hand | Ceramic plate pinned to palm, sponge scrub cleans grease with squeak sounds |
| 🫧 **Cloth Washing AR** | Two hands (distance & speed) | Hold cloth between hands, rub together | Stretched fabric between hands, detergent foam multiplies |
| 🧹 **Room Sweeping AR** | Primary hand, Real room floor | Sweep arm across camera room view | Wooden broom sweeps virtual dust crumbs & socks across your actual room |
| 🛏️ **Bed Making AR** | Real hands, Viewport lower third | Wide arm sweep across room | Wrinkled bedsheet snaps taut onto bed in your room feed |
| 🦟 **Mosquito Slap AR** | Face orbit radius, Hand velocity | High-speed hand slap collision | 3D spatial buzz, sudden slap splat, body hit sparks |
| ☕ **Chai Making AR** | Left hand (cup), Right hand (kettle) | Wrist tilt to pour, circular hand to stir | Steaming kettle pours tea into kulhad cup, spices boil |
| 🛌 **Cold Pillow AR** | Head tilt angle (roll) | Tilt head left/right onto pillow | Fluffy pillow follows head tilt behind head to find cold side |
| 🌡️ **Shower Temp AR** | Head top & Hand horizontal X | Move hand left (colder) vs right (hotter) | Water shifts from ice-cyan (12°C) to lava-red (64°C), target: 38.5°C |

---

## 🛠️ Architecture & Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Computer Vision**: `@mediapipe/tasks-vision`
  - `FaceLandmarker` (478 3D facial landmarks)
  - `HandLandmarker` (21 3D hand landmarks)
- **Styling & Aesthetics**: Tailwind CSS v4 + Glassmorphism HUD + Cyber-Gold UI Design System
- **Animation**: Framer Motion
- **Audio**: Web Audio API procedural sound synthesizers (bristle scrub, liquid drops, mosquito buzz/slap, plate squeaks)
- **State Management**: Zustand with persistent storage

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/anjalidineshh/useless.git

# Navigate into directory
cd useless

# Install dependencies
npm install

# Run the local development server
npm run dev
```

Open your browser and visit:  
👉 **`http://localhost:5173/useless/`**

### Production Build

```bash
npm run build
```

---

## 🔒 Privacy Guarantee

This application runs all vision models locally inside your browser using WebAssembly. Camera access is used solely for real-time landmark calculation. No images, videos, or facial telemetry are ever recorded, stored, or transmitted.
