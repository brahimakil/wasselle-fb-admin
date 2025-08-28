import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserService } from '../services/userService';
import { VehicleService } from '../services/vehicleService';
import type { Vehicle } from '../types/vehicle';
import type { User } from '../types/user';
import type { CreateVehicleData } from '../types/vehicle';
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

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  const [homeLocations, setHomeLocations] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showCreateVehicleModal, setShowCreateVehicleModal] = useState(false);
  const [selectedUserForVehicle, setSelectedUserForVehicle] = useState<User | null>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/admin/dashboard', icon: HomeIcon },
    { id: 'users', label: 'Users', path: '/admin/users', icon: PersonIcon },
    { id: 'posts', label: 'Posts', path: '/admin/posts', icon: RocketIcon },
    { id: 'subscriptions', label: 'Subscriptions', path: '/admin/subscriptions', icon: CheckCircledIcon },
    { id: 'wallets', label: 'Wallets', path: '/admin/wallets', icon: TokensIcon },
    { id: 'cashouts', label: 'Cashouts', path: '/admin/cashouts', icon: TokensIcon }, // Use TokensIcon (different from wallets)
    { id: 'payment-methods', label: 'Payment Methods', path: '/admin/payment-methods', icon: CardStackIcon },
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
  ];

  useEffect(() => {
    const fetchHomeLocations = async () => {
      try {
        const locations = await UserService.getHomeLocations();
        setHomeLocations(locations);
      } catch (error) {
        console.error('Error fetching home locations:', error);
      }
    };

    fetchHomeLocations();
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

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleLocationFilter = (location: string) => {
    navigate(`/admin/users?location=${encodeURIComponent(location)}`);
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
        <nav className="flex-1 p-4">
          <ul className={`space-y-2 ${isCollapsed ? 'space-y-3' : ''}`}>
            {navItems.map((item) => (
              <li key={item.id}>
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
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Home Locations Filter - only show when not collapsed */}
          {!isCollapsed && homeLocations.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowLocationFilter(!showLocationFilter)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <span>User Locations</span>
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
                      key={location}
                      onClick={() => handleLocationFilter(location)}
                      className="block w-full text-left px-3 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors truncate"
                      title={location}
                    >
                      {location}
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
