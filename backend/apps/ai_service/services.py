import httpx
import os
import logging

# 에러 로그를 남기기 위한 설정이야. 실무에선 로깅이 필수지!
logger = logging.getLogger(__name__)

class AIService:
    """
    AI 엔진(FastAPI)과의 통신을 담당하는 서비스 클래스
    """
    
    @staticmethod
    def get_answer_from_fastapi(question: str):
        # 1. 도커 컨테이너에서 로컬 호스트로 접속하기 위한 특수 주소야.
        # .env에 저장하는 게 좋지만, 로컬 테스트용으로 기본값을 넣어둘게.
        base_url = os.getenv("AI_API_URL", "http://host.docker.internal:8001")
        api_path = "/api/v1/generate-answer"
        
        # 2. FastAPI에서 설정한 Bearer Token이야. 
        # 보안을 위해 반드시 .env에 있는 값을 가져와야 해.
        token = os.getenv("ACCESS_TOKEN", "gv-ax-secret-2026")

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # 3. FastAPI가 기대하는 JSON 형식으로 데이터를 만들어.
        payload = {"question": question}

        # 4. httpx를 사용해 동기 방식으로 요청을 보내 (장고 뷰가 보통 동기니까)
        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(f"{base_url}{api_path}", json=payload, headers=headers)
                
                # HTTP 상태 코드가 200(성공)이 아니면 예외를 발생시켜.
                response.raise_for_status()
                
                # 성공 시 결과 JSON에서 answer 필드만 추출해서 반환해.
                return response.json().get("answer")
                
        except httpx.HTTPStatusError as e:
            logger.error(f"AI 서버 응답 에러: {e.response.status_code}")
            return "AI 서버가 응답하지 않습니다. 잠시 후 다시 시도해 주세요."
        except Exception as e:
            logger.error(f"알 수 없는 통신 에러: {str(e)}")
            return "서비스 연결에 실패했습니다."