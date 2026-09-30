import React from 'react';
import { 
  Home, History, BarChart3, User, Scan, 
  FileText, Smartphone, LogOut, LogIn 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { AgrigradeLogo } from '../common/AgrigradeLogo';

export type ActivePage = 
  | 'splash'
  | 'landing' 
  | 'dashboard' 
  | 'new_inspection' 
  | 'human_review' 
  | 'batch_analytics' 
  | 'reports' 
  | 'verify' 
  | 'settings'
  | 'auth';

interface NavbarProps {
  currentPage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  pendingReviewCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate, pendingReviewCount }) => {
  const { user, signOut } = useAuth();

  return (
    <>
      {/* Top Header (Beige #F6EDE8) */}
      <header className="sticky top-0 z-40 bg-[#F6EDE8] border-b border-[#E9DFCF] shadow-xs">
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div 
              onClick={() => onNavigate('dashboard')} 
              className="cursor-pointer"
            >
              <AgrigradeLogo size="sm" />
            </div>

            {/* Actions: Install App & User Login */}
            <div className="flex items-center gap-2">
              <PWAInstallButton variant="navbar" />

              {user ? (
                <button
                  onClick={() => signOut()}
                  title="Sign Out"
                  className="p-1.5 rounded-full text-[#23492C] hover:bg-[#EAF2E9] transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => onNavigate('auth')}
                  className="px-3 py-1 rounded-full bg-[#0B7347] hover:bg-[#3F5A3A] text-white font-bold text-xs shadow-xs transition"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Navigation Bar Matching 02 Home & 06 Analytics Screens */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 border-t border-[#E9DFCF] backdrop-blur-md px-6 py-2 shadow-lg safe-area-pb">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {/* Home */}
          <button
            onClick={() => onNavigate('dashboard')}
            className={`flex flex-col items-center gap-1 transition ${
              currentPage === 'dashboard' ? 'text-[#0B7347]' : 'text-[#0F1A13]/50 hover:text-[#23492C]'
            }`}
          >
            <Home className="w-5 h-5 stroke-[2.2]" />
            <span className={`text-[10px] ${currentPage === 'dashboard' ? 'font-bold' : 'font-medium'}`}>
              Home
            </span>
          </button>

          {/* History / Batches */}
          <button
            onClick={() => onNavigate('batch_analytics')}
            className={`flex flex-col items-center gap-1 transition ${
              currentPage === 'batch_analytics' ? 'text-[#0B7347]' : 'text-[#0F1A13]/50 hover:text-[#23492C]'
            }`}
          >
            <BarChart3 className="w-5 h-5 stroke-[2.2]" />
            <span className={`text-[10px] ${currentPage === 'batch_analytics' ? 'font-bold' : 'font-medium'}`}>
              Analytics
            </span>
          </button>

          {/* Center Scan / Smart Capture Button */}
          <button
            onClick={() => onNavigate('new_inspection')}
            className="relative -top-3 flex flex-col items-center"
          >
            <div className="w-12 h-12 rounded-full bg-[#23492C] border-2 border-white shadow-xl flex items-center justify-center text-white active:scale-95 transition-transform">
              <Scan className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-[9px] font-bold text-[#23492C] mt-0.5">Scan</span>
          </button>

          {/* Reports */}
          <button
            onClick={() => onNavigate('reports')}
            className={`flex flex-col items-center gap-1 transition ${
              currentPage === 'reports' ? 'text-[#0B7347]' : 'text-[#0F1A13]/50 hover:text-[#23492C]'
            }`}
          >
            <FileText className="w-5 h-5 stroke-[2.2]" />
            <span className={`text-[10px] ${currentPage === 'reports' ? 'font-bold' : 'font-medium'}`}>
              Reports
            </span>
          </button>

          {/* Profile / Settings */}
          <button
            onClick={() => onNavigate('settings')}
            className={`flex flex-col items-center gap-1 transition ${
              currentPage === 'settings' ? 'text-[#0B7347]' : 'text-[#0F1A13]/50 hover:text-[#23492C]'
            }`}
          >
            <User className="w-5 h-5 stroke-[2.2]" />
            <span className={`text-[10px] ${currentPage === 'settings' ? 'font-bold' : 'font-medium'}`}>
              Profile
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
