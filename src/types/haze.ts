export type RegionId = 'central' | 'east' | 'north' | 'south' | 'west' | 'national';

export type PsiBandName = 'Good' | 'Moderate' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';

export interface PsiAdvisory {
  band: PsiBandName;
  color: 'emerald' | 'blue' | 'amber' | 'orange' | 'red';
  badgeText: string;
  general: string;
  vulnerable: string;
  unwell: string;
  outdoorRisk: string;
}

export interface PsiApiResponse {
  status: 'success' | 'error';
  timestamp: string;
  updatedTimestamp: string;
  psiByRegion: Record<RegionId, number>;
  pm25ByRegion: Record<Exclude<RegionId, 'national'>, number>;
  pm10ByRegion: Record<Exclude<RegionId, 'national'>, number>;
  overallAdvisory: PsiAdvisory;
  rawReadings?: any;
  dataSource: string;
  credits: string;
  error?: string;
  message?: string;
}

export type VenueCategory = 'all' | 'attraction' | 'dining' | 'entertainment' | 'health';

export interface Venue {
  id: string;
  name: string;
  category: 'attraction' | 'dining' | 'entertainment' | 'health';
  region: 'central' | 'east' | 'north' | 'south' | 'west';
  address: string;
  nearestMrt: string;
  filtrationType: 'HEPA Certified Air' | 'Cooled Biosphere Dome' | 'Sealed Climate Complex' | 'Medical Grade Filtration';
  outdoorSubstituteFor: string;
  highlights: string[];
  description: string;
  priceRange: '$' | '$$' | '$$$' | 'Free';
  openingHours: string;
  partnerDiscount?: string;
  bookingUrl?: string;
  badge?: string;
  emergencyInfo?: {
    n95Stock: boolean;
    salbutamolInhalers: boolean;
    isOpen24Hours: boolean;
    phone: string;
  };
}

export interface FamilyProfile {
  name: string;
  hasElderly: boolean;
  hasChildren: boolean;
  hasAsthmaOrHeart: boolean;
  alertPsiThreshold: number;
}
