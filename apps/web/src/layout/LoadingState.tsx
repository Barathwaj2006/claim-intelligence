import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  subtext?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading Claim Intelligence Data...',
  subtext = 'Evaluating pre-submission rules & payer policies',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 shadow-xs min-h-[300px]">
      <div className="p-3 bg-blue-50 rounded-full text-blue-600 mb-4 animate-spin">
        <Loader2 className="w-8 h-8" />
      </div>
      <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-1">{message}</h3>
      <p className="text-xs text-slate-500 font-medium">{subtext}</p>
    </div>
  );
};
