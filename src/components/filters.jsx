import { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import SubmitButton from "./submit"; // Import SubmitButton
import { canKeepSpecies } from "../utils/checkSpeciesAvailability";

const Filters = ({ filters, setFilters, onSubmit }) => {
  const speciesOptions = [
    "Largemouth Bass", "Smallmouth Bass", "Striped Bass",
    "Brook Trout", "Brown Trout", "Rainbow Trout", "Lake Trout",
    "Landlocked Salmon", "Fallfish", "Chain Pickerel", "Northern Pike",
    "Sunfish", "Black Crappie", "White Crappie", "Yellow Perch",
    "White Perch", "Walleye", "Rock Bass", "Catfish", "Carp", "Sucker"
  ];

  const waterTypeOptions = ["Lake", "River", "Pond"];
  const enabledWaterTypeOptions = ["Lake", "Pond"]; // River is disabled
  const catchReleaseOptions = ["Keep", "Release"];
  const fishingModeOptions = [
    "Boat (Gas Motor)",
    "Boat (E-motor)",
    "Non-motor Watercraft",
    "Shore"
  ];
  const radiusOptions = [
    "5 miles", "10 miles", "15 miles", "20 miles", "30 miles", "50 miles",
    "75 miles", "All of NH"
  ];

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isWaterTypeDropdownOpen, setIsWaterTypeDropdownOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showWaterTypeTooltip, setShowWaterTypeTooltip] = useState(false);
  const dropdownRef = useRef(null);
  const waterTypeDropdownRef = useRef(null);
  const tooltipRef = useRef(null);
  const waterTypeTooltipRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
      if (waterTypeDropdownRef.current && !waterTypeDropdownRef.current.contains(e.target)) {
        setIsWaterTypeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isAllWaterTypesSelected = enabledWaterTypeOptions.length === filters.waterType.length;

  const handleSelectAllWaterTypes = (e) => {
    setFilters({
      ...filters,
      waterType: e.target.checked ? enabledWaterTypeOptions : [],
    });
  };

  // Check if all filters are filled
  // Only count enabled water types (exclude River)
  const areAllFiltersFilled = () => {
    const enabledWaterTypes = filters.waterType.filter(wt => wt !== 'River');
    return (
      filters.species.length > 0 &&
      enabledWaterTypes.length > 0 &&
      filters.date !== "" &&
      filters.catchRelease !== "" &&
      filters.fishingMode !== "" &&
      filters.radius !== ""
    );
  };

  const isFormValid = areAllFiltersFilled();

  // Check if date and catch release are filled (required for species selection)
  const canSelectSpecies = filters.date !== "" && filters.catchRelease !== "";

  // Check which species can be kept on the selected date
  // If catchRelease is "Release", all species are available
  // If catchRelease is "Keep", check if species can be kept (not catch & release required)
  const getSpeciesAvailability = () => {
    if (!canSelectSpecies || filters.catchRelease === "Release") {
      // All species available if Release selected or date/catchRelease not filled
      return {};
    }
    
    // Check which species can be kept
    const availability = {};
    speciesOptions.forEach(species => {
      availability[species] = canKeepSpecies(species, filters.date);
    });
    return availability;
  };

  const speciesAvailability = getSpeciesAvailability();

  // Check if all available species are selected
  const getAvailableSpeciesList = () => {
    if (filters.catchRelease === "Release" || !canSelectSpecies) {
      return speciesOptions;
    }
    return speciesOptions.filter(species => speciesAvailability[species] !== false);
  };
  
  const availableSpeciesList = getAvailableSpeciesList();
  const isAllSelected = availableSpeciesList.length > 0 && 
    availableSpeciesList.every(species => filters.species.includes(species));

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // Only select species that are available (not disabled)
      setFilters({
        ...filters,
        species: availableSpeciesList,
      });
    } else {
      setFilters({
        ...filters,
        species: [],
      });
    }
  };

  // Format the species display text
  const getSpeciesDisplayText = () => {
    if (filters.species.length === 0) {
      return "Select Species";
    } else if (isAllSelected || filters.species.length === speciesOptions.length) {
      return "All Species";
    } else if (filters.species.length === 1) {
      return filters.species[0];
    } else if (filters.species.length === 2) {
      return filters.species.join(", ");
    } else if (filters.species.length <= 4) {
      return filters.species.join(", ");
    } else {
      return `${filters.species.slice(0, 3).join(", ")} and ${filters.species.length - 3} more`;
    }
  };

  // Format the water type display text
  const getWaterTypeDisplayText = () => {
    if (filters.waterType.length === 0) {
      return "Select water type";
    } else if (isAllWaterTypesSelected || filters.waterType.length === enabledWaterTypeOptions.length) {
      return "All Water Types";
    } else if (filters.waterType.length === 1) {
      return filters.waterType[0];
    } else {
      return filters.waterType.join(", ");
    }
  };

  return (
    <div className="filters-container">
      <div className="filters-header">
        <h4>🎣 Filter Your Search</h4>
      </div>
      
      <div className="filter-group">
        <label className="filter-label">Date of Fishing</label>
        <input
          type="date"
          className="form-control"
          name="date"
          min={new Date().toISOString().split('T')[0]}
          onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          value={filters.date}
        />
      </div>

      <div className="filter-group">
        <label className="filter-label">Catch and Release?</label>
        <select
          className="form-select"
          name="catchRelease"
          onChange={(e) => setFilters({ ...filters, catchRelease: e.target.value })}
          value={filters.catchRelease}
        >
          <option value="">Select preference</option>
          {catchReleaseOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">Species</label>
        <div 
          className="dropdown-wrapper"
          onMouseEnter={() => filters.species.length > 0 && setShowTooltip(true)}
          onMouseLeave={(e) => {
            // Check if mouse is moving to tooltip
            const relatedTarget = e.relatedTarget;
            if (!relatedTarget || !tooltipRef.current || !tooltipRef.current.contains(relatedTarget)) {
              setShowTooltip(false);
            }
          }}
        >
          <select 
            className={`form-select ${!canSelectSpecies ? 'disabled' : ''}`}
            onClick={() => canSelectSpecies && setIsDropdownOpen(!isDropdownOpen)}
            onChange={() => {}} // Prevent warning - this is a display-only select
            value={getSpeciesDisplayText()}
            disabled={!canSelectSpecies}
            style={!canSelectSpecies ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            <option>
              {!canSelectSpecies ? "Select date and catch & release first" : getSpeciesDisplayText()}
            </option>
          </select>
          {showTooltip && filters.species.length > 0 && (
            <div 
              className="species-tooltip"
              ref={tooltipRef}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <div className="species-tooltip-content">
                {filters.species.map((species, index) => (
                  <div key={index}>{species}</div>
                ))}
              </div>
            </div>
          )}
          {isDropdownOpen && canSelectSpecies && (
            <div className="dropdown-menu show" ref={dropdownRef}>
              {/* Select All Checkbox */}
              <label className="dropdown-item">
                <input 
                  type="checkbox" 
                  checked={isAllSelected} 
                  onChange={handleSelectAll}
                />
                <span>Select All</span>
              </label>
              
              {/* Individual Species Checkboxes */}
              {speciesOptions.map((species) => {
                const isDisabled = filters.catchRelease === "Keep" && speciesAvailability[species] === false;
                const isChecked = filters.species.includes(species);
                return (
                  <label 
                    key={species} 
                    className={`dropdown-item ${isDisabled ? 'disabled' : ''}`}
                    style={isDisabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  >
                    <input
                      type="checkbox"
                      value={species}
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={(e) => {
                        if (isDisabled) return;
                        const { value, checked } = e.target;
                        let updatedSpecies = checked
                          ? [...filters.species, value]
                          : filters.species.filter((s) => s !== value);
                        setFilters({ ...filters, species: updatedSpecies });
                      }}
                    />
                    <span style={isDisabled ? { color: '#999' } : {}}>
                      {species}
                      {isDisabled && <span style={{ fontSize: '0.85em', marginLeft: '5px', fontStyle: 'italic' }}>(Catch & Release Required)</span>}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="filter-group">
        <label className="filter-label">Body of Water</label>
        <div 
          className="dropdown-wrapper"
          onMouseEnter={() => filters.waterType.length > 0 && setShowWaterTypeTooltip(true)}
          onMouseLeave={() => setShowWaterTypeTooltip(false)}
        >
          <select 
            className="form-select" 
            onClick={() => setIsWaterTypeDropdownOpen(!isWaterTypeDropdownOpen)}
            onChange={() => {}} // Prevent warning - this is a display-only select
            value={getWaterTypeDisplayText()}
          >
            <option>{getWaterTypeDisplayText()}</option>
          </select>
          {showWaterTypeTooltip && filters.waterType.length > 0 && (
            <div 
              className="species-tooltip"
              ref={waterTypeTooltipRef}
              onMouseEnter={() => setShowWaterTypeTooltip(true)}
              onMouseLeave={() => setShowWaterTypeTooltip(false)}
            >
              <div className="species-tooltip-content">
                {filters.waterType.map((waterType, index) => (
                  <div key={index}>{waterType}</div>
                ))}
              </div>
            </div>
          )}
          {isWaterTypeDropdownOpen && (
            <div className="dropdown-menu show" ref={waterTypeDropdownRef}>
              {/* Select All Checkbox */}
              <label className="dropdown-item">
                <input type="checkbox" checked={isAllWaterTypesSelected} onChange={handleSelectAllWaterTypes} />
                <span>Select All</span>
              </label>
              
              {/* Individual Water Type Checkboxes */}
              {waterTypeOptions.map((waterType) => {
                const isDisabled = waterType === "River";
                const isChecked = filters.waterType.includes(waterType);
                return (
                  <label 
                    key={waterType} 
                    className={`dropdown-item ${isDisabled ? 'disabled' : ''}`}
                    style={isDisabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  >
                    <input
                      type="checkbox"
                      value={waterType}
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={(e) => {
                        if (isDisabled) return; // Prevent changes to disabled option
                        const { value, checked } = e.target;
                        let updatedWaterTypes = checked
                          ? [...filters.waterType, value]
                          : filters.waterType.filter((wt) => wt !== value);
                        setFilters({ ...filters, waterType: updatedWaterTypes });
                      }}
                    />
                    <span style={isDisabled ? { color: '#999' } : {}}>
                      {waterType}
                      {isDisabled && <span style={{ fontSize: '0.85em', marginLeft: '5px', fontStyle: 'italic' }}>(Coming Soon)</span>}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="filter-group">
        <label className="filter-label">Mode of Fishing</label>
        <select
          className="form-select"
          name="fishingMode"
          onChange={(e) => setFilters({ ...filters, fishingMode: e.target.value })}
          value={filters.fishingMode}
        >
          <option value="">Select mode</option>
          {fishingModeOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">Search Radius</label>
        <select
          className="form-select"
          name="radius"
          onChange={(e) => setFilters({ ...filters, radius: e.target.value })}
          value={filters.radius}
        >
          <option value="">Select radius</option>
          {radiusOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      <div className="submit-container">
        <SubmitButton onClick={onSubmit} disabled={!isFormValid} />
      </div>
    </div>
  );
};

export default Filters;
