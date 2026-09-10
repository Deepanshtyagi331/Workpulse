import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { ProtectedRoute, PublicRoute } from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import KanbanPage from './pages/KanbanPage';
import TaskDetailsPage from './pages/TaskDetailsPage';
import UsersPage from './pages/UsersPage';
import IntegrationsPage from './pages/IntegrationsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

export function App() {
  return (
    <BrowserRouter>
      {/* AuthProvider must be INSIDE BrowserRouter so it can use useNavigate */}
      <AuthProvider>
        <WebSocketProvider>
          <Routes>
          {/* Public auth routes — redirect to /dashboard if already logged in */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Protected application routes */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/tasks/:id" element={<TaskDetailsPage />} />
            <Route path="/kanban" element={<KanbanPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/integrations" element={<IntegrationsPage />} />
          </Route>

          {/* Catch-all: redirect to /dashboard (ProtectedRoute will handle auth) */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </WebSocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
