"""
Metrics middleware for the Face Recognition API.
Records request metrics for each API call.
"""

import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import sys
from pathlib import Path

# Import services
sys.path.append(str(Path(__file__).resolve().parent.parent))
from services.metrics_service import metrics_service
from utils.logger import get_logger

# Get logger
logger = get_logger("metrics_middleware")

class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware for recording request metrics."""
    
    def __init__(self, app: ASGIApp):
        """
        Initialize the metrics middleware.
        
        Args:
            app: The ASGI application
        """
        super().__init__(app)
        logger.info("Metrics middleware initialized")
    
    async def dispatch(self, request: Request, call_next):
        """
        Process a request and record metrics.
        
        Args:
            request: The request object
            call_next: The next middleware or route handler
            
        Returns:
            The response from the next middleware or route handler
        """
        # Record start time
        start_time = time.time()
        
        # Process request
        response = await call_next(request)
        
        # Record end time
        end_time = time.time()
        
        # Calculate response time
        response_time = end_time - start_time
        
        # Get endpoint
        endpoint = request.url.path
        
        # Record metrics
        await metrics_service.record_request(
            endpoint=endpoint,
            response_time=response_time,
            status_code=response.status_code
        )
        
        return response
