import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useState } from 'react';
import StartScreen from './pages/StartScreen';
import MainLayout from './pages/MainLayout';
import FinalScreen from './pages/FinalScreen';
import AchievementToast from './components/AchievementToast';
import { useHandTracking } from './hooks/useHandTracking';
import { useGameStore } from './store/gameStore';
import './index.css';

function AppRoot() {
  const { videoRef, state: tracking, startCamera, stopCamera, startDemo } = useHandTracking();
  const { completedActivities, startTimer } = useGameStore();
  const [started, setStarted] = useState(false);

  const handleStartCamera = async () => {
    startTimer();
    setStarted(true);
    await startCamera();
  };

  const handleStartDemo = () => {
    startTimer();
    setStarted(true);
    startDemo();
  };

  const handleStop = () => {
    stopCamera();
    setStarted(false);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#070504]">
      {/* Persistent Full-Screen Mirrored Live Camera Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={started && tracking.mode === 'live' ? 'fixed inset-0 w-full h-full object-cover -scale-x-100 z-0 pointer-events-none' : 'hidden'}
      />

      {completedActivities.length === 12 && started ? (
        <FinalScreen onRestart={handleStop} />
      ) : !started ? (
        <StartScreen
          onStartCamera={handleStartCamera}
          onStartDemo={handleStartDemo}
          mode={tracking.mode}
          errorMessage={tracking.errorMessage}
        />
      ) : (
        <MainLayout
          tracking={tracking}
          onStopCamera={handleStop}
          onStartDemo={handleStartDemo}
          videoRef={videoRef}
        />
      )}
    </div>
  );
}

function RootLayout() {
  return (
    <div className="relative min-h-screen" style={{ background: '#0a0806' }}>
      <AppRoot />
      <AchievementToast />
    </div>
  );
}

const router = createBrowserRouter([
  { path: '/', element: <RootLayout /> },
  { path: '*', element: <Navigate to="/" replace /> },
], { basename: '/useless' });

export default function App() {
  return <RouterProvider router={router} />;
}
