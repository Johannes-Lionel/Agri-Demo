import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar, ActivePage } from './components/Navigation/Navbar';
import { SplashScreen } from './pages/SplashScreen';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
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
  const [verifyReportId, setVerifyReportId] = useState<string>('AO-2029-4142');
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(null);

  // Check if first-time visitor to show Splash screen
  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('agrigrade_splash_shown');
    const pathname = window.location.pathname;

    if (pathname.startsWith('/verify/')) {
      const id = pathname.replace('/verify/', '');
      if (id) {
        setVerifyReportId(id);
        setCurrentPage('verify');
      }
    } else if (!hasSeenSplash) {
      setCurrentPage('splash');
    } else {
      setCurrentPage('dashboard');
    }
  }, []);

  // Polling pending reviews count
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

  const handleStartFromSplash = () => {
    sessionStorage.setItem('agrigrade_splash_shown', 'true');
    setCurrentPage('dashboard');
  };

  const handleFileFromHome = (dataUrl: string) => {
    setUploadedDataUrl(dataUrl);
    setCurrentPage('new_inspection');
  };

  const handleOpenPublicVerification = (reportId: string) => {
    setVerifyReportId(reportId);
    setCurrentPage('verify');
    window.history.pushState({}, '', `/verify/${reportId}`);
  };

  const handleBackToApp = () => {
    setCurrentPage('dashboard');
    window.history.pushState({}, '', '/');
  };

  return (
    <div className="min-h-screen bg-[#F4EBDC] text-[#0F1A13] flex flex-col font-sans select-none">
      {/* Hide header and navbar on Splash and Verification screens */}
      {currentPage !== 'splash' && currentPage !== 'verify' && (
        <Navbar
          currentPage={currentPage}
          onNavigate={(p) => {
            setCurrentPage(p);
            window.history.pushState({}, '', '/');
          }}
          pendingReviewCount={pendingReviewCount}
        />
      )}

      <main className="flex-1 w-full max-w-md mx-auto px-4 py-4">
        {currentPage === 'splash' && <SplashScreen onStart={handleStartFromSplash} />}
        {currentPage === 'dashboard' && (
          <HomePage
            onNavigate={setCurrentPage}
            onFileSelected={handleFileFromHome}
          />
        )}
        {currentPage === 'auth' && <AuthPage onNavigate={setCurrentPage} />}
        {currentPage === 'new_inspection' && (
          <NewInspectionPage
            onNavigate={setCurrentPage}
            initialImageDataUrl={uploadedDataUrl}
          />
        )}
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
