/** =========================================
 *  알림톡 발송용 전역 설정
 * ========================================= */
const ALIMTALK_API_URL = 'https://kakaoapi.aligo.in/akv10/alimtalk/send/';
const ALIMTALK_API_KEY = 's2qfjf9gxkhzv0ms04bt54f3w8w6b9jd';
const ALIMTALK_USER_ID = 'yangjujamjam';
const ALIMTALK_SENDERKEY = 'fc0570b6c7f7785506ea85b62838fd6fb37a3bcc';
const ALIMTALK_SENDER   = '01059055559';

const DEFAULT_TPLCODE = 'TY_7495';
const DEFAULT_TEMPLATE =
`고객님 예약 신청해 주셔서 
진심으로 감사드립니다.

#{파싱내용}

*추가 옵션은 체크인 시 현장 결제 가능합니다.
(인원추가, 얼리체크인, 레이트체크아웃, 바베큐, 불멍, 온수풀, 고기세트 등)

*숙박은 “15시”부터 입실 가능하며 수영은 13시부터 이용하실 수 있습니다. 
얼리체크인을 원하실 경우 카톡으로 별도 문의주세요.

▶계좌번호  우리 1005 504 540028 (주) 유연음

※입금 시 입금자, 예약자명이 동일해야 하며, 예약 안내 수신 후 \"2시간 이내\" 입금 확인이 안 될 시 자동 취소 처리됩니다.`;

/** =========================================
 *  알림톡 발송 확인창
 * ========================================= */
function confirmAlimtalk() {
  const ok = confirm("알림톡을 보내시겠습니까?");
  if (!ok) return;
  sendAlimtalk();
}

/** =========================================
 *  예약 데이터 가져오기 (수기작성/붙여넣기)
 * ========================================= */
function getReservationData() {
  return isManualTabActive()
    ? getManualReservationDataSingle()
    : parseReservation(document.getElementById('inputData').value);
}

/** =========================================
 *  옵션 형식 정리 (줄바꿈, ▶ 추가)
 * ========================================= */
function formatOptions(optionString) {
  if (!optionString) return '없음';
  return optionString.split(',').map(opt => `▶${opt.trim()}`).join('\n');
}

/** =========================================
 *  템플릿과 코드 선택
 * ========================================= */
function selectTemplate(data) {
  if (data.무통장여부) {
    return { tplCode: DEFAULT_TPLCODE, tplContent: DEFAULT_TEMPLATE };
  }

  const isAccommodation = data.이용기간.includes('~');

  if (isAccommodation) {
    return {
      tplCode: 'TY_8947',
      tplContent: `[양주잼잼]\n예약해 주셔서 진심으로 감사합니다♬\n\n#{파싱내용}\n\n■ 2인 초과 시, 인원추가를 미선택하셨다면 현장에서 추가결제가 필요합니다.\n■ 옵션(인원추가, 바베큐, 불멍, 온수풀)은 별도이며 현장 결제가능합니다.\n※고기 및 채소가 있는 옵션은 당일취소가 불가능합니다.\n(대형풀 무료 이용 / 온수풀 유료 이용)\n\n■ 선택하신 입실시간을 준수해주세요.\n■ 얼리체크인/레이트체크아웃은 1시간당 1인 5,000원의 추가 요금이 부과됩니다.\n이용을 원하실 경우 반드시 사전 문의 바랍니다.\n■ 수영장은 체크인 시간 2시간 전부터 이용 가능합니다.\n\n예약 내용을 확인하신 후, 수정 또는 변경 사항이 있으시면 말씀해 주시기 바랍니다.\n\n■ 환불규정\n▶ 취소수수료\n입실 10일전 - 없음\n입실 9일전 - 10%\n입실 8일전 - 20%\n입실 7일전 - 30%\n입실 6일전 - 40%\n입실 5일전 - 50%\n입실 4일전 - 60%\n입실 3일전 - 70%\n입실 2일전 ~ 당일 -  100%\n\n▶ 날짜 변경 시 수수료\n입실 10일전 - 무료\n입실 9일전 - 20,000원\n입실 6일전 - 40,000원\n입실 4일전 - 60,000원\n입실 2일전 - 변경불가\n\n - 기상악화 & 천재지변으로 인한 취소 및 환불은 어렵습니다`
    };
  }

  return {
    tplCode: 'TY_8948',
    tplContent: `[양주잼잼] 예약해 주셔서 진심으로 감사합니다♬\n■기본 이용시간은 6시간이며 예약해주신 방문시간을 엄수해 주세요.\n\n#{파싱내용}\n\n■ 2인 초과 시, 인원추가를 미선택하셨다면 현장에서 추가결제가 필요합니다.\n■ 옵션(인원추가, 바베큐, 불멍, 온수풀)은 별도이며 현장 결제가능합니다.\n※고기 및 채소가 있는 옵션은 당일취소가 불가능합니다.\n(대형풀 무료 이용 / 온수풀 유료 이용)\n\n■ 선택하신 입실시간을 준수해주세요.\n■ 얼리체크인/레이트체크아웃은 1시간당 1인 5,000원의 추가 요금이 부과됩니다.\n이용을 원하실 경우 반드시 사전 문의 바랍니다.\n■ 수영장은 체크인 시간 2시간 전부터 이용 가능합니다.\n\n예약 내용을 확인하신 후, 수정 또는 변경 사항이 있으시면 말씀해 주시기 바랍니다.\n\n■ 환불규정\n▶ 취소수수료\n입실 10일전 - 없음\n입실 9일전 - 10%\n입실 8일전 - 20%\n입실 7일전 - 30%\n입실 6일전 - 40%\n입실 5일전 - 50%\n입실 4일전 - 60%\n입실 3일전 - 70%\n입실 2일전 ~ 당일 -  100%\n\n - 기상악화 & 천재지변으로 인한 취소 및 환불은 어렵습니다`
  };
}

/** =========================================
 *  알림톡 발송 메인 로직
 * ========================================= */
async function sendAlimtalk() {
  const data = getReservationData();
  const { tplCode, tplContent } = selectTemplate(data);

  const parsingContent = `- 예약번호: ${data.예약번호}\n- 예약자: ${data.예약자}\n- 전화번호: ${data.전화번호}\n- 이용객실: ${data.이용객실}\n- 이용기간: ${data.이용기간}\n- 수량: ${data.수량 || '(복수객실)'}\n- 옵션:\n${formatOptions(data.옵션)}\n- 총 이용 인원: ${data.총이용인원}\n- 입실시간: ${data.입실시간}\n- 결제금액: ${data.결제금액}`;

  const messageText = tplContent.replace('#{파싱내용}', parsingContent);

  const params = new URLSearchParams({
    apikey: ALIMTALK_API_KEY,
    userid: ALIMTALK_USER_ID,
    senderkey: ALIMTALK_SENDERKEY,
    tpl_code: tplCode,
    sender: ALIMTALK_SENDER,
    receiver_1: data.전화번호.replace(/\D/g,''),
    recvname_1: data.예약자 || '고객님',
    subject_1: '예약 안내',
    message_1: messageText,
    failover: 'N'
  });

  fetch(ALIMTALK_API_URL, { method: 'POST', headers: {'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'}, body: params })
  .then(res => res.json())
  .then(result => alert(result.code === 0 ? "알림톡 발송 성공" : `발송 실패: ${result.message}`))
  .catch(() => alert("알림톡 발송 중 오류 발생"));
}
