import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css"; // Import Bootstrap CSS

const Filters = ({ filters, setFilters }) => {
  const speciesOptions = [
    "Largemouth Bass", "Smallmouth Bass", "Striped Bass", "Rock Bass",
    "Brook Trout", "Brown Trout", "Rainbow Trout", "Lake Trout",
    "Landlocked Salmon", "Fallfish", "Chain Pickerel", "Northern Pike",
    "Sunfish", "Black Crappie", "White Crappie", "Yellow Perch",
    "White Perch", "Walleye", "Catfish", "Carp", "Sucker"
  ];

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handles checkbox change for species
  const handleSpeciesCheckboxChange = (e) => {
    const { value, checked } = e.target;
    let updatedSpecies = [...filters.species];

    if (checked) {
      updatedSpecies.push(value);
    } else {
      updatedSpecies = updatedSpecies.filter(species => species !== value);
    }

    setFilters({ ...filters, species: updatedSpecies });
  };

  // Handles "Select All" checkbox
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setFilters({ ...filters, species: speciesOptions });
    } else {
      setFilters({ ...filters, species: [] });
    }
  };

  // Handles other filters (single select inputs)
  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-6">
          {/* Custom Dropdown for Species */}
          <div className="dropdown" ref={dropdownRef}>
            <button
              className="btn btn-secondary dropdown-toggle"
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              Select Species
            </button>
            {isDropdownOpen && (
              <div className="dropdown-menu show">
                <label className="dropdown-item">
                  <input
                    type="checkbox"
                    value="all"
                    checked={filters.species.length === speciesOptions.length}
                    onChange={handleSelectAll}
                  />
                  Select All
                </label>
                {speciesOptions.map((species) => (
                  <label key={species} className="dropdown-item">
                    <input
                      type="checkbox"
                      value={species}
                      checked={filters.species.includes(species)}
                      onChange={handleSpeciesCheckboxChange}
                    />
                    {species}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-md-6">
          {/* Water Type */}
          <select
            className="form-select mb-3"
            name="waterType"
            onChange={handleChange}
            value={filters.waterType}
          >
            <option value="">Body of Water</option>
            <option value="lake">Lake</option>
            <option value="river">River</option>
            <option value="pond">Pond</option>
          </select>

          {/* Date */}
          <input
            type="date"
            className="form-control mb-3"
            name="date"
            onChange={handleChange}
            value={filters.date}
          />

          {/* Catch & Release */}
          <select
            className="form-select mb-3"
            name="catchRelease"
            onChange={handleChange}
            value={filters.catchRelease}
          >
            <option value="">Catch & Release</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>

          {/* Radius */}
          <select
            className="form-select mb-3"
            name="radius"
            onChange={handleChange}
            value={filters.radius}
          >
            <option value="">Radius (mi)</option>
            <option value="10">10 miles</option>
            <option value="25">25 miles</option>
            <option value="50">50 miles</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default Filters;



// import React from "react";

// const Filters = ({ filters, setFilters }) => {
//   const handleChange = (e) => {
//     setFilters({ ...filters, [e.target.name]: e.target.value });
//   };

//   return (
//     <div className="filters">
//       <select name="species" onChange={handleChange} value={filters.species}>
//         <option value="">Select Species</option>
//         <option value="Largemouth Bass">Largemouth Bass</option>
//         <option value="Smallmouth Bass">Smallmouth Bass</option>
//         <option value="Striped Bass">Striped Bass</option>
//         <option value="Rock Bass">Rock Bass</option>
//         <option value="Brook Trout">Brook Trout</option>
//         <option value="Brown Trout">Brown Trout</option>
//         <option value="Rainbow Trout">Rainbow Trout</option>
//         <option value="Lake Trout">Lake Trout</option>
//         <option value="Landlocked Salmon">Landlocked Salmon</option>
//         <option value="Fallfish">Fallfish</option>
//         <option value="Chain Pickerel">Pickerel</option>
//         <option value="Northern Pike">Northern Pike</option>
//         <option value="Sunfish">Sunfish</option>
//         <option value="Black Crappie">Black Crappie</option>
//         <option value="White Crappie">White Crappie</option>
//         <option value="Yellow Perch">Yellow Perch</option>
//         <option value="White Perch">White Perch</option>
//         <option value="Walleye">Walleye</option>
//         <option value="catfish">Catfish</option>
//         <option value="Carp">Carp</option>
//         <option value="Sucker">Sucker</option>
//       </select>

//       <select name="waterType" onChange={handleChange} value={filters.waterType}>
//         <option value="">Body of Water</option>
//         <option value="lake">Lake</option>
//         <option value="river">River</option>
//         <option value="pond">Pond</option>
//       </select>

//       <input type="date" name="date" onChange={handleChange} value={filters.date} />

//       <select name="catchRelease" onChange={handleChange} value={filters.catchRelease}>
//         <option value="">Catch & Release</option>
//         <option value="yes">Yes</option>
//         <option value="no">No</option>
//       </select>

//       <select name="radius" onChange={handleChange} value={filters.radius}>
//         <option value="">Radius (mi)</option>
//         <option value="10">10 miles</option>
//         <option value="25">25 miles</option>
//         <option value="50">50 miles</option>
//       </select>
//     </div>
//   );
// };

// export default Filters;
