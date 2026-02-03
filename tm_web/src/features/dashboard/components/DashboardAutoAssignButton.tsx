import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react"; // 아이콘
import { toast } from "sonner";
import { customerApi } from "@/features/customers/api/customerApi";

export function DashboardAutoAssignButton() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRunAssign = async () => {
    // 1. 실행 확인
    if (!confirm("지금 '일일 자동 배정'을 실행하시겠습니까?\n(Celery가 백그라운드에서 작업을 시작합니다.)")) {
      return;
    }

    setIsProcessing(true);
    try {
      // 2. API 호출
      await customerApi.runAutoAssign();
      
      // 3. 성공 알림
      toast.success("자동 배정 작업이 시작되었습니다!", {
        description: "잠시 후 배정 이력 메뉴에서 결과를 확인하세요."
      });
    } catch (error) {
      console.error(error);
      toast.error("실행 실패", {
        description: "서버 에러가 발생했습니다. 관리자에게 문의하세요."
      });
    } finally {
      // 4. 로딩 해제 (API 응답은 202로 바로 오므로 짧게 처리)
      setTimeout(() => setIsProcessing(false), 1000);
    }
  };

  return (
    <Button 
      onClick={handleRunAssign} 
      disabled={isProcessing}
      className="bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md transition-all active:scale-95"
    >
      {isProcessing ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Play className="mr-2 h-4 w-4 fill-white" />
      )}
      자동 배정 실행
    </Button>
  );
}