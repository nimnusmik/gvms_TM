// src/features/dashboard/components/DashboardLayout.tsx
import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Database, Megaphone, BarChart2, Bot, ChevronLeft, ChevronRight } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage'; 
import { cn } from "@/lib/utils"; 

export default function DashboardLayout() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = () => {
    storage.clearTokens();
    window.location.href = '/login';
  };

  const menuItems = [
    { 
      name: '대시보드 홈', 
      path: '/dashboard', 
      icon: LayoutDashboard, 
    },
    { 
      name: '상담원 관리', 
      path: '/dashboard/agents', 
      icon: Users, 
    },
    { 
      name: '고객 DB 관리', 
      path: '/dashboard/customers',
      icon: Database, 
    },
    { 
      name: '성과 분석', 
      path: '/dashboard/performance', 
      icon: BarChart2, 
    },
    { 
      name: 'AI 서비스', 
      path: '/dashboard/ai-service', 
      icon: Bot, 
    },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <aside
        className={cn(
          "bg-white border-r shadow-sm flex flex-col justify-between transition-all duration-200",
          isSidebarOpen ? "w-64" : "w-16"
        )}
      >
        {/* 상단: 메인 메뉴 */}
        <div>
          <div className="p-4 border-b flex items-center justify-between gap-2">
            <h1 className={cn("text-xl font-bold text-primary truncate", !isSidebarOpen && "hidden")}>
              TM Admin
            </h1>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 hover:text-slate-700"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              aria-label={isSidebarOpen ? "사이드바 접기" : "사이드바 펼치기"}
            >
              {isSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
          
          <nav className={cn("flex-1 space-y-2", isSidebarOpen ? "p-4" : "p-2")}>
            {menuItems.map((item) => (
              <div key={item.path}> {/* Link를 감싸는 div 추가 (선택사항, 스타일 유지용) */}
                <Link
                  to={item.path}
                  title={item.name}
                  className={cn(
                    "flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors",
                    isSidebarOpen ? "justify-start" : "justify-center",
                    // 현재 경로와 정확히 일치하거나, 하위 경로일 때 활성화
                    location.pathname === item.path 
                      ? "bg-blue-50 text-blue-600" // primary 색상 대신 직관적인 tailwind class 예시
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900" 
                  )}
                >
                  <item.icon className={cn("w-4 h-4", isSidebarOpen ? "mr-2" : "mr-0")} />
                  <span className={cn("truncate", !isSidebarOpen && "hidden")}>
                    {item.name}
                  </span>
                </Link>
              </div>
            ))}
          </nav>
        </div>

        {/* 하단: 공지사항 & 로그아웃 */}
        <div className={cn("border-t space-y-2", isSidebarOpen ? "p-4" : "p-2")}> 
          <Link
            to="/dashboard/notices" 
            title="공지사항 게시판"
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isSidebarOpen ? "justify-start" : "justify-center",
              location.pathname === '/dashboard/notices'
                ? "bg-blue-50 text-blue-600"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <Megaphone className={cn("w-4 h-4", isSidebarOpen ? "mr-2" : "mr-0")} />
            <span className={cn("truncate", !isSidebarOpen && "hidden")}>
              공지사항 게시판
            </span>
          </Link>

          {isSidebarOpen && <hr className="border-gray-100 my-2" />}

          <Button 
            variant="ghost" 
            className={cn(
              "w-full text-red-500 hover:text-red-600 hover:bg-red-50",
              isSidebarOpen ? "justify-start" : "justify-center px-2"
            )} 
            onClick={handleLogout}
            title="로그아웃"
          >
            <LogOut className={cn("w-4 h-4", isSidebarOpen ? "mr-2" : "mr-0")} />
            <span className={cn("truncate", !isSidebarOpen && "hidden")}>
              로그아웃
            </span>
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
