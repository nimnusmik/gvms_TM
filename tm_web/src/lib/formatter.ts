// src/lib/formatter.ts

export function formatPhoneNumber(phone: string | null | undefined): string {
    if (!phone) return "";
  
    // 1. 숫자만 남기기
    const cleanPhone = phone.toString().replace(/[^0-9]/g, "");
  
    // 2. 길이에 따라 포맷팅
    if (cleanPhone.length === 11) {
      // 010-1234-5678
      return cleanPhone.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
    } else if (cleanPhone.length === 10) {
      if (cleanPhone.startsWith("02")) {
        // 02-1234-5678
        return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, "$1-$2-$3");
      }
      // 011-123-4567
      return cleanPhone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
    } else if (cleanPhone.length === 9) {
      // 02-123-4567
      return cleanPhone.replace(/(\d{2})(\d{3})(\d{4})/, "$1-$2-$3");
    }
  
    // 매칭 안되면 원본 리턴
    return cleanPhone;
  }