import L from 'leaflet';
import { MapContainer, TileLayer, Marker, CircleMarker, Popup, Polyline, useMap } from 'react-leaflet';
import { useRef, useState, useEffect, useMemo } from 'react';

function FitRouteBounds({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (!positions.length) return;
    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, positions]);

  return null;
}

const driverIcon = L.divIcon({
  html: '<div style="font-size:18px; line-height:1;">🚚</div>',
  className: 'driver-emoji-icon',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

export default function DeliveryMap({ startLocation, endLocation, orderId, height = '400px' }) {
  const startLatLng = useMemo(() => [startLocation[1], startLocation[0]], [startLocation]);
  const endLatLng = useMemo(() => [endLocation[1], endLocation[0]], [endLocation]);
  const [driverCoordinates, setDriverCoordinates] = useState(startLatLng);
  const [smoothCoordinates, setSmoothCoordinates] = useState([]);
  const [roadCoordinates, setRoadCoordinates] = useState([]);
  const [animationIndex, setAnimationIndex] = useState(0);
  const intervalRef = useRef(null);

  const mapKey = `${orderId}-${startLocation[0]}-${startLocation[1]}-${endLocation[0]}-${endLocation[1]}`;

  const routePath = useMemo(() => roadCoordinates.map(([lon, lat]) => [lat, lon]), [roadCoordinates]);

  function smoothCoordinator() {
    const temp = [];
    for (let i = 0; i < roadCoordinates.length - 1; i++) {
      const [lonA, latA] = roadCoordinates[i];
      const [lonB, latB] = roadCoordinates[i + 1];
      const latStep = (latB - latA) / 10;
      const lonStep = (lonB - lonA) / 10;

      for (let j = 0; j <= 10; j++) {
        temp.push({ lat: latA + latStep * j, lon: lonA + lonStep * j });
      }
    }
    setSmoothCoordinates(temp);
  }

  async function fetchRoute() {
    try {
      const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjU1ZDhlNWQ1Yzg3YTRkNTQ5MWZmNzM3MjBmNTc1OGEyIiwiaCI6Im11cm11cjY0In0='
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
    if (roadCoordinates.length > 0) {
      smoothCoordinator();
      setDriverCoordinates(startLatLng);
      setAnimationIndex(0);
    }
  }, [roadCoordinates, startLatLng]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (smoothCoordinates.length > 0) {
      setDriverCoordinates(startLatLng);
      setAnimationIndex(0);
      intervalRef.current = setInterval(() => {
        setAnimationIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          if (nextIndex >= smoothCoordinates.length) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            return prevIndex;
          }
          return nextIndex;
        });
      }, 100);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [smoothCoordinates]);

  useEffect(() => {
    if (animationIndex < smoothCoordinates.length) {
      const nextCoords = smoothCoordinates[animationIndex];
      if (nextCoords) {
        setDriverCoordinates([nextCoords.lat, nextCoords.lon]);
      }
    }
  }, [animationIndex, smoothCoordinates]);

  useEffect(() => {
    setRoadCoordinates([]);
    setSmoothCoordinates([]);
    setAnimationIndex(0);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

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

        <Marker position={startLatLng}>
          <Popup>
            <div className="text-sm font-semibold">Driver starting point</div>
            <div className="text-xs text-slate-600">Center of Deira</div>
          </Popup>
        </Marker>

        <Marker position={endLatLng}>
          <Popup>
            <div className="text-sm font-semibold">Your current location</div>
            <div className="text-xs text-slate-600">Delivery destination</div>
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
