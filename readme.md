🔐 Secure Online Examination System
Implementation Plan
> **Stack:** React 18 · Vite · TailwindCSS · Node.js · Express · PostgreSQL · Prisma · JWT · Passport.js (Google OAuth) · Nodemailer · bcrypt
> **Architecture:** REST API · RBAC · ACID PostgreSQL · JWT (Access 15m + Refresh 7d) · HttpOnly Cookies · Audit Logging
> **Theme:** Single light mode — color palette locked
---
System Architecture
```
Browser
  └── React 18 + Vite (port 5173)
        └── Axios (withCredentials: true)
              └── Express.js (port 5000)
                    ├── Helmet (security headers)
                    ├── CORS (origin whitelist)
                    ├── Rate Limiter (per route)
                    ├── Zod Validator (request body)
                    ├── authenticate() middleware
                    ├── authorize(ROLE) middleware
                    └── Controllers
                          ├── AuthController
                          │     └── AuthService
                          │           ├── bcrypt (password hashing)
                          │           ├── JWT (access + refresh tokens)
                          │           ├── Nodemailer (email verification)
                          │           └── Passport (Google OAuth)
                          ├── StudentController
                          ├── TeacherController
                          ├── AdminController
                          └── ExamController
                                └── Prisma ORM
                                      └── PostgreSQL 15+
                                            ├── users
                                            ├── subjects
                                            ├── exams
                                            ├── questions
                                            ├── attempts
                                            ├── answers
                                            ├── refresh_tokens
                                            └── audit_logs
```
---
Color Tokens (Locked — Do Not Change)
```
--background:       #F8FAFC   (Slate White — page background)
--surface:          #FFFFFF   (Pure White — cards, panels, modals)
--primary:          #4F46E5   (Indigo — buttons, active states)
--primary-hover:    #4338CA   (Indigo Dark — hover)
--accent:           #8B5CF6   (Violet — badges, role tags, highlights)
--text:             #111827   (Gray 900 — body text)
--text-secondary:   #6B7280   (Gray 500 — muted text)
--border:           #E5E7EB   (Gray 200 — dividers, borders)
--danger:           #EF4444   (Red — errors, blocked users)
--success:          #10B981   (Emerald — success states, published)
--warning:          #F59E0B   (Amber — draft status, warnings)
```
---
Database Schema — All Tables
Users
Column	Type	Notes
id	UUID PK	gen_random_uuid()
full_name	VARCHAR(100)	NOT NULL
email	VARCHAR(255)	UNIQUE NOT NULL
password_hash	VARCHAR(255)	nullable (OAuth users)
role	ENUM	STUDENT, TEACHER, ADMIN
provider	ENUM	LOCAL, GOOGLE
email_verified	BOOLEAN	DEFAULT false
is_active	BOOLEAN	DEFAULT true
created_at	TIMESTAMPTZ	DEFAULT NOW()
Subjects
Column	Type	Notes
id	SERIAL PK	
name	VARCHAR(100)	UNIQUE NOT NULL
Exams
Column	Type	Notes
id	UUID PK	
title	VARCHAR(200)	NOT NULL
subject_id	INTEGER	FK → subjects
duration	INTEGER	minutes
total_marks	INTEGER	
created_by	UUID	FK → users
start_time	TIMESTAMPTZ	
end_time	TIMESTAMPTZ	
status	ENUM	DRAFT, PUBLISHED, CLOSED
created_at	TIMESTAMPTZ	DEFAULT NOW()
Questions
Column	Type	Notes
id	UUID PK	
exam_id	UUID	FK → exams
question	TEXT	NOT NULL
option_a	TEXT	NOT NULL
option_b	TEXT	NOT NULL
option_c	TEXT	NOT NULL
option_d	TEXT	NOT NULL
correct_option	CHAR(1)	A/B/C/D — NEVER sent to student
marks	INTEGER	DEFAULT 1
Attempts
Column	Type	Notes
id	UUID PK	
student_id	UUID	FK → users
exam_id	UUID	FK → exams
start_time	TIMESTAMPTZ	DEFAULT NOW()
submit_time	TIMESTAMPTZ	nullable
score	INTEGER	nullable until submitted
status	ENUM	IN_PROGRESS, SUBMITTED, TIMED_OUT
UNIQUE	(student_id, exam_id)	one attempt per student per exam
Answers
Column	Type	Notes
id	UUID PK	
attempt_id	UUID	FK → attempts
question_id	UUID	FK → questions
selected_option	CHAR(1)	A/B/C/D
Refresh Tokens
Column	Type	Notes
id	UUID PK	
user_id	UUID	FK → users ON DELETE CASCADE
token	VARCHAR(500)	UNIQUE NOT NULL
expires_at	TIMESTAMPTZ	
revoked	BOOLEAN	DEFAULT false
Audit Logs
Column	Type	Notes
id	UUID PK	
user_id	UUID	FK → users
action	VARCHAR(100)	e.g. LOGIN, EXAM_SUBMITTED
ip_address	VARCHAR(50)	
device	TEXT	user-agent string
timestamp	TIMESTAMPTZ	DEFAULT NOW()
---
API Endpoints
Auth
Method	Route	Auth	Description
POST	/api/auth/register	Public	Register with email
POST	/api/auth/login	Public	Login → access + refresh token
POST	/api/auth/logout	Authenticated	Revoke refresh token
POST	/api/auth/refresh	Public	Issue new access token
POST	/api/auth/verify-email	Public	Verify email token
POST	/api/auth/forgot-password	Public	Send reset link
POST	/api/auth/reset-password	Public	Reset password via token
GET	/api/auth/google	Public	Google OAuth redirect
GET	/api/auth/google/callback	Public	Google OAuth callback
Student
Method	Route	Auth	Description
GET	/api/student/profile	STUDENT	Get own profile
PUT	/api/student/profile	STUDENT	Update profile
GET	/api/student/exams	STUDENT	List available exams
POST	/api/student/exam/start	STUDENT	Start exam, get questions
POST	/api/student/exam/submit	STUDENT	Submit answers, get score
GET	/api/student/results	STUDENT	View all past results
Teacher
Method	Route	Auth	Description
POST	/api/teacher/exam	TEACHER	Create new exam
PUT	/api/teacher/exam/:id	TEACHER	Edit exam (ownership check)
DELETE	/api/teacher/exam/:id	TEACHER	Delete exam
POST	/api/teacher/question	TEACHER	Add question to exam
PUT	/api/teacher/question/:id	TEACHER	Edit question
DELETE	/api/teacher/question/:id	TEACHER	Delete question
PUT	/api/teacher/exam/:id/publish	TEACHER	Publish exam
GET	/api/teacher/exam/:id/results	TEACHER	View all student attempts
Admin
Method	Route	Auth	Description
GET	/api/admin/users	ADMIN	List all users
PUT	/api/admin/users/:id/block	ADMIN	Block/unblock user
PUT	/api/admin/users/:id/role	ADMIN	Change user role
DELETE	/api/admin/users/:id	ADMIN	Delete user
GET	/api/admin/logs	ADMIN	View audit logs
POST	/api/admin/subjects	ADMIN	Create subject
---
Folder Structure
```
secure-exam-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js            # Prisma client singleton
│   │   │   ├── jwt.js           # sign/verify helpers
│   │   │   ├── email.js         # Nodemailer transporter + template loader
│   │   │   └── passport.js      # Google OAuth strategy
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── student.controller.js
│   │   │   ├── teacher.controller.js
│   │   │   ├── admin.controller.js
│   │   │   └── exam.controller.js
│   │   ├── services/
│   │   │   ├── auth.service.js
│   │   │   ├── exam.service.js
│   │   │   └── audit.service.js
│   │   ├── middlewares/
│   │   │   ├── authenticate.js   # JWT verification
│   │   │   ├── authorize.js      # RBAC role check
│   │   │   ├── validate.js       # Zod schema wrapper
│   │   │   └── rateLimit.js      # per-route limiters
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── student.routes.js
│   │   │   ├── teacher.routes.js
│   │   │   └── admin.routes.js
│   │   ├── validators/
│   │   │   ├── auth.schema.js
│   │   │   ├── exam.schema.js
│   │   │   └── question.schema.js
│   │   ├── utils/
│   │   │   ├── AppError.js
│   │   │   ├── asyncHandler.js
│   │   │   └── logger.js
│   │   ├── app.js
│   │   └── server.js
│   ├── email/
│   │   └── templates/
│   │       ├── verification.html
│   │       ├── reset-password.html
│   │       └── exam-result.html
│   ├── seed/
│   │   └── seed.js
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── Badge.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── Spinner.jsx
│   │   │   │   ├── EmptyState.jsx
│   │   │   │   ├── ToastContainer.jsx
│   │   │   │   ├── ConfirmDialog.jsx
│   │   │   │   └── ErrorBoundary.jsx
│   │   │   ├── layout/
│   │   │   │   └── Navbar.jsx
│   │   │   ├── student/
│   │   │   │   ├── ExamCard.jsx
│   │   │   │   └── ResultCard.jsx
│   │   │   └── teacher/
│   │   │       └── QuestionForm.jsx
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   ├── RegisterPage.jsx
│   │   │   │   ├── VerifyEmailPage.jsx
│   │   │   │   ├── ForgotPasswordPage.jsx
│   │   │   │   └── ResetPasswordPage.jsx
│   │   │   ├── student/
│   │   │   │   ├── DashboardPage.jsx
│   │   │   │   ├── ExamsPage.jsx
│   │   │   │   ├── ExamInstructionsPage.jsx
│   │   │   │   ├── ExamScreenPage.jsx
│   │   │   │   ├── ResultsPage.jsx
│   │   │   │   └── ProfilePage.jsx
│   │   │   ├── teacher/
│   │   │   │   ├── DashboardPage.jsx
│   │   │   │   ├── CreateExamPage.jsx
│   │   │   │   ├── ManageQuestionsPage.jsx
│   │   │   │   └── StudentResultsPage.jsx
│   │   │   ├── admin/
│   │   │   │   ├── DashboardPage.jsx
│   │   │   │   ├── UsersPage.jsx
│   │   │   │   ├── LogsPage.jsx
│   │   │   │   └── SubjectsPage.jsx
│   │   │   └── NotFoundPage.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useExams.js
│   │   │   └── useToast.js
│   │   ├── services/
│   │   │   └── api.js            # Axios instance + interceptors
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── utils/
│   │   │   └── formatters.js
│   │   └── App.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── .env.example
│   └── package.json
│
└── database/
    ├── schema.sql
    ├── indexes.sql
    └── seed.sql
```
---
OWASP Top 10 Coverage
OWASP Risk	Implementation
Broken Access Control	RBAC middleware on every route; ownership checks in service layer
Cryptographic Failures	bcrypt 12 rounds; HTTPS in production; env-secured secrets
Injection	Prisma parameterized queries — no raw SQL
Insecure Design	Correct_option never sent to student; server-side evaluation only
Security Misconfiguration	Helmet headers; CORS origin whitelist; no stack traces in production
Vulnerable Components	Pinned dependency versions; regular `npm audit`
Authentication Failures	JWT 15m access + 7d refresh; tokens revoked on logout/password reset
Data Integrity Failures	Zod validation on all inputs; Prisma constraints
Logging Failures	Audit log on every sensitive action with IP + user-agent
SSRF	URL validation on any redirect/callback
---
Security Rules (Never Violate)
Rule	Why
correct_option never in API response to student	All evaluation is server-side; client never sees answers
Ownership check: exam.createdBy === req.user.id	Teacher can only edit their own exams
Refresh tokens revoked on password reset	Old sessions invalidated on credential change
Email failure must NOT crash register	Email is best-effort; user must still get their account
Duplicate attempt blocked: UNIQUE (student_id, exam_id)	Prevents re-taking; resume supported instead
Access token 15m, refresh token 7d	Short-lived access limits replay attack window
Prisma P2002 → 409, P2025 → 404	Consistent error codes; no Prisma internals leaked
---
Development Phases
Phase	What gets built	Security deliverable
1	Scaffold, package.json, env, Tailwind, Prisma, PostgreSQL	Secrets in .env only
2	Raw SQL schema + indexes	All FK constraints + UUID PKs
3	Prisma schema + backend config (db, jwt, email, passport)	JWT helpers centralized
4	Auth system — register, verify email, login, refresh, logout	bcrypt + HttpOnly cookie tokens
5	Google OAuth + forgot/reset password	Token expiry + refresh revocation
6	RBAC middleware + route guards	authenticate() + authorize(ROLE) enforced
7	Student module — profile, exam list, start, submit, results	correct_option stripped; server eval
8	Teacher module — create exam, questions, publish, view results	Ownership validation
9	Admin module — user management, role change, block, logs	Audit trail complete
10	Security hardening — Helmet, rate limiters, Zod, audit log	OWASP Top 10 covered
11	Frontend — auth pages + ProtectedRoute + AuthContext	Token refresh interceptor
12	Frontend — student pages (dashboard, exam screen, results)	Timer enforced; no answer leakage
13	Frontend — teacher pages (create exam, manage questions)	Role-gated routes
14	Frontend — admin pages (users, logs)	Admin-only views
15	Seed data + README + verification checklist	End-to-end verification
---
Local Setup (No Docker)
Prerequisites
Node.js 20+
PostgreSQL 15+
PostgreSQL Setup
macOS:
```bash
brew install postgresql@15
brew services start postgresql@15
```
Ubuntu:
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```
Create database and user:
```sql
psql -U postgres
CREATE USER examuser WITH PASSWORD 'yourpassword';
CREATE DATABASE secure_exam OWNER examuser;
GRANT ALL PRIVILEGES ON DATABASE secure_exam TO examuser;
\q
```
Step-by-Step Setup
```bash
# 1. Backend setup
cd backend
cp .env.example .env
# Fill in DATABASE_URL, JWT secrets, SMTP credentials

