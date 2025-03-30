/** =========================================
 *  [알림톡 전용] 전역 설정
 * ========================================= */
// 알리고 카카오 API 기본 정보
const ALIMTALK_API_URL = 'https://kakaoapi.aligo.in/akv10/alimtalk/send/';
const ALIMTALK_API_KEY = 's2qfjf9gxkhzv0ms04bt54f3w8w6b9jd';  // 예시
const ALIMTALK_USER_ID = 'yangjujamjam';                    // 예시
const ALIMTALK_SENDERKEY = 'fc0570b6c7f7785506ea85b62838fd6fb37a3bcc'; // 예시
const ALIMTALK_SENDER = '01059055559'; // 발신번호

// 템플릿 코드
const TPLCODE_STAY    = 'TY_8947'; // 네이버숙박, 야놀자숙박, 여기어때(숙박)
const TPLCODE_DAYUSE  = 'TY_8948'; // 네이버 당일, 야놀자 대실
const TPLCODE_DEPOSIT = 'TY_7495'; // 무통장입금, 수기입력

// 템플릿 본문
const TEMPLATE_STAY = 
`[양주잼잼]
예약해 주셔서 진심으로 감사합니다♬

#{파싱내용}

■ 2인 초과 시, 인원추가를 미선택하셨다면 현장에서 추가결제가 필요합니다.
■ 옵션(인원추가, 바베큐, 불멍, 온수풀)은 별도이며 현장 결제가능합니다.
※고기 및 채소가 있는 옵셥은 당일취소가 불가능합니다.
(대형풀 무료 이용 / 온수풀 유료 이용)

■ 선택하신 입실시간을 준수해주세요.
■ 얼리체크인/레이트체크아웃은 1시간당 1인 5,000원의 추가 요금이 부과됩니다.
이용을 원하실 경우 반드시 사전 문의 바랍니다.
■ 수영장은 체크인 시간 2시간 전부터 이용 가능합니다.

예약 내용을 확인하신 후, 수정 또는 변경 사항이 있으시면 말씀해 주시기 바랍니다.

■ 환불규정
▶ 취소수수료

입실 10일전 - 없음
입실 9일전 - 10%
입실 8일전 - 20%
입실 7일전 - 30%
입실 6일전 - 40%
입실 5일전 - 50%
입실 4일전 - 60%
입실 3일전 - 70%
입실 2일전 ~ 당일 -  100%

▶ 날짜 변경 시 수수료

입실 10일전 - 무료
입실 9일전 - 20,000원
입실 6일전 - 40,000원
입실 4일전 - 60,000원
입실 2일전 - 변경불가

 - 기상악화 & 천재지변으로 인한 취소 및 환불은 어렵습니다
채널 추가하고 이 채널의 광고와 마케팅 메시지를 카카오톡으로 받기`;

const TEMPLATE_DAYUSE = 
`[양주잼잼] 예약해 주셔서 진심으로 감사합니다♬
■기본 이용시간은 6시간이며 예약해주신 방문시간을 엄수해 주세요.

#{파싱내용}

■ 2인 초과 시, 인원추가를 미선택하셨다면 현장에서 추가결제가 필요합니다.
■ 옵션(인원추가, 바베큐, 불멍, 온수풀)은 별도이며 현장 결제가능합니다.
※고기 및 채소가 있는 옵션은 당일취소가 불가능합니다.
(대형풀 무료 이용 / 온수풀 유료 이용)

■ 선택하신 입실시간을 준수해주세요.
■ 얼리체크인/레이트체크아웃은 1시간당 1인 5,000원의 추가 요금이 부과됩니다.
이용을 원하실 경우 반드시 사전 문의 바랍니다.
■ 수영장은 체크인 시간 2시간 전부터 이용 가능합니다.

예약 내용을 확인하신 후, 수정 또는 변경 사항이 있으시면 말씀해 주시기 바랍니다.

■ 환불규정
▶ 취소수수료

입실 10일전 - 없음
입실 9일전 - 10%
입실 8일전 - 20%
입실 7일전 - 30%
입실 6일전 - 40%
입실 5일전 - 50%
입실 4일전 - 60%
입실 3일전 - 70%
입실 2일전 ~ 당일 -  100%

 - 기상악화 & 천재지변으로 인한 취소 및 환불은 어렵습니다
채널 추가하고 이 채널의 광고와 마케팅 메시지를 카카오톡으로 받기`;

const TEMPLATE_DEPOSIT = 
`고객님 예약 신청해 주셔서 
진심으로 감사드립니다.

#{파싱내용}

*추가 옵션은 체크인 시 현장 결제 가능합니다.
(인원추가, 얼리체크인, 레이트체크아웃, 바베큐, 불멍, 온수풀, 고기세트 등)

*숙박은 “15시”부터 입실 가능하며 수영은 13시부터 이용하실 수 있습니다. 
얼리체크인을 원하실 경우 카톡으로 별도 문의주세요.

▶계좌번호  우리 1005 504 540028 (주) 유연음

※입금 시 입금자, 예약자명이 동일해야 하며, 예약 안내 수신 후 "2시간 이내" 입금 확인이 안 될 시 자동 취소 처리됩니다.`;


/** =========================================
 *  [A] 전역 변수: 마지막 예약정보 저장
 * ========================================= */
window.lastReservationData = null;


/** =========================================
 *  [B] "안내문자 양식적용" 버튼 클릭시 → 
 *      (1) 붙여넣기 or 수기작성 구분
 *      (2) 데이터 파싱/수집
 *      (3) outputData 표시 + 클립보드 복사
 *      (4) 전역 변수에 저장
 * ========================================= */
function generateReservationMessage() {
  let data;
  
  // 1) 현재 탭 상태에 따라 데이터 가져오기
  if (isManualTabActive()) {
    data = getManualReservationDataSingle();
  } else {
    const rawText = document.getElementById('inputData').value.trim();
    data = parseReservation(rawText);
  }

  // 2) 메시지 포맷팅 (화면용)
  const formattedParsedData = `
- 예약번호: ${data.예약번호}
- 예약자: ${data.예약자}
- 전화번호: ${data.전화번호}
- 이용객실: ${data.이용객실}
- 이용기간: ${data.이용기간}
- 수량: ${data.수량 || '(복수객실)'}
- 옵션: ${data.옵션 || '없음'}
- 총 이용 인원: ${data.총이용인원 || ''}
- 입실시간: ${data.입실시간}
- 결제금액: ${data.결제금액}
- 예약플랫폼: ${data.예약플랫폼}
`.trim();

  // 3) #outputData 에 출력
  document.getElementById('outputData').textContent = formattedParsedData;

  // 4) 클립보드 복사
  navigator.clipboard.writeText(formattedParsedData)
    .then(()=> alert('안내문자 내용이 클립보드에 복사되었습니다.'))
    .catch(()=> alert('클립보드 복사 실패'));

  // 5) 전역 변수에 예약데이터 저장 → 알림톡 발송 시 사용
  window.lastReservationData = data;
}

/** =========================================
 *  [C] "알림톡 발송" 버튼 → 전역데이터 있으면 발송
 * ========================================= */
function confirmAlimtalk() {
  const ok = confirm("알림톡을 보내시겠습니까?");
  if(!ok) return;

  if (!window.lastReservationData) {
    alert("먼저 [안내문자 양식적용] 버튼을 눌러 예약정보를 확인해주세요.");
    return;
  }
  sendAlimtalk(window.lastReservationData);
}

/** =========================================
 *  (D) 알림톡 최종 발송 함수
 * =========================================
 * 1) 템플릿코드 결정
 * 2) #{파싱내용} 부분 문자열 구성
 * 3) 템플릿 본문 치환
 * 4) 알리고 API에 POST
 */
async function sendAlimtalk(data) {
  // (1) 템플릿코드 선택
  const tplCode = decideTemplateCode(data);

  // (2) #{파싱내용} 작성
  const parsingText = buildParsingContent(data);

  // (3) 실제 전송할 메시지 완성
  const finalMessage = buildTemplateMessage(tplCode, parsingText);

  // (4) 알리고로 POST
  const params = new URLSearchParams();
  params.append('apikey',    ALIMTALK_API_KEY);
  params.append('userid',    ALIMTALK_USER_ID);
  params.append('senderkey', ALIMTALK_SENDERKEY);
  params.append('tpl_code',  tplCode);
  params.append('sender',    ALIMTALK_SENDER);

  // 수신자 전화번호 & 수신자명
  const phoneOnly = (data.전화번호 || '').replace(/[^0-9]/g,'');
  params.append('receiver_1', phoneOnly || '01000000000');
  params.append('recvname_1', data.예약자 || '고객님');

  // 제목 & 메시지
  params.append('subject_1', '[양주잼잼] 예약안내');
  params.append('message_1', finalMessage);

  // 실패 시 대체발송 여부
  params.append('failover', 'N');

  try {
    const response = await fetch(ALIMTALK_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: params.toString()
    });
    const result = await response.json();
    console.log('알림톡 발송 결과:', result);

    if (result.code === 0) {
      alert("알림톡 발송 성공: " + result.message);
    } else {
      alert("알림톡 발송 실패: " + result.message);
    }
  } catch (err) {
    console.error('알림톡 발송 오류:', err);
    alert("알림톡 발송 중 오류가 발생했습니다.");
  }
}

/** =========================================
 *  (E) 템플릿 코드 및 메시지 결정 로직
 * ========================================= */

/** 1) 어느 템플릿코드 쓸지 결정 (숙박 / 당일 / 무통장/수기) */
function decideTemplateCode(data) {
  const plat  = (data.예약플랫폼 || '').toLowerCase();
  const period= (data.이용기간   || '');
  const check = (data.입실시간   || '').toLowerCase();

  // 무통장/수기입력
  if (plat.includes('무통장') || plat.includes('수기입력')) {
    return TPLCODE_DEPOSIT; // TY_7495
  }

  // 야놀자
  if (plat.includes('야놀자')) {
    // "숙박" → TY_8947
    // "대실" → TY_8948
    // 대실 인지 여부는 parseYanoljaReservation() 결과(입실시간 or lines[1])를 참고
    // 예) [숙박] 15:00 입실 / 11:00 퇴실
    if (check.includes('[숙박]')) {
      return TPLCODE_STAY;
    } else {
      return TPLCODE_DAYUSE;
    }
  }

  // 네이버 (무통장아님) → 기간에 ~ 있으면 숙박, 없으면 당일
  if (plat.includes('네이버')) {
    return period.includes('~') ? TPLCODE_STAY : TPLCODE_DAYUSE;
  }

  // 여기어때 (숙박만 존재)
  if (plat.includes('여기어때')) {
    return TPLCODE_STAY;
  }

  // 그 외 → 숙박 기본
  return TPLCODE_STAY;
}

/** 2) "#{파싱내용}"에 들어갈 문자열 */
function buildParsingContent(data) {
  return `
- 예약번호: ${data.예약번호 || ''}
- 예약자: ${data.예약자 || ''}
- 전화번호: ${data.전화번호 || ''}
- 이용객실: ${data.이용객실 || ''}
- 이용기간: ${data.이용기간 || ''}
- 수량: ${data.수량 || '(복수객실)'}
- 옵션: ${data.옵션 || '없음'}
- 총 이용 인원: ${data.총이용인원 || ''}
- 입실시간: ${data.입실시간 || ''}
- 결제금액: ${data.결제금액 || ''}`.trim();
}

/** 3) 템플릿 코드에 따라 본문 치환 */
function buildTemplateMessage(tplCode, parsingText) {
  if (tplCode === TPLCODE_STAY) {
    return TEMPLATE_STAY.replace('#{파싱내용}', parsingText);
  } 
  else if (tplCode === TPLCODE_DAYUSE) {
    return TEMPLATE_DAYUSE.replace('#{파싱내용}', parsingText);
  } 
  else {
    // TY_7495 (무통장/수기입력)
    return TEMPLATE_DEPOSIT.replace('#{파싱내용}', parsingText);
  }
}
