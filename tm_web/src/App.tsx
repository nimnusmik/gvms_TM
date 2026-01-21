// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@/features/auth/pages/LoginPage'
// import Dashboard from '@/pages/Dashboard' // 대시보드 페이지

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} /> 
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}        
        <Route path="/" element={<Navigate to="/login" replace />} /> 
      </Routes>
    </BrowserRouter>
  )
}

export default App