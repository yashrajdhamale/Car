import React, { useState, useEffect, useRef, useCallback } from 'react';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UberStyleTracking } from '../utils/uberTracking';
import { DriverLocationService } from '../services/firebaseService';
import MapWithTracking from '../components/MapWithTracking';

const MAP_KEY = import.meta.env.VITE_MAP_MY_INDIA_API_KEY || 'mock_key';

function lerp(prev, next, steps = 60) {
  const out = [];
  for (let i = 0; i <= steps; i++)
    out.push({
      lat: prev.lat + (next.lat - prev.lat) * (i / steps),
      lng: prev.lng + (next.lng - prev.lng) * (i / steps),
    });
  return out;
}

const CANCEL_REASONS = [
  'Driver is too far away',
  'Wait time is too long',
  'Change of plans',
  'Found another transport',
  'Booked by mistake',
  'Emergency situation',
];

export default function LocalRideTrackingPage({ rideId, driverInfo: initDriver, priceDetails, onClose }) {
  const [svc]            = useState(() => new UberStyleTracking(MAP_KEY, true));
  const [driverLoc,  setDriverLoc]  = useState(null);
  const [custLoc,    setCustLoc]    = useState(null);
  const [driverInfo, setDriverInfo] = useState(initDriver || null);
  const [dist,       setDist]       = useState(null);
  const [eta,        setEta]        = useState(null);
  const [route,      setRoute]      = useState(null);
  const [status,     setStatus]     = useState('accepted');
  const [done,       setDone]       = useState(false);
  const [cancelled,  setCancelled]  = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling,   setCancelling]   = useState(false);

  const unsubRide   = useRef(null);
  const unsubDriver = useRef(null);
  const locInt      = useRef(null);
  const driverRef   = useRef(null);
  const animRef     = useRef(null);
  const initRef     = useRef(false);

  const moveDriver = useCallback((next) => {
    const prev = driverRef.current;
    if (!prev) { driverRef.current = next; setDriverLoc(next); return; }
    const frames = lerp(prev, next, 60);
    let i = 0;
    const tick = () => {
      if (i >= frames.length) return;
      setDriverLoc({ ...frames[i++] });
      animRef.current = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(tick);
    driverRef.current = next;
  }, []);

  const calcETA = useCallback(async (d, c) => {
    try {
      const r = await svc.calculateRoute(d, c);
      if (r) {
        setRoute(r);
        setDist(svc.formatDistance(r.distance));
        setEta(svc.formatETA(svc.calculateETA(r.distance, r.trafficFactor || 1.2)));
      }
    } catch {
      const m = svc.calculateHaversineDistance(d, c);
      setDist(svc.formatDistance(m));
      setEta(svc.formatETA(svc.calculateETA(m, 1.5)));
    }
  }, [svc]);

  const updateCust = useCallback(() => {
    if (!navigator.geolocation || done || cancelled) return;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const loc = { lat: p.coords.latitude, lng: p.coords.longitude };
        setCustLoc(loc);
        if (driverRef.current) calcETA(driverRef.current, loc);
      },
      (e) => console.warn('GPS:', e.message),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 }
    );
  }, [done, cancelled, calcETA]);

  useEffect(() => {
    if (!rideId || initRef.current) return;
    initRef.current = true;

    unsubRide.current = onSnapshot(doc(db, 'localRides', rideId), (snap) => {
      if (!snap.exists()) { setLoading(false); return; }
      const d = snap.data();
      setStatus(d.status);
      if (d.status === 'completed')   { setDone(true); clearInterval(locInt.current); }
      if (['no_driver_found','cancelled'].includes(d.status)) { setCancelled(true); clearInterval(locInt.current); }

      if (d.driverName || d.driverId)
        setDriverInfo(p => ({
          ...p,
          name:          d.driverName    || p?.name          || 'Driver',
          phone:         d.driverPhone   || p?.phone         || '',
          vehicleType:   d.vehicleType   || p?.vehicleType   || '',
          vehicleNumber: d.vehicleNumber || p?.vehicleNumber || '',
          driverId:      d.driverId      || p?.driverId      || '',
          rating:        d.driverRating  || p?.rating        || '4.8',
        }));

      if (d.driverId && !unsubDriver.current)
        unsubDriver.current = DriverLocationService.subscribeToDriverLocation(d.driverId, (loc) => {
          if (loc?.error) return;
          moveDriver(loc);
          if (custLoc) calcETA(loc, custLoc);
        });

      setLoading(false);
    });

    updateCust();
    locInt.current = setInterval(updateCust, 30000);

    return () => {
      initRef.current = false;
      unsubRide.current?.(); unsubDriver.current?.();
      clearInterval(locInt.current); cancelAnimationFrame(animRef.current);
    };
  }, [rideId]);

  const submitCancel = async () => {
    if (!cancelReason) return;
    setCancelling(true);
    try {
      await updateDoc(doc(db, 'localRides', rideId), {
        status: 'cancelled',
        cancelledBy: 'customer',
        cancelledReason: cancelReason,
        cancelledAt: serverTimestamp(),
      });
      setCancelled(true); setShowCancel(false);
    } catch (e) { console.error(e); }
    setCancelling(false);
  };

  const isActive = !done && !cancelled && ['accepted','driver_arrived','in_progress'].includes(status);

  const dName  = driverInfo?.name          || initDriver?.name          || 'Driver';
  const dPhone = driverInfo?.phone         || initDriver?.phone         || '';
  const dVType = driverInfo?.vehicleType   || initDriver?.vehicleType   || 'Car';
  const dVNum  = driverInfo?.vehicleNumber || initDriver?.vehicleNumber || '';
  const dRate  = driverInfo?.rating        || '4.8';

  const statusMeta = {
    accepted:       { label: 'Driver is on the way',  color: '#2563eb', bg: 'linear-gradient(90deg,#1d4ed8,#2563eb)', dot: '#93c5fd' },
    driver_arrived: { label: 'Driver has arrived! 🎉', color: '#16a34a', bg: 'linear-gradient(90deg,#15803d,#16a34a)', dot: '#86efac' },
    in_progress:    { label: 'Ride in progress',       color: '#7c3aed', bg: 'linear-gradient(90deg,#6d28d9,#7c3aed)', dot: '#c4b5fd' },
    completed:      { label: 'Ride Completed ✅',       color: '#16a34a', bg: 'linear-gradient(90deg,#15803d,#16a34a)', dot: '#86efac' },
    cancelled:      { label: 'Ride Cancelled',         color: '#dc2626', bg: 'linear-gradient(90deg,#b91c1c,#dc2626)', dot: '#fca5a5' },
  };
  const sm = statusMeta[done ? 'completed' : cancelled ? 'cancelled' : status] || statusMeta.accepted;

  /* ── Loading ── */
  if (loading) return (
    <div style={S.overlay}>
      <style>{CSS}</style>
      <div className="lrt-center">
        <div className="lrt-spinner-ring" />
        <p className="lrt-load-text">Setting up live tracking…</p>
      </div>
    </div>
  );

  return (
    <div style={S.overlay}>
      <style>{CSS}</style>

      {/* ══ CANCEL MODAL ═════════════════════════════════════════════ */}
      {showCancel && (
        <div className="lrt-modal-bg" onClick={e => e.target === e.currentTarget && setShowCancel(false)}>
          <div className="lrt-modal">
            <div className="lrt-modal-pill" />
            <div className="lrt-modal-top">
              <span className="lrt-modal-title">Cancel your ride?</span>
              <button className="lrt-modal-x" onClick={() => setShowCancel(false)}>✕</button>
            </div>
            <p className="lrt-modal-hint">Please pick a reason. Cancellation may incur a fee.</p>
            <div className="lrt-reasons-list">
              {CANCEL_REASONS.map(r => (
                <div
                  key={r}
                  className={`lrt-reason ${cancelReason === r ? 'lrt-reason--on' : ''}`}
                  onClick={() => setCancelReason(r)}
                >
                  <div className={`lrt-radio ${cancelReason === r ? 'lrt-radio--on' : ''}`}>
                    {cancelReason === r && <div className="lrt-radio-dot" />}
                  </div>
                  <span className="lrt-reason-label">{r}</span>
                </div>
              ))}
            </div>
            <div className="lrt-modal-btns">
              <button className="lrt-btn-keep" onClick={() => setShowCancel(false)}>Keep Ride</button>
              <button
                className="lrt-btn-confirm-cancel"
                style={{ opacity: !cancelReason || cancelling ? 0.45 : 1 }}
                disabled={!cancelReason || cancelling}
                onClick={submitCancel}
              >
                {cancelling ? <span className="lrt-inline-spin" /> : '🚫 Cancel Ride'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ SCROLLABLE CONTENT ════════════════════════════════════════ */}
      <div style={S.scroll}>

        {/* ── Top bar ── */}
        <div style={S.topbar}>
          <button className="lrt-back-btn" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111827', lineHeight: 1.2 }}>
              Live Tracking
            </div>
            <div style={{ fontSize: '0.67rem', color: '#9ca3af', marginTop: 1, fontWeight: 600, letterSpacing: '0.06em' }}>
              #{rideId?.substring(0, 8).toUpperCase()}
            </div>
          </div>
          {eta && isActive && (
            <div className="lrt-eta-pill">⏱ {eta} away</div>
          )}
        </div>

        {/* ── Status strip ── */}
        <div className="lrt-status-strip" style={{ background: sm.bg }}>
          <span className="lrt-status-pulse-dot" style={{ background: sm.dot }} />
          <span className="lrt-status-text">
            {done ? '✅ Ride Completed' : cancelled ? '🚫 Ride Cancelled' : sm.label}
          </span>
          {dist && isActive && (
            <span className="lrt-status-dist">{dist} away</span>
          )}
        </div>

        {/* ── Map — fixed height, rounded, padded ── */}
        <div style={S.mapOuter}>
          <div style={S.mapBox}>
            {driverLoc || custLoc ? (
              <MapWithTracking
                driverLocation={driverLoc}
                customerLocation={custLoc}
                pickupLocation={priceDetails?.pickup}
                dropoffLocation={priceDetails?.dropoff}
                routeData={route}
                apiKey={MAP_KEY}
                showPredictions
              />
            ) : (
              <div className="lrt-map-empty">
                <div className="lrt-pulse-ring" /><div className="lrt-pulse-ring lrt-pulse-ring--2" />
                <span style={{ fontSize: '2rem', position: 'relative', zIndex: 2 }}>📍</span>
                <span className="lrt-map-empty-text">Connecting to driver…</span>
              </div>
            )}
            {driverLoc && (
              <div className="lrt-live-tag">
                <span className="lrt-live-dot" /> LIVE
              </div>
            )}
          </div>

          {/* ── Distance + ETA cards below map ── */}
          {isActive && (
            <div style={S.statsRow}>
              <div className="lrt-stat-card">
                <div className="lrt-stat-icon">🚗</div>
                <div className="lrt-stat-body">
                  <span className="lrt-stat-label">Driver distance</span>
                  <span className="lrt-stat-value">{dist || '—'}</span>
                </div>
              </div>
              <div style={{ width: 1, background: '#f3f4f6', flexShrink: 0 }} />
              <div className="lrt-stat-card">
                <div className="lrt-stat-icon">⏱</div>
                <div className="lrt-stat-body">
                  <span className="lrt-stat-label">ETA to pickup</span>
                  <span className="lrt-stat-value" style={{ color: '#f4511e' }}>{eta || '—'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Driver info card ── */}
        <div style={S.section}>
          <div style={S.card}>
            {/* Driver row */}
            <div className="lrt-driver-row">
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div className="lrt-avatar">👨‍✈️</div>
                <div className="lrt-star-badge">★ {dRate}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="lrt-driver-name">{dName}</div>
                <div className="lrt-driver-type">{dVType}</div>
                {dVNum && <div className="lrt-plate">{dVNum}</div>}
              </div>
              {dPhone && (
                <a href={`tel:${dPhone}`} className="lrt-call-icon" aria-label="Call driver">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.22 1.2 2 2 0 012.22 0h3a2 2 0 012 1.72c.12.96.36 1.9.71 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45c.91.35 1.85.59 2.81.71A2 2 0 0122 16.92z"/>
                  </svg>
                </a>
              )}
            </div>

            <div className="lrt-sep" />

            {/* Route */}
            <div className="lrt-route-row">
              <div className="lrt-route-pins">
                <div className="lrt-pin lrt-pin--green" />
                <div className="lrt-route-dash" />
                <div className="lrt-pin lrt-pin--red" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="lrt-stop">
                  <span className="lrt-stop-badge lrt-stop-badge--pickup">PICKUP</span>
                  <span className="lrt-stop-addr">
                    {priceDetails?.pickup?.address || priceDetails?.pickup?.name || '—'}
                  </span>
                </div>
                <div className="lrt-stop" style={{ marginTop: '0.5rem' }}>
                  <span className="lrt-stop-badge lrt-stop-badge--drop">DROP</span>
                  <span className="lrt-stop-addr">
                    {priceDetails?.dropoff?.address || priceDetails?.dropoff?.name || '—'}
                  </span>
                </div>
              </div>
              <div className="lrt-fare-col">
                {typeof priceDetails?.distance === 'number' && (
                  <span className="lrt-fare-km">{priceDetails.distance.toFixed(1)} km</span>
                )}
                <span className="lrt-fare-price">₹{priceDetails?.totalFare || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div style={S.section}>
          {isActive && (
            <div className="lrt-action-row">
              <button className="lrt-btn-cancel" onClick={() => setShowCancel(true)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
                </svg>
                Cancel Ride
              </button>
              {dPhone && (
                <a href={`tel:${dPhone}`} className="lrt-btn-call">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.22 1.2 2 2 0 012.22 0h3a2 2 0 012 1.72c.12.96.36 1.9.71 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45c.91.35 1.85.59 2.81.71A2 2 0 0122 16.92z"/>
                  </svg>
                  Call Driver
                </a>
              )}
            </div>
          )}

          {done && (
            <button className="lrt-btn-done" onClick={onClose}>
              🎉 Ride Completed — Done
            </button>
          )}

          {cancelled && (
            <div className="lrt-cancelled-box">
              <span style={{ fontSize: '1.6rem' }}>🚫</span>
              <div>
                <div className="lrt-cancelled-title">Ride Cancelled</div>
                <div className="lrt-cancelled-sub">Sorry for the inconvenience</div>
              </div>
              <button className="lrt-btn-rebook" onClick={onClose}>Book Again</button>
            </div>
          )}
        </div>

        {/* bottom spacing */}
        <div style={{ height: '1.5rem' }} />
      </div>
    </div>
  );
}

/* ─── Layout styles (JS objects) ────────────────────────────────────────── */
const S = {
  /* Sits below the site navbar */
  overlay: {
    position: 'fixed', inset: 0, zIndex: 800,
    paddingTop: '72px',   /* match your navbar height */
    background: '#f3f4f6',
    fontFamily: "'Nunito', -apple-system, sans-serif",
    display: 'flex', flexDirection: 'column',
    overscrollBehavior: 'contain',
  },
  scroll: {
    flex: 1, overflowY: 'auto', overflowX: 'hidden',
    /* hide scrollbar */
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  },
  topbar: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.75rem 1rem',
    background: '#fff',
    borderBottom: '1px solid #f3f4f6',
    position: 'sticky', top: 0, zIndex: 20,
    flexShrink: 0,
  },
  /* map section: padded, not full-width */
  mapOuter: {
    padding: '0.85rem 1rem 0',
  },
  mapBox: {
    borderRadius: '16px',
    overflow: 'hidden',
    height: '260px',           /* fixed height — not full screen */
    position: 'relative',
    boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
    background: '#e5e7eb',
  },
  statsRow: {
    display: 'flex',
    background: '#fff',
    borderRadius: '14px',
    marginTop: '0.65rem',
    overflow: 'hidden',
    border: '1.5px solid #f3f4f6',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  section: {
    padding: '0.65rem 1rem 0',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '1rem',
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
    border: '1.5px solid #f3f4f6',
  },
};

/* ─── CSS (classes) ──────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');

  @keyframes lrtSpin   { to { transform: rotate(360deg); } }
  @keyframes lrtPulse  { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.3;transform:scale(1.6);} }
  @keyframes lrtRing   { 0%{transform:scale(0.8);opacity:0.8;} 100%{transform:scale(2.4);opacity:0;} }
  @keyframes lrtUp     { from{opacity:0;transform:translateY(10px);} to{opacity:1;transform:none;} }
  @keyframes lrtSlide  { from{transform:translateY(100%);} to{transform:none;} }

  /* scrollbar hide */
  .lrt-scroll::-webkit-scrollbar { display: none; }

  /* loading */
  .lrt-center {
    position: absolute; inset: 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem;
  }
  .lrt-spinner-ring {
    width: 44px; height: 44px; border-radius: 50%;
    border: 4px solid #f3f4f6;
    border-top-color: #f4511e;
    animation: lrtSpin 0.85s linear infinite;
  }
  .lrt-load-text { color: #6b7280; font-size: 0.9rem; font-weight: 600; }

  /* back btn */
  .lrt-back-btn {
    width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
    background: #f9fafb; border: 1.5px solid #f3f4f6;
    color: #374151; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    -webkit-tap-highlight-color: transparent;
  }

  /* ETA pill */
  .lrt-eta-pill {
    background: rgba(244,81,30,0.1);
    border: 1.5px solid rgba(244,81,30,0.3);
    border-radius: 999px; padding: 0.26rem 0.7rem;
    color: #f4511e; font-weight: 800; font-size: 0.8rem; flex-shrink: 0;
  }

  /* Status strip */
  .lrt-status-strip {
    display: flex; align-items: center; gap: 0.55rem;
    padding: 0.65rem 1rem;
    margin: 0.65rem 1rem 0;
    border-radius: 12px;
    flex-shrink: 0;
  }
  .lrt-status-pulse-dot {
    width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
    animation: lrtPulse 1.6s ease-in-out infinite;
    display: inline-block;
  }
  .lrt-status-text { color: #fff; font-weight: 700; font-size: 0.87rem; flex: 1; }
  .lrt-status-dist {
    color: rgba(255,255,255,0.7); font-size: 0.76rem;
    background: rgba(255,255,255,0.15); border-radius: 999px;
    padding: 2px 10px; flex-shrink: 0;
  }

  /* Map inner */
  .lrt-map-empty {
    position: absolute; inset: 0; background: #1e1a4a;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.6rem;
  }
  .lrt-pulse-ring {
    position: absolute; width: 80px; height: 80px; border-radius: 50%;
    border: 2px solid rgba(244,81,30,0.35);
    animation: lrtRing 2.5s ease-out infinite;
  }
  .lrt-pulse-ring--2 { animation-delay: 1.25s; }
  .lrt-map-empty-text { color: rgba(255,255,255,0.5); font-size: 0.82rem; font-weight: 600; position: relative; z-index: 2; }

  /* LIVE badge */
  .lrt-live-tag {
    position: absolute; top: 10px; right: 10px; z-index: 10;
    display: flex; align-items: center; gap: 5px;
    background: rgba(0,0,0,0.65); backdrop-filter: blur(6px);
    border: 1px solid rgba(74,222,128,0.3); border-radius: 7px;
    padding: 4px 10px; color: #4ade80; font-weight: 800;
    font-size: 0.65rem; letter-spacing: 0.1em;
    font-family: inherit;
  }
  .lrt-live-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #4ade80; display: inline-block;
    animation: lrtPulse 1.5s ease-in-out infinite;
  }

  /* Stats row */
  .lrt-stat-card {
    flex: 1; display: flex; align-items: center; gap: 0.65rem;
    padding: 0.75rem 0.9rem;
  }
  .lrt-stat-icon { font-size: 1.3rem; flex-shrink: 0; }
  .lrt-stat-body { display: flex; flex-direction: column; gap: 1px; }
  .lrt-stat-label { font-size: 0.65rem; color: #9ca3af; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
  .lrt-stat-value { font-size: 1.05rem; font-weight: 900; color: #111827; letter-spacing: -0.02em; }

  /* Driver card */
  .lrt-driver-row {
    display: flex; align-items: flex-start; gap: 0.8rem; margin-bottom: 0;
  }
  .lrt-avatar {
    width: 50px; height: 50px; border-radius: 14px;
    background: linear-gradient(135deg,#1e1b4b,#312e81);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.45rem;
    box-shadow: 0 3px 10px rgba(49,46,129,0.3);
  }
  .lrt-star-badge {
    position: absolute; bottom: -7px; left: 50%; transform: translateX(-50%);
    background: #1e1b4b; color: #fbbf24;
    font-size: 0.6rem; font-weight: 800;
    padding: 2px 7px; border-radius: 999px;
    white-space: nowrap; border: 2px solid #fff;
    font-family: inherit;
  }
  .lrt-driver-name { display: block; font-weight: 900; font-size: 1rem; color: #111827; letter-spacing: -0.01em; }
  .lrt-driver-type { display: block; font-size: 0.75rem; color: #6b7280; margin-top: 2px; font-weight: 500; }
  .lrt-plate {
    display: inline-block; margin-top: 5px;
    background: #f3f4f6; border: 1px solid #e5e7eb;
    border-radius: 6px; padding: 2px 9px;
    font-size: 0.7rem; font-weight: 800; color: #374151; letter-spacing: 0.07em;
  }
  .lrt-call-icon {
    width: 44px; height: 44px; border-radius: 13px; flex-shrink: 0;
    background: linear-gradient(135deg,#1e1b4b,#312e81);
    display: flex; align-items: center; justify-content: center;
    color: #fff; text-decoration: none;
    box-shadow: 0 3px 10px rgba(49,46,129,0.28);
    -webkit-tap-highlight-color: transparent;
  }

  .lrt-sep { height: 1px; background: #f3f4f6; margin: 0.85rem 0; }

  /* Route */
  .lrt-route-row { display: flex; gap: 0.65rem; align-items: stretch; }
  .lrt-route-pins {
    display: flex; flex-direction: column; align-items: center;
    gap: 3px; flex-shrink: 0; padding-top: 3px;
  }
  .lrt-pin {
    width: 11px; height: 11px; border-radius: 50%; flex-shrink: 0;
    border: 2px solid #fff;
  }
  .lrt-pin--green { background: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,0.2); }
  .lrt-pin--red   { background: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.2); }
  .lrt-route-dash {
    width: 2px; flex: 1; min-height: 18px;
    background: repeating-linear-gradient(to bottom,#d1d5db 0,#d1d5db 5px,transparent 5px,transparent 10px);
  }
  .lrt-stop { display: flex; flex-direction: column; gap: 3px; }
  .lrt-stop-badge {
    display: inline-block; font-size: 0.58rem; font-weight: 800;
    padding: 2px 7px; border-radius: 5px; letter-spacing: 0.07em; width: fit-content;
  }
  .lrt-stop-badge--pickup { background: #dcfce7; color: #15803d; }
  .lrt-stop-badge--drop   { background: #fee2e2; color: #b91c1c; }
  .lrt-stop-addr {
    font-size: 0.8rem; color: #374151; font-weight: 500; line-height: 1.4;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .lrt-fare-col {
    display: flex; flex-direction: column; align-items: flex-end;
    justify-content: center; flex-shrink: 0; padding-left: 0.4rem; gap: 3px;
  }
  .lrt-fare-km    { font-size: 0.68rem; color: #9ca3af; font-weight: 600; }
  .lrt-fare-price { font-size: 1.05rem; font-weight: 900; color: #f4511e; letter-spacing: -0.02em; }

  /* Action buttons */
  .lrt-action-row {
    display: flex; gap: 0.6rem;
  }
  .lrt-btn-cancel {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 0.82rem;
    background: #fff1f2; border: 1.5px solid #fecdd3; border-radius: 13px;
    color: #dc2626; font-weight: 700; font-size: 0.88rem;
    cursor: pointer; font-family: inherit;
    -webkit-tap-highlight-color: transparent;
  }
  .lrt-btn-call {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 0.82rem;
    background: linear-gradient(135deg,#1e1b4b,#312e81);
    border: none; border-radius: 13px;
    color: #fff; font-weight: 700; font-size: 0.88rem;
    cursor: pointer; font-family: inherit; text-decoration: none;
    box-shadow: 0 4px 14px rgba(49,46,129,0.28);
    -webkit-tap-highlight-color: transparent;
  }
  .lrt-btn-done {
    width: 100%; padding: 0.88rem;
    background: linear-gradient(135deg,#14532d,#16a34a);
    color: #fff; border: none; border-radius: 13px;
    font-weight: 800; font-size: 0.95rem; cursor: pointer;
    font-family: inherit; box-shadow: 0 4px 14px rgba(22,163,74,0.28);
    -webkit-tap-highlight-color: transparent;
  }
  .lrt-cancelled-box {
    display: flex; align-items: center; gap: 0.85rem;
    background: #fff1f2; border: 1.5px solid #fecdd3;
    border-radius: 13px; padding: 0.9rem 1rem;
  }
  .lrt-cancelled-title { font-weight: 800; color: #dc2626; font-size: 0.9rem; }
  .lrt-cancelled-sub   { color: #9ca3af; font-size: 0.75rem; margin-top: 2px; }
  .lrt-btn-rebook {
    margin-left: auto; flex-shrink: 0;
    padding: 0.55rem 1rem;
    background: linear-gradient(135deg,#1e1b4b,#312e81);
    color: #fff; border: none; border-radius: 10px;
    font-weight: 700; font-size: 0.8rem; cursor: pointer; font-family: inherit;
  }

  /* ── Cancel modal ── */
  .lrt-modal-bg {
    position: fixed; inset: 0; z-index: 999;
    background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);
    display: flex; align-items: flex-end; justify-content: center;
  }
  .lrt-modal {
    background: #fff; border-radius: 22px 22px 0 0;
    padding: 0.6rem 1rem 1.25rem;
    padding-bottom: max(1.25rem, env(safe-area-inset-bottom));
    width: 100%; max-width: 520px;
    box-shadow: 0 -8px 40px rgba(0,0,0,0.3);
    animation: lrtSlide 0.3s cubic-bezier(0.34,1.1,0.64,1);
  }
  .lrt-modal-pill {
    width: 36px; height: 4px; border-radius: 2px;
    background: #e5e7eb; margin: 0 auto 1rem;
  }
  .lrt-modal-top {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;
  }
  .lrt-modal-title { font-weight: 900; font-size: 1.1rem; color: #111827; }
  .lrt-modal-x {
    width: 30px; height: 30px; border-radius: 8px;
    background: #f3f4f6; border: none; color: #6b7280;
    cursor: pointer; font-size: 0.88rem;
    display: flex; align-items: center; justify-content: center;
  }
  .lrt-modal-hint { font-size: 0.82rem; color: #6b7280; margin-bottom: 0.85rem; line-height: 1.5; }
  .lrt-reasons-list { display: flex; flex-direction: column; gap: 0.4rem; }
  .lrt-reason {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.7rem 0.85rem; border-radius: 11px;
    border: 1.5px solid #f3f4f6; cursor: pointer; background: #fff;
    transition: border-color 0.12s, background 0.12s;
  }
  .lrt-reason--on { background: #eef2ff; border-color: #6366f1; }
  .lrt-radio {
    width: 19px; height: 19px; border-radius: 50%; flex-shrink: 0;
    border: 2px solid #d1d5db;
    display: flex; align-items: center; justify-content: center;
    transition: border-color 0.12s;
  }
  .lrt-radio--on { border-color: #6366f1; }
  .lrt-radio-dot { width: 9px; height: 9px; border-radius: 50%; background: #6366f1; }
  .lrt-reason-label { font-size: 0.875rem; color: #374151; font-weight: 500; }
  .lrt-modal-btns { display: flex; gap: 0.6rem; margin-top: 1rem; }
  .lrt-btn-keep {
    flex: 1; padding: 0.8rem;
    background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 13px;
    color: #374151; font-weight: 700; font-size: 0.9rem; cursor: pointer; font-family: inherit;
  }
  .lrt-btn-confirm-cancel {
    flex: 1.2; padding: 0.8rem;
    background: linear-gradient(135deg,#dc2626,#b91c1c);
    border: none; border-radius: 13px; color: #fff;
    font-weight: 700; font-size: 0.9rem; cursor: pointer; font-family: inherit;
    box-shadow: 0 4px 14px rgba(185,28,28,0.28);
    display: flex; align-items: center; justify-content: center;
  }
  .lrt-inline-spin {
    width: 18px; height: 18px; border-radius: 50%;
    border: 2.5px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    animation: lrtSpin 0.75s linear infinite; display: inline-block;
  }
`;