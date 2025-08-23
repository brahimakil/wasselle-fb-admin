import React, { useState, useEffect } from 'react';
import { SubscriptionService } from '../services/subscriptionService';
import { UserService } from '../services/userService';
import { WalletService } from '../services/walletService';
import type { User } from '../types/user';
import type { Post } from '../types/post';
import type { UserWallet } from '../types/wallet';
import { 
  Cross2Icon, 
  PersonIcon, 
  RocketIcon,
  TokensIcon,
  ExclamationTriangleIcon,
  CheckCircledIcon
} from '@radix-ui/react-icons';

interface CreateSubscriptionModalProps {
  onClose: () => void;
  onSuccess: () => void;
  adminId: string;
  posts: Post[];
  users: User[];
}

const CreateSubscriptionModal: React.FC<CreateSubscriptionModalProps> = ({
  onClose,
  onSuccess,
  adminId,
  posts,
  users
}) => {
  const [selectedPostId, setSelectedPostId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userWallet, setUserWallet] = useState<UserWallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [error, setError] = useState('');

  // Change the availablePosts filter (around line 47):
  const availablePosts = posts.filter(post => 
    post.status === 'active' && post.cost > 0 // Only active posts, not subscribed ones
  );

  // Add these console logs right after the filter:
  console.log('All posts:', posts);
  console.log('First post detailed structure:', posts.length > 0 ? Object.keys(posts[0]) : 'No posts');
  console.log('First post full data:', posts.length > 0 ? posts[0] : 'No posts');

  // Show what properties each post actually has:
  posts.forEach((post, index) => {
    console.log(`Post ${index}:`, {
      id: post.id,
      allProperties: Object.keys(post),
      title: post.title,
      content: post.content,
      description: post.description, // Maybe it's called description instead of content?
      status: post.status,
      authorName: post.authorName,
      authorId: post.authorId,
      cost: post.cost,
      price: post.price // Maybe it's called price instead of cost?
    });
  });
  console.log('Available posts after filter:', availablePosts);
  console.log('Posts with costs:', posts.map(p => ({ id: p.id, title: p.title, status: p.status, cost: p.cost })));

  // Add this right after the existing console logs:
  console.log('=== DETAILED POST DEBUGGING ===');
  if (posts.length > 0) {
    const firstPost = posts[0];
    console.log('First post ALL properties:', Object.keys(firstPost));
    console.log('First post FULL data:', firstPost);
    
    // Check common alternative field names:
    console.log('Author fields check:', {
      authorName: firstPost.authorName,
      authorId: firstPost.authorId, 
      userId: firstPost.userId,
      createdBy: firstPost.createdBy,
      user: firstPost.user,
      author: firstPost.author
    });
    
    console.log('Content fields check:', {
      content: firstPost.content,
      description: firstPost.description,
      body: firstPost.body,
      text: firstPost.text
    });
    
    console.log('Status fields check:', {
      status: firstPost.status,
    });
  }

  // Create a function to generate a title for travel posts:
  const getPostTitle = (post: any) => {
    const service = post.serviceType === 'taxi' ? 'Taxi' : 
                    post.serviceType === 'delivery' ? 'Delivery' : 'Service';
    const travel = post.travelType === 'vehicle' ? 'Vehicle' : 'Flight';
    return `${service} - ${travel} Trip (${post.departureDate})`;
  };

  // Update the getAuthorName function to properly find the user:
  const getAuthorName = (post: any) => {
    // First try to find by userId (the actual trip author)
    let author = users.find(user => user.id === post.userId);
    
    // If not found, try createdBy (admin who created it)
    if (!author) {
      author = users.find(user => user.id === post.createdBy);
    }
    
    return author?.fullName || 'Unknown Author';
  };

  // Get the author ID for filtering
  const getAuthorId = (post: any) => {
    return post.userId || post.createdBy;
  };

  // Update the available users filter to properly exclude the post author:
  const selectedPost = availablePosts.find(post => post.id === selectedPostId);
  // Temporarily change this:
  const availableUsers = users.filter(user => 
    user.isActive && 
    !user.isBanned &&
    user.id !== selectedPost?.userId
    // Only exclude the post owner, not the admin who created it
  );
  const selectedUser = availableUsers.find(user => user.id === selectedUserId);

  // Add debugging for user selection:
  console.log('Selected post author ID:', selectedPost ? getAuthorId(selectedPost) : 'none');
  console.log('Available users:', availableUsers.map(u => ({ id: u.id, name: u.fullName })));
  console.log('All users:', users.map(u => ({ id: u.id, name: u.fullName, isActive: u.isActive, isBanned: u.isBanned })));

  // Add these debug logs after the filter:
  console.log('🔍 DEBUGGING USER FILTER:');
  console.log('Selected Post ID:', selectedPostId);
  console.log('Selected Post:', selectedPost);
  console.log('Selected Post userId:', selectedPost?.userId);
  console.log('Selected Post createdBy:', selectedPost?.createdBy);
  console.log('All users:', users.map(u => ({ id: u.id, name: u.fullName, isActive: u.isActive, isBanned: u.isBanned })));
  console.log('Available users after filter:', availableUsers.map(u => ({ id: u.id, name: u.fullName })));

  // Update the wallet loading useEffect with more debugging:
  useEffect(() => {
    if (!selectedUserId) {
      setUserWallet(null);
      return;
    }

    const loadUserWallet = async () => {
      setLoadingWallet(true);
      console.log('🔍 Loading wallet for user ID:', selectedUserId);
      
      try {
        const wallet = await WalletService.getUserWallet(selectedUserId);
        console.log('💰 Wallet loaded successfully:', wallet);
        setUserWallet(wallet);
      } catch (error) {
        console.error('❌ Error loading user wallet:', error);
        console.log('User ID that failed:', selectedUserId);
        
        // Try to initialize wallet if it doesn't exist
        console.log('🔧 Attempting to initialize wallet...');
        try {
          await WalletService.initializeWallet(selectedUserId);
          console.log('✅ Wallet initialized, trying to load again...');
          
          const newWallet = await WalletService.getUserWallet(selectedUserId);
          console.log('💰 Wallet loaded after initialization:', newWallet);
          setUserWallet(newWallet);
        } catch (initError) {
          console.error('❌ Failed to initialize wallet:', initError);
          setUserWallet(null);
        }
      } finally {
        setLoadingWallet(false);
      }
    };

    loadUserWallet();
  }, [selectedUserId]);

  // Update the canAfford calculation:
  const canAfford = userWallet !== null && selectedPost && userWallet.balance >= selectedPost.cost;

  // Update the handleSubmit function:
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedPostId || !selectedUserId) {
      setError('Please select both a post and a user');
      return;
    }

    if (!selectedPost || !selectedUser) {
      setError('Invalid selection');
      return;
    }

    // Handle case where wallet doesn't exist (will be created with 0 balance)
    const userBalance = userWallet?.balance || 0;
    if (userBalance < selectedPost.cost) {
      setError(`User has insufficient balance. Required: ${selectedPost.cost} points, Available: ${userBalance} points`);
      return;
    }

    setLoading(true);

    try {
      // Initialize wallet if it doesn't exist
      if (!userWallet) {
        console.log('🔧 Initializing wallet for user before subscription...');
        await WalletService.initializeWallet(selectedUserId);
      }

      await SubscriptionService.subscribeToPost(
        selectedPostId,
        selectedUserId,
        selectedUser.fullName,
        selectedUser.email
      );

      onSuccess();
    } catch (error: any) {
      setError(error.message || 'Failed to create subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Subscription</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Cross2Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Post Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Post *
            </label>
            <select
              value={selectedPostId}
              onChange={(e) => {
                setSelectedPostId(e.target.value);
                setSelectedUserId(''); // Reset user selection when post changes
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Choose a post...</option>
              {availablePosts.map((post) => (
                <option key={post.id} value={post.id}>
                  {getPostTitle(post)} - {post.cost} points (by {getAuthorName(post)})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Only active posts with subscription fees are shown
            </p>
          </div>

          {/* Selected Post Details */}
          {selectedPost && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <RocketIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-300">
                    {getPostTitle(selectedPost)}
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    Cost: {selectedPost.cost} points • Author: {getAuthorName(selectedPost)}
                  </p>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-2 space-y-1">
                    <p><strong>Service:</strong> {selectedPost.serviceType}</p>
                    <p><strong>Travel:</strong> {selectedPost.travelType}</p>
                    <p><strong>Departure:</strong> {selectedPost.departureDate} at {selectedPost.departureTime}</p>
                    {selectedPost.hasReturnTrip && (
                      <p><strong>Return:</strong> {selectedPost.returnDate} at {selectedPost.returnTime}</p>
                    )}
                    {selectedPost.description && (
                      <p><strong>Description:</strong> {selectedPost.description}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Selection */}
          {selectedPostId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Subscriber *
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Choose a user...</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName} ({user.email})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Post author is excluded from the list
              </p>
            </div>
          )}

          {/* User Wallet Info */}
          {selectedUserId && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <PersonIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Subscriber Details
                </span>
              </div>

              {loadingWallet ? (
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Loading wallet...</span>
                </div>
              ) : userWallet ? (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Current Balance</p>
                      <div className="flex items-center space-x-1">
                        <TokensIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {userWallet.balance} pts
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">After Subscription</p>
                      <span className={`font-semibold ${
                        canAfford ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {userWallet.balance - (selectedPost?.cost || 0)} pts
                      </span>
                    </div>
                  </div>

                  {/* Balance Status */}
                  <div className={`mt-3 p-2 rounded flex items-center space-x-2 text-sm ${
                    canAfford 
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                  }`}>
                    {canAfford ? (
                      <>
                        <CheckCircledIcon className="w-4 h-4" />
                        <span>User has sufficient balance for this subscription</span>
                      </>
                    ) : (
                      <>
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        <span>
                          Insufficient balance! User needs {(selectedPost?.cost || 0) - userWallet.balance} more points
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                // Handle case where wallet doesn't exist
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                        Wallet Not Found
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                        This user doesn't have a wallet yet. A wallet with 0 balance will be created automatically.
                      </p>
                      <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 rounded">
                        <p className="text-sm text-red-800 dark:text-red-400">
                          ⚠️ User has 0 points - insufficient for {selectedPost?.cost || 0} point subscription
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Warning */}
          {selectedPost && selectedUser && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    Subscription Terms
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                    • {selectedPost.cost} points will be deducted from {selectedUser.fullName}'s wallet
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    • {selectedPost.cost} points will be added to {getAuthorName(selectedPost)}'s wallet
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    • Subscriber will have access to this {selectedPost.serviceType} trip
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    • Both parties will receive transaction notifications
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    • <strong>Cancellations are allowed but NO REFUNDS will be issued</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !canAfford || !selectedPostId || !selectedUserId}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing...' : 'Create Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSubscriptionModal;
