"""
Database service for the Face Recognition API.
This module handles database operations.
"""
import os
import json
import sqlite3
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

import config

class DatabaseService:
    """Service for database operations"""
    
    def __init__(self, db_path=None):
        """Initialize the database service"""
        self.db_path = db_path or config.DB_PATH
        print(f"Using database path: {self.db_path}")
        self._create_tables_if_not_exist()
        
    def _get_connection(self):
        """Get a database connection"""
        try:
            conn = sqlite3.connect(self.db_path, timeout=config.DB_TIMEOUT/1000)  # Convert from ms to seconds
            conn.row_factory = sqlite3.Row
            # Enable foreign keys
            conn.execute("PRAGMA foreign_keys = ON")
            # Set busy timeout
            conn.execute(f"PRAGMA busy_timeout = {config.DB_TIMEOUT}")
            return conn
        except sqlite3.Error as e:
            print(f"Error connecting to database: {e}")
            # Return a connection to an in-memory database as fallback
            conn = sqlite3.connect(":memory:")
            conn.row_factory = sqlite3.Row
            return conn
        
    def _create_tables_if_not_exist(self):
        """Create database tables if they don't exist"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        # Create users table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            employee_id TEXT,
            department TEXT,
            role TEXT,
            face_id TEXT,
            image_path TEXT,
            image_url TEXT,
            created_at TEXT,
            face_analysis TEXT,
            face_encoding BLOB,
            multi_angle_encodings BLOB
        )
        ''')
        
        # Create logs table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS logs (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            action TEXT,
            timestamp TEXT,
            details TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
        ''')
        
        conn.commit()
        conn.close()
        
    async def get_all_users(self) -> List[Dict[str, Any]]:
        """Get all users from the database"""
        try:
            # Add timeout to avoid hanging forever if database is locked
            conn = self._get_connection()
            conn.execute("PRAGMA busy_timeout = 5000")  # 5 second timeout
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM users ORDER BY name')
            rows = cursor.fetchall()
            
            users = []
            for row in rows:
                user = dict(row)
                # Remove large binary data to improve performance
                if "face_encoding" in user:
                    del user["face_encoding"]
                if "multi_angle_encodings" in user:
                    del user["multi_angle_encodings"]
                users.append(user)
            
            conn.close()
            return users
        except sqlite3.Error as e:
            print(f"Database error in get_all_users: {str(e)}")
            return []
        except Exception as e:
            print(f"Unexpected error in get_all_users: {str(e)}")
            return []
        
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a user by ID"""
        try:
            # Add timeout to avoid hanging forever if database is locked
            conn = self._get_connection()
            conn.execute("PRAGMA busy_timeout = 5000")  # 5 second timeout
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
            row = cursor.fetchone()
            
            if row:
                user = dict(row)
                # Remove large binary data to improve performance
                if "face_encoding" in user:
                    del user["face_encoding"]
                if "multi_angle_encodings" in user:
                    del user["multi_angle_encodings"]
                conn.close()
                return user
            
            conn.close()
            return None
        except sqlite3.Error as e:
            print(f"Database error in get_user_by_id: {str(e)}")
            return None
        except Exception as e:
            print(f"Unexpected error in get_user_by_id: {str(e)}")
            return None
        
    async def add_user(self, user_data: Dict[str, Any], face_encoding_bytes: bytes, multi_angle_encodings_bytes: Optional[bytes] = None) -> str:
        """Add a new user to the database"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        # Generate a unique ID if not provided
        if 'id' not in user_data:
            user_data['id'] = str(uuid.uuid4())
            
        # Insert the user
        cursor.execute('''
        INSERT INTO users (
            id, name, employee_id, department, role, face_id, image_path, image_url, created_at, face_analysis, face_encoding, multi_angle_encodings
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_data['id'],
            user_data['name'],
            user_data.get('employee_id', ''),
            user_data.get('department', ''),
            user_data.get('role', ''),
            user_data.get('face_id', ''),
            user_data.get('image_path', ''),
            user_data.get('image_url', ''),
            user_data.get('created_at', datetime.now().isoformat()),
            user_data.get('face_analysis', ''),
            face_encoding_bytes,
            multi_angle_encodings_bytes
        ))
        
        conn.commit()
        conn.close()
        
        return user_data['id']
        
    async def update_user(self, user_id: str, user_data: Dict[str, Any]) -> bool:
        """Update a user in the database"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        # Build the update query dynamically based on provided fields
        fields = []
        values = []
        
        for key, value in user_data.items():
            if key != 'id':  # Skip the ID field
                fields.append(f"{key} = ?")
                values.append(value)
                
        if not fields:
            conn.close()
            return False
            
        values.append(user_id)  # Add the user ID for the WHERE clause
        
        query = f"UPDATE users SET {', '.join(fields)} WHERE id = ?"
        cursor.execute(query, values)
        
        conn.commit()
        conn.close()
        
        return cursor.rowcount > 0
        
    async def delete_user(self, user_id: str) -> bool:
        """Delete a user from the database"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        # Get the user's image path before deleting
        cursor.execute('SELECT image_path FROM users WHERE id = ?', (user_id,))
        row = cursor.fetchone()
        
        if row and row['image_path']:
            # Delete the image file if it exists
            image_path = row['image_path']
            if os.path.exists(image_path):
                try:
                    os.remove(image_path)
                except Exception as e:
                    print(f"Error deleting image file: {e}")
        
        # Delete the user
        cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
        
        conn.commit()
        conn.close()
        
        return cursor.rowcount > 0
        
    async def update_face_encoding(self, user_id: str, face_encoding_bytes: bytes) -> bool:
        """Update a user's face encoding"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute('UPDATE users SET face_encoding = ? WHERE id = ?', (face_encoding_bytes, user_id))
        
        conn.commit()
        conn.close()
        
        return cursor.rowcount > 0
        
    async def get_all_face_encodings(self) -> List[Dict[str, Any]]:
        """Get all face encodings from the database"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT id, name, face_id, image_path, image_url, face_encoding, multi_angle_encodings, face_analysis
        FROM users
        WHERE face_encoding IS NOT NULL
        ''')
        
        rows = cursor.fetchall()
        
        face_encodings = []
        for row in rows:
            face_encoding = dict(row)
            face_encodings.append(face_encoding)
            
        conn.close()
        return face_encodings
        
    async def migrate_json_to_db(self):
        """Migrate data from JSON file to SQLite database"""
        # Check if users.json exists
        if not os.path.exists('users.json'):
            print("No users.json file found, skipping migration")
            return
            
        try:
            # Load the JSON data
            with open('users.json', 'r') as f:
                users_data = json.load(f)
                
            if not users_data:
                print("No users found in users.json")
                return
                
            # Check if we already have users in the database
            conn = self._get_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT COUNT(*) FROM users')
            count = cursor.fetchone()[0]
            conn.close()
            
            if count > 0:
                print(f"Database already has {count} users, skipping migration")
                return
                
            # Migrate each user
            for user in users_data:
                # Skip users without face encodings
                if 'face_encoding' not in user or not user['face_encoding']:
                    continue
                    
                # Convert face encoding from list to bytes
                face_encoding = bytes(user['face_encoding'])
                
                # Add the user to the database
                await self.add_user(user, face_encoding)
                
            print(f"Migrated {len(users_data)} users from users.json to database")
            
            # Rename the original file as backup
            os.rename('users.json', 'users.json.bak')
            print("Renamed users.json to users.json.bak")
            
        except Exception as e:
            print(f"Error migrating JSON to database: {e}")

# Create a global instance
db_service = DatabaseService()

# Export the functions for backward compatibility
async def get_all_users():
    return await db_service.get_all_users()

async def get_user_by_id(user_id):
    return await db_service.get_user_by_id(user_id)

async def add_user(user_data, face_encoding_bytes, multi_angle_encodings_bytes=None):
    return await db_service.add_user(user_data, face_encoding_bytes, multi_angle_encodings_bytes)

async def update_user(user_id, user_data):
    return await db_service.update_user(user_id, user_data)

async def delete_user(user_id):
    return await db_service.delete_user(user_id)

async def update_face_encoding(user_id, face_encoding_bytes):
    return await db_service.update_face_encoding(user_id, face_encoding_bytes)

async def get_all_face_encodings():
    return await db_service.get_all_face_encodings()

async def migrate_json_to_db():
    return await db_service.migrate_json_to_db()
