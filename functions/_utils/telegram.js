/**
 * 텔레그램 알림 유틸리티
 * 텔레그램 봇을 통해 메시지 전송
 */

/**
 * 텔레그램 메시지 전송
 * @param {string} botToken - 텔레그램 봇 토큰
 * @param {string} chatId - 채팅 ID
 * @param {string} message - 전송할 메시지
 * @returns {Promise<boolean>} 성공 여부
 */
export async function sendTelegramMessage(botToken, chatId, message) {
  if (!botToken || !chatId) {
    console.error('[Telegram] Missing botToken or chatId');
    console.error('[Telegram] botToken:', botToken ? '있음' : '없음', 'chatId:', chatId ? '있음' : '없음');
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    console.log('[Telegram] API 요청 시작 - URL:', url.replace(botToken, 'BOT_TOKEN_HIDDEN'));
    console.log('[Telegram] 요청 데이터 - chatId:', chatId, 'message 길이:', message.length);
    
    const requestBody = {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML', // HTML 형식 지원
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[Telegram] API 응답 상태:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Telegram] API 오류 응답:', JSON.stringify(errorData, null, 2));
      return false;
    }

    const responseData = await response.json();
    console.log('[Telegram] API 성공 응답:', JSON.stringify(responseData, null, 2));
    return true;
  } catch (error) {
    console.error('[Telegram] 요청 중 예외 발생:', error);
    console.error('[Telegram] 에러 타입:', error.constructor.name);
    console.error('[Telegram] 에러 메시지:', error.message);
    console.error('[Telegram] 에러 스택:', error.stack);
    return false;
  }
}

/**
 * 문의 알림 메시지 포맷팅
 * @param {object} inquiryData - 문의 데이터
 * @returns {string} 포맷팅된 메시지
 */
export function formatInquiryNotification(inquiryData) {
  const { site_id, name, contact, message, custom_fields } = inquiryData;
  
  let text = `🔔 <b>새로운 문의가 접수되었습니다!</b>\n\n`;
  text += `📌 <b>사이트:</b> ${site_id}\n`;
  text += `👤 <b>이름:</b> ${name}\n`;
  text += `📞 <b>연락처:</b> ${contact}\n`;
  
  if (message) {
    text += `💬 <b>메시지:</b>\n${message}\n`;
  }
  
  // custom_fields 파싱 및 표시
  if (custom_fields) {
    let customData;
    try {
      customData = typeof custom_fields === 'string' 
        ? JSON.parse(custom_fields) 
        : custom_fields;
    } catch (e) {
      customData = null;
    }
    
    if (customData && Object.keys(customData).length > 0) {
      text += `\n📋 <b>추가 정보:</b>\n`;
      
      // 문의 타입
      if (customData.inquiry_type) {
        text += `• 문의타입: ${customData.inquiry_type}\n`;
      }
      
      // 상품 유형
      if (customData.product_type) {
        text += `• 상품유형: ${customData.product_type}\n`;
      }
      
      // 분양파트너: 직급, 현장명, 광고지원금액, 투자금, 추천인
      if (customData.rank) text += `• 직급: ${customData.rank}\n`;
      if (customData.site_name) text += `• 현장명: ${customData.site_name}\n`;
      if (customData.ad_amount) text += `• 광고지원금액: ${customData.ad_amount}\n`;
      if (customData.invest_amount) text += `• 투자금: ${customData.invest_amount}\n`;
      // 추천인 정보는 파트너 지원 신청인 경우 항상 표시
      if (customData.inquiry_type === '파트너 지원 신청') {
        text += `• 추천인: ${customData.referrer || '-'}\n`;
        text += `• 추천인 전화번호: ${customData.referrer_contact || '-'}\n`;
      } else if (customData.referrer || customData.referrer_contact) {
        // 다른 타입이지만 추천인 정보가 있는 경우
        if (customData.referrer) text += `• 추천인: ${customData.referrer}\n`;
        if (customData.referrer_contact) text += `• 추천인 전화번호: ${customData.referrer_contact}\n`;
      }
      
      // 기타 커스텀 필드
      Object.entries(customData).forEach(([key, value]) => {
        if (!['inquiry_type', 'product_type', 'rank', 'site_name', 'ad_amount', 'invest_amount', 'referrer', 'referrer_contact'].includes(key) && value) {
          text += `• ${key}: ${value}\n`;
        }
      });
    }
  }
  
  text += `\n⏰ <b>접수 시간:</b> ${new Date().toLocaleString('ko-KR')}`;
  
  return text;
}

