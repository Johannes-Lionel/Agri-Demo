import React from 'react';
import { Scan, ClipboardCheck, Calculator, BookOpen, BarChart3, Sparkles } from 'lucide-react';

export type NavTab = 'scanner' | 'batches' | 'economics' | 'standards' | 'analytics';

interface HeaderProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  batchCount: number;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onTabChange, batchCount }) => {
  const tabs = [
    { id: 'scanner' as NavTab, label: 'Visual Inspection', icon: Scan },
    { id: 'batches' as NavTab, label: 'Lot Certificates', icon: ClipboardCheck, badge: batchCount },
    { id: 'economics' as NavTab, label: 'Yield Economics', icon: Calculator },
    { id: 'standards' as NavTab, label: 'Grading Standards', icon: BookOpen },
    { id: 'analytics' as NavTab, label: 'Packhouse Insights', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-stone-900/90 backdrop-blur-md border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('scanner')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black text-xl">
              🌾
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white">Agri<span className="text-emerald-400">Grade</span></span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                  v2.4 Pro
                </span>
              </div>
              <p className="text-xs text-stone-400 hidden sm:block">Automated Agricultural Produce Quality & Grading System</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="flex items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-stone-800 text-emerald-400 shadow-sm border border-stone-700/60'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-stone-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.2 text-[10px] rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                      {tab.badge}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute -bottom-[1px] left-3 right-3 h-[2px] bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
