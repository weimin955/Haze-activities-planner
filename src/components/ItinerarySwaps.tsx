import React from 'react';
import { ArrowRight, Sparkles, ShieldCheck, SunDim, Building2, Tag } from 'lucide-react';
import { SMART_SWAPS } from '../data/venues';
import { RegionId } from '../types/haze';

interface ItinerarySwapsProps {
  currentPsi: number;
  selectedRegion: RegionId;
  onSelectVenue: (venueId: string) => void;
}

export const ItinerarySwaps: React.FC<ItinerarySwapsProps> = ({
  currentPsi,
  selectedRegion,
  onSelectVenue,
}) => {
  // Filter swaps if a region is chosen, otherwise show all
  const filteredSwaps = SMART_SWAPS.filter(
    (swap) => selectedRegion === 'national' || swap.region === selectedRegion
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              Smart Haze Itinerary Substitutions
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Had outdoor plans disrupted by the haze? Swap them instantly for vetted indoor alternatives with HEPA filtration.
          </p>
        </div>

        {currentPsi > 100 && (
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 self-start sm:self-auto">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
            Active Haze Warning: Outdoor Exertion Not Recommended
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSwaps.map((swap) => (
          <div
            key={swap.id}
            className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Outdoor Ruined Tag */}
              <div className="flex items-start gap-2.5 pb-3 border-b border-slate-100">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600 shrink-0 mt-0.5">
                  <SunDim className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                    Outdoor Plan Disrupted
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 line-through decoration-rose-400">
                    {swap.outdoorTitle}
                  </h4>
                  <p className="text-xs text-rose-700/80 mt-0.5">{swap.outdoorRisk}</p>
                </div>
              </div>

              {/* Indoor Alternative */}
              <div className="flex items-start gap-2.5 pt-3">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-600 shrink-0 mt-0.5">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1">
                    Recommended Indoor Substitution
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900">
                    {swap.indoorAlternative}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    {swap.indoorBenefits}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200">
                <Tag className="w-3 h-3 text-sky-600" />
                {swap.savingsTag}
              </span>

              <button
                onClick={() => onSelectVenue(swap.venueId)}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 hover:text-sky-600 transition-colors cursor-pointer group"
              >
                View Venue & Booking
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
