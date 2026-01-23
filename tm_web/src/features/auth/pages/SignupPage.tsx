import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/authApi'; // 아까 만든 api
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const SignupPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  // 입력값 관리
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '', // 프론트에서만 체크용
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. 기본 유효성 검사 (비밀번호 일치 여부)
    if (formData.password !== formData.confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsLoading(true);

    try {
      // 2. API 호출 (confirmPassword는 서버에 안 보냄)
      await authApi.signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      // 3. 성공 시 처리
      toast.success("회원가입 성공! 로그인해주세요.");
      navigate('/login'); // 로그인 페이지로 이동
      
    } catch (error) {
      // 4. 실패 시 처리
      console.error(error);
      toast.error("회원가입에 실패했습니다. (아이디 중복 등)");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6 bg-white p-6 shadow-md rounded-lg">
        
        {/* 헤더 */}
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">회원가입</h1>
          <p className="mt-2 text-sm text-gray-600">
            TM 솔루션 사용을 위해 계정을 생성하세요.
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Input
              name="name"
              placeholder="이름"
              required
              value={formData.name}
              onChange={handleChange}
            />
            <Input
              name="email"
              type="email"
              placeholder="이메일"
              required
              value={formData.email}
              onChange={handleChange}
            />
            <Input
              name="password"
              type="password"
              placeholder="비밀번호"
              required
              value={formData.password}
              onChange={handleChange}
            />
            <Input
              name="confirmPassword"
              type="password"
              placeholder="비밀번호 확인"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? "가입 중..." : "회원가입"}
          </Button>
        </form>

        {/* 하단 링크 */}
        <div className="text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{" "}
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500">
            로그인하기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;