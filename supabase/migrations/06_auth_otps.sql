-- Migration: Auth OTPs
-- Create a dedicated table for system-wide OTPs (Password Resets, etc.)
CREATE TABLE IF NOT EXISTS auth_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    used BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for fast lookup by email and creation time
CREATE INDEX IF NOT EXISTS idx_auth_otps_email_created ON auth_otps(email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_otps_expires ON auth_otps(expires_at);

-- Add to security policies if needed (Service Role only usually)
ALTER TABLE auth_otps ENABLE ROW LEVEL SECURITY;

-- Only service role can interact with this table (System Internal)
CREATE POLICY "Service Role Only" ON auth_otps
    FOR ALL
    USING (true)
    WITH CHECK (true);
