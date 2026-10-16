import React from 'react';
import { Wind, ShieldCheck, RefreshCw, Users, Activity, MapPin } from 'lucide-react';
import { RegionId, PsiAdvisory } from '../types/haze';

interface NavbarProps {
  currentRegion: RegionId;
  onRegionChange: (region: RegionId) => void;
  nationalPsi?: number;
  overallAdvisory?: PsiAdvisory;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenFamilyModal: () => void;
  hasActiveFamilyThreshold: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRegion,
  onRegionChange,
  nationalPsi,
  overallAdvisory,
  isLoading,
  onRefresh,
  onOpenFamilyModal,
  hasActiveFamilyThreshold,
}) => {
  const regions: { id: RegionId; label: string }[] = [
    { id: 'national', label: 'All SG' },
    { id: 'central', label: 'Central' },
    { id: 'south', label: 'South' },
    { id: 'east', label: 'East' },
    { id: 'west', label: 'West' },
    { id: 'north', label: 'North' },
  ];

  const getPillStyle = () => {
    if (!overallAdvisory) return 'bg-slate-100 text-slate-700 border-slate-200';
    switch (overallAdvisory.band) {
      case 'Good':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Moderate':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Unhealthy':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'Very Unhealthy':
        return 'bg-orange-50 text-orange-800 border-orange-300';
      case 'Hazardous':
        return 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-sky-200">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
                  Smart Haze Monitoring
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                  <ShieldCheck className="w-3 h-3 text-sky-600" /> Singapore
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Real-time NEA air quality & safe indoor venues
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* National PSI Live Badge */}
            {nationalPsi !== undefined && (
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${getPillStyle()}`}
                title={`National 24-hr PSI: ${nationalPsi} (${overallAdvisory?.band || 'Active'})`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
                </span>
                <span className="font-mono font-bold">{nationalPsi}</span>
                <span className="hidden md:inline font-medium">PSI</span>
                <span className="hidden xs:inline-block px-1.5 py-0.2 text-[10px] uppercase font-bold rounded-md bg-white/70">
                  {overallAdvisory?.band}
                </span>
              </div>
            )}

            {/* Family Profile Trigger */}
            <button
              onClick={onOpenFamilyModal}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-colors border cursor-pointer ${
                hasActiveFamilyThreshold
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="Personalize health alert threshold for family or sensitive conditions"
            >
              <Users className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Family Filter</span>
              {hasActiveFamilyThreshold && (
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              )}
            </button>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs"
              title="Fetch latest readings from /api/psi"
            >
              <RefreshCw className={`w-4 h-4 text-sky-600 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">{isLoading ? 'Updating...' : 'Sync NEA'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Region Scroller */}
        <div className="py-2 overflow-x-auto no-scrollbar border-t border-slate-100 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-1.5 min-w-max">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-1">
              <MapPin className="w-3 h-3 text-slate-400" /> Region:
            </span>
            {regions.map((reg) => {
              const active = currentRegion === reg.id;
              return (
                <button
                  key={reg.id}
                  onClick={() => onRegionChange(reg.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {reg.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
