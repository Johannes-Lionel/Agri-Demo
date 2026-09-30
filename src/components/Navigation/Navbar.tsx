import React from 'react';
import { 
  Scan, LayoutDashboard, UserCheck, Layers, 
  FileText, Settings, ShieldCheck, LogIn, LogOut, Sparkles 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type ActivePage = 
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

  const navItems = [
    { id: 'dashboard' as ActivePage, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new_inspection' as ActivePage, label: 'New Inspection', icon: Scan, highlight: true },
    { 
      id: 'human_review' as ActivePage, 
      label: 'Human Review', 
      icon: UserCheck, 
      badge: pendingReviewCount > 0 ? pendingReviewCount : undefined 
    },
    { id: 'batch_analytics' as ActivePage, label: 'Batches', icon: Layers },
    { id: 'reports' as ActivePage, label: 'Reports', icon: FileText },
    { id: 'settings' as ActivePage, label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-stone-950/90 backdrop-blur-md border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div 
            onClick={() => onNavigate(user ? 'dashboard' : 'landing')} 
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black text-xl">
              🧅
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white">
                  Agri<span className="text-emerald-400">Grade</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                  AI Vision
                </span>
              </div>
              <p className="text-[11px] text-stone-400 hidden sm:block">Automated Vegetable Quality Grading Platform</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-stone-850 text-emerald-400 border border-stone-700/80 shadow-sm'
                      : item.highlight
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/60'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold animate-pulse border border-amber-500/40">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute -bottom-[1px] left-3 right-3 h-[2px] bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile / Auth State */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-stone-200">{user.displayName}</div>
                  <div className="text-[10px] text-emerald-400 font-mono capitalize">{user.role} • {user.facilityName.split(' ')[0]}</div>
                </div>
                <button
                  onClick={() => signOut()}
                  title="Sign Out"
                  className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-900 border border-stone-800 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('auth')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Inspector Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
