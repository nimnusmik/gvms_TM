// src/features/dashboard/components/DashboardLayout.tsx
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Database, Megaphone, BarChart2, Bot } from 'lucide-react'; 
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
    { 
      name: '성과 분석', 
      path: '/dashboard/performance', 
      icon: <BarChart2 className="w-4 h-4 mr-2" /> 
    },
    { 
      name: 'AI 서비스', 
      path: '/dashboard/ai-service', 
      icon: <Bot className="w-4 h-4 mr-2" /> 
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
              <div key={item.path}> {/* Link를 감싸는 div 추가 (선택사항, 스타일 유지용) */}
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors",
                    // 현재 경로와 정확히 일치하거나, 하위 경로일 때 활성화
                    location.pathname === item.path 
                      ? "bg-blue-50 text-blue-600" // primary 색상 대신 직관적인 tailwind class 예시
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900" 
                  )}
                >
                  {item.icon}
                  {item.name}
                </Link>
              </div>
            ))}
          </nav>
        </div>

        {/* 하단: 공지사항 & 로그아웃 */}
        <div className="p-4 border-t space-y-2"> 
          <Link
            to="/dashboard/notices" 
            className={cn(
              "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
              location.pathname === '/dashboard/notices'
                ? "bg-blue-50 text-blue-600"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <Megaphone className="w-4 h-4 mr-2" />
            공지사항 게시판
          </Link>

          <hr className="border-gray-100 my-2" />

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

      <main className="flex-1 overflow-auto bg-gray-50">
        {/* p-8 제거하거나 유지 (PerformancePage 내부에 p-6가 이미 있어서 조정 가능) */}
        <Outlet />
      </main>
    </div>
  );
}
