'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@/styles/leaflet.css';

interface WorldMapProps {
  children?: React.ReactNode;
  onMapReady?: (map: L.Map) => void;
  center?: [number, number];
  zoom?: number;
}

// Component to handle map events
function MapEventHandler({ onMapReady }: { onMapReady?: (map: L.Map) => void }) {
  const map = useMap();

  useEffect(() => {
    if (onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  useMapEvents({
    zoomend: () => {
      // Handle zoom changes
    },
    moveend: () => {
      // Handle pan changes
    },
  });

  return null;
}

export function WorldMap({ children, onMapReady, center = [20, 0], zoom = 3 }: WorldMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-[600px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 flex items-center justify-center">
        <p className="text-white">Loading map...</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      className="w-full h-[600px] rounded-xl border border-slate-200 dark:border-slate-800 z-0"
      style={{ background: '#0f172a' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="map-tiles"
      />
      <MapEventHandler onMapReady={onMapReady} />
      {children}
    </MapContainer>
  );
}
