import { createBrowserRouter, Navigate } from 'react-router-dom';
import LoginPage from '@/features/auth/pages/LoginPage';
import SignupPage from '@/features/auth/pages/SignupPage';
import DashboardLayout from '@/features/dashboard/components/DashboardLayout';
import DashboardOverviewPage from '@/features/dashboard/pages/DashboardOverviewPage';
import AgentManagementPage from '@/features/dashboard/pages/AgentManagementPage';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute'; // 👈 보안 요원 데려오기

export const router = createBrowserRouter([
  // 1. 누구나 접속 가능한 페이지
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  
  // 2. 루트('/')로 오면 -> 대시보드로 토스
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },

  // 3. 🔐 보호된 구역 (로그인 해야만 들어갈 수 있음)
  {
    path: '/dashboard',
    // 👇 중요: ProtectedRoute가 감싸고, 그 안에 DashboardLayout이 들어갑니다.
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true, // /dashboard 접속 시
        element: <DashboardOverviewPage />,
      },
      {
        path: 'agents', // /dashboard/agents 접속 시
        element: <AgentManagementPage />,
      },
    ],
  },

  // 4. 404 페이지
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);