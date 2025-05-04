import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiAlertTriangle, FiHome, FiArrowLeft } from 'react-icons/fi';
import { Button } from '../components/common';
import { useAuth } from '../contexts/AuthContext';

const Unauthorized: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center">
          <FiAlertTriangle className="h-16 w-16 text-yellow-500" />
        </div>
        <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
          {t('unauthorized.title', 'Access Denied')}
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          {t('unauthorized.message', "You don't have permission to access this page.")}
        </p>
        
        {user && (
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t('unauthorized.loggedInAs', 'You are logged in as:')} <span className="font-semibold">{user.name}</span>
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t('unauthorized.currentRole', 'Current role:')} <span className="font-semibold">{user.role}</span>
            </p>
          </div>
        )}
        
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/">
            <Button className="w-full sm:w-auto flex items-center justify-center">
              <FiHome className="mr-2" />
              {t('unauthorized.goHome', 'Go to Home')}
            </Button>
          </Link>
          <Button 
            onClick={() => window.history.back()}
            className="w-full sm:w-auto flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
          >
            <FiArrowLeft className="mr-2" />
            {t('unauthorized.goBack', 'Go Back')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
