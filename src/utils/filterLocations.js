/**
 * Filter fishing locations based on user criteria
 */

import { areSpeciesInSeason } from './seasonRegulations';

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in miles
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Filter locations based on all criteria
 */
export function filterLocations(locations, filters, selectedLocation) {
  if (!locations || locations.length === 0) {
    return [];
  }

  let filtered = locations;

  // 1. Water Type Filter
  // Remove "River" from filters if present (disabled option)
  const enabledWaterTypes = (filters.waterType || []).filter(wt => wt !== 'River');
  
  if (enabledWaterTypes.length > 0) {
    filtered = filtered.filter(location => {
      const locationWaterType = location.water_type || '';
      return enabledWaterTypes.some(wt => 
        locationWaterType.toLowerCase() === wt.toLowerCase()
      );
    });
  }

  // 2. Species Filter
  if (filters.species && filters.species.length > 0) {
    filtered = filtered.filter(location => {
      const locationSpecies = location.species || [];
      // Check if location has ANY of the selected species
      return filters.species.some(selectedSpecies =>
        locationSpecies.some(locSpecies =>
          locSpecies.toLowerCase() === selectedSpecies.toLowerCase()
        )
      );
    });
  }

  // 3. Date/Season Filter
  if (filters.date) {
    filtered = filtered.filter(location => {
      // Check if all selected species are in season on this date
      if (filters.species && filters.species.length > 0) {
        const seasonCheck = areSpeciesInSeason(
          location,
          filters.species,
          filters.date
        );
        return seasonCheck.allInSeason;
      }
      // If no species selected, check if location has any species in season
      const locationSpecies = location.species || [];
      if (locationSpecies.length === 0) {
        return true; // No species data, assume available
      }
      // Check if at least one species is in season
      const seasonCheck = areSpeciesInSeason(
        location,
        locationSpecies,
        filters.date
      );
      return seasonCheck.details.some(d => d.inSeason);
    });
  }

  // 4. Catch & Release Filter
  // Note: Catch & release is always allowed in NH unless regulations require it
  // This filter is about user preference and season-based requirements
  if (filters.catchRelease && filters.catchRelease !== 'Not sure') {
    filtered = filtered.filter(location => {
      // Check if catch & release is required on the selected date (e.g., bass May 15 - June 15)
      if (filters.date && filters.species && filters.species.length > 0) {
        const seasonCheck = areSpeciesInSeason(
          location,
          filters.species,
          filters.date
        );
        
        if (filters.catchRelease === 'Release') {
          // User wants catch & release - include all (it's always allowed)
          // Optionally prioritize waters where it's required
          return true;
        } else if (filters.catchRelease === 'Keep') {
          // User wants to keep fish - exclude if catch & release is required during this period
          return !seasonCheck.anyCatchReleaseRequired;
        }
      }

      // If no date/species context, include all (catch & release is always allowed)
      return true;
    });
  }

  // 5. Mode of Fishing Filter
  if (filters.fishingMode) {
    filtered = filtered.filter(location => {
      const regulations = (location.regulations || '').toLowerCase();
      const access = (location.access || '').toLowerCase();
      const notes1 = ((location.notes1 || '') + ' ' + (location.notes2 || '') + ' ' + (location.notes3 || '') + ' ' + (location.notes4 || '')).toLowerCase();
      const allRegulations = (regulations + ' ' + notes1).toLowerCase();
      
      // Check for motor restrictions
      const hasMotorRestriction = 
        allRegulations.includes('no motors') ||
        allRegulations.includes('motor restriction') ||
        allRegulations.includes('boat/motor restriction') ||
        allRegulations.includes('no gas motors');
      
      // Check for cartop/carry access (for non-motor watercraft)
      const hasCartopAccess = 
        access.includes('cartop') ||
        access.includes('carry') ||
        allRegulations.includes('cartop') ||
        allRegulations.includes('carry');
      
      // Check for boat access
      // "N" typically means no boat access, but check for explicit denials
      const hasExplicitNoBoatAccess = 
        allRegulations.includes('no public boat access') ||
        allRegulations.includes('no boat access') ||
        access.includes('no public boat access') ||
        access.includes('no boat access');
      
      // Access is available if:
      // - Not explicitly denied AND
      // - Not just "N" (which typically means no boat access) OR has cartop/carry access OR has other access info
      const hasBoatAccess = 
        !hasExplicitNoBoatAccess &&
        (access !== 'n' || hasCartopAccess || (access && access.length > 1));
      
      switch (filters.fishingMode) {
        case 'Boat (Gas Motor)':
          // Gas motors not allowed if there's a motor restriction
          // Also need boat access
          return !hasMotorRestriction && hasBoatAccess;
        
        case 'Boat (E-motor)':
          // E-motors allowed even with "no motors" restriction (typically means no gas motors)
          // Need boat access
          return hasBoatAccess;
        
        case 'Non-motor Watercraft':
          // Canoes, kayaks, etc. - allowed even with motor restrictions
          // Need boat access or cartop access
          return hasBoatAccess || hasCartopAccess;
        
        case 'Shore':
          // Shore fishing is always allowed (everywhere has shore access)
          return true;
        
        default:
          return true;
      }
    });
  }

  // 6. Radius Filter
  if (selectedLocation && filters.radius) {
    // Handle "All of NH" option
    if (filters.radius === "All of NH") {
      // Don't filter by radius - include all locations
      // Still calculate distance for scoring
    } else {
      const radiusMiles = parseFloat(filters.radius);
      if (!isNaN(radiusMiles) && radiusMiles > 0) {
        filtered = filtered.filter(location => {
          if (!location.latitude || !location.longitude) {
            return false;
          }
          const distance = calculateDistance(
            selectedLocation.lat,
            selectedLocation.lng,
            location.latitude,
            location.longitude
          );
          return distance <= radiusMiles;
        });
      }
    }
  }

  return filtered;
}

