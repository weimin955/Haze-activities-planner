import React, { useState } from 'react';
import { X, Users, Heart, Baby, Shield, Bell, Check } from 'lucide-react';
import { FamilyProfile } from '../types/haze';

interface FamilyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: FamilyProfile;
  onSaveProfile: (profile: FamilyProfile) => void;
}

export const FamilyProfileModal: React.FC<FamilyProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [hasElderly, setHasElderly] = useState(profile.hasElderly);
  const [hasChildren, setHasChildren] = useState(profile.hasChildren);
  const [hasAsthmaOrHeart, setHasAsthmaOrHeart] = useState(profile.hasAsthmaOrHeart);
  const [threshold, setThreshold] = useState(profile.alertPsiThreshold);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveProfile({
      name: profile.name || 'My Travel Group',
      hasElderly,
      hasChildren,
      hasAsthmaOrHeart,
      alertPsiThreshold: threshold,
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-150">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Family & Sensitive Health Profile
              </h3>
              <p className="text-xs text-slate-500">
                Personalized haze alert thresholds and indoor venue recommendations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sensitive Conditions Selection */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Select Who Is Travelling or Residing With You:
          </label>

          <label
            onClick={() => setHasChildren(!hasChildren)}
            className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
              hasChildren
                ? 'bg-sky-50/80 border-sky-300 ring-1 ring-sky-300'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
            }`}
          >
            <div className="p-2 rounded-xl bg-white shadow-2xs text-sky-600">
              <Baby className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-slate-900">Babies & Young Children (&lt;12 yrs)</div>
              <p className="text-xs text-slate-500">Developing lungs are more susceptible to PM2.5 inflammation.</p>
            </div>
            <input
              type="checkbox"
              checked={hasChildren}
              onChange={() => {}}
              className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
            />
          </label>

          <label
            onClick={() => setHasElderly(!hasElderly)}
            className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
              hasElderly
                ? 'bg-sky-50/80 border-sky-300 ring-1 ring-sky-300'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
            }`}
          >
            <div className="p-2 rounded-xl bg-white shadow-2xs text-amber-600">
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-slate-900">Elderly Relatives (65+ yrs)</div>
              <p className="text-xs text-slate-500">Lower lung capacity; need immediate sheltered alternatives.</p>
            </div>
            <input
              type="checkbox"
              checked={hasElderly}
              onChange={() => {}}
              className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
            />
          </label>

          <label
            onClick={() => setHasAsthmaOrHeart(!hasAsthmaOrHeart)}
            className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
              hasAsthmaOrHeart
                ? 'bg-rose-50/80 border-rose-300 ring-1 ring-rose-300'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
            }`}
          >
            <div className="p-2 rounded-xl bg-white shadow-2xs text-rose-600">
              <Heart className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-slate-900">Asthma, Allergy, or Heart Conditions</div>
              <p className="text-xs text-slate-500">Triggers bronchospasms; prioritize medical-grade HEPA venues.</p>
            </div>
            <input
              type="checkbox"
              checked={hasAsthmaOrHeart}
              onChange={() => {}}
              className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
            />
          </label>
        </div>

        {/* Personalized Threshold Slider */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-sky-600" />
              Custom Warning Threshold:
            </span>
            <span className="text-sm font-mono font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
              {threshold} PSI
            </span>
          </div>

          <input
            type="range"
            min="60"
            max="200"
            step="10"
            value={threshold}
            onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
            className="w-full accent-sky-600 cursor-pointer"
          />

          <div className="flex justify-between text-[10px] text-slate-500 font-medium">
            <span>60 (Extra Cautious)</span>
            <span>100 (Default Unhealthy)</span>
            <span>200 (Severe Only)</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl inline-flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" /> Saved!
              </>
            ) : (
              'Save Preferences'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
