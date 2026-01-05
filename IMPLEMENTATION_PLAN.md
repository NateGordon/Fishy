# Fishing Spots Search Results - Implementation Plan

## Overview
Implement search results functionality that displays filtered fishing spots from NH Fish and Game data, ordered by a rule-based ranking system.

---

## Phase 1: Data Collection & Storage

### 1.1 ArcGIS REST API Data Fetching
**Objective**: Fetch NH Fish and Game waterbody data from ArcGIS REST FeatureServer

**Primary Data Source**: 
- ArcGIS Web App: https://nhfg.maps.arcgis.com/apps/webappviewer/index.html?id=2243091f322449819c244c0c3b2f3f43
- Uses ArcGIS REST FeatureServer endpoints (clean JSON, no HTML scraping needed)

**Tools/Technologies**:
- Python script: `scripts/fetch_arcgis_data.py` (uses `requests` library)
- Node.js script: `scripts/fetch_arcgis_data.js` (alternative, no dependencies)
- Libraries: `requests` (Python) or native `https` (Node.js)

**How It Works**:
1. Discover FeatureServer endpoint (auto-detect or manual)
2. Query all features using: `query?where=1%3D1&outFields=*&f=json`
3. Extract geometry (coordinates) and attributes
4. Process and normalize data
5. Save to CSV and JSON formats
6. Optionally download bathymetry PDFs

**Data Available from ArcGIS** (per body of water):
- **Location Name** (NAME field)
- **Town/City** (TOWN field)
- **Water Type** (TYPE/CLASS field)
- **Coordinates** (from geometry.x, geometry.y or polygon centroid)
- **Acres** (ACRES field)
- **Depth** (DEPTH/MAX_DEPTH field)
- **Available Species** (SPECIES/FISH field - may be comma-separated)
- **Classification** (CLASSIFICATION field)
- **Access Info** (ACCESS/ACCESS_TYPE field)
- **Stocking Info** (STOCKING/STOCKED field)
- **Special Regulations** (REGULATIONS/SPECIAL field)
- **Bathymetry PDF URL** (MoreInfo/PDF_LINK/BATHY_PDF field)

**Scripts Location**: 
- `scripts/fetch_arcgis_data.py` (Python version)
- `scripts/fetch_arcgis_data.js` (Node.js version)

**Output**: 
- `data/nh_fishing_locations.csv`
- `data/nh_fishing_locations.json` (preserves data types better)
- `data/bathy_pdfs/` (optional - downloaded PDFs)

### 1.2 Data Structure
**Files**: 
- `data/nh_fishing_locations.csv` (for easy viewing/editing)
- `data/nh_fishing_locations.json` (for app consumption - preserves data types)

**CSV Columns** (based on ArcGIS data):
```csv
id,name,town,water_type,latitude,longitude,acres,depth,species,classification,access,stocking,regulations,bathy_pdf_url,last_updated
```

**JSON Structure** (per waterbody):
```json
{
  "id": 1,
  "name": "Lake Winnipesaukee",
  "town": "Moultonborough",
  "water_type": "Lake",
  "latitude": 43.6034,
  "longitude": -71.3445,
  "acres": 72000,
  "depth": 180,
  "species": ["Largemouth Bass", "Smallmouth Bass", "Brook Trout"],
  "classification": "Class A",
  "access": "Boat Launch Available",
  "stocking": "Annually",
  "regulations": "Special regulations apply",
  "bathy_pdf_url": "https://...",
  "last_updated": "2024-01-15",
  "raw_attributes": { /* all original ArcGIS fields */ }
}
```

**Notes**:
- `species`: Array in JSON, comma-separated string in CSV
- Field names may vary - scripts handle common variations (NAME/Waterbody, TYPE/WaterType, etc.)
- `raw_attributes` preserved in JSON for reference
- Coordinates extracted from geometry (Point, Polygon, or Polyline)
- Bathymetry PDFs can be downloaded separately for offline reference

---

## Phase 2: Data Processing & Filtering

### 2.1 CSV Reader Utility
**File**: `src/utils/csvReader.js`

