from django.http import JsonResponse
from .services import AIService

def chat_with_ai(request):
    """
    프론트엔드나 다른 앱에서 호출하는 장고 엔드포인트
    예: /ai/ask/?question=배터리 수명이 어떻게 돼?
    """
    # 1. GET 방식으로 질문을 받아와.
    question = request.GET.get('question', '')

    if not question:
        return JsonResponse({"error": "질문 내용을 입력해주세요."}, status=400)

    # 2. 우리가 만든 서비스를 호출해. 
    # 비즈니스 로직은 서비스에 있고, 뷰는 응답만 처리하는 게 시니어의 방식이야!
    answer = AIService.get_answer_from_fastapi(question)
    
    # 3. 최종 답변을 JSON 형태로 반환해.
    return JsonResponse({
        "status": "success",
        "question": question,
        "answer": answer
    })