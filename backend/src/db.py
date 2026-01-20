import psycopg2
from psycopg2.extras import RealDictCursor, Json
from config import DATABASE_URL

_conn = None

def get_connection():
    """Get or create a database connection."""
    global _conn
    if _conn is None or _conn.closed:
        _conn = psycopg2.connect(DATABASE_URL)
    return _conn

def init_db():
    """Initialize the database schema."""
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS games (
            uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP,
            round_number INTEGER DEFAULT 1,
            current_panorama_id INTEGER,
            guess_results JSONB DEFAULT '[]'::jsonb
        )
    """)

    conn.commit()
    cur.close()

def execute_query(query, params=None, fetch=False):
    """Execute a database query."""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(query, params or ())

    result = None
    if fetch:
        result = cur.fetchone() if 'RETURNING' in query or 'SELECT' in query else None

    conn.commit()
    cur.close()
    return result
