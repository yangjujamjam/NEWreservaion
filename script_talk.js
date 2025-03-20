/** =========================================
 *  [알림톡 전용] 전역 상수
 * ========================================= */

// (1) 알리고 전송 기본 설정
const ALIMTALK_API_URL    = 'https://kakaoapi.aligo.in/akv10/alimtalk/send/';
const ALIMTALK_API_KEY    = 's2qfjf9gxkhzv0ms04bt54f3w8w6b9jd'; 
const ALIMTALK_USER_ID    = 'yangjujamjam';   
const ALIMTALK_SENDERKEY  = 'fc0570b6c7f7785506ea85b62838fd6fb37a3bcc'; 
const ALIMTALK_SENDER     = '01059055559';    

// (2) 템플릿 코드
const TPLCODE_MUTONG      = 'TY_7495'; // 무통장입금 (NONE)
const TPLCODE_SUKBAK      = 'TY_7496'; // 숙박(강조표기형)
const TPLCODE_DAY         = 'TY_7497'; // 당일/대실(강조표기형)

// (3) 템플릿 본문
// -- 무통장: 일반형 (NONE)
const TEMPLATE_MUTONG = 
`고객님 예약 신청해 주셔서 
진심으로 감사드립니다.

#{파싱내용}

*추가 옵션은 체크인 시 현장 결제 가능합니다.
(인원추가, 얼리체크인, 레이트체크아웃, 바베큐, 불멍, 온수풀, 고기세트 등)

*숙박은 “15시”부터 입실 가능하며 수영장 이용은 13시부터 이용하실 수 있습니다. 
얼리체크인을 원하실 경우 카톡으로 별도 문의주세요.

▶계좌번호  우리 1005 504 540028 (주) 유연음

※입금 시 입금자, 예약자명이 동일해야 하며, 예약 안내 수신 후 "2시간 이내" 입금 확인이 안 될 시 자동 취소 처리됩니다.`;

// -- 숙박: 강조표기형 (TEXT)
const TEMPLATE_SUKBAK = 
`[양주잼잼]

예약해 주셔서
진심으로 감사합니다♬

#{파싱내용}

■기준인원 2인 기준 요금이며 인원추가 미선택 시 현장에서 추가결제해 주셔야 합니다. 

■옵션(바베큐, 불멍, 고기세트)은 별도이며 체크인 시 현장 결제도 가능합니다. 

■대형풀 무료 이용 / 온수풀 유료 이용 

■숙박은 “15시”부터 입실 가능하며 수영장 이용은 13시부터 이용하실 수 있습니다. 

■얼리체크인/레이트체크아웃을 원하실 경우 카톡 또는 문자로 별도 문의주세요. 

■옵션 취소는 체크인 또는 체크아웃 하실 때 관리동에 말씀해 주시면 환불처리 도와드립니다.

■예약 내용 확인해보시고 수정 또는 변경해야할 내용이 있다면 말씀 부탁드립니다.`;

// -- 당일/대실: 강조표기형 (TEXT)
const TEMPLATE_DAY = 
`[양주잼잼]

예약해 주셔서
진심으로 감사합니다♬

■기본 이용시간은 6시간이며 예약해주신 방문시간을 엄수해 주세요.

#{파싱내용}

■기준인원 2인 기준 요금이며 인원추가 미선택 시 현장에서 추가결제해 주셔야 합니다. 

■옵션(바베큐, 불멍, 고기세트)은 별도이며 체크인 시 현장 결제도 가능합니다. 

■대형풀 무료 이용 / 온수풀 유료 이용 

■숙박은 “15시”부터 입실 가능하며 수영장 이용은 13시부터 이용하실 수 있습니다. 

■얼리체크인/레이트체크아웃을 원하실 경우 카톡 또는 문자로 별도 문의주세요. 

■옵션 취소는 체크인 또는 체크아웃 하실 때 관리동에 말씀해 주시면 환불처리 도와드립니다.

■예약 내용 확인해보시고 수정 또는 변경해야할 내용이 있다면 말씀 부탁드립니다.`;


/** =========================================
 *  [강조유형] 템플릿별 설정
 * ========================================= */
// "무통장"은 일반형, "숙박/당일"은 TEXT(강조형)
const TEMPLATE_INFO = {
  [TPLCODE_MUTONG]: {
    emType: 'NONE',            // 일반형
    emTitle: '',               // 강조영역 없음
    subject: '무통장 입금 안내'
  },
  [TPLCODE_SUKBAK]: {
    emType: 'TEXT',            // 강조표기형
    emTitle: '[양주잼잼]',    // 승인된 강조 타이틀
    subject: '예약해 주셔서
진심으로 감사합니다♬'
  },
  [TPLCODE_DAY]: {
    emType: 'TEXT',
    emTitle: '[양주잼잼]',    // 승인된 강조 타이틀
    subject: '예약해 주셔서
진심으로 감사합니다♬'
  },
};

/** =========================================
 *  [어떤 템플릿 코드를 사용할지 결정]
 * ========================================= */
function getTemplateCode(data) {
  // 1) 무통장
  if (data.무통장여부) {
    return TPLCODE_MUTONG;
  }

  // 2) 숙박 vs 당일
  //    예: 이용기간에 '~'이 있으면 숙박
  if (data.이용기간 && data.이용기간.includes('~')) {
    return TPLCODE_SUKBAK; 
  } else {
    return TPLCODE_DAY;
  }
}

/** =========================================
 *  [알림톡 발송 함수]
 * ========================================= */
async function sendAlimtalk() {
  // (1) 데이터 가져오기
  let data;
  if (typeof isManualTabActive === 'function' && isManualTabActive()) {
    data = getManualReservationDataSingle();
  } else {
    const text = document.getElementById('inputData').value;
    data = parseReservation(text);
  }

  // (2) 템플릿 코드 결정
  const tplCode = getTemplateCode(data);

  // (3) 템플릿 본문 선택
  let templateText;
  if (tplCode === TPLCODE_MUTONG) {
    templateText = TEMPLATE_MUTONG;
  } else if (tplCode === TPLCODE_SUKBAK) {
    templateText = TEMPLATE_SUKBAK;
  } else {
    templateText = TEMPLATE_DAY;
  }

  // (4) 치환할 텍스트
  const parsingContent = `
- 예약번호: ${data.예약번호}
- 예약자: ${data.예약자}
- 전화번호: ${data.전화번호}
- 이용객실: ${data.이용객실}
- 이용기간: ${data.이용기간}
- 총 이용 인원: ${data.총이용인원}
- 입실시간: ${data.입실시간}
- 결제금액: ${data.결제금액}
`.trim();

  // (5) 실제 메시지
  const messageText = templateText.replace('#{파싱내용}', parsingContent);

  // (6) 강조유형 정보 가져오기
  const info = TEMPLATE_INFO[tplCode];
  const subjectText = info.subject;
  const emType = info.emType;     // 'NONE' or 'TEXT'
  const emTitle = info.emTitle;   // ex) '[양주잼잼]'

  // (7) 알리고 API 파라미터
  const params = new URLSearchParams();
  params.append('apikey',    ALIMTALK_API_KEY);
  params.append('userid',    ALIMTALK_USER_ID);
  params.append('senderkey', ALIMTALK_SENDERKEY);
  params.append('tpl_code',  tplCode);
  params.append('sender',    ALIMTALK_SENDER);

  const phoneOnlyNumbers = (data.전화번호 || '').replace(/[^0-9]/g,'');
  params.append('receiver_1',  phoneOnlyNumbers);
  params.append('recvname_1',  data.예약자 || '고객님');
  params.append('subject_1',   subjectText);
  params.append('message_1',   messageText);

  // 강조표기형이면 emtitle_1 추가
  if (emType === 'TEXT') {
    // 승인된 강조 타이틀(예: [양주잼잼])을 emtitle_1로 전송
    params.append('emtitle_1', emTitle);
    // 만약 소제목(emsubtitle_1)이 있으면 추가
    // params.append('emsubtitle_1', '소제목 텍스트');
  }

  // 대체문자 사용여부
  params.append('failover', 'N');

  // (8) API 전송
  try {
    const response = await fetch(ALIMTALK_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: params.toString()
    });

    const result = await response.json();
    console.log('알림톡 전송 결과:', result);

    if (result.code === 0) {
      alert(`알림톡 발송 성공: ${result.message}`);
    } else {
      alert(`알림톡 발송 실패: ${result.message}`);
    }

  } catch (err) {
    console.error(err);
    alert("알림톡 발송 중 오류가 발생했습니다.");
  }
}
