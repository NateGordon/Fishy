"""
Helper script to discover available services on the ArcGIS server
This will help find the waterbodies/fishing service
"""

import requests
import json

# Base URL from the discovered endpoint
BASE_URL = "https://services8.arcgis.com/hg1B9Egwk1I5p300/arcgis/rest/services"

def get_services_list():
    """
    Get list of all available services on this server
    """
    services_url = f"{BASE_URL}?f=json"
    
    try:
        response = requests.get(services_url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if 'services' in data:
            print(f"\nFound {len(data['services'])} services on this server:\n")
            print("=" * 80)
            
            # Filter for FeatureServer services (likely to contain waterbody data)
            feature_services = [s for s in data['services'] if s.get('type') == 'FeatureServer']
            
            print("\nFeatureServer Services (most likely to contain waterbody data):")
            print("-" * 80)
            for service in feature_services:
                name = service.get('name', 'Unknown')
                service_url = f"{BASE_URL}/{name}/FeatureServer"
                print(f"  • {name}")
                print(f"    URL: {service_url}/0")
                print()
            
            # Show all services
            print("\nAll Services:")
            print("-" * 80)
            for service in data['services']:
                name = service.get('name', 'Unknown')
                service_type = service.get('type', 'Unknown')
                print(f"  • {name} ({service_type})")
            
            return feature_services
        else:
            print("Could not find services list. Response structure:")
            print(json.dumps(data, indent=2))
            return []
            
    except Exception as e:
        print(f"Error fetching services: {e}")
        return []

def test_service(service_name):
    """
    Test a specific service to see if it contains waterbody data
    """
    service_url = f"{BASE_URL}/{service_name}/FeatureServer/0"
    query_url = f"{service_url}?f=json"
    
    try:
        response = requests.get(query_url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if 'fields' in data:
            print(f"\n{service_name} - Available fields:")
            print("-" * 80)
            for field in data['fields'][:10]:  # Show first 10 fields
                print(f"  • {field.get('name')} ({field.get('type')})")
            if len(data['fields']) > 10:
                print(f"  ... and {len(data['fields']) - 10} more fields")
            
            # Check for waterbody-related field names
            field_names = [f.get('name', '').upper() for f in data['fields']]
            waterbody_indicators = ['WATER', 'FISH', 'LAKE', 'POND', 'RIVER', 'SPECIES', 'ACRES', 'DEPTH']
            matches = [ind for ind in waterbody_indicators if any(ind in name for name in field_names)]
            
            if matches:
                print(f"\n  [OK] Looks like waterbody data! (found: {', '.join(matches)})")
                return True
            else:
                print(f"\n  [X] Doesn't appear to be waterbody data")
                return False
        else:
            print(f"  [X] Invalid service response")
            return False
            
    except Exception as e:
        print(f"  [X] Error testing service: {e}")
        return False

if __name__ == "__main__":
    print("ArcGIS Service Discovery")
    print("=" * 80)
    print(f"Server: {BASE_URL}")
    print()
    
    services = get_services_list()
    
    if services:
        print("\n" + "=" * 80)
        print("Testing FeatureServer services for waterbody data...")
        print("=" * 80)
        
        for service in services:
            service_name = service.get('name')
            print(f"\nTesting: {service_name}")
            test_service(service_name)
    
    print("\n" + "=" * 80)
    print("Next steps:")
    print("1. Look for services with 'water', 'fish', 'lake', 'pond' in the name")
    print("2. Test promising services using the test_service() function")
    print("3. Once found, update fetch_arcgis_data.py with the correct service name")

