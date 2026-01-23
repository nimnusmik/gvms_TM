import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/authApi'
import { toast } from "sonner"
import { storage } from '@/lib/storage'
import { Building2, Command } from 'lucide-react'

// Shadcn UI 컴포넌트
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleLogin = async () => {
    const { email, password } = formData
    if (!email || !password) {
      toast.error("입력 오류", { description: "이메일과 비밀번호를 입력해주세요." })
      return
    }

    setIsLoading(true)
    try {
      const data = await authApi.login({ email, password })
      
      if (!data.is_staff) {
        toast.error("접근 거부", { description: "관리자만 접근 가능합니다." })
        storage.clearTokens()
        return 
      }

      storage.setToken(data.access)
      storage.setRefreshToken(data.refresh)
      
      toast.success("환영합니다!", { description: "관리자 대시보드로 이동합니다." })
      navigate('/dashboard')

    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || '로그인 정보를 확인해주세요.'
      toast.error("로그인 실패", { description: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) handleLogin()
  }

  return (
    <div className="w-full h-screen lg:grid lg:grid-cols-2">
      
      <div className="hidden bg-zinc-900 lg:flex flex-col justify-between p-10 text-white relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2301&auto=format&fit=crop')" }}
        />
        
        {/* 상단 로고 */}
        <div className="relative z-10 flex items-center text-lg font-medium">
          <Command className="mr-2 h-6 w-6" /> {/* 로고 아이콘 */}
          Global Vision TM
        </div>

        {/* 하단 인용구 */}
        <div className="relative z-10 mt-auto">
          <blockquote className="space-y-2">

            <footer className="text-sm text-zinc-400">Admin Console Team</footer>
          </blockquote>
        </div>
      </div>

      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              관리자 로그인
            </h1>
            <p className="text-sm text-muted-foreground">
              이메일과 비밀번호를 입력하여 접속하세요.
            </p>
          </div>

          <div className="grid gap-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  disabled={isLoading}
                  value={formData.email}
                  onChange={handleChange}
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
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                />
              </div>
              
              <Button disabled={isLoading} onClick={handleLogin}>
                {isLoading ? "로그인 중..." : "로그인"}
              </Button>
            </div>

            {/* 구분선 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* 회원가입 링크 */}
            <div className="text-center text-sm text-muted-foreground">
              계정이 없으신가요?{" "}
              <span 
                onClick={() => navigate('/signup')}
                className="cursor-pointer underline underline-offset-4 hover:text-primary font-semibold"
              >
                회원가입하기
              </span>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}