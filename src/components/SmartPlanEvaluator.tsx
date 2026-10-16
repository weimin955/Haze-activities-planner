import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarPlus,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CloudRain,
  Sun,
  CloudLightning,
  Sparkles,
  ArrowRight,
  Check,
  Trash2,
  MapPin,
  Clock,
  Compass,
  Wind,
  Activity,
  Layers,
  Tag,
  ChevronDown,
} from 'lucide-react';
import {
  RegionId,
  PsiApiResponse,
  WeatherData,
  UserPlan,
  PlanEvaluation,
  ActivityIntensity,
  Venue,
  FamilyProfile,
} from '../types/haze';
import { VENUES_DATA } from '../data/venues';

interface SmartPlanEvaluatorProps {
  psiData: PsiApiResponse;
  weatherData?: WeatherData | null;
  familyProfile: FamilyProfile;
  selectedRegion: RegionId;
}

const POPULAR_SPOTS = [
  { name: 'Gardens by the Bay (Outdoor Supertrees & Skyway)', region: 'central' as RegionId, type: 'outdoor_leisure' as ActivityIntensity },
  { name: 'Sentosa Island (Siloso Beach & Palawan)', region: 'south' as RegionId, type: 'outdoor_strenuous' as ActivityIntensity },
  { name: 'Marina Bay Waterfront Promenade (Jogging Track)', region: 'central' as RegionId, type: 'outdoor_strenuous' as ActivityIntensity },
  { name: 'Singapore Zoo & Mandai Rainforest Trek', region: 'north' as RegionId, type: 'outdoor_leisure' as ActivityIntensity },
  { name: 'East Coast Park (Cycling & Rollerblading)', region: 'east' as RegionId, type: 'outdoor_strenuous' as ActivityIntensity },
  { name: 'MacRitchie Reservoir Treetop Walk', region: 'central' as RegionId, type: 'outdoor_strenuous' as ActivityIntensity },
  { name: 'Chinatown & Bugis Street Open-Air Food Walking Tour', region: 'central' as RegionId, type: 'outdoor_leisure' as ActivityIntensity },
  { name: 'Jurong Lake Gardens Playgrounds', region: 'west' as RegionId, type: 'outdoor_leisure' as ActivityIntensity },
];

