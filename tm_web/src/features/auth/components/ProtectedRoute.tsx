// src/features/components/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom'

const ProtectedRoute = () => {
  // 1. "신분증" 검사 로직
  // (나중에는 진짜 로그인 토큰이나 상태관리 스토어(Zustand 등)에서 가져올 겁니다)
  // 지금은 일단 "로컬 스토리지에 토큰이 있으면 로그인한 것"으로 칩시다.
  const isAuthenticated = !!localStorage.getItem("accessToken") // 토큰 있으면 true, 없으면 false

  // 2. 판결 내리기
  if (!isAuthenticated) {
    // ✋ 로그인 안 했으면 -> 로그인 페이지로 쫓아냄 (replace는 뒤로가기 방지)
    return <Navigate to="/login" replace />
  }

  // ✅ 로그인 했으면 -> 자식 페이지(Outlet)를 보여줌
  return <Outlet />
}

export default ProtectedRoute