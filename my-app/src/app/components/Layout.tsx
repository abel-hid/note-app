'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { User } from '../types';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, logout } = useAuth();
  const pathname = usePathname();
  
  const nav = !['/login', '/signup'].includes(pathname);

  return (
    <div className="flex flex-col min-h-screen">
      {nav && (
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="text-xl font-bold text-indigo-600">
                  NotesApp
                </Link>
              </div>
              
            </div>
          </div>
        </nav>
      )}
      
      <main className="flex-grow">
        {children}
      </main>
      
      {nav && (
        <footer className="bg-gray-50 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Notes App. All rights reserved.
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;