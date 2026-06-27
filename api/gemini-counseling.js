export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.' });
  }

  const { studentAlias, gradeSummary, learningTraits, teacherConcern } = req.body;

  if (!studentAlias || !gradeSummary || !learningTraits || !teacherConcern) {
    return res.status(400).json({ success: false, error: '필수 데이터가 누락되었습니다.' });
  }

  const prompt = `
당신은 "AI 학생 상담 전략 도우미"입니다. 
다음은 교사가 제공한 학생 정보와 고민입니다.

학생 익명: ${studentAlias}
성적 요약: ${gradeSummary}
학습 특성 요약: ${learningTraits}
교사 고민: ${teacherConcern}

[응답 작성 원칙]
1. 학생을 단정적으로 판단하거나 진단하지 마세요.
2. "의지가 부족하다", "주의력 문제가 있다", "심리적 문제가 있다"처럼 단정하는 표현을 피하세요.
3. 교사가 학생을 이해하고 대화할 수 있도록 돕는 방향으로 응답하세요.
4. 아래의 지정된 형식(6가지 항목)으로만 답변을 작성하세요.

[필수 응답 형식]
1. 현재 상황 요약
2. 학생 데이터 기반 해석
3. 상담 접근 전략
4. 교사가 던질 수 있는 질문 3개
5. 피해야 할 말 또는 주의점
6. 다음 수업에서 해볼 수 있는 작은 지원
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Gemini API 호출 실패');
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return res.status(200).json({ success: true, result: resultText });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
