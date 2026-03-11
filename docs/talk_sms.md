Plan: 연락 수단 선택 기능 (전화 / 카톡 / 문자)                                                  
                                                                                                 
 Context                                                                                         
                                                        
 TM 사원들이 전화 외에 카카오톡·문자로도 고객과 연락하는 경우가 있음.
 현재 앱은 전화 통화만 기록할 수 있어서, 카톡/문자 결과를 별도로 기록하는 수단이 없음.
 → 연락 수단을 선택해 기록할 수 있도록 프론트·백엔드 모두 확장한다.

 ---
 UX 결정: 하이브리드 방식

 전화 경로 (기존 유지, 변경 없음)

 1. 배정 리스트에서 📞 전화 버튼 탭
 2. 다이얼러 열림 → 통화 → 앱으로 복귀
 3. CallContext AppState 감지 → CallRecordScreen 자동 열림 (contactMethod: 'CALL' 포함)

 카톡/문자 경로 (신규)

 1. 배정 리스트에서 💬 카톡 또는 ✉ 문자 버튼 탭
 2. navigation.navigate('CallRecord', { assignment: { ..., contactMethod: 'KAKAO'|'SMS',
 startTime: null } }) 로 직접 이동
 3. 다이얼러 없음, 통화시간 없음

 CallRecordScreen 상단 탭

 - 전화 | 카톡 | 문자 탭 바 → 파라미터로 받은 method가 초기 선택
 - 탭 전환 허용 (잘못 탭했을 때 수정 가능)
 - 전화 탭: 통화시간 표시 + 모든 결과 유형
 - 카톡/문자 탭: 통화시간 숨김 + 결번 제외 결과 유형

 ---
 구현 단계

 1. 백엔드: contact_method 필드 추가

 backend/apps/calls/models.py
 - CallLog 클래스 내부에 ContactMethod TextChoices 추가:
 class ContactMethod(models.TextChoices):
     CALL  = 'CALL',  '전화'
     KAKAO = 'KAKAO', '카카오톡'
     SMS   = 'SMS',   '문자'
 - result_type 아래에 필드 추가:
 contact_method = models.CharField(
     max_length=10,
     choices=ContactMethod.choices,
     default=ContactMethod.CALL,
     verbose_name="연락 수단"
 )

 backend/apps/calls/migrations/0010_calllog_contact_method.py (신규 생성)
 - python manage.py makemigrations calls로 자동 생성
 - default='CALL'로 기존 데이터 호환

 backend/apps/calls/serializers.py
 - fields 리스트에 "contact_method" 추가 (writable, required=False)
 참고: 현재 모바일이 보내는 memo 필드가 serializer에 없어 저장되지 않는 기존 버그 있음 (이번
 범위 외)

 ---
 2. 프론트: CallContext.js

 src/store/CallContext.js
 - setPendingCall 호출 시 contactMethod: 'CALL' 포함되도록 AssignmentsScreen에서 전달
 (CallContext 자체 수정 불필요 — pendingCall 객체를 그대로 navigate에 넘김)

 ---
 3. 프론트: AssignmentsScreen.js

 handleCall 함수 수정
 const handleCall = (item, contactMethod = 'CALL') => {
   // ...공통 phone/name 추출...
   if (contactMethod === 'CALL') {
     setPendingCall({ assignmentId, customerName, customerPhone, startTime: Date.now(),
 contactMethod: 'CALL' });
     Linking.openURL(`tel:${customerPhone}`);
   } else {
     // KAKAO / SMS: 직접 CallRecord로 이동, pendingCall 사용 안 함
     navigation.navigate('CallRecord', {
       assignment: { assignmentId: item.id, customerName, customerPhone, startTime: null,
 contactMethod }
     });
   }
 };

 카드 UI 수정 (renderItem)
 - 기존 "📞 전화걸기" 버튼을 3개 버튼 그룹으로 교체:
   - 📞 전화 (초록, 기존 스타일 유지)
   - 💬 카톡 (KakaoTalk 노란색 #FEE500, 검정 텍스트)
   - ✉ 문자 (파란색 #2196F3, 흰 텍스트)
 - processed 상태일 때 세 버튼 모두 회색 처리

 ---
 4. 프론트: CallRecordScreen.js

 파라미터에서 contactMethod 읽기
 const contactMethod = assignment.contactMethod || 'CALL';
 const [selectedMethod, setSelectedMethod] = useState(contactMethod);

 상단 탭 바 추가 (전화 | 카톡 | 문자)
 - 선택된 탭이 바뀌면 resultType을 'SUCCESS'로 리셋

 통화시간 조건부 표시
 // startTime이 null이면 duration = 0
 const diffSeconds = assignment.startTime
   ? Math.floor((Date.now() - assignment.startTime) / 1000) : 0;

 // UI에서:
 {selectedMethod === 'CALL' && <Text>⏱ 통화시간: {duration}초</Text>}

 결과 유형 필터링
 - CALL: SUCCESS / ABSENCE / REJECT / INVALID / CALLBACK (현재 그대로)
 - KAKAO / SMS: SUCCESS / ABSENCE(읽음/무응답) / REJECT / CALLBACK (결번 제외)

 POST body에 contact_method 추가
 const body = {
   assignment: assignment.assignmentId,
   call_start: new Date(assignment.startTime || Date.now()).toISOString(),
   call_duration: selectedMethod === 'CALL' ? duration : 0,
   result: resultType,
   memo: memo,
   contact_method: selectedMethod,  // 신규
 };

 ---
 수정 파일 목록

 ┌──────────────────────────────────────────┬────────────────────────────────────────────────┐
 │                   파일                   │                   변경 내용                    │
 ├──────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ backend/apps/calls/models.py             │ ContactMethod TextChoices + contact_method     │
 │                                          │ 필드 추가                                      │
 ├──────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ backend/apps/calls/migrations/0010_...py │ makemigrations로 생성                          │
 ├──────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ backend/apps/calls/serializers.py        │ fields에 contact_method 추가                   │
 ├──────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ src/screens/main/AssignmentsScreen.js    │ handleCall 수정, 카톡/문자 버튼 추가           │
 ├──────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ src/screens/main/CallRecordScreen.js     │ 탭 바, 조건부 duration, 필터된 결과 유형, POST │
 │                                          │  body                                          │
 └──────────────────────────────────────────┴────────────────────────────────────────────────┘

 ---
 검증

 1. 전화 플로우: 전화 버튼 탭 → 다이얼러 → 앱 복귀 → CallRecordScreen 자동 열림 (전화 탭 선택) →
  저장 → DB에 contact_method='CALL' 확인
 2. 카톡 플로우: 카톡 버튼 탭 → CallRecordScreen 직접 열림 (카톡 탭, 통화시간 없음, 결번 버튼
 없음) → 저장 → DB에 contact_method='KAKAO' 확인
 3. 문자 플로우: 위와 동일하게 contact_method='SMS' 확인
 4. 탭 전환: CallRecordScreen에서 탭 바를 직접 바꾸면 UI가 해당 방식으로 업데이트되는지 확인
 5. 처리된 카드: 이미 완료된 배정 건의 세 버튼이 모두 회색 처리되는지 확인
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