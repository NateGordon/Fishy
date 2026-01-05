"""
Fetch NH Fish & Game waterbody data from ArcGIS REST FeatureServer
This script queries the ArcGIS API to get all waterbody information
"""

import requests
import json
import os
from datetime import datetime
from pathlib import Path

# ArcGIS Web App URL
ARCGIS_WEB_APP_URL = "https://nhfg.maps.arcgis.com/apps/webappviewer/index.html?id=2243091f322449819c244c0c3b2f3f43"

# Base URL for ArcGIS REST services (will need to discover the actual FeatureServer URL)
# Common pattern: https://[server]/arcgis/rest/services/[service]/FeatureServer/[layer]
# We'll need to inspect the web app to find the exact endpoint

def discover_feature_server():
    """
    Attempt to discover the FeatureServer endpoint from the web app
    This may require inspecting the network requests or the web app's JavaScript
    """
    # Common ArcGIS patterns to try
    # Base URL discovered from user's finding
    base_url = "https://services8.arcgis.com/hg1B9Egwk1I5p300/arcgis/rest/services"
    
    possible_endpoints = [
        # PRIMARY: NH Freshwater Fishing Guide - contains all waterbody data!
        f"{base_url}/NH_Freshwater_Fishing_Guide/FeatureServer/0",
    ]
    
    # Only try alternatives if primary fails
    alternative_endpoints = [
        f"{base_url}/NHFandGfish/FeatureServer/0",
        f"{base_url}/Fish_Survey_Data/FeatureServer/0",
        f"{base_url}/FishStocking_view/FeatureServer/0",
        "https://nhfg.maps.arcgis.com/arcgis/rest/services/NHFG_Waterbodies/FeatureServer/0",
        "https://nhfg.maps.arcgis.com/arcgis/rest/services/Fishing_Waterbodies/FeatureServer/0",
    ]
    
    # Try primary endpoint first (NH_Freshwater_Fishing_Guide)
    for endpoint in possible_endpoints:
        try:
            test_url = f"{endpoint}?f=json"
            response = requests.get(test_url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if 'fields' in data:
                    # Verify it has waterbody fields
                    field_names = [f.get('name', '') for f in data.get('fields', [])]
                    if any(field in ['WB_NAME', 'NAME', 'SPECIES', 'FGEN'] for field in field_names):
                        print(f"Found FeatureServer: {endpoint}")
                        return endpoint
        except Exception as e:
            continue
    
    # If primary fails, try alternatives
    print("Primary endpoint not found, trying alternatives...")
    for endpoint in alternative_endpoints:
        try:
            test_url = f"{endpoint}?f=json"
            response = requests.get(test_url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if 'fields' in data:
                    print(f"Found FeatureServer: {endpoint}")
                    return endpoint
        except Exception as e:
            continue
    
    # If auto-discovery fails, return None and user must specify
    return None

def query_all_features(feature_server_url, layer_id=0):
    """
    Query all features from the ArcGIS FeatureServer with pagination
    ArcGIS typically limits results to 1000 records, so we need to paginate
    
    Args:
        feature_server_url: Base URL of the FeatureServer (may already include layer ID)
        layer_id: Layer ID (usually 0 for the first layer)
    
    Returns:
        List of feature dictionaries
    """
    # Check if URL already ends with layer ID
    if feature_server_url.endswith(f'/{layer_id}'):
        query_url = f"{feature_server_url}/query"
    else:
        query_url = f"{feature_server_url}/{layer_id}/query"
    
    all_features = []
    offset = 0
    batch_size = 1000  # ArcGIS default max
    total_count = None
    
    print(f"Querying: {query_url}")
    print("Fetching all records with pagination...")
    
    while True:
        params = {
            'where': '1=1',  # Get all features
            'outFields': '*',  # Get all fields
            'f': 'json',
            'returnGeometry': 'true',  # Include coordinates
            'resultOffset': offset,
            'resultRecordCount': batch_size,
            'returnIdsOnly': False
        }
        
        try:
            response = requests.get(query_url, params=params, timeout=60)
            response.raise_for_status()
            
            data = response.json()
            
            if 'error' in data:
                raise Exception(f"ArcGIS API Error: {data['error']}")
            
            if 'features' not in data:
                raise Exception("No 'features' key in response. Response structure may be different.")
            
            features = data['features']
            all_features.extend(features)
            
            # Get total count if available
            if total_count is None:
                total_count = data.get('exceededTransferLimit', False)
                if 'properties' in data and 'count' in data['properties']:
                    total_count = data['properties']['count']
                elif len(features) < batch_size:
                    total_count = len(all_features)
            
            print(f"  Fetched {len(features)} features (total so far: {len(all_features)})")
            
            # Check if we got all records
            if len(features) < batch_size:
                # Got fewer than batch size, must be the last batch
                print(f"  Reached end of data")
                break
            
            # Check if there are more records
            # exceededTransferLimit indicates more records available
            if data.get('exceededTransferLimit', False):
                # There are more records, continue
                offset += batch_size
            elif len(features) == batch_size:
                # Got exactly batch size, might be more - continue to check
                offset += batch_size
            else:
                # No more records
                break
                
        except requests.exceptions.RequestException as e:
            print(f"Error fetching batch at offset {offset}: {e}")
            if len(all_features) > 0:
                print(f"  Continuing with {len(all_features)} features already retrieved...")
                break
            else:
                raise
    
    print(f"\nRetrieved {len(all_features)} total features")
    return all_features

def web_mercator_to_lat_lng(x, y):
    """
    Convert Web Mercator (EPSG:3857) coordinates to WGS84 lat/lng
    """
    import math
    lon = x / 20037508.34 * 180.0
    lat = y / 20037508.34 * 180.0
    lat = 180.0 / math.pi * (2 * math.atan(math.exp(lat * math.pi / 180.0)) - math.pi / 2.0)
    return lat, lon

def extract_coordinates(feature):
    """
    Extract latitude and longitude from feature geometry
    ArcGIS geometry can be Point, Polyline, or Polygon
    Handles both WGS84 (lat/lng) and Web Mercator (projected) coordinates
    """
    geometry = feature.get('geometry', {})
    spatial_ref = geometry.get('spatialReference', {})
    wkid = spatial_ref.get('wkid') or spatial_ref.get('latestWkid')
    
    x, y = None, None
    
    if 'x' in geometry and 'y' in geometry:
        # Point geometry
        x, y = geometry['x'], geometry['y']
    elif 'rings' in geometry:
        # Polygon - use centroid or first point
        rings = geometry['rings']
        if rings and len(rings) > 0 and len(rings[0]) > 0:
            first_point = rings[0][0]
            x, y = first_point[0], first_point[1]
    elif 'paths' in geometry:
        # Polyline - use first point
        paths = geometry['paths']
        if paths and len(paths) > 0 and len(paths[0]) > 0:
            first_point = paths[0][0]
            x, y = first_point[0], first_point[1]
    
    if x is None or y is None:
        return None, None
    
    # Check if coordinates are in Web Mercator (EPSG:3857 or WKID 102100)
    # Web Mercator coordinates are typically very large (millions)
    if wkid == 3857 or wkid == 102100 or (abs(x) > 180 or abs(y) > 90):
        # Convert from Web Mercator to lat/lng
        return web_mercator_to_lat_lng(x, y)
    else:
        # Assume already in lat/lng
        return y, x  # lat, lng

# Species code mapping - Only codes for species in the filter list
# Source: https://www.wildlife.nh.gov/sites/g/files/ehbemt746/files/inline-images/fish-abbreviations-update.pdf
# Filter species: Largemouth Bass, Smallmouth Bass, Striped Bass, Brook Trout, Brown Trout, 
# Rainbow Trout, Lake Trout, Landlocked Salmon, Fallfish, Chain Pickerel, Northern Pike,
# Sunfish, Black Crappie, White Crappie, Yellow Perch, White Perch, Walleye, Rock Bass, 
# Catfish, Carp, Sucker
SPECIES_CODE_MAP = {
    # Trout & Salmon (filter species only)
    'EBT': 'Brook Trout',  # Eastern Brook Trout (Salvelinus fontinalis)
    'BT': 'Brown Trout',  # Brown Trout (Salmo trutta)
    'RT': 'Rainbow Trout',  # Rainbow Trout (Oncorhynchus mykiss)
    'LT': 'Lake Trout',  # Lake Trout (Salvelinus namaycush)
    'LLS': 'Landlocked Salmon',  # Landlocked Salmon
    
    # Bass (filter species only)
    'LMB': 'Largemouth Bass',  # Largemouth Bass (Micropterus salmoides)
    'SMB': 'Smallmouth Bass',  # Smallmouth Bass (Micropterus dolomieu)
    'SB': 'Striped Bass',  # Striped Bass
    
    # Perch (filter species only)
    'YP': 'Yellow Perch',  # Yellow Perch (Perca flavescens)
    'WP': 'White Perch',  # White Perch (Morone americana)
    
    # Crappie (filter species only)
    'BC': 'Black Crappie',  # Black Crappie (Pomoxis nigromaculatus)
    'WCP': 'White Crappie',  # White Crappie (alternative code)
    'EPC': 'Black Crappie',  # Possible typo for BC
    
    # Sunfish (filter species - generic, includes all sunfish types)
    'SF': 'Sunfish',  # Generic Sunfish
    'BG': 'Sunfish',  # Bluegill (Lepomis macrochirus) -> maps to Sunfish
    'CSF': 'Sunfish',  # Pumpkinseed (Lepomis gibbosus) -> maps to Sunfish
    'PS': 'Sunfish',  # Pumpkinseed alternative -> maps to Sunfish
    'RBS': 'Sunfish',  # Redbreast Sunfish (Lepomis auritus) -> maps to Sunfish
    'BDS': 'Sunfish',  # Banded Sunfish (Enneacanthus obesus) -> maps to Sunfish
    
    # Pike & Pickerel (filter species only)
    'ECP': 'Chain Pickerel',  # Chain Pickerel (Esox niger) - Official code
    'CP': 'Chain Pickerel',  # Alternative code
    'NP': 'Northern Pike',  # Northern Pike (Esox lucius)
    
    # Other Game Fish (filter species only)
    'WLE': 'Walleye',  # Walleye (Sander vitreus) - Official code
    'W': 'Walleye',  # Alternative code
    'RB': 'Rock Bass',  # Rock Bass (Ambloplites rupestris)
    'BRB': 'Rock Bass',  # Possible typo for RB
    
    # Catfish (filter species - generic, includes all catfish types)
    'CF': 'Catfish',  # Generic Catfish
    'CFS': 'Catfish',  # Alternative code
    'BBH': 'Catfish',  # Brown Bullhead (Ameiurus nebulosus) -> maps to Catfish
    'YBH': 'Catfish',  # Yellow Bullhead (Ameiurus natalis) -> maps to Catfish
    'MMT': 'Catfish',  # Margined Madtom (Noturus insignis) -> maps to Catfish
    
    # Sucker (filter species - generic, includes all sucker types)
    'WS': 'Sucker',  # Generic White Sucker -> maps to Sucker
    'CWS': 'Sucker',  # Common White Sucker (Catostomus commersoni) -> maps to Sucker
    'LNS': 'Sucker',  # Longnose Sucker (Catostomus catostomus) -> maps to Sucker
    'CCS': 'Sucker',  # Creek Chubsucker (Erimyzon oblongus) -> maps to Sucker
    
    # Carp (filter species only)
    'CRP': 'Carp',  # Common Carp (Cyprinus carpio) - Official code
    'C': 'Carp',  # Alternative code
    
    # Fallfish (filter species only)
    'FF': 'Fallfish',  # Fallfish (Semotilus corporalis)
}

def normalize_species(species_field):
    """
    Normalize species data - converts codes to full names
    Species are stored as comma-separated codes like "EBT,RT,BT,LLS,SMB"
    """
    if not species_field:
        return []
    
    if isinstance(species_field, list):
        codes = species_field
    elif isinstance(species_field, str):
        # Split by comma, semicolon, or newline
        species = species_field.replace(';', ',').replace('\n', ',').split(',')
        codes = [s.strip().upper() for s in species if s.strip()]
    else:
        return []
    
    # Filter species list - only include species that are in the filter options
    FILTER_SPECIES = [
        "Largemouth Bass", "Smallmouth Bass", "Striped Bass",
        "Brook Trout", "Brown Trout", "Rainbow Trout", "Lake Trout",
        "Landlocked Salmon", "Fallfish", "Chain Pickerel", "Northern Pike",
        "Sunfish", "Black Crappie", "White Crappie", "Yellow Perch",
        "White Perch", "Walleye", "Rock Bass", "Catfish", "Carp", "Sucker"
    ]
    
    # Convert codes to full names (only for filter species)
    full_names = []
    for code in codes:
        # Try exact match first
        if code in SPECIES_CODE_MAP:
            mapped_name = SPECIES_CODE_MAP[code]
            # Only include if it's in the filter species list
            if mapped_name in FILTER_SPECIES:
                full_names.append(mapped_name)
        else:
            # Try partial match
            matched = False
            for abbrev, full_name in SPECIES_CODE_MAP.items():
                if code == abbrev or code.startswith(abbrev):
                    if full_name in FILTER_SPECIES:
                        full_names.append(full_name)
                        matched = True
                    break
            # If no match, skip it (not in filter species list)
    
    # Remove duplicates while preserving order
    seen = set()
    unique_names = []
    for name in full_names:
        if name not in seen:
            seen.add(name)
            unique_names.append(name)
    
    return unique_names

def process_features(features):
    """
    Process raw ArcGIS features into normalized data structure
    """
    processed = []
    
    for idx, feature in enumerate(features):
        attributes = feature.get('attributes', {})
        lat, lng = extract_coordinates(feature)
        
        # Extract common field names - updated for NH_Freshwater_Fishing_Guide service
        # Based on discovered fields: WB_NAME, WB_CLASS, TOWN, DEPTHAVG, DEPTHMAX, FISHACRE, etc.
        
        # Combine all NOTES fields for regulations
        notes1 = attributes.get('NOTES1', '').strip()
        notes2 = attributes.get('NOTES2', '').strip()
        notes3 = attributes.get('NOTES3', '').strip()
        notes4 = attributes.get('NOTES4', '').strip()
        
        # Combine all notes into regulations text
        notes_list = [n for n in [notes1, notes2, notes3, notes4] if n and n != ' ']
        regulations_text = '; '.join(notes_list) if notes_list else ''
        
        # Note: catch_release_allowed field removed
        # Catch & release is always allowed in NH unless regulations require it
        # Season-based catch & release requirements (e.g., bass May 15 - June 15) 
        # are handled by the season regulations system
        
        # Check for season dates (may be in separate fields or regulations)
        # NH fishing is generally year-round, but check notes for special seasons
        season_start = attributes.get('SEASON_START') or attributes.get('SeasonStart') or attributes.get('OPEN_DATE') or attributes.get('START_DATE') or None
        season_end = attributes.get('SEASON_END') or attributes.get('SeasonEnd') or attributes.get('CLOSE_DATE') or attributes.get('END_DATE') or None
        
        # Try to extract dates from notes (e.g., "open May 1 - Oct 31")
        if not season_start and regulations_text:
            import re
            # Look for date patterns in notes
            date_pattern = r'(open|season|dates?)\s+([A-Za-z]+\s+\d+)\s*[-–]\s*([A-Za-z]+\s+\d+)'
            match = re.search(date_pattern, regulations_text, re.IGNORECASE)
            if match:
                # Would need date parsing here - simplified for now
                pass
        
        # Map fields from NH_Freshwater_Fishing_Guide service
        # Use FGEN for water_type (has readable values like "Lake/Pond", "River/Strea")
        # Fallback to WB_CLASS if FGEN not available
        fgen = attributes.get('FGEN', '').strip()
        wb_class = attributes.get('WB_CLASS', '').strip()
        
        # Normalize FGEN to match filter options (Lake, River, Pond)
        # Classification priority:
        # 1. Name pattern (most reliable)
        # 2. Size threshold (for ambiguous cases)
        # 3. FGEN field
        water_type = ''
        name = (attributes.get('WB_NAME') or attributes.get('NAME') or attributes.get('Waterbody') or attributes.get('WATERBODY') or attributes.get('ALT_NAME') or '').upper()
        acres = attributes.get('FISHACRE') or attributes.get('ACRES') or attributes.get('Acres') or 0
        
        # Step 1: Check name pattern (most reliable indicator)
        has_lake_in_name = 'LAKE' in name
        has_pond_in_name = 'POND' in name
        
        if has_lake_in_name and not has_pond_in_name:
            water_type = 'Lake'
        elif has_pond_in_name and not has_lake_in_name:
            water_type = 'Pond'
        elif fgen and fgen != ' ':
            # Step 2: Use FGEN field for ambiguous cases
            fgen_lower = fgen.lower()
            if fgen_lower == 'lake/pond':
                # Step 3: Use size threshold for "Lake/Pond" ambiguous cases
                # Threshold: 50 acres (based on median ~23 acres, most ponds <50)
                if acres and acres > 50:
                    water_type = 'Lake'
                else:
                    water_type = 'Pond'  # Default to Pond for smaller ambiguous cases
            elif 'pond' in fgen_lower and 'lake' not in fgen_lower:
                water_type = 'Pond'
            elif 'lake' in fgen_lower and 'pond' not in fgen_lower:
                water_type = 'Lake'
            elif 'river' in fgen_lower or 'stream' in fgen_lower or 'strea' in fgen_lower:
                water_type = 'River'
            else:
                water_type = fgen  # Keep original if doesn't match
        
        # If still no classification, try WB_CLASS (but it's usually just codes like "B", "A")
        if not water_type and wb_class and wb_class != ' ':
            water_type = wb_class
        
        waterbody = {
            'id': attributes.get('OBJECTID') or attributes.get('WB_ID') or attributes.get('FID') or idx + 1,
            'name': attributes.get('WB_NAME') or attributes.get('NAME') or attributes.get('Waterbody') or attributes.get('WATERBODY') or attributes.get('ALT_NAME') or 'Unknown',
            'town': attributes.get('TOWN') or attributes.get('Town') or attributes.get('CITY') or '',
            'water_type': water_type,
            'water_type_raw': fgen or wb_class,  # Keep original for reference
            'acres': attributes.get('FISHACRE') or attributes.get('ACRES') or attributes.get('Acres') or attributes.get('SIZE') or None,
            'depth': attributes.get('DEPTHMAX') or attributes.get('DEPTHAVG') or attributes.get('DEPTH') or attributes.get('Depth') or attributes.get('MAX_DEPTH') or None,
            'depth_avg': attributes.get('DEPTHAVG') or None,
            'latitude': lat,
            'longitude': lng,
            'species': normalize_species(attributes.get('SPECIES') or attributes.get('Species') or attributes.get('FISH') or attributes.get('FISH_SPECIES')),
            'classification': attributes.get('WB_CLASS') or attributes.get('CLASSIFICATION') or attributes.get('Classification') or '',
            'access': attributes.get('BEACH') or attributes.get('ACCESS') or attributes.get('Access') or attributes.get('ACCESS_TYPE') or '',
            'stocking': attributes.get('STOCKING') or attributes.get('Stocking') or attributes.get('STOCKED') or '',
            'trophic': attributes.get('TROPHIC') or None,  # Trophic status (oligotrophic, mesotrophic, etc.)
            'regulations': regulations_text,
            'notes1': notes1,
            'notes2': notes2,
            'notes3': notes3,
            'notes4': notes4,
            # catch_release_allowed field removed - catch & release is always allowed unless season regulations require it
            'season_start': season_start,  # Date string or None
            'season_end': season_end,  # Date string or None
            'bathy_pdf_url': attributes.get('BATHYMAP') or attributes.get('MoreInfo') or attributes.get('PDF_LINK') or attributes.get('BATHY_PDF') or attributes.get('BATHYMETRY') or attributes.get('BATHY_URL') or '',
            'fishery_type': attributes.get('FISHERY') or '',  # Cold/Warm, etc.
            'bathy_pdf_local': None,  # Will be set if PDF is downloaded
            'last_updated': datetime.now().strftime('%Y-%m-%d'),
            # Store all raw attributes for reference
            'raw_attributes': attributes
        }
        
        processed.append(waterbody)
    
    return processed

def save_to_json(waterbodies, output_file='data/nh_fishing_locations.json'):
    """
    Save processed waterbodies to JSON file (preserves data types better)
    """
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    with open(output_file, 'w', encoding='utf-8') as jsonfile:
        json.dump(waterbodies, jsonfile, indent=2, ensure_ascii=False)
    
    print(f"Saved {len(waterbodies)} waterbodies to {output_file}")

def download_bathy_pdfs(waterbodies, output_dir='data/bathy_pdfs'):
    """
    Download all bathymetry PDFs referenced in waterbody data
    Updates waterbody records with local PDF path
    """
    os.makedirs(output_dir, exist_ok=True)
    
    downloaded = 0
    failed = 0
    skipped = 0
    
    for wb in waterbodies:
        pdf_url = wb.get('bathy_pdf_url')
        if not pdf_url or not pdf_url.strip():
            skipped += 1
            continue
        
        # Clean URL
        pdf_url = pdf_url.strip()
        if not pdf_url.startswith('http'):
            # May be a relative URL - try to construct full URL
            if pdf_url.startswith('/'):
                # Relative to domain - would need base URL
                skipped += 1
                continue
            else:
                skipped += 1
                continue
        
        # Generate filename from waterbody name and ID
        safe_name = "".join(c for c in wb['name'] if c.isalnum() or c in (' ', '-', '_')).strip()
        safe_name = safe_name.replace(' ', '_')
        filename = f"{wb['id']}_{safe_name}.pdf"
        filepath = os.path.join(output_dir, filename)
        relative_path = f"bathy_pdfs/{filename}"  # Relative path for web app
        
        # Skip if already downloaded
        if os.path.exists(filepath):
            wb['bathy_pdf_local'] = relative_path
            skipped += 1
            continue
        
        try:
            print(f"Downloading: {pdf_url}")
            response = requests.get(pdf_url, timeout=30, stream=True)
            response.raise_for_status()
            
            # Verify it's actually a PDF
            content_type = response.headers.get('Content-Type', '')
            if 'pdf' not in content_type.lower():
                # Check first few bytes for PDF magic number
                first_chunk = next(response.iter_content(chunk_size=4))
                if first_chunk[:4] != b'%PDF':
                    print(f"  Warning: {filename} doesn't appear to be a PDF, skipping")
                    failed += 1
                    continue
                # Reset stream
                response = requests.get(pdf_url, timeout=30, stream=True)
            
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            # Update waterbody with local path
            wb['bathy_pdf_local'] = relative_path
            downloaded += 1
            print(f"  Saved: {filename}")
        except Exception as e:
            print(f"  Failed to download {pdf_url}: {e}")
            failed += 1
    
    print(f"\nDownloaded {downloaded} PDFs, {skipped} already existed, {failed} failed")

def main():
    """
    Main execution function
    """
    print("NH Fish & Game ArcGIS Data Fetcher")
    print("=" * 50)
    
    # Step 1: Discover or specify FeatureServer URL
    print("\nStep 1: Discovering FeatureServer endpoint...")
    feature_server_url = discover_feature_server()
    
    if not feature_server_url:
        print("\nWARNING: Could not auto-discover FeatureServer endpoint.")
        print("Please inspect the ArcGIS web app's network requests to find the FeatureServer URL.")
        print("See FIND_FEATURESERVER_URL.md for detailed instructions.")
        print("Common format: https://[server]/arcgis/rest/services/[service]/FeatureServer/[layer]")
        print("\nYou can:")
        print("  1. Edit this script and add the URL to 'possible_endpoints' list")
        print("  2. Run the script interactively and paste the URL when prompted")
        print("\nTo find the URL:")
        print("  1. Open: https://nhfg.maps.arcgis.com/apps/webappviewer/index.html?id=2243091f322449819c244c0c3b2f3f43")
        print("  2. Press F12 -> Network tab -> Filter by 'query'")
        print("  3. Look for FeatureServer/0/query requests")
        print("  4. Copy the URL (everything before /query)")
        
        try:
            feature_server_url = input("\nEnter FeatureServer URL (or press Enter to exit): ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nExiting. Please provide a FeatureServer URL.")
            print("Edit the script and add it to the 'possible_endpoints' list, then run again.")
            return
        
        if not feature_server_url:
            print("Exiting. Please provide a FeatureServer URL.")
            print("Edit scripts/fetch_arcgis_data.py and add the URL to the 'possible_endpoints' list.")
            return
    
    # Step 2: Query all features
    print(f"\nStep 2: Querying all features from {feature_server_url}...")
    try:
        features = query_all_features(feature_server_url)
    except Exception as e:
        print(f"Error querying features: {e}")
        print("\nTroubleshooting:")
        print("1. Check if the FeatureServer URL is correct")
        print("2. Verify the service is publicly accessible")
        print("3. Check network connectivity")
        return
    
    # Step 3: Process features
    print("\nStep 3: Processing features...")
    waterbodies = process_features(features)
    print(f"Processed {len(waterbodies)} waterbodies")
    
    # Step 4: Save to JSON file
    print("\nStep 4: Saving data...")
    save_to_json(waterbodies)
    
    # Step 5: Download PDFs (optional)
    print("\nStep 5: Downloading bathymetry PDFs...")
    try:
        download_choice = input("Download bathymetry PDFs? (y/n): ").strip().lower()
        if download_choice == 'y':
            download_bathy_pdfs(waterbodies)
    except (EOFError, KeyboardInterrupt):
        print("Skipping PDF download (non-interactive mode)")
    
    print("\n✅ Data fetch complete!")
    print(f"   JSON: data/nh_fishing_locations.json")

if __name__ == "__main__":
    main()