**Functionality**:
- Read and parse CSV file
- Convert to JavaScript objects/arrays
- Handle date parsing
- Cache data in memory for performance

**API**:
```javascript
import { loadFishingLocations, filterLocations } from './utils/csvReader';

// Load all locations
const locations = await loadFishingLocations();

// Filter locations based on criteria
const filtered = filterLocations(locations, {
  waterTypes: ['Lake', 'River'],
  species: ['Largemouth Bass'],
  catchRelease: 'Yes',
  date: '2024-06-15',
  centerLat: 43.5,
  centerLng: -71.5724,
  radiusMiles: 50
});
```

### 2.2 Filtering Logic
**File**: `src/utils/filterLocations.js`

**Filter Criteria**:

1. **Water Type Filter**
   - Match if location's `water_type` is in `filters.waterType` array
   - If `filters.waterType` is empty or contains "All", include all

2. **Species Filter**
   - Match if location's `species_list` contains ANY of `filters.species`
   - OR match if location's `species_list` contains ALL of `filters.species` (configurable)
   - Default: ANY match

3. **Catch & Release Filter**
   - If `filters.catchRelease === "Yes"`: Only include locations where `catch_release_allowed === "Yes"`
   - If `filters.catchRelease === "No"`: Include locations where `catch_release_allowed === "No"` or `"Partial"`

4. **Date Filter**
   - Check if `filters.date` falls within `season_start` and `season_end`
   - If `season_start` or `season_end` is null, assume year-round fishing

5. **Radius Filter**
   - Calculate distance from `selectedLocation` (lat/lng) to each location
   - Use Haversine formula for distance calculation
   - Include only locations within `filters.radius` miles
   - If radius is "All of NH", include all locations in New Hampshire bounds

**Distance Calculation**:
```javascript
// src/utils/distanceCalculator.js
function calculateDistance(lat1, lng1, lat2, lng2) {
  // Haversine formula implementation
  // Returns distance in miles
}
```

---

## Phase 3: Ranking/Scoring System

### 3.1 Ranking Rules (Placeholder)
**File**: `src/utils/rankLocations.js`

**Initial Structure**:
```javascript
function rankLocations(locations, filters) {
  return locations.map(location => ({
    ...location,
    score: calculateScore(location, filters)
  })).sort((a, b) => b.score - a.score);
}

function calculateScore(location, filters) {
  let score = 0;
  
  // TODO: Implement ranking rules
  // Examples:
  // - Species match bonus
  // - Distance penalty/bonus
  // - Popularity score
  // - Accessibility bonus
  // - Season availability
  
  return score;
}
```

**Ranking Factors to Consider** (for future implementation):
- Number of matching species (more matches = higher score)
- Distance from selected location (closer = higher score)
- Popularity/quality indicators
- Accessibility features
- Water body size
- Recent updates/activity

---

## Phase 4: UI Components

### 4.1 Results Container Component
**File**: `src/components/ResultsContainer.jsx`

**Purpose**: Main container for search results

**Props**:
- `results`: Array of filtered and ranked locations
- `loading`: Boolean for loading state
- `onLocationSelect`: Callback when user clicks a result
- `selectedLocation`: Currently selected location on map

**Features**:
- Display results in a scrollable list
- Show loading spinner while processing
- Show "No results found" message
- Handle empty state

### 4.2 Result Card Component
**File**: `src/components/ResultCard.jsx`

**Purpose**: Individual fishing spot result card

**Props**:
- `location`: Location data object
- `rank`: Ranking position (1, 2, 3, etc.)
- `distance`: Distance from selected location
- `onClick`: Callback when card is clicked
- `isSelected`: Boolean if this location is selected

**Display Information**:
- Rank number (badge)
- Location name
- Water type
- Distance from selected location
- Available species (list or count)
- Catch & release status
- Season availability
- Quick action buttons (View on map, Get directions)

**Styling**:
- Card-based layout
- Hover effects
- Selected state highlighting
- Responsive design

### 4.3 Results List Component
**File**: `src/components/ResultsList.jsx`

**Purpose**: List container for result cards

**Features**:
- Scrollable list
- Virtual scrolling for performance (if many results)
- Sort/filter options (optional)
- Results count display

