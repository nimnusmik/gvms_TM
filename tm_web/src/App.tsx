// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from "@/components/ui/sonner" 
import LoginPage from '@/features/auth/pages/LoginPage'
import SignupPage from '@/features/auth/pages/SignupPage'
import ProtectedRoute from '@/features/auth/components/ProtectedRoute'

function App() {
  return (
    <> 
      <BrowserRouter>
        <Routes>
          {/* 1. 누구나 접속 가능 */}
          <Route path="/login" element={<LoginPage />} /> 
          <Route path="/signup" element={<SignupPage />} />

          {/* 2. 로그인 성공한 사람만 보는 곳 */}
          <Route element={<ProtectedRoute />}>
             {/* 아직 페이지랑 레이아웃이 없으니까, 
                일단 임시로 <div> 태그를 써서 글씨만 보여줍니다.
             */}
             <Route path="/dashboard" element={
                <div className="p-10">
                  <h1 className="text-2xl font-bold">🎉 로그인 성공!</h1>
                  <p>여기에 나중에 대시보드가 들어갈 거예요.</p>
                </div>
             } />
          </Route>
          
          {/* 3. 길 안내 (리다이렉트) */}
          {/* "/" 로 들어오면 -> "/dashboard"로 보냄 -> (로그인 안했으면 로그인창으로 튕김) */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 이상한 주소로 들어오면 -> 로그인 페이지로 보냄 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" /> 
    </>
  )
}
export default App