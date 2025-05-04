"""
Metrics service for the Face Recognition API.
Provides functions for tracking and retrieving API metrics.
"""

import time
import statistics
from typing import Dict, List, Any, Optional
import sys
from pathlib import Path
from collections import defaultdict

# Import config and logger
sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import config
from utils.logger import get_logger
from utils.database import database

# Get logger
logger = get_logger("metrics_service")

class MetricsService:
    """Service for tracking and retrieving API metrics."""
    
    def __init__(self):
        """Initialize the metrics service."""
        self.metrics = {
            "requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "response_times": [],
            "endpoints": defaultdict(int),
            "status_codes": defaultdict(int),
            "start_time": time.time()
        }
        logger.info("Metrics service initialized")
    
    async def record_request(
        self, 
        endpoint: str, 
        response_time: float, 
        status_code: int
    ) -> None:
        """
        Record a request in the metrics.
        
        Args:
            endpoint: The API endpoint
            response_time: The response time in seconds
            status_code: The HTTP status code
        """
        try:
            # Update in-memory metrics
            self.metrics["requests"] += 1
            self.metrics["response_times"].append(response_time)
            self.metrics["endpoints"][endpoint] += 1
            self.metrics["status_codes"][str(status_code)] += 1
            
            if 200 <= status_code < 400:
                self.metrics["successful_requests"] += 1
            else:
                self.metrics["failed_requests"] += 1
            
            # Record in database
            await database.add_metric(endpoint, response_time, status_code)
        except Exception as e:
            logger.error(f"Error recording request: {e}")
    
    def get_metrics(self) -> Dict[str, Any]:
        """
        Get the current metrics.
        
        Returns:
            A dictionary of metrics
        """
        try:
            # Calculate statistics
            response_times = self.metrics["response_times"]
            avg_response_time = statistics.mean(response_times) if response_times else 0
            
            # Calculate uptime
            uptime_seconds = time.time() - self.metrics["start_time"]
            uptime = {
                "days": int(uptime_seconds // 86400),
                "hours": int((uptime_seconds % 86400) // 3600),
                "minutes": int((uptime_seconds % 3600) // 60),
                "seconds": int(uptime_seconds % 60)
            }
            
            # Format metrics
            return {
                "requests": {
                    "total": self.metrics["requests"],
                    "successful": self.metrics["successful_requests"],
                    "failed": self.metrics["failed_requests"],
                    "success_rate": (self.metrics["successful_requests"] / self.metrics["requests"] * 100) if self.metrics["requests"] > 0 else 0
                },
                "response_time": {
                    "average_ms": round(avg_response_time * 1000, 2),
                    "min_ms": round(min(response_times) * 1000, 2) if response_times else 0,
                    "max_ms": round(max(response_times) * 1000, 2) if response_times else 0
                },
                "endpoints": dict(self.metrics["endpoints"]),
                "status_codes": dict(self.metrics["status_codes"]),
                "uptime": uptime
            }
        except Exception as e:
            logger.error(f"Error getting metrics: {e}")
            return {"error": "Failed to retrieve metrics"}
    
    async def get_detailed_metrics(
        self, 
        limit: int = 100, 
        endpoint: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get detailed metrics from the database.
        
        Args:
            limit: The maximum number of metrics to return
            endpoint: Filter by endpoint
            
        Returns:
            A dictionary of detailed metrics
        """
        try:
            # Get metrics from database
            metrics = await database.get_metrics(limit, endpoint)
            
            # Calculate statistics
            response_times = [metric["response_time"] for metric in metrics]
            avg_response_time = statistics.mean(response_times) if response_times else 0
            
            # Count status codes
            status_codes = defaultdict(int)
            for metric in metrics:
                status_codes[str(metric["status_code"])] += 1
            
            # Count endpoints
            endpoints = defaultdict(int)
            for metric in metrics:
                endpoints[metric["endpoint"]] += 1
            
            # Format metrics
            return {
                "metrics": metrics,
                "statistics": {
                    "count": len(metrics),
                    "response_time": {
                        "average_ms": round(avg_response_time * 1000, 2),
                        "min_ms": round(min(response_times) * 1000, 2) if response_times else 0,
                        "max_ms": round(max(response_times) * 1000, 2) if response_times else 0
                    },
                    "status_codes": dict(status_codes),
                    "endpoints": dict(endpoints)
                }
            }
        except Exception as e:
            logger.error(f"Error getting detailed metrics: {e}")
            return {"error": "Failed to retrieve detailed metrics"}

# Create metrics service instance
metrics_service = MetricsService()
