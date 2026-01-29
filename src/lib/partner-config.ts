/**
 * 파트너 설정 관리 모듈
 * URL 경로에서 파트너 식별자를 추출하고 파트너별 설정을 관리합니다.
 */

/**
 * URL 경로에서 파트너 식별자를 추출합니다.
 * 예: "/partner1" -> "partner1", "/" -> null
 */
export function extractPartnerIdFromPath(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const pathname = window.location.pathname;
    // 루트 경로("/")가 아닌 경우 첫 번째 경로 세그먼트를 파트너 ID로 간주
    const segments = pathname.split('/').filter(Boolean);
    
    if (segments.length === 0) {
      // 루트 경로인 경우
      return null;
    }
    
    // 첫 번째 경로 세그먼트를 파트너 ID로 사용
    // 예: "/partner1" -> "partner1", "/partner1/verify" -> "partner1"
    const partnerId = segments[0];
    
    // 예약된 경로는 제외 (verify, direct-test, mrt-partner-test 등)
    const reservedPaths = ['verify', 'direct-test', 'mrt-partner-test'];
    if (reservedPaths.includes(partnerId)) {
      return null;
    }
    
    return partnerId;
  } catch {
    return null;
  }
}

/**
 * 파트너가 활성화되어 있는지 확인합니다.
 * 현재는 파트너 ID가 추출되면 활성화된 것으로 간주합니다.
 * 향후 추가 검증 로직이 필요하면 여기에 추가할 수 있습니다.
 */
export function isPartnerActive(partnerId: string | null): boolean {
  return partnerId !== null && partnerId.length > 0;
}







