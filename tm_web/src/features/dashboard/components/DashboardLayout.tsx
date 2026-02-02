import { Outlet, Link, useLocation } from 'react-router-dom';
// 👇 1. Megaphone 아이콘 추가
import { LayoutDashboard, Users, LogOut, Database, Megaphone } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage'; 
import { cn } from "@/lib/utils"; 

export default function DashboardLayout() {
  const location = useLocation();

  const handleLogout = () => {
    storage.clearTokens();
    window.location.href = '/login';
  };

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
      <aside className="w-64 bg-white border-r shadow-sm flex flex-col justify-between">
        {/* 상단: 메인 메뉴 */}
        <div>
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold text-primary">TM Admin</h1>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors",
                  location.pathname === item.path 
                    ? "bg-primary/10 text-primary" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900" 
                )}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* 👇 2. 하단: 공지사항 & 로그아웃 */}
        <div className="p-4 border-t space-y-2"> {/* space-y-2로 간격 줌 */}
          
          {/* ✨ [추가] 공지사항 게시판 버튼 */}
          <Link
            to="/dashboard/notices" 
            className={cn(
              "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
              location.pathname === '/dashboard/notices'
                ? "bg-primary/10 text-primary"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <Megaphone className="w-4 h-4 mr-2" />
            공지사항 게시판
          </Link>

          {/* 구분선 */}
          <hr className="border-gray-100 my-2" />

          {/* 로그아웃 버튼 */}
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

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}