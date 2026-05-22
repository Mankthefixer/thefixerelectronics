import React from 'react';
import { useAuth } from '../AuthContext';
import { LogIn, LogOut, Shield, ShoppingBag, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  onAdminClick: () => void;
  onHomeClick: () => void;
  onDashboardClick: () => void;
  onAboutClick: () => void;
  onRatingsClick: () => void;
  onAuthClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onAdminClick, onHomeClick, onDashboardClick, onAboutClick, onRatingsClick, onAuthClick }) => {
  const { user, profile, signOut, isAdmin } = useAuth();

  return (
    <nav className="bg-white border-b border-black/5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center cursor-pointer group" onClick={onHomeClick}>
            <div className="bg-emerald-600 p-2 rounded-2xl group-hover:rotate-12 transition-transform">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <span className="ml-3 text-xl font-black tracking-tight text-zinc-900">Thefixer Electronics</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <button onClick={onHomeClick} className="text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors">Shop</button>
            <button onClick={onAboutClick} className="text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors">About Developer</button>
            <button onClick={onRatingsClick} className="text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors">Ratings</button>
            {user && (
              <button onClick={onDashboardClick} className="text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors">Dashboard</button>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {isAdmin && (
              <button
                onClick={onAdminClick}
                className="flex items-center space-x-1 text-zinc-600 hover:text-emerald-600 transition-colors"
              >
                <Shield className="h-5 w-5" />
                <span className="hidden sm:inline font-bold">Admin</span>
              </button>
            )}

            {user ? (
              <div className="flex items-center space-x-4">
                <button 
                  onClick={onDashboardClick}
                  className="flex items-center space-x-2 p-1 pr-3 bg-zinc-50 rounded-full border border-black/5 hover:bg-zinc-100 transition-all"
                >
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="" className="h-8 w-8 rounded-full border border-black/5" referrerPolicy="no-referrer" />
                  ) : (
                    <UserIcon className="h-8 w-8 p-1 rounded-full bg-zinc-200 text-zinc-600" />
                  )}
                  <span className="hidden sm:inline text-sm font-bold text-zinc-700">{profile?.displayName?.split(' ')[0]}</span>
                </button>
                <button
                  onClick={signOut}
                  className="flex items-center space-x-2 px-4 py-2 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={onAuthClick}
                  className="text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors px-4"
                >
                  Login
                </button>
                <button
                  onClick={onAuthClick}
                  className="bg-zinc-900 text-white px-6 py-2.5 rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
