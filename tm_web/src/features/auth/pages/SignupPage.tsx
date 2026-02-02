import { Link } from 'react-router-dom';
import { SignupForm } from '../components/SignupForm'; // 방금 만든 폼 컴포넌트 불러오기

const SignupPage = () => {
  // 로직(state, handler 등)이 전부 SignupForm으로 이사 갔습니다!
  // 여기는 이제 "레이아웃" 역할만 합니다. 아주 가벼워졌죠?

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6 bg-white p-6 shadow-md rounded-lg">
        
        {/* 헤더 영역 */}
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">회원가입</h1>
          <p className="mt-2 text-sm text-gray-600">
            TM 솔루션 사용을 위해 계정을 생성하세요.
          </p>
        </div>

        {/* ✨ 여기가 핵심! 복잡한 폼 로직은 이 컴포넌트가 알아서 처리합니다 */}
        <SignupForm />

        {/* 하단 링크 영역 */}
        <div className="text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{" "}
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500 hover:underline">
            로그인하기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;