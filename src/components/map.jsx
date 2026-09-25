import { useState, useCallback, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon in React-Leaflet
// This is needed because webpack/vite doesn't handle the default icon paths correctly
const DefaultIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// New Hampshire bounds
const nhBounds = [
  [42.7, -72.55], // Southwest corner [lat, lng]
  [45.3, -70.7]   // Northeast corner [lat, lng]
];

// Approximate New Hampshire state boundary coordinates (simplified rectangular boundary)
// Using a more accurate rectangular approximation of NH
const nhBoundary = [
  [45.305, -72.557], // Northwest
  [45.305, -70.694], // Northeast  
  [42.697, -70.694], // Southeast
  [42.697, -72.557], // Southwest
  [45.305, -72.557]  // Back to start
];

// Large bounding box covering surrounding area (for gray overlay)
const overlayBounds = [
  [30, -80],  // Southwest corner (covers large area)
  [50, -65]   // Northeast corner
];

// Convert radius string to meters
const radiusToMeters = (radiusStr) => {
  if (!radiusStr || radiusStr === "All of NH") return null;
  const miles = parseInt(radiusStr);
  if (isNaN(miles)) return null;
  // Convert miles to meters (1 mile ≈ 1609.34 meters)
  return miles * 1609.34;
};

// Component to handle map clicks
function MapClickHandler({ onMapClick, isWithinBounds }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      if (isWithinBounds(lat, lng)) {
        onMapClick({ lat, lng });
      }
    },
  });
  return null;
}

// Component to create gray overlay mask (everything except NH)
// Creates polygons around NH to gray out surrounding states
function GrayOverlay() {
  const map = useMap();
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!overlayRef.current && map) {
      try {
        const layers = [];
        const grayStyle = {
          fillColor: '#808080',
          fillOpacity: 0.6,
          color: 'transparent',
          weight: 0,
          interactive: false
        };

        // Create 4 rectangles around NH to gray out surrounding areas
        // Rectangle format: [[south, west], [north, east]]
        
        // Top rectangle (above NH)
        const topRect = L.rectangle([
          [nhBoundary[0][0], overlayBounds[0][1]], // SW: top of NH, west edge
          [overlayBounds[1][0], overlayBounds[1][1]] // NE: far north, far east
        ], grayStyle).addTo(map);
        layers.push(topRect);

        // Bottom rectangle (below NH)
        const bottomRect = L.rectangle([
          [overlayBounds[0][0], overlayBounds[0][1]], // SW: far south, far west
          [nhBoundary[2][0], overlayBounds[1][1]] // NE: bottom of NH, far east
        ], grayStyle).addTo(map);
        layers.push(bottomRect);

        // Left rectangle (west of NH)
        const leftRect = L.rectangle([
          [nhBoundary[3][0], overlayBounds[0][1]], // SW: bottom of NH, far west
          [nhBoundary[0][0], nhBoundary[3][1]] // NE: top of NH, west edge of NH
        ], grayStyle).addTo(map);
        layers.push(leftRect);

        // Right rectangle (east of NH)
        const rightRect = L.rectangle([
          [nhBoundary[2][0], nhBoundary[1][1]], // SW: bottom of NH, east edge of NH
          [nhBoundary[1][0], overlayBounds[1][1]] // NE: top of NH, far east
        ], grayStyle).addTo(map);
        layers.push(rightRect);

        // Add NH state boundary outline for visual clarity
        const nhOutline = L.polygon(nhBoundary, {
          fillColor: 'transparent',
          fillOpacity: 0,
          color: '#333333',
          weight: 2,
          opacity: 0.8,
          dashArray: '5, 5',
          interactive: false
        }).addTo(map);
        layers.push(nhOutline);

        overlayRef.current = { layers };
      } catch (error) {
        console.error('Error creating gray overlay:', error);
      }
    }

    return () => {
      if (overlayRef.current && map) {
        try {
          overlayRef.current.layers.forEach(layer => {
            if (map.hasLayer(layer)) {
              map.removeLayer(layer);
            }
          });
        } catch (error) {
          console.error('Error removing gray overlay:', error);
        }
      }
    };
  }, [map]);

  return null;
}

