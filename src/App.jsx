import React, { useState, useEffect, useMemo } from 'react';
import { useInfiniteFlight } from './hooks/useInfiniteFlight';
import LiveMap from './components/LiveMap';
import TopNav from './components/TopNav';
import FloatingPanels from './components/FloatingPanels';
import FlightDrawer from './components/FlightDrawer';
import AirportDrawer from './components/AirportDrawer';
import SearchModal from './components/SearchModal';
import SettingsModal from './components/SettingsModal';
import MobileNav from './components/MobileNav';
import UserProfile from './components/UserProfile';
import Logbook from './components/Logbook';
import Analytics from './components/Analytics';
import CountriesMap from './components/CountriesMap';
import UploadPhotoModal from './components/UploadPhotoModal';
import FleetFilterSidebar from './components/FleetFilterSidebar';
import NotificationToast from './components/NotificationToast';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import MobileBottomSheet from './components/MobileBottomSheet';
import { classifyAircraft } from './utils/aircraftIcons';
import { registerServiceWorker, processFlightTelemetryAlerts } from './utils/notifications';

// Persistent memory storage helper
function getSaved(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function App() {
  const {
    sessions, activeSessionId, flights, atcList, airports,
    switchSession, loading, error, apiConnected, getAircraftName, getLiveryName,
    favorites, toggleFavorite, isFavorite,
    userProfile, updateProfile, fetchPilot, pilotLoading, pilotError,
    logbook, addLogEntry,
    analytics,
    getFlightHistory
  } = useInfiniteFlight();

  // Read URL query parameter for flight sharing / deep link
  const urlFlightId = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('flight');
    } catch {
      return null;
    }
  }, []);

  // Persistent view and flight memory
  const [activeView, setActiveView] = useState(() => getSaved('track24_active_view', 'map'));
  const [selectedFlightId, setSelectedFlightId] = useState(() => urlFlightId || getSaved('track24_selected_flight', null));
  const [selectedAirportIcao, setSelectedAirportIcao] = useState(null);

  // Persistent map settings
  const [mapTheme, setMapTheme] = useState(() => getSaved('track24_mapTheme', 'dark'));
  const [map3D, setMap3D] = useState(() => getSaved('track24_map3D', false));
  const [showRadar, setShowRadar] = useState(() => getSaved('track24_showRadar', false));
  const [showFir, setShowFir] = useState(() => getSaved('track24_showFir', false));
  const [useMetric, setUseMetric] = useState(() => getSaved('track24_useMetric', false));

  // Camera tracking
  const [isFollowMode, setIsFollowMode] = useState(false);
  const [is3DChase, setIs3DChase] = useState(false);

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadData, setUploadData] = useState({ aircraft: '', livery: '' });
  const [mobileTab, setMobileTab] = useState(null);

  const handleOpenUpload = (aircraft = '', livery = '') => {
    setUploadData({ aircraft, livery });
    setIsUploadOpen(true);
  };

  // Fleet quick radar filters
  const [fleetCategoryFilter, setFleetCategoryFilter] = useState('all');
  const [fleetAltFilter, setFleetAltFilter] = useState('all');

  const visibleFlights = useMemo(() => {
    return flights.filter(f => {
      // Category filter
      if (fleetCategoryFilter !== 'all') {
        const cat = classifyAircraft(getAircraftName(f), f.callsign);
        if (fleetCategoryFilter === 'widebody' && !(cat === 'heavy' || cat === 'widebody')) return false;
        if (fleetCategoryFilter === 'narrowbody' && cat !== 'narrowbody') return false;
        if (fleetCategoryFilter === 'cargo') {
          const text = `${f.callsign || ''} ${f.liveryName || ''}`.toLowerCase();
          if (!text.includes('cargo') && !text.includes('fedex') && !text.includes('ups') && !text.includes('dhl') && !text.includes('atlas')) return false;
        }
        if (fleetCategoryFilter === 'military' && cat !== 'fighter') return false;
        if (fleetCategoryFilter === 'ga' && !(cat === 'propeller' || cat === 'turboprop')) return false;
      }

      // Altitude filter
      if (fleetAltFilter !== 'all') {
        const alt = f.altitude || 0;
        if (fleetAltFilter === 'high' && alt < 28000) return false;
        if (fleetAltFilter === 'mid' && (alt < 10000 || alt >= 28000)) return false;
        if (fleetAltFilter === 'low' && (alt >= 10000 || f.isParked)) return false;
      }

      return true;
    });
  }, [flights, fleetCategoryFilter, fleetAltFilter, getAircraftName]);

  // Persist state changes to memory
  useEffect(() => {
    try { localStorage.setItem('track24_active_view', JSON.stringify(activeView)); } catch {}
  }, [activeView]);

  useEffect(() => {
    try {
      if (selectedFlightId) {
        localStorage.setItem('track24_selected_flight', JSON.stringify(selectedFlightId));
        const url = new URL(window.location);
        url.searchParams.set('flight', selectedFlightId);
        window.history.replaceState({}, '', url);
      } else {
        localStorage.removeItem('track24_selected_flight');
        const url = new URL(window.location);
        url.searchParams.delete('flight');
        window.history.replaceState({}, '', url);
      }
    } catch {}
  }, [selectedFlightId]);

  useEffect(() => { try { localStorage.setItem('track24_mapTheme', JSON.stringify(mapTheme)); } catch {} }, [mapTheme]);
  useEffect(() => { try { localStorage.setItem('track24_map3D', JSON.stringify(map3D)); } catch {} }, [map3D]);
  useEffect(() => { try { localStorage.setItem('track24_showRadar', JSON.stringify(showRadar)); } catch {} }, [showRadar]);
  useEffect(() => { try { localStorage.setItem('track24_showFir', JSON.stringify(showFir)); } catch {} }, [showFir]);
  useEffect(() => { try { localStorage.setItem('track24_useMetric', JSON.stringify(useMetric)); } catch {} }, [useMetric]);

  // Register PWA Service Worker
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Monitor live flights for push & in-app radar notifications (descent, touchdown, emergency squawks)
  useEffect(() => {
    if (flights && flights.length > 0) {
      processFlightTelemetryAlerts(flights, isFavorite);
    }
  }, [flights, isFavorite]);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleCloseFlight = () => { setSelectedFlightId(null); setIsFollowMode(false); setIs3DChase(false); };
  const handleSelectFlight = (fid) => { setSelectedFlightId(fid); setSelectedAirportIcao(null); };
  const handleSelectAirport = (icao) => { setSelectedAirportIcao(icao); setSelectedFlightId(null); setIsFollowMode(false); setIs3DChase(false); };

  const handleViewPilot = (userIdOrUsername) => {
    if (userIdOrUsername) {
      fetchPilot(userIdOrUsername);
      setIsProfileOpen(true);
    }
  };

  const selectedFlightObj = flights.find(f => f.flightId === selectedFlightId);
  const activeSessionName = sessions.find(s => s.id === activeSessionId)?.name || 'Live Server';

  // Loading state
  if (loading && sessions.length === 0) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#0a0e16', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div style={{ width: '54px', height: '54px', borderRadius: '50%', border: '2px solid rgba(56,189,248,0.2)', borderTopColor: '#38bdf8', animation: 'spin 0.8s linear infinite' }}></div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8' }}>Connecting to Infinite Flight Live Radar…</div>
      </div>
    );
  }

  return (
    <div className="wp-app-root" style={{ width: '100vw', height: '100dvh', minHeight: '-webkit-fill-available', position: 'relative', overflow: 'hidden', background: '#0a0e16' }}>
      {/* Top Nav — always visible */}
      <TopNav
        sessions={sessions} activeSessionId={activeSessionId} switchSession={switchSession}
        flightCount={flights.length} onOpenSearch={() => setIsSearchOpen(true)}
        mapTheme={mapTheme} setMapTheme={setMapTheme}
        map3D={map3D} setMap3D={setMap3D} showRadar={showRadar} setShowRadar={setShowRadar}
        showFir={showFir} setShowFir={setShowFir} onOpenSettings={() => setIsSettingsOpen(true)}
        activeView={activeView} setActiveView={setActiveView}
        userProfile={userProfile} onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* ══════════ LIVE MAP VIEW ══════════ */}
      {activeView === 'map' && (
        <>
          <FleetFilterSidebar
            categoryFilter={fleetCategoryFilter}
            setCategoryFilter={setFleetCategoryFilter}
            altFilter={fleetAltFilter}
            setAltFilter={setFleetAltFilter}
            totalFlights={flights.length}
            filteredCount={visibleFlights.length}
            onReset={() => {
              setFleetCategoryFilter('all');
              setFleetAltFilter('all');
            }}
            isDrawerOpen={Boolean(selectedFlightId || selectedAirportIcao)}
          />
          <FloatingPanels
            flights={flights} atcList={atcList} airports={airports}
            selectedFlight={selectedFlightId} setSelectedFlight={handleSelectFlight}
            onSelectAirport={handleSelectAirport}
            getAircraftName={getAircraftName} getLiveryName={getLiveryName}
            favorites={favorites} toggleFavorite={toggleFavorite} isFavorite={isFavorite}
          />
          <LiveMap
            flights={visibleFlights} selectedFlight={selectedFlightId} setSelectedFlight={handleSelectFlight}
            airports={airports} onAirportClick={handleSelectAirport}
            selectedAirportIcao={selectedAirportIcao}
            mapTheme={mapTheme}
            map3D={map3D} showFir={showFir} showRadar={showRadar}
            isFollowMode={isFollowMode} is3DChase={is3DChase}
            activeSessionId={activeSessionId}
            getFlightHistory={getFlightHistory}
            getAircraftName={getAircraftName}
          />
          {selectedFlightObj && (
            <FlightDrawer
              flight={selectedFlightObj}
              activeSessionId={activeSessionId}
              activeSessionName={activeSessionName}
              onClose={handleCloseFlight}
              getAircraftName={getAircraftName}
              getLiveryName={getLiveryName}
              isFollowMode={isFollowMode}
              setIsFollowMode={setIsFollowMode}
              is3DChase={is3DChase}
              setIs3DChase={setIs3DChase}
              isFavorite={isFavorite}
              toggleFavorite={toggleFavorite}
              onViewPilot={handleViewPilot}
              getFlightHistory={getFlightHistory}
              onOpenUpload={handleOpenUpload}
            />
          )}
          {selectedAirportIcao && (
            <AirportDrawer
              airportIcao={selectedAirportIcao} airports={airports} atcList={atcList} flights={flights}
              onClose={() => setSelectedAirportIcao(null)} onSelectFlight={handleSelectFlight}
              getAircraftName={getAircraftName}
            />
          )}
        </>
      )}

      {/* ── Global Mobile Navigation Bar (hidden when a flight is selected to reveal docked bottom card) ── */}
      {!selectedFlightId && (
        <MobileNav
          activeTab={mobileTab}
          setActiveTab={setMobileTab}
          activeView={activeView}
          setActiveView={setActiveView}
        />
      )}

      {/* ── Native Mobile Bottom Sheet (Fleet, ATC, Airports, Alerts, More) ── */}
      <MobileBottomSheet
        isOpen={Boolean(mobileTab)}
        activeTab={mobileTab}
        onClose={() => setMobileTab(null)}
        flights={flights}
        atcList={atcList}
        airports={airports}
        selectedFlight={selectedFlightId}
        onSelectFlight={(id) => { handleSelectFlight(id); setActiveView('map'); }}
        onSelectAirport={(icao) => { handleSelectAirport(icao); setActiveView('map'); }}
        getAircraftName={getAircraftName}
        getLiveryName={getLiveryName}
        favorites={favorites}
        isFavorite={isFavorite}
        toggleFavorite={toggleFavorite}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onSwitchView={(v) => setActiveView(v)}
        userProfile={userProfile}
        sessions={sessions}
        activeSessionId={activeSessionId}
        switchSession={switchSession}
      />

      {/* ── Real-time Radar Alerts & Notifications Toast ── */}
      <NotificationToast
        onSelectFlight={(id) => { handleSelectFlight(id); setActiveView('map'); }}
      />

      {/* ── PWA Add to Home Screen Banner & iOS Guide ── */}
      <PwaInstallPrompt />

      {/* ══════════ LOGBOOK VIEW ══════════ */}
      {activeView === 'logbook' && (
        <Logbook
          logbook={logbook}
          userProfile={userProfile}
          fetchPilot={fetchPilot}
          pilotLoading={pilotLoading}
          onBack={() => setActiveView('map')}
        />
      )}

      {/* ══════════ ANALYTICS VIEW ══════════ */}
      {activeView === 'analytics' && (
        <Analytics analytics={analytics} onBack={() => setActiveView('map')} />
      )}

      {/* ══════════ COUNTRIES VIEW ══════════ */}
      {activeView === 'countries' && (
        <CountriesMap analytics={analytics} onBack={() => setActiveView('map')} />
      )}

      {/* Modals */}
      <SearchModal
        isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)}
        flights={flights} airports={airports} atcList={atcList}
        onSelectFlight={(id) => { handleSelectFlight(id); setActiveView('map'); }}
        onSelectAirport={(icao) => { handleSelectAirport(icao); setActiveView('map'); }}
        getAircraftName={getAircraftName}
      />
      <SettingsModal
        isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}
        mapTheme={mapTheme} setMapTheme={setMapTheme}
        showRadar={showRadar} setShowRadar={setShowRadar}
        showFir={showFir} setShowFir={setShowFir}
        map3D={map3D} setMap3D={setMap3D}
        useMetric={useMetric} setUseMetric={setUseMetric}
        onOpenUpload={handleOpenUpload}
      />
      {isProfileOpen && (
        <UserProfile
          userProfile={userProfile}
          updateProfile={updateProfile}
          fetchPilot={fetchPilot}
          pilotLoading={pilotLoading}
          pilotError={pilotError}
          analytics={analytics}
          onClose={() => setIsProfileOpen(false)}
        />
      )}
      {isUploadOpen && (
        <UploadPhotoModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          initialAircraft={uploadData.aircraft}
          initialLivery={uploadData.livery}
          userProfile={userProfile}
        />
      )}
    </div>
  );
}

export default App;
