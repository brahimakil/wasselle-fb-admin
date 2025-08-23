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

  const currentMonth = new Date().toISOString().slice(0, 7);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Cancellation Stats ({currentMonth})
      </h5>
      {stats ? (
        <div className="space-y-1 text-sm">
          <p className={`${stats.cancellationCount > 5 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
            <strong>Cancellations:</strong> {stats.cancellationCount}/5
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            <strong>Last:</strong> {stats.lastCancellation.toLocaleDateString()}
          </p>
          {stats.cancellationCount > 5 && (
            <p className="text-red-600 dark:text-red-400 text-xs font-medium">
              ⚠️ Limit exceeded - User should be banned
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
