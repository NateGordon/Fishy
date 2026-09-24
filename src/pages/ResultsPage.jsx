import { useNavigate, useLocation } from "react-router-dom";
import Results from "../components/results";

function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get data from navigation state
  const { locations, filters } = location.state || {};

  const handleBack = () => {
    // Navigate back to filters page (preserving state via localStorage)
    navigate('/');
  };

  if (!locations || locations.length === 0) {
    return (
      <div className="App">
        <header>
          <h1>FISHY</h1>
          <h3>Find Your Next Fishing Spot</h3>
        </header>
        <div className="results-page-container">
          <button className="back-button" onClick={handleBack}>
            ← Back to Filters
          </button>
          <div className="results-container">
            <div className="results-empty">
              <h4>No Results Found</h4>
              <p>No fishing spots match your criteria. Try adjusting your filters.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header>
        <h1>FISHY</h1>
        <h3>Find Your Next Fishing Spot</h3>
      </header>
      <div className="results-page-container">
        <button className="back-button" onClick={handleBack}>
          ← Back to Filters
        </button>
        <Results locations={locations} filters={filters} />
      </div>
    </div>
  );
}

export default ResultsPage;