npm install
npx prisma generate
npx prisma db push

# Apply raw SQL indexes
psql -U examuser -d secure_exam -f ../database/indexes.sql

# Seed the database
node seed/seed.js

# 2. Frontend setup
cd ../frontend
cp .env.example .env
npm install

# 3. Start both servers (two terminals)
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
cd frontend && npm run dev
```
Default Accounts (after seeding)
Email	Password	Role	Description
student@exam.dev	Student123!	STUDENT	Regular student account
teacher@exam.dev	Teacher123!	TEACHER	Can create and publish exams
admin@exam.dev	Admin123!	ADMIN	Full platform access
---
Verification Checklist
Backend
[ ] `cd backend && npm run dev` — starts on port 5000, no errors
[ ] `GET http://localhost:5000/api/health` → `{ status: 'ok' }`
[ ] `POST /api/auth/register` → 201 + verification email in Mailtrap
[ ] `POST /api/auth/login` → `{ user, accessToken, refreshToken }`
[ ] `GET /api/student/exams` (with Bearer) → paginated exam list
[ ] `POST /api/student/exam/start` → returns questions WITHOUT correct_option
[ ] `POST /api/student/exam/submit` → returns score
[ ] `POST /api/teacher/exam` (TEACHER token) → creates exam
[ ] `GET /api/admin/logs` (ADMIN token) → audit log entries
[ ] `GET /api/admin/users` with STUDENT token → 403 Forbidden
Frontend
[ ] `cd frontend && npm run dev` — opens on port 5173
[ ] Register → verify email → login works end-to-end
[ ] STUDENT login redirects to student dashboard
[ ] TEACHER login redirects to teacher dashboard
[ ] ADMIN login redirects to admin dashboard
[ ] Student can view available exams and start one
[ ] Exam screen shows questions without correct answers visible
[ ] Timer counts down; auto-submits on expiry
[ ] Result page shows score after submission
[ ] Teacher can create exam, add questions, publish
[ ] Admin can view all users and audit logs
[ ] Accessing /admin as STUDENT redirects to /unauthorized
[ ] Toast appears on all success/error actions
[ ] Refresh token interceptor silently renews sessions
Security
[ ] `correct_option` absent from all student API responses
[ ] Attempting to submit to a different student's attempt_id → 403
[ ] Teacher editing another teacher's exam → 403
[ ] Brute force login (11+ attempts) → 429 Too Many Requests
[ ] Audit logs created for: LOGIN, LOGOUT, EXAM_STARTED, EXAM_SUBMITTED, PASSWORD_CHANGED, ROLE_CHANGED
---
Quick Reference: Key System Rules
Rule	Why
correct_option stripped server-side	Evaluation happens in service layer; API never exposes answers
UNIQUE (student_id, exam_id) in attempts	Prevents duplicate attempts; supports resume via status check
Access token 15m, refresh token 7d in DB	Short-lived access + revocable refresh
Refresh tokens revoked on password reset	Invalidates all old sessions on credential change
Email failure must not crash register	Email is best-effort; account creation succeeds regardless
Prisma P2002 → 409, P2025 → 404	Consistent error mapping; no ORM internals exposed
Rate limit login: 10 req / 15min	Brute force protection on credential endpoints
Audit log on every sensitive action	Full observability; required for admin security reports