### 4.4 Loading State Component
**File**: `src/components/LoadingSpinner.jsx`

**Purpose**: Show loading state during search

**Features**:
- Animated spinner
- Loading message
- Progress indicator (optional)

---

## Phase 5: App Integration

### 5.1 State Management Updates
**File**: `src/App.jsx`

**New State**:
```javascript
const [searchResults, setSearchResults] = useState([]);
const [isSearching, setIsSearching] = useState(false);
const [showResults, setShowResults] = useState(false);
```

**Updated `handleSubmit`**:
```javascript
const handleSubmit = async () => {
  if (!selectedLocation) {
    alert('Please select a location on the map');
    return;
  }
  
  setIsSearching(true);
  setShowResults(true);
  
  try {
    // Load CSV data
    const allLocations = await loadFishingLocations();
    
    // Filter locations
    const filtered = filterLocations(allLocations, {
      waterTypes: filters.waterType,
      species: filters.species,
      catchRelease: filters.catchRelease,
      date: filters.date,
      centerLat: selectedLocation.lat,
      centerLng: selectedLocation.lng,
      radiusMiles: parseRadius(filters.radius)
    });
    
    // Rank locations
    const ranked = rankLocations(filtered, filters);
    
    setSearchResults(ranked);
  } catch (error) {
    console.error('Error searching locations:', error);
    alert('Error searching for locations. Please try again.');
  } finally {
    setIsSearching(false);
  }
};
```

### 5.2 Layout Updates
**File**: `src/App.jsx`

**New Layout Structure**:
```
┌─────────────────────────────────────┐
│           Header                    │
├──────────┬──────────────────────────┤
│          │                          │
│ Filters  │     Map                  │
│          │                          │
│          ├──────────────────────────┤
│          │   Results List           │
│          │   (when showResults)     │
│          │                          │
└──────────┴──────────────────────────┘
```

**Conditional Rendering**:
- Show results below map when `showResults === true`
- Results can be toggled/collapsed
- Map can show markers for all results

### 5.3 Map Integration
**File**: `src/components/map.jsx`

**Updates**:
- Accept `results` prop
- Display markers for all result locations
- Highlight selected result marker
- Show info popups on marker click
- Center map on selected result

**New Props**:
```javascript
<Map 
  selectedRadius={filters.radius} 
  onLocationChange={handleLocationChange}
  results={searchResults}
  selectedResult={selectedResult}
  onResultSelect={handleResultSelect}
/>
```

---

## Phase 6: File Structure

```
fishy/
├── src/
│   ├── components/
│   │   ├── filters.jsx
│   │   ├── map.jsx
│   │   ├── submit.jsx
│   │   ├── ResultsContainer.jsx      (NEW)
│   │   ├── ResultsList.jsx           (NEW)
│   │   ├── ResultCard.jsx            (NEW)
│   │   └── LoadingSpinner.jsx         (NEW)
│   ├── utils/
│   │   ├── csvReader.js              (NEW)
│   │   ├── filterLocations.js         (NEW)
│   │   ├── distanceCalculator.js     (NEW)
│   │   └── rankLocations.js          (NEW)
│   ├── data/
│   │   └── nh_fishing_locations.csv  (NEW - to be generated)
│   ├── App.jsx
│   └── ...
├── scripts/
│   └── scrape_nh_fish_game.py        (NEW)
└── package.json
```

---

## Phase 7: Implementation Steps

### Step 1: Data Collection (ArcGIS REST API)
1. **Discover FeatureServer endpoint**:
   - Inspect ArcGIS web app network requests (browser DevTools)
   - Or use auto-discovery in scripts
   - Common pattern: `https://[server]/arcgis/rest/services/[service]/FeatureServer/[layer]`

2. **Run data fetch script**:
   ```bash
   # Python version
   python scripts/fetch_arcgis_data.py
   
   # OR Node.js version
   node scripts/fetch_arcgis_data.js
   ```

3. **Verify data quality**:
   - Check CSV/JSON output
   - Verify coordinates are present
   - Check species data format
   - Validate field mappings

