import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Component to handle map click events
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e);
    },
  });
  return null;
}

// Component to handle initial map centering
function InitialMapController({ initialPosition }) {
  const map = useMap();
  
  useEffect(() => {
    console.log('InitialMapController: initialPosition =', initialPosition);
    if (initialPosition && initialPosition[0] && initialPosition[1]) {
      console.log('InitialMapController: Centering map to', initialPosition);
      // Center and zoom to the initial position only once
      map.setView(initialPosition, 16, { animate: true });
    }
  }, [map]); // Only run once when map is ready
  
  return null;
}

export default function DraggableMap({ lat, lng, onPositionChange }) {
  const [position, setPosition] = useState(null);
  const [initialPosition, setInitialPosition] = useState(null);
  const mapRef = useRef(null);

  // Set initial position only once when component mounts
  useEffect(() => {
    console.log('DraggableMap: lat =', lat, 'lng =', lng, 'initialPosition =', initialPosition);
    if (lat && lng && lat !== 0 && lng !== 0 && !initialPosition) {
      const newPosition = [Number(lat), Number(lng)];
      console.log('DraggableMap: Setting initial position to', newPosition);
      setPosition(newPosition);
      setInitialPosition(newPosition);
    }
  }, [lat, lng]); // Remove initialPosition from dependency to avoid infinite loop

  // Round coordinates to 5 decimal places
  const roundCoordinate = (coord) => {
    return Math.round(coord * 100000) / 100000;
  };

  // Handle map click to update marker position
  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    const roundedLat = roundCoordinate(lat);
    const roundedLng = roundCoordinate(lng);
    
    const newPosition = [roundedLat, roundedLng];
    setPosition(newPosition);
    
    // Notify parent component with rounded coordinates
    onPositionChange?.({ lat: roundedLat, lng: roundedLng });
  };

  // Handle marker drag end
  const handleMarkerDragEnd = (e) => {
    const newPos = e.target.getLatLng();
    const roundedLat = roundCoordinate(newPos.lat);
    const roundedLng = roundCoordinate(newPos.lng);
    
    const newPosition = [roundedLat, roundedLng];
    setPosition(newPosition);
    
    // Notify parent component with rounded coordinates
    onPositionChange?.({ lat: roundedLat, lng: roundedLng });
  };

  // Don't render map until we have valid coordinates
  if (!position) {
    return (
      <div className="h-[250px] w-full bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return (
    <MapContainer
      ref={mapRef}
      center={position}
      zoom={16}
      scrollWheelZoom
      style={{ height: '250px', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; Google Satellite Hybrid contributors'
        url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
        maxZoom={30}
      />
      <InitialMapController initialPosition={initialPosition} />
      <Marker
        draggable={true}
        position={position}
        eventHandlers={{
          dragend: handleMarkerDragEnd,
        }}
        icon={markerIcon}
      />
      {/* Handle map click events */}
      <MapClickHandler onMapClick={handleMapClick} />
    </MapContainer>
  );
}
