import React from "react";

const Filters = ({ filters, setFilters }) => {
  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="filters">
      <select name="species" onChange={handleChange} value={filters.species}>
        <option value="">Select Species</option>
        <option value="Largemouth Bass">largemouthbass</option>
        <option value="Smallmouth Bass">smallmouthbass</option>
        <option value="Striped Bass">striped</option>
        <option value="Rock Bass">rock</option>
        <option value="Brook Trout">brooktrout</option>
        <option value="Brown Trout">browntrout</option>
        <option value="Rainbow Trout">rainbowtrout</option>
        <option value="Lake Trout">laketrout</option>
        <option value="Landlocked Salmon">landlockedsalmon</option>
        <option value="Fallfish">fallfish</option>
        <option value="Chain Pickerel">pickerel</option>
        <option value="Northern Pike">northernpike</option>
        <option value="Sunfish">sunfish</option>
        <option value="Black Crappie">blackcrappie</option>
        <option value="White Crappie">whitecrappie</option>
        <option value="Yellow Perch">yellowperch</option>
        <option value="White Perch">whiteperch</option>
        <option value="Walleye">walleye</option>
        <option value="catfish">catfish</option>
        <option value="Carp">carp</option>
        <option value="Sucker">sucker</option>
      </select>

      <select name="waterType" onChange={handleChange} value={filters.waterType}>
        <option value="">Body of Water</option>
        <option value="lake">Lake</option>
        <option value="river">River</option>
        <option value="pond">Pond</option>
      </select>

      <input type="date" name="date" onChange={handleChange} value={filters.date} />

      <select name="catchRelease" onChange={handleChange} value={filters.catchRelease}>
        <option value="">Catch & Release</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>

      <select name="radius" onChange={handleChange} value={filters.radius}>
        <option value="">Radius (mi)</option>
        <option value="10">10 miles</option>
        <option value="25">25 miles</option>
        <option value="50">50 miles</option>
      </select>
    </div>
  );
};

export default Filters;