4. **Download PDFs (optional)**:
   - Script can download all bathymetry PDFs
   - Stored in `data/bathy_pdfs/` directory

5. **Data refresh schedule**:
   - Run annually (regulations update yearly)
   - Or set up automated monthly refresh

### Step 2: CSV Reader Utility
1. Install CSV parsing library (`papaparse` or similar)
2. Create `csvReader.js` utility
3. Implement data loading and caching
4. Add error handling
5. Test with sample CSV

### Step 3: Filtering Logic
1. Implement distance calculator (Haversine formula)
2. Create `filterLocations.js` with all filter criteria
3. Test each filter individually
4. Test combined filters
5. Optimize for performance

### Step 4: Ranking System (Placeholder)
1. Create `rankLocations.js` structure
2. Implement basic scoring (distance-based initially)
3. Add placeholder for custom rules
4. Test ranking output

### Step 5: UI Components
1. Create `LoadingSpinner.jsx`
2. Create `ResultCard.jsx` with basic layout
3. Create `ResultsList.jsx` container
4. Create `ResultsContainer.jsx` with state management
5. Add styling to match existing design
6. Implement responsive design

### Step 6: Integration
1. Update `App.jsx` with new state and `handleSubmit`
2. Integrate CSV reader into submit handler
3. Connect filtering and ranking
4. Display results in UI
5. Add map markers for results
6. Implement result selection and map interaction

### Step 7: Testing & Refinement
1. Test with various filter combinations
2. Test edge cases (no results, all results, etc.)
3. Performance testing with large datasets
4. UI/UX improvements
5. Error handling and user feedback

---

## Phase 8: Dependencies

### New npm Packages Needed:
```json
{
  "papaparse": "^5.4.1"         // CSV parsing (if using CSV)
  // Note: Can use JSON directly, avoiding CSV parsing dependency
}
```

### Python Packages (for data fetching):
```txt
requests==2.31.0
```

**Note**: Much simpler than web scraping - only need `requests` library. No need for `beautifulsoup4`, `selenium`, or `pandas` since we're using clean JSON APIs.

---

## Phase 9: Future Enhancements

1. **Caching**: Cache CSV data in browser localStorage
2. **Pagination**: For large result sets
3. **Sorting Options**: Sort by distance, popularity, etc.
4. **Export Results**: Download results as CSV/PDF
5. **Favorites**: Save favorite locations
6. **Share Results**: Share search results via URL
7. **Advanced Filters**: More granular filtering options
8. **Real-time Updates**: Periodic CSV updates from server
9. **User Reviews**: Add user ratings/reviews
10. **Directions Integration**: Google Maps directions link

---

## Notes & Considerations

1. **CSV File Size**: Consider compression or splitting if file becomes very large
2. **Data Updates**: Plan for regular CSV updates (weekly/monthly)
3. **Legal**: Ensure web scraping complies with NH Fish and Game terms of service
4. **Performance**: Consider lazy loading, virtualization for large lists
5. **Accessibility**: Ensure all new components are accessible
6. **Mobile Responsiveness**: Test on mobile devices
7. **Error Handling**: Graceful degradation if CSV fails to load
8. **Ranking Rules**: Keep ranking system flexible for future rule additions

---

## Questions to Resolve

1. **Species Matching**: Should results match ANY selected species or ALL selected species? (Default: ANY)
2. **CSV Location**: Should CSV be in `public/` folder for direct access, or loaded via API?
3. **Data Refresh**: How often should CSV be updated?
4. **Ranking Priority**: What factors should be weighted most heavily in ranking?
5. **Result Limit**: Should there be a maximum number of results displayed?

---

## Estimated Timeline

- **Phase 1 (Scraping)**: 2-3 days
- **Phase 2 (Filtering)**: 1-2 days
- **Phase 3 (Ranking)**: 1 day (placeholder)
- **Phase 4 (UI Components)**: 2-3 days
- **Phase 5 (Integration)**: 1-2 days
- **Phase 6 (Testing)**: 1 day

**Total**: ~8-12 days of development time

---

This plan provides a comprehensive roadmap for implementing the search results feature. Each phase can be implemented and tested independently before moving to the next.

