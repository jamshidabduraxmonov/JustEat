import L from 'leaflet';
import { MapContainer, TileLayer, Marker, CircleMarker, Popup, Polyline, useMap } from 'react-leaflet';
import { useState, useEffect, useMemo } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.js';

function FitRouteBounds({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (!positions.length) return;
    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, positions]);

  return null;
}

const startIcon = L.divIcon({
  html: `
    <div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:#0f766e;color:white;font-weight:700;font-size:18px;box-shadow:0 0 0 4px rgba(15,118,110,0.16);">
      S
    </div>
  `,
  className: 'start-marker-icon',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

const finishIcon = L.divIcon({
  html: `
    <div style="display:flex;align-items:center;justify-content:center;width:44px;height:44px;">
      <div style="width:30px;height:30px;border-radius:8px;overflow:hidden;box-shadow:0 0 0 4px rgba(17,24,39,0.14);">
        <div style="width:50%;height:50%;background:#111;float:left;"></div>
        <div style="width:50%;height:50%;background:#fff;float:left;"></div>
        <div style="width:50%;height:50%;background:#fff;float:left;"></div>
        <div style="width:50%;height:50%;background:#111;float:left;"></div>
      </div>
    </div>
  `,
  className: 'finish-marker-icon',
  iconSize: [44, 44],
  iconAnchor: [22, 44],
});

const driverIcon = L.divIcon({
  html: `
    <div style="position:relative;width:40px;height:36px;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;top:0;left:50%;transform:translateX(-50%);font-size:16px;">📦</div>
      <div style="position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);font-size:24px;">🚗</div>
    </div>
  `,
  className: 'driver-marker-icon',
  iconSize: [40, 36],
  iconAnchor: [20, 18],
});

export default function DeliveryMap({ startLocation, endLocation, orderId, order, height = '400px' }) {
  const startLatLng = useMemo(() => [startLocation[1], startLocation[0]], [startLocation]);
  const endLatLng = useMemo(() => [endLocation[1], endLocation[0]], [endLocation]);
  const [roadCoordinates, setRoadCoordinates] = useState([]);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const mapKey = `${orderId}-${startLocation[0]}-${startLocation[1]}-${endLocation[0]}-${endLocation[1]}`;

  const routePath = useMemo(() => roadCoordinates.map(([lon, lat]) => [lat, lon]), [roadCoordinates]);
  const startedAt = useMemo(() => order?.startedAt?.toDate?.().getTime() ?? null, [order?.startedAt]);
  const estimatedSeconds = order?.estimatedDurationSeconds ?? 150;
  const elapsedSeconds = startedAt ? Math.max(0, (currentTime - startedAt) / 1000) : 0;
  const progress = routePath.length > 0 ? Math.min(1, elapsedSeconds / estimatedSeconds) : 0;
  const driverCoordinates = useMemo(() => {
    if (!routePath.length) return startLatLng;
    const index = Math.floor(progress * (routePath.length - 1));
    return routePath[index];
  }, [routePath, progress, startLatLng]);

  const isComplete = routePath.length > 0 && progress >= 1;
  const orderRef = orderId ? doc(db, 'orders', orderId) : null;

  async function fetchRoute() {
    try {
      const response = await fetch('/api/route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          coordinates: [
            [startLocation[0], startLocation[1]],
            [endLocation[0], endLocation[1]]
          ]
        })
      });

      const result = await response.json();
      if (result.features?.[0]?.geometry?.coordinates) {
        setRoadCoordinates(result.features[0].geometry.coordinates);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  }

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!orderRef || !routePath.length || !startedAt || !isComplete) return;
    if (order?.status !== 'delivered') {
      updateDoc(orderRef, {
        status: 'delivered',
        completedAt: serverTimestamp()
      }).catch((error) => console.error('Unable to mark delivered:', error));
    }
  }, [orderRef, routePath.length, startedAt, isComplete, order?.status]);

  useEffect(() => {
    setRoadCoordinates([]);
    fetchRoute();
  }, [startLocation, endLocation]);

  const mapCenter = [
    (startLatLng[0] + endLatLng[0]) / 2,
    (startLatLng[1] + endLatLng[1]) / 2
  ];

  return (
    <div className="rounded-[1.5rem] overflow-hidden border border-slate-200 shadow-sm">
      <MapContainer
        key={mapKey}
        center={mapCenter}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height, width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url='https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        />

        {routePath.length > 0 && <FitRouteBounds positions={routePath} />}

        {routePath.length > 0 && (
          <Polyline positions={routePath} pathOptions={{ color: '#059669', weight: 5, opacity: 0.75 }} />
        )}

        <Marker position={startLatLng} icon={startIcon}>
          <Popup>
            <div className="text-sm font-semibold">Driver starting point</div>
            <div className="text-xs text-slate-600">Center of Deira</div>
          </Popup>
        </Marker>

        <Marker position={endLatLng} icon={finishIcon}>
          <Popup>
            <div className="text-sm font-semibold">Delivery destination</div>
            <div className="text-xs text-slate-600">Your current location</div>
          </Popup>
        </Marker>

        <Marker position={driverCoordinates} icon={driverIcon}>
          <Popup>
            <div className="text-sm font-semibold">Driver</div>
            <div className="text-xs text-slate-600">Moving toward your location</div>
          </Popup>
        </Marker>

        <CircleMarker center={endLatLng} radius={10} color="#10b981" fillColor="#a7f3d0" fillOpacity={0.4}>
          <Popup>You are here</Popup>
        </CircleMarker>
      </MapContainer>
    </div>
  );
}