export const SmartPlanEvaluator: React.FC<SmartPlanEvaluatorProps> = ({
  psiData,
  weatherData,
  familyProfile,
  selectedRegion,
}) => {
  // Plan input form state
  const [title, setTitle] = useState('');
  const [locationName, setLocationName] = useState('');
  const [region, setRegion] = useState<RegionId>(selectedRegion !== 'national' ? selectedRegion : 'central');
  const [activityType, setActivityType] = useState<ActivityIntensity>('outdoor_leisure');
  const [timeSlot, setTimeSlot] = useState<'Morning' | 'Afternoon' | 'Evening' | 'Full Day'>('Afternoon');
  const [activeEvaluation, setActiveEvaluation] = useState<PlanEvaluation | null>(null);

  // Saved user plans in localStorage
  const [savedPlans, setSavedPlans] = useState<UserPlan[]>(() => {
    try {
      const saved = localStorage.getItem('smart_haze_user_plans');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    // Default starter plan showing the evaluation capability
    return [
      {
        id: 'plan-default-1',
        title: 'Supertree Grove Sunset Walk & Skyway',
        locationName: 'Gardens by the Bay (Supertree Grove)',
        region: 'central',
        activityType: 'outdoor_leisure',
        timeSlot: 'Evening',
        date: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
      },
    ];
  });

  // Sync region if changed externally
  useEffect(() => {
    if (selectedRegion !== 'national') {
      setRegion(selectedRegion);
    }
  }, [selectedRegion]);

  // Persist saved plans
  useEffect(() => {
    try {
      localStorage.setItem('smart_haze_user_plans', JSON.stringify(savedPlans));
    } catch {
      // ignore
    }
  }, [savedPlans]);

  // Handle Preset selection
  const handleSelectPreset = (spot: typeof POPULAR_SPOTS[0]) => {
    setLocationName(spot.name);
    setTitle(spot.name.split('(')[0].trim());
    setRegion(spot.region);
    setActivityType(spot.type);
  };

  /**
   * Evaluate whether plan is safe based on real-time PSI, PM2.5, weather forecast & family sensitivity
   */
  const evaluatePlan = (
    targetRegion: RegionId,
    type: ActivityIntensity,
    locName: string
  ): PlanEvaluation => {
    const regKey = targetRegion === 'national' ? 'central' : targetRegion;
    const psiVal = psiData.psiByRegion[regKey] ?? psiData.psiByRegion['national'] ?? 0;
    const pm25Val = psiData.pm25ByRegion[regKey] ?? 0;
    const forecast = weatherData?.regionalForecasts[regKey]?.text || weatherData?.general?.forecastText || 'Cloudy';
    const tempLow = weatherData?.general?.temperature?.low ?? 25;
    const tempHigh = weatherData?.general?.temperature?.high ?? 33;
    const tempStr = `${tempLow}°C - ${tempHigh}°C`;

    const isWeatherSevere =
      forecast.toLowerCase().includes('thunder') ||
      forecast.toLowerCase().includes('heavy rain') ||
      forecast.toLowerCase().includes('squall');

    const hasVulnerableMembers =
      familyProfile.hasChildren || familyProfile.hasElderly || familyProfile.hasAsthmaOrHeart;
    const threshold = familyProfile.alertPsiThreshold || 100;

    let status: 'safe' | 'caution' | 'unsafe' = 'safe';
    let verdictTitle = 'Safe to Proceed';
    let hazeRiskLevel: 'Minimal' | 'Elevated' | 'High' | 'Severe' = 'Minimal';
    let summary = '';
    let suggestedAction = '';

    // If completely indoor:
    if (type === 'indoor') {
      status = 'safe';
      verdictTitle = 'Plan is 100% Safe (Protected Indoor Refuge)';
      hazeRiskLevel = 'Minimal';
      summary = `Your destination operates inside a climate-controlled building with air filtration. You are shielded from outdoor particulate smoke (${psiVal} PSI) and ${forecast.toLowerCase()}.`;
      suggestedAction = 'Proceed as planned! Enjoy the air-conditioned facilities.';
    } else if (type === 'sheltered') {
      if (psiVal > 150) {
        status = 'unsafe';
        verdictTitle = 'High Haze Risk: Semi-Sheltered Exposure';
        hazeRiskLevel = 'High';
        summary = `Even under sheltered pavilions, ambient airflow carries hazardous PM2.5 particulates (${pm25Val} µg/m³). Inhalable smoke permeates semi-open structures.`;
        suggestedAction = 'Move to a fully sealed, HEPA-filtered indoor attraction or food hall.';
      } else if (psiVal > 80 || isWeatherSevere) {
        status = 'caution';
        verdictTitle = 'Proceed with Caution: Monitor Haze & Wind';
        hazeRiskLevel = 'Elevated';
        summary = `Sheltered structures protect against rain (${forecast}) but air particulate levels (${psiVal} PSI) remain elevated.`;
        suggestedAction = 'Wear certified masks if sensitive and avoid staying near perimeter openings.';
      } else {
        status = 'safe';
        verdictTitle = 'Safe to Proceed under Shelter';
        hazeRiskLevel = 'Minimal';
        summary = `Sheltered plan provides adequate protection given current moderate air readings (${psiVal} PSI).`;
        suggestedAction = 'Proceed as planned.';
      }
    } else {
      // Outdoor activities (strenuous or leisure)
      if (psiVal > 150 || (hasVulnerableMembers && psiVal >= threshold) || (type === 'outdoor_strenuous' && psiVal > 100)) {
        status = 'unsafe';
        verdictTitle = 'UNSAFE TO PROCEED (High Haze Danger)';
        hazeRiskLevel = psiVal > 200 ? 'Severe' : 'High';
        summary = `Current ${regKey.toUpperCase()} PSI is ${psiVal} (PM2.5: ${pm25Val} µg/m³) with ${forecast}. Heavy physical exertion pulls toxic ultrafine particles deep into lungs, triggering acute respiratory inflammation${
          hasVulnerableMembers ? ' (high danger for children / elderly)' : ''
        }.`;
        suggestedAction = 'Cancel outdoor activity immediately and switch to a climate-controlled indoor venue.';
      } else if (psiVal > 100 || isWeatherSevere) {
        status = 'caution';
        verdictTitle = 'PROCEED WITH CAUTION (Elevated Air Risk)';
        hazeRiskLevel = 'Elevated';
        summary = `Air quality is entering Unhealthy levels (${psiVal} PSI) combined with ${forecast}. Prolonged exposure is not recommended.`;
        suggestedAction = 'Reduce duration to under 30 minutes, wear an N95 mask, and take frequent indoor breaks.';
      } else {
        status = 'safe';
        verdictTitle = 'SAFE TO PROCEED';
        hazeRiskLevel = 'Minimal';
        summary = `Air quality in ${regKey.toUpperCase()} is within acceptable bands (${psiVal} PSI) and weather is ${forecast}.`;
        suggestedAction = 'Enjoy your outdoor excursion! Keep hydrated in the tropical climate.';
      }
    }

    // Curate matching indoor alternatives in the same or nearby region
    const recommendedAlternatives = VENUES_DATA.filter(
      (v) => (v.region === regKey || v.region === 'central') && v.category !== 'health'
    ).slice(0, 3);

    return {
      status,
      verdictTitle,
      summary,
      hazeRiskLevel,
      weatherCondition: forecast,
      psiScore: psiVal,
      pm25Score: pm25Val,
      temperature: tempStr,
      suggestedAction,
      recommendedAlternatives,
    };
  };

  // Evaluate current form input
  const handleCheckCurrentPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationName.trim()) return;

    const evaluation = evaluatePlan(region, activityType, locationName);
    setActiveEvaluation(evaluation);
  };

  // Save current evaluated plan to list
  const handleSavePlan = () => {
    if (!locationName.trim()) return;
    const evaluation = activeEvaluation || evaluatePlan(region, activityType, locationName);

    const newPlan: UserPlan = {
      id: `plan-${Date.now()}`,
      title: title.trim() || locationName.trim(),
      locationName: locationName.trim(),
      region,
      activityType,
      timeSlot,
      date: new Date().toISOString().slice(0, 10),
      evaluation,
      createdAt: new Date().toISOString(),
    };

    setSavedPlans([newPlan, ...savedPlans]);
    // Reset form
    setTitle('');
    setLocationName('');
    setActiveEvaluation(null);
  };

  // 1-Click Swap Action: Replace an unsafe plan with a vetted indoor alternative
  const handleSwapPlan = (planId: string, venue: Venue) => {
    setSavedPlans((prev) =>
      prev.map((plan) => {
        if (plan.id === planId) {
          const newEvaluation = evaluatePlan(venue.region, 'indoor', venue.name);
          return {
            ...plan,
            title: `Safe Refuge: ${venue.name}`,
            locationName: venue.name,
            region: venue.region,
            activityType: 'indoor',
            swappedAlternativeId: venue.id,
            evaluation: newEvaluation,
          };
        }
        return plan;
      })
    );
  };

  const handleDeletePlan = (planId: string) => {
    setSavedPlans((prev) => prev.filter((p) => p.id !== planId));
  };

  // Weather icon helper
  const getWeatherIcon = (text: string) => {
    const t = text.toLowerCase();
    if (t.includes('thunder') || t.includes('lightning')) {
      return <CloudLightning className="w-5 h-5 text-amber-500" />;
    }
    if (t.includes('rain') || t.includes('shower')) {
      return <CloudRain className="w-5 h-5 text-sky-500" />;
    }
    return <Sun className="w-5 h-5 text-amber-400" />;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-sky-600 to-teal-500 text-white rounded-xl shadow-xs">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Itinerary Safety & Weather Evaluator
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Input where you plan to go. We analyze live <strong>NEA Haze Levels (PSI & PM2.5)</strong> and <strong>24-Hour Weather Forecasts</strong> to determine if your activity is safe, providing instant indoor substitutions if disrupted.
          </p>
        </div>

        {/* Live Weather Forecast Summary Pill */}
        {weatherData && (
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 shrink-0 shadow-2xs">
            {getWeatherIcon(weatherData.general.forecastText)}
            <div>
              <div className="text-xs font-bold flex items-center gap-1">
                {weatherData.general.forecastText}
                <span className="text-[10px] text-sky-600 font-mono font-normal">
                  ({weatherData.general.temperature.low}°C - {weatherData.general.temperature.high}°C)
                </span>
              </div>
              <div className="text-[10px] text-sky-700">
                Humidity: {weatherData.general.humidity.high}% • NEA Singapore
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Plan Input Form & Presets */}
      <form onSubmit={handleCheckCurrentPlan} className="space-y-4">
        {/* Popular Presets Quick Selector */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Popular Outdoor Tourist Spots (Tap to auto-fill):
          </span>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
            {POPULAR_SPOTS.map((spot, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(spot)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium shrink-0 transition-colors cursor-pointer text-left"
              >
                {spot.name.split('(')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
          {/* Destination / Location Name */}
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-sky-600" /> Planned Location / Destination:
            </label>
            <input
              type="text"
              required
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Marina Bay Sands Skyway, Siloso Beach Sentosa..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          {/* Region */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-sky-600" /> Singapore Region:
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value as RegionId)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium cursor-pointer"
            >
              <option value="central">Central (Marina Bay, Orchard, CBD)</option>
              <option value="south">South (Sentosa, HarbourFront)</option>
              <option value="east">East (Changi, Tampines, East Coast)</option>
              <option value="west">West (Jurong, Clementi)</option>
              <option value="north">North (Woodlands, Mandai)</option>
            </select>
          </div>

          {/* Activity Exposure Type */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-sky-600" /> Activity Exposure:
            </label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value as ActivityIntensity)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium cursor-pointer"
            >
              <option value="outdoor_strenuous">🏃 Outdoor Strenuous (Running, Cycling)</option>
              <option value="outdoor_leisure">🚶 Outdoor Leisure (Walking, Sightseeing)</option>
              <option value="sheltered">☂️ Sheltered / Semi-open Pavilion</option>
              <option value="indoor">🏛️ Indoor Climate-Controlled</option>
            </select>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-sky-400" />
            Check Plan Safety & Weather
          </button>
          {locationName && (
            <button
              type="button"
              onClick={() => {
                setLocationName('');
                setTitle('');
                setActiveEvaluation(null);
              }}
              className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </form>

      {/* Immediate Evaluation Result Box */}
      {activeEvaluation && (
        <div
          className={`rounded-2xl border p-5 transition-all space-y-4 animate-in fade-in duration-200 ${
            activeEvaluation.status === 'unsafe'
              ? 'bg-rose-50/90 border-rose-200'
              : activeEvaluation.status === 'caution'
              ? 'bg-amber-50/90 border-amber-200'
              : 'bg-emerald-50/90 border-emerald-200'
          }`}
        >
          {/* Verdict Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/10 pb-3">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl text-white shadow-xs ${
                  activeEvaluation.status === 'unsafe'
                    ? 'bg-rose-600'
                    : activeEvaluation.status === 'caution'
                    ? 'bg-amber-600'
                    : 'bg-emerald-600'
                }`}
              >
                {activeEvaluation.status === 'unsafe' ? (
                  <ShieldAlert className="w-6 h-6" />
                ) : activeEvaluation.status === 'caution' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <ShieldCheck className="w-6 h-6" />
                )}
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/70">
                  {activeEvaluation.status.toUpperCase()} STATUS
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                  {activeEvaluation.verdictTitle}
                </h3>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3 text-xs font-mono font-bold">
              <span className="bg-white/80 px-2.5 py-1 rounded-lg border border-black/5">
                PSI: {activeEvaluation.psiScore}
              </span>
              <span className="bg-white/80 px-2.5 py-1 rounded-lg border border-black/5">
                PM2.5: {activeEvaluation.pm25Score} µg/m³
              </span>
              <span className="bg-white/80 px-2.5 py-1 rounded-lg border border-black/5">
                {activeEvaluation.weatherCondition}
              </span>
            </div>
          </div>

          {/* Description & Action Advice */}
          <div className="space-y-1 text-xs sm:text-sm text-slate-800 leading-relaxed">
            <p className="font-medium">{activeEvaluation.summary}</p>
            <p className="font-bold text-slate-900 flex items-center gap-1.5 pt-1">
              <span className="text-sky-700">Recommended Action:</span> {activeEvaluation.suggestedAction}
            </p>
          </div>

          {/* If Unsafe or Caution: Show Vetted Indoor Substitutions with 1-Click Swap */}
          {activeEvaluation.status !== 'safe' && activeEvaluation.recommendedAlternatives.length > 0 && (
            <div className="pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                Safe Indoor Alternatives in {region.toUpperCase()}:
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {activeEvaluation.recommendedAlternatives.map((alt) => (
                  <div
                    key={alt.id}
                    className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-sm">
                        {alt.filtrationType}
                      </span>
                      <h5 className="font-bold text-slate-900 text-xs sm:text-sm mt-1 leading-snug">
                        {alt.name}
                      </h5>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {alt.description}
                      </p>
                      <div className="text-[10px] text-slate-400 mt-1.5">
                        🚇 {alt.nearestMrt}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      {alt.partnerDiscount && (
                        <span className="text-[10px] font-bold text-amber-800 truncate max-w-[120px]">
                          {alt.partnerDiscount}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setLocationName(alt.name);
                          setTitle(`Safe Refuge: ${alt.name}`);
                          setActivityType('indoor');
                          setRegion(alt.region);
                          const newEval = evaluatePlan(alt.region, 'indoor', alt.name);
                          setActiveEvaluation(newEval);
                        }}
                        className="text-xs font-bold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1 cursor-pointer ml-auto"
                      >
                        Swap Plan <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save to Itinerary Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleSavePlan}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              Save to My Itinerary
            </button>
          </div>
        </div>
      )}

      {/* Saved Itinerary Plans List */}
      {savedPlans.length > 0 && (
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              My Trip Plans & Live Safety Status ({savedPlans.length})
            </h3>
            <span className="text-[11px] text-slate-400">Status updates live with NEA PSI & Weather</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {savedPlans.map((plan) => {
              // Re-evaluate live
              const liveEval = evaluatePlan(plan.region, plan.activityType, plan.locationName);
              const isSafe = liveEval.status === 'safe';
              const isCaution = liveEval.status === 'caution';

              return (
                <div
                  key={plan.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    isSafe
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : isCaution
                      ? 'bg-amber-50/40 border-amber-200'
                      : 'bg-rose-50/50 border-rose-200'
                  }`}
                >
                  <div>
                    {/* Top Status & Region */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isSafe
                            ? 'bg-emerald-600 text-white'
                            : isCaution
                            ? 'bg-amber-600 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {isSafe ? '✓ Safe to Proceed' : isCaution ? '⚠ Caution Advised' : '✕ Unsafe (Haze Danger)'}
                      </span>
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Remove Plan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {plan.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                      <span className="capitalize">📍 {plan.region} Region</span>
                      <span>•</span>
                      <span>🕒 {plan.timeSlot}</span>
                      <span>•</span>
                      <span className="font-mono text-[11px]">PSI {liveEval.psiScore}</span>
                      <span>•</span>
                      <span className="text-[11px]">{liveEval.weatherCondition}</span>
                    </div>

                    <p className="text-xs text-slate-700 mt-2 leading-relaxed bg-white/70 p-2 rounded-xl border border-slate-200/60">
                      {liveEval.summary}
                    </p>
                  </div>

                  {/* If not safe, offer quick 1-click alternatives */}
                  {!isSafe && liveEval.recommendedAlternatives.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-200/60 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">
                        Recommended Indoor Swaps:
                      </span>
                      {liveEval.recommendedAlternatives.slice(0, 2).map((alt) => (
                        <div
                          key={alt.id}
                          className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 text-xs"
                        >
                          <span className="font-bold text-slate-800 truncate pr-2">
                            {alt.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSwapPlan(plan.id, alt)}
                            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-md shrink-0 cursor-pointer"
                          >
                            Swap to This
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
