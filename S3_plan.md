

  # S3 녹음 업로드 API 설계/연동 계획

  ## 요약

  - S3 연동 설정(.env, 버킷 정책/CORS) 확정
  - 백엔드에서 “성공건만 업로드 허용” 검증 추가
  - 모바일 앱에서 presigned URL을 받아 S3로 직접 업로드하는 플로우 정의

  ## 공개 API/인터페이스 변경

  - POST /api/v1/calls/logs/{id}/recording-upload
      - 성공건(CallLog.result_type == SUCCESS)만 허용
      - 요청: filename, content_type, size_bytes
      - 응답: upload_url, key, required_headers
  - POST /api/v1/calls/logs/{id}/recording-complete
      - 성공건만 허용
      - 요청: key
  - GET /api/v1/calls/logs/{id}/recording-url
      - 성공건 + 업로드 완료 상태(recording_status=UPLOADED)만 다운로드 허용

  ## 구현 단계

  ### 1) S3 연동 설정

  - .env에 아래 설정 추가
      - S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET, S3_REGION
      - 필요 시 S3_ENDPOINT_URL
  - S3 버킷 CORS
      - PUT, GET 허용
      - Content-Type 헤더 허용
      - 모바일 앱 도메인/오리진 허용

  ### 2) 백엔드 제약 추가 (성공건만)

  - recording-upload, recording-complete, recording-url에 공통 검증 추가
      - call_log.result_type != SUCCESS면 403 또는 400
  - 업로드 완료 후 상태 갱신은 기존 로직 유지

  2. recording-upload 호출 → upload_url, key 획득
  3. upload_url로 파일 PUT 업로드
  4. recording-complete 호출
  5. 필요 시 recording-url로 재생/다운로드

  ## 테스트/검증 시나리오

  - 성공건: 업로드/완료 정상, status=UPLOADED
  - 비성공건: 업로드 요청 차단
  - 잘못된 key: 완료 처리 실패
  - 다운로드: 성공건+업로드 완료 시에만 허용

  ## 가정

  - 업로드 방식은 presigned URL
  - 성공건 기준은 CallLog.result_type == SUCCESS
  - 클라이언트는 모바일 앱