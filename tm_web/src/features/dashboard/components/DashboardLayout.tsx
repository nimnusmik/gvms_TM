import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Database } from 'lucide-react'; // 아이콘
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage'; // 토큰 삭제용
import { cn } from "@/lib/utils"; // 스타일 유틸리티

export default function DashboardLayout() {
  const location = useLocation();

  const handleLogout = () => {
    storage.clearTokens();
    window.location.href = '/login';
  };

  // ✅ [수정 1] 메뉴 아이템을 여기서 한 번만 정의합니다.
  // 순서를 바꾸고 싶으면 이 배열의 순서만 바꾸면 됩니다.
  const menuItems = [
    { 
      name: '대시보드 홈', 
      path: '/dashboard', 
      icon: <LayoutDashboard className="w-4 h-4 mr-2" /> 
    },
    { 
      name: '상담원 관리', 
      path: '/dashboard/agents', 
      icon: <Users className="w-4 h-4 mr-2" /> 
    },
    { 
      name: '고객 DB 관리', 
      path: '/dashboard/customers',
      icon: <Database className="w-4 h-4 mr-2" /> 
    },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 🟢 1. 왼쪽 사이드바 */}
      <aside className="w-64 bg-white border-r shadow-sm flex flex-col justify-between">
        {/* 상단: 로고 및 메인 네비게이션 */}
        <div>
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold text-primary">TM Admin</h1>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                // ✅ [수정 2] 스타일 로직 통일 (cn 유틸리티 활용 추천)
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors",
                  location.pathname === item.path 
                    ? "bg-primary/10 text-primary" // 활성화 상태
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900" // 비활성화 상태
                )}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* 하단: 로그아웃 버튼 */}
        <div className="p-4 border-t">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" 
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            로그아웃
          </Button>
        </div>
      </aside>

      {/* 🟠 2. 메인 콘텐츠 영역 */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}