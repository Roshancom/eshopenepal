-- Migration: Add Google OAuth columns to users table
-- Date: 2026-06-18
-- Description: Adds support for Google Sign-In authentication

-- Add Google-specific columns (safe to run multiple times with IF NOT EXISTS)
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR(500) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider ENUM('email', 'google') DEFAULT 'email';

-- Add unique constraint and index on google_id for faster lookups during Google OAuth login
CREATE UNIQUE INDEX idx_users_google_id ON users (google_id);
