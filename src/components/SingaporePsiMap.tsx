import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { RegionId, PsiApiResponse } from '../types/haze';

interface SingaporePsiMapProps {
  data: PsiApiResponse;
  selectedRegion: RegionId;
  onSelectRegion: (region: RegionId) => void;
}

export const SingaporePsiMap: React.FC<SingaporePsiMapProps> = ({
  data,
  selectedRegion,
  onSelectRegion,
}) => {
  const getBadgeColor = (psi: number) => {
    if (psi <= 50) return 'bg-emerald-500 text-white border-emerald-600';
    if (psi <= 100) return 'bg-sky-500 text-white border-sky-600';
    if (psi <= 200) return 'bg-amber-500 text-white border-amber-600';
    if (psi <= 300) return 'bg-orange-500 text-white border-orange-600';
    return 'bg-rose-600 text-white border-rose-700';
  };

  const getRegionName = (reg: RegionId) => {
    switch (reg) {
      case 'central':
        return 'Central (Marina / Orchard)';
      case 'east':
        return 'East (Changi / Tampines)';
      case 'north':
        return 'North (Woodlands / Sembawang)';
      case 'south':
        return 'South (Sentosa / HarbourFront)';
      case 'west':
        return 'West (Jurong / Clementi)';
      case 'national':
        return 'National';
    }
  };

  const regions: { id: RegionId; name: string; x: number; y: number }[] = [
    { id: 'north', name: 'North', x: 50, y: 18 },
    { id: 'west', name: 'West', x: 22, y: 52 },
    { id: 'central', name: 'Central', x: 50, y: 52 },
    { id: 'east', name: 'East', x: 80, y: 50 },
    { id: 'south', name: 'South', x: 50, y: 84 },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-sky-600" />
            Interactive Regional Map of Singapore
          </h3>
          <p className="text-xs text-slate-500">
            Click any region to see localized PSI readings and nearby indoor venues
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 flex-wrap text-[11px] font-medium text-slate-600">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Good (0-50)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> Mod (51-100)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Unhealthy (101-200)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Very Unhealthy
          </span>
        </div>
      </div>

      {/* SVG Stylized Singapore Map Container */}
      <div className="relative w-full h-64 sm:h-72 bg-gradient-to-b from-sky-50/50 via-slate-50/80 to-blue-50/30 rounded-2xl border border-slate-200/80 overflow-hidden flex items-center justify-center">
        {/* Subtle decorative grid lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>

        {/* Stylized Singapore Island silhouette in SVG */}
        <svg
          viewBox="0 0 500 300"
          className="w-full h-full max-w-xl object-contain opacity-40 select-none pointer-events-none"
        >
          {/* Main island path */}
          <path
            d="M 60,150 
               C 80,100 140,80 220,70 
               C 300,60 380,80 430,120 
               C 450,140 430,170 390,190 
               C 350,210 300,215 250,210 
               C 200,205 140,220 100,200 
               C 70,185 50,170 60,150 Z"
            fill="#e2e8f0"
            stroke="#94a3b8"
            strokeWidth="3"
            strokeDasharray="4 4"
          />
          {/* Sentosa island */}
          <ellipse cx="230" cy="245" rx="35" ry="12" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
          {/* Pulau Ubin & Tekong (East) */}
          <ellipse cx="420" cy="85" rx="28" ry="12" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
          {/* Strait of Johor label */}
          <text x="250" y="40" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="600" letterSpacing="2">
            STRAITS OF JOHOR (MALAYSIA)
          </text>
          {/* Singapore Strait label */}
          <text x="250" y="280" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="600" letterSpacing="2">
            SINGAPORE STRAIT
          </text>
        </svg>

        {/* Region Hotspots / Badges positioned over the map */}
        {regions.map((region) => {
          const psi = data.psiByRegion[region.id] ?? 0;
          const isSelected = selectedRegion === region.id;
          const colorClass = getBadgeColor(psi);

          return (
            <button
              key={region.id}
              onClick={() => onSelectRegion(region.id)}
              style={{
                left: `${region.x}%`,
                top: `${region.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`absolute group flex flex-col items-center transition-all cursor-pointer focus:outline-hidden ${
                isSelected ? 'scale-110 z-20' : 'hover:scale-105 z-10'
              }`}
            >
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 shadow-md font-mono font-bold text-xs sm:text-sm transition-all ${colorClass} ${
                  isSelected ? 'ring-4 ring-slate-900/30 ring-offset-2' : ''
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{region.name}</span>
                <span className="bg-white/20 px-1 rounded-sm text-xs">{psi}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-700 bg-white/90 px-1.5 py-0.5 rounded-md mt-1 shadow-2xs border border-slate-200">
                {region.name} Region
              </span>
            </button>
          );
        })}
      </div>

      {/* Map footnote */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>Selected: <strong className="text-slate-800">{getRegionName(selectedRegion)}</strong></span>
        {selectedRegion !== 'national' && (
          <button
            onClick={() => onSelectRegion('national')}
            className="text-sky-600 hover:text-sky-800 font-semibold underline cursor-pointer"
          >
            Reset to All Singapore
          </button>
        )}
      </div>
    </div>
  );
};
