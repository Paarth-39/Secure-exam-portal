-- Database Indexes for Secure Exam System

-- Users Table Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_status ON users(role, is_active);

-- Exams Table Indexes
CREATE INDEX idx_exams_status_dates ON exams(status, start_time, end_time);
CREATE INDEX idx_exams_creator ON exams(created_by);

-- Questions Table Indexes
CREATE INDEX idx_questions_exam ON questions(exam_id);

-- Attempts Table Indexes
CREATE INDEX idx_attempts_student_exam ON attempts(student_id, exam_id);
CREATE INDEX idx_attempts_exam_status ON attempts(exam_id, status);

-- Answers Table Indexes
CREATE INDEX idx_answers_attempt ON answers(attempt_id);

-- Audit Logs Table Indexes
CREATE INDEX idx_audit_logs_user_time ON audit_logs(user_id, timestamp);

-- Refresh Tokens Table Indexes
CREATE INDEX idx_refresh_tokens_user_revoked ON refresh_tokens(user_id, revoked);

-- Verification Tokens Table Indexes
CREATE INDEX idx_verification_tokens_token ON verification_tokens(token);

-- Password Reset Tokens Table Indexes
CREATE INDEX idx_password_reset_tokens_token_used ON password_reset_tokens(token, used);
