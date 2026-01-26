import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from "@/components/ui/sonner" // 👈 여기로 이사 옴
import { router } from './routes/router'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 1. 라우터 장착 */}
    <RouterProvider router={router} />
    
    {/* 2. 알림창(Toaster) 장착 (앱 전체 어디서든 뜨게) */}
    <Toaster position="top-center" />
  </React.StrictMode>,
)