/**
 * Calculate distance between location and selected point
 */
function getLocationDistance(location, selectedLocation) {
  if (!selectedLocation || !location.latitude || !location.longitude) {
    return Infinity; // No distance if no location data
  }
  return calculateDistance(
    selectedLocation.lat,
    selectedLocation.lng,
    location.latitude,
    location.longitude
  );
}

/**
 * Count number of relevant species at a location
 */
function countRelevantSpecies(location, selectedSpecies) {
  if (!selectedSpecies || selectedSpecies.length === 0) {
    return 0;
  }
  const locationSpecies = location.species || [];
  return selectedSpecies.filter(species =>
    locationSpecies.some(locSpecies =>
      locSpecies.toLowerCase() === species.toLowerCase()
    )
  ).length;
}

/**
 * Score a location based on rules-based weighting system
 * Higher score = more relevant
 */
function scoreLocation(location, filters, selectedLocation) {
  let score = 0;
  
  // 1. Number of relevant species (more = better)
  // Weight: 100 points per matching species
  const relevantSpeciesCount = countRelevantSpecies(location, filters.species);
  score += relevantSpeciesCount * 100;
  
  // 2. Proximity to pinned location (closer = better)
  // Weight: Inverse distance score (closer gets higher score)
  // Max distance considered: 100 miles
  if (selectedLocation) {
    const distance = getLocationDistance(location, selectedLocation);
    if (distance < Infinity) {
      // Closer locations get higher scores
      // Formula: (100 - distance) * 10, with minimum of 0
      // This gives up to 1000 points for very close locations
      const proximityScore = Math.max(0, (100 - Math.min(distance, 100)) * 10);
      score += proximityScore;
    }
  }
  
  // Store the score and distance for display
  location._score = score;
  location._distance = selectedLocation ? getLocationDistance(location, selectedLocation) : null;
  location._relevantSpeciesCount = relevantSpeciesCount;
  
  return score;
}

/**
 * Sort locations by quality/ranking using rules-based scoring
 * 
 * Scoring Rules:
 * 1. Number of relevant species (100 points per species)
 * 2. Proximity to pinned location (up to 1000 points for very close)
 * 
 * Elimination Rules (already handled in filterLocations):
 * - Regulations allow fishing on date
 * - Contains relevant species
 * - Mode of fishing is allowed
 * - Within location radius
 */
export function sortLocations(locations, filters, selectedLocation) {
  if (!locations || locations.length === 0) {
    return [];
  }
  
  // Score each location
  const scoredLocations = locations.map(location => ({
    ...location,
    score: scoreLocation(location, filters, selectedLocation)
  }));
  
  // Sort by score (highest first)
  return scoredLocations.sort((a, b) => {
    // Primary sort: by score
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // Secondary sort: by name (alphabetical) for consistency
    return (a.name || '').localeCompare(b.name || '');
  });
}

