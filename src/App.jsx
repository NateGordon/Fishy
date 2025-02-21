import React, { useState } from "react";
import Filters from "./components/Filters";
import Map from "./components/Map";
import "./styles.css";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const [filters, setFilters] = useState({
    species: [],
    waterType: "",
    date: "",
    catchRelease: "",
    radius: "",
  });

  const handleSubmit = () => {
    console.log("Filters submitted:", filters);
    // Add logic to fetch filtered results here
  };

  return (
    <div>
      <header>
        <h1>FISHY</h1>
        <h3>Find Your Next Fishing Spot</h3>
      </header>

      <div className="layout-container">
        <Filters filters={filters} setFilters={setFilters} onSubmit={handleSubmit} />
        <Map />
      </div>
    </div>
  );
}

export default App;
