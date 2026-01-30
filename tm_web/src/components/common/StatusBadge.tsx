import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ONLINE: { label: "온라인", color: "bg-green-500 hover:bg-green-600" },
  OFFLINE: { label: "오프라인", color: "bg-gray-500 hover:bg-gray-600" },
  BUSY: { label: "통화 중", color: "bg-red-500 hover:bg-red-600" },
  BREAK: { label: "휴식 중", color: "bg-yellow-500 hover:bg-yellow-600" },
  RESIGNED: { label: "퇴사", color: "bg-orange-500 hover:bg-orange-600" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['OFFLINE'];
  
  return (
    <Badge className={`${config.color} text-white border-0`}>
      {config.label}
    </Badge>
  );
}