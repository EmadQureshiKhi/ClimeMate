'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { cellToBoundary, latLngToCell } from 'h3-js';

interface HexagonLayerProps {
  resolution?: number;
  ownedHexes?: Set<string>;
  availableHexes?: Set<string>;
  premiumHexes?: Set<string>;
  onHexClick?: (h3Index: string, lat: number, lng: number) => void;
}

export function HexagonLayer({
  resolution = 8,
  ownedHexes = new Set(),
  availableHexes = new Set(),
  premiumHexes = new Set(),
  onHexClick,
}: HexagonLayerProps) {
  const map = useMap();
  const hexLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    // Create layer group if it doesn't exist
    if (!hexLayerRef.current) {
      hexLayerRef.current = L.layerGroup().addTo(map);
    }

    const renderHexagons = () => {
      console.log('Rendering hexagons. Owned:', ownedHexes.size, 'Premium:', premiumHexes.size);
      const hexLayer = hexLayerRef.current;
      if (!hexLayer) return;

      // Clear existing hexagons
      hexLayer.clearLayers();

      const bounds = map.getBounds();
      const zoom = map.getZoom();

      // Only show hexagons at appropriate zoom levels
      if (zoom < 6) {
        return;
      }

      // Generate hexagons for visible area
      const step = zoom < 8 ? 2 : 1;
      const latStep = (bounds.getNorth() - bounds.getSouth()) / (20 * step);
      const lngStep = (bounds.getEast() - bounds.getWest()) / (40 * step);

      const processedHexes = new Set<string>();

      for (let lat = bounds.getSouth(); lat < bounds.getNorth(); lat += latStep) {
        for (let lng = bounds.getWest(); lng < bounds.getEast(); lng += lngStep) {
          try {
            const h3Index = latLngToCell(lat, lng, resolution);
            
            if (processedHexes.has(h3Index)) continue;
            processedHexes.add(h3Index);

            const boundary = cellToBoundary(h3Index);
            const coordinates: [number, number][] = boundary.map(([lat, lng]) => [lat, lng]);

            // Determine hex color based on status
            let color = '#64748b';
            let fillOpacity = 0.2;
            let weight = 1;

            if (ownedHexes.has(h3Index)) {
              color = '#8b5cf6'; // Purple for owned
              fillOpacity = 0.4;
              weight = 2;
            } else if (premiumHexes.has(h3Index)) {
              color = '#ef4444'; // Red for premium
              fillOpacity = 0.3;
              weight = 1.5;
            } else {
              color = '#10b981'; // Green for available
              fillOpacity = 0.25;
            }

            const polygon = L.polygon(coordinates, {
              color,
              fillColor: color,
              fillOpacity,
              weight,
              opacity: 0.6,
            });

            const originalOpacity = fillOpacity;
            const originalWeight = weight;

            polygon.on('click', () => {
              const center = polygon.getBounds().getCenter();
              onHexClick?.(h3Index, center.lat, center.lng);
            });

            polygon.on('mouseover', function() {
              this.setStyle({
                fillOpacity: originalOpacity + 0.2,
                weight: originalWeight + 1,
              });
            });

            polygon.on('mouseout', function() {
              this.setStyle({
                fillOpacity: originalOpacity,
                weight: originalWeight,
              });
            });

            hexLayer.addLayer(polygon);
          } catch (error) {
            // Skip invalid coordinates
          }
        }
      }
    };

    // Initial render
    renderHexagons();

    // Re-render on map changes
    map.on('moveend', renderHexagons);
    map.on('zoomend', renderHexagons);

    return () => {
      map.off('moveend', renderHexagons);
      map.off('zoomend', renderHexagons);
      if (hexLayerRef.current) {
        hexLayerRef.current.clearLayers();
        hexLayerRef.current.remove();
        hexLayerRef.current = null;
      }
    };
  }, [map, resolution, ownedHexes, availableHexes, premiumHexes, onHexClick]);

  return null;
}
