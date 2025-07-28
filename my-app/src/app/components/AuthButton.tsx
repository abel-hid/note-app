import React from 'react';
import { AuthButtonProps } from '../types';

const AuthButton: React.FC<AuthButtonProps> = ({ children, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
    >
      {children}
    </button>
  );
};

export default AuthButton;