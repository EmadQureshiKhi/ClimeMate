'use client';

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Badge } from '@/components/ui/badge';

interface Station {
  code: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    city: string;
    address: string;
  };
  status: string;
}

interface StationMarkersProps {
  stations: Station[];
  onStationClick?: (station: Station) => void;
}

// Custom marker icons
const createIcon = (isActive: boolean) => {
  const color = isActive ? '#10b981' : '#64748b';
  const svg = `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="12" fill="${color}" opacity="0.8"/>
      <circle cx="16" cy="16" r="8" fill="white"/>
      <path d="M16 10 L18 16 L14 16 L16 22" fill="${color}" stroke="white" stroke-width="1"/>
    </svg>
  `;
  
  return L.divIcon({
    html: svg,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

export function StationMarkers({ stations, onStationClick }: StationMarkersProps) {
  return (
    <>
      {stations.map((station) => {
        const isActive = station.status === 'available';
        
        return (
          <Marker
            key={station.code}
            position={[station.location.latitude, station.location.longitude]}
            icon={createIcon(isActive)}
            eventHandlers={{
              click: () => onStationClick?.(station),
            }}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-bold text-white mb-2">{station.name}</h3>
                <p className="text-sm text-slate-300 mb-2">
                  {station.location.city}
                </p>
                <p className="text-xs text-slate-400 mb-3">
                  {station.location.address}
                </p>
                <Badge variant={isActive ? 'default' : 'secondary'}>
                  {station.status}
                </Badge>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
