import React from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "500px",
};

const center = {
  lat: 43.1939, // New Hampshire latitude
  lng: -71.5724, // New Hampshire longitude
};

const fishingSpots = [
  { id: 1, name: "Lake Winnipesaukee", lat: 43.6034, lng: -71.3623, species: "trout", waterType: "lake" },
  { id: 2, name: "Merrimack River", lat: 42.9956, lng: -71.4548, species: "bass", waterType: "river" },
  { id: 3, name: "Squam Lake", lat: 43.7595, lng: -71.5661, species: "salmon", waterType: "lake" },
];

const Map = ({ filters }) => {
  const filteredSpots = fishingSpots.filter((spot) => {
    return (
      (filters.species === "" || spot.species === filters.species) &&
      (filters.waterType === "" || spot.waterType === filters.waterType)
    );
  });

  return (
    <LoadScript googleMapsApiKey="REDACTED-GOOGLE-API-KEY">
      <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={8}>
        {filteredSpots.map((spot) => (
          <Marker key={spot.id} position={{ lat: spot.lat, lng: spot.lng }} />
        ))}
      </GoogleMap>
    </LoadScript>
  );
};

export default Map;
