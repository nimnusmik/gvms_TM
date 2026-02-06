// src/features/customers/components/CustomerResetDialog.tsx
import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { customerApi } from "../api/customerApi";

interface CustomerResetDialogProps {
  onSuccess: () => void; // 초기화 성공 시 실행할 함수 (새로고침 등)
}

export function CustomerResetDialog({ onSuccess }: CustomerResetDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    try {
      setIsLoading(true);
      const res = await customerApi.resetDB();
      toast.success(res.message || "DB가 초기화되었습니다.");
      onSuccess(); // 목록 새로고침 호출
    } catch (error: any) {
      toast.error("초기화 실패: 권한이 없거나 오류가 발생했습니다.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          className="gap-2 px-4 shadow-sm bg-red-600 hover:bg-red-700 text-white font-bold"
        >
          <RotateCcw className="w-4 h-4" />
          DB 초기화
        </Button>
      </AlertDialogTrigger>
      
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600 font-bold">
            ⚠️ 정말로 초기화하시겠습니까?
          </AlertDialogTitle>
          <AlertDialogDescription>
            이 작업은 되돌릴 수 없습니다.<br />
            현재 등록된 <b>모든 고객 데이터가 영구적으로 삭제</b>됩니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>취소</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault(); // 다이얼로그가 바로 닫히지 않게 방지
              handleReset();
            }}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isLoading ? "초기화 중..." : "네, 초기화합니다"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
