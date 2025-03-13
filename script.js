/** =========================================
 *  [1] 전역 설정
 * ========================================= */
const gasUrl = 'https://script.google.com/macros/s/AKfycby2D33Ulsl5aQOjaDyLv5vePU1F9vGlSXe9Z5JhV2hLGY9Uofu4fjNQXFoGSpYs2oI5/exec';
// ↑ 여기로 교체하세요 (새로운 GAS 웹 앱 URL)

/** =========================================
 *  [2] 페이지 로드 시점 초기 처리
 * ========================================= */
window.onload = function() {
  checkAuth();
  showTab('paste');
  buildCalendar(); // 달력 초기화
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

  // 패스워드 가져오기
  const realPassword = await fetchPasswordFromGAS();
  if (!realPassword) {
    alert("비밀번호 조회에 실패했습니다.");
    return;
  }

  if (inputPassword === realPassword) {
    // 로그인 성공
    localStorage.setItem('jamjam_auth', 'true');
    checkAuth();
  } else {
    alert("비밀번호가 틀립니다.");
  }
}

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
function detectPlatform(text) {
  if (text.includes("야놀자")) return "야놀자";
  if (text.includes("여기어때")) return "여기어때";
  return "네이버";
}

function parseReservation(text) {
  const platform = detectPlatform(text);
  
  if (platform === "네이버") return parseNaverReservation(text);
  if (platform === "야놀자") return parseYanoljaReservation(text);
  if (platform === "여기어때") return parseHereReservation(text);

  // 기본은 네이버
  return parseNaverReservation(text);
}

