import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogIn, UserCheck, Sparkles, Building2 } from 'lucide-react';
import { ActivePage } from '../components/Navigation/Navbar';

interface AuthPageProps {
  onNavigate: (page: ActivePage) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onNavigate }) => {
  const { user, signInWithGoogle, signInAsDemo, loading } = useAuth();

  const handleDemoLogin = (role: 'inspector' | 'manager' | 'admin') => {
    signInAsDemo(role);
    onNavigate('dashboard');
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 space-y-8 animate-in fade-in">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-xl shadow-emerald-500/20 text-white font-black text-3xl mx-auto">
          🧅
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Inspector Authentication</h1>
        <p className="text-xs text-stone-400">
          Sign in to access accredited vegetable inspection queues, batch certification, and audit reports.
        </p>
      </div>

      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Google Authentication Button */}
        <button
          type="button"
          disabled={loading}
          onClick={async () => {
            await signInWithGoogle();
            onNavigate('dashboard');
          }}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-stone-100 text-stone-900 font-bold text-sm shadow-md transition disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-stone-800 w-full" />
          <span className="bg-stone-900 px-3 text-[11px] text-stone-500 uppercase tracking-wider font-semibold">
            Or Test with Demo Role
          </span>
          <div className="border-t border-stone-800 w-full" />
        </div>

        {/* Demo Roles */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => handleDemoLogin('inspector')}
            className="w-full p-3 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-left transition flex items-center justify-between group"
          >
            <div>
              <div className="text-xs font-bold text-stone-200 group-hover:text-emerald-400">
                Produce Inspector
              </div>
              <div className="text-[10px] text-stone-500">Run camera inspections, log batches</div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
              Inspector
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin('manager')}
            className="w-full p-3 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-left transition flex items-center justify-between group"
          >
            <div>
              <div className="text-xs font-bold text-stone-200 group-hover:text-blue-400">
                Quality Assurance Manager
              </div>
              <div className="text-[10px] text-stone-500">Review flagged lots & certify reports</div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono">
              Manager
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin('admin')}
            className="w-full p-3 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-left transition flex items-center justify-between group"
          >
            <div>
              <div className="text-xs font-bold text-stone-200 group-hover:text-amber-400">
                System Administrator
              </div>
              <div className="text-[10px] text-stone-500">Configure AI models & grading thresholds</div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono">
              Admin
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
