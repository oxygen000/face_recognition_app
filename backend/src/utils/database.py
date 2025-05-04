"""
Database utility module for the Face Recognition API.
Provides functions for database operations.
"""

import sqlite3
import json
import time
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple, Union
import sys

# Import config and logger
sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import config
from utils.logger import get_logger

# Get logger
logger = get_logger("database")

class Database:
    """Database class for handling all database operations."""
    
    def __init__(self, db_path: str = config.DB_PATH):
        """
        Initialize the database connection.
        
        Args:
            db_path: Path to the SQLite database file
        """
        self.db_path = db_path
        self._ensure_db_exists()
        
    def _ensure_db_exists(self) -> None:
        """
        Ensure the database file exists and has the required tables.
        """
        try:
            # Create database directory if it doesn't exist
            db_dir = Path(self.db_path).parent
            db_dir.mkdir(exist_ok=True)
            
            # Connect to database
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Create users table if it doesn't exist
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                face_id TEXT,
                name TEXT NOT NULL,
                employee_id TEXT,
                department TEXT,
                role TEXT,
                image_path TEXT,
                image_url TEXT,
                face_encoding BLOB,
                multi_angle_encodings BLOB,
                face_analysis TEXT,
                created_at TEXT,
                updated_at TEXT
            )
            ''')
            
            # Create metrics table if it doesn't exist
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                endpoint TEXT NOT NULL,
                response_time REAL NOT NULL,
                status_code INTEGER NOT NULL,
                timestamp TEXT NOT NULL
            )
            ''')
            
            # Create cache table if it doesn't exist
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS cache (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                expires_at INTEGER NOT NULL
            )
            ''')
            
            # Commit changes and close connection
            conn.commit()
            conn.close()
            
            logger.info(f"Database initialized at {self.db_path}")
        except Exception as e:
            logger.error(f"Error initializing database: {e}")
            raise
    
    def get_connection(self) -> sqlite3.Connection:
        """
        Get a connection to the database.
        
        Returns:
            A connection to the database
        """
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row  # Return rows as dictionaries
            return conn
        except Exception as e:
            logger.error(f"Error connecting to database: {e}")
            raise
    
    async def add_user(
        self, 
        user_data: Dict[str, Any], 
        face_encoding_bytes: Optional[bytes] = None,
        multi_angle_encodings_bytes: Optional[bytes] = None
    ) -> str:
        """
        Add a new user to the database.
        
        Args:
            user_data: User data dictionary
            face_encoding_bytes: Face encoding as bytes
            multi_angle_encodings_bytes: Multiple face encodings as bytes
            
        Returns:
            The ID of the newly created user
        """
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Add timestamps
            current_time = time.strftime('%Y-%m-%d %H:%M:%S')
            if 'created_at' not in user_data:
                user_data['created_at'] = current_time
            user_data['updated_at'] = current_time
            
            # Prepare query
            fields = list(user_data.keys())
            if face_encoding_bytes is not None:
                fields.append('face_encoding')
            if multi_angle_encodings_bytes is not None:
                fields.append('multi_angle_encodings')
                
            placeholders = ', '.join(['?' for _ in range(len(fields))])
            
            # Prepare values
            values = list(user_data.values())
            if face_encoding_bytes is not None:
                values.append(face_encoding_bytes)
            if multi_angle_encodings_bytes is not None:
                values.append(multi_angle_encodings_bytes)
            
            # Execute query
            query = f'''
            INSERT INTO users ({', '.join(fields)})
            VALUES ({placeholders})
            '''
            cursor.execute(query, values)
            
            # Commit changes and close connection
            conn.commit()
            conn.close()
            
            logger.info(f"Added user {user_data.get('name')} with ID {user_data.get('id')}")
            return user_data.get('id')
        except Exception as e:
            logger.error(f"Error adding user: {e}")
            raise
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a user by ID.
        
        Args:
            user_id: The ID of the user to get
            
        Returns:
            The user data or None if not found
        """
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Execute query
            cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
            user = cursor.fetchone()
            
            # Close connection
            conn.close()
            
            if user:
                # Convert to dictionary
                user_dict = dict(user)
                logger.info(f"Retrieved user with ID {user_id}")
                return user_dict
            
            logger.warning(f"User with ID {user_id} not found")
            return None
        except Exception as e:
            logger.error(f"Error getting user by ID: {e}")
            raise
    
    async def get_all_users(self) -> List[Dict[str, Any]]:
        """
        Get all users from the database.
        
        Returns:
            A list of all users
        """
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Execute query
            cursor.execute('SELECT * FROM users ORDER BY created_at DESC')
            users = cursor.fetchall()
            
            # Close connection
            conn.close()
            
            # Convert to list of dictionaries
            users_list = [dict(user) for user in users]
            logger.info(f"Retrieved {len(users_list)} users")
            return users_list
        except Exception as e:
            logger.error(f"Error getting all users: {e}")
            raise
    
    async def get_users_paginated(self, page: int = 1, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get paginated users from the database.
        
        Args:
            page: Page number (starting from 1)
            limit: Number of items per page
            
        Returns:
            A paginated list of users
        """
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Calculate offset
            offset = (page - 1) * limit
            
            # Execute query with pagination
            cursor.execute(
                'SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
                (limit, offset)
            )
            users = cursor.fetchall()
            
            # Close connection
            conn.close()
            
            # Convert to list of dictionaries
            users_list = [dict(user) for user in users]
            logger.info(f"Retrieved {len(users_list)} users (page {page}, limit {limit})")
            return users_list
        except Exception as e:
            logger.error(f"Error getting paginated users: {e}")
            raise
    
    async def get_users_count(self) -> int:
        """
        Get the total count of users in the database.
        
        Returns:
            The total number of users
        """
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Execute count query
            cursor.execute('SELECT COUNT(*) FROM users')
            count = cursor.fetchone()[0]
            
            # Close connection
            conn.close()
            
            logger.info(f"Total user count: {count}")
            return count
        except Exception as e:
            logger.error(f"Error getting user count: {e}")
            raise
    
    async def update_user(
        self, 
        user_id: str, 
        user_data: Dict[str, Any],
        face_encoding_bytes: Optional[bytes] = None,
        multi_angle_encodings_bytes: Optional[bytes] = None
    ) -> bool:
        """
        Update a user in the database.
        
        Args:
            user_id: The ID of the user to update
            user_data: User data dictionary
            face_encoding_bytes: Face encoding as bytes
            multi_angle_encodings_bytes: Multiple face encodings as bytes
            
        Returns:
            True if the user was updated, False otherwise
        """
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Add updated_at timestamp
            user_data['updated_at'] = time.strftime('%Y-%m-%d %H:%M:%S')
            
            # Prepare query
            set_clause = ', '.join([f'{key} = ?' for key in user_data.keys()])
            if face_encoding_bytes is not None:
                set_clause += ', face_encoding = ?'
            if multi_angle_encodings_bytes is not None:
                set_clause += ', multi_angle_encodings = ?'
                
            # Prepare values
            values = list(user_data.values())
            if face_encoding_bytes is not None:
                values.append(face_encoding_bytes)
            if multi_angle_encodings_bytes is not None:
                values.append(multi_angle_encodings_bytes)
            values.append(user_id)
            
            # Execute query
            query = f'''
            UPDATE users
            SET {set_clause}
            WHERE id = ?
            '''
            cursor.execute(query, values)
            
            # Check if user was updated
            updated = cursor.rowcount > 0
            
            # Commit changes and close connection
            conn.commit()
            conn.close()
            
            if updated:
                logger.info(f"Updated user with ID {user_id}")
            else:
                logger.warning(f"User with ID {user_id} not found for update")
            
            return updated
        except Exception as e:
            logger.error(f"Error updating user: {e}")
            raise
    
    async def delete_user(self, user_id: str) -> bool:
        """
        Delete a user from the database.
        
        Args:
            user_id: The ID of the user to delete
            
        Returns:
            True if the user was deleted, False otherwise
        """
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Execute query
            cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
            
            # Check if user was deleted
            deleted = cursor.rowcount > 0
            
            # Commit changes and close connection
            conn.commit()
            conn.close()
            
            if deleted:
                logger.info(f"Deleted user with ID {user_id}")
            else:
                logger.warning(f"User with ID {user_id} not found for deletion")
            
            return deleted
        except Exception as e:
            logger.error(f"Error deleting user: {e}")
            raise
    
    async def get_all_face_encodings(self) -> List[Dict[str, Any]]:
        """
        Get all face encodings from the database.
        
        Returns:
            A list of all face encodings with user data
        """
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Execute query
            cursor.execute('''
            SELECT id, face_id, name, face_encoding, multi_angle_encodings, face_analysis, image_path, image_url
            FROM users
            WHERE face_encoding IS NOT NULL
            ''')
            encodings = cursor.fetchall()
            
            # Close connection
            conn.close()
            
            # Convert to list of dictionaries
            encodings_list = [dict(encoding) for encoding in encodings]
            logger.info(f"Retrieved {len(encodings_list)} face encodings")
            return encodings_list
        except Exception as e:
            logger.error(f"Error getting face encodings: {e}")
            raise
    
    async def search_users(self, query: str) -> List[Dict[str, Any]]:
        """
        Search for users in the database.
        
        Args:
            query: The search query
            
        Returns:
            A list of matching users
        """
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Execute query
            search_term = f"%{query}%"
            cursor.execute('''
            SELECT * FROM users
            WHERE name LIKE ? OR employee_id LIKE ? OR department LIKE ? OR role LIKE ?
            ORDER BY created_at DESC
            ''', (search_term, search_term, search_term, search_term))
            users = cursor.fetchall()
            
            # Close connection
            conn.close()
            
            # Convert to list of dictionaries
            users_list = [dict(user) for user in users]
            logger.info(f"Found {len(users_list)} users matching '{query}'")
            return users_list
        except Exception as e:
            logger.error(f"Error searching users: {e}")
            raise
    
    async def add_metric(
        self, 
        endpoint: str, 
        response_time: float, 
        status_code: int
    ) -> None:
        """
        Add a metric to the database.
        
        Args:
            endpoint: The API endpoint
            response_time: The response time in seconds
            status_code: The HTTP status code
        """
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Execute query
            cursor.execute('''
            INSERT INTO metrics (endpoint, response_time, status_code, timestamp)
            VALUES (?, ?, ?, ?)
            ''', (endpoint, response_time, status_code, time.strftime('%Y-%m-%d %H:%M:%S')))
            
            # Commit changes and close connection
            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"Error adding metric: {e}")
            # Don't raise exception for metrics to avoid affecting main functionality
    
    async def get_metrics(
        self, 
        limit: int = 100, 
        endpoint: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get metrics from the database.
        
        Args:
            limit: The maximum number of metrics to return
            endpoint: Filter by endpoint
            
        Returns:
            A list of metrics
        """
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Prepare query
            query = 'SELECT * FROM metrics'
            params = []
            
            if endpoint:
                query += ' WHERE endpoint = ?'
                params.append(endpoint)
            
            query += ' ORDER BY timestamp DESC LIMIT ?'
            params.append(limit)
            
            # Execute query
            cursor.execute(query, params)
            metrics = cursor.fetchall()
            
            # Close connection
            conn.close()
            
            # Convert to list of dictionaries
            metrics_list = [dict(metric) for metric in metrics]
            return metrics_list
        except Exception as e:
            logger.error(f"Error getting metrics: {e}")
            raise
    
    async def get_cache(self, key: str) -> Optional[Dict[str, Any]]:
        """
        Get a cached value from the database.
        
        Args:
            key: The cache key
            
        Returns:
            The cached value or None if not found or expired
        """
        if not config.CACHE_ENABLED:
            return None
            
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Execute query
            cursor.execute('''
            SELECT value, expires_at FROM cache
            WHERE key = ? AND expires_at > ?
            ''', (key, int(time.time())))
            cache = cursor.fetchone()
            
            # Close connection
            conn.close()
            
            if cache:
                return json.loads(cache['value'])
            
            return None
        except Exception as e:
            logger.error(f"Error getting cache: {e}")
            # Don't raise exception for cache to avoid affecting main functionality
            return None
    
    async def set_cache(self, key: str, value: Any, ttl: int = config.CACHE_TTL) -> None:
        """
        Set a cached value in the database.
        
        Args:
            key: The cache key
            value: The value to cache
            ttl: Time to live in seconds
        """
        if not config.CACHE_ENABLED:
            return
            
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Execute query
            expires_at = int(time.time()) + ttl
            cursor.execute('''
            INSERT OR REPLACE INTO cache (key, value, expires_at)
            VALUES (?, ?, ?)
            ''', (key, json.dumps(value), expires_at))
            
            # Commit changes and close connection
            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"Error setting cache: {e}")
            # Don't raise exception for cache to avoid affecting main functionality
    
    async def clear_cache(self) -> int:
        """
        Clear all expired cache entries.
        
        Returns:
            The number of entries cleared
        """
        if not config.CACHE_ENABLED:
            return 0
            
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Execute query
            cursor.execute('DELETE FROM cache WHERE expires_at <= ?', (int(time.time()),))
            cleared = cursor.rowcount
            
            # Commit changes and close connection
            conn.commit()
            conn.close()
            
            logger.info(f"Cleared {cleared} expired cache entries")
            return cleared
        except Exception as e:
            logger.error(f"Error clearing cache: {e}")
            # Don't raise exception for cache to avoid affecting main functionality
            return 0
    
    async def clear_all_cache(self) -> int:
        """
        Clear all cache entries.
        
        Returns:
            The number of entries cleared
        """
        if not config.CACHE_ENABLED:
            return 0
            
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Execute query
            cursor.execute('DELETE FROM cache')
            cleared = cursor.rowcount
            
            # Commit changes and close connection
            conn.commit()
            conn.close()
            
            logger.info(f"Cleared all {cleared} cache entries")
            return cleared
        except Exception as e:
            logger.error(f"Error clearing all cache: {e}")
            # Don't raise exception for cache to avoid affecting main functionality
            return 0

# Create database instance
database = Database()
