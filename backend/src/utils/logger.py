"""
Logger module for the Face Recognition API.
Provides a consistent logging interface for the application.
"""

import logging
import sys
from pathlib import Path
from typing import Optional

# Import config
sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import config

# Create logger
logger = logging.getLogger("face_recognition_api")
logger.setLevel(getattr(logging, config.LOG_LEVEL))

# Create formatter
formatter = logging.Formatter(config.LOG_FORMAT)

# Create file handler
file_handler = logging.FileHandler(config.LOG_FILE)
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)

# Create console handler
console_handler = logging.StreamHandler()
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

def get_logger(name: Optional[str] = None) -> logging.Logger:
    """
    Get a logger instance with the given name.
    If no name is provided, returns the root logger.
    
    Args:
        name: The name of the logger
        
    Returns:
        A logger instance
    """
    if name:
        return logging.getLogger(f"face_recognition_api.{name}")
    return logger
