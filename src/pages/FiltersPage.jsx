import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Filters from "../components/filters";
import Map from "../components/map";
import { filterLocations, sortLocations } from "../utils/filterLocations";

function FiltersPage() {
  // Load saved filters and location from localStorage
  const loadSavedState = () => {
    try {
      const savedFilters = localStorage.getItem('fishy_filters');
      const savedLocation = localStorage.getItem('fishy_selectedLocation');
      
      return {
        filters: savedFilters ? JSON.parse(savedFilters) : {
          species: [],
          waterType: [],
          date: "",
          catchRelease: "",
          fishingMode: "",
          radius: "",
        },
        selectedLocation: savedLocation ? JSON.parse(savedLocation) : null,
      };
    } catch (error) {
      console.error('Error loading saved state:', error);
      return {
        filters: {
          species: [],
          waterType: [],
          date: "",
          catchRelease: "",
          fishingMode: "",
          radius: "",
        },
        selectedLocation: null,
      };
    }
  };

  const savedState = loadSavedState();
  const [filters, setFilters] = useState(savedState.filters);
  const [selectedLocation, setSelectedLocation] = useState(savedState.selectedLocation);
  const [allLocations, setAllLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Save filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('fishy_filters', JSON.stringify(filters));
  }, [filters]);

  // Save selected location to localStorage whenever it changes
  useEffect(() => {
    if (selectedLocation) {
      localStorage.setItem('fishy_selectedLocation', JSON.stringify(selectedLocation));
    }
  }, [selectedLocation]);

  // Clear localStorage when user closes the tab/window
  useEffect(() => {
    const clearStorage = () => {
      // Clear all saved filter data
      localStorage.removeItem('fishy_filters');
      localStorage.removeItem('fishy_selectedLocation');
    };

    // Use pagehide event (more reliable than beforeunload)
    // This fires when the page is being unloaded (tab close, navigation, etc.)
    const handlePageHide = () => {
      clearStorage();
    };

    // Use beforeunload as a fallback
    const handleBeforeUnload = () => {
      clearStorage();
    };

    // pagehide is more reliable for mobile browsers
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Load fishing locations data
  useEffect(() => {
    setIsLoading(true);
    fetch('/data/nh_fishing_locations.json')
      .then(response => response.json())
      .then(data => {
        setAllLocations(data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error loading fishing locations:', error);
        setIsLoading(false);
      });
  }, []);

  const handleSubmit = () => {
    console.log("Filters submitted:", filters);
    console.log("Selected location:", selectedLocation);
    
    if (!selectedLocation) {
      alert("Please select a location on the map first!");
      return;
    }

    // Filter locations (elimination rules applied here)
    const filtered = filterLocations(allLocations, filters, selectedLocation);
    
    // Sort by quality using rules-based scoring
    const sorted = sortLocations(filtered, filters, selectedLocation);
    
    console.log(`Found ${sorted.length} matching fishing spots`);
    
    // Navigate to results page with data in state
    navigate('/results', { 
      state: { 
        locations: sorted, 
        filters: filters,
        selectedLocation: selectedLocation
      } 
    });
  };

  const handleLocationChange = (location) => {
    setSelectedLocation(location);
  };

  return (
    <div className="App">
      <header>
        <h1>FISHY</h1>
        <h3>Find Your Next Fishing Spot</h3>
      </header>

      <div className="layout-container">
        <Filters filters={filters} setFilters={setFilters} onSubmit={handleSubmit} />
        <div className="main-content">
          <div className="map-container">
            <Map 
              selectedRadius={filters.radius} 
              onLocationChange={handleLocationChange}
              initialMarker={selectedLocation}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default FiltersPage;

