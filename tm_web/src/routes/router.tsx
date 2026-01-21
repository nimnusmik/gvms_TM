import { createBrowserRouter } from 'react-router-dom';
import LoginPage from '@/features/auth/pages/LoginPage';
//import SignupPage from '@/features/auth/pages/SignupPage';
// import DashboardPage from '@/features/dashboard/pages/DashboardPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />, // 기본은 로그인으로
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    //element: <SignupPage />,
  },
  // {
  //   path: '/dashboard',
  //   element: <DashboardPage />,
  // },
]);