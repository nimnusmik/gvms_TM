import { Badge } from "@/components/ui/badge";

// 팀별 라벨 및 색상 스타일 정의 (Tailwind CSS)
const TEAM_CONFIG: Record<string, { label: string; className: string }> = {
  SALES_1: {
    label: "영업 1팀",
    className: "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
  },
};

export function TeamBadge({ team }: { team: string | null }) {
  // 1. 팀이 없으면 '미배정' (회색 텍스트)
  if (!team) {
    return <span className="text-gray-400 text-xs">미배정</span>;
  }

  // 2. 설정 가져오기 (없으면 기본값 처리)
  const config = TEAM_CONFIG[team];
  
  const label = config?.label || team; // 설정 없으면 코드 그대로 출력
  const className = config?.className || "text-gray-700 bg-gray-50 border-gray-200"; // 기본 회색 스타일

  return (
    <Badge variant="outline" className={`font-normal border ${className}`}>
      {label}
    </Badge>
  );
}
