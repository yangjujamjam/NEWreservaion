/*******************************************************
 * script_talk.js
 *******************************************************/

/** =========================================
 *  [1] 알림톡 전역 설정
 * ========================================= */
// 알리고(카카오) 발송용 API URL / API KEY / ...
const ALIMTALK_API_URL   = 'https://kakaoapi.aligo.in/akv10/alimtalk/send/';
const ALIMTALK_API_KEY   = 's2qfjf9gxkhzv0ms04bt54f3w8w6b9jd';
const ALIMTALK_USER_ID   = 'yangjujamjam';
const ALIMTALK_SENDERKEY = 'fc0570b6c7f7785506ea85b62838fd6fb37a3bcc';
const ALIMTALK_SENDER    = '01059055559';

/** 
 * [공통] 카톡 버튼 예: "채널추가" 
 *  - TZ_1465, TZ_1466, TZ_1481 템플릿에 적용
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
 *  [2] (붙여넣기/수기작성 탭)
 *      무통장(TZ_1481), 숙박(TZ_1466), 당일(TZ_1465)
 * ========================================= */

/** 무통장 템플릿 (TZ_1481) - 버튼(채널추가) 포함 */
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

/** 숙박 템플릿 (TZ_1466) - 버튼(채널추가) 포함 */
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

/** 당일(대실) 템플릿 (TZ_1465) - 버튼(채널추가) 포함 */
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

/** =========================================
 *  [3] 붙여넣기/수기작성 탭 → "알림톡 보내기" 로직
 * ========================================= */

/**
 * (A) "알림톡 보내기" 버튼 → 확인 후 발송
 */
function confirmAlimtalk() {
  const ok = confirm("알림톡을 보내시겠습니까?");
  if(!ok) return;
  sendAlimtalk();
}

/**
 * (B) 붙여넣기/수기작성에서 parseReservation() or getManualReservationDataSingle() 한 결과로
 *     무통장/숙박/당일 템플릿을 분기하여 알림톡 전송
 */
async function sendAlimtalk() {
  // (a) 예약 데이터 (붙여넣기 or 수기작성)
  let data;
  if (isManualTabActive()) {
    data = getManualReservationDataSingle(); 
  } else {
    const text = document.getElementById('inputData').value;
    data = parseReservation(text);
  }

  // (b) 템플릿 코드/메시지 분기
  let templateCode = '';
  let templateText = '';

  if (data.무통장여부) {
    // 무통장 => TZ_1481
    templateCode = TEMPLATE_CODE_BANK;
    templateText = TEMPLATE_TEXT_BANK;
  }
  else if (['네이버','야놀자','여기어때'].includes(data.예약플랫폼)) {
    // 숙박/당일 여부 (~ 포함이면 숙박)
    const isOvernight = data.이용기간.includes('~');
    if (isOvernight) {
      templateCode = TEMPLATE_CODE_LODGING;   // TZ_1466
      templateText = TEMPLATE_TEXT_LODGING;
    } else {
      templateCode = TEMPLATE_CODE_DAYUSE;    // TZ_1465
      templateText = TEMPLATE_TEXT_DAYUSE;
    }
  }
  else {
    // 기타(수기입력 등)는 숙박 템플릿으로 예시
    templateCode = TEMPLATE_CODE_LODGING;     // TZ_1466
    templateText = TEMPLATE_TEXT_LODGING;
  }

  // (c) 치환
  const usageTimeReplaced = (data.입실시간||'').replace('[당일캠핑] ','');
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

  // (d) 알리고 파라미터
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

  // (e) [중요] TZ_1465 / TZ_1466 / TZ_1481 → 채널추가 버튼 필요
  if (templateCode === 'TZ_1465' || templateCode === 'TZ_1466' || templateCode === 'TZ_1481') {
    params.append('button_1', JSON.stringify(DEFAULT_BUTTON_INFO));
  }

  // (f) 전송
  try {
    const res = await fetch(ALIMTALK_API_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
      body: params
    });
    const result = await res.json();
    if(result.code===0) {
      alert("알림톡 발송 성공");
    } else {
      alert("알림톡 발송 실패: " + result.message);
    }
  } catch(err) {
    console.error(err);
    alert("알림톡 발송 중 오류 발생");
  }
}

/** =========================================
 *  [4] 무통장 입금확인 탭 → 입금확인 처리 & 알림톡
 * ========================================= */

/**
 * (A) '입금확인' 버튼 → confirmPaymentAlimtalk(row)
 *   1) 시트1에 '입금확인' 표시
 *   2) 알림톡(숙박=TZ_1466, 당일=TZ_1465) 발송
 */
async function confirmPaymentAlimtalk(row) {
  const ok = confirm("입금이 확인되었습니까?");
  if(!ok) return;

  // 1) 시트 L열='입금확인' 업데이트
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

  // 2) 알림톡 발송 (숙박=TZ_1466 / 당일=TZ_1465)
  sendAlimtalkForDeposit(row);

  // 3) 무통장 목록 재조회
  if(typeof loadDepositData === 'function') {
    loadDepositData();
  }
}

/**
 * (B) 무통장 입금확인 알림톡 (숙박=TZ_1466 / 당일=TZ_1465)
 */
function sendAlimtalkForDeposit(row) {
  // 1) 숙박 or 당일
  const isStay = row.이용기간.includes('~');
  let tplCode, tplText;

  if (isStay) {
    tplCode = TEMPLATE_CODE_LODGING;  // 'TZ_1466'
    tplText = TEMPLATE_TEXT_LODGING;
  } else {
    tplCode = TEMPLATE_CODE_DAYUSE;   // 'TZ_1465'
    tplText = TEMPLATE_TEXT_DAYUSE;
  }

  // 2) #{이용시간} 치환 (당일만)
  let usageTime = '';
  if(!isStay) {
    const match = row.이용기간.match(/(\d{1,2}:\d{2}~\d{1,2}:\d{2})/);
    usageTime = match ? match[1] : (row.입실시간 || '').replace('[당일캠핑]','').trim();
  }

  // 3) #{파싱내용}
  const parsingContent = `
- 예약번호: ${row.예약번호}
- 예약자: ${row.예약자}
- 전화번호: ${row.전화번호}
- 이용객실: ${row.이용객실}
- 수량: ${row.수량}
- 옵션: ${row.옵션 || '없음'}
- 총이용인원: ${row.총이용인원}
- 입실시간: ${row.입실시간}
- 결제금액: ${row.결제금액}`.trim();

  let finalText = tplText
    .replace('#{이용시간}', usageTime)
    .replace('#{파싱내용}', parsingContent);

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

  if (tplCode === 'TZ_1466' || tplCode === 'TZ_1465') {
    params.append('button_1', JSON.stringify(DEFAULT_BUTTON_INFO));
  }

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

/** =========================================
 *  [5] 전날메세지 탭 → 숙박(TY_8998) / 당일(TZ_1472)
 *      => (웹링크 버튼 5개)
 * ========================================= */

const TEMPLATE_REMIND_LODGING_CODE = 'TY_8998';
const TEMPLATE_REMIND_LODGING_TEXT =
`안녕하세요 양주잼잼입니다. 
방문 전  확인 부탁드리겠습니다.

■ 숙박 이용안내
▶ 객실 이용 시간
-입실: 오후 3시~8시 (8시 이후 사전 연락 필수)
-퇴실: 오전 11시까지

▶ 체크인 안내
- 도착 시 관리동(노란 건물)에서 입실 안내
- 캠핑 웨건 카트로 짐 이동 가능

-얼리체크인/레이트체크아웃:
1시간당 1인 5,000원 추가 (사전 문의 필수)

▶ 공용시설
- 매점: 오전 8시~오후 9시
- 공용 샤워장/화장실: 관리동 왼편 위치
- 흡연: 주차장 옆 흡연장만 이용 가능
- 쓰레기: 주차장 옆 분리수거장 배출

▶ 퇴실 시 유의사항
- 객실 내 리모컨 바구니 관리실 반납

■ 주의사항
- 예약 인원 외 방문 불가
- 반려동물 동반 불가
- 전기그릴·개인 화로대 사용 금지 (가스버너 가능)
- 수영장 내 취식·음주·비눗방울·불꽃놀이(폭죽) 금지
- 객실 내 간단한 조리만 가능 (고기·생선 등 금지)
- 비치용품·시설 파손 및 분실 시 변상 책임
- 객실 수건 오염(세안 외 용도 사용) 시 장당 5,000원 변상

■ 온수 사용 안내
- 각 객실은 카라반형태의 
"캠핑트레일러숙박시설"입니다.

일반 건물과 달리 온수를
저장해서 사용하는 객실로,

사용자에 따라 온수의 양이
충분하지 않을 수 있습니다.

샤워 및 온수 사용 후 바로 따뜻한
물이 나오지 않을 수 있습니다.

온수가 소진 시  
재가열 시간 동안 온수사용이 제한됩니다 
(30분정도)

■ 객실 비치용품
- 침대: 더블침대+2층 침대(싱글)
- WiFi, TV(케이블), 에어컨, 온돌난방, 침구세트, 4인 테이블
- 냉장고, 전자레인지, 인덕션, 전기포트
- 취사도구(냄비, 후라이팬 등), 식기류(6인 기준), 와인오프너
- 샤워기, 변기, 세면대, 드라이기, 수건(인당 2장)
- 샴푸, 린스, 바디워시(유아용 포함)

■ 개인 준비물
- 음식, 개인 세면도구, 휴대폰 충전기
- 수영복, 물놀이 튜브, 구명조끼, 슬리퍼
- 비치타올/담요`;

const TEMPLATE_REMIND_DAYUSE_CODE = 'TZ_1472';
const TEMPLATE_REMIND_DAYUSE_TEXT =
`안녕하세요 양주잼잼입니다. 
방문 전  확인 부탁드리겠습니다.

■ 당일캠핑 이용 안내
- #{이용시간}
- 시간 연장은 일정상 불가할 수 있습니다.
- 얼리체크인/레이트체크아웃: 1시간당 1인 5,000원 추가 (사전 관리실 문의 필수)

▶ 체크인 안내
- 도착 시 관리동(노란 건물)에서 입실 안내
- 캠핑 웨건 카트로 짐 이동 가능

▶ 공용시설
- 매점: 오전 8시~오후 9시
- 공용 샤워장/화장실: 관리동 왼편 위치
- 흡연: 주차장 옆 흡연장만 이용 가능
- 쓰레기: 주차장 옆 분리수거장 배출

▶ 퇴실 시 유의사항
- 객실 내 리모컨 바구니 관리실 반납

■ 주의사항
- 예약 인원 외 방문 불가
- 반려동물 동반 불가
- 전기그릴·개인 화로대 사용 금지 (가스버너 가능)
- 수영장 내 취식·음주·비눗방울·불꽃놀이(폭죽) 금지
- 객실 내 간단한 조리만 가능 (고기·생선 등 금지)
- 비치용품·시설 파손 및 분실 시 변상 책임
- 객실 수건 오염(세안 외 용도 사용) 시 장당 5,000원 변상

■ 온수 사용 안내
일반 건물과 달리 온수를
저장해서 사용하는 캠핑트레일러 객실로
사용자에 따라 온수의 양이
충분하지 않을 수 있습니다.

샤워 및 온수 사용 후 바로 따뜻한
물이 나오지 않을 수 있습니다.
온수가 소진 시  재가열 시간 동안 온수사용이 제한됩니다. (30분정도)

■ 객실 구성
- 카라반: 더블침대 1+ 2층 침대(싱글)
- 캐빈: 퀸 침대 2
- WiFi, TV(케이블), 에어컨, 온돌난방, 침구세트, 테이블
- 냉장고, 전자레인지, 인덕션, 전기포트
- 취사도구(냄비, 후라이팬 등), 식기류(6인 기준), 와인오프너
- 샤워기, 변기, 세면대, 드라이기, 수건(인당 2장)
- 샴푸, 린스, 바디워시(유아용 포함)

■ 개인 준비물
- 음식, 개인 세면도구, 휴대폰 충전기
- 수영복, 튜브, 구명조끼, 슬리퍼
- 비치타올/담요`;

/**
 * 전날메세지 -> 숙박/당일
 *  - 버튼 5개(웹링크)
 */
async function sendOneReminder(row) {
  const isStay = row.이용기간.includes('~');
  let tplCode = isStay ? TEMPLATE_REMIND_LODGING_CODE : TEMPLATE_REMIND_DAYUSE_CODE;
  let tplText = isStay ? TEMPLATE_REMIND_LODGING_TEXT : TEMPLATE_REMIND_DAYUSE_TEXT;

  if(!isStay) {
    let usageTime = (row.입실시간||'').replace('[당일캠핑]','').trim();
    if(!usageTime) usageTime='예약시간';
    tplText = tplText.replace('#{이용시간}', usageTime);
  }

  const params = new URLSearchParams({
    apikey:    ALIMTALK_API_KEY,
    userid:    ALIMTALK_USER_ID,
    senderkey: ALIMTALK_SENDERKEY,
    tpl_code:  tplCode,
    sender:    ALIMTALK_SENDER,

    receiver_1: (row.전화번호||'').replace(/\D/g,''),
    recvname_1: row.예약자||'고객님',
    subject_1:  '전날 안내',
    message_1:  tplText,
    failover:   'N'
  });

  // 전날메세지: 5개 웹링크 버튼
  const buttons = {
    button: [
      {
        name: "바베큐 사용방법",
        linkType: "WL",
        linkMo: "https://www.youtube.com/watch?v=9ex2OggS0IA",
        linkPc: "https://www.youtube.com/watch?v=9ex2OggS0IA"
      },
      {
        name: "불멍 사용방법",
        linkType: "WL",
        linkMo: "https://www.youtube.com/watch?v=PooftL_OeGg",
        linkPc: "https://www.youtube.com/watch?v=PooftL_OeGg"
      },
      {
        name: "추울때/우천시 불멍 위치",
        linkType: "WL",
        linkMo: "https://www.youtube.com/watch?v=7P0xkKLxxzw",
        linkPc: "https://www.youtube.com/watch?v=7P0xkKLxxzw"
      },
      {
        name: "[카라반] 보일러 사용법",
        linkType: "WL",
        linkMo: "https://www.youtube.com/watch?v=rS_tgpgX4ME",
        linkPc: "https://www.youtube.com/watch?v=rS_tgpgX4ME"
      },
      {
        name: "[우드캐빈] 보일러 사용법",
        linkType: "WL",
        linkMo: "https://www.youtube.com/watch?v=wpfEl7rBR1k",
        linkPc: "https://www.youtube.com/watch?v=wpfEl7rBR1k"
      }
    ]
  };
  params.append('button_1', JSON.stringify(buttons));

  try {
    const res = await fetch(ALIMTALK_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: params
    });
    const result = await res.json();
    if (result.code === 0) {
      console.log(`[${row.예약번호}] 전날메세지 성공`);

      await fetch(`${gasUrl}?mode=updateReminder&rowIndex=${row.rowIndex}&newValue=발송됨`);

      await updateSendU(row.rowIndex);
      return true;
    } else {
      console.warn(`[${row.예약번호}] 전날메세지 실패: ${result.message}`);
      return false;
    }
  } catch (err) {
    console.error(err);
    return false;
  }
}

/** =========================================
 *  [6] 퇴실메세지(숙박=TZ_1475), (당일=TZ_1476)
 *      => 버튼 없음
 * ========================================= */
const TEMPLATE_CHECKOUT_STAY_CODE = 'TZ_1475';
const TEMPLATE_CHECKOUT_STAY_TEXT =
`■ 퇴실 전 체크아웃 안내

금일 퇴실 시간은 #{퇴실시간}시입니다.
TV 리모콘이 들어있는 바구니와 함께
관리실에 오셔서 체크아웃 해주시면 감사하겠습니다.

▶ 필수 확인 사항
-사용하신 식기류는 간단한 설거지 필수
-객실 내 모든 조명 소등 및 문 단속 확인
-쓰레기(일반/음식물)는 지정된 공용 분리수거장에 배출
(음식물 쓰레기 봉투 부족 시 관리동 무료 제공)

▶고객님들의 즐거운 글램핑 경험을 위해 퇴실 시 다음 사항을 꼭 확인해주세요.

-개인 짐 놓고 가신 경우 1주일간 보관 후 폐기됩니다.
-남은 음식물은 즉시 폐기되오니 양해 바랍니다.

잊으신 물건이 없는지 꼼꼼히 확인하시고, 즐거운 추억만 가득 담아 가시길 바랍니다.`;

const TEMPLATE_CHECKOUT_DAY_CODE = 'TZ_1476';
const TEMPLATE_CHECKOUT_DAY_TEXT =
`■ 퇴실 전 확인사항

▶퇴실 시간은 #{퇴실시간} 입니다.
퇴실 시 놓고 가신 물건이 없는지 반드시 확인해 주세요.

▶ 필수 확인 사항

- 기본 설거지 필수
- 모든 쓰레기(일반, 음식물)는 공용 분리수거장에 배출 (음식물 쓰레기 봉투 부족 시 관리동 무료 제공)
- TV, 에어컨 리모컨을 바구니에 담아 관리동에 반납
-퇴실 시 모든 전등 소등 및 객실 문 닫힘 확인
-개인 짐 놓고 가신 경우 1주일간 보관 후 폐기됩니다.
-남은 음식물은 즉시 폐기되오니 양해 바랍니다.

▶ 주의사항
-객실 내 흡연 적발 시 패널티 5만원 청구됩니다.

■ 운영 안내
-관리동 매점/카페: 오전 8시~오후 9시
-참숯, 장작 추가 구매: 오후 9시 이전 전화 주문 필수
-문의사항: 관리동 010-5905-5559

이용해 주셔서 감사합니다.`;

/** 퇴실메세지(숙박) → row.stayOutR */
async function sendCheckoutStayOne(row) {
  const tplCode = TEMPLATE_CHECKOUT_STAY_CODE; // 'TZ_1475'
  let tplText = TEMPLATE_CHECKOUT_STAY_TEXT;

  const checkOutTime = (row.stayOutR || "11:00");
  tplText = tplText.replace('#{퇴실시간}', checkOutTime);

  const params = new URLSearchParams({
    apikey:    ALIMTALK_API_KEY,
    userid:    ALIMTALK_USER_ID,
    senderkey: ALIMTALK_SENDERKEY,
    tpl_code:  tplCode,
    sender:    ALIMTALK_SENDER,

    receiver_1: (row.전화번호 || '').replace(/\D/g,''),
    recvname_1: row.예약자 || '고객님',
    subject_1:  '퇴실 안내(숙박)',
    message_1:  tplText,
    failover:   'N'
  });

  try {
    const res = await fetch(ALIMTALK_API_URL, {
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
      body: params
    });
    const result = await res.json();
    if(result.code===0){
      console.log(`[${row.예약번호}] 퇴실(숙박) OK`);
      await updateSendV(row.rowIndex);
      return true;
    } else {
      console.warn(`[${row.예약번호}] 퇴실(숙박) FAIL: ${result.message}`);
      return false;
    }
  } catch(e){
    console.error(e);
    return false;
  }
}

/** 퇴실메세지(당일) → row.dayOutQ */
async function sendCheckoutDayOne(row) {
  const tplCode = TEMPLATE_CHECKOUT_DAY_CODE; // 'TZ_1476'
  let tplText = TEMPLATE_CHECKOUT_DAY_TEXT;

  const checkOutTime = (row.dayOutQ || "19:00");
  tplText = tplText.replace('#{퇴실시간}', checkOutTime);

  const params = new URLSearchParams({
    apikey:    ALIMTALK_API_KEY,
    userid:    ALIMTALK_USER_ID,
    senderkey: ALIMTALK_SENDERKEY,
    tpl_code:  tplCode,
    sender:    ALIMTALK_SENDER,

    receiver_1: (row.전화번호||'').replace(/\D/g,''),
    recvname_1: row.예약자||'고객님',
    subject_1:  '퇴실 안내(당일)',
    message_1:  tplText,
    failover:   'N'
  });

  try {
    const res = await fetch(ALIMTALK_API_URL, {
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
      body: params
    });
    const result = await res.json();
    if(result.code===0){
      console.log(`[${row.예약번호}] 퇴실(당일) OK`);
      await updateSendW(row.rowIndex);
      return true;
    } else {
      console.warn(`[${row.예약번호}] 퇴실(당일) FAIL: ${result.message}`);
      return false;
    }
  } catch(e){
    console.error(e);
    return false;
  }
}

