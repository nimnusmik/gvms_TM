import { Badge } from "@/components/ui/badge";

// 팀별 라벨 및 색상 스타일 정의 (Tailwind CSS)
const TEAM_CONFIG: Record<string, { label: string; className: string }> = {
  BATTERY: { 
    label: "배터리", 
    className: "text-green-700 bg-green-50 border-green-200 hover:bg-green-100" // 🌱 친환경/에너지 느낌
  },
  MOBILITY: { 
    label: "모빌리티", 
    className: "text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100" // 🚙 미래/기술 느낌
  },
  SOLAR: { 
    label: "태양광", 
    className: "text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100" // ☀️ 태양/따뜻한 느낌
  },
  MACHINE: { 
    label: "산업기계", 
    className: "text-slate-700 bg-slate-100 border-slate-200 hover:bg-slate-200" // ⚙️ 금속/단단한 느낌
  }
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