/**
 * NH Fish & Game Season Regulations
 * Applies state-wide regulations based on waterbody type and species
 */

/**
 * Calculate the 4th Saturday in April for a given year
 */
function getFourthSaturdayApril(year) {
  const april1 = new Date(year, 3, 1); // April is month 3 (0-indexed)
  const dayOfWeek = april1.getDay(); // 0 = Sunday, 6 = Saturday
  // Find first Saturday
  const daysToFirstSaturday = (6 - dayOfWeek) % 7;
  const firstSaturday = new Date(year, 3, 1 + daysToFirstSaturday);
  // Add 3 weeks (21 days) to get 4th Saturday
  const fourthSaturday = new Date(firstSaturday);
  fourthSaturday.setDate(firstSaturday.getDate() + 21);
  return fourthSaturday;
}

/**
 * Calculate Labor Day for a given year (first Monday in September)
 */
function getLaborDay(year) {
  const september1 = new Date(year, 8, 1); // September is month 8
  const dayOfWeek = september1.getDay(); // 0 = Sunday, 6 = Saturday
  // Find first Monday
  const daysToFirstMonday = (1 - dayOfWeek + 7) % 7 || 7;
  const laborDay = new Date(year, 8, 1 + daysToFirstMonday);
  return laborDay;
}

/**
 * Determine waterbody classification for season regulations
 */
function classifyWaterbody(waterbody) {
  const waterType = waterbody.water_type || '';
  const species = waterbody.species || [];
  const regulations = (waterbody.regulations || '').toLowerCase();
  const classification = (waterbody.classification || '').toLowerCase();
  
  // Check if it's a Lake Trout and/or Salmon water
  const hasLakeTrout = species.includes('Lake Trout');
  const hasSalmon = species.includes('Landlocked Salmon');
  if (hasLakeTrout || hasSalmon) {
    return 'lake_trout_salmon_water';
  }
  
  // Check if it's a Trout Pond
  const isTroutPond = regulations.includes('trout pond') || 
                      classification.includes('trout pond') ||
                      (waterType === 'Pond' && species.some(s => 
                        s.includes('Trout') || s === 'Landlocked Salmon'));
  
  // Check if it's a Wild Trout Stream/Pond
  const isWildTrout = regulations.includes('wild trout') ||
                      classification.includes('wild');
  
  if (waterType === 'River') {
    return isWildTrout ? 'wild_trout_stream' : 'river_stream';
  } else if (isTroutPond) {
    return isWildTrout ? 'wild_trout_pond' : 'trout_pond';
  } else {
    return 'other_water';
  }
}

/**
 * Check if a date falls within a season range
 */
function isDateInSeason(date, startDate, endDate) {
  const checkDate = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Set time to midnight for accurate comparison
  checkDate.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  
  return checkDate >= start && checkDate <= end;
}

/**
 * Get season dates for a species on a specific waterbody
 */
