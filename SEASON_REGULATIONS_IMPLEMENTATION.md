# Season Regulations Implementation

## Overview

I've implemented a comprehensive season regulation system based on NH Fish & Game regulations. The system automatically checks if selected species are in season on the selected date for each waterbody.

## Files Created

### 1. `src/utils/seasonRegulations.js`
Contains all season checking logic:
- `getFourthSaturdayApril(year)` - Calculates 4th Saturday in April
- `getLaborDay(year)` - Calculates Labor Day
- `classifyWaterbody(waterbody)` - Determines waterbody classification:
  - `river_stream` - Rivers & Streams
  - `wild_trout_stream` - Wild Trout Streams
  - `trout_pond` - Trout Ponds
  - `wild_trout_pond` - Wild Trout Ponds
  - `lake_trout_salmon_water` - Lake Trout and/or Salmon Waters
  - `other_water` - All Other Waters
- `getSpeciesSeason(waterbody, species, year)` - Gets season dates for a species
- `isSpeciesInSeason(waterbody, species, date)` - Checks if species is in season
- `areSpeciesInSeason(waterbody, speciesList, date)` - Checks multiple species

### 2. `src/utils/filterLocations.js`
Filtering and sorting utilities:
- `filterLocations()` - Filters by all criteria including season
- `sortLocations()` - Sorts by quality (basic implementation)

## Season Rules Implemented

### Brook Trout, Rainbow Trout, Brown Trout
- **Rivers & Streams**: January 1 - October 15
- **Wild Trout Streams**: January 1 - Labor Day
- **Trout Ponds**: 4th Saturday in April - October 15
- **Wild Trout Ponds**: 4th Saturday in April - Labor Day
- **Lake Trout/Salmon Waters**: January 1 - September 30 (ice fishing only Jan 1 - Mar 31)
- **All Other Waters**: No closed season

### Lake Trout
- **All Waters**: January 1 - September 30 (ice fishing only Jan 1 - Mar 31)

### Landlocked Salmon
- **Standard**: April 1 - September 30
- **Pleasant Lake, New London**: 4th Saturday in April - September 30

### Largemouth and Smallmouth Bass
- **Rivers & Streams**: January 1 - October 15; Catch & Release May 15 - June 15
- **Trout Ponds**: 4th Saturday in April - October 15; Catch & Release May 15 - June 15
- **Lake Trout/Salmon Waters**: No closed season (ice fishing only Jan 1 - Mar 31); Catch & Release May 15 - June 15
- **All Other Waters**: No closed season; Catch & Release May 15 - June 15

### All Other Species
- **Rivers & Streams**: January 1 - October 15
- **Trout Ponds**: 4th Saturday in April - October 15
- **Lake Trout/Salmon Waters**: No closed season (ice fishing only Jan 1 - Mar 31)
- **All Other Waters**: No closed season

## Waterbody Classification Logic

The system automatically classifies waterbodies based on:
1. **Species present**: If Lake Trout or Landlocked Salmon → `lake_trout_salmon_water`
2. **Water type**: River → `river_stream` or `wild_trout_stream`
3. **Regulations text**: Contains "trout pond" → `trout_pond` or `wild_trout_pond`
4. **Classification field**: May indicate wild trout waters
5. **Default**: `other_water`

## Integration with Filters

The season checking is integrated into the filtering logic:
1. When a date is selected, the system checks if all selected species are in season
2. If a species is not in season on that date, the waterbody is filtered out
3. Catch & release requirements are also checked (e.g., bass May 15 - June 15)

## Special Cases Handled

1. **4th Saturday in April**: Calculated dynamically for each year
2. **Labor Day**: Calculated dynamically (first Monday in September)
3. **Ice Fishing Only Periods**: Detected and flagged (Jan 1 - Mar 31 for certain waters)
4. **Catch & Release Periods**: Automatically detected for bass (May 15 - June 15)
5. **Pleasant Lake, New London**: Special case for Landlocked Salmon

## Usage Example

```javascript
import { isSpeciesInSeason, areSpeciesInSeason } from './utils/seasonRegulations';

// Check single species
const result = isSpeciesInSeason(waterbody, 'Brook Trout', '2024-06-15');
// Returns: { inSeason: true, catchReleaseRequired: false, season: 'Rivers & Streams season' }

// Check multiple species
const results = areSpeciesInSeason(
  waterbody, 
  ['Brook Trout', 'Brown Trout'], 
  '2024-06-15'
);
// Returns: { allInSeason: true, anyCatchReleaseRequired: false, details: [...] }
```

## Next Steps

1. **UI Display**: Show season information in results
2. **Ice Fishing Detection**: Add logic to detect if date is during ice fishing season
3. **Ranking Enhancement**: Use season compliance in ranking algorithm
4. **User Feedback**: Show why waterbodies were filtered out (e.g., "Brook Trout not in season")

## Testing

To test the season regulations:
1. Select a date (e.g., November 1)
2. Select species (e.g., Brook Trout)
3. Submit - should filter out most trout waters (season ends Oct 15)
4. Try different dates and species combinations

