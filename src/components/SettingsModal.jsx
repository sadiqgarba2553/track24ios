import React, { useState, useEffect } from 'react';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification
} from '../utils/notifications';

export default function SettingsModal({
  isOpen,
  onClose,
  mapTheme = 'dark',
  setMapTheme,
  showRadar,
  setShowRadar,
  showFir,
  setShowFir,
  map3D,
  setMap3D,
  useMetric,
  setUseMetric,
  onOpenUpload
}) {
  const [notificationPerm, setNotificationPerm] = useState('default');
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNotificationPerm(getNotificationPermission());
    }
  }, [isOpen]);

  const handleEnablePush = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPerm(granted ? 'granted' : 'denied');
    if (granted) {
      await sendTestNotification();
    }
  };

  const handleTestAlert = async () => {
    setIsTesting(true);
    await sendTestNotification();
    setNotificationPerm(getNotificationPermission());
    setTimeout(() => setIsTesting(false), 800);
  };

  if (!isOpen) return null;

  return (
    <div className="wp-modal-backdrop" onClick={onClose}>
      <div className="wp-settings-modal wp-glass" onClick={e => e.stopPropagation()}>
        <div className="wp-settings-header">
          <div className="wp-settings-title">
            <i className="fa-solid fa-sliders" style={{ color: 'var(--color-accent)', marginRight: '8px' }}></i>
            Map & Display Settings
          </div>
          <button className="wp-close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Map Base Style Selector */}
        <div style={{ marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '2px', color: '#ffffff' }}>Map Base Style</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>Select your preferred cartographic projection</div>
          <div className="wp-map-theme-grid">
            <button
              type="button"
              className={`wp-map-theme-card ${mapTheme === 'dark' ? 'active' : ''}`}
              onClick={() => setMapTheme && setMapTheme('dark')}
            >
              <div className="theme-swatch dark"></div>
              <div className="theme-text">
                <span className="theme-title">Dark Matter</span>
                <span className="theme-sub">Night Radar</span>
              </div>
            </button>
            <button
              type="button"
              className={`wp-map-theme-card ${mapTheme === 'light' ? 'active' : ''}`}
              onClick={() => setMapTheme && setMapTheme('light')}
            >
              <div className="theme-swatch light"></div>
              <div className="theme-text">
                <span className="theme-title">Daylight</span>
                <span className="theme-sub">Positron Light</span>
              </div>
            </button>
            <button
              type="button"
              className={`wp-map-theme-card ${mapTheme === 'satellite' ? 'active' : ''}`}
              onClick={() => setMapTheme && setMapTheme('satellite')}
            >
              <div className="theme-swatch satellite"></div>
              <div className="theme-text">
                <span className="theme-title">Satellite</span>
                <span className="theme-sub">Aerial Imagery</span>
              </div>
            </button>
          </div>
        </div>

        {/* Setting 1: Weather Radar */}
        <div className="wp-setting-row">
          <div>
            <div style={{ fontWeight: 600 }}>Weather Radar Overlay</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Real-time precipitation radar tiles</div>
          </div>
          <div
            className={`wp-toggle ${showRadar ? 'active' : ''}`}
            onClick={() => setShowRadar(!showRadar)}
          >
            <div className="wp-toggle-thumb"></div>
          </div>
        </div>

        {/* Setting 2: FIR Airspace Boundaries */}
        <div className="wp-setting-row">
          <div>
            <div style={{ fontWeight: 600 }}>FIR Airspace Boundaries</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Display Flight Information Region borders</div>
          </div>
          <div
            className={`wp-toggle ${showFir ? 'active' : ''}`}
            onClick={() => setShowFir(!showFir)}
          >
            <div className="wp-toggle-thumb"></div>
          </div>
        </div>

        {/* Setting 3: 3D Camera Mode */}
        <div className="wp-setting-row">
          <div>
            <div style={{ fontWeight: 600 }}>3D Map Pitch</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>60° perspective view of terrain & traffic</div>
          </div>
          <div
            className={`wp-toggle ${map3D ? 'active' : ''}`}
            onClick={() => setMap3D(!map3D)}
          >
            <div className="wp-toggle-thumb"></div>
          </div>
        </div>

        {/* Setting 4: Units */}
        <div className="wp-setting-row">
          <div>
            <div style={{ fontWeight: 600 }}>Aviation Units</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {useMetric ? 'Metric (m, km/h)' : 'Aviation Standard (ft, kts)'}
            </div>
          </div>
          <div
            className={`wp-toggle ${useMetric ? 'active' : ''}`}
            onClick={() => setUseMetric(!useMetric)}
          >
            <div className="wp-toggle-thumb"></div>
          </div>
        </div>

        {/* Setting Section: Web App & Push Notifications */}
        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--text-muted)',
          marginTop: '12px',
          marginBottom: '2px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <i className="fa-solid fa-bell" style={{ color: 'var(--color-accent)' }}></i>
          Web App & Push Notifications
        </div>

        <div className="wp-setting-row" style={{ alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Flight Radar Push Alerts</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {notificationPerm === 'granted'
                ? 'Active — alerts for descent, touchdown & emergency squawks'
                : notificationPerm === 'denied'
                ? 'Blocked in browser settings'
                : 'Enable system notifications for tracked flights'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {notificationPerm !== 'granted' && (
              <button
                className="wp-btn-setting-action"
                style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}
                onClick={handleEnablePush}
              >
                <i className="fa-solid fa-bell"></i> Enable
              </button>
            )}
            <button
              className="wp-btn-setting-action"
              onClick={handleTestAlert}
              disabled={isTesting}
            >
              <i className={`fa-solid ${isTesting ? 'fa-spinner fa-spin' : 'fa-bullhorn'}`}></i> {isTesting ? 'Testing…' : 'Test Alert'}
            </button>
          </div>
        </div>

        {/* Setting Section: Aircraft Community Photos */}
        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--text-muted)',
          marginTop: '12px',
          marginBottom: '2px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <i className="fa-solid fa-camera" style={{ color: 'var(--color-accent)' }}></i>
          Aircraft Community Photos
        </div>

        <div className="wp-setting-row" style={{ alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Contribute Aircraft Photo</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Upload livery photos to submit for admin review</div>
          </div>
          <button
            className="wp-btn-setting-action"
            onClick={() => { onClose(); onOpenUpload && onOpenUpload('', ''); }}
          >
            <i className="fa-solid fa-cloud-arrow-up"></i> Upload Photo
          </button>
        </div>

        {/* Info Footer */}
        <div style={{
          marginTop: '6px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div>Flight data via Infinite Flight Live API · Polled every 15s</div>
          <div>Inspired by Waypoint (waypoint-live.app) · Built for Track 24</div>
        </div>
      </div>
    </div>
  );
}
