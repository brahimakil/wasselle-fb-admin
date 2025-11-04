import React, { useState, useEffect } from 'react';
import { LiveTaxiService } from '../services/liveTaxiService';
import type { LiveTaxiApplication } from '../types/liveTaxi';
import { Cross2Icon, PersonIcon, ReloadIcon } from '@radix-ui/react-icons';

interface ViewApplicationsModalProps {
  postId: string;
  onClose: () => void;
}

const ViewApplicationsModal: React.FC<ViewApplicationsModalProps> = ({ postId, onClose }) => {
  const [applications, setApplications] = useState<LiveTaxiApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, [postId]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const apps = await LiveTaxiService.getApplicationsForPost(postId);
      setApplications(apps);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Driver Applications
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Post ID: {postId.substring(0, 12)}...
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Cross2Icon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <ReloadIcon className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading applications...</span>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-2">No applications yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Drivers haven't applied to this post
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      {app.driverPhoto ? (
                        <img
                          src={app.driverPhoto}
                          alt={app.driverName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <PersonIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {app.driverName}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                          {app.driverId.substring(0, 12)}...
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(app.status)}`}>
                      {app.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Driver Contact */}
                  {app.driverPhone && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Contact</p>
                      <p className="text-gray-900 dark:text-white flex items-center gap-2">
                        <span>📞</span>
                        {app.driverPhone}
                      </p>
                    </div>
                  )}

                  {/* Vehicle Information */}
                  {app.vehicleInfo && (
                    <div className="mb-3 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        🚗 Vehicle Information
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Model</p>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {app.vehicleInfo.model}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Color</p>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {app.vehicleInfo.color}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Plate</p>
                          <p className="text-gray-900 dark:text-white font-medium font-mono">
                            {app.vehicleInfo.plateNumber}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {app.vehicleId && !app.vehicleInfo && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Vehicle ID</p>
                      <p className="text-gray-900 dark:text-white font-mono text-sm">
                        {app.vehicleId}
                      </p>
                    </div>
                  )}

                  {/* Application Date */}
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <span>🕐</span>
                    Applied on {formatDate(app.appliedAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total applications: <strong>{applications.length}</strong>
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewApplicationsModal;