export default function Map({ selectedRadius, onLocationChange, initialMarker }) {
  const [marker, setMarker] = useState(initialMarker || null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [addressQuery, setAddressQuery] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const mapInstanceRef = useRef(null);
  const addressFormRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Update marker when initialMarker prop changes
  useEffect(() => {
    if (initialMarker) {
      setMarker(initialMarker);
    }
  }, [initialMarker]);

  // Close the address suggestions dropdown when clicking outside it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (addressFormRef.current && !addressFormRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Clean up any in-flight debounce/request on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Check if position is within NH bounds
  const isWithinBounds = useCallback((lat, lng) => {
    return (
      lat >= nhBounds[0][0] &&
      lat <= nhBounds[1][0] &&
      lng >= nhBounds[0][1] &&
      lng <= nhBounds[1][1]
    );
  }, []);

  // Handle map click to place marker
  const handleMapClick = useCallback((location) => {
    setMarker(location);
    if (onLocationChange) {
      onLocationChange(location);
    }
  }, [onLocationChange]);

  // Handle getting user's current location
  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        if (isWithinBounds(latitude, longitude)) {
          const location = { lat: latitude, lng: longitude };
          setMarker(location);
          if (onLocationChange) {
            onLocationChange(location);
          }
          
          // Center map on user's location
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([latitude, longitude], 10);
          }
          
          setLocationError(null);
        } else {
          setLocationError("Your location is outside of New Hampshire. Please click on the map to select a location within NH.");
        }
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location permission denied. Please allow location access or click on the map to select a location.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information is unavailable. Please click on the map to select a location.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out. Please try again or click on the map to select a location.");
            break;
          default:
            setLocationError("An error occurred while getting your location. Please click on the map to select a location.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [isWithinBounds, onLocationChange]);

  // Fetch address suggestions (debounced) from OpenStreetMap's Nominatim geocoder
  const fetchSuggestions = useCallback(async (query) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=us&q=${encodeURIComponent(`${query}, New Hampshire`)}`;
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Geocoding request failed: ${response.status}`);
      }
      const results = await response.json();
      setSuggestions(
        results.map((r) => ({
          label: r.display_name,
          lat: parseFloat(r.lat),
          lon: parseFloat(r.lon),
        }))
      );
      setShowSuggestions(true);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching address suggestions:', error);
      }
    }
  }, []);

  // Debounce suggestion fetches as the user types
  const handleAddressInputChange = useCallback((e) => {
    const value = e.target.value;
    setAddressQuery(value);
    setHighlightedIndex(-1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = value.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(trimmed);
    }, 400);
  }, [fetchSuggestions]);

  // Place the pin at a chosen suggestion
  const selectSuggestion = useCallback((suggestion) => {
    if (!isWithinBounds(suggestion.lat, suggestion.lon)) {
      setLocationError("That address is outside New Hampshire. Please enter an NH address or click on the map.");
      setShowSuggestions(false);
      return;
    }

    const location = { lat: suggestion.lat, lng: suggestion.lon };
    setMarker(location);
    if (onLocationChange) {
      onLocationChange(location);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([suggestion.lat, suggestion.lon], 12);
    }
    setAddressQuery(suggestion.label);
    setSuggestions([]);
    setShowSuggestions(false);
    setLocationError(null);
  }, [isWithinBounds, onLocationChange]);

  const handleAddressKeyDown = useCallback((e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }, [showSuggestions, suggestions, highlightedIndex, selectSuggestion]);

  // Handle direct search submission (Enter without picking a suggestion, or clicking Search)
  const handleAddressSearch = useCallback(async (e) => {
    e.preventDefault();
    const query = addressQuery.trim();
    if (!query || isGeocoding) return;

    setShowSuggestions(false);
    setIsGeocoding(true);
    setLocationError(null);

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=${encodeURIComponent(`${query}, New Hampshire`)}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Geocoding request failed: ${response.status}`);
      }
      const results = await response.json();

      if (!results || results.length === 0) {
        setLocationError("Couldn't find that address. Try being more specific, or click directly on the map.");
        return;
      }

      const latitude = parseFloat(results[0].lat);
      const longitude = parseFloat(results[0].lon);

      if (!isWithinBounds(latitude, longitude)) {
        setLocationError("That address is outside New Hampshire. Please enter an NH address or click on the map.");
        return;
      }

      const location = { lat: latitude, lng: longitude };
      setMarker(location);
      if (onLocationChange) {
        onLocationChange(location);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([latitude, longitude], 12);
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      setLocationError("Something went wrong searching for that address. Please try again or click on the map.");
    } finally {
      setIsGeocoding(false);
    }
  }, [addressQuery, isGeocoding, isWithinBounds, onLocationChange]);

  // Calculate radius in meters
  const radiusMeters = radiusToMeters(selectedRadius);

  // Handle map creation to prevent double initialization
  const handleMapRef = useCallback((map) => {
    if (map && !mapInstanceRef.current) {
      mapInstanceRef.current = map;
      // Invalidate size to ensure map renders correctly
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }, []);

  // Determine initial center - use marker location if available, otherwise center on NH
  const initialCenter = initialMarker ? [initialMarker.lat, initialMarker.lng] : [43.5, -71.5724];
  const initialZoom = initialMarker ? 10 : 7; // Zoom in more if marker is present

  return (
    <div style={{ width: '100%', height: '500px', position: 'relative' }}>
      {/* Address Search */}
      <form className="address-search-form" onSubmit={handleAddressSearch} ref={addressFormRef}>
        <div className="address-search-input-wrapper">
          <input
            type="text"
            className="address-search-input"
            placeholder="Enter an address in NH…"
            value={addressQuery}
            onChange={handleAddressInputChange}
            onKeyDown={handleAddressKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            autoComplete="off"
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="address-suggestions">
              {suggestions.map((suggestion, index) => (
                <li
                  key={`${suggestion.lat}-${suggestion.lon}-${index}`}
                  className={`address-suggestion-item ${index === highlightedIndex ? 'highlighted' : ''}`}
                  onClick={() => selectSuggestion(suggestion)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {suggestion.label}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="submit"
          className="address-search-button"
          disabled={isGeocoding || !addressQuery.trim()}
        >
          {isGeocoding ? 'Searching…' : '🔍 Search'}
        </button>
      </form>

      {/* Use My Location Button */}
      <button
        onClick={handleUseMyLocation}
        disabled={isLocating}
        className="use-location-button"
        title="Use your current location"
      >
        {isLocating ? '📍 Locating...' : '📍 Use My Location'}
      </button>
      
      {/* Location Error Message */}
      {locationError && (
        <div className="location-error-message">
          {locationError}
          <button 
            className="location-error-close"
            onClick={() => setLocationError(null)}
            aria-label="Close error message"
          >
            ×
          </button>
        </div>
      )}
      
      <MapContainer
        key="nh-fishing-map"
        center={initialCenter}
        zoom={initialZoom}
        style={{ width: '100%', height: '500px' }}
        minZoom={5}
        maxZoom={13}
        maxBounds={[
          [nhBounds[0][0], nhBounds[0][1]],
          [nhBounds[1][0], nhBounds[1][1]]
        ]}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        zoomControl={true}
        ref={handleMapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Gray overlay mask (everything except NH) */}
        <GrayOverlay />
        
        {/* Map click handler */}
        <MapClickHandler onMapClick={handleMapClick} isWithinBounds={isWithinBounds} />
        
        {/* Marker */}
        {marker && (
          <Marker
            position={[marker.lat, marker.lng]}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const newPosition = e.target.getLatLng();
                const newLocation = { lat: newPosition.lat, lng: newPosition.lng };
                if (isWithinBounds(newLocation.lat, newLocation.lng)) {
                  setMarker(newLocation);
                  if (onLocationChange) {
                    onLocationChange(newLocation);
                  }
                } else {
                  // Reset to previous position if dragged outside bounds
                  e.target.setLatLng([marker.lat, marker.lng]);
                }
              },
            }}
          />
        )}
        
        {/* Radius circle overlay */}
        {marker && radiusMeters && (
          <Circle
            center={[marker.lat, marker.lng]}
            radius={radiusMeters}
            pathOptions={{
              color: '#3388ff',
              fillColor: '#3388ff',
              fillOpacity: 0.2,
              weight: 2,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
