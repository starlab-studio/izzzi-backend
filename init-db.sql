-- ============================================
-- IZZZI Database Initialization Script
-- ============================================
-- This script runs automatically on first database creation
-- It sets up the required extensions and schemas

-- Enable pgvector extension for AI embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable other useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search

-- Create AI schema for AI service tables
CREATE SCHEMA IF NOT EXISTS ai;

-- The main user gets full access to both schemas
GRANT ALL PRIVILEGES ON SCHEMA public TO izzzi;
GRANT ALL PRIVILEGES ON SCHEMA ai TO izzzi;

-- Set default search path to include both schemas
ALTER DATABASE izzzi_db SET search_path TO public, ai;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Database initialized successfully with pgvector and ai schema';
END $$;