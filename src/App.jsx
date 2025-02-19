import React, { useState } from "react";
import Filters from "./components/filters";
import Map from "./components/map";
import "./styles.css";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const [filters, setFilters] = useState({
    species: "",
    waterType: "",
    date: "",
    catchRelease: "",
    radius: "",
  });

  return (
    <div>
      <header>
        <h1>Fishy</h1>
        <h3>Find Your Next Fishing Spot</h3>
      </header>

      {/* Wrap filters and map inside a container */}
      <div className="layout-container">
        <Filters filters={filters} setFilters={setFilters} />
        <Map filters={filters} />
      </div>
    </div>
  );
}

export default App;
