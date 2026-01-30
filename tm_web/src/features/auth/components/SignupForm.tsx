// src/features/auth/components/SignupForm.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '../api/authApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// 📞 전화번호 포맷팅 함수 (010-1234-5678)
const formatPhoneNumber = (value: string) => {
  const numbers = value.replace(/[^0-9]/g, ""); // 숫자만 남김
  
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
};

export function SignupForm() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '', 
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // ✨ 전화번호 입력일 때만 포맷팅 적용
    if (name === 'phone') {
      setFormData(prev => ({ ...prev, [name]: formatPhoneNumber(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. 비밀번호 일치 확인
    if (formData.password !== formData.confirmPassword) {
      toast.error("비밀번호 불일치", { description: "비밀번호가 서로 다릅니다." });
      return;
    }

    // 2. 전화번호 길이 확인 (선택사항)
    if (formData.phone.length < 12) {
      toast.error("전화번호 확인", { description: "올바른 휴대폰 번호를 입력해주세요." });
      return;
    }

    setIsLoading(true);

    try {
      // 3. API 호출 (phone_number 추가 전송!)
      await authApi.signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone_number: formData.phone, // ✨ 백엔드 필드명에 맞춰서 전송
      });

      // 4. 성공 처리
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
        
        {/* ✨ 전화번호 입력 필드 추가 */}
        <Input
          name="phone"
          type="tel"
          placeholder="휴대폰 번호 (010-0000-0000)"
          required
          maxLength={13}
          disabled={isLoading}
          value={formData.phone}
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