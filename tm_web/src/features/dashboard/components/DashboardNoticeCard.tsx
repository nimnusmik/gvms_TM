import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const notices = [
  { title: "시스템 정기 점검 안내", date: "2026.01.29", type: "notice" },
  { title: "신규 상담원 등록 가이드 배포", date: "2026.01.28", type: "info" },
  { title: "DB 업로드 기능 업데이트", date: "2026.01.27", type: "update" },
];

export function DashboardNoticeCard() {
  return (
    <Card className="col-span-3 shadow-sm">
      <CardHeader>
        <CardTitle>시스템 공지사항</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notices.map((item, index) => (
            <div
              key={`${item.title}-${index}`}
              className="flex items-start pb-4 border-b last:border-0 last:pb-0"
            >
              <span
                className={`mt-1.5 w-2 h-2 rounded-full mr-3 shrink-0 ${
                  item.type === "notice"
                    ? "bg-red-500"
                    : item.type === "update"
                      ? "bg-blue-500"
                      : "bg-gray-400"
                }`}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800 hover:underline cursor-pointer">
                  {item.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{item.date}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
