import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';

// Pages Import
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import GoogleSuccessPage from './pages/GoogleSuccessPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';

// Student Pages
import StudentDashboard from './pages/student/DashboardPage';
import StudentExams from './pages/student/ExamsPage';
import StudentExamInstructions from './pages/student/ExamInstructionsPage';
import StudentExamScreen from './pages/student/ExamScreenPage';
import StudentResults from './pages/student/ResultsPage';
import StudentResultDetail from './pages/student/ResultDetailPage';
import StudentProfile from './pages/student/ProfilePage';

// Teacher Pages
import TeacherDashboard from './pages/teacher/DashboardPage';
import TeacherCreateExam from './pages/teacher/CreateExamPage';
import TeacherManageQuestions from './pages/teacher/ManageQuestionsPage';
import TeacherStudentResults from './pages/teacher/StudentResultsPage';

// Admin Pages
import AdminDashboard from './pages/admin/DashboardPage';
import AdminUsers from './pages/admin/UsersPage';
import AdminLogs from './pages/admin/LogsPage';
import AdminSubjects from './pages/admin/SubjectsPage';

// Layout & Core Component
import Navbar from './components/layout/Navbar';
import Spinner from './components/common/Spinner';

// Route Guard Component
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <ErrorBoundary>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<ErrorBoundary><LoginPage /></ErrorBoundary>} />
          <Route path="/register" element={<ErrorBoundary><RegisterPage /></ErrorBoundary>} />
          <Route path="/verify-email" element={<ErrorBoundary><VerifyEmailPage /></ErrorBoundary>} />
          <Route path="/forgot-password" element={<ErrorBoundary><ForgotPasswordPage /></ErrorBoundary>} />
          <Route path="/reset-password" element={<ErrorBoundary><ResetPasswordPage /></ErrorBoundary>} />
          <Route path="/auth/google/success" element={<ErrorBoundary><GoogleSuccessPage /></ErrorBoundary>} />

          {/* Student Protected Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/exams"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentExams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/exam/:id"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentExamInstructions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/exam/:id/take"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentExamScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/results"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentResults />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/results/:id"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentResultDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentProfile />
              </ProtectedRoute>
            }
          />

          {/* Teacher Protected Routes */}
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/exams/create"
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <TeacherCreateExam />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/exams/:id"
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <TeacherManageQuestions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/results"
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <TeacherStudentResults />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/logs"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminLogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/subjects"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminSubjects />
              </ProtectedRoute>
            }
          />

          {/* Miscellaneous Routes */}
          <Route path="/unauthorized" element={<ErrorBoundary><UnauthorizedPage /></ErrorBoundary>} />
          <Route path="*" element={<ErrorBoundary><NotFoundPage /></ErrorBoundary>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
