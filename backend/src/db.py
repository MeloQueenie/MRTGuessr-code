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
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            uuid UUID UNIQUE DEFAULT gen_random_uuid(),
            oauth_id VARCHAR(255) UNIQUE NOT NULL,
            username VARCHAR(255) NOT NULL,
            display_name VARCHAR(255),
            description TEXT,
            profile_picture TEXT,
            session_token VARCHAR(255) UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

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

    # Update game table with a new columns - user id, which is a foreign key to users table
    cur.execute("""
        ALTER TABLE games
        ADD COLUMN IF NOT EXISTS user_id INTEGER;
    """)
    cur.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM information_schema.table_constraints
                WHERE constraint_name = 'fk_user'
                  AND table_name = 'games'
            ) THEN
                ALTER TABLE games
                ADD CONSTRAINT fk_user
                FOREIGN KEY (user_id) REFERENCES users(id)
                ON DELETE SET NULL;
            END IF;
        END $$;
    """)

    # Add game_type column
    cur.execute("""
        ALTER TABLE games
        ADD COLUMN IF NOT EXISTS game_type VARCHAR(50);
    """)

    # Add custom_options JSONB column to store filter settings
    cur.execute("""
        ALTER TABLE games
        ADD COLUMN IF NOT EXISTS custom_options JSONB DEFAULT NULL;
    """)

    # Add is_custom boolean flag for fast leaderboard filtering
    cur.execute("""
        ALTER TABLE games
        ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT FALSE;
    """)

    # Performance indexes
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_games_user_id
        ON games(user_id);
    """)

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_games_created_at
        ON games(created_at);
    """)

    # Index for custom games filtering
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_games_is_custom
        ON games(is_custom);
    """)

    # Composite index for leaderboard queries
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_games_completed_custom
        ON games(completed_at, is_custom)
        WHERE completed_at IS NOT NULL;
    """)

    conn.commit()
    cur.close()

def get_db_version() -> str:
    """Get the PostgreSQL database version."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT version();")
    version = cur.fetchone()
    cur.close()
    return version[0]

def execute_query(query, params=None, fetchone=False, fetchall=False):
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(query, params or ())

    result = None
    if fetchone:
        result = cur.fetchone()
    elif fetchall:
        result = cur.fetchall()

    conn.commit()
    cur.close()
    return result

