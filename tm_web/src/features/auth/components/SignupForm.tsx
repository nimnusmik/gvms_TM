// src/features/auth/components/SignupForm.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '../api/authApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SignupForm() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. 유효성 검사
    if (formData.password !== formData.confirmPassword) {
      toast.error("비밀번호 불일치", { description: "비밀번호가 서로 다릅니다." });
      return;
    }

    setIsLoading(true);

    try {
      // 2. API 호출 (비밀번호 확인용 필드는 제외하고 전송)
      await authApi.signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      // 3. 성공 처리
      toast.success("회원가입 성공!", { description: "로그인 페이지로 이동합니다." });
      navigate('/login');
      
    } catch (error: any) {
      const msg = error.response?.data?.detail || "회원가입에 실패했습니다.";
      toast.error("가입 실패", { description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <div className="space-y-2">
        <Input
          name="name"
          placeholder="이름"
          required
          disabled={isLoading}
          value={formData.name}
          onChange={handleChange}
        />
        <Input
          name="email"
          type="email"
          placeholder="이메일"
          required
          disabled={isLoading}
          value={formData.email}
          onChange={handleChange}
        />
        <Input
          name="password"
          type="password"
          placeholder="비밀번호"
          required
          disabled={isLoading}
          value={formData.password}
          onChange={handleChange}
        />
        <Input
          name="confirmPassword"
          type="password"
          placeholder="비밀번호 확인"
          required
          disabled={isLoading}
          value={formData.confirmPassword}
          onChange={handleChange}
        />
      </div>

      <Button className="w-full" type="submit" disabled={isLoading}>
        {isLoading ? "가입 처리 중..." : "회원가입"}
      </Button>
    </form>
  );
}