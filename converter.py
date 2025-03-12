import csv
import json
import os

def csv_to_geojson_js(input_csv, output_js, variable_name="json_complete_parish_data_1"):
    """
    Convert a CSV file with church data to a JavaScript file containing GeoJSON.
    
    Parameters:
    - input_csv: Path to the input CSV file
    - output_js: Path to the output JavaScript file
    - variable_name: Name of the JavaScript variable to assign the GeoJSON to
    """
    # Clean paths (remove quotes if present)
    input_csv = input_csv.strip('"\'')
    
    # Read the CSV file
    features = []
    
    print(f"Reading from: {input_csv}")
    with open(input_csv, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            # Skip rows without valid coordinates
            try:
                lat = float(row.get('Latitude', '').strip())
                lon = float(row.get('Longitude', '').strip())
                if not (lat and lon):
                    continue
            except (ValueError, TypeError):
                continue
            
            # Create a GeoJSON feature
            feature = {
                "type": "Feature",
                "properties": {
                    "Title": row.get('Title', ''),
                    "Jurisdiction": row.get('Jurisdiction', ''),
                    "Type": row.get('Type', ''),
                    "Rite": row.get('Rite', ''),
                    "Address": row.get('Address', ''),
                    "Country": row.get('Country', ''),
                    "GCatholic_ID": float(row.get('GCatholic_ID', 0)) if row.get('GCatholic_ID', '').strip() else None,
                    "Location": row.get('Location', None),
                    "Location_Link": row.get('Location_Link', None),
                    "URL": row.get('URL', None),
                    "Latitude": lat,
                    "Longitude": lon
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [lon, lat]  # GeoJSON uses [longitude, latitude] order
                }
            }
            features.append(feature)
    
    # Create the GeoJSON structure
    geojson = {
        "type": "FeatureCollection",
        "name": "complete_parish_data_1",
        "crs": {
            "type": "name",
            "properties": {
                "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
            }
        },
        "features": features
    }
    
    # Write to JavaScript file
    with open(output_js, 'w', encoding='utf-8') as jsfile:
        jsfile.write(f"var {variable_name} = ")
        json.dump(geojson, jsfile, ensure_ascii=False)
        jsfile.write(";")
    
    print(f"Conversion complete! {len(features)} features written to {output_js}")

if __name__ == "__main__":
    # Get input from user
    input_csv = input("Enter the path to your CSV file: ")
    input_csv = input_csv.strip('"\'')  # Remove quotes if present
    
    output_dir = input("Enter the directory to save the JavaScript file (default: ./data): ") or "./data"
    output_dir = output_dir.strip('"\'')  # Remove quotes if present
    
    # Create output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
    
    # Define output path
    output_js = os.path.join(output_dir, "complete_parish_data_1.js")
    
    # Convert CSV to GeoJSON JavaScript
    csv_to_geojson_js(input_csv, output_js)
    
    print("\nNext steps:")
    print("1. Replace the existing complete_parish_data_1.js file in your web map's data directory")
    print("2. Reload your web map in the browser")
    print("3. You should now see all your churches displayed and filterable")