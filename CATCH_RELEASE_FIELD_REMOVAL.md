# Catch & Release Field Removal

## Summary

The `catch_release_allowed` field has been removed from the data structure because:

1. **Catch & release is always allowed** in NH unless regulations specifically require it
2. **Season-based requirements** (e.g., bass May 15 - June 15) are already handled by the season regulations system
3. **The field was mostly null** (only 31 out of 1,127 records had "Yes")
4. **The filter is about user preference**, not about whether catch & release is allowed

## Changes Made

### 1. Data Processing (`scripts/fetch_arcgis_data.py`)
- Removed the logic that inferred `catch_release_allowed` from regulations text
- Removed the field from the waterbody data structure
- Added comment explaining that catch & release is always allowed unless season regulations require it

### 2. Filtering Logic (`src/utils/filterLocations.js`)
- Simplified catch & release filtering:
  - **"Release"**: Includes all waters (catch & release is always allowed)
  - **"Keep"**: Excludes waters where catch & release is required during the selected date (e.g., bass May 15 - June 15)
  - **"Not sure"**: Includes all waters
- Removed dependency on `location.catch_release_allowed` field

### 3. Data Structure
- Removed `catch_release_allowed` field from JSON output
- All 1,127 records updated

## How It Works Now

The catch & release filter now works based on:
1. **User preference** (Keep, Release, Not sure)
2. **Season-based requirements** from the season regulations system
   - Example: Bass have catch & release required May 15 - June 15
   - If user selects "Keep" and date is in that period, those waters are excluded
   - If user selects "Release", all waters are included (since it's always allowed)

## Benefits

- **Simpler data structure**: One less field to maintain
- **More accurate**: Based on actual NH regulations, not inferred text
- **Cleaner logic**: Season regulations handle all catch & release requirements
- **Better user experience**: Filter works based on user intent, not confusing "allowed" vs "required"

