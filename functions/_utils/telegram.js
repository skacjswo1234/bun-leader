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
    console.error('Telegram: Missing botToken or chatId');
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML', // HTML 형식 지원
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Telegram API Error:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Telegram send error:', error);
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
      
      // 기타 커스텀 필드
      Object.entries(customData).forEach(([key, value]) => {
        if (key !== 'inquiry_type' && key !== 'product_type' && value) {
          text += `• ${key}: ${value}\n`;
        }
      });
    }
  }
  
  text += `\n⏰ <b>접수 시간:</b> ${new Date().toLocaleString('ko-KR')}`;
  
  return text;
}

