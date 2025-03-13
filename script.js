/** =========================================
 *  [1] 전역 설정
 * ========================================= */
const gasUrl = 'https://script.google.com/macros/s/AKfycbxKhh3JZpdomhO8x0rkGyA33-F75x0W6S3zBBMVVGOEpw8ggs3Q_SWgha0j2LQlixg_/exec';
// ↑ 여기로 교체하세요 (새로운 GAS 웹 앱 URL)
// ?mode=password 요청 시, { password: 'A1셀값' } 형태로 응답

/** =========================================
 *  [2] 페이지 로드 시점 초기 처리
 * ========================================= */
window.onload = function() {
  checkAuth();
  // 기본 탭은 '붙여넣기'로 보여주기
  showTab('paste');
};

/**
 * 로컬스토리지에서 'jamjam_auth' 값 확인해
 * - 이미 'true'이면 (로그인 상태) → 앱 화면(#app) 표시
 * - 아니면 로그인 화면(#loginScreen) 표시
 */
function checkAuth() {
  const hasAuth = localStorage.getItem('jamjam_auth') === 'true';
  const loginDiv = document.getElementById('loginScreen');
  const appDiv = document.getElementById('app');

  if (hasAuth) {
    // 로그인 상태
    loginDiv.style.display = 'none';
    appDiv.style.display = 'block';
  } else {
    // 미로그인 상태
    loginDiv.style.display = 'block';
    appDiv.style.display = 'none';
  }
}

/**
 * [확인] 버튼 클릭 시 (비밀번호 입력 처리)
 */
async function doLogin() {
  const inputPassword = document.getElementById('passwordInput').value.trim();
  if (!inputPassword) {
    alert("비밀번호를 입력하세요.");
    return;
  }

  // GAS에서 스프레드시트 A1 비밀번호 가져오기
  const realPassword = await fetchPasswordFromGAS();
  if (!realPassword) {
    alert("비밀번호 조회에 실패했습니다.");
    return;
  }

  // 사용자 입력값과 비교
  if (inputPassword === realPassword) {
    // 로그인 성공 → 로컬스토리지에 기록
    localStorage.setItem('jamjam_auth', 'true');
    checkAuth(); // 화면 토글(로그인 화면 숨기고 앱 화면 보여주기)
  } else {
    alert("비밀번호가 틀립니다.");
  }
}

/**
 * 구글 앱 스크립트로부터 비밀번호(A1셀) 가져오기
 */
async function fetchPasswordFromGAS() {
  try {
    const response = await fetch(gasUrl + '?mode=password');
    const data = await response.json(); // { password: '...' }
    return data.password;
  } catch (err) {
    console.error(err);
    return '';
  }
}

/** =========================================
 *  [3] '붙여넣기'와 '수기작성' 탭 전환 로직
 * ========================================= */
function showTab(tabName) {
  const pasteTab = document.getElementById('tabPaste');
  const manualTab = document.getElementById('tabManual');

  const pasteBtn = document.getElementById('tabPasteBtn');
  const manualBtn = document.getElementById('tabManualBtn');

  if (tabName === 'paste') {
    pasteTab.style.display = 'block';
    manualTab.style.display = 'none';
    pasteBtn.classList.add('active');
    manualBtn.classList.remove('active');
  } else {
    pasteTab.style.display = 'none';
    manualTab.style.display = 'block';
    pasteBtn.classList.remove('active');
    manualBtn.classList.add('active');
  }
}

/** =========================================
 *  [4] 예약 정보 파싱 로직 (붙여넣기 용)
 * ========================================= */
// 플랫폼 감지
function detectPlatform(text) {
  if (text.includes("야놀자")) return "야놀자";
  if (text.includes("여기어때")) return "여기어때";
  return "네이버";
}

// 텍스트 파싱 진입점
function parseReservation(text) {
  const platform = detectPlatform(text);
  
  if (platform === "네이버") return parseNaverReservation(text);
  if (platform === "야놀자") return parseYanoljaReservation(text);
  if (platform === "여기어때") return parseHereReservation(text);

  // 혹시 구분 못 하면 기본 네이버로 반환
  return parseNaverReservation(text);
}

/** ---------- 네이버 파싱 함수 ---------- */
function parseNaverReservation(text) {
  const lines = text.split('\n').map(line => line.trim());

  // 특정 키워드가 포함된 줄에서 값을 추출
  const getValue = (keyword) => {
    const line = lines.find(l => l.includes(keyword));
    return line ? line.replace(keyword, '').trim() : '';
  };

  // 예약자 / 전화번호
  let visitorLine = lines.find(line => line.includes('방문자'));
  let 예약자 = '';
  let 전화번호 = '';
  if (visitorLine) {
    const visitorMatch = visitorLine.match(/방문자\s*(.+)\((.+)\)/);
    if (visitorMatch) {
      예약자 = visitorMatch[1].trim();
      전화번호 = visitorMatch[2].trim();
    }
  } else {
    예약자 = getValue('예약자');
    전화번호 = getValue('전화번호');
  }

  // 객실
  let siteLine = lines.find(line => line.includes('사이트'));
  let 이용객실 = '';
  if (siteLine) {
    const rooms = ['대형카라반', '복층우드캐빈', '파티룸', '몽골텐트'];
    const normalizedSiteLine = siteLine.replace(/\s+/g, '');
    이용객실 = rooms.find(room => normalizedSiteLine.includes(room));
    if (이용객실 === '대형카라반') 이용객실 = '대형 카라반';
    if (이용객실 === '복층우드캐빈') 이용객실 = '복층 우드캐빈';
  }

  // 옵션
  const optionsStartIndex = lines.findIndex(line => line.includes('옵션'));
  let optionsEndIndex = lines.findIndex(line => line.includes('요청사항'));
  if (optionsEndIndex === -1) {
    optionsEndIndex = lines.findIndex(line => line.includes('유입경로'));
  }
  const optionLines = optionsStartIndex !== -1
    ? lines.slice(optionsStartIndex + 1, optionsEndIndex).filter(Boolean)
    : [];
  
  const unwantedOptions = [
    '인원수를 꼭 체크해주세요.',
    '수영장 및 외부시설 안내',
    '객실 시설 안내',
    '당일캠핑 안내',
    '무통장입금 안내',
    'Please make sure to check the number of people.',
    'Information on swimming pools and external facilities',
    'Room Facilities Guide'
  ];
  const filteredOptions = optionLines.filter(line =>
    !unwantedOptions.some(unwanted => line.includes(unwanted))
  );

  // 총 이용 인원 정보
  let totalPeopleIndex = lines.findIndex(line => line.includes('총 이용 인원 정보'));
  let 총이용인원 = '';
  if (totalPeopleIndex !== -1 && totalPeopleIndex + 1 < lines.length) {
    총이용인원 = lines[totalPeopleIndex + 1].trim();
  }

  // 입실 시간
  let checkInTimeIndex = lines.findIndex(line => line.includes('입실 시간 선택'));
  let 입실시간 = '';
  if (checkInTimeIndex !== -1 && checkInTimeIndex + 1 < lines.length) {
    입실시간 = lines[checkInTimeIndex + 1].trim();
  }

  // 결제 금액
  const 결제예상금액 = getValue('결제예상금액');
  const 결제금액 = getValue('결제금액');

  // 무통장 여부
  const 무통장여부 = 결제예상금액 ? true : "";
  const 예약플랫폼 = 무통장여부 ? '네이버무통장' : '네이버';

  return {
    예약번호: getValue('예약번호'),
    예약자,
    전화번호,
    이용객실,
    이용기간: getValue('이용기간'),
    수량: getValue('수량'),
    옵션: filteredOptions.join(', '),
    총이용인원,
    입실시간,
    결제금액: 결제금액 || 결제예상금액,
    예약플랫폼,
    무통장여부
  };
}

/** ---------- 야놀자 파싱 함수 ---------- */
function parseYanoljaReservation(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

  const 예약번호 = lines[3];
  const 객실라인 = lines.find(line => 
    line.includes('카라반') || line.includes('우드캐빈') || line.includes('파티룸') || line.includes('몽골')
  );
  const 이용객실 = 객실라인 ? 객실라인.replace(/\(.*\)/, '').trim() : '';

  const 금액라인 = lines.find(line => line.includes('원'));
  const 결제금액 = 금액라인 
    ? 금액라인.replace('원', '').replace(/,/g, '').trim() + '원' 
    : '';

  const 예약자라인 = lines.find(line => line.includes('/'));
  let 예약자 = '';
  let 전화번호 = '';
  if (예약자라인) {
    const splitted = 예약자라인.split('/');
    예약자 = splitted[0].trim();
    전화번호 = splitted[1] ? splitted[1].trim() : '';
  }

  const 체크인라인 = lines.find(line => line.includes('~'));
  const idx = lines.indexOf(체크인라인);
  const 체크아웃라인 = idx !== -1 ? lines[idx + 1] : '';

  const 이용유형 = lines[1] || '';
  let 이용기간 = '';
  let 입실시간 = '';

  const formatDate = date => {
    // YYYY-MM-DD(요일) 형태 → YYYY. M. D.(요일)
    const match = date.match(/(\d{4})-(\d{2})-(\d{2})\((.)\)/);
    if (!match) return date;
    const [y, m, d, day] = match.slice(1);
    return `${Number(y)}. ${Number(m)}. ${Number(d)}.(${day})`;
  };

  if (이용유형.includes('대실')) {
    // 대실
    if (체크인라인) {
      이용기간 = formatDate(체크인라인.split(' ')[0]);
      const 입실시간Match = 체크인라인.match(/\d{2}:\d{2}/);
      const 퇴실시간Match = 체크아웃라인.match(/\d{2}:\d{2}/);
      입실시간 = (입실시간Match && 퇴실시간Match)
        ? `${입실시간Match[0]}~${퇴실시간Match[0]}`
        : '';
    }
  } else {
    // 숙박
    if (체크인라인) {
      const inDateStr = 체크인라인.split(' ')[0];
      const outDateStr = 체크아웃라인.split(' ')[0];
      이용기간 = `${formatDate(inDateStr)}~${formatDate(outDateStr)}`;
      const 입실시간Match = 체크인라인.match(/\d{2}:\d{2}/);
      const 퇴실시간Match = 체크아웃라인.match(/\d{2}:\d{2}/);
      입실시간 = `[숙박] ${(입실시간Match ? 입실시간Match[0] : '')} 입실 / ${(퇴실시간Match ? 퇴실시간Match[0] : '')} 퇴실`;
    }
  }

  return {
    예약번호,
    예약자,
    전화번호,
    이용객실,
    이용기간,
    수량: '1', 
    옵션: '',
    총이용인원: '대인2',
    입실시간,
    결제금액,
    예약플랫폼: '야놀자',
    무통장여부: ''
  };
}

/** ---------- 여기어때 파싱 함수 ---------- */
function parseHereReservation(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

  const 예약번호라인 = lines.find(line => line.includes('예약번호:'));
  const 예약번호 = 예약번호라인 
    ? 예약번호라인.split(':')[1].trim() 
    : '';

  const 객실정보라인 = lines.find(line => line.includes('객실정보:'));
  const 객실정보 = 객실정보라인 
    ? 객실정보라인.split('/')[1].trim() 
    : '';

  const 판매금액라인 = lines.find(line => line.includes('판매금액:'));
  const 결제금액 = 판매금액라인 
    ? 판매금액라인.split(':')[1].trim() 
    : '';

  const 예약자라인 = lines.find(line => line.includes('예약자명 :'));
  const 예약자 = 예약자라인
    ? 예약자라인.split(':')[1].trim()
    : '';

  const 안심번호라인 = lines.find(line => line.includes('안심번호:'));
  const 전화번호 = 안심번호라인
    ? 안심번호라인.split(':')[1].trim()
    : '';

  const 입실일시라인 = lines.find(line => line.includes('입실일시:'));
  const 퇴실일시라인 = lines.find(line => line.includes('퇴실일시:'));

  // 예약번호에서 YYMMDD 추출
  const 예약날짜Match = 예약번호.match(/^(\d{2})(\d{2})(\d{2})/);
  let 예약날짜 = new Date();
  if (예약날짜Match) {
    const 예약연도 = Number('20' + 예약날짜Match[1]);
    const 예약월 = Number(예약날짜Match[2]);
    const 예약일 = Number(예약날짜Match[3]);
    예약날짜 = new Date(예약연도, 예약월 - 1, 예약일);
  }

  // 날짜 포맷
  const formatDate = (dateStr, refDate) => {
    const match = dateStr.match(/(\d+)\/(\d+)\s*\((.)\)/);
    if (!match) return dateStr;
    const [_, m, d, day] = match;
    let year = refDate.getFullYear();
    const targetDate = new Date(year, Number(m) - 1, Number(d));
    if (targetDate < refDate) {
      year += 1;
    }
    return `${year}. ${Number(m)}. ${Number(d)}.(${day})`;
  };

  let 입실날짜 = '';
  let 퇴실날짜 = '';
  let 이용기간 = '';
  let 입실시간 = '';

  if (입실일시라인 && 퇴실일시라인) {
    입실날짜 = formatDate(입실일시라인, 예약날짜);
    퇴실날짜 = formatDate(퇴실일시라인, 예약날짜);
    이용기간 = `${입실날짜}~${퇴실날짜}`;

    const inMatch = 입실일시라인.match(/\d{2}:\d{2}/);
    const outMatch = 퇴실일시라인.match(/\d{2}:\d{2}/);
    입실시간 = `[숙박] ${(inMatch ? inMatch[0] : '')} 입실 / ${(outMatch ? outMatch[0] : '')} 퇴실`;
  }

  return {
    예약번호,
    예약자,
    전화번호,
    이용객실: 객실정보,
    이용기간,
    수량: '1',
    옵션: '',
    총이용인원: '대인2',
    입실시간,
    결제금액,
    예약플랫폼: '여기어때',
    무통장여부: ''
  };
}

/** =========================================
 *  [5] 수기작성 모드에서의 데이터 구성
 * ========================================= */

/** 날짜/시각 기반 예약번호 생성 (YYYYMMDDHHmmss) */
function generateReservationNumber() {
  const d = new Date();
  const YYYY = d.getFullYear().toString();
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const DD = String(d.getDate()).padStart(2, '0');
  const HH = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return YYYY + MM + DD + HH + mm + ss;
}

/** 수기작성 폼의 값들을 하나의 객체로 반환 */
function getManualReservationData() {
  return {
    예약번호: generateReservationNumber(),            // 자동생성
    예약자: document.getElementById('manualGuest').value.trim(),
    전화번호: document.getElementById('manualPhone').value.trim(),
    이용객실: document.getElementById('manualRoom').value.trim(),
    이용기간: document.getElementById('manualPeriod').value.trim(),
    수량: document.getElementById('manualCount').value.trim(),
    옵션: document.getElementById('manualOption').value.trim(),
    총이용인원: document.getElementById('manualTotalPeople').value.trim(),
    입실시간: document.getElementById('manualCheckinTime').value.trim(),
    결제금액: document.getElementById('manualPayment').value.trim(),
    예약플랫폼: '수기입력',       // 수기작성 탭은 항상 '수기입력'
    무통장여부: true             // 대부분 무통장이므로 true 처리
  };
}

/** 현재 활성 탭이 '수기작성'인지 판별 */
function isManualTabActive() {
  return document.getElementById('tabManual').style.display === 'block';
}

/** =========================================
 *  [6] 버튼 / 기능 함수
 * ========================================= */

/** 파싱 결과 보기 */
function processReservation() {
  let data;
  if (isManualTabActive()) {
    // 수기작성 탭
    data = getManualReservationData();
  } else {
    // 붙여넣기 탭
    const text = document.getElementById('inputData').value;
    data = parseReservation(text);
  }
  document.getElementById('outputData').textContent = JSON.stringify(data, null, 2);
}

/** 스프레드시트 전송 */
function sendToSheet() {
  let data;
  
  // [1] 현재 활성 탭(수기입력 or 붙여넣기)에 따라 data 가져오기
  if (isManualTabActive()) {
    // 수기작성 모드
    data = getManualReservationData();
  } else {
    // 붙여넣기 모드
    const text = document.getElementById('inputData').value;
    data = parseReservation(text);
  }

  // [2] 서버에서 인식할 파라미터 구성
  //     GAS doGet(e)에서 e.parameter.예약번호 / e.parameter.예약자 ... 식으로 받을 예정
  //     (옵션은 쉼표를 줄바꿈으로 바꾸어 보내면, 스프레드시트에서 보기 편함)
  const params = new URLSearchParams({
    예약번호:      data.예약번호       || "",
    예약자:       data.예약자        || "",
    전화번호:     data.전화번호      || "",
    이용객실:     data.이용객실      || "",
    이용기간:     data.이용기간      || "",
    수량:         data.수량          || "",
    옵션:         data.옵션 ? data.옵션.replace(/, /g, '\n') : "",
    총이용인원:   data.총이용인원    || "",
    입실시간:     data.입실시간      || "",
    결제금액:     data.결제금액      || "",
    예약플랫폼:   data.예약플랫폼    || ""
    // 필요 시 무통장여부 등 다른 필드도 추가 가능
  });

  // [3] 최종 URL = gasUrl + '?예약번호=...&예약자=...&...'
  const finalUrl = gasUrl + '?' + params.toString();

  // [4] fetch로 GET 요청
  fetch(finalUrl)
    .then(response => response.text())
    .then(msg => {
      alert(msg);  // 예) "예약이 성공적으로 저장되었습니다."
    })
    .catch(err => {
      alert('전송 중 오류 발생: ' + err);
    });
}

/** 안내문자 양식 적용 및 클립보드 복사 */
function generateReservationMessage() {
  let data;
  let rawText = '';

  if (isManualTabActive()) {
    data = getManualReservationData();
    // 수기작성 시에는 전체 텍스트가 따로 없으므로 rawText는 비워두겠습니다.
  } else {
    rawText = document.getElementById('inputData').value;
    data = parseReservation(rawText);
  }

  let message = '';

  // 파싱 내용 정리
  const formattedParsedData = `
- 예약번호: ${data.예약번호}
- 예약자: ${data.예약자}
- 전화번호: ${data.전화번호}
- 이용객실: ${data.이용객실}
- 이용기간: ${data.이용기간}
- 수량: ${data.수량}
- 옵션: ${data.옵션 ? data.옵션.replace(/, /g, '\n') : '없음'}
- 총 이용 인원: ${data.총이용인원}
- 입실시간: ${data.입실시간}
- 결제금액: ${data.결제금액}
- 예약플랫폼: ${data.예약플랫폼}`;

  // 무통장
  if (rawText.includes('무통장할인') || data.예약플랫폼 === '네이버무통장' || data.무통장여부 === true) {
    message = `고객님 예약 신청해 주셔서 진심으로 감사드립니다.

${formattedParsedData}

*추가 옵션 설정을 정확하게 선택해 주셔야 되며 체크인 시 현장 결제도 가능합니다.
 (인원추가, 시간연장, 얼리체크인, 레이트체크아웃 / 바베큐, 불멍, 온수풀, 고기세트 별도)

*숙박은 “15시”부터 입실 가능하며 수영은 13시부터 이용하실 수 있습니다.
얼리체크인을 원하실 경우 카톡으로 별도 문의주세요.

▶계좌번호  우리 1005 504 540028 (주) 유연음

※입금 시 입금자, 예약자명이 동일해야 하며, 예약 안내 수신 후 "2시간 이내" 입금 확인이 안 될 시 자동 취소 처리됩니다.`;
  }
  // 네이버 당일캠핑 (기간에 '~' 없는 경우)
  else if (data.예약플랫폼 === '네이버' && data.이용기간 && !data.이용기간.includes('~')) {
    message = `[양주잼잼] 예약해 주셔서 진심으로 감사합니다♬

*기본 이용시간은 6시간이며 예약해주신 방문시간을 엄수해 주세요.

${formattedParsedData}

*2인 기준 요금이며 인원추가 미선택 시 현장에서 추가결제해 주셔야 합니다.
*옵션(바베큐, 불멍, 고기세트)은 별도이며 체크인 시 현장 결제도 가능합니다.
*대형풀 무료 이용 / 온수풀 유료 이용
*예약 시 시간연장 신청을 안 할 경우에는 추가 시간연장이 불가할 수 있습니다. 당일 일정에 따라 입실 후에도 시간연장이 가능할 수 있으니 별도 문의 바랍니다.

예약 내용 확인해보시고 수정 또는 변경해야할 내용이 있다면 말씀 부탁드립니다.

(광고) 
양손 가볍게, 잼잼 바베큐 키트 출시🍖
https://litt.ly/jamjam_bbq`;
  }
  // 네이버 숙박
  else if (data.예약플랫폼 === '네이버') {
    message = `[양주잼잼] 예약해 주셔서 진심으로 감사합니다♬

${formattedParsedData}

*기준인원 2인 기준 요금이며 인원추가 미선택 시 현장에서 추가결제해 주셔야 합니다.
*옵션(바베큐, 불멍, 고기세트)은 별도이며 체크인 시 현장 결제도 가능합니다.
*대형풀 무료 이용 / 온수풀 유료 이용

*숙박은 “15시”부터 입실 가능하며 수영장 이용은 13시부터 이용하실 수 있습니다.
얼리체크인/레이트체크아웃을 원하실 경우 카톡 또는 문자로 별도 문의주세요.

☆쿠폰 (이용완료 후에 사용 가능)
-택시비 최대 10000원 지원 쿠폰
-재방문 고객 10000원 할인 쿠폰

체크인 또는 체크아웃 하실 때 관리동에 말씀해 주시면 환불처리 도와드립니다.^^
예약 내용 확인해보시고 수정 또는 변경해야할 내용이 있다면 말씀 부탁드립니다.

(광고) 
양손 가볍게, 잼잼 바베큐 키트 출시🍖
https://litt.ly/jamjam_bbq`;
  }
  // 야놀자
  else if (data.예약플랫폼 === '야놀자') {
    message = `[양주잼잼] 예약해 주셔서 진심으로 감사합니다♬

야놀자로 예약하셨다면
여기로 성함과 전화번호를 꼭 남겨주세요!

${formattedParsedData}

*기준인원 2인 기준 요금이며 인원추가 미선택 시 현장에서 추가결제해 주셔야 합니다.
*옵션(바베큐, 불멍, 고기세트)은 별도이며 체크인 시 현장 결제도 가능합니다.
*대형풀 무료 이용 / 온수풀 유료 이용

*대실 이용시간은 6시간이며 예약해주신 방문시간을 엄수해 주세요.
*숙박은 “15시”부터 입실 가능하며 수영장 이용은 13시부터 이용하실 수 있습니다.

체크인 또는 체크아웃 하실 때 관리동에 말씀해 주시면 환불처리 도와드립니다.^^
예약 내용 확인해보시고 수정 또는 변경해야할 내용이 있다면 말씀 부탁드립니다.

(광고)
양손 가볍게, 잼잼 바베큐 키트 출시🍖
https://litt.ly/jamjam_bbq`;
  }
  // 여기어때
  else if (data.예약플랫폼 === '여기어때') {
    message = `[양주잼잼] 예약해 주셔서 진심으로 감사합니다♬

여기어때로 예약하셨다면
여기로 성함과 전화번호를 꼭 남겨주세요!

${formattedParsedData}

*기준인원 2인 기준 요금이며 인원추가 미선택 시 현장에서 추가결제해 주셔야 합니다.
*옵션(바베큐, 불멍, 고기세트)은 별도이며 체크인 시 현장 결제도 가능합니다.
*대형풀 무료 이용 / 온수풀 유료 이용

*숙박은 “15시”부터 입실 가능하며 수영장 이용은 13시부터 이용하실 수 있습니다.
얼리체크인/레이트체크아웃을 원하실 경우 카톡 또는 문자로 별도 문의주세요.

☆쿠폰 (이용완료 후에 사용 가능)
-택시비 최대 10000원 지원 쿠폰
-재방문 고객 10000원 할인 쿠폰

체크인 또는 체크아웃 하실 때 관리동에 말씀해 주시면 환불처리 도와드립니다.^^
예약 내용 확인해보시고 수정 또는 변경해야할 내용이 있다면 말씀 부탁드립니다.

(광고)
양손 가볍게, 잼잼 바베큐 키트 출시🍖
https://litt.ly/jamjam_bbq`;
  }

  // 결과 표시 + 클립보드 복사
  document.getElementById('outputData').textContent = message;
  navigator.clipboard.writeText(message)
    .then(() => alert('안내문자가 클립보드에 복사되었습니다.'));
}

/** =========================================
 *  [7] 모달 (양식 수정) 관련
 * ========================================= */
