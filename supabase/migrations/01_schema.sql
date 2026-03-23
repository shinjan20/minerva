-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TYPE user_role AS ENUM ('STUDENT', 'CR', 'OFFICE_STAFF');
CREATE TYPE user_status AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'REVOKED', 'EXPIRED');

CREATE TABLE users (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                  VARCHAR NOT NULL,
  email                 VARCHAR UNIQUE NOT NULL,
  password_hash         VARCHAR NOT NULL,
  role                  user_role NOT NULL,
  status                user_status DEFAULT 'PENDING',
  section               VARCHAR,
  batch                 VARCHAR,
  year                  VARCHAR,
  first_login           BOOLEAN DEFAULT true,
  is_active             BOOLEAN DEFAULT true,
  verified_at           TIMESTAMP,
  verified_by           VARCHAR,
  verifying_office_id   UUID REFERENCES users(id),
  created_by            UUID REFERENCES users(id),
  created_at            TIMESTAMP DEFAULT NOW()
);

-- Student Roster
CREATE TABLE student_roster (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id            VARCHAR UNIQUE NOT NULL,
  name                  VARCHAR NOT NULL,
  email                 VARCHAR NOT NULL,
  section               VARCHAR NOT NULL,
  batch                 VARCHAR NOT NULL,
  year                  VARCHAR NOT NULL,
  loaded_by             UUID REFERENCES users(id),
  loaded_at             TIMESTAMP DEFAULT NOW(),
  user_id               UUID REFERENCES users(id)
);

-- Courses
CREATE TABLE courses (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                  VARCHAR NOT NULL,
  section               VARCHAR NOT NULL,
  batch                 VARCHAR NOT NULL,
  year                  VARCHAR NOT NULL,
  is_active             BOOLEAN DEFAULT true,
  created_by            UUID REFERENCES users(id),
  created_at            TIMESTAMP DEFAULT NOW()
);

-- Score Breakup
CREATE TYPE quiz_aggregation_type AS ENUM ('BEST_N', 'AVERAGE', 'SUM');

CREATE TABLE score_breakup (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id             UUID REFERENCES courses(id) ON DELETE CASCADE,
  quiz_attempts         INT DEFAULT 1,
  quiz_aggregation      quiz_aggregation_type,
  quiz_best_n           INT,
  quiz_pct              DECIMAL NOT NULL,
  midterm_pct           DECIMAL NOT NULL,
  project_pct           DECIMAL NOT NULL,
  endterm_pct           DECIMAL NOT NULL,
  grade_cutoffs         JSONB,
  is_locked             BOOLEAN DEFAULT false,
  created_at            TIMESTAMP DEFAULT NOW(),
  CONSTRAINT pct_sum_check CHECK (quiz_pct + midterm_pct + project_pct + endterm_pct = 100)
);

-- Marks
CREATE TYPE marks_status AS ENUM ('SCORED', 'ABSENT', 'EXEMPTION');

CREATE TABLE marks (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id             UUID REFERENCES courses(id) ON DELETE CASCADE,
  student_id            UUID REFERENCES users(id) ON DELETE CASCADE,
  component             VARCHAR NOT NULL,
  attempt_number        INT DEFAULT 1,
  raw_score             DECIMAL,
  max_score             DECIMAL,
  status                marks_status DEFAULT 'SCORED',
  uploaded_by           UUID REFERENCES users(id),
  uploaded_at           TIMESTAMP DEFAULT NOW()
);

-- Marks Snapshot
CREATE TABLE marks_snapshot (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id             UUID REFERENCES courses(id) ON DELETE CASCADE,
  student_id            UUID REFERENCES users(id) ON DELETE CASCADE,
  total_weighted        DECIMAL,
  grade                 VARCHAR,
  rank                  INT,
  snapshot_at           TIMESTAMP DEFAULT NOW()
);

-- Marks Visibility
CREATE TABLE marks_visibility (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id             UUID REFERENCES courses(id) ON DELETE CASCADE,
  component             VARCHAR NOT NULL,
  is_visible            BOOLEAN DEFAULT false,
  toggled_by            UUID REFERENCES users(id),
  toggled_at            TIMESTAMP DEFAULT NOW(),
  UNIQUE(course_id, component)
);

-- CR Registration OTP
CREATE TABLE cr_otp_registration (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cr_email              VARCHAR NOT NULL,
  section               VARCHAR NOT NULL,
  batch                 VARCHAR NOT NULL,
  otp_hash              VARCHAR NOT NULL,
  expires_at            TIMESTAMP NOT NULL,
  attempts              INT DEFAULT 0,
  used                  BOOLEAN DEFAULT false,
  created_at            TIMESTAMP DEFAULT NOW()
);

-- Re-upload OTP
CREATE TABLE otp_requests (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id             UUID REFERENCES courses(id) ON DELETE CASCADE,
  component             VARCHAR NOT NULL,
  cr_id                 UUID REFERENCES users(id) ON DELETE CASCADE,
  otp_hash              VARCHAR NOT NULL,
  expires_at            TIMESTAMP NOT NULL,
  used                  BOOLEAN DEFAULT false,
  created_at            TIMESTAMP DEFAULT NOW()
);

-- Audit Log
CREATE TYPE audit_upload_type AS ENUM ('FRESH', 'REUPLOAD');

CREATE TABLE audit_log (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_type           VARCHAR NOT NULL,
  performed_by          UUID REFERENCES users(id),
  course_id             UUID REFERENCES courses(id),
  component             VARCHAR,
  rows_processed        INT,
  upload_type           audit_upload_type,
  file_hash             VARCHAR,
  otp_verified          BOOLEAN,
  outcome               VARCHAR NOT NULL,
  rejection_reason      TEXT,
  created_at            TIMESTAMP DEFAULT NOW()
);

-- Announcements
CREATE TABLE announcements (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                 VARCHAR NOT NULL,
  body                  TEXT NOT NULL,
  posted_by             UUID REFERENCES users(id),
  posted_at             TIMESTAMP DEFAULT NOW(),
  expires_at            TIMESTAMP,
  is_active             BOOLEAN DEFAULT true
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_student_roster_student_id ON student_roster(student_id);
CREATE INDEX idx_marks_student_course ON marks(student_id, course_id);
CREATE INDEX idx_marks_snapshot_student_course ON marks_snapshot(student_id, course_id);
CREATE INDEX idx_audit_log_course_id ON audit_log(course_id);
