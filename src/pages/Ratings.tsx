import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';

interface Rating {
  id: string;
  postId: string;
  postType: 'taxi' | 'delivery';
  ratedUserId: string;
  ratedUserName: string;
  raterUserId: string;
  raterUserName: string;
  rating: number;
  review: string;
  createdAt: any;
}

interface UserRatingStats {
  userId: string;
  userName: string;
  averageRating: number;
  totalRatings: number;
  ratings: Rating[];
}

const Ratings: React.FC = () => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [userStats, setUserStats] = useState<UserRatingStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'all' | 'users'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'taxi' | 'delivery'>('all');

  useEffect(() => {
    loadRatings();
  }, []);

  useEffect(() => {
    if (ratings.length > 0) {
      calculateUserStats();
    }
  }, [ratings]);

  const loadRatings = async () => {
    try {
      setLoading(true);
      const ratingsQuery = query(
        collection(db, 'ratings'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(ratingsQuery);
      const ratingsData: Rating[] = [];
      
      snapshot.forEach((doc) => {
        ratingsData.push({
          id: doc.id,
          ...doc.data(),
        } as Rating);
      });
      
      setRatings(ratingsData);
    } catch (error) {
      console.error('Error loading ratings:', error);
      alert('Failed to load ratings');
    } finally {
      setLoading(false);
    }
  };

  const calculateUserStats = () => {
    const userMap = new Map<string, { ratings: Rating[]; sum: number }>();
    
    ratings.forEach((rating) => {
      if (!userMap.has(rating.ratedUserId)) {
        userMap.set(rating.ratedUserId, { ratings: [], sum: 0 });
      }
      const userData = userMap.get(rating.ratedUserId)!;
      userData.ratings.push(rating);
      userData.sum += rating.rating;
    });
    
    const stats: UserRatingStats[] = [];
    userMap.forEach((data, userId) => {
      const firstRating = data.ratings[0];
      stats.push({
        userId,
        userName: firstRating.ratedUserName,
        averageRating: data.sum / data.ratings.length,
        totalRatings: data.ratings.length,
        ratings: data.ratings,
      });
    });
    
    // Sort by average rating descending
    stats.sort((a, b) => b.averageRating - a.averageRating);
    setUserStats(stats);
  };

  const formatDate = (date: any): string => {
    if (!date) return 'N/A';
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-2 text-sm font-semibold text-gray-700 dark:text-gray-300">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const filteredRatings = ratings.filter((rating) => {
    const matchesSearch = 
      rating.ratedUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rating.raterUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rating.review.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRating = ratingFilter === 'all' || rating.rating === ratingFilter;
    const matchesType = typeFilter === 'all' || rating.postType === typeFilter;
    
    return matchesSearch && matchesRating && matchesType;
  });

  const filteredUserStats = userStats.filter((user) =>
    user.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading ratings...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ratings & Reviews</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">View and manage user ratings for drivers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Reviews</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{ratings.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">Rated Drivers</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{userStats.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">Average Rating</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {ratings.length > 0
              ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
              : '0.0'}
            ⭐
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">5-Star Reviews</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {ratings.filter((r) => r.rating === 5).length}
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All Reviews
            </button>
            <button
              onClick={() => setViewMode('users')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'users'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              By Driver
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by name or review..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {viewMode === 'all' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rating
                  </label>
                  <select
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Ratings</option>
                    <option value={5}>5 Stars</option>
                    <option value={4}>4 Stars</option>
                    <option value={3}>3 Stars</option>
                    <option value={2}>2 Stars</option>
                    <option value={1}>1 Star</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Service Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as 'all' | 'taxi' | 'delivery')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="taxi">Taxi</option>
                    <option value="delivery">Delivery</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {viewMode === 'all' ? (
            // All Reviews View
            <div className="space-y-4">
              {filteredRatings.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No reviews found
                </div>
              ) : (
                filteredRatings.map((rating) => (
                  <div
                    key={rating.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {rating.raterUserName}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">rated</span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {rating.ratedUserName}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full capitalize">
                            {rating.postType}
                          </span>
                        </div>
                        {renderStars(rating.rating)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(rating.createdAt)}
                      </div>
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded p-3">
                      "{rating.review}"
                    </p>
                  </div>
                ))
              )}
            </div>
          ) : (
            // By Driver View
            <div className="space-y-4">
              {filteredUserStats.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No drivers found
                </div>
              ) : (
                filteredUserStats.map((user) => (
                  <div
                    key={user.userId}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {user.userName}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user.totalRatings} {user.totalRatings === 1 ? 'review' : 'reviews'}
                        </p>
                      </div>
                      {renderStars(user.averageRating)}
                    </div>
                    
                    {/* Recent Reviews */}
                    <div className="space-y-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Recent Reviews:
                      </div>
                      {user.ratings.slice(0, 3).map((rating) => (
                        <div key={rating.id} className="bg-gray-50 dark:bg-gray-700/50 rounded p-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              {renderStars(rating.rating)}
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                by {rating.raterUserName}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(rating.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            "{rating.review}"
                          </p>
                        </div>
                      ))}
                      {user.ratings.length > 3 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                          + {user.ratings.length - 3} more reviews
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Ratings;
