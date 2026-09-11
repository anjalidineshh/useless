import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import LandingPage from './pages/LandingPage';
import ApartmentPage from './pages/ApartmentPage';
import FinalScreen from './pages/FinalScreen';
import AchievementsPanel from './components/AchievementsPanel';
import RandomEvents from './components/RandomEvents';
import AchievementToast from './components/AchievementToast';
import { useGameStore } from './store/gameStore';
import './index.css';

function RootLayout() {
  const { showAchievements, setShowAchievements } = useGameStore();
  return (
    <div className="relative min-h-screen" style={{ background: '#1a1410' }}>
      <Outlet />
      <AnimatePresence>
        {showAchievements && (
          <AchievementsPanel onClose={() => setShowAchievements(false)} />
        )}
      </AnimatePresence>
      <AchievementToast />
      <RandomEvents />
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'apartment', element: <ApartmentPage /> },
      { path: 'done', element: <FinalScreen /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
], { basename: '/useless' });

export default function App() {
  return <RouterProvider router={router} />;
}
