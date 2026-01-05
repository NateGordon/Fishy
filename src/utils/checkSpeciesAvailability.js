/**
 * Check if a species can be kept on a given date
 * Uses a generic "other_water" classification for checking
 */

import { isSpeciesInSeason } from './seasonRegulations';

/**
 * Create a generic waterbody for checking season regulations
 * Uses "other_water" classification which has the most permissive rules
 */
function createGenericWaterbody() {
  return {
    water_type: 'Lake', // Generic type
    classification: '',
    regulations: '',
    name: '',
    town: ''
  };
}

/**
 * Check if a species can be kept (not catch & release required) on a date
 * @param {string} species - Species name
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {boolean} - True if species can be kept, false if catch & release required or out of season
 */
export function canKeepSpecies(species, date) {
  if (!date) return true; // If no date, assume available
  
  const genericWaterbody = createGenericWaterbody();
  const seasonCheck = isSpeciesInSeason(genericWaterbody, species, date);
  
  // Can keep if:
  // 1. Species is in season
  // 2. Catch & release is NOT required
  return seasonCheck.inSeason && !seasonCheck.catchReleaseRequired;
}

/**
 * Check which species can be kept on a given date
 * @param {string[]} speciesList - List of species to check
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {Object} - Object with species as keys and boolean values
 */
export function getAvailableSpecies(speciesList, date) {
  const availability = {};
  speciesList.forEach(species => {
    availability[species] = canKeepSpecies(species, date);
  });
  return availability;
}

