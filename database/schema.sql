-- Enable pgcrypto extension for gen_random_uuid() (though standard in PG 13+)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUMS
CREATE TYPE user_role AS ENUM ('STUDENT', 'TEACHER', 'ADMIN');
CREATE TYPE auth_provider AS ENUM ('LOCAL', 'GOOGLE');
CREATE TYPE exam_status AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');
CREATE TYPE attempt_status AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'TIMED_OUT');

-- USERS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255), -- Nullable for Google OAuth users
    role user_role NOT NULL DEFAULT 'STUDENT',
    provider auth_provider NOT NULL DEFAULT 'LOCAL',
    email_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_users_email UNIQUE (email)
);

-- TOKENS
CREATE TABLE verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_verification_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_verification_tokens_token UNIQUE (token)
);

CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_password_reset_tokens_token UNIQUE (token)
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN DEFAULT false,
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_refresh_tokens_token UNIQUE (token)
);

-- EXAM CONTENT
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    CONSTRAINT uq_subjects_name UNIQUE (name)
);

CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    subject_id INTEGER,
    duration INTEGER NOT NULL, -- in minutes
    total_marks INTEGER NOT NULL,
    created_by UUID,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status exam_status DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_exams_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    CONSTRAINT fk_exams_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL,
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option CHAR(1) NOT NULL,
    marks INTEGER DEFAULT 1,
    CONSTRAINT fk_questions_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    CONSTRAINT chk_questions_correct_option CHECK (correct_option IN ('A','B','C','D'))
);

-- ATTEMPTS
CREATE TABLE attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    exam_id UUID NOT NULL,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    submit_time TIMESTAMPTZ, -- Nullable until student submits or attempt times out
    score INTEGER,           -- Nullable until submission/grading
    status attempt_status DEFAULT 'IN_PROGRESS',
    CONSTRAINT fk_attempts_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_attempts_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    CONSTRAINT uq_attempts_student_exam UNIQUE (student_id, exam_id)
);

CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL,
    question_id UUID NOT NULL,
    selected_option CHAR(1), -- Nullable if left blank/skipped
    CONSTRAINT fk_answers_attempt FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
    CONSTRAINT fk_answers_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    CONSTRAINT chk_answers_selected_option CHECK (selected_option IN ('A','B','C','D'))
);

-- AUDIT
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    ip_address VARCHAR(50),
    device TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
