import React, { useState } from 'react';

type Zones = { upperLeft: number; upperRight: number; lowerLeft: number; lowerRight: number; front: number; tongue: number };
type ZoneKey = keyof Zones;

export const VirtualToothBrushing: React.FC<{ onComplete: () => void; onClose: () => void }> = ({ onComplete, onClose }) => {
  const [zones, setZones] = useState<Zones>({ upperLeft: 0, upperRight: 0, lowerLeft: 0, lowerRight: 0, front: 0, tongue: 0 });
  const [activeZone, setActiveZone] = useState<ZoneKey | null>(null);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [aggro, setAggro] = useState(false);

  const handleBrush = (zoneOverride?: ZoneKey) => {
    const targetZone = zoneOverride || activeZone;
    if (!targetZone) return;

    const now = Date.now();
    if (now - lastClickTime < 80) {
      setAggro(true);
      setTimeout(() => setAggro(false), 2000);
    }
    setLastClickTime(now);

    setZones(prev => ({
      ...prev,
      [targetZone]: Math.min(100, prev[targetZone] + 6)
    }));
    setActiveZone(targetZone);
  };

  const getBgColor = (val: number) => {
    if (val === 0) return '#d1d5db'; // gray-300
    if (val < 100) return '#f5d76e'; // amber
    return '#ffffff'; // white
  };

  const values = Object.values(zones);
  const average = Math.floor(values.reduce((a, b) => a + b, 0) / values.length);
  const isDone = average >= 80;

  const renderZone = (key: ZoneKey, label: string) => (
    <button
      onClick={() => handleBrush(key)}
      className={`h-16 flex flex-col items-center justify-center rounded-lg border-2 transition-colors ${activeZone === key ? 'border-[#e8a855]' : 'border-gray-400'}`}
      style={{ backgroundColor: getBgColor(zones[key]) }}
    >
      <span className="text-xs font-bold text-gray-800">{label}</span>
      <span className="text-xs text-gray-600">{zones[key]}%</span>
    </button>
  );

  return (
    <div className="cream-surface p-6 text-[#2a1f0f] relative max-w-sm mx-auto rounded-lg shadow-md bg-[#fdfbf7]">
      <button onClick={onClose} className="absolute top-2 right-2 text-sm text-gray-500 hover:text-gray-800">Close</button>
      <h2 className="text-xl font-bold mb-4 text-center">Virtual Tooth Brushing</h2>

      <div className="mb-4 text-center h-6">
        {aggro && <span className="text-red-500 text-sm font-bold">Easy. They're teeth, not tiles.</span>}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6 bg-pink-200 p-4 rounded-3xl border-4 border-pink-300">
        {renderZone('upperLeft', 'U-Left')}
        {renderZone('front', 'Front')}
        {renderZone('upperRight', 'U-Right')}
        
        {renderZone('lowerLeft', 'L-Left')}
        {renderZone('tongue', 'Tongue')}
        {renderZone('lowerRight', 'L-Right')}
      </div>

      <div className="mb-6 flex flex-col items-center">
        <div className="w-full bg-gray-200 h-4 rounded mb-2 overflow-hidden border border-gray-300">
          <div className="bg-blue-400 h-full transition-all" style={{ width: `${average}%` }} />
        </div>
        <p className="font-bold">BRUSHING: {average}%</p>
      </div>

      <div className="flex flex-col space-y-4">
        {isDone && (
          <p className="text-green-600 font-semibold text-center text-sm">
            Congratulations. Your virtual teeth are cleaner than your real ones.
          </p>
        )}
        <button
          onClick={() => handleBrush()}
          disabled={!activeZone}
          className={`py-3 rounded font-bold text-lg transition-colors ${activeZone ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
        >
          Brush!
        </button>

        {isDone && (
          <button onClick={onComplete} className="py-2 bg-[#e8a855] text-white rounded font-bold hover:bg-[#d89845]">
            Finish
          </button>
        )}
      </div>
    </div>
  );
};

export default VirtualToothBrushing;
