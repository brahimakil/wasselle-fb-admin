import React, { useState, useEffect } from 'react';
import { PostService } from '../services/postService';
import type { UserCancellationRecord } from '../types/post';

interface UserCancellationStatsProps {
  userId: string;
  userName: string;
}

const UserCancellationStats: React.FC<UserCancellationStatsProps> = ({ userId, userName }) => {
  const [stats, setStats] = useState<UserCancellationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const currentStats = await PostService.getUserCancellationStats(userId);
      setStats(currentStats);
    } catch (error) {
      console.error('Error loading cancellation stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetCancellations = async () => {
    if (!window.confirm(`Are you sure you want to reset cancellations for ${userName}? This will also unban the user if they were banned.`)) {
      return;
    }

    try {
      setResetting(true);
      await PostService.resetUserCancellations(userId, true); // Pass true to unban
      await loadStats(); // Reload stats after reset
      alert('Cancellations reset and user unbanned successfully!');
    } catch (error) {
      console.error('Error resetting cancellations:', error);
      alert('Failed to reset cancellations. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  const currentMonth = new Date().toISOString().slice(0, 7);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Cancellation Stats ({currentMonth})
        </h5>
        {stats && (
          <button
            onClick={handleResetCancellations}
            disabled={resetting}
            className="text-xs px-2 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded transition-colors"
            title="Reset cancellations for this user"
          >
            {resetting ? 'Resetting...' : 'Reset'}
          </button>
        )}
      </div>
      {stats ? (
        <div className="space-y-1 text-sm">
          <p className={`${stats.cancellationCount >= 3 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
            <strong>Cancellations:</strong> {stats.cancellationCount}/3
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            <strong>Last:</strong> {stats.lastCancellation.toLocaleDateString()}
          </p>
          {stats.cancellationCount >= 3 && (
            <p className="text-red-600 dark:text-red-400 text-xs font-medium">
              ⚠️ Limit exceeded - User account banned
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-600 dark:text-gray-400">No cancellations this month</p>
      )}
    </div>
  );
};

export default UserCancellationStats;
