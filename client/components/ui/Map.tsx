'use client'

import React, { useEffect, useRef } from 'react';

interface MapProps {
  latitude: number;
  longitude: number;
  title?: string;
  className?: string;
}

const Map: React.FC<MapProps> = ({ latitude, longitude, title = "Localisation", className = "" }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Charger Leaflet dynamiquement
    const loadLeaflet = async () => {
      // CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);

      // JavaScript
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      
      return new Promise((resolve) => {
        script.onload = () => resolve(window.L);
        document.head.appendChild(script);
      });
    };

    loadLeaflet().then((L: any) => {
      if (!mapRef.current || !L) return;

      // Initialiser la carte
      mapInstance.current = L.map(mapRef.current).setView([latitude, longitude], 13);

      // Ajouter les tuiles OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstance.current);

      // Ajouter un marqueur
      L.marker([latitude, longitude])
        .addTo(mapInstance.current)
        .bindPopup(title)
        .openPopup();
    });

    // Cleanup
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
      }
    };
  }, [latitude, longitude, title]);

  return (
    <div className={`w-full h-64 rounded-lg overflow-hidden border border-gray-200 relative z-10 ${className}`}>
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

export default Map;
