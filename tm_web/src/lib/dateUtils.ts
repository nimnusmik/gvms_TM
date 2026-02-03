// src/lib/dateUtils.ts
/**
 * 날짜 객체, ISO 문자열, 혹은 이미 포맷팅된 시간 문자열을 받아서
 * UI에 표시할 수 있는 시간 포맷으로 변환합니다.
 */
export function formatToTime(value: string | Date | null | undefined): string {
    if (!value) return "-";
  
    // 1. 이미 "오전 2:21:33" 처럼 포맷팅된 문자열이 들어온 경우 (빠른 반환)
    // (단순히 ':'가 포함되어 있고 'T'가 없으면 시간 문자열로 간주하는 간단한 체크)
    if (typeof value === "string" && value.includes(":") && !value.includes("T")) {
      return value;
    }
  
    // 2. Date 객체나 ISO 문자열 변환 시도
    const date = new Date(value);
  
    // 3. 유효하지 않은 날짜(Invalid Date) 처리
    if (isNaN(date.getTime())) {
      return String(value); // 변환 실패 시 원본 문자열 그대로 표시 (디버깅 용이)
    }
  
    // 4. 정상 변환
    return date.toLocaleTimeString(); // 사용자 브라우저 설정에 맞는 시간 포맷
  }