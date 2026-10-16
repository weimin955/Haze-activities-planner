import React from 'react';
import { AlertTriangle, Clock, ShieldX, RefreshCw, ServerCrash, FileQuestion } from 'lucide-react';

interface ErrorDisplayProps {
  errorType: 'slow' | 'refused' | 'empty' | 'key_not_configured' | 'general';
  customMessage?: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  errorType,
  customMessage,
  onRetry,
  isRetrying = false,
}) => {
  const getErrorDetails = () => {
    switch (errorType) {
      case 'slow':
        return {
          icon: <Clock className="w-10 h-10 text-amber-500" />,
          title: 'Request Timed Out (Slow Connection)',
          message:
            customMessage ||
            'Unable to load haze data from the National Environment Agency because the service request timed out. The provider took too long to respond.',
          recommendation:
            'Please check your internet connection or tap the button below to send a fresh request.',
          bgColor: 'bg-amber-50/90 border-amber-200',
        };
      case 'refused':
        return {
          icon: <ShieldX className="w-10 h-10 text-rose-500" />,
          title: 'Connection Refused by National Environment Agency',
          message:
            customMessage ||
            'The National Environment Agency service refused the connection or is currently unreachable from the network.',
          recommendation:
            'The official NEA servers may be undergoing scheduled maintenance or temporarily refusing requests.',
          bgColor: 'bg-rose-50/90 border-rose-200',
        };
      case 'key_not_configured':
        return {
          icon: <ServerCrash className="w-10 h-10 text-rose-600" />,
          title: 'Key Not Configured (HTTP 503)',
          message:
            customMessage ||
            'The National Environment Agency API key variable is empty in the server environment (key not configured).',
          recommendation:
            'Please ensure the API key environment variable is populated or remove empty variable assignments.',
          bgColor: 'bg-rose-50/90 border-rose-200',
        };
      case 'empty':
        return {
          icon: <FileQuestion className="w-10 h-10 text-slate-500" />,
          title: 'Empty Air Quality Data Received',
          message:
            customMessage ||
            'The National Environment Agency returned empty air quality data for this hour. No active readings were found in the dataset.',
          recommendation:
            'NEA hourly batches are published at regular intervals. Please check back shortly.',
          bgColor: 'bg-slate-50/90 border-slate-300',
        };
      default:
        return {
          icon: <AlertTriangle className="w-10 h-10 text-rose-500" />,
          title: 'Unable to Retrieve Live PSI Data',
          message:
            customMessage ||
            'The application was unable to fetch real-time haze data from the National Environment Agency via /api/psi.',
          recommendation:
            'In accordance with our strict data policy, no placeholder or simulated haze numbers are shown.',
          bgColor: 'bg-rose-50/90 border-rose-200',
        };
    }
  };

  const details = getErrorDetails();

  return (
    <div
      role="alert"
      className={`rounded-2xl border p-6 my-6 shadow-sm transition-all ${details.bgColor}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="p-3 bg-white rounded-xl shadow-xs shrink-0">{details.icon}</div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-900 mb-1">{details.title}</h3>
          <p className="text-slate-700 text-sm leading-relaxed mb-2">{details.message}</p>
          <p className="text-slate-500 text-xs italic">{details.recommendation}</p>
        </div>
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Checking NEA...' : 'Check Again'}
        </button>
      </div>
    </div>
  );
};
