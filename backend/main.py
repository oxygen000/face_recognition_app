"""
Main entry point for the Face Recognition API.
"""

import uvicorn
import sys
from pathlib import Path

# Import config and logger
sys.path.append(str(Path(__file__).resolve().parent))
from config import config
from utils.logger import get_logger

# Get logger
logger = get_logger("main")

def main():
    """
    Main entry point for the application.
    """
    logger.info(f"Starting Face Recognition API v{config.API_VERSION}")
    logger.info(f"Host: {config.API_HOST}, Port: {config.API_PORT}")
    
    # Start the server
    uvicorn.run(
        "api.api:app",
        host=config.API_HOST,
        port=config.API_PORT,
        reload=config.API_DEBUG,
        log_level=config.LOG_LEVEL.lower()
    )

if __name__ == "__main__":
    main()
