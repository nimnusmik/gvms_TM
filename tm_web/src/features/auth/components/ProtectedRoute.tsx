import { Navigate } from 'react-router-dom';
import { storage } from '@/lib/storage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // 1. 저장소에서 토큰을 직접 꺼내봅니다.
  const token = storage.getToken();

  console.log("🛡️ 보안 요원 검사 중... 토큰 상태:", token ? "있음 (통과)" : "없음 (차단)");

  if (!token) {
    // 2. 토큰이 없으면 로그인 페이지로 쫓아냅니다.
    // replace를 써서 뒤로가기 못하게 막습니다.
    return <Navigate to="/login" replace />;
  }

  // 3. 토큰이 있으면 자식 컴포넌트(대시보드)를 보여줍니다.
  return <>{children}</>;
}