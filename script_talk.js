/** =========================================
 *  [알림톡 전용] 전역 설정
 * ========================================= */
const ALIMTALK_API_URL = 'https://kakaoapi.aligo.in/akv10/alimtalk/send/';
const ALIMTALK_API_KEY = 's2qfjf9gxkhzv0ms04bt54f3w8w6b9jd';
const ALIMTALK_USER_ID = 'yangjujamjam';
const ALIMTALK_SENDERKEY = 'fc0570b6c7f7785506ea85b62838fd6fb37a3bcc';
const ALIMTALK_SENDER   = '01059055559';

/** 
 * [무통장 템플릿]
 * TZ_1481
 */
const TEMPLATE_CODE_BANK = 'TZ_1481';
const TEMPLATE_TEXT_BANK = 
`고객님 예약 신청해 주셔서 
진심으로 감사드립니다.

#{파싱내용}

▶계좌번호  우리 1005 504 540028 (주) 유연음

※입금 시 입금자, 예약자명이 동일해야 하며, 예약 안내 수신 후 "2시간 이내" 입금 확인이 안 될 시 자동 취소 처리됩니다.

■ 이용 안내
▶ 2인을 초과하여 예약하셨을 경우, 인원추가를 선택하지 않으셨다면 현장에서 추가 결제가 필요합니다.

▶ 옵션(인원추가, 바베큐, 불멍, 온수풀)은 별도이며 현장 결제 가능합니다.  
※ 고기 및 채소 포함 옵션은 당일 취소가 불가능합니다.  
※ 대형풀은 무료, 온수풀은 유료로 운영됩니다.

▶ 얼리체크인, 레이트체크아웃 시 1시간당 1인 5,000원의 추가 요금이 부과됩니다.  
이용을 원하실 경우 반드시 사전에 문의해 주세요.

▶ 수영장은 체크인 시간 2시간 전부터 이용 가능합니다.

※예약 내용을 다시 한번 확인하시고 수정 또는 변경 사항이 있으면 연락 바랍니다.`;

/** 
 * [붙여넣기 - 네이버숙박/야놀자숙박/여기어때숙박]
 * TZ_1466
 */
const TEMPLATE_CODE_LODGING = 'TZ_1466';
const TEMPLATE_TEXT_LODGING = 
`예약해 주셔서 진심으로 감사합니다♪

#{파싱내용}

■ 숙박 안내
▶ 2인을 초과하여 예약하신 경우, 인원 추가를 선택하지 않으셨다면 현장에서 추가 결제가 필요합니다.

▶ 옵션(인원추가, 바베큐, 불멍, 온수풀)은 별도이며, 현장에서 결제 가능합니다.
※ 고기 및 채소 포함 옵션은 당일 취소가 불가능합니다.
※ 대형풀 무료 이용 / 온수풀 유료 이용

▶ 선택하신 입실 시간을 꼭 준수해 주시기 바랍니다.

▶ 얼리체크인, 레이트체크아웃 시 1시간당 1인 5,000원의 추가 요금이 부과됩니다.
이용을 원하시면 반드시 사전 문의 바랍니다.

▶ 수영장은 체크인 시간 2시간 전부터 이용 가능합니다.

예약 내용을 다시 한번 확인해 주시고, 수정이나 변경이 있으시면 연락 바랍니다.


■ 환불 규정
▶ 취소 수수료
입실 10일 전 : 없음
입실 9일 전 : 10%
입실 8일 전 : 20%
입실 7일 전 : 30%
입실 6일 전 : 40%
입실 5일 전 : 50%
입실 4일 전 : 60%
입실 3일 전 : 70%
입실 2일 전 ~ 당일 : 100%

▶ 날짜 변경 수수료
입실 10일 전 : 무료
입실 9일 전 : 20,000원
입실 6일 전 : 40,000원
입실 4일 전 : 60,000원
입실 2일 전 : 변경 불가

※ 기상악화 및 천재지변으로 인한 취소 및 환불은 어렵습니다.`;

/** 
 * [네이버당일 / 야놀자 당일(대실)]
 * TZ_1465
 * #{이용시간}에 주의
 */
const TEMPLATE_CODE_DAYUSE = 'TZ_1465';
const TEMPLATE_TEXT_DAYUSE =
`예약해 주셔서 진심으로 감사합니다♪

■ 선택하신 이용시간은
#{이용시간}이며, 예약하신 방문 시간을 꼭 지켜주시기 바랍니다.

#{파싱내용}

■ 이용 안내
▶ 2인을 초과하여 예약하셨을 경우, 인원추가를 선택하지 않으셨다면 현장에서 추가 결제가 필요합니다.

▶ 옵션(인원추가, 바베큐, 불멍, 온수풀)은 별도이며 현장 결제 가능합니다.  
※ 고기 및 채소 포함 옵션은 당일 취소가 불가능합니다.  
※ 대형풀은 무료, 온수풀은 유료로 운영됩니다.

▶ 예약하신 입실 시간을 꼭 준수해 주시기 바랍니다.

▶ 얼리체크인, 레이트체크아웃 시 1시간당 1인 5,000원의 추가 요금이 부과됩니다.  
이용을 원하실 경우 반드시 사전에 문의해 주세요.

▶ 수영장은 체크인 시간 2시간 전부터 이용 가능합니다.

예약 내용을 다시 한번 확인하시고 수정 또는 변경 사항이 있으면 연락 바랍니다.


■ 환불 규정
▶ 취소 수수료  
- 입실 10일 전 : 없음  
- 입실 9일 전 : 10%  
- 입실 8일 전 : 20%  
- 입실 7일 전 : 30%  
- 입실 6일 전 : 40%  
- 입실 5일 전 : 50%  
- 입실 4일 전 : 60%  
- 입실 3일 전 : 70%  
- 입실 2일 전~당일 : 100%

※ 기상악화 및 천재지변으로 인한 취소 및 환불은 어렵습니다.`;

/** 
 *  [버튼 공통]
 *  - name: "채널추가"
 *  - linkMo: "http://pf.kakao.com/_xdJxcExj"
 */
const DEFAULT_BUTTON_INFO = {
  button: [{
    name: "채널추가",
    linkType: "AC",
    linkTypeName: "채널 추가",
    linkMo: "http://pf.kakao.com/_xdJxcExj"
  }]
};

/** =========================================
 *  [A] 확인창(Yes/No) → 알림톡 발송
 * ========================================= */
function confirmAlimtalk() {
  const ok = confirm("알림톡을 보내시겠습니까?");
  if(!ok) return;
  sendAlimtalk();
}

/** =========================================
 *  [B] 알림톡 발송 함수 (템플릿/메시지 구성)
 * ========================================= */
async function sendAlimtalk() {
  // (1) 예약 데이터 가져오기
  let data;
  if (isManualTabActive()) {
    // 수기 입력 탭
    data = getManualReservationDataSingle();
  } else {
    // 붙여넣기 탭
    const text = document.getElementById('inputData').value;
    data = parseReservation(text);
  }

  // (2) 템플릿 선택 로직
  let templateCode = '';
  let templateContent = '';
  let buttonInfo = DEFAULT_BUTTON_INFO;

  // ┌────────── 무통장입금 케이스 ──────────┐
  //   ( "붙여넣기" , "수기작성" 공통 )
  // └───────────────────────────────────────┘
  if (data.무통장여부) {
    // 예) 무통장할인/무통장입금 등등
    templateCode = TEMPLATE_CODE_BANK;      // 'TZ_1481'
    templateContent = TEMPLATE_TEXT_BANK;   // 위에 정의한 텍스트
  }
  // ┌────────── 플랫폼별(붙여넣기) ───────────┐
  //   - 네이버 / 야놀자 / 여기어때
  //   - 당일(대실) vs 숙박
  // └───────────────────────────────────────┘
  else if (['네이버', '야놀자', '여기어때'].includes(data.예약플랫폼)) {
    
    // "이용기간"에 '~'가 있으면 숙박, 없으면 당일(대실)로 구분
    const isOvernight = data.이용기간.includes('~');
    
    if (isOvernight) {
      // 숙박
      templateCode = TEMPLATE_CODE_LODGING;     // 'TZ_1466'
      templateContent = TEMPLATE_TEXT_LODGING;  // 네이버/야놀자/여기어때 "숙박"
    } else {
      // 당일/대실
      templateCode = TEMPLATE_CODE_DAYUSE;      // 'TZ_1465'
      templateContent = TEMPLATE_TEXT_DAYUSE;   // 네이버당일 or 야놀자대실
    }
  }
  // ┌────────── 그 외(수기입력 등) ──────────┐
  //   - 여기서는 필요에 따라 추가 처리
  // └───────────────────────────────────────┘
  else {
    // 플랫폼 분류가 없는 "수기입력" 등
    // 무통장 여부가 아닌 이상, 임의로 숙박 템플릿을 기본 세팅
    templateCode = TEMPLATE_CODE_LODGING;
    templateContent = TEMPLATE_TEXT_LODGING;
  }

  // (3) #{파싱내용}, #{이용시간} 치환
  const usageTime      = data.입실시간; // #{이용시간} 치환용
  const formattedOption = data.옵션 
    ? data.옵션.split(',').map(opt => `▶${opt.trim()}`).join('\n')
    : '없음';

  // 파싱내용
  const parsingContent = `
- 예약번호: ${data.예약번호}
- 예약자: ${data.예약자}
- 전화번호: ${data.전화번호}
- 이용객실: ${data.이용객실}
- 이용기간: ${data.이용기간}
- 수량: ${data.수량 || '(복수객실)'}
- 옵션:
${formattedOption}
- 총 이용 인원: ${data.총이용인원}
- 입실시간: ${data.입실시간}
- 결제금액: ${data.결제금액}`.trim();

  // 당일(대실)일 경우 #{이용시간} 치환이 필요
  // (만약 data.입실시간 그대로 쓰고 싶다면 그대로 대입)
  const usageTime = data.입실시간.replace('[당일캠핑] ',''); 
  // 템플릿 문자열 치환
  let messageText = templateContent
    .replace('#{파싱내용}', parsingContent)
    .replace('#{이용시간}', usageTime);

  // (4) 알림톡 발송에 필요한 파라미터 조립
  const params = new URLSearchParams({
    apikey:    ALIMTALK_API_KEY,
    userid:    ALIMTALK_USER_ID,
    senderkey: ALIMTALK_SENDERKEY,
    tpl_code:  templateCode,
    sender:    ALIMTALK_SENDER,

    receiver_1:  data.전화번호.replace(/\D/g, ''),   // 숫자만
    recvname_1:  data.예약자 || '고객님',
    subject_1:   '예약 안내',
    message_1:   messageText,
    failover:    'N'
  });

  // 버튼(채널추가) 설정
  if (buttonInfo) {
    params.append('button_1', JSON.stringify(buttonInfo));
  }

  // (5) fetch로 알리고 API 호출
  fetch(ALIMTALK_API_URL, {
    method: 'POST',
    headers: { 'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8' },
    body: params
  })
  .then(res => res.json())
  .then(result => {
    if (result.code === 0) {
      alert("알림톡 발송 성공");
    } else {
      alert("알림톡 발송 실패: " + result.message);
    }
  })
  .catch(() => alert("알림톡 발송 중 오류 발생"));
}
