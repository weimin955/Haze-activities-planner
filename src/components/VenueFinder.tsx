import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Sparkles,
  MapPin,
  Train,
  Wind,
  Clock,
  Phone,
  ShieldCheck,
  Tag,
  ExternalLink,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { VENUES_DATA } from '../data/venues';
import { VenueCategory, RegionId, Venue } from '../types/haze';

interface VenueFinderProps {
  currentPsi: number;
  selectedRegion: RegionId;
  highlightedVenueId?: string | null;
  onClearHighlight?: () => void;
}

export const VenueFinder: React.FC<VenueFinderProps> = ({
  currentPsi,
  selectedRegion,
  highlightedVenueId,
  onClearHighlight,
}) => {
  const [activeCategory, setActiveCategory] = useState<VenueCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterRegion, setSelectedFilterRegion] = useState<RegionId>(selectedRegion);
  const [onlyHighFiltration, setOnlyHighFiltration] = useState(false);
  const [bookingSuccessModal, setBookingSuccessModal] = useState<Venue | null>(null);

  // Sync regional filter if changed from parent
  React.useEffect(() => {
    setSelectedFilterRegion(selectedRegion);
  }, [selectedRegion]);

  const categories = [
    { id: 'all', label: 'All Safe Indoor', icon: '🏛️' },
    { id: 'attraction', label: 'Attractions & Domes', icon: '🌴' },
    { id: 'dining', label: 'Dining & Food Halls', icon: '🍜' },
    { id: 'entertainment', label: 'Entertainment & Games', icon: '🎳' },
    { id: 'health', label: 'Clinics & Pharmacies', icon: '💊' },
  ];

  const filteredVenues = useMemo(() => {
    return VENUES_DATA.filter((venue) => {
      // Category filter
      if (activeCategory !== 'all' && venue.category !== activeCategory) {
        return false;
      }
      // Region filter
      if (selectedFilterRegion !== 'national' && venue.region !== selectedFilterRegion) {
        return false;
      }
      // High filtration filter
      if (
        onlyHighFiltration &&
        venue.filtrationType !== 'HEPA Certified Air' &&
        venue.filtrationType !== 'Medical Grade Filtration' &&
        venue.filtrationType !== 'Cooled Biosphere Dome'
      ) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = venue.name.toLowerCase().includes(q);
        const matchesMrt = venue.nearestMrt.toLowerCase().includes(q);
        const matchesAddr = venue.address.toLowerCase().includes(q);
        const matchesDesc = venue.description.toLowerCase().includes(q);
        const matchesSub = venue.outdoorSubstituteFor.toLowerCase().includes(q);
        return matchesName || matchesMrt || matchesAddr || matchesDesc || matchesSub;
      }
      return true;
    });
  }, [activeCategory, selectedFilterRegion, onlyHighFiltration, searchQuery]);

  return (
    <div id="venues-section" className="space-y-5">
      {/* Header and Search Controls */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Indoor Activity & Venue Finder
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Curated Singapore attractions, dining hubs, entertainment and essential clinics mapped to current PSI safety.
            </p>
          </div>

          {/* Quick search input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search venue, MRT, or food..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2">
          {categories.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as VenueCategory)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Secondary Filter Row: Region and Air Filter Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 mt-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500">Filter Region:</span>
            {(['national', 'central', 'south', 'east', 'west'] as RegionId[]).map((reg) => (
              <button
                key={reg}
                onClick={() => setSelectedFilterRegion(reg)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedFilterRegion === reg
                    ? 'bg-sky-100 text-sky-800 font-bold border border-sky-300'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {reg === 'national' ? 'All Singapore' : reg.charAt(0).toUpperCase() + reg.slice(1)}
              </button>
            ))}
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyHighFiltration}
              onChange={(e) => setOnlyHighFiltration(e.target.checked)}
              className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
            />
            <span>Show only HEPA / Medical Grade venues</span>
          </label>
        </div>
      </div>

      {/* Venues Grid */}
      {filteredVenues.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-500">
          <p className="text-base font-semibold text-slate-700">No indoor venues matched your filter</p>
          <p className="text-xs mt-1">Try switching regions or clearing your search keywords.</p>
          <button
            onClick={() => {
              setActiveCategory('all');
              setSelectedFilterRegion('national');
              setSearchQuery('');
              setOnlyHighFiltration(false);
            }}
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-medium cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVenues.map((venue) => {
            const isHighlighted = highlightedVenueId === venue.id;

            return (
              <div
                key={venue.id}
                id={`venue-${venue.id}`}
                className={`bg-white rounded-3xl border p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between ${
                  isHighlighted
                    ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-md bg-sky-50/20'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {venue.region} Region
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1">
                      <Wind className="w-3 h-3 text-teal-600" />
                      {venue.filtrationType}
                    </span>
                  </div>

                  {/* Title & Badge */}
                  <div className="mb-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                      {venue.name}
                    </h3>
                    {venue.badge && (
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                        {venue.badge}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {venue.description}
                  </p>

                  {/* Haze Substitution highlight */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs mb-3">
                    <span className="font-bold text-slate-700 block mb-0.5">
                      Substitutes for outdoor:
                    </span>
                    <span className="text-slate-600 italic">
                      {venue.outdoorSubstituteFor}
                    </span>
                  </div>

                  {/* Highlights */}
                  <div className="space-y-1 mb-4">
                    {venue.highlights.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-600">
                        <span className="text-teal-600 font-bold shrink-0 mt-0.5">•</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Emergency Clinic / Pharmacy specific block */}
                  {venue.category === 'health' && venue.emergencyInfo && (
                    <div id="clinics-section" className="bg-rose-50/80 border border-rose-200 rounded-xl p-3 mb-4 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                        <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                        Haze Essential Stock & Services
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px] font-medium text-rose-800">
                        {venue.emergencyInfo.n95Stock && (
                          <span className="px-1.5 py-0.5 bg-white rounded border border-rose-200">
                            ✓ N95 Masks Available
                          </span>
                        )}
                        {venue.emergencyInfo.salbutamolInhalers && (
                          <span className="px-1.5 py-0.5 bg-white rounded border border-rose-200">
                            ✓ Asthma Inhalers
                          </span>
                        )}
                        {venue.emergencyInfo.isOpen24Hours && (
                          <span className="px-1.5 py-0.5 bg-rose-600 text-white rounded font-bold">
                            24 Hours Emergency
                          </span>
                        )}
                      </div>
                      <a
                        href={`tel:${venue.emergencyInfo.phone}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-rose-900 hover:underline pt-1"
                      >
                        <Phone className="w-3 h-3" /> Call {venue.emergencyInfo.phone}
                      </a>
                    </div>
                  )}

                  {/* Location & MRT info */}
                  <div className="space-y-1 text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 truncate">
                      <Train className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span className="truncate">{venue.nearestMrt}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{venue.address}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{venue.openingHours}</span>
                    </div>
                  </div>
                </div>

                {/* Partner Booking & Voucher Section */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  {venue.partnerDiscount && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
                      <Tag className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">{venue.partnerDiscount}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-xs font-bold text-slate-700">
                      Pricing: <span className="text-slate-900">{venue.priceRange}</span>
                    </span>

                    <button
                      onClick={() => setBookingSuccessModal(venue)}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      {venue.category === 'health' ? 'Clinic Info' : 'Partner Access'}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Partner Referral Booking Simulation Modal */}
      {bookingSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">
                  Partner Referral & Haze Relief Perk
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {bookingSuccessModal.name}
                </h3>
              </div>
              <button
                onClick={() => setBookingSuccessModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Safe indoor venue protected with {bookingSuccessModal.filtrationType}. Outdoor itinerary substitution:
              <strong className="block text-slate-800 mt-1">{bookingSuccessModal.outdoorSubstituteFor}</strong>
            </p>

            {bookingSuccessModal.partnerDiscount && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Special Haze Deal: <strong>{bookingSuccessModal.partnerDiscount}</strong></span>
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600">
              <div><strong>Address:</strong> {bookingSuccessModal.address}</div>
              <div><strong>Nearest MRT:</strong> {bookingSuccessModal.nearestMrt}</div>
              <div><strong>Hours:</strong> {bookingSuccessModal.openingHours}</div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setBookingSuccessModal(null)}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
              {bookingSuccessModal.bookingUrl ? (
                <a
                  href={bookingSuccessModal.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl inline-flex items-center justify-center gap-1 cursor-pointer"
                >
                  Visit Official Portal <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <button
                  onClick={() => setBookingSuccessModal(null)}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
