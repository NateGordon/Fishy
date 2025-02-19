import React, { useState } from "react";
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";

const mapOptions = {
  zoom: 7, // Initial zoom level
  center: { lat: 42.5, lng: -71.5724 }, // Centered on NH
  disableDefaultUI: true, // Removes UI controls
  draggable: true, // Allows dragging
  zoomControl: true, // Allows zoom control
  scrollwheel: true, // Blocks scroll zoom
  disableDoubleClickZoom: true, // Prevents zooming by double-click
  restriction: {
    latLngBounds: {
      north: 46.3,  // North boundary of NH
      south: 41.7,  // South boundary of NH
      east: -68.9,  // East boundary of NH
      west: -74.1,  // West boundary of NH
    },
    strictBounds: true, // Restricts movement within bounds
  },
  minZoom: 5, // Minimum zoom level (prevents zooming out too far)
  maxZoom: 10, // Maximum zoom level (prevents zooming in too much)
};

const containerStyle = {
  width: "100%",
  height: "100vh", // Ensure it takes full viewport height
};

export default function Map() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "REDACTED-GOOGLE-API-KEY", // Replace with your API key
  });

  const [markers, setMarkers] = useState([]);

  // New Hampshire bounds for restriction
  const nhBounds = {
    north: 45.3,  // North boundary of NH
    south: 42.7,  // South boundary of NH
    east: -70.7,  // East boundary of NH
    west: -72.55,  // West boundary of NH
  };

  // Check if clicked position is within NH bounds
  const isWithinBounds = (lat, lng) => {
    return (
      lat >= nhBounds.south &&
      lat <= nhBounds.north &&
      lng >= nhBounds.west &&
      lng <= nhBounds.east
    );
  };

  // Handle click event to drop pin
  const handleMapClick = (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    // Only place marker if it's within NH bounds
    if (isWithinBounds(lat, lng)) {
      const newMarker = {
        lat,
        lng,
      };
      setMarkers([newMarker]); // Set only one marker at a time
    }
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={mapOptions.center}
      zoom={mapOptions.zoom}
      options={mapOptions}
      onClick={handleMapClick} // Set up the click event
    >
      {markers.map((marker, index) => (
        <Marker key={index} position={marker} />
      ))}
    </GoogleMap>
  );
}


// import React, { useState } from "react";
// import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";

// const mapOptions = {
//   zoom: 7, // Fixed zoom level
//   center: { lat: 42.5, lng: -71.5724 }, // Centered on NH
//   disableDefaultUI: true, // Removes UI controls
//   draggable: true, // Prevents dragging
//   zoomControl: true, // Disables zoom buttons
//   scrollwheel: true, // Blocks scroll zoom
//   disableDoubleClickZoom: true, // Prevents zooming by double-click
// };

// const containerStyle = {
//   width: "50vw",
//   height: "100vh", // Adjust height as needed
// };

// const mapWrapperStyle = {
//   display: "flex",
//   justifyContent: "center", // Horizontally centers the map
//   alignItems: "center", // Vertically centers the map
//   height: "100vh", // Ensures the wrapper takes full viewport height
// };

// export default function Map() {
//   const { isLoaded } = useLoadScript({
//     googleMapsApiKey: "REDACTED-GOOGLE-API-KEY", // Replace with your API key
//   });

//   const [marker, setMarker] = useState(null); // Store a single marker's position

//   const handleMapClick = (event) => {
//     const newMarker = {
//       lat: event.latLng.lat(),
//       lng: event.latLng.lng(),
//     };
//     setMarker(newMarker); // Update the position of the single marker
//   };

//   if (!isLoaded) return <div>Loading...</div>;

//   return (
//     <div style={mapWrapperStyle}>
//       <GoogleMap
//         mapContainerStyle={containerStyle}
//         center={mapOptions.center}
//         zoom={mapOptions.zoom}
//         options={mapOptions}
//         onClick={handleMapClick} // Set up the click event
//       >
//         {marker && <Marker position={marker} />} {/* Only one marker is displayed */}
//       </GoogleMap>
//     </div>
//   );
// }
