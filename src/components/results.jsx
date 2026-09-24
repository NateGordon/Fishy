import { useState } from "react";

const Results = ({ locations, filters }) => {
  const [expandedCards, setExpandedCards] = useState(new Set());

  const toggleCard = (index) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedCards(newExpanded);
  };

  if (!locations || locations.length === 0) {
    return (
      <div className="results-container">
        <div className="results-header">
          <h4>No Results Found</h4>
        </div>
        <div className="results-empty">
          <p>No fishing spots match your criteria. Try adjusting your filters.</p>
        </div>
      </div>
    );
  }

  const formatDistance = (distance) => {
    if (distance === null || distance === undefined) return "N/A";
    if (distance < 1) {
      return `${Math.round(distance * 5280)} ft`;
    }
    return `${distance.toFixed(1)} mi`;
  };

  const getNotes = (location) => {
    const notes = [];
    if (location.notes1 && location.notes1.trim()) notes.push(location.notes1);
    if (location.notes2 && location.notes2.trim()) notes.push(location.notes2);
    if (location.notes3 && location.notes3.trim()) notes.push(location.notes3);
    if (location.notes4 && location.notes4.trim()) notes.push(location.notes4);
    return notes;
  };

  return (
    <div className="results-container">
      <div className="results-header">
        <h4>Found {locations.length} Fishing Spot{locations.length !== 1 ? 's' : ''}</h4>
      </div>
      <div className="results-list">
        {locations.map((location, index) => {
          const isExpanded = expandedCards.has(index);
          const notes = getNotes(location);
          
          return (
            <div key={location.id || index} className={`result-card ${isExpanded ? 'expanded' : ''}`}>
              <div 
                className="result-card-header clickable"
                onClick={() => toggleCard(index)}
              >
                <div className="result-card-title-section">
                  <h5>{location.name || 'Unknown'}</h5>
                  {location._distance !== null && location._distance !== undefined && (
                    <span className="result-distance">
                      {formatDistance(location._distance)} away
                    </span>
                  )}
                </div>
                <span 
                  className="expand-icon"
                  title={isExpanded ? "Show Less Info" : "Show More Info"}
                >
                  {isExpanded ? '▼' : '▶'}
                </span>
              </div>
              
              <div className="result-card-body">
                {/* Always visible summary */}
                <div className="result-info-row">
                  <span className="result-label">Location:</span>
                  <span>{location.town || 'Unknown'}</span>
                </div>
                
                <div className="result-info-row">
                  <span className="result-label">Type:</span>
                  <span>{location.water_type || 'N/A'}</span>
                </div>
                
                {location.acres && (
                  <div className="result-info-row">
                    <span className="result-label">Size:</span>
                    <span>{location.acres.toFixed(1)} acres</span>
                  </div>
                )}
                
                {location._relevantSpeciesCount !== undefined && (
                  <div className="result-info-row">
                    <span className="result-label">Matching Species:</span>
                    <span>{location._relevantSpeciesCount} of {filters.species?.length || 0} selected</span>
                  </div>
                )}
                
                {location.species && location.species.length > 0 && (
                  <div className="result-info-row">
                    <span className="result-label">Species:</span>
                    <span className="result-species">
                      {isExpanded 
                        ? location.species.join(", ")
                        : `${location.species.slice(0, 5).join(", ")}${location.species.length > 5 ? ` +${location.species.length - 5} more` : ''}`
                      }
                    </span>
                  </div>
                )}

                {/* Expanded content */}
                {isExpanded && (
                  <div className="result-expanded-content">
                    {location.depth && (
                      <div className="result-info-row">
                        <span className="result-label">Max Depth:</span>
                        <span>{location.depth} ft</span>
                      </div>
                    )}
                    
                    {location.depth_avg && (
                      <div className="result-info-row">
                        <span className="result-label">Avg Depth:</span>
                        <span>{location.depth_avg} ft</span>
                      </div>
                    )}
                    
                    {location.classification && (
                      <div className="result-info-row">
                        <span className="result-label">Classification:</span>
                        <span>{location.classification}</span>
                      </div>
                    )}
                    
                    {location.stocking && location.stocking.trim() && (
                      <div className="result-info-row">
                        <span className="result-label">Stocking:</span>
                        <span>{location.stocking}</span>
                      </div>
                    )}
                    
                    {location.trophic && location.trophic.trim() && location.trophic.trim() !== ' ' && (
                      <div className="result-info-row">
                        <span className="result-label">Trophic Status:</span>
                        <span>{location.trophic}</span>
                      </div>
                    )}
                    
                    {location.fishery_type && location.fishery_type.trim() && location.fishery_type.trim() !== ' ' && (
                      <div className="result-info-row">
                        <span className="result-label">Fishery Type:</span>
                        <span>{location.fishery_type}</span>
                      </div>
                    )}
                    
                    {location.regulations && (
                      <div className="result-info-row">
                        <span className="result-label">Regulations:</span>
                        <span className="result-regulations">{location.regulations}</span>
                      </div>
                    )}
                    
                    {location.access && location.access !== 'N' && (
                      <div className="result-info-row">
                        <span className="result-label">Access:</span>
                        <span>{location.access}</span>
                      </div>
                    )}
                    
                    {notes.length > 0 && (
                      <div className="result-info-row">
                        <span className="result-label">Notes:</span>
                        <div className="result-notes">
                          {notes.map((note, noteIndex) => (
                            <div key={noteIndex}>{note}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {location.bathy_pdf_url && location.bathy_pdf_url.trim() && (
                      <div className="result-info-row">
                        <span className="result-label">Bathymetry Map:</span>
                        <a 
                          href={location.bathy_pdf_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bathy-pdf-link"
                        >
                          View Bathymetry PDF
                        </a>
                      </div>
                    )}
                    
                    {location.latitude && location.longitude && (
                      <div className="result-info-row">
                        <span className="result-label">Coordinates:</span>
                        <span>{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</span>
                      </div>
                    )}
                    
                    <div className="result-info-row google-maps-link-row">
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="google-maps-link"
                      >
                        📍 Get Directions on Google Maps
                      </a>
                    </div>
                  </div>
                )}
              </div>
              
              {location._score !== undefined && (
                <div className="result-score">
                  Relevance Score: {location._score.toFixed(0)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Results;

