import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Badge from '../common/Badge';
import Button from '../common/Button';

export default function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getLinks = () => {
    switch (user.role) {
      case 'STUDENT':
        return [
          { to: '/student/dashboard', label: 'Dashboard' },
          { to: '/student/exams', label: 'Exams' },
          { to: '/student/results', label: 'Results' },
          { to: '/student/profile', label: 'Profile' }
        ];
      case 'TEACHER':
        return [
          { to: '/teacher/dashboard', label: 'Dashboard' },
          { to: '/teacher/exams', label: 'My Exams' },
          { to: '/teacher/results', label: 'Results' }
        ];
      case 'ADMIN':
        return [
          { to: '/admin/dashboard', label: 'Dashboard' },
          { to: '/admin/users', label: 'Users' },
          { to: '/admin/logs', label: 'Logs' },
          { to: '/admin/subjects', label: 'Subjects' }
        ];
      default:
        return [];
    }
  };

  const navLinks = getLinks();

  const getRoleBadgeVariant = (role) => {
    if (role === 'ADMIN') return 'danger';
    if (role === 'TEACHER') return 'accent';
    return 'success';
  };

  return (
    <nav className="bg-surface border-b border-border shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link 
              to={`/${user.role.toLowerCase()}/dashboard`} 
              className="text-xl font-bold text-primary flex items-center gap-1.5">
                <span></span>
                <span>SecureExam</span>
              </Link>
            </div>

            {/* Navigation links */}
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4 items-center">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-text-secondary hover:text-text hover:bg-background'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Right section: user details + logout */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end text-right leading-none">
              <span className="text-sm font-bold text-text mb-0.5">{user.fullName || user.email}</span>
              <span className="text-xs text-text-secondary">{user.email}</span>
            </div>
            
            <Badge variant={getRoleBadgeVariant(user.role)}>
              {user.role}
            </Badge>

            <Button onClick={logout} variant="secondary" className="!py-1.5 !px-3">
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
