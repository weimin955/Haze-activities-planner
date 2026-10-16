/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { PsiOverviewCard } from './components/PsiOverviewCard';
import { SingaporePsiMap } from './components/SingaporePsiMap';
import { ItinerarySwaps } from './components/ItinerarySwaps';
import { VenueFinder } from './components/VenueFinder';
import { FamilyProfileModal } from './components/FamilyProfileModal';
import { OneMapSearchModal } from './components/OneMapSearchModal';
import { ErrorDisplay } from './components/ErrorDisplay';
import { SmartPlanEvaluator } from './components/SmartPlanEvaluator';
import { Footer } from './components/Footer';
import { RegionId, PsiApiResponse, FamilyProfile, WeatherData } from './types/haze';
import { AlertTriangle, ShieldCheck, Heart, Sparkles, Building2, Wind } from 'lucide-react';

export default function App() {
  const [data, setData] = useState<PsiApiResponse | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<RegionId>('national');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorInfo, setErrorInfo] = useState<{
    type: 'slow' | 'refused' | 'empty' | 'key_not_configured' | 'general';
    message: string;
  } | null>(null);

  // Selected venue highlighted from Itinerary Swap
  const [highlightedVenueId, setHighlightedVenueId] = useState<string | null>(null);

  // Family profile for sensitive health alerts (Freemium personalization)
  const [familyModalOpen, setFamilyModalOpen] = useState(false);
  const [oneMapModalOpen, setOneMapModalOpen] = useState(false);
  const [familyProfile, setFamilyProfile] = useState<FamilyProfile>(() => {
    try {
      const saved = localStorage.getItem('non_haze_family_profile');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore storage error
    }
    return {
      name: 'My Group',
      hasElderly: false,
      hasChildren: true,
      hasAsthmaOrHeart: false,
      alertPsiThreshold: 100,
    };
  });

  const saveFamilyProfile = (newProfile: FamilyProfile) => {
    setFamilyProfile(newProfile);
    try {
      localStorage.setItem('non_haze_family_profile', JSON.stringify(newProfile));
    } catch {
      // ignore
    }
  };

  /**
   * Fetch real-time Singapore PSI data ONLY through /api/psi as required by Sub-Goal 2.
   * If empty, slow, or refused, reports in plain words as required by Sub-Goal 3.
   * Never invents sample data.
   */
  const fetchPsiData = useCallback(async () => {
    setIsLoading(true);
    setErrorInfo(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    try {
      const res = await fetch('/api/psi', {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      clearTimeout(timeoutId);

      if (res.status === 503) {
        const errorBody = await res.json().catch(() => ({}));
        setErrorInfo({
          type: 'key_not_configured',
          message:
            errorBody.message ||
            'The National Environment Agency API key variable is empty in the server environment (key not configured).',
        });
        setData(null);
        return;
      }

      if (res.status === 504 || res.status === 408) {
        const errorBody = await res.json().catch(() => ({}));
        setErrorInfo({
          type: 'slow',
          message:
            errorBody.error ||
            'Unable to load haze data from the National Environment Agency because the service request timed out.',
        });
        setData(null);
        return;
      }

      if (res.status === 404) {
        const errorBody = await res.json().catch(() => ({}));
        setErrorInfo({
          type: 'empty',
          message:
            errorBody.error ||
            'The National Environment Agency returned empty air quality data for this hour.',
        });
        setData(null);
        return;
      }

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        setErrorInfo({
          type: 'refused',
          message:
            errorBody.error ||
            `The National Environment Agency service refused the connection with HTTP status ${res.status}.`,
        });
        setData(null);
        return;
      }

      const json: PsiApiResponse = await res.json();

      // Guard against empty readings payload
      if (!json.psiByRegion || Object.keys(json.psiByRegion).length === 0) {
        setErrorInfo({
          type: 'empty',
          message:
            'The National Environment Agency returned an empty dataset with no active regional PSI readings.',
        });
        setData(null);
        return;
      }

      setData(json);
      setErrorInfo(null);

      // Fetch live Singapore 24-hr regional weather forecast
      try {
        const weatherRes = await fetch('/api/weather');
        if (weatherRes.ok) {
          const wJson: WeatherData = await weatherRes.json();
          setWeatherData(wJson);
        }
      } catch (wErr) {
        console.warn('Weather fetch warning (non-blocking):', wErr);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setErrorInfo({
          type: 'slow',
          message:
            'Unable to load haze data from the National Environment Agency because the service request timed out. The provider took too long to respond.',
        });
      } else {
        setErrorInfo({
          type: 'refused',
          message:
            'The National Environment Agency service refused the connection or is currently unreachable from the local network.',
        });
      }
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPsiData();
  }, [fetchPsiData]);

  const handleSelectVenueFromSwap = (venueId: string) => {
    setHighlightedVenueId(venueId);
    const element = document.getElementById(`venue-${venueId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const currentPsi = data
    ? (data.psiByRegion[selectedRegion] ?? data.psiByRegion['national'] ?? 0)
    : 0;

  const isFamilyAlertTriggered =
    data !== null &&
    (familyProfile.hasElderly || familyProfile.hasChildren || familyProfile.hasAsthmaOrHeart) &&
    currentPsi >= familyProfile.alertPsiThreshold;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-sky-500 selection:text-white text-slate-900">
      {/* Top Navigation */}
      <Navbar
        currentRegion={selectedRegion}
        onRegionChange={setSelectedRegion}
        nationalPsi={data?.psiByRegion?.national}
        overallAdvisory={data?.overallAdvisory}
        isLoading={isLoading}
        onRefresh={fetchPsiData}
        onOpenFamilyModal={() => setFamilyModalOpen(true)}
        onOpenOneMapModal={() => setOneMapModalOpen(true)}
        hasActiveFamilyThreshold={
          familyProfile.hasElderly || familyProfile.hasChildren || familyProfile.hasAsthmaOrHeart
        }
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Family Health Advisory Alert Banner */}
        {isFamilyAlertTriggered && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-4 sm:p-5 shadow-sm flex items-start gap-3">
            <div className="p-2 bg-rose-600 text-white rounded-xl shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md">
                  Sensitive Group Alert
                </span>
                <span className="text-xs font-bold text-rose-900">
                  Threshold ({familyProfile.alertPsiThreshold} PSI) Exceeded
                </span>
              </div>
              <p className="text-xs sm:text-sm text-rose-900 mt-1 leading-relaxed">
                Current {selectedRegion} PSI is{' '}
                <strong className="font-mono text-base">{currentPsi}</strong>. Based on your family
                profile ({[
                  familyProfile.hasChildren ? 'Children' : null,
                  familyProfile.hasElderly ? 'Elderly' : null,
                  familyProfile.hasAsthmaOrHeart ? 'Asthma/Heart Risk' : null,
                ]
                  .filter(Boolean)
                  .join(', ')}), outdoor physical exertion should be avoided immediately. Use the indoor
                substitutions below.
              </p>
            </div>
            <button
              onClick={() => setFamilyModalOpen(true)}
              className="text-xs text-rose-800 underline font-semibold hover:text-rose-950 shrink-0 cursor-pointer"
            >
              Edit Profile
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && !data && !errorInfo && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs text-center space-y-4 animate-pulse">
            <div className="w-12 h-12 bg-sky-100 rounded-2xl mx-auto flex items-center justify-center text-sky-600">
              <Wind className="w-6 h-6 animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-800">
                Fetching Real-Time NEA Air Quality via /api/psi...
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Querying the official Singapore National Environment Agency real-time sensors across all 5 regional zones.
              </p>
            </div>
          </div>
        )}

        {/* Sub-Goal 3: Plain-Words Error Message when Empty, Slow or Refused */}
        {errorInfo && (
          <ErrorDisplay
            errorType={errorInfo.type}
            customMessage={errorInfo.message}
            onRetry={fetchPsiData}
            isRetrying={isLoading}
          />
        )}

        {/* Sub-Goal 1: Home screen with real-time regional PSI/haze & clear health advisories */}
        {data && (
          <>
            <PsiOverviewCard
              data={data}
              selectedRegion={selectedRegion}
              onSelectRegion={setSelectedRegion}
            />

            {/* Interactive Singapore Regional Map */}
            <SingaporePsiMap
              data={data}
              selectedRegion={selectedRegion}
              onSelectRegion={setSelectedRegion}
            />

            {/* Smart Itinerary Safety & Weather Evaluator */}
            <SmartPlanEvaluator
              psiData={data}
              weatherData={weatherData}
              familyProfile={familyProfile}
              selectedRegion={selectedRegion}
            />

            {/* Sub-Goal 4: Smart Itinerary Substitutions */}
            <ItinerarySwaps
              currentPsi={currentPsi}
              selectedRegion={selectedRegion}
              onSelectVenue={handleSelectVenueFromSwap}
            />

            {/* Sub-Goal 4: Complete Indoor Activity, Attractions, Dining, Entertainment, & Clinic Finder */}
            <VenueFinder
              currentPsi={currentPsi}
              selectedRegion={selectedRegion}
              highlightedVenueId={highlightedVenueId}
              onClearHighlight={() => setHighlightedVenueId(null)}
            />
          </>
        )}
      </main>

      {/* Freemium Family Profile Modal */}
      <FamilyProfileModal
        isOpen={familyModalOpen}
        onClose={() => setFamilyModalOpen(false)}
        profile={familyProfile}
        onSaveProfile={saveFamilyProfile}
      />

      {/* OneMap SG Search Modal */}
      <OneMapSearchModal
        isOpen={oneMapModalOpen}
        onClose={() => setOneMapModalOpen(false)}
      />

      {/* Sub-Goal 5: Footer crediting "Data: National Environment Agency" */}
      <Footer
        lastUpdated={data?.updatedTimestamp}
        dataSource={data?.dataSource || 'National Environment Agency'}
      />
    </div>
  );
}
