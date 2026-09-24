/**
 * Fetch NH Fish & Game waterbody data from ArcGIS REST FeatureServer
 * Node.js version - can be run with: node scripts/fetch_arcgis_data.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

/**
 * Make HTTP/HTTPS request
 */
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        
        client.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) {
                    resolve(data);
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Discover FeatureServer endpoint
 */
async function discoverFeatureServer() {
    const possibleEndpoints = [
        "https://nhfg.maps.arcgis.com/arcgis/rest/services/NHFG_Waterbodies/FeatureServer/0",
        "https://nhfg.maps.arcgis.com/arcgis/rest/services/Fishing_Waterbodies/FeatureServer/0",
        "https://nhfg.maps.arcgis.com/arcgis/rest/services/Waterbodies/FeatureServer/0",
    ];
    
    for (const endpoint of possibleEndpoints) {
        try {
            const testUrl = `${endpoint}?f=json`;
            const data = await makeRequest(testUrl);
            if (data.fields) {
                console.log(`Found FeatureServer: ${endpoint}`);
                return endpoint;
            }
        } catch (e) {
            continue;
        }
    }
    
    return null;
}

/**
 * Query all features from FeatureServer
 */
async function queryAllFeatures(featureServerUrl, layerId = 0) {
    const queryUrl = `${featureServerUrl}/${layerId}/query?where=1%3D1&outFields=*&f=json&returnGeometry=true`;
    
    console.log(`Querying: ${queryUrl}`);
    
    const data = await makeRequest(queryUrl);
    
    if (data.error) {
        throw new Error(`ArcGIS API Error: ${JSON.stringify(data.error)}`);
    }
    
    if (!data.features) {
        throw new Error("No 'features' key in response");
    }
    
    console.log(`Retrieved ${data.features.length} features`);
    return data.features;
}

/**
 * Extract coordinates from feature geometry
 */
function extractCoordinates(feature) {
    const geometry = feature.geometry || {};
    
    if (geometry.x !== undefined && geometry.y !== undefined) {
        return { lat: geometry.y, lng: geometry.x };
    }
    
    if (geometry.rings && geometry.rings.length > 0 && geometry.rings[0].length > 0) {
        const firstPoint = geometry.rings[0][0];
        return { lat: firstPoint[1], lng: firstPoint[0] };
    }
    
    if (geometry.paths && geometry.paths.length > 0 && geometry.paths[0].length > 0) {
        const firstPoint = geometry.paths[0][0];
        return { lat: firstPoint[1], lng: firstPoint[0] };
    }
    
    return { lat: null, lng: null };
}

/**
 * Normalize species data
 */
function normalizeSpecies(speciesField) {
    if (!speciesField) return [];
    
    if (Array.isArray(speciesField)) {
        return speciesField;
    }
    
    if (typeof speciesField === 'string') {
        return speciesField
            .replace(/[;\n]/g, ',')
            .split(',')
            .map(s => s.trim())
            .filter(s => s);
    }
    
    return [];
}

/**
 * Process features into normalized structure
 */
function processFeatures(features) {
    return features.map((feature, idx) => {
        const attributes = feature.attributes || {};
        const { lat, lng } = extractCoordinates(feature);
        
        return {
            id: attributes.OBJECTID || attributes.FID || idx + 1,
            name: attributes.NAME || attributes.Waterbody || attributes.WATERBODY || 'Unknown',
            town: attributes.TOWN || attributes.Town || attributes.CITY || '',
            water_type: attributes.TYPE || attributes.WaterType || attributes.CLASS || '',
            acres: attributes.ACRES || attributes.Acres || attributes.SIZE || null,
            depth: attributes.DEPTH || attributes.Depth || attributes.MAX_DEPTH || null,
            latitude: lat,
            longitude: lng,
            species: normalizeSpecies(attributes.SPECIES || attributes.Species || attributes.FISH),
            classification: attributes.CLASSIFICATION || attributes.Classification || '',
            access: attributes.ACCESS || attributes.Access || attributes.ACCESS_TYPE || '',
            stocking: attributes.STOCKING || attributes.Stocking || attributes.STOCKED || '',
            regulations: attributes.REGULATIONS || attributes.Regulations || attributes.SPECIAL || '',
            bathy_pdf_url: attributes.MoreInfo || attributes.PDF_LINK || attributes.BATHY_PDF || attributes.BATHYMETRY || '',
            last_updated: new Date().toISOString().split('T')[0],
            raw_attributes: attributes
        };
    });
}

/**
 * Save to CSV
 */
function saveToCSV(waterbodies, outputFile = 'data/nh_fishing_locations.csv') {
    const dir = path.dirname(outputFile);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    if (waterbodies.length === 0) {
        console.log("No waterbodies to save");
        return;
    }
    
    const fieldnames = [
        'id', 'name', 'town', 'water_type', 'latitude', 'longitude',
        'acres', 'depth', 'species', 'classification', 'access', 'stocking',
        'regulations', 'bathy_pdf_url', 'last_updated'
    ];
    
    // Get all unique keys
    const allKeys = new Set();
    waterbodies.forEach(wb => {
        Object.keys(wb).forEach(key => {
            if (key !== 'raw_attributes') allKeys.add(key);
        });
    });
    
    // Add additional fields
    const headers = [...fieldnames, ...Array.from(allKeys).filter(k => !fieldnames.includes(k)).sort()];
    
    // Create CSV content
    let csv = headers.join(',') + '\n';
    
    waterbodies.forEach(wb => {
        const row = headers.map(header => {
            let value = wb[header];
            if (value === null || value === undefined) return '';
            if (Array.isArray(value)) return value.join(', ');
            if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
            return value;
        });
        csv += row.join(',') + '\n';
    });
    
    fs.writeFileSync(outputFile, csv, 'utf-8');
    console.log(`Saved ${waterbodies.length} waterbodies to ${outputFile}`);
}

/**
 * Save to JSON
 */
function saveToJSON(waterbodies, outputFile = 'data/nh_fishing_locations.json') {
    const dir = path.dirname(outputFile);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputFile, JSON.stringify(waterbodies, null, 2), 'utf-8');
    console.log(`Saved ${waterbodies.length} waterbodies to ${outputFile}`);
}

/**
 * Main execution
 */
async function main() {
    console.log("NH Fish & Game ArcGIS Data Fetcher (Node.js)");
    console.log("=".repeat(50));
    
    // Discover FeatureServer
    console.log("\nStep 1: Discovering FeatureServer endpoint...");
    let featureServerUrl = await discoverFeatureServer();
    
    if (!featureServerUrl) {
        console.log("\n⚠️  Could not auto-discover FeatureServer endpoint.");
        console.log("Please inspect the ArcGIS web app's network requests.");
        console.log("You may need to manually specify the URL in the script.");
        return;
    }
    
    // Query features
    console.log(`\nStep 2: Querying all features from ${featureServerUrl}...`);
    let features;
    try {
        features = await queryAllFeatures(featureServerUrl);
    } catch (e) {
        console.error(`Error querying features: ${e.message}`);
        return;
    }
    
    // Process features
    console.log("\nStep 3: Processing features...");
    const waterbodies = processFeatures(features);
    console.log(`Processed ${waterbodies.length} waterbodies`);
    
    // Save data
    console.log("\nStep 4: Saving data...");
    saveToCSV(waterbodies);
    saveToJSON(waterbodies);
    
    console.log("\n✅ Data fetch complete!");
    console.log("   CSV: data/nh_fishing_locations.csv");
    console.log("   JSON: data/nh_fishing_locations.json");
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { queryAllFeatures, processFeatures, discoverFeatureServer };

