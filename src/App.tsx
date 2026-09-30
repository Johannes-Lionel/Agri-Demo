import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar, ActivePage } from './components/Navigation/Navbar';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { NewInspectionPage } from './pages/NewInspectionPage';
import { HumanReviewPage } from './pages/HumanReviewPage';
import { BatchAnalyticsPage } from './pages/BatchAnalyticsPage';
import { ReportsPage } from './pages/ReportsPage';
import { VerificationPage } from './pages/VerificationPage';
import { SettingsPage } from './pages/SettingsPage';
import { firestoreService } from './services/firestoreService';

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<ActivePage>('dashboard');
  const [pendingReviewCount, setPendingReviewCount] = useState<number>(0);
  const [verifyReportId, setVerifyReportId] = useState<string>('rep-on-2026-01');

  // Detect URL path like /verify/:reportId
  useEffect(() => {
    const pathname = window.location.pathname;
    if (pathname.startsWith('/verify/')) {
      const id = pathname.replace('/verify/', '');
      if (id) {
        setVerifyReportId(id);
        setCurrentPage('verify');
      }
    } else if (!user) {
      setCurrentPage('landing');
    }
  }, [user]);

  // Load pending reviews count
  useEffect(() => {
    const checkPending = async () => {
      try {
        const list = await firestoreService.getPendingReviews();
        setPendingReviewCount(list.length);
      } catch (err) {
        // silent
      }
    };
    checkPending();
    const interval = setInterval(checkPending, 8000);
    return () => clearInterval(interval);
  }, [currentPage]);

  const handleOpenPublicVerification = (reportId: string) => {
    setVerifyReportId(reportId);
    setCurrentPage('verify');
    window.history.pushState({}, '', `/verify/${reportId}`);
  };

  const handleBackToApp = () => {
    setCurrentPage(user ? 'dashboard' : 'landing');
    window.history.pushState({}, '', '/');
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      {/* Hide main navbar on public QR verification page to present a clean verification experience */}
      {currentPage !== 'verify' && (
        <Navbar
          currentPage={currentPage}
          onNavigate={(p) => {
            setCurrentPage(p);
            window.history.pushState({}, '', '/');
          }}
          pendingReviewCount={pendingReviewCount}
        />
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentPage === 'landing' && <LandingPage onNavigate={setCurrentPage} />}
        {currentPage === 'auth' && <AuthPage onNavigate={setCurrentPage} />}
        {currentPage === 'dashboard' && <DashboardPage onNavigate={setCurrentPage} />}
        {currentPage === 'new_inspection' && <NewInspectionPage onNavigate={setCurrentPage} />}
        {currentPage === 'human_review' && <HumanReviewPage onNavigate={setCurrentPage} />}
        {currentPage === 'batch_analytics' && <BatchAnalyticsPage onNavigate={setCurrentPage} />}
        {currentPage === 'reports' && (
          <ReportsPage
            onNavigate={setCurrentPage}
            onOpenPublicVerification={handleOpenPublicVerification}
          />
        )}
        {currentPage === 'verify' && (
          <VerificationPage reportId={verifyReportId} onBackToApp={handleBackToApp} />
        )}
        {currentPage === 'settings' && <SettingsPage />}
      </main>

      <footer className="border-t border-stone-900 bg-stone-950 py-6 text-stone-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>🧅 AgriGrade AI Vegetable Quality Inspection Platform</span>
            <span>•</span>
            <span>Allium cepa Core Engine</span>
          </div>
          <div className="flex items-center gap-4 text-stone-400">
            <span>Replaceable AI Service Interface</span>
            <span>•</span>
            <span>Firestore Ledger</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
