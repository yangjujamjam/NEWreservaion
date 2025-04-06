/** =========================================
 *  [알림톡 전용] 전역 설정
 * ========================================= */
const ALIMTALK_API_URL   = 'https://kakaoapi.aligo.in/akv10/alimtalk/send/';
const ALIMTALK_API_KEY   = 's2qfjf9gxkhzv0ms04bt54f3w8w6b9jd';
const ALIMTALK_USER_ID   = 'yangjujamjam';
const ALIMTALK_SENDERKEY = 'fc0570b6c7f7785506ea85b62838fd6fb37a3bcc';
const ALIMTALK_SENDER    = '01059055559';

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

※입금 시 입금자, 예약자명이 동일해야 하며, 
예약 안내 수신 후 "2시간 이내" 입금 확인이 안 될 시 자동 취소 처리됩니다.

■ 이용 안내
▶ 2인을 초과하여 예약하셨을 경우, 인원추가를 선택하지 않으셨다면 
   현장에서 추가 결제가 필요합니다.

▶ 옵션(인원추가, 바베큐, 불멍, 온수풀)은 별도이며 현장 결제 가능합니다.  
※ 고기 및 채소 포함 옵션은 당일 취소가 불가능합니다.  
※ 대형풀은 무료, 온수풀은 유료로 운영됩니다.

▶ 얼리체크인, 레이트체크아웃 시 1시간당 1인 5,000원의 추가 요금이 부과됩니다.  
이용을 원하실 경우 반드시 사전에 문의해 주세요.

▶ 수영장은 체크인 시간 2시간 전부터 이용 가능합니다.

※예약 내용을 다시 한번 확인하시고 수정 또는 변경 사항이 있으면 연락 바랍니다.`;

/** 
 * [숙박 템플릿]
 * TZ_1466
 */
const TEMPLATE_CODE_LODGING = 'TZ_1466';
const TEMPLATE_TEXT_LODGING = 
`예약해 주셔서 진심으로 감사합니다♪

#{파싱내용}

■ 숙박 안내
▶ 2인을 초과하여 예약하신 경우, 인원 추가를 선택하지 않으셨다면 
   현장에서 추가 결제가 필요합니다.

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
 * [당일(대실) 템플릿]
 * TZ_1465
 */
const TEMPLATE_CODE_DAYUSE = 'TZ_1465';
const TEMPLATE_TEXT_DAYUSE =
`예약해 주셔서 진심으로 감사합니다♪

■ 선택하신 이용시간은
#{이용시간}이며, 예약하신 방문 시간을 꼭 지켜주시기 바랍니다.

#{파싱내용}

■ 이용 안내
▶ 2인을 초과하여 예약하셨을 경우, 인원추가를 선택하지 않으셨다면 
   현장에서 추가 결제가 필요합니다.

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
 * 버튼(채널추가) 설정 (공통)
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
 * (A) 기존 붙여넣기/수기작성 탭용 알림톡
 *     - 무통장, 숙박, 당일 등에 따라 템플릿 분기
 * ========================================= */

/**
 * 1) "알림톡 보내기" 버튼 클릭 시 → 확인창
 */
function confirmAlimtalk() {
  const ok = confirm("알림톡을 보내시겠습니까?");
  if(!ok) return;
  sendAlimtalk();
}

/**
 * 2) 실제 발송 함수
 *    - 붙여넣기 or 수기작성에서 parseReservation / getManualReservationDataSingle 사용
 */
async function sendAlimtalk() {
  // (A) 예약 데이터
  let data;
  if (isManualTabActive()) {
    data = getManualReservationDataSingle(); 
  } else {
    const text = document.getElementById('inputData').value;
    data = parseReservation(text);
  }

  // (B) 템플릿 분기
  let templateCode  = '';
  let templateText  = '';
  let buttonInfo    = DEFAULT_BUTTON_INFO;

  if (data.무통장여부) {
    // 무통장
    templateCode = TEMPLATE_CODE_BANK;
    templateText = TEMPLATE_TEXT_BANK;
  }
  else if (['네이버','야놀자','여기어때'].includes(data.예약플랫폼)) {
    // 숙박/당일 구분 (~ 유무)
    const isOvernight = data.이용기간.includes('~');
    if (isOvernight) {
      templateCode = TEMPLATE_CODE_LODGING;     
      templateText = TEMPLATE_TEXT_LODGING;
    } else {
      templateCode = TEMPLATE_CODE_DAYUSE;
      templateText = TEMPLATE_TEXT_DAYUSE;
    }
  }
  else {
    // 그 외 → 임의로 숙박템플릿
    templateCode = TEMPLATE_CODE_LODGING;
    templateText = TEMPLATE_TEXT_LODGING;
  }

  // (C) 치환
  const usageTimeReplaced = data.입실시간.replace('[당일캠핑] ','');
  const formattedOption = data.옵션 
    ? data.옵션.split(',').map(opt => `▶${opt.trim()}`).join('\n')
    : '없음';

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

  let messageText = templateText
    .replace('#{파싱내용}', parsingContent)
    .replace('#{이용시간}', usageTimeReplaced);

  // (D) 알리고 파라미터
  const params = new URLSearchParams({
    apikey:     ALIMTALK_API_KEY,
    userid:     ALIMTALK_USER_ID,
    senderkey:  ALIMTALK_SENDERKEY,
    tpl_code:   templateCode,
    sender:     ALIMTALK_SENDER,

    receiver_1: (data.전화번호||'').replace(/\D/g, ''),
    recvname_1: data.예약자 || '고객님',
    subject_1:  '예약 안내',
    message_1:  messageText,
    failover:   'N'
  });

  if (buttonInfo) {
    params.append('button_1', JSON.stringify(buttonInfo));
  }

  // (E) fetch
  fetch(ALIMTALK_API_URL, {
    method: 'POST',
    headers: {'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
    body: params
  })
  .then(res => res.json())
  .then(result => {
    if(result.code===0) {
      alert("알림톡 발송 성공");
    } else {
      alert("알림톡 발송 실패: " + result.message);
    }
  })
  .catch(err => {
    console.error(err);
    alert("알림톡 발송 중 오류 발생");
  });
}

/** =========================================
 * (B) 무통장 "입금확인" 탭 전용
 *     - 숙박: TZ_1466, 당일: TZ_1465
 * ========================================= */

/**
 * "입금확인" 버튼 클릭:
 *   1) 시트 L열='입금확인'
 *   2) 알림톡 (숙박/당일)
 */
async function confirmPaymentAlimtalk(row) {
  const ok = confirm("입금이 확인되었습니까?");
  if(!ok) return;

  // (A) 시트 L열='입금확인'
  try {
    const updateUrl = gasUrl + `?mode=updateDeposit&rowIndex=${row.rowIndex}&newValue=입금확인`;
    const res = await fetch(updateUrl);
    const text = await res.text();
    if(!(text.includes("완료") || text.includes("성공"))) {
      alert("스프레드시트 업데이트 실패: " + text);
      return;
    }
    alert("스프레드시트 '입금확인' 처리 완료");
  } catch(e) {
    console.error(e);
    alert("업데이트 중 오류 발생");
    return;
  }

  // (B) 알림톡 발송 (숙박=TZ_1466, 당일=TZ_1465)
  sendAlimtalkForDeposit(row);

  // (C) 무통장 목록 재조회 (script.js에 loadDepositData()가 있으면 호출)
  if(typeof loadDepositData === 'function') {
    loadDepositData();
  }
}

/**
 * (B2) 알림톡 발송 (숙박 or 당일)
 */
function sendAlimtalkForDeposit(row) {
  // (1) 숙박 vs 당일
  const isStay = row.이용기간.includes('~'); 
  let tplCode, tplText;
  if(isStay) {
    tplCode = TEMPLATE_CODE_LODGING;  // TZ_1466
    tplText = TEMPLATE_TEXT_LODGING;
  } else {
    tplCode = TEMPLATE_CODE_DAYUSE;   // TZ_1465
    tplText = TEMPLATE_TEXT_DAYUSE;
  }

  // (2) #{이용시간} 치환 (당일만)
  let usageTime = '';
  if(!isStay) {
    const m = row.이용기간.match(/(\d{1,2}:\d{2}~\d{1,2}:\d{2})/);
    usageTime = m ? m[1] : '예약시간';
  }

  // (3) #{파싱내용}
  const parsingContent = `
- 예약번호: ${row.예약번호}
- 예약자: ${row.예약자}
- 전화번호: ${row.전화번호}
- 이용객실: ${row.이용객실}
- 수량: ${row.수량}
- 옵션: ${row.옵션}
- 총이용인원: ${row.총이용인원}
- 입실시간: ${row.입실시간}
- 결제금액: ${row.결제금액}
`.trim();

  let finalText = tplText
    .replace('#{이용시간}', usageTime)
    .replace('#{파싱내용}', parsingContent);

  // (4) 알리고 파라미터
  const params = new URLSearchParams({
    apikey:    ALIMTALK_API_KEY,
    userid:    ALIMTALK_USER_ID,
    senderkey: ALIMTALK_SENDERKEY,
    tpl_code:  tplCode,
    sender:    ALIMTALK_SENDER,

    receiver_1: (row.전화번호 || '').replace(/\D/g, ''),
    recvname_1: row.예약자 || '고객님',
    subject_1:  '예약 안내',
    message_1:  finalText,
    failover:   'N'
  });

  // (5) fetch
  fetch(ALIMTALK_API_URL, {
    method: 'POST',
    headers: {'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
    body: params
  })
  .then(r => r.json())
  .then(result => {
    if(result.code===0) {
      alert("알림톡 발송 성공");
    } else {
      alert("알림톡 발송 실패: " + result.message);
    }
  })
  .catch(e => {
    console.error(e);
    alert("알림톡 발송 중 오류 발생");
  });
}
