'use client'

import React, { useState, useEffect, useRef } from 'react';
import Map, { Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useDebounce } from 'use-debounce';
import * as maplibregl from 'maplibre-gl';
import { MapPin, Search, Navigation, Loader2, X } from 'lucide-react';

// Flag global pour éviter l'appel multiple de setRTLTextPlugin
let rtlPluginSet = false;

interface LocationSelectorProps {
  onLocationSelect: (location: { type: 'auto' | 'manual'; coordinates?: [number, number]; address?: string }) => void;
  selectedLocation: { type: 'auto' | 'manual'; coordinates?: [number, number]; address?: string } | null;
  interactive?: boolean; // permet de désactiver les interactions et la sélection
  showSearch?: boolean; // affiche ou masque la barre de recherche
  showInstructions?: boolean; // affiche ou masque le bandeau d'instructions
}

export default function MapLibreMap({ onLocationSelect, selectedLocation, interactive = true, showSearch = true, showInstructions = true }: LocationSelectorProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 400);
  const [results, setResults] = useState<any[]>([]);
  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapRef = useRef<any>(null);

  // Activer le support RTL pour l'arabe
  useEffect(() => {
    if (!rtlPluginSet) {
      try {
        maplibregl.setRTLTextPlugin(
          'https://cdn.jsdelivr.net/npm/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.js',
          true
        );
        rtlPluginSet = true;
        console.log('RTL plugin chargé avec succès');
      } catch (error) {
        console.warn('Erreur lors du chargement du plugin RTL:', error);
        // Continuer sans le plugin RTL
      }
    }
  }, []);

  // Synchroniser avec la position sélectionnée depuis le parent
  useEffect(() => {
    if (
      selectedLocation?.coordinates &&
      !isNaN(selectedLocation.coordinates[0]) &&
      !isNaN(selectedLocation.coordinates[1])
    ) {
      setSelectedPos(selectedLocation.coordinates);
      if (mapRef.current && mapLoaded) {
        mapRef.current.flyTo({
          center: [selectedLocation.coordinates[1], selectedLocation.coordinates[0]],
          zoom: 15,
          speed: 1.2,
          curve: 1,
          easing: (t: number) => t,
        });
      }
    }
    // Ne jamais effacer selectedPos localement ici
  }, [selectedLocation, mapLoaded]);

  // Fetch des résultats de recherche
  useEffect(() => {
    const fetchData = async () => {
      if (!debouncedSearch || !showSearch) {
        setResults([]);
        setIsSearching(false);
        return;
      }
      
      setIsSearching(true);
      try {
        const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(
          debouncedSearch
        )}.json?key=TynxUPJgXshD8E6St8c6&language=fr&country=MA&type=place`;
        const res = await fetch(url);
        const data = await res.json();
        setResults(data.features || []);
      } catch (error) {
        console.error('Erreur de recherche:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    fetchData();
  }, [debouncedSearch]);

  const handleResultClick = (feature: any) => {
    const [lon, lat] = feature.geometry.coordinates;
    const coordinates: [number, number] = [lat, lon];
    
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [lon, lat],
        zoom: 15,
        speed: 1.2,
        curve: 1,
        easing: (t: number) => t,
      });
    }
    
    setSearch('');
    setResults([]);
    setSelectedPos(coordinates);
    
    // Notifier le parent
    onLocationSelect({
      type: 'manual',
      coordinates,
      address: feature.place_name
    });
  };

  const handleMapClick = (e: any) => {
    if (!interactive) return;
    // le composant parent appliquera aussi une normalisation
    const coordinates: [number, number] = [e.lngLat.lat, e.lngLat.lng];
    setSelectedPos(coordinates);
    
    // Notifier le parent avec les coordonnées
    onLocationSelect({
      type: 'manual',
      coordinates,
      address: 'Position sélectionnée sur la carte'
    });
  };

  const clearSearch = () => {
    setSearch('');
    setResults([]);
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      {/* Barre de recherche */}
      {showSearch && (
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher une adresse au Maroc..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-12 py-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            />
            {search && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            {isSearching && (
              <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />
            )}
          </div>
          
          {/* Résultats de recherche */}
          {results.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 max-h-80 overflow-y-auto">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-4 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {result.text}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {result.place_name}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Instructions */}
      {showInstructions && (
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg border border-gray-200">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
              <MapPin className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">
              Cliquez sur la carte pour sélectionner votre adresse et estimer les frais de livraison
            </p>
          </div>
        </div>
      </div>
      )}

      {/* Carte */}
      <Map
        ref={mapRef}
        initialViewState={{ 
          latitude: selectedLocation?.coordinates?.[0] ?? 34.0331, 
          longitude: selectedLocation?.coordinates?.[1] ?? -4.9998, 
          zoom: 12 
        }}
        mapStyle="https://api.maptiler.com/maps/01981e4b-857e-725a-b9af-52f62872ae00/style.json?key=TynxUPJgXshD8E6St8c6"
        style={{ width: '100%', height: '100%' }}
        mapLib={import('maplibre-gl')}
        onClick={handleMapClick}
        onLoad={() => setMapLoaded(true)}
        cursor={interactive ? 'crosshair' : 'default'}
      >
        {selectedPos && !isNaN(selectedPos[0]) && !isNaN(selectedPos[1]) && (
          <Marker 
            longitude={selectedPos[1]} 
            latitude={selectedPos[0]}
            anchor="bottom"
          >
            <div className="relative">
              {/* Marqueur principal */}
              <div className="w-12 h-12 z-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full border-4 border-white shadow-xl flex items-center justify-center animate-bounce">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              
              {/* Effet de pulsation */}
              <div className="absolute top-1/2 -right-1 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-green-500 rounded-full opacity-30 animate-ping"></div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg">
                Position sélectionnée
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
        </Marker>
        )}
      </Map>

      {/* Overlay de chargement */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Chargement de la carte...</p>
          </div>
        </div>
      )}
    </div>
  );
}