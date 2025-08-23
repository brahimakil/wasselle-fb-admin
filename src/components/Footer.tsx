import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-3">
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <p>© 2024 Wasselle Admin Panel. All rights reserved.</p>
        <p>Version 1.0.0</p>
      </div>
    </footer>
  );
};

export default Footer;
