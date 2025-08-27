import React from 'react';
import { usePostExpiration } from '../hooks/usePostExpiration';
import { 
  ClockIcon, 
  CheckCircledIcon, 
  CrossCircledIcon,
  ReloadIcon,
  ActivityLogIcon
} from '@radix-ui/react-icons';

const PostExpirationMonitor: React.FC = () => {
  const { 
    isChecking, 
    lastCheck, 
    lastResult, 
    checkNow, 
    autoCheckEnabled, 
    setAutoCheckEnabled 
  } = usePostExpiration(30); // Check every 30 minutes

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <ClockIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Post Expiration Monitor
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={autoCheckEnabled}
              onChange={(e) => setAutoCheckEnabled(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <span className="text-gray-700 dark:text-gray-300">Auto-check</span>
          </label>
          
          <button
            onClick={checkNow}
            disabled={isChecking}
            className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ReloadIcon className={`w-4 h-4 mr-1 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Checking...' : 'Check Now'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {/* Status */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Status:</span>
          <div className="flex items-center space-x-2">
            {isChecking ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-blue-600 dark:text-blue-400">Checking...</span>
              </>
            ) : (
              <>
                <CheckCircledIcon className="w-4 h-4 text-green-500" />
                <span className="text-green-600 dark:text-green-400">
                  {autoCheckEnabled ? 'Auto-monitoring' : 'Manual only'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Last Check */}
        {lastCheck && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Last Check:</span>
            <span className="text-gray-900 dark:text-white">
              {formatDate(lastCheck)}
            </span>
          </div>
        )}

        {/* Last Result */}
        {lastResult && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">Last Result:</span>
              {lastResult.success ? (
                <CheckCircledIcon className="w-4 h-4 text-green-500" />
              ) : (
                <CrossCircledIcon className="w-4 h-4 text-red-500" />
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Processed:</span>
                <span className="ml-1 font-medium text-gray-900 dark:text-white">
                  {lastResult.processedCount}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Expired:</span>
                <span className="ml-1 font-medium text-orange-600 dark:text-orange-400">
                  {lastResult.expiredCount}
                </span>
              </div>
            </div>
            
            {lastResult.error && (
              <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                Error: {lastResult.error}
              </div>
            )}
            
            {lastResult.expiredPosts?.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                  Expired Posts:
                </span>
                <div className="space-y-1">
                  {lastResult.expiredPosts.slice(0, 3).map((post: any, index: number) => (
                    <div key={index} className="text-xs text-gray-700 dark:text-gray-300">
                      {typeof post === 'string' ? post : post.title}
                    </div>
                  ))}
                  {lastResult.expiredPosts.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      +{lastResult.expiredPosts.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="flex items-start space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <ActivityLogIcon className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>
            Automatically checks for expired posts every 30 minutes. 
            Posts are expired when their departure time (or return time if applicable) has passed.
          </span>
        </div>
      </div>
    </div>
  );
};

export default PostExpirationMonitor;