/** =========================================
 *  [7] 매너타임 (TY_8981) - 버튼 없음
 * ========================================= */
const TEMPLATE_MANNER_CODE = 'TY_8981';
const TEMPLATE_MANNER_TEXT =
`■ 매너타임 안내

양주잼잼 글램핑을 방문해 주셔서 감사합니다.
모두가 편안한 시간을 보낼 수 있도록 다음 사항을 준수해 주세요.

▶ 매너타임: 밤 10시부터
- 밤 10시 이후 큰 소리 대화, 개인 스피커 등 사용 금지
- 주변 객실에 피해가 가지 않도록 소음 최소화 필수
- 신발은 객실 내 신발장에 보관해 주세요. (분실·파손 시 책임지지 않습니다.)

▶ 불멍(모닥불) 이용 시 주의사항
- 화재 예방을 위해 반드시 충분한 공간 확보 및 주변 환경 확인 필수

▶ 객실 내 흡연 엄격 금지
- 적발 시 즉시 퇴실 조치
- 흡연으로 인한 손해(침구류 교체, 청소, 시설 손상 등)는 배상 청구될 수 있습니다.

▶ 비상 연락 및 주의사항 위반 신고
- 긴급 상황 발생 또는 주의사항 위반 시 즉시 연락 바랍니다.
- 밤 10시 이후는 전화 상담만 가능합니다. (카톡·문자 불가)
- 연락처: 010-5905-5559

※ 객실 보일러 위치: 싱크대 하단 참고

※ 매너타임 이후 소음·흡연 등 타인에게 피해를 줄 경우 즉시 환불 없이 퇴실 조치됩니다.

■ 운영시간 안내
- 숲천탕(온수풀): 오전 9시~오후 9시
- 대형수영장(냉수풀): 오전 9시~오후 9시
- 관리동 매점/카페: 오전 8시~오후 9시

■ 참숯·장작 추가 구매
- 밤 9시 이전 카톡 또는 전화로 주문 필수

협조해 주셔서 감사합니다.`;

/** 매너타임 → TY_8981 (버튼 없음) */
async function sendMannerOne(row) {
  const tplCode = TEMPLATE_MANNER_CODE; // 'TY_8981'
  let tplText = TEMPLATE_MANNER_TEXT;   // 그대로 전송

  const params = new URLSearchParams({
    apikey:    ALIMTALK_API_KEY,
    userid:    ALIMTALK_USER_ID,
    senderkey: ALIMTALK_SENDERKEY,
    tpl_code:  tplCode,
    sender:    ALIMTALK_SENDER,

    receiver_1: (row.전화번호||'').replace(/\D/g,''),
    recvname_1: row.예약자||'고객님',
    subject_1:  '매너타임 안내',
    message_1:  tplText,
    failover:   'N'
  });

  try {
    const res = await fetch(ALIMTALK_API_URL, {
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
      body: params
    });
    const result = await res.json();
    if(result.code===0){
      console.log(`[${row.예약번호}] 매너타임 OK`);
      await updateSendX(row.rowIndex);
      return true;
    } else {
      console.warn(`[${row.예약번호}] 매너타임 FAIL: ${result.message}`);
      return false;
    }
  } catch(e){
    console.error(e);
    return false;
  }
}

async function updateSendU(rowIndex) {  // 전날메세지 (U열)
  const url = gasUrl + `?mode=updateReminder&rowIndex=${rowIndex}&newValue=발송됨`;
  await fetch(url);
}

async function updateSendV(rowIndex) {  // 퇴실메세지 숙박 (V열)
  const url = gasUrl + `?mode=updateCheckoutStay&rowIndex=${rowIndex}&newValue=발송됨`;
  await fetch(url);
}

async function updateSendW(rowIndex) {  // 퇴실메세지 당일 (W열)
  const url = gasUrl + `?mode=updateCheckoutDay&rowIndex=${rowIndex}&newValue=발송됨`;
  await fetch(url);
}

async function updateSendX(rowIndex) {  // 매너타임 (X열)
  const url = gasUrl + `?mode=updateManner&rowIndex=${rowIndex}&newValue=발송됨`;
  await fetch(url);
}
