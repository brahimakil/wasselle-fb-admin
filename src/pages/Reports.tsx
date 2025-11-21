import React, { useState, useEffect } from 'react';
import { ReportService, Report } from '../services/reportService';
import { auth } from '../firebase';

const Reports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved'>('all');

  useEffect(() => {
    loadReports();
  }, [statusFilter]);

  const loadReports = async () => {
    try {
      setLoading(true);
      let fetchedReports: Report[];
      
      if (statusFilter === 'all') {
        fetchedReports = await ReportService.getAllReports();
      } else {
        fetchedReports = await ReportService.getReportsByStatus(statusFilter);
      }
      
      setReports(fetchedReports);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResponse = async (status: 'reviewed' | 'resolved') => {
    if (!selectedReport || !adminResponse.trim()) {
      alert('Please enter a response');
      return;
    }

    try {
      setSubmitting(true);
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Not authenticated');

      await ReportService.updateReport(
        selectedReport.id,
        adminResponse,
        status,
        currentUser.uid,
        selectedReport.reporterId
      );

      alert('Response submitted successfully');
      setSelectedReport(null);
      setAdminResponse('');
      loadReports();
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="text-xs">⏳</span>;
      case 'reviewed':
        return <span className="text-xs">💬</span>;
      case 'resolved':
        return <span className="text-xs">✅</span>;
      default:
        return null;
    }
  };

  const openWhatsApp = (phone: string) => {
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}`, '_blank');
  };

  const openEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reports Management</h1>
        <p className="text-gray-600">Review and respond to user reports</p>
      </div>

      {/* Status Filter */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            statusFilter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Reports
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            statusFilter === 'pending'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setStatusFilter('reviewed')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            statusFilter === 'reviewed'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Reviewed
        </button>
        <button
          onClick={() => setStatusFilter('resolved')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            statusFilter === 'resolved'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Resolved
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-6xl mb-4">🚩</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
          <p className="text-gray-600">
            {statusFilter === 'all' 
              ? 'No reports have been submitted yet'
              : `No ${statusFilter} reports found`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{report.issue}</h3>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                      {getStatusIcon(report.status)}
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">
                    Submitted on {report.createdAt.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-gray-700 whitespace-pre-wrap">{report.description}</p>
              </div>

              {/* Reporter Information */}
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>👤</span>
                  Reporter Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium text-gray-900">{report.reporterName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{report.reporterEmail}</p>
                      <button
                        onClick={() => openEmail(report.reporterEmail)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Send Email"
                      >
                        <span className="text-lg">📧</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{report.reporterPhone}</p>
                      <button
                        onClick={() => openWhatsApp(report.reporterPhone)}
                        className="text-green-600 hover:text-green-800"
                        title="Contact on WhatsApp"
                      >
                        <span className="text-lg">💬</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reported Person Information */}
              {(report.reportedPersonName || report.reportedPersonPhone || report.reportedPersonEmail || report.reportedPersonCountry || report.reportedPersonCity || report.reportedVehiclePlate || report.reportedPersonDetails) && (
                <div className="bg-red-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-red-600">🚩</span>
                    Reported Person Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {report.reportedPersonName && (
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium text-gray-900">{report.reportedPersonName}</p>
                      </div>
                    )}
                    {report.reportedPersonPhone && (
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{report.reportedPersonPhone}</p>
                          <button
                            onClick={() => openWhatsApp(report.reportedPersonPhone!)}
                            className="text-green-600 hover:text-green-800"
                            title="Contact on WhatsApp"
                          >
                            <span className="text-lg">💬</span>
                          </button>
                        </div>
                      </div>
                    )}
                    {report.reportedPersonEmail && (
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{report.reportedPersonEmail}</p>
                          <button
                            onClick={() => openEmail(report.reportedPersonEmail!)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Send Email"
                          >
                            <span className="text-lg">📧</span>
                          </button>
                        </div>
                      </div>
                    )}
                    {report.reportedPersonCountry && (
                      <div>
                        <p className="text-sm text-gray-600">Country</p>
                        <p className="font-medium text-gray-900">{report.reportedPersonCountry}</p>
                      </div>
                    )}
                    {report.reportedPersonCity && (
                      <div>
                        <p className="text-sm text-gray-600">City</p>
                        <p className="font-medium text-gray-900">{report.reportedPersonCity}</p>
                      </div>
                    )}
                    {report.reportedVehiclePlate && (
                      <div>
                        <p className="text-sm text-gray-600">Vehicle License Plate</p>
                        <p className="font-medium text-gray-900">{report.reportedVehiclePlate}</p>
                      </div>
                    )}
                    {report.reportedPersonDetails && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Additional Details</p>
                        <p className="font-medium text-gray-900 whitespace-pre-wrap">{report.reportedPersonDetails}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Response */}
              {report.adminResponse && (
                <div className="bg-green-50 rounded-lg p-4 mb-4 border-l-4 border-green-500">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="text-green-600">✅</span>
                    Admin Response
                  </h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{report.adminResponse}</p>
                  {report.reviewedAt && (
                    <p className="text-xs text-gray-500 mt-2">
                      Responded on {report.reviewedAt.toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Action Button */}
              {report.status === 'pending' && (
                <button
                  onClick={() => {
                    setSelectedReport(report);
                    setAdminResponse(report.adminResponse || '');
                  }}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Respond to Report
                </button>
              )}
              {report.status === 'reviewed' && (
                <button
                  onClick={() => {
                    setSelectedReport(report);
                    setAdminResponse(report.adminResponse || '');
                  }}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Mark as Resolved
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Response Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Respond to Report: {selectedReport.issue}
              </h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Response to {selectedReport.reporterName}
                </label>
                <textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={6}
                  placeholder="Enter your response here... (e.g., 'Request approved', 'We will follow up', etc.)"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleSubmitResponse('reviewed')}
                  disabled={submitting || !adminResponse.trim()}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Mark as Reviewed'}
                </button>
                <button
                  onClick={() => handleSubmitResponse('resolved')}
                  disabled={submitting || !adminResponse.trim()}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Mark as Resolved'}
                </button>
                <button
                  onClick={() => {
                    setSelectedReport(null);
                    setAdminResponse('');
                  }}
                  disabled={submitting}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
