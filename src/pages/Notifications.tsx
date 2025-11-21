import React, { useState, useEffect } from 'react';
import { UserService } from '../services/userService';
import { NotificationService } from '../services/notificationService';
import type { User } from '../types/user';
import { PaperPlaneIcon, ReloadIcon } from '@radix-ui/react-icons';

const Notifications: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [notificationData, setNotificationData] = useState({
    title: '',
    message: '',
    type: 'system' as 'wallet' | 'admin' | 'system' | 'transaction'
  });
  const [sendToAll, setSendToAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersData = await UserService.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const handleSendNotification = async () => {
    if (!notificationData.title || !notificationData.message) {
      alert('Please enter both title and message');
      return;
    }

    if (!sendToAll && selectedUsers.length === 0) {
      alert('Please select at least one user or check "Send to All Users"');
      return;
    }

    try {
      setSending(true);
      
      const targetUsers = sendToAll ? users.map(u => u.id) : selectedUsers;
      let successCount = 0;
      let errorCount = 0;

      // Send notifications to all target users
      for (const userId of targetUsers) {
        try {
          await NotificationService.createNotification({
            userId,
            type: notificationData.type,
            title: notificationData.title,
            message: notificationData.message,
            data: {
              sentBy: 'admin',
              sentAt: new Date().toISOString()
            }
          });
          successCount++;
        } catch (error) {
          console.error(`Error sending notification to user ${userId}:`, error);
          errorCount++;
        }
      }

      alert(`Notifications sent successfully!\n✅ Success: ${successCount}\n❌ Failed: ${errorCount}`);
      
      // Reset form
      setNotificationData({
        title: '',
        message: '',
        type: 'system'
      });
      setSelectedUsers([]);
      setSendToAll(false);
    } catch (error: any) {
      console.error('Error sending notifications:', error);
      alert(error.message || 'Failed to send notifications');
    } finally {
      setSending(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.fullName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.phoneNumber?.includes(searchTerm)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Send Notifications</h1>
          <p className="text-gray-600 dark:text-gray-400">Send push notifications to users</p>
        </div>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center space-x-2"
        >
          <ReloadIcon className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notification Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notification Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title
              </label>
              <input
                type="text"
                value={notificationData.title}
                onChange={(e) => setNotificationData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Notification title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message
              </label>
              <textarea
                value={notificationData.message}
                onChange={(e) => setNotificationData(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Notification message"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
              <select
                value={notificationData.type}
                onChange={(e) => setNotificationData(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="system">System</option>
                <option value="admin">Admin</option>
                <option value="wallet">Wallet</option>
                <option value="transaction">Transaction</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sendToAll"
                checked={sendToAll}
                onChange={(e) => setSendToAll(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="sendToAll" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Send to all users ({users.length} users)
              </label>
            </div>

            <button
              onClick={handleSendNotification}
              disabled={sending}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {sending ? (
                <>
                  <ReloadIcon className="w-4 h-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <PaperPlaneIcon className="w-4 h-4" />
                  <span>Send Notification</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* User Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Select Users {!sendToAll && `(${selectedUsers.length} selected)`}
            </h2>
            {!sendToAll && (
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>

          {sendToAll ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="text-lg">📢</p>
              <p className="mt-2">Notification will be sent to all {users.length} users</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search users..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredUsers.map(user => (
                  <div
                    key={user.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedUsers.includes(user.id)
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => handleSelectUser(user.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.fullName || 'No name'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {user.email}
                        </p>
                        {user.phoneNumber && (
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {user.phoneNumber}
                          </p>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => {}}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No users found
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
