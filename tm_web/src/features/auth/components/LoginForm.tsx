// src/features/auth/components/LoginForm.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { authApi } from '../api/authApi';
import { useAuthStore } from '../hooks/useAuthStore';

// UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login); // 스토어의 login 함수 가져오기
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      toast.error("입력 오류", { description: "이메일과 비밀번호를 입력해주세요." });
      return;
    }

    setIsLoading(true);
    try {
      const data = await authApi.login(formData);
      
      // 관리자 체크
      if (!data.is_staff) {
        toast.error("접근 거부", { description: "관리자만 접근 가능합니다." });
        return;
      }

      // ✨ [핵심] 스토어 함수 한 방으로 해결!
      // (토큰 저장 + 상태 업데이트 동시에 처리됨)
      login(data.access, data.refresh, { 
        email: formData.email, 
        is_staff: data.is_staff,
      });
      
      toast.success("환영합니다!");
      navigate('/dashboard');

    } catch (error: any) {
      const msg = error.response?.data?.detail || '로그인 정보를 확인해주세요.';
      toast.error("로그인 실패", { description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@example.com"
            disabled={isLoading}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">비밀번호</Label>
            <span className="text-xs text-muted-foreground cursor-pointer hover:text-primary">
              비밀번호 찾기
            </span>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            disabled={isLoading}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>
        <Button disabled={isLoading} onClick={handleLogin}>
          {isLoading ? "로그인 중..." : "로그인"}
        </Button>
      </div>
    </div>
  );
}