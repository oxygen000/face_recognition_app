import os

# Database configuration
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "face_recognition.db")

# Make sure the data directory exists
os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), "data"), exist_ok=True)

# Set this to True to recreate the database and rebuild recognition models
# WARNING: This will delete all existing data
REBUILD_DATABASE = False

# Set a longer timeout for database operations (in milliseconds)
DB_TIMEOUT = 10000  # 10 seconds

# Cache expiry time in seconds
CACHE_EXPIRY = 60 * 5  # 5 minutes 