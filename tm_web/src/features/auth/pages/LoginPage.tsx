// src/features/auth/pages/LoginPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom' // 라우팅을 위해 추가
import { authApi } from '../api/authApi'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      alert("이메일과 비밀번호를 입력해주세요.")
      return
    }

    setIsLoading(true) // 버튼 텍스트를 "로그인 중..."으로 바꾸고 입력 필드와 버튼을 비활성화

    try {
      const data = await authApi.login({ email, password })  //authApi.ts로 이동
      
      // 토큰 저장
      localStorage.setItem('accessToken', data.access)
      localStorage.setItem('refreshToken', data.refresh)
      
      console.log('로그인 성공:', data)
      alert('로그인 성공!')
      
      // 대시보드 또는 메인 페이지로 이동
      navigate('/dashboard') // 또는 원하는 페이지
      
    } catch (error: any) {
      console.error('로그인 실패:', error)
      const errorMessage = error.response?.data?.detail || '로그인에 실패했습니다.'
      alert(errorMessage)

    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <Card className="w-[400px] shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-primary">
            TM 관리자 시스템
          </CardTitle>
          <CardDescription className="text-center">
            관리자 계정으로 로그인해주세요
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">이메일</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="admin@tm.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)} // 여기서 사용자가 입력하면 email 상태가 업데이트 됨
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading) handleLogin()
              }}
              disabled={isLoading}
            />
          </div>
        </CardContent>

        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? "로그인 중..." : "로그인"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}