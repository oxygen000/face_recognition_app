"""
Admin endpoints for the Face Recognition API.
"""
from fastapi import APIRouter

import config
from middleware import metrics, clear_cache, response_cache

router = APIRouter()

@router.get("/api/metrics", tags=["Admin"])
async def get_metrics():
    """Get server performance metrics"""
    return {
        "status": "success",
        "metrics": metrics.get_metrics(),
        "cache_stats": {
            "items": len(response_cache),
            "memory_usage_estimate_kb": len(response_cache) * 10  # Rough estimate
        },
        "system": {
            "thread_pool_max": config.MAX_WORKERS,
            "concurrent_recognition_limit": config.MAX_CONCURRENT_RECOGNITIONS
        }
    }

@router.post("/api/cache/clear", tags=["Admin"])
async def clear_cache_endpoint():
    """Clear the response cache"""
    cache_size = clear_cache()
    return {
        "status": "success",
        "message": f"Cleared {cache_size} cached items"
    }