function getSpeciesSeason(waterbody, species, year) {
  const classification = classifyWaterbody(waterbody);
  const yearStr = year.toString();
  
  // Brook Trout, Rainbow Trout, Brown Trout
  if (['Brook Trout', 'Rainbow Trout', 'Brown Trout'].includes(species)) {
    switch (classification) {
      case 'river_stream':
        return {
          start: `${yearStr}-01-01`,
          end: `${yearStr}-10-15`,
          notes: 'Rivers & Streams season'
        };
      case 'wild_trout_stream':
        return {
          start: `${yearStr}-01-01`,
          end: getLaborDay(year).toISOString().split('T')[0],
          notes: 'Wild Trout Streams season'
        };
      case 'trout_pond':
        const fourthSatApril = getFourthSaturdayApril(year);
        return {
          start: fourthSatApril.toISOString().split('T')[0],
          end: `${yearStr}-10-15`,
          notes: 'Trout Ponds season'
        };
      case 'wild_trout_pond':
        const fourthSatApril2 = getFourthSaturdayApril(year);
        return {
          start: fourthSatApril2.toISOString().split('T')[0],
          end: getLaborDay(year).toISOString().split('T')[0],
          notes: 'Wild Trout Ponds season'
        };
      case 'lake_trout_salmon_water':
        return {
          start: `${yearStr}-01-01`,
          end: `${yearStr}-09-30`,
          notes: 'Lake Trout/Salmon waters (ice fishing only Jan 1 - Mar 31)',
          iceFishingOnly: {
            start: `${yearStr}-01-01`,
            end: `${yearStr}-03-31`
          }
        };
      default: // other_water
        return {
          start: `${yearStr}-01-01`,
          end: `${yearStr}-12-31`,
          notes: 'No closed season'
        };
    }
  }
  
  // Lake Trout
  if (species === 'Lake Trout') {
    return {
      start: `${yearStr}-01-01`,
      end: `${yearStr}-09-30`,
      notes: 'All waters (ice fishing only Jan 1 - Mar 31)',
      iceFishingOnly: {
        start: `${yearStr}-01-01`,
        end: `${yearStr}-03-31`
      }
    };
  }
  
  // Landlocked Salmon
  if (species === 'Landlocked Salmon') {
    // Special case: Pleasant Lake, New London
    const isPleasantLake = waterbody.name && 
                          waterbody.name.toLowerCase().includes('pleasant') &&
                          waterbody.town && 
                          waterbody.town.toLowerCase().includes('new london');
    
    if (isPleasantLake) {
      const fourthSatApril = getFourthSaturdayApril(year);
      return {
        start: fourthSatApril.toISOString().split('T')[0],
        end: `${yearStr}-09-30`,
        notes: 'Pleasant Lake, New London special season'
      };
    } else {
      return {
        start: `${yearStr}-04-01`,
        end: `${yearStr}-09-30`,
        notes: 'Standard Landlocked Salmon season'
      };
    }
  }
  
  // Largemouth and Smallmouth Bass
  if (['Largemouth Bass', 'Smallmouth Bass'].includes(species)) {
    const catchReleasePeriod = {
      start: `${yearStr}-05-15`,
      end: `${yearStr}-06-15`,
      notes: 'Catch & Release only during this period'
    };
    
    switch (classification) {
      case 'river_stream':
        return {
          start: `${yearStr}-01-01`,
          end: `${yearStr}-10-15`,
          notes: 'Rivers & Streams season',
          catchRelease: catchReleasePeriod
        };
      case 'trout_pond':
        const fourthSatApril = getFourthSaturdayApril(year);
        return {
          start: fourthSatApril.toISOString().split('T')[0],
          end: `${yearStr}-10-15`,
          notes: 'Trout Ponds season',
          catchRelease: catchReleasePeriod
        };
      case 'lake_trout_salmon_water':
        return {
          start: `${yearStr}-01-01`,
          end: `${yearStr}-12-31`,
          notes: 'No closed season (ice fishing only Jan 1 - Mar 31)',
          catchRelease: catchReleasePeriod,
          iceFishingOnly: {
            start: `${yearStr}-01-01`,
            end: `${yearStr}-03-31`
          }
        };
      default: // other_water
        return {
          start: `${yearStr}-01-01`,
          end: `${yearStr}-12-31`,
          notes: 'No closed season',
          catchRelease: catchReleasePeriod
        };
    }
  }
  
  // All Other Species (Fallfish, Chain Pickerel, Northern Pike, Sunfish, 
  // Black Crappie, White Crappie, Yellow Perch, White Perch, Walleye, 
  // Rock Bass, Catfish, Carp, Sucker)
  switch (classification) {
    case 'river_stream':
      return {
        start: `${yearStr}-01-01`,
        end: `${yearStr}-10-15`,
        notes: 'Rivers & Streams season'
      };
    case 'trout_pond':
      const fourthSatApril = getFourthSaturdayApril(year);
      return {
        start: fourthSatApril.toISOString().split('T')[0],
        end: `${yearStr}-10-15`,
        notes: 'Trout Ponds season'
      };
    case 'lake_trout_salmon_water':
      return {
        start: `${yearStr}-01-01`,
        end: `${yearStr}-12-31`,
        notes: 'No closed season (ice fishing only Jan 1 - Mar 31)',
        iceFishingOnly: {
          start: `${yearStr}-01-01`,
          end: `${yearStr}-03-31`
        }
      };
    default: // other_water
      return {
        start: `${yearStr}-01-01`,
        end: `${yearStr}-12-31`,
        notes: 'No closed season'
      };
  }
}

/**
 * Check if a species is in season on a specific date for a waterbody
 */
export function isSpeciesInSeason(waterbody, species, date) {
  const checkDate = new Date(date);
  const year = checkDate.getFullYear();
  
  const season = getSpeciesSeason(waterbody, species, year);
  
  // Check ice fishing only period
  if (season.iceFishingOnly) {
    const iceStart = new Date(season.iceFishingOnly.start);
    const iceEnd = new Date(season.iceFishingOnly.end);
    if (checkDate >= iceStart && checkDate <= iceEnd) {
      // During ice fishing only period - would need to check if it's actually ice fishing season
      // For now, we'll allow it but note it's ice fishing only
      return { inSeason: true, method: 'ice_fishing_only' };
    }
  }
  
  // Check main season
  const inSeason = isDateInSeason(date, season.start, season.end);
  
  // Check catch & release period for bass
  let catchReleaseRequired = false;
  if (season.catchRelease && inSeason) {
    const crStart = new Date(season.catchRelease.start);
    const crEnd = new Date(season.catchRelease.end);
    if (checkDate >= crStart && checkDate <= crEnd) {
      catchReleaseRequired = true;
    }
  }
  
  return {
    inSeason,
    catchReleaseRequired,
    season: season.notes
  };
}

/**
 * Check if all selected species are in season on a specific date for a waterbody
 */
export function areSpeciesInSeason(waterbody, speciesList, date) {
  const results = speciesList.map(species => ({
    species,
    ...isSpeciesInSeason(waterbody, species, date)
  }));
  
  const allInSeason = results.every(r => r.inSeason);
  const anyCatchReleaseRequired = results.some(r => r.catchReleaseRequired);
  
  return {
    allInSeason,
    anyCatchReleaseRequired,
    details: results
  };
}

/**
 * Get season information for display
 */
export function getSeasonInfo(waterbody, species, year) {
  return getSpeciesSeason(waterbody, species, year);
}

