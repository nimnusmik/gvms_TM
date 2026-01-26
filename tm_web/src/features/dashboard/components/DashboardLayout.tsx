import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut } from 'lucide-react'; // 아이콘
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage'; // 토큰 삭제용

export default function DashboardLayout() {
  const location = useLocation();

  const handleLogout = () => {
    storage.clearTokens();
    window.location.href = '/login';
  };

  // 메뉴 아이템 정의
  const menuItems = [
    { name: '대시보드 홈', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4 mr-2" /> },
    { name: '상담원 관리', path: '/dashboard/agents', icon: <Users className="w-4 h-4 mr-2" /> },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 🟢 1. 왼쪽 사이드바 */}
      <aside className="w-64 bg-white border-r shadow-sm flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-primary">TM Admin</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors
                ${location.pathname === item.path 
                  ? 'bg-primary/10 text-primary'  // 선택된 메뉴 색상
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
              }
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            로그아웃
          </Button>
        </div>
      </aside>

      {/* 🟠 2. 메인 콘텐츠 영역 */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Outlet: 이 자리에 페이지 내용이 갈아끼워집니다! */}
          <Outlet />
        </div>
      </main>
    </div>
  );
}