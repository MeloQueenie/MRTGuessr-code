import csv
from config import CSV_PATH

# Store panorama data in memory
panorama_data = {}

def load_panoramas():
    """
    Load all panorama data from the CSV file.
    Only loads panoramas that have valid coordinates (not empty).
    """
    print("Loading panoramas from CSV...")
    with open(CSV_PATH, 'r') as file:
        csv_reader = csv.DictReader(file)
        for row in csv_reader:
            # Only add panoramas with valid coordinates
            if row['X'] and row['Z'] and row['X'] != '-' and row['Z'] != '-':
                # Extract the panorama number from filename (e.g., "panorama_0" -> 0)
                panorama_id = int(row['Filename'].split('_')[1])

                # Normalize coordinates to ensure they end with .5 (center of block)
                x = float(row['X'])
                z = float(row['Z'])
                if x % 1 == 0:
                    x += 0.5
                if z % 1 == 0:
                    z += 0.5

                panorama_data[panorama_id] = {
                    'id': panorama_id,
                    'x': x,
                    'z': z,
                    'town': row['Closest Town'],
                    'rank': row['Town Rank'],
                    'notes': row['Notes']
                }
    print(f"Loaded {len(panorama_data)} panoramas")

def get_panorama_data() -> dict[int, dict[str, int | float | str]]:
        """Get the panorama data dictionary.
        
        Returns:
            dict with structure: {
                panorama_id: {
                    'id': int,
                    'x': float,
                    'z': float,
                    'town': str,
                    'rank': str,
                    'notes': str
                }
            }
        """
        """Get the panorama data dictionary."""
        return panorama_data

def get_panorama(panorama_id):
    """Get a specific panorama by ID."""
    return panorama_data.get(panorama_id)
