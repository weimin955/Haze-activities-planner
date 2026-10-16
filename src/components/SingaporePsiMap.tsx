import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Layers,
  Crosshair,
  Maximize2,
  Minimize2,
  Navigation,
  Info,
  ShieldCheck,
  Building2,
  ExternalLink,
  Search,
} from 'lucide-react';
import { RegionId, PsiApiResponse } from '../types/haze';
import { VENUES_DATA } from '../data/venues';

interface SingaporePsiMapProps {
  data: PsiApiResponse;
  selectedRegion: RegionId;
  onSelectRegion: (region: RegionId) => void;
  onSelectVenue?: (venueId: string) => void;
}

// Official NEA Monitoring Stations Coordinates
const NEA_STATIONS: Record<
  Exclude<RegionId, 'national'>,
  { name: string; label: string; lat: number; lng: number }
> = {
  north: { name: 'North Region', label: 'Woodlands / Admiralty', lat: 1.41803, lng: 103.82 },
  south: { name: 'South Region', label: 'Sentosa / Bukit Merah', lat: 1.29587, lng: 103.82 },
  east: { name: 'East Region', label: 'Tampines / Changi', lat: 1.35735, lng: 103.94 },
  west: { name: 'West Region', label: 'Jurong West / Clementi', lat: 1.35735, lng: 103.7 },
  central: { name: 'Central Region', label: 'Marina Bay / Bishan', lat: 1.35735, lng: 103.82 },
};

// Verified Singapore Geographic Coordinates for Key Venues
const VENUE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'flower-dome-cloud-forest': { lat: 1.2847, lng: 103.8657 },
  'sea-aquarium': { lat: 1.2584, lng: 103.8198 },
  'artscience-museum': { lat: 1.2863, lng: 103.8593 },
  'national-gallery': { lat: 1.2903, lng: 103.8519 },
  'jewel-canopy-park': { lat: 1.3602, lng: 103.9898 },
  'lee-kong-chian-museum': { lat: 1.2951, lng: 103.7738 },
  'science-centre-snow-city': { lat: 1.3331, lng: 103.736 },
  'lau-pa-sat-indoor': { lat: 1.2807, lng: 103.8504 },
  'ion-orchard-food-opera': { lat: 1.3039, lng: 103.832 },
  'mbs-shoppes-dining': { lat: 1.284, lng: 103.859 },
  'jewel-changi-dining': { lat: 1.3602, lng: 103.9898 },
  'suntec-city-dining-hub': { lat: 1.2935, lng: 103.8572 },
  'superpark-singapore': { lat: 1.2935, lng: 103.8572 },
  'timezone-vivocity': { lat: 1.2644, lng: 103.8222 },
  'kstar-karaoke': { lat: 1.3006, lng: 103.8398 },
  'project-x-vr': { lat: 1.3006, lng: 103.8398 },
  'shaw-theatres-imax': { lat: 1.3602, lng: 103.9898 },
  'guardian-raffles-city': { lat: 1.2936, lng: 103.8532 },
  'raffles-medical-24hr': { lat: 1.3005, lng: 103.8587 },
  'watsons-mbs': { lat: 1.284, lng: 103.859 },
  'unity-jurong-point': { lat: 1.3403, lng: 103.706 },
  'shenton-medical-cbd': { lat: 1.2838, lng: 103.8502 },
  'guardian-changi-airport': { lat: 1.3575, lng: 103.988 },
};

type MapLayerType = 'voyager' | 'satellite' | 'osm';

export const SingaporePsiMap: React.FC<SingaporePsiMapProps> = ({
  data,
  selectedRegion,
  onSelectRegion,
  onSelectVenue,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const circlesLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [mapLayer, setMapLayer] = useState<MapLayerType>('voyager');
  const [showVenues, setShowVenues] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  // Map Tile Providers
  const tileUrls: Record<MapLayerType, { url: string; attribution: string }> = {
    voyager: {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution:
        'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    },
    osm: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  };

  const getAdvisoryColor = (psi: number) => {
    if (psi <= 50) return { hex: '#10b981', name: 'Good', bg: 'bg-emerald-500' };
    if (psi <= 100) return { hex: '#0ea5e9', name: 'Moderate', bg: 'bg-sky-500' };
    if (psi <= 200) return { hex: '#f59e0b', name: 'Unhealthy', bg: 'bg-amber-500' };
    if (psi <= 300) return { hex: '#f97316', name: 'Very Unhealthy', bg: 'bg-orange-500' };
    return { hex: '#e11d48', name: 'Hazardous', bg: 'bg-rose-600' };
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Singapore: 1.3521° N, 103.8198° E
    const map = L.map(mapContainerRef.current, {
      center: [1.3521, 103.8198],
      zoom: 11,
      minZoom: 10,
      maxZoom: 18,
      zoomControl: false, // Custom Google Maps style zoom buttons
      attributionControl: false, // We place custom attribution
      maxBounds: [
        [1.15, 103.55], // Southwest bound
        [1.52, 104.15], // Northeast bound
      ],
    });

    const tile = L.tileLayer(tileUrls[mapLayer].url, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    tileLayerRef.current = tile;
    markerLayerGroupRef.current = L.layerGroup().addTo(map);
    circlesLayerGroupRef.current = L.layerGroup().addTo(map);

    // Track mouse coordinate for Google Maps coordinate inspector
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setMouseCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    map.on('mouseout', () => {
      setMouseCoords(null);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when layer switch button is toggled
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newTile = L.tileLayer(tileUrls[mapLayer].url, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTile;
  }, [mapLayer]);

  // Update Regional Station Markers & Zones
  useEffect(() => {
    if (!mapInstanceRef.current || !markerLayerGroupRef.current || !circlesLayerGroupRef.current)
      return;

    markerLayerGroupRef.current.clearLayers();
    circlesLayerGroupRef.current.clearLayers();

    const regions: (Exclude<RegionId, 'national'>)[] = ['north', 'south', 'east', 'west', 'central'];

    regions.forEach((regId) => {
      const station = NEA_STATIONS[regId];
      const psiVal = data.psiByRegion[regId] ?? 0;
      const pm25Val = data.pm25ByRegion[regId] ?? 0;
      const colorMeta = getAdvisoryColor(psiVal);
      const isSelected = selectedRegion === regId;

      // 1. Regional zone boundary circle with haze color shading
      if (showZones) {
        const circle = L.circle([station.lat, station.lng], {
          radius: regId === 'central' ? 4500 : 5500,
          color: colorMeta.hex,
          fillColor: colorMeta.hex,
          fillOpacity: isSelected ? 0.28 : 0.14,
          weight: isSelected ? 3 : 1.5,
          dashArray: isSelected ? undefined : '5, 5',
        });
        circle.on('click', () => {
          onSelectRegion(regId);
        });
        circlesLayerGroupRef.current?.addLayer(circle);
      }

      // 2. Google Maps Styled Pin Icon with PSI badge
      const pinHtml = `
        <div class="relative flex flex-col items-center group cursor-pointer transition-transform duration-200 ${
          isSelected ? 'scale-125 z-50' : 'hover:scale-110'
        }">
          <!-- Outer Pulsing Ring for Selected -->
          ${
            isSelected
              ? `<span class="absolute -top-1 w-9 h-9 rounded-full animate-ping opacity-50" style="background-color: ${colorMeta.hex};"></span>`
              : ''
          }
          <!-- Google Maps Marker Pin Head -->
          <div class="flex items-center gap-1 px-2.5 py-1 rounded-full text-white font-mono font-bold text-xs shadow-lg border-2 border-white" style="background-color: ${colorMeta.hex};">
            <span class="capitalize text-[10px] font-sans font-extrabold">${regId}</span>
            <span class="bg-black/25 px-1 py-0.2 rounded-sm text-[11px]">${psiVal}</span>
          </div>
          <!-- Google Maps Pin Pointer Tip -->
          <div class="w-2.5 h-2.5 rotate-45 -mt-1.5 border-r-2 border-b-2 border-white shadow-xs" style="background-color: ${colorMeta.hex};"></div>
          <!-- Label Pill -->
          <div class="mt-1 px-1.5 py-0.5 bg-white/95 text-slate-800 rounded-md shadow-xs border border-slate-200 text-[10px] font-bold whitespace-nowrap">
            ${station.name}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: pinHtml,
        className: 'custom-psi-marker',
        iconSize: [80, 50],
        iconAnchor: [40, 25],
      });

      const marker = L.marker([station.lat, station.lng], { icon: customIcon });

      // Rich Google Maps Info Window
      const popupHtml = `
        <div class="p-3 font-sans max-w-xs text-slate-900">
          <div class="flex items-center justify-between gap-2 border-b pb-2 mb-2">
            <div>
              <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500">NEA Monitoring Station</div>
              <div class="text-sm font-extrabold text-slate-900">${station.name}</div>
              <div class="text-[11px] text-slate-600">${station.label}</div>
            </div>
            <span class="px-2 py-0.5 rounded-md text-white font-bold text-xs" style="background-color: ${colorMeta.hex}">
              ${colorMeta.name}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-2 my-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <div>
              <div class="text-[10px] text-slate-500 font-bold uppercase">24-Hr PSI</div>
              <div class="text-xl font-mono font-black text-slate-900">${psiVal}</div>
            </div>
            <div>
              <div class="text-[10px] text-slate-500 font-bold uppercase">PM2.5 (24-Hr)</div>
              <div class="text-base font-mono font-bold text-slate-800">${pm25Val} µg/m³</div>
            </div>
          </div>
          <div class="text-[10px] text-slate-500 mb-2 font-mono">
            Coordinates: ${station.lat.toFixed(5)}° N, ${station.lng.toFixed(5)}° E
          </div>
          <button id="btn-select-${regId}" class="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer">
            Select ${station.name}
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        offset: [0, -10],
        closeButton: true,
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-select-${regId}`);
        if (btn) {
          btn.onclick = () => {
            onSelectRegion(regId);
            marker.closePopup();
          };
        }
      });

      marker.on('click', () => {
        onSelectRegion(regId);
      });

      markerLayerGroupRef.current?.addLayer(marker);
    });

    // 3. Indoor Venue Pins
    if (showVenues) {
      VENUES_DATA.forEach((venue) => {
        const coords = VENUE_COORDINATES[venue.id];
        if (!coords) return;

        const categoryIcons: Record<string, string> = {
          attraction: '🌴',
          dining: '🍜',
          entertainment: '🎳',
          health: '💊',
        };

        const venuePinHtml = `
          <div class="relative group cursor-pointer transition-transform hover:scale-125 z-30">
            <div class="w-7 h-7 rounded-full bg-white border-2 border-sky-600 shadow-md flex items-center justify-center text-xs">
              ${categoryIcons[venue.category] || '📍'}
            </div>
          </div>
        `;

        const venueIcon = L.divIcon({
          html: venuePinHtml,
          className: 'custom-venue-marker',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const venueMarker = L.marker([coords.lat, coords.lng], { icon: venueIcon });

        const venuePopupHtml = `
          <div class="p-2.5 font-sans max-w-xs text-slate-900">
            <div class="text-[10px] font-bold uppercase tracking-wider text-sky-600 mb-0.5">
              ${venue.category.toUpperCase()} • ${venue.filtrationType}
            </div>
            <div class="text-xs font-bold text-slate-900">${venue.name}</div>
            <div class="text-[11px] text-slate-500 mt-0.5">${venue.address}</div>
            <div class="text-[10px] font-mono text-slate-400 mt-1">
              ${coords.lat.toFixed(5)}° N, ${coords.lng.toFixed(5)}° E
            </div>
            ${
              venue.outdoorSubstituteFor
                ? `<div class="mt-1.5 p-1.5 bg-slate-50 rounded-lg text-[10px] text-slate-600">
                    <strong>Haze Alternative:</strong> ${venue.outdoorSubstituteFor}
                   </div>`
                : ''
            }
          </div>
        `;

        venueMarker.bindPopup(venuePopupHtml, { offset: [0, -5] });
        markerLayerGroupRef.current?.addLayer(venueMarker);
      });
    }
  }, [data, selectedRegion, showVenues, showZones]);

  // Recenter map function
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([1.3521, 103.8198], 11, {
        duration: 1.2,
      });
    }
  };

  // Zoom handlers
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  // Focus region when selectedRegion changes from parent
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (selectedRegion === 'national') {
      mapInstanceRef.current.flyTo([1.3521, 103.8198], 11, { duration: 1.0 });
    } else {
      const station = NEA_STATIONS[selectedRegion];
      if (station) {
        mapInstanceRef.current.flyTo([station.lat, station.lng], 13, { duration: 1.0 });
      }
    }
  }, [selectedRegion]);

  return (
    <div
      className={`bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm transition-all relative ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : ''
      }`}
    >
      {/* Google Maps Styled Top Navigation / Search Bar */}
      <div className="p-3 sm:p-4 border-b border-slate-200 bg-white/95 backdrop-blur-xs flex flex-col md:flex-row md:items-center justify-between gap-3 z-10 relative">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-xs">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Interactive Singapore Air Quality Map
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase tracking-wide">
                Google Map Style
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Referencing official NEA coordinates & verified indoor refuge venues
            </p>
          </div>
        </div>

        {/* Map View Controls & Layer Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Map Layer Switcher (Google Map Style: Map / Satellite / Terrain) */}
          <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200 shadow-2xs">
            <button
              onClick={() => setMapLayer('voyager')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mapLayer === 'voyager'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Default
            </button>
            <button
              onClick={() => setMapLayer('satellite')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mapLayer === 'satellite'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapLayer('osm')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mapLayer === 'osm'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Streets
            </button>
          </div>

          {/* Layer toggles: Zones & Venues */}
          <button
            onClick={() => setShowZones(!showZones)}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showZones
                ? 'bg-sky-50 text-sky-800 border-sky-300'
                : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            Zones
          </button>
          <button
            onClick={() => setShowVenues(!showVenues)}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showVenues
                ? 'bg-teal-50 text-teal-800 border-teal-300'
                : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            Venues
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer shadow-2xs"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Map Viewport Area */}
      <div className="relative w-full h-[440px] sm:h-[480px]">
        {/* Leaflet container */}
        <div ref={mapContainerRef} className="w-full h-full z-0 select-none" />

        {/* Floating Google Maps Style Zoom Controls (Bottom-Right) */}
        <div className="absolute right-4 bottom-8 z-30 flex flex-col gap-2">
          {/* Recenter Singapore Button */}
          <button
            onClick={handleRecenter}
            className="w-10 h-10 bg-white hover:bg-slate-50 text-slate-800 rounded-xl shadow-lg border border-slate-200 flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
            title="Recenter Singapore (1.3521° N, 103.8198° E)"
          >
            <Crosshair className="w-5 h-5 text-sky-600" />
          </button>

          {/* Google Maps Zoom Box (+ / -) */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col">
            <button
              onClick={handleZoomIn}
              className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-50 font-bold text-lg border-b border-slate-100 transition-colors cursor-pointer"
              title="Zoom In"
            >
              +
            </button>
            <button
              onClick={handleZoomOut}
              className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-50 font-bold text-lg transition-colors cursor-pointer"
              title="Zoom Out"
            >
              −
            </button>
          </div>
        </div>

        {/* Floating Google Maps Bottom-Left Coordinate & Scale Inspector */}
        <div className="absolute left-4 bottom-3 z-30 flex items-center gap-2 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-lg border border-slate-200 shadow-xs text-[11px] text-slate-700 font-mono">
          <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          {mouseCoords ? (
            <span>
              Lat: <strong>{mouseCoords.lat.toFixed(5)}° N</strong>, Lng:{' '}
              <strong>{mouseCoords.lng.toFixed(5)}° E</strong>
            </span>
          ) : (
            <span>
              Center: <strong>1.3521° N</strong>, <strong>103.8198° E</strong> (Singapore)
            </span>
          )}
        </div>

        {/* Quick Region Bar on Top of Map */}
        <div className="absolute top-3 left-3 z-30 hidden sm:flex items-center gap-1.5 bg-white/95 backdrop-blur-xs px-2 py-1.5 rounded-xl border border-slate-200 shadow-md">
          <span className="text-[10px] font-bold uppercase text-slate-500 px-1">Region:</span>
          {(['national', 'central', 'south', 'east', 'west', 'north'] as RegionId[]).map((reg) => {
            const psiVal = data.psiByRegion[reg] ?? 0;
            const isSelected = selectedRegion === reg;
            return (
              <button
                key={reg}
                onClick={() => onSelectRegion(reg)}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {reg} <span className="font-mono text-[10px] opacity-80">{psiVal}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Map Footer Attribution & Legend Bar */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-700">Official NEA Coordinates:</span>
          <span>North (1.418°N, 103.820°E)</span>
          <span>•</span>
          <span>South (1.296°N, 103.820°E)</span>
          <span>•</span>
          <span>Central (1.357°N, 103.820°E)</span>
        </div>
        <div className="text-[11px] text-slate-400">
          Cartography &copy; OpenStreetMap & CARTO &bull; Coordinates &copy; NEA Singapore
        </div>
      </div>
    </div>
  );
};
