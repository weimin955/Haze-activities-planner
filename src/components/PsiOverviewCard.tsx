import React from 'react';
import {
  Heart,
  Baby,
  UserCheck,
  AlertCircle,
  Clock,
  Compass,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import { RegionId, PsiAdvisory, PsiApiResponse } from '../types/haze';

interface PsiOverviewCardProps {
  data: PsiApiResponse;
  selectedRegion: RegionId;
  onSelectRegion: (region: RegionId) => void;
}

export const PsiOverviewCard: React.FC<PsiOverviewCardProps> = ({
  data,
  selectedRegion,
  onSelectRegion,
}) => {
  const currentPsi =
    data.psiByRegion[selectedRegion] ??
    data.psiByRegion['national'] ??
    0;

  const currentPm25 =
    selectedRegion !== 'national'
      ? data.pm25ByRegion[selectedRegion]
      : Math.round(
          Object.values(data.pm25ByRegion).reduce((acc, v) => acc + v, 0) /
            Object.values(data.pm25ByRegion).length
        );

  const currentPm10 =
    selectedRegion !== 'national'
      ? data.pm10ByRegion[selectedRegion]
      : Math.round(
          Object.values(data.pm10ByRegion).reduce((acc, v) => acc + v, 0) /
            Object.values(data.pm10ByRegion).length
        );

  // Determine advisory for selected region PSI
  const getAdvisoryForPsi = (psi: number): PsiAdvisory => {
    if (psi <= 50) {
      return {
        band: 'Good',
        color: 'emerald',
        badgeText: 'Good (0 - 50)',
        general: 'Normal outdoor activities can be carried out safely by everyone.',
        vulnerable: 'Safe for children, pregnant women, and senior citizens outdoors.',
        unwell: 'Safe for individuals with asthma or heart conditions to enjoy outdoor sights.',
        outdoorRisk: 'Minimal Risk',
      };
    }
    if (psi <= 100) {
      return {
        band: 'Moderate',
        color: 'blue',
        badgeText: 'Moderate (51 - 100)',
        general: 'Normal outdoor activities can be carried out.',
        vulnerable: 'Normal activities. Sensitive individuals should observe respiratory symptoms.',
        unwell: 'Monitor breathing symptoms. Take frequent breaks in air-conditioned spaces.',
        outdoorRisk: 'Low to Moderate Risk',
      };
    }
    if (psi <= 200) {
      return {
        band: 'Unhealthy',
        color: 'amber',
        badgeText: 'Unhealthy (101 - 200)',
        general: 'Reduce prolonged or strenuous outdoor physical exertion (e.g. jogging, cycling).',
        vulnerable: 'Elderly, pregnant women, and young children should minimize outdoor exertion.',
        unwell: 'Avoid outdoor exertion. Stay in sheltered, air-filtered indoor environments.',
        outdoorRisk: 'Elevated Risk — Seek indoor venues',
      };
    }
    if (psi <= 300) {
      return {
        band: 'Very Unhealthy',
        color: 'orange',
        badgeText: 'Very Unhealthy (201 - 300)',
        general: 'Avoid prolonged or strenuous outdoor activities. Stay indoors when possible.',
        vulnerable: 'Avoid all outdoor activity. Keep windows closed and run air filters.',
        unwell: 'Avoid all outdoor activities. Seek immediate medical advice if breathing difficulties arise.',
        outdoorRisk: 'High Risk — Strictly indoor activities',
      };
    }
    return {
      band: 'Hazardous',
      color: 'red',
      badgeText: 'Hazardous (Above 300)',
      general: 'Minimize all outdoor activities. Wear certified N95 respirators if stepping outside.',
      vulnerable: 'Stay indoors with air conditioning and HEPA filtration. Keep medication close.',
      unwell: 'Emergency air hazard. Seek medical care immediately if chest pain or shortness of breath occurs.',
      outdoorRisk: 'Severe Hazard — Hazardous air quality across Singapore',
    };
  };

  const advisory = getAdvisoryForPsi(currentPsi);

  const regionNames: Record<RegionId, string> = {
    national: 'All Singapore (Overall)',
    central: 'Central Singapore',
    south: 'South (Sentosa & Habourfront)',
    east: 'East (Changi & Tampines)',
    west: 'West (Jurong & Clementi)',
    north: 'North (Woodlands & Yishun)',
  };

  const colorConfig = {
    emerald: {
      bg: 'bg-emerald-500',
      lightBg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      pill: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      bar: 'bg-emerald-500',
    },
    blue: {
      bg: 'bg-sky-500',
      lightBg: 'bg-sky-50',
      border: 'border-sky-200',
      text: 'text-sky-800',
      pill: 'bg-sky-100 text-sky-800 border-sky-300',
      bar: 'bg-sky-500',
    },
    amber: {
      bg: 'bg-amber-500',
      lightBg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-900',
      pill: 'bg-amber-100 text-amber-900 border-amber-300',
      bar: 'bg-amber-500',
    },
    orange: {
      bg: 'bg-orange-500',
      lightBg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-900',
      pill: 'bg-orange-100 text-orange-900 border-orange-300',
      bar: 'bg-orange-500',
    },
    red: {
      bg: 'bg-rose-600',
      lightBg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-900',
      pill: 'bg-rose-100 text-rose-900 border-rose-300',
      bar: 'bg-rose-600',
    },
  }[advisory.color];

  // Helper for percentage progress on 0 - 350 scale
  const gaugePercent = Math.min(Math.round((currentPsi / 320) * 100), 100);

  const formattedTimestamp = React.useMemo(() => {
    try {
      const d = new Date(data.timestamp);
      return d.toLocaleTimeString('en-SG', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Singapore',
      });
    } catch {
      return data.timestamp;
    }
  }, [data.timestamp]);

  return (
    <div className="space-y-6">
      {/* Main Hero Status Banner */}
      <div className={`rounded-3xl border ${colorConfig.border} ${colorConfig.lightBg} p-5 sm:p-7 shadow-sm transition-all`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Region title & big PSI meter */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/80 text-slate-700 shadow-2xs border border-slate-200/80">
                <Compass className="w-3.5 h-3.5 text-sky-600" />
                {regionNames[selectedRegion]}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${colorConfig.pill}`}>
                {advisory.badgeText}
              </span>
              <span className="inline-flex items-center gap-1 text-slate-500 text-xs ml-auto sm:ml-0 font-medium">
                <Clock className="w-3.5 h-3.5" /> Readings as of {formattedTimestamp} SGT
              </span>
            </div>

            <div className="flex items-baseline gap-4 pt-1">
              <div className="text-5xl sm:text-7xl font-black tracking-tight text-slate-900 font-mono">
                {currentPsi}
              </div>
              <div className="space-y-0.5">
                <div className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wide">
                  24-Hour PSI Level
                </div>
                <div className="text-xs text-slate-600">
                  Outdoor Risk: <span className="font-semibold text-slate-800">{advisory.outdoorRisk}</span>
                </div>
              </div>
            </div>

            {/* Scale Gauge Bar */}
            <div className="pt-2 max-w-xl">
              <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex shadow-inner">
                <div
                  className={`h-full ${colorConfig.bar} transition-all duration-700 ease-out`}
                  style={{ width: `${Math.max(gaugePercent, 4)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-medium pt-1 px-0.5">
                <span>0 (Good)</span>
                <span>50</span>
                <span>100 (Moderate)</span>
                <span>200 (Unhealthy)</span>
                <span>300+ (Hazardous)</span>
              </div>
            </div>
          </div>

          {/* Right: Sub-indices for PM2.5 and PM10 */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 shrink-0 bg-white/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                PM2.5 (24-Hr)
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                {currentPm25}{' '}
                <span className="text-xs font-normal text-slate-500 font-sans">µg/m³</span>
              </div>
              <p className="text-[11px] text-slate-500">Fine Respirable Particles</p>
            </div>
            <div className="space-y-1 border-l border-slate-200 pl-4">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                PM10 (24-Hr)
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                {currentPm10}{' '}
                <span className="text-xs font-normal text-slate-500 font-sans">µg/m³</span>
              </div>
              <p className="text-[11px] text-slate-500">Inhalable Coarse Dust</p>
            </div>
          </div>
        </div>
      </div>

      {/* Regional Quick Switch Cards (Tap to switch) */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            Regional Breakdown across Singapore
          </h3>
          <span className="text-xs text-slate-400">Tap any region to focus</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {(['national', 'central', 'east', 'south', 'west', 'north'] as RegionId[]).map((reg) => {
            const isSelected = selectedRegion === reg;
            const psiVal = data.psiByRegion[reg] ?? 0;
            const regAdvisory = getAdvisoryForPsi(psiVal);

            const badgeBg = {
              emerald: 'bg-emerald-500 text-white',
              blue: 'bg-sky-500 text-white',
              amber: 'bg-amber-500 text-white',
              orange: 'bg-orange-500 text-white',
              red: 'bg-rose-600 text-white',
            }[regAdvisory.color];

            return (
              <button
                key={reg}
                onClick={() => onSelectRegion(reg)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/20'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-bold capitalize ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                    {reg}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${badgeBg}`}>
                    {regAdvisory.band}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono tracking-tight">
                    {psiVal}
                  </span>
                  <span className={`text-[10px] uppercase font-semibold ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                    PSI
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Clear Health Advisories (Sub-Goal 1: Clear Health Advisories) */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-sky-600" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            NEA Official Health Advisories for Current Air Quality
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Healthy Individuals */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Healthy Persons</h4>
                <p className="text-[11px] text-slate-500">General Public & Tourists</p>
              </div>
            </div>
            <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">
              {advisory.general}
            </p>
            {currentPsi > 100 && (
              <div className="mt-3 text-[11px] font-medium text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                Tip: Choose cooled indoor attractions or sheltered dining halls.
              </div>
            )}
          </div>

          {/* Card 2: Sensitive Groups */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="p-2 bg-sky-100 rounded-xl text-sky-700">
                <Baby className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Sensitive Groups</h4>
                <p className="text-[11px] text-slate-500">Elderly, Children, Pregnant</p>
              </div>
            </div>
            <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">
              {advisory.vulnerable}
            </p>
            {currentPsi > 100 && (
              <div className="mt-3 text-[11px] font-medium text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                Tip: Keep children in air-conditioned play centers or museums.
              </div>
            )}
          </div>

          {/* Card 3: Individuals with chronic lung or heart disease */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="p-2 bg-rose-100 rounded-xl text-rose-700">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Chronic Lung / Heart</h4>
                <p className="text-[11px] text-slate-500">Asthma, COPD & Cardiac Patients</p>
              </div>
            </div>
            <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">
              {advisory.unwell}
            </p>
            <div className="mt-3 text-[11px] font-medium text-rose-800 bg-rose-50 p-2 rounded-lg border border-rose-200 flex items-center justify-between">
              <span>Carry prescribed inhalers at all times.</span>
              <a
                href="#clinics-section"
                className="inline-flex items-center gap-0.5 underline font-semibold text-rose-900 hover:text-rose-950"
              >
                Clinics <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
