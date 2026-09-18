import React, { useState, useEffect } from 'react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Check if already installed / standalone
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(isStandaloneMode);

    // Check if dismissed recently
    try {
      const dismissedAt = localStorage.getItem('track24_pwa_dismissed');
      if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < 86400000 * 3) {
        setIsDismissed(true);
      }
    } catch {}

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsDismissed(true);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem('track24_pwa_dismissed', Date.now().toString());
    } catch {}
  };

  if (isStandalone || isDismissed || (!deferredPrompt && !isIos)) {
    return null;
  }

  return (
    <>
      <div className="wp-pwa-banner wp-glass">
        <div className="wp-pwa-icon">
          <i className="fa-solid fa-plane-up"></i>
        </div>
        <div className="wp-pwa-info">
          <div className="wp-pwa-title">Install Track 24 App</div>
          <div className="wp-pwa-sub">Full-screen radar & live telemetry alerts</div>
        </div>
        <div className="wp-pwa-actions">
          <button className="wp-pwa-install-btn" onClick={handleInstallClick}>
            Install
          </button>
          <button className="wp-pwa-close-btn" onClick={handleDismiss} title="Dismiss">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      {showIosGuide && (
        <div className="wp-modal-backdrop" onClick={() => setShowIosGuide(false)}>
          <div className="wp-ios-guide-modal wp-glass" onClick={(e) => e.stopPropagation()}>
            <div className="wp-ios-guide-header">
              <div className="wp-ios-title">
                <i className="fa-brands fa-apple" style={{ marginRight: '6px' }}></i>
                Install on iPhone / iPad
              </div>
              <button className="wp-close-btn" onClick={() => setShowIosGuide(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="wp-ios-steps">
              <div className="wp-ios-step">
                <div className="step-num">1</div>
                <div>Tap the <strong>Share</strong> button <i className="fa-solid fa-arrow-up-from-bracket" style={{ color: 'var(--color-accent)' }}></i> at the bottom of Safari.</div>
              </div>
              <div className="wp-ios-step">
                <div className="step-num">2</div>
                <div>Scroll down and select <strong>Add to Home Screen</strong> <i className="fa-regular fa-square-plus" style={{ color: '#34d399' }}></i>.</div>
              </div>
              <div className="wp-ios-step">
                <div className="step-num">3</div>
                <div>Tap <strong>Add</strong> in the top-right corner to launch Track 24 as a native web app!</div>
              </div>
            </div>
            <button className="wp-btn-primary" style={{ width: '100%', marginTop: '14px' }} onClick={() => setShowIosGuide(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
