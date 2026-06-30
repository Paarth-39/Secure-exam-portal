import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach token if it exists in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle token refresh on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite refresh loop or handle non-auth issues
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url === '/auth/refresh' || originalRequest.url === '/auth/login') {
        localStorage.removeItem('accessToken');
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const { accessToken } = response.data;

        localStorage.setItem('accessToken', accessToken);
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        try {
          await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
        } catch (logoutError) {
          // Ignore logout failures during refresh failure handling
        }
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Named API wrappers
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  refreshToken: () => api.post('/auth/refresh')
};

export const studentAPI = {
  getProfile: () => api.get('/student/profile'),
  updateProfile: (data) => api.put('/student/profile', data),
  getExams: (params) => api.get('/student/exams', { params }),
  startExam: (data) => api.post('/student/exam/start', data),
  submitExam: (data) => api.post('/student/exam/submit', data),
  getResults: () => api.get('/student/results'),
  getResultDetail: (attemptId) => api.get(`/student/results/${attemptId}`)
};

export const teacherAPI = {
  createExam: (data) => api.post('/teacher/exams', data),
  updateExam: (id, data) => api.put(`/teacher/exams/${id}`, data),
  deleteExam: (id) => api.delete(`/teacher/exams/${id}`),
  publishExam: (id) => api.put(`/teacher/exams/${id}/publish`),
  addQuestion: (data) => api.post('/teacher/questions', data),
  updateQuestion: (id, data) => api.put(`/teacher/questions/${id}`, data),
  deleteQuestion: (id) => api.delete(`/teacher/questions/${id}`),
  getMyExams: (params) => api.get('/teacher/exams', { params }),
  getExamResults: (id, params) => api.get(`/teacher/exams/${id}/results`, { params }),
  getExamById: (id) => api.get(`/teacher/exams/${id}`),
  getSubjects: () => api.get('/teacher/subjects')
};

export const adminAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  blockUser: (data) => api.put('/admin/users/block', data),
  changeRole: (data) => api.put('/admin/users/role', data),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  getLogs: (params) => api.get('/admin/logs', { params }),
  getSubjects: () => api.get('/admin/subjects'),
  createSubject: (data) => api.post('/admin/subjects', data)
};

export default api;
