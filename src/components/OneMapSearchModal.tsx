import React, { useState, useEffect } from 'react';
import { X, MapPin, Search, ExternalLink, Navigation, Compass, CheckCircle2 } from 'lucide-react';

interface OneMapResult {
  SEARCHVAL: string;
  BLK_NO: string;
  ROAD_NAME: string;
  BUILDING: string;
  ADDRESS: string;
  POSTAL: string;
  X: string;
  Y: string;
  LATITUDE: string;
  LONGITUDE: string;
}

interface OneMapSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OneMapSearchModal: React.FC<OneMapSearchModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState('178903');
  const [results, setResults] = useState<OneMapResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSearchVal, setActiveSearchVal] = useState('178903');

  const executeSearch = async (val: string) => {
    if (!val.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/Mapgov?searchVal=${encodeURIComponent(
          val.trim()
        )}&returnGeom=Y&getAddrDetails=Y&pageNum=1`
      );
      if (!res.ok) {
        throw new Error(`OneMap service returned HTTP ${res.status}`);
      }
      const data = await res.json();
      setResults(data.results || []);
      setActiveSearchVal(val.trim());
    } catch (err: any) {
      setError(err.message || 'Failed to query OneMap Singapore API');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && results.length === 0) {
      executeSearch('178903');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  OneMap Singapore Live Catalogue
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                  Keyless API
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Live geocoding and official building addresses via <code className="font-mono text-slate-700">/api/Mapgov</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            executeSearch(query);
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter postal code or building (e.g. 178903, Jewel)..."
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search OneMap'}
          </button>
        </form>

        {/* Preset quick test badges */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-slate-400 text-[11px]">Quick Tests:</span>
          {['178903', '018953 (Gardens)', '819666 (Jewel)', '098269 (Sentosa)'].map((preset) => {
            const postalOnly = preset.split(' ')[0];
            return (
              <button
                key={preset}
                onClick={() => {
                  setQuery(postalOnly);
                  executeSearch(postalOnly);
                }}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium cursor-pointer"
              >
                {preset}
              </button>
            );
          })}
        </div>

        {/* Results Box */}
        <div className="flex-1 overflow-y-auto space-y-3 min-h-[160px] pr-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {error}
            </div>
          )}

          {loading && (
            <div className="text-center py-8 text-slate-400 text-xs animate-pulse">
              Querying OneMap Elastic Search catalogue...
            </div>
          )}

          {!loading && results.length === 0 && !error && (
            <div className="text-center py-8 text-slate-400 text-xs">
              No results found for "{activeSearchVal}". Try another postal code.
            </div>
          )}

          {!loading &&
            results.map((item, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 space-y-2 text-xs transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-slate-900 text-sm">
                    {item.BUILDING !== 'NIL' ? item.BUILDING : item.SEARCHVAL}
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-mono font-bold text-[11px]">
                    S({item.POSTAL})
                  </span>
                </div>

                <p className="text-slate-600 leading-relaxed">{item.ADDRESS}</p>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500 font-mono">
                  <span>Lat: <strong>{Number(item.LATITUDE).toFixed(6)}</strong></span>
                  <span>Long: <strong>{Number(item.LONGITUDE).toFixed(6)}</strong></span>
                  <span>SVY21 X: {Number(item.X).toFixed(1)}</span>
                  <span>Y: {Number(item.Y).toFixed(1)}</span>
                </div>

                <div className="pt-2 flex justify-end">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${item.LATITUDE},${item.LONGITUDE}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-900"
                  >
                    View on Map <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Data: OneMap Singapore Catalogue (Keyless)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
