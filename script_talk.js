/** =========================================
 *  [알림톡 전용] 전역 설정
 * ========================================= */
const ALIMTALK_API_URL = 'https://kakaoapi.aligo.in/akv10/alimtalk/send/';
const ALIMTALK_API_KEY = 's2qfjf9gxkhzv0ms04bt54f3w8w6b9jd';         // 알리고에서 받은 API Key
const ALIMTALK_USER_ID = 'yangjujamjam';         // 알리고 사용자 ID
const ALIMTALK_SENDERKEY = 'fc0570b6c7f7785506ea85b62838fd6fb37a3bcc';    // 발신프로필키
const ALIMTALK_TPLCODE  = 'TY_7495';       // 승인된 템플릿 코드
const ALIMTALK_SENDER   = '01059055559';         // 발신번호(카카오 비즈 프로필)

// 승인된 템플릿 본문(개행 포함) - #{파싱내용} 위치에 실제 데이터 삽입
const ALIMTALK_TEMPLATE = 
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
 *  [A] 확인창(Yes/No) → 알림톡 발송
 * ========================================= */
function confirmAlimtalk() {
  // 확인창
  const ok = confirm("알림톡을 보내시겠습니까?");
  if(!ok) {
    // 취소 누르면 종료
    return;
  }
  // 확인 누르면 진행
  sendAlimtalk();
}

/** =========================================
 *  알림톡 발송 함수
 * ========================================= */
async function sendAlimtalk() {
  let data;

  // script.js에 있는 함수 활용
  if (isManualTabActive()) {
    // 수기작성 탭
    data = getManualReservationDataSingle();
  } else {
    // 붙여넣기 탭
    const text = document.getElementById('inputData').value;
    data = parseReservation(text);
  }

  // 무통장 여부만 알림톡 발송 (예시)
  if (!data.무통장여부) {
    alert("무통장 예약건이 아니므로 알림톡 발송을 지원하지 않습니다.");
    return;
  }

  // #{파싱내용}에 들어갈 예약정보
  const parsingContent = `
- 예약번호: ${data.예약번호}
- 예약자: ${data.예약자}
- 전화번호: ${data.전화번호}
- 이용객실: ${data.이용객실}
- 이용기간: ${data.이용기간}
- 수량: ${data.수량 || '(복수객실)'}
- 옵션: ${data.옵션 || '없음'}
- 총 이용 인원: ${data.총이용인원}
- 입실시간: ${data.입실시간}
- 결제금액: ${data.결제금액}
`;

  // 템플릿에 삽입
  const messageText = ALIMTALK_TEMPLATE.replace('#{파싱내용}', parsingContent.trim());

  // 알리고 API 파라미터 구성
  const params = new URLSearchParams();
  params.append('apikey',    ALIMTALK_API_KEY);
  params.append('userid',    ALIMTALK_USER_ID);
  params.append('senderkey', ALIMTALK_SENDERKEY);
  params.append('tpl_code',  ALIMTALK_TPLCODE);
  params.append('sender',    ALIMTALK_SENDER);

  // 수신자 번호 (숫자만)
  const phoneOnlyNumbers = data.전화번호.replace(/[^0-9]/g,'');
  params.append('receiver_1', phoneOnlyNumbers);
  params.append('recvname_1', data.예약자 || '고객님');

  // 제목, 메시지
  params.append('subject_1', '무통장 입금 안내');
  params.append('message_1', messageText);

  // 대체문자 실패전송 Y/N
  params.append('failover', 'N');

  try {
    const response = await fetch(ALIMTALK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
      body: params.toString()
    });

    const result = await response.json();
    console.log(result);

    if (result.code === 0) {
      alert("알림톡 발송 성공: " + result.message);
    } else {
      alert("알림톡 발송 실패: " + result.message);
    }

  } catch (err) {
    console.error(err);
    alert("알림톡 발송 중 오류가 발생했습니다.");
  }
}
