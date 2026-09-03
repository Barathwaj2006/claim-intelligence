import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Rules Engine Service Unavailable',
  message = 'Unable to connect to FastAPI Claim Intelligence services. Please check network connectivity or verify local backend container status.',
  onRetry,
}) => {
  return (
    <div className="p-6 bg-rose-50/50 border border-rose-200 rounded-xl shadow-xs text-rose-900 max-w-2xl mx-auto my-8">
      <div className="flex items-start gap-4">
        <div className="p-2.5 bg-rose-100 text-rose-600 rounded-lg shrink-0">
          <AlertOctagon className="w-6 h-6" />
        </div>
        <div className="space-y-2 flex-1">
          <h3 className="text-base font-bold tracking-tight text-rose-900">{title}</h3>
          <p className="text-xs text-rose-700 leading-relaxed">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-try Connection
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