function parseNaverReservation(text) {
  const lines = text.split('\n').map(line => line.trim());
  const getValue = (keyword) => {
    const line = lines.find(l => l.includes(keyword));
    return line ? line.replace(keyword, '').trim() : '';
  };

  let 예약자 = getValue('예약자');
  let 전화번호 = getValue('전화번호');
  // 혹은 방문자 (방문자 OOO(핸드폰)) 형식 처리도 가능

  // 객실
  let siteLine = lines.find(line => line.includes('사이트'));
  let 이용객실 = '';
  if (siteLine) {
    const rooms = ['대형카라반','복층우드캐빈','파티룸','몽골텐트'];
    const normalizedSiteLine = siteLine.replace(/\s+/g,'');
    이용객실 = rooms.find(room => normalizedSiteLine.includes(room)) || '';
    if (이용객실 === '대형카라반') 이용객실 = '대형 카라반';
    if (이용객실 === '복층우드캐빈') 이용객실 = '복층 우드캐빈';
  }
  
  const optionsStartIndex = lines.findIndex(line => line.includes('옵션'));
  let optionsEndIndex = lines.findIndex(line => line.includes('요청사항'));
  if (optionsEndIndex === -1) {
    optionsEndIndex = lines.findIndex(line => line.includes('유입경로'));
  }
  let filteredOptions = [];
  if (optionsStartIndex !== -1) {
    const unwantedOptions = [
      '인원수를 꼭 체크해주세요.',
      '수영장 및 외부시설 안내',
      '객실 시설 안내',
      '당일캠핑 안내',
      '무통장입금 안내'
    ];
    const optionLines = lines.slice(optionsStartIndex+1, optionsEndIndex).filter(Boolean);
    filteredOptions = optionLines.filter(line => 
      !unwantedOptions.some(unwanted => line.includes(unwanted))
    );
  }

  let 총이용인원 = '';
  let totalPeopleIndex = lines.findIndex(line => line.includes('총 이용 인원 정보'));
  if (totalPeopleIndex !== -1 && totalPeopleIndex + 1 < lines.length) {
    총이용인원 = lines[totalPeopleIndex + 1].trim();
  }

  let 입실시간 = '';
  let checkInTimeIndex = lines.findIndex(line => line.includes('입실 시간 선택'));
  if (checkInTimeIndex !== -1 && checkInTimeIndex + 1 < lines.length) {
    입실시간 = lines[checkInTimeIndex + 1].trim();
  }

  const 결제예상금액 = getValue('결제예상금액');
  const 결제금액 = getValue('결제금액');
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

function parseYanoljaReservation(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  const 예약번호 = lines[3] || '';
  const 객실라인 = lines.find(line => line.includes('카라반')||line.includes('우드캐빈')||line.includes('파티룸')||line.includes('몽골'));
  const 이용객실 = 객실라인 ? 객실라인.replace(/\(.*\)/, '').trim() : '';
  const 금액라인 = lines.find(line => line.includes('원'));
  const 결제금액 = 금액라인 ? (금액라인.replace('원','').replace(/,/g,'').trim()+'원') : '';
  
  let 예약자 = '';
  let 전화번호 = '';
  const 예약자라인 = lines.find(line => line.includes('/'));
  if (예약자라인) {
    const splitted = 예약자라인.split('/');
    예약자 = splitted[0].trim();
    전화번호 = splitted[1] ? splitted[1].trim() : '';
  }

  const 체크인라인 = lines.find(line => line.includes('~'));
  const idx = lines.indexOf(체크인라인);
  const 체크아웃라인 = idx !== -1 ? lines[idx+1] : '';
  const 이용유형 = lines[1]||'';
  let 이용기간 = '';
  let 입실시간 = '';

  const formatDate = date => {
    const m = date.match(/(\d{4})-(\d{2})-(\d{2})\((.)\)/);
    if (!m) return date;
    return `${Number(m[1])}. ${Number(m[2])}. ${Number(m[3])}.(${m[4]})`;
  };

  if (이용유형.includes('대실')) {
    if (체크인라인) {
      이용기간 = formatDate(체크인라인.split(' ')[0]);
      const inMatch = 체크인라인.match(/\d{2}:\d{2}/);
      const outMatch = 체크아웃라인.match(/\d{2}:\d{2}/);
      입실시간 = (inMatch&&outMatch)? `${inMatch[0]}~${outMatch[0]}`:'';
    }
  } else {
    if (체크인라인) {
      const inDateStr = 체크인라인.split(' ')[0];
      const outDateStr = 체크아웃라인.split(' ')[0];
      이용기간 = `${formatDate(inDateStr)}~${formatDate(outDateStr)}`;
      const inMatch = 체크인라인.match(/\d{2}:\d{2}/);
      const outMatch = 체크아웃라인.match(/\d{2}:\d{2}/);
      입실시간 = `[숙박] ${(inMatch?inMatch[0]:'')} 입실 / ${(outMatch?outMatch[0]:'')} 퇴실`;
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

function parseHereReservation(text) {
  const lines = text.split('\n').map(line=>line.trim()).filter(Boolean);
  const 예약번호라인 = lines.find(line => line.includes('예약번호:'));
  const 예약번호 = 예약번호라인 ? 예약번호라인.split(':')[1].trim() : '';
  const 객실정보라인 = lines.find(line => line.includes('객실정보:'));
  const 객실정보 = 객실정보라인 ? 객실정보라인.split('/')[1].trim() : '';
  const 판매금액라인 = lines.find(line => line.includes('판매금액:'));
  const 결제금액 = 판매금액라인 ? 판매금액라인.split(':')[1].trim() : '';
  const 예약자라인 = lines.find(line => line.includes('예약자명 :'));
  const 예약자 = 예약자라인 ? 예약자라인.split(':')[1].trim() : '';
  const 안심번호라인 = lines.find(line => line.includes('안심번호:'));
  const 전화번호 = 안심번호라인 ? 안심번호라인.split(':')[1].trim() : '';
  const 입실일시라인 = lines.find(line => line.includes('입실일시:'));
  const 퇴실일시라인 = lines.find(line => line.includes('퇴실일시:'));

  // 예약번호에서 YYMMDD 추출
  const 예약날짜Match = 예약번호.match(/^(\d{2})(\d{2})(\d{2})/);
  let 예약날짜 = new Date();
  if (예약날짜Match) {
    const y = Number('20'+예약날짜Match[1]);
    const m = Number(예약날짜Match[2]) - 1;
    const d = Number(예약날짜Match[3]);
    예약날짜 = new Date(y,m,d);
  }

  const formatDate = (dateStr, refDate) => {
    const m = dateStr.match(/(\d+)\/(\d+)\s*\((.)\)/);
    if (!m) return dateStr;
    let year = refDate.getFullYear();
    const month = Number(m[1]);
    const day = Number(m[2]);
    const dayKor = m[3];
    const targetDate = new Date(year, month-1, day);
    if (targetDate < refDate) year+=1;
    return `${year}. ${month}. ${day}.(${dayKor})`;
  };

  let 입실날짜 = '';
  let 퇴실날짜 = '';
  let 이용기간 = '';
  let 입실시간 = '';

  if(입실일시라인 && 퇴실일시라인){
    입실날짜 = formatDate(입실일시라인, 예약날짜);
    퇴실날짜 = formatDate(퇴실일시라인, 예약날짜);
    이용기간 = `${입실날짜}~${퇴실날짜}`;

    const inMatch = 입실일시라인.match(/\d{2}:\d{2}/);
    const outMatch = 퇴실일시라인.match(/\d{2}:\d{2}/);
    입실시간 = `[숙박] ${(inMatch?inMatch[0]:'')} 입실 / ${(outMatch?outMatch[0]:'')} 퇴실`;
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
 *  [5] 수기작성 모드 데이터 구성
 * ========================================= */
function generateReservationNumber() {
  const d = new Date();
  const YYYY = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const DD = String(d.getDate()).padStart(2, '0');
  const HH = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${YYYY}${MM}${DD}${HH}${mm}${ss}`;
}

function getManualReservationData() {
  return {
    예약번호: generateReservationNumber(),
    예약자: document.getElementById('manualGuest').value.trim(),
    전화번호: document.getElementById('manualPhone').value.trim(),
    이용객실: document.getElementById('manualRoom').value.trim(),
    이용기간: document.getElementById('manualPeriod').value.trim(),
    수량: document.getElementById('manualCount').value.trim(),
    옵션: document.getElementById('manualOption').value.trim(),
    총이용인원: document.getElementById('manualTotalPeople').value.trim(),
    입실시간: document.getElementById('manualCheckinTime').value.trim(),
    결제금액: document.getElementById('manualPayment').value.trim(),
    예약플랫폼: '수기입력',
    무통장여부: true
  };
}

function isManualTabActive() {
  return document.getElementById('tabManual').style.display === 'block';
}

/** =========================================
 *  [6] 버튼 / 기능 함수
 * ========================================= */
function processReservation() {
  let data;
  if (isManualTabActive()) {
    data = getManualReservationData();
  } else {
    const text = document.getElementById('inputData').value;
    data = parseReservation(text);
  }
  document.getElementById('outputData').textContent = JSON.stringify(data, null, 2);
}

function sendToSheet() {
  let data;
  if (isManualTabActive()) {
    data = getManualReservationData();
  } else {
    const text = document.getElementById('inputData').value;
    data = parseReservation(text);
  }
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
  });

  fetch(gasUrl + '?' + params.toString())
    .then(r => r.text())
    .then(msg => alert(msg))
    .catch(err => alert('전송 중 오류 발생: ' + err));
}

function generateReservationMessage() {
  let data;
  let rawText = '';

  if (isManualTabActive()) {
    data = getManualReservationData();
  } else {
    rawText = document.getElementById('inputData').value;
    data = parseReservation(rawText);
  }

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

  let message = '';
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
    // 네이버 당일
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

/** =========================================
 *  [8] 달력 관련 로직
 * ========================================= */
// 달력 상태
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

let firstSelectedDate = null;
let secondSelectedDate = null;

function buildCalendar() {
  const container = document.getElementById('calendarContainer');
  container.innerHTML = ''; // 초기화

  // 헤더 영역
  const headerDiv = document.createElement('div');
  headerDiv.className = 'calendar-header';

  const prevBtn = document.createElement('button');
  prevBtn.textContent = '<';
  prevBtn.onclick = () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    buildCalendar();
  };

  const nextBtn = document.createElement('button');
  nextBtn.textContent = '>';
  nextBtn.onclick = () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    buildCalendar();
  };

  const monthYearSpan = document.createElement('span');
  monthYearSpan.textContent = `${currentYear}년 ${currentMonth+1}월`;

  headerDiv.appendChild(prevBtn);
  headerDiv.appendChild(monthYearSpan);
  headerDiv.appendChild(nextBtn);

  container.appendChild(headerDiv);

  // 요일 헤더
  const dayNames = ['일','월','화','수','목','금','토'];
  const gridDiv = document.createElement('div');
  gridDiv.className = 'calendar-grid';

  // 1) 요일 헤더 표시
  dayNames.forEach(d => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-day inactive'; 
    dayHeader.style.fontWeight = 'bold';
    dayHeader.textContent = d;
    gridDiv.appendChild(dayHeader);
  });

  // 2) 날짜들 표시
  const firstDay = new Date(currentYear, currentMonth, 1).getDay(); 
  const lastDate = new Date(currentYear, currentMonth+1, 0).getDate(); 

  // 이전 달 공백
  for (let i = 0; i < firstDay; i++) {
    const blank = document.createElement('div');
    blank.className = 'calendar-day inactive';
    gridDiv.appendChild(blank);
  }

  // 실제 날짜
  for (let date = 1; date <= lastDate; date++) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    dayDiv.textContent = date;
    
    const thisDate = new Date(currentYear, currentMonth, date);

    // 클릭 이벤트
    dayDiv.onclick = () => onDateClick(thisDate);

    gridDiv.appendChild(dayDiv);
  }

  container.appendChild(gridDiv);

  // 날짜 하이라이트(범위선택/단일선택) 갱신
  highlightSelectedDates();
}

function onDateClick(dateObj) {
  // (1) 아직 firstSelectedDate가 없는 상태 → 첫 번째로 선택
  if (!firstSelectedDate) {
    firstSelectedDate = dateObj;
    secondSelectedDate = null;
  }
  // (2) firstSelectedDate가 있고, secondSelectedDate가 없는데
  else if (!secondSelectedDate) {
    // 만약 같은 날짜를 다시 클릭하면 => 단일 날짜로 처리
    const isSameDate = sameDay(dateObj, firstSelectedDate);
    if (isSameDate) {
      // 단일 날짜
      secondSelectedDate = null;
    } else {
      // 범위
      // 만약 dateObj가 firstSelectedDate보다 이전이라면 순서 바꿈
      if (dateObj < firstSelectedDate) {
        secondSelectedDate = firstSelectedDate;
        firstSelectedDate = dateObj;
      } else {
        secondSelectedDate = dateObj;
      }
    }
  }
  // (3) firstSelectedDate와 secondSelectedDate가 이미 있다면 → 새로 선택 시작
  else {
    firstSelectedDate = dateObj;
    secondSelectedDate = null;
  }

  highlightSelectedDates();
  updatePeriodInput();
}

// 달력에서 날짜 범위 시각화
function highlightSelectedDates() {
  const container = document.getElementById('calendarContainer');
  const dayCells = container.getElementsByClassName('calendar-day');
  // dayCells 중 실제 날짜 셀은 첫 7개는 요일헤더, 다음부터 날짜

  for (let i = 0; i < dayCells.length; i++) {
    dayCells[i].classList.remove('selected','range');
  }

  // firstSelectedDate ~ secondSelectedDate 범위 하이라이트
  if (firstSelectedDate) {
    for (let i = 0; i < dayCells.length; i++) {
      const cell = dayCells[i];
      if (cell.classList.contains('inactive')) continue; 
      const dayNum = Number(cell.textContent);
      // 요일 헤더 제외 등
      if (isNaN(dayNum)) continue;

      const cellDate = new Date(currentYear, currentMonth, dayNum);

      // firstSelectedDate만 선택된 경우
      if (sameDay(cellDate, firstSelectedDate) && !secondSelectedDate) {
        cell.classList.add('selected');
      }
      // 범위가 있을 경우
      else if (secondSelectedDate) {
        const minD = (firstSelectedDate < secondSelectedDate)? firstSelectedDate: secondSelectedDate;
        const maxD = (firstSelectedDate < secondSelectedDate)? secondSelectedDate: firstSelectedDate;
        if (cellDate >= minD && cellDate <= maxD) {
          // 첫/끝 날짜는 selected, 중간은 range
          if (sameDay(cellDate, minD) || sameDay(cellDate, maxD)) {
            cell.classList.add('selected');
          } else {
            cell.classList.add('range');
          }
        }
      }
    }
  }
}

// 달력에서 선택된 firstSelectedDate / secondSelectedDate에 따라 #manualPeriod 채우기
function updatePeriodInput() {
  const periodInput = document.getElementById('manualPeriod');
  if (!firstSelectedDate) {
    periodInput.value = '';
    return;
  }

  // 한국 요일 리턴
  const getKoreanDay = (date) => {
    const dayNames = ['일','월','화','수','목','금','토'];
    return dayNames[date.getDay()];
  };

  // 포맷: YYYY. M. D.(요일)
  const formatKoreanDate = (date) => {
    const yyyy = date.getFullYear();
    const m = date.getMonth()+1;
    const d = date.getDate();
    const dayKor = getKoreanDay(date);
    return `${yyyy}. ${m}. ${d}.(${dayKor})`;
  };

  // 단일 날짜
  if (!secondSelectedDate) {
    periodInput.value = formatKoreanDate(firstSelectedDate);
  } else {
    // 범위
    let start = (firstSelectedDate < secondSelectedDate)? firstSelectedDate: secondSelectedDate;
    let end = (firstSelectedDate < secondSelectedDate)? secondSelectedDate: firstSelectedDate;
    periodInput.value = `${formatKoreanDate(start)}~${formatKoreanDate(end)}`;
  }
}

// 날짜 동일 비교
function sameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear()
      && d1.getMonth() === d2.getMonth()
      && d1.getDate() === d2.getDate();
}
