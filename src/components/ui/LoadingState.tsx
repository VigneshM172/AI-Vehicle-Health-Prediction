import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  compact?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading vehicle data…',
  compact = false,
}) => (
  <div
    className={`flex flex-col items-center justify-center text-slate-400 ${compact ? 'py-8' : 'py-16'}`}
    role="status"
    aria-live="polite"
  >
    <Loader2 className="w-6 h-6 animate-spin-slow text-blue-400 mb-3" aria-hidden="true" />
    <p className="text-sm">{message}</p>
  </div>
);
