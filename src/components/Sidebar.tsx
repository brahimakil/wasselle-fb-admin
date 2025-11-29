import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserService } from '../services/userService';
import { VehicleService } from '../services/vehicleService';
import type { Vehicle } from '../types/vehicle';
import type { User } from '../types/user';
import type { CreateVehicleData } from '../types/vehicle';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  HomeIcon, 
  PersonIcon, 
  FileTextIcon, 
  CardStackIcon,
  GlobeIcon,
  ExitIcon,
  HamburgerMenuIcon,
  Cross1Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  EyeOpenIcon,
  EyeClosedIcon,
  TrashIcon,
  Cross2Icon,
  UploadIcon,
  RocketIcon,
  TokensIcon,
  CheckCircledIcon
} from '@radix-ui/react-icons';
import EditVehicleModal from './EditVehicleModal';
import CreateVehicleModal from './CreateVehicleModal';
import AutocompleteInput from './AutocompleteInput';
import { CountryService } from '../services/countryService';

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    'money-management': false,
    'user-management': false,
    'settings': false,
    'countries-vehicles': false,
  });
  const [homeLocations, setHomeLocations] = useState<Array<{id: string, name: string, flag?: string}>>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showCreateVehicleModal, setShowCreateVehicleModal] = useState(false);
  const [selectedUserForVehicle, setSelectedUserForVehicle] = useState<User | null>(null);
  const [pendingCounts, setPendingCounts] = useState({
    users: 0,
    vehicles: 0,
    cashouts: 0,
    wallets: 0,
    livePosts: 0,
    reports: 0
  });
  const { logout } = useAuth();
  const navigate = useNavigate();

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/admin/dashboard', icon: HomeIcon },
    
    // Money Management Section
    {
      id: 'money-management',
      label: 'Money Management',
      icon: TokensIcon,
      isSection: true,
      children: [
        { id: 'cashouts', label: 'Cashouts', path: '/admin/cashouts', icon: TokensIcon },
        { id: 'payment-methods', label: 'Payment Methods', path: '/admin/payment-methods', icon: CardStackIcon },
        { id: 'wallets', label: 'Wallets', path: '/admin/wallets', icon: TokensIcon },
      ]
    },

    // User & Post Management Section
    {
      id: 'user-management',
      label: 'Users & Posts',
      icon: PersonIcon,
      isSection: true,
      children: [
        { id: 'users', label: 'Users', path: '/admin/users', icon: PersonIcon },
        { 
          id: 'live-taxi', 
          label: 'Live Posts', 
          path: '/admin/live-taxi', 
          icon: ({ className }) => <span className={className}>🚕</span>
        },
        { 
          id: 'ratings', 
          label: 'Ratings & Reviews', 
          path: '/admin/ratings', 
          icon: ({ className }) => <span className={className}>⭐</span>
        },
        { 
          id: 'reports', 
          label: 'Reports', 
          path: '/admin/reports', 
          icon: ({ className }) => <span className={className}>🚩</span>
        },
      ]
    },

    // Settings Section
    {
      id: 'settings',
      label: 'Settings & Notifications',
      icon: ({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      isSection: true,
      children: [
        {
          id: 'app-settings',
          label: 'App Settings',
          path: '/admin/settings',
          icon: ({ className }) => (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )
        },
        {
          id: 'weight-brackets',
          label: 'Weight Brackets',
          path: '/admin/weight-brackets',
          icon: ({ className }) => (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M3 12h18M3 18h18" />
              <circle cx="8" cy="12" r="2" fill="currentColor" />
              <circle cx="16" cy="12" r="2" fill="currentColor" />
            </svg>
          )
        },
        { 
          id: 'notifications', 
          label: 'Send Notifications', 
          path: '/admin/notifications', 
          icon: ({ className }) => <span className={className}>🔔</span>
        },
      ]
    },

    // Countries & Vehicles Section
    {
      id: 'countries-vehicles',
      label: 'Countries & Vehicles',
      icon: GlobeIcon,
      isSection: true,
      children: [
        { id: 'countries', label: 'Countries', path: '/admin/countries', icon: GlobeIcon },
        {
          id: 'vehicles',
          label: 'Vehicles',
          path: '/admin/vehicles',
          icon: ({ className }) => (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
          )
        },
        {
          id: 'blacklist',
          label: 'Blacklisted Plates',
          path: '/admin/blacklist',
          icon: ({ className }) => (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-1.414 1.414A7.963 7.963 0 0116 12a7.963 7.963 0 01-1.05 4.95l1.414 1.414A9.967 9.967 0 0020 12a9.967 9.967 0 00-1.636-6.364zM5.636 18.364l1.414-1.414A7.963 7.963 0 018 12a7.963 7.963 0 011.05-4.95L7.636 5.636A9.967 9.967 0 004 12a9.967 9.967 0 001.636 6.364z" />
            </svg>
          )
        },
      ]
    },
  ];

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const countries = await UserService.getHomeLocations();
        setHomeLocations(countries);
      } catch (error) {
        console.error('Error fetching countries:', error);
      }
    };

    fetchCountries();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await UserService.getUsers();
        setUsers(users);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  // Real-time listener for pending counts
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // Listen to pending users (not verified)
    const usersQuery = query(
      collection(db, 'users'),
      where('isVerified', '==', false),
      where('isActive', '==', true)
    );
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      setPendingCounts(prev => ({ ...prev, users: snapshot.size }));
    });
    unsubscribers.push(unsubUsers);

    // Listen to pending vehicles (not active - awaiting approval)
    const vehiclesQuery = query(
      collection(db, 'vehicles'),
      where('isActive', '==', false)
    );
    const unsubVehicles = onSnapshot(vehiclesQuery, (snapshot) => {
      setPendingCounts(prev => ({ ...prev, vehicles: snapshot.size }));
    });
    unsubscribers.push(unsubVehicles);

    // Listen to pending cashout transactions
    const cashoutsQuery = query(
      collection(db, 'transactions'),
      where('type', '==', 'cashout'),
      where('status', '==', 'pending')
    );
    const unsubCashouts = onSnapshot(cashoutsQuery, (snapshot) => {
      setPendingCounts(prev => ({ ...prev, cashouts: snapshot.size }));
    });
    unsubscribers.push(unsubCashouts);

    // Listen to pending wallet transactions (recharge)
    const walletsQuery = query(
      collection(db, 'transactions'),
      where('type', '==', 'recharge'),
      where('status', '==', 'pending')
    );
    const unsubWallets = onSnapshot(walletsQuery, (snapshot) => {
      setPendingCounts(prev => ({ ...prev, wallets: snapshot.size }));
    });
    unsubscribers.push(unsubWallets);

    // Listen to live posts with waiting status
    const livePostsQuery = query(
      collection(db, 'liveTaxiPosts'),
      where('status', '==', 'waiting')
    );
    const unsubLivePosts = onSnapshot(livePostsQuery, (snapshot) => {
      setPendingCounts(prev => ({ ...prev, livePosts: snapshot.size }));
    });
    unsubscribers.push(unsubLivePosts);

    // Listen to pending reports
    const reportsQuery = query(
      collection(db, 'reports'),
      where('status', '==', 'pending')
    );
    const unsubReports = onSnapshot(reportsQuery, (snapshot) => {
      setPendingCounts(prev => ({ ...prev, reports: snapshot.size }));
    });
    unsubscribers.push(unsubReports);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleLocationFilter = (countryId: string) => {
    navigate(`/admin/users?location=${encodeURIComponent(countryId)}`);
  };

  const handleCreateVehicleSuccess = () => {
    setShowCreateVehicleModal(false);
    setSelectedUserForVehicle(null);
  };

  return (
    <aside className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      <div className="flex flex-col h-full">
        {/* Logo and Toggle */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
              Admin Panel
            </h1>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              isCollapsed ? 'mx-auto' : ''
            }`}
          >
            {isCollapsed ? (
              <HamburgerMenuIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            ) : (
              <Cross1Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className={`space-y-2 ${isCollapsed ? 'space-y-3' : ''}`}>
            {navItems.map((item: any) => {
              if (item.isSection) {
                // Section with dropdown
                const isExpanded = expandedSections[item.id];
                const totalPendingInSection = item.children?.reduce((sum: number, child: any) => {
                  const getChildCount = () => {
                    switch (child.id) {
                      case 'users': return pendingCounts.users;
                      case 'vehicles': return pendingCounts.vehicles;
                      case 'cashouts': return pendingCounts.cashouts;
                      case 'wallets': return pendingCounts.wallets;
                      case 'live-taxi': return pendingCounts.livePosts;
                      case 'reports': return pendingCounts.reports;
                      default: return 0;
                    }
                  };
                  return sum + getChildCount();
                }, 0);

                return (
                  <li key={item.id}>
                    <button
                      onClick={() => toggleSection(item.id)}
                      className={`flex items-center w-full ${
                        isCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-2'
                      } rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <item.icon className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} ${isCollapsed ? '' : 'mr-3'}`} />
                      {!isCollapsed && (
                        <>
                          <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                          {totalPendingInSection > 0 && (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[20px] mr-2">
                              {totalPendingInSection > 99 ? '99+' : totalPendingInSection}
                            </span>
                          )}
                          {isExpanded ? (
                            <ChevronDownIcon className="w-4 h-4" />
                          ) : (
                            <ChevronRightIcon className="w-4 h-4" />
                          )}
                        </>
                      )}
                    </button>
                    
                    {/* Children items */}
                    {!isCollapsed && isExpanded && item.children && (
                      <ul className="mt-1 ml-4 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-2">
                        {item.children.map((child: any) => {
                          const getNotificationCount = () => {
                            switch (child.id) {
                              case 'users': return pendingCounts.users;
                              case 'vehicles': return pendingCounts.vehicles;
                              case 'cashouts': return pendingCounts.cashouts;
                              case 'wallets': return pendingCounts.wallets;
                              case 'live-taxi': return pendingCounts.livePosts;
                              case 'reports': return pendingCounts.reports;
                              default: return 0;
                            }
                          };
                          const count = getNotificationCount();

                          return (
                            <li key={child.id} className="relative">
                              <NavLink
                                to={child.path}
                                className={({ isActive }) =>
                                  `flex items-center px-3 py-1.5 rounded-lg transition-colors text-sm ${
                                    isActive
                                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                  }`
                                }
                              >
                                <child.icon className="w-4 h-4 mr-2" />
                                <span className="flex-1">{child.label}</span>
                                {count > 0 && (
                                  <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[20px]">
                                    {count > 99 ? '99+' : count}
                                  </span>
                                )}
                              </NavLink>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }

              // Regular nav item (Dashboard)
              return (
                <li key={item.id} className="relative">
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center ${isCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-2'} rounded-lg transition-colors group ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                      }`
                    }
                    title={isCollapsed ? item.label : undefined}
                  >
                    <item.icon className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} ${isCollapsed ? '' : 'mr-3'}`} />
                    {!isCollapsed && (
                      <span className="text-sm font-medium flex-1">{item.label}</span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>

          {/* Home Locations Filter - only show when not collapsed */}
          {!isCollapsed && homeLocations.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowLocationFilter(!showLocationFilter)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <span>User Countries</span>
                {showLocationFilter ? (
                  <ChevronDownIcon className="w-4 h-4" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4" />
                )}
              </button>
              
              {showLocationFilter && (
                <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                  <button
                    onClick={() => navigate('/admin/users')}
                    className="block w-full text-left px-3 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    All Locations
                  </button>
                  {homeLocations.map((location) => (
                    <button
                      key={location.id}
                      onClick={() => handleLocationFilter(location.id)}
                      className="block w-full text-left px-3 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors truncate"
                      title={`${location.flag} ${location.name}`}
                    >
                      {location.flag} {location.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className={`flex items-center w-full ${isCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-2'} text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group`}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <ExitIcon className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} ${isCollapsed ? '' : 'mr-3'}`} />
            {!isCollapsed && (
              <span className="text-sm font-medium">Logout</span>
            )}
          </button>
        </div>
      </div>

      {/* Create Vehicle Modal */}
      {showCreateVehicleModal && selectedUserForVehicle && (
        <CreateVehicleModal
          onClose={() => setShowCreateVehicleModal(false)}
          onSuccess={handleCreateVehicleSuccess}
          adminId={users.find(u => u.id === selectedUserForVehicle.id)?.id || ''}
          users={users}
          preSelectedUserId={selectedUserForVehicle.id}
        />
      )}
    </aside>
  );
};

export default Sidebar;
