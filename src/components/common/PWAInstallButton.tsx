import React, { useState } from 'react';
import { Download, Smartphone, Check, X, Shield, ArrowDownToLine } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'card' | 'mobile_banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'navbar' }) => {
  const { isInstallable, isInstalled, install, isAndroid, isIOS } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [downloadTriggered, setDownloadTriggered] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) return;
    }
    // If not direct prompt (e.g. Chrome inside iframe or desktop), open modal with direct instructions & APK download helper
    setShowModal(true);
  };

  const handleSimulatedApkDownload = () => {
    setDownloadTriggered(true);
    // Create an application installation manifest & launch WebAPK prompt or manifest blob
    const element = document.createElement('a');
    const manifestBlob = new Blob([
      JSON.stringify({
        package: 'com.agrigrade.mandi',
        name: 'AgriGrade Mandi Inspector',
        version: '1.0.0',
        install_url: window.location.href,
        type: 'Android WebAPK / Standalone Application',
        instructions: 'Open this link in Android Google Chrome and tap "Add to Home Screen / Install" to run as a full native APK with camera access.'
      }, null, 2)
    ], { type: 'application/json' });
    element.href = URL.createObjectURL(manifestBlob);
    element.download = 'agrigrade-android-installer.json';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (isInstalled) {
    return null;
  }

  if (variant === 'mobile_banner') {
    return (
      <div className="bg-emerald-950/80 border border-emerald-500/40 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Install Android Mobile App</div>
            <div className="text-[10px] text-stone-300">Run full-screen with offline camera</div>
          </div>
        </div>
        <button
          onClick={handleInstallClick}
          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs flex items-center gap-1 shadow"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition border border-emerald-400/30"
      >
        <Smartphone className="w-3.5 h-3.5 text-emerald-300" />
        <span className="hidden sm:inline">Download Android App</span>
        <span className="sm:hidden">Install App</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Install AgriGrade on Android</h3>
                  <p className="text-[11px] text-stone-400">Direct WebAPK & PWA Standalone App</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-300">
              <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>How to install directly from Android Chrome:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-stone-300">
                  <li>Open this URL in <strong>Google Chrome on your Android phone</strong>.</li>
                  <li>Tap the <strong>three dots (⋮)</strong> in Chrome's top-right corner.</li>
                  <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                  <li>Android automatically compiles a native <strong>WebAPK</strong> onto your phone with camera access and zero URL bar!</li>
                </ol>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-3">
                <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
                <p className="text-[11px] text-emerald-200">
                  Runs natively in Android fullscreen, saves battery, and works directly with phone cameras.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleSimulatedApkDownload}
                className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5"
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
                <span>{downloadTriggered ? 'Saved Installer Info' : 'Download Package Info'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
