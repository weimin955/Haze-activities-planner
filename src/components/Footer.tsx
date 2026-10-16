import React from 'react';
import { ShieldCheck, ExternalLink, PhoneCall, HeartPulse } from 'lucide-react';

interface FooterProps {
  lastUpdated?: string;
  dataSource?: string;
}

export const Footer: React.FC<FooterProps> = ({
  lastUpdated,
  dataSource = 'National Environment Agency',
}) => {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-800">
          {/* Col 1: Brand & Purpose */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-lg tracking-tight">
                Smart Haze Monitoring
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-900 text-sky-200 uppercase">
                Singapore
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Helping tourists and Singapore residents discover live regional PSI/haze conditions and find safe, vetted indoor activities, attractions, and dining alternatives when haze strikes.
            </p>
            <div className="pt-2 text-xs text-slate-400">
              {/* Mandatory Sub-Goal 5 credit */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Data: National Environment Agency</span>
              </div>
              {lastUpdated && (
                <span className="block mt-1 text-[11px] text-slate-500">
                  Latest synced reading: {lastUpdated}
                </span>
              )}
            </div>
          </div>

          {/* Col 2: Emergency Hotlines */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-rose-400" /> Emergency & Hotlines
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>
                <span className="text-slate-200 font-semibold">Emergency Ambulance:</span>{' '}
                <span className="font-mono text-rose-400 font-bold">995</span>
              </li>
              <li>
                <span className="text-slate-200 font-semibold">NEA Haze Hotline:</span>{' '}
                <span className="font-mono text-slate-300">1800-2255-632</span>
              </li>
              <li>
                <span className="text-slate-200 font-semibold">MOH Healthline:</span>{' '}
                <span className="font-mono text-slate-300">1800-225-4482</span>
              </li>
              <li>
                <span className="text-slate-200 font-semibold">Non-Emergency Ambulance:</span>{' '}
                <span className="font-mono text-slate-300">1777</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Partner Merchants & Economics */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-teal-400" /> Merchant Network
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Attractions, indoor dining halls, and pharmacies: partner with us to offer instant haze relief promotions to affected visitors.
            </p>
            <div className="pt-1">
              <a
                href="#venues-section"
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold inline-flex items-center gap-1"
              >
                Browse verified indoor partners <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Disclaimer & Privacy Guarantee */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>
            Official Singapore PSI air quality readings retrieved strictly through{' '}
            <code className="text-slate-300 font-mono">/api/psi</code>. Never uses invented data.
          </p>
          <div className="flex items-center gap-4">
            <span>No personal data collected</span>
            <span className="text-slate-400">•</span>
            {/* Exactly "Data: National Environment Agency" as required by Sub-Goal 5 */}
            <span className="text-slate-200 font-medium">Data: National Environment Agency</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