function openTemplateModal() {
  document.getElementById('templateBank').value = localStorage.getItem('templateBank') || defaultTemplates.bank;
  document.getElementById('templateNaverStay').value = localStorage.getItem('templateNaverStay') || defaultTemplates.naverStay;
  document.getElementById('templateNaverDay').value = localStorage.getItem('templateNaverDay') || defaultTemplates.naverDay;
  document.getElementById('templateYanolja').value = localStorage.getItem('templateYanolja') || defaultTemplates.yanolja;
  document.getElementById('templateHere').value = localStorage.getItem('templateHere') || defaultTemplates.here;

  document.getElementById('templateModal').style.display = 'block';
}

function closeTemplateModal() {
  document.getElementById('templateModal').style.display = 'none';
}

/** 기본 안내문자 양식 */
const defaultTemplates = {
  bank: `고객님 예약 신청해 주셔서 진심으로 감사드립니다.

[[파싱된 내용]]

*추가 옵션 설정을 정확하게 선택해 주셔야 되며 체크인 시 현장 결제도 가능합니다.
(인원추가, 시간연장, 얼리체크인, 레이트체크아웃 / 바베큐, 불멍, 온수풀, 고기세트 별도)

*숙박은 “15시”부터 입실 가능하며 수영은 13시부터 이용하실 수 있습니다.
얼리체크인을 원하실 경우 카톡으로 별도 문의주세요.

▶계좌번호  우리 1005 504 540028 (주) 유연음

※입금 시 입금자, 예약자명이 동일해야 하며, 예약 안내 수신 후 "2시간 이내" 입금 확인이 안 될 시 자동 취소 처리됩니다.`,
  
  naverStay: `[양주잼잼] 예약해 주셔서 진심으로 감사합니다♬

[[파싱된 내용]]

*기준인원 2인 기준 요금이며 인원추가 미선택 시 현장에서 추가결제해 주셔야 합니다.
*옵션(바베큐, 불멍, 고기세트)은 별도이며 체크인 시 현장 결제도 가능합니다.
*대형풀 무료 이용 / 온수풀 유료 이용

*숙박은 “15시”부터 입실 가능하며 수영장 이용은 13시부터 이용하실 수 있습니다.
얼리체크인/레이트체크아웃을 원하실 경우 카톡 또는 문자로 별도 문의주세요.

☆쿠폰 (이용완료 후에 사용 가능)
-택시비 최대 10000원 지원 쿠폰
-재방문 고객 10000원 할인 쿠폰

체크인 또는 체크아웃 하실 때 관리동에 말씀해 주시면 환불처리 도와드립니다.^^
예약 내용 확인해보시고 수정 또는 변경해야할 내용이 있다면 말씀 부탁드립니다.

(광고) 
양손 가볍게, 잼잼 바베큐 키트 출시🍖
https://litt.ly/jamjam_bbq`,

  naverDay: `[양주잼잼] 예약해 주셔서 진심으로 감사합니다♬

*기본 이용시간은 6시간이며 예약해주신 방문시간을 엄수해 주세요.

[[파싱된 내용]]

*2인 기준 요금이며 인원추가 미선택 시 현장에서 추가결제해 주셔야 합니다.

*옵션(바베큐, 불멍, 고기세트)은 별도이며 체크인 시 현장 결제도 가능합니다.

*대형풀 무료 이용 / 온수풀 유료 이용

예약 내용 확인해보시고 수정 또는 변경해야할 내용이 있다면 말씀 부탁드립니다.`,

  yanolja: `[양주잼잼] 예약해 주셔서 진심으로 감사합니다♬

야놀자로 예약하셨다면
여기로 성함과 전화번호를 꼭 남겨주세요!

[[파싱된 내용]]`,

  here: `[양주잼잼] 예약해 주셔서 진심으로 감사합니다♬

여기어때로 예약하셨다면
여기로 성함과 전화번호를 꼭 남겨주세요!

[[파싱된 내용]]`
};

/** 양식 저장하기 */
function saveTemplates() {
  localStorage.setItem('templateBank', document.getElementById('templateBank').value);
  localStorage.setItem('templateNaverStay', document.getElementById('templateNaverStay').value);
  localStorage.setItem('templateNaverDay', document.getElementById('templateNaverDay').value);
  localStorage.setItem('templateYanolja', document.getElementById('templateYanolja').value);
  localStorage.setItem('templateHere', document.getElementById('templateHere').value);

  alert('양식이 저장되었습니다.');
  closeTemplateModal();
}
