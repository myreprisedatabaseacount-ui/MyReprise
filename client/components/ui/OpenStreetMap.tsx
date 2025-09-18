'use client';

import React, { useEffect, useRef } from 'react';

interface OpenStreetMapProps {
  latitude: number;
  longitude: number;
  addressName?: string;
  className?: string;
  height?: string;
}

const OpenStreetMap: React.FC<OpenStreetMapProps> = ({
  latitude,
  longitude,
  addressName,
  className = '',
  height = '200px'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Charger Leaflet dynamiquement
    const loadMap = async () => {
      try {
        // Charger les CSS de Leaflet
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);

        // Charger le script Leaflet
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';
        
        script.onload = () => {
          // @ts-ignore - Leaflet est chargé dynamiquement
          const L = window.L;
          
          if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
          }

          // Créer la carte
          mapInstanceRef.current = L.map(mapRef.current).setView([latitude, longitude], 13);

          // Ajouter la couche de tuiles OpenStreetMap
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          }).addTo(mapInstanceRef.current);

          // Ajouter un marqueur
          const marker = L.marker([latitude, longitude]).addTo(mapInstanceRef.current);
          
          // Ajouter une popup si un nom d'adresse est fourni
          if (addressName) {
            marker.bindPopup(`<b>${addressName}</b><br>${latitude.toFixed(4)}, ${longitude.toFixed(4)}`).openPopup();
          }
        };

        document.head.appendChild(script);

        return () => {
          // Nettoyage
          if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
          }
        };
      } catch (error) {
        console.error('Erreur lors du chargement de la carte:', error);
      }
    };

    loadMap();

    // Nettoyage au démontage
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, addressName]);

  return (
    <div 
      ref={mapRef} 
      className={`w-full rounded-lg overflow-hidden ${className}`}
      style={{ height }}
    />
  );
};

export default OpenStreetMap;
