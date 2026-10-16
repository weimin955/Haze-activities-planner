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

export interface WeatherData {
  status: 'success' | 'error';
  date: string;
  timestamp: string;
  general: {
    forecastText: string;
    forecastCode: string;
    validPeriod: string;
    temperature: { low: number; high: number; unit: string };
    humidity: { low: number; high: number; unit: string };
    wind: { direction: string; speed: { low: number; high: number } };
  };
  regionalForecasts: Record<string, { code: string; text: string }>;
  dataSource: string;
}

export type ActivityIntensity = 'outdoor_strenuous' | 'outdoor_leisure' | 'sheltered' | 'indoor';

export interface UserPlan {
  id: string;
  title: string;
  locationName: string;
  region: RegionId;
  activityType: ActivityIntensity;
  timeSlot: 'Morning' | 'Afternoon' | 'Evening' | 'Full Day';
  date: string;
  isCustomLocation?: boolean;
  evaluation?: PlanEvaluation;
  swappedAlternativeId?: string;
  createdAt: string;
}

export interface PlanEvaluation {
  status: 'safe' | 'caution' | 'unsafe';
  verdictTitle: string;
  summary: string;
  hazeRiskLevel: 'Minimal' | 'Elevated' | 'High' | 'Severe';
  weatherCondition: string;
  psiScore: number;
  pm25Score: number;
  temperature: string;
  suggestedAction: string;
  recommendedAlternatives: Venue[];
}

