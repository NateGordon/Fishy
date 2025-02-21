import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import SubmitButton from "./submit"; // Import SubmitButton

const Filters = ({ filters, setFilters, onSubmit }) => {
  const speciesOptions = [
    "Largemouth Bass", "Smallmouth Bass", "Striped Bass",
    "Brook Trout", "Brown Trout", "Rainbow Trout", "Lake Trout",
    "Landlocked Salmon", "Fallfish", "Chain Pickerel", "Northern Pike",
    "Sunfish", "Black Crappie", "White Crappie", "Yellow Perch",
    "White Perch", "Walleye", "Rock Bass", "Catfish", "Carp", "Sucker"
  ];

  const waterTypeOptions = ["Lake", "River", "Pond"];
  const catchReleaseOptions = ["Yes", "No"];
  const radiusOptions = [
    "5 miles", "10 miles", "15 miles", "20 miles", "30 miles", "50 miles",
    "75 miles", "100 miles", "150 miles", "All of NH"
  ];

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="container filters-container mt-4">
      <div className="row">
        <div className="col-12 mb-3">
          <select className="form-select" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            <option>Select Species</option>
          </select>
          {isDropdownOpen && (
            <div className="dropdown-menu show" ref={dropdownRef} style={{ maxHeight: "400px", overflowY: "auto" }}>
              {speciesOptions.map((species) => (
                <label key={species} className="dropdown-item">
                  <input type="checkbox" value={species} checked={filters.species.includes(species)}
                    onChange={(e) => {
                      const { value, checked } = e.target;
                      let updatedSpecies = checked
                        ? [...filters.species, value]
                        : filters.species.filter((s) => s !== value);
                      setFilters({ ...filters, species: updatedSpecies });
                    }}
                  />
                  {species}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="col-12 mb-3">
          <select className="form-select" name="waterType"
            onChange={(e) => setFilters({ ...filters, waterType: e.target.value })}
            value={filters.waterType}>
            <option value="">Body of Water</option>
            {waterTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>

        <div className="col-12 mb-3">
          <input type="date" className="form-control" name="date"
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            value={filters.date}
          />
        </div>

        <div className="col-12 mb-3">
          <select className="form-select" name="catchRelease"
            onChange={(e) => setFilters({ ...filters, catchRelease: e.target.value })}
            value={filters.catchRelease}>
            <option value="">Catch & Release</option>
            {catchReleaseOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>

        <div className="col-12 mb-3">
          <select className="form-select" name="radius"
            onChange={(e) => setFilters({ ...filters, radius: e.target.value })}
            value={filters.radius}>
            <option value="">Radius (mi)</option>
            {radiusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>

        {/* Submit Button */}
        <div className="col-12 text-center">
          <SubmitButton onClick={onSubmit} />
        </div>
      </div>
    </div>
  );
};

export default Filters;
