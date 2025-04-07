/*******************************************************
 * script.js
 *******************************************************/

/** =========================================
 *  [1] 전역 설정
 * ========================================= */
const gasUrl = 'https://script.google.com/macros/s/AKfycbyjhvlt0PtzOWfyllwvQar28YzsQdo6yojSegetC0vtgdq5MpaujTHaBT4KMfnelfgu/exec';

/** =========================================
 *  [2] 페이지 로드 시 초기 처리
 * ========================================= */
window.onload = function() {
  showTab('paste');  // 기본 탭: "붙여넣기"
  buildCalendar();    // 달력 초기화
};

/** =========================================
 *  [3] 탭 전환
 * ========================================= */
function showTab(tabName) {
  const pasteTab   = document.getElementById('tabPaste');
  const manualTab  = document.getElementById('tabManual');
  const depositTab = document.getElementById('tabDeposit');
  const reminderTab= document.getElementById('tabReminder'); // 전날메세지

  pasteTab.style.display   = (tabName==='paste')   ? 'block' : 'none';
  manualTab.style.display  = (tabName==='manual')  ? 'block' : 'none';
  depositTab.style.display = (tabName==='deposit') ? 'block' : 'none';
  reminderTab.style.display= (tabName==='reminder')? 'block' : 'none';

  document.getElementById('tabPasteBtn').classList.toggle('active',   (tabName==='paste'));
  document.getElementById('tabManualBtn').classList.toggle('active',  (tabName==='manual'));
  document.getElementById('tabDepositBtn').classList.toggle('active', (tabName==='deposit'));
  document.getElementById('tabReminderBtn').classList.toggle('active',(tabName==='reminder'));
}

function isManualTabActive() {
  return document.getElementById('tabManual').style.display === 'block';
}

/** =========================================
 *  [4] 붙여넣기 탭 (예약 정보 파싱)
 * ========================================= */
function detectPlatform(text) {
  if (text.includes("야놀자"))   return "야놀자";
  if (text.includes("여기어때")) return "여기어때";
  return "네이버"; // default
}

function parseReservation(text) {
  const platform = detectPlatform(text);
  if (platform === "네이버")   return parseNaverReservation(text);
  if (platform === "야놀자")   return parseYanoljaReservation(text);
  if (platform === "여기어때") return parseHereReservation(text);
  return parseNaverReservation(text);
}

// [네이버 파싱 로직]
function parseNaverReservation(text) {
  const lines = text.split('\n').map(line => line.trim());

  const getValue = (keyword) => {
    const line = lines.find(l => l.includes(keyword));
    return line ? line.replace(keyword, '').trim() : '';
  };

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

  let siteLine = lines.find(line => line.includes('사이트'));
  let 이용객실 = '';
  if (siteLine) {
    const rooms = ['대형카라반', '복층우드캐빈', '파티룸', '몽골텐트'];
    const normalizedSiteLine = siteLine.replace(/\s+/g, '');
    이용객실 = rooms.find(room => normalizedSiteLine.includes(room));
    if (이용객실 === '대형카라반')   이용객실 = '대형 카라반';
    if (이용객실 === '복층우드캐빈') 이용객실 = '복층 우드캐빈';
  }

  // [옵션 처리]
  const optionsStartIndex = lines.findIndex(line => line.includes('옵션'));
  let optionsEndIndex = lines.findIndex(line => line.includes('요청사항'));
  if (optionsEndIndex === -1) {
    optionsEndIndex = lines.findIndex(line => line.includes('유입경로'));
  }
  const optionLines = (optionsStartIndex !== -1 && optionsEndIndex !== -1 && optionsEndIndex > optionsStartIndex)
    ? lines.slice(optionsStartIndex + 1, optionsEndIndex).filter(Boolean)
    : [];

  const couponIndex = optionLines.findIndex(line => line.includes('쿠폰'));
  const trimmedOptionLines = (couponIndex !== -1)
    ? optionLines.slice(0, couponIndex) 
    : optionLines;

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
  const filteredOptions = trimmedOptionLines.filter(line =>
    !unwantedOptions.some(unwanted => line.includes(unwanted))
  );

  let totalPeopleIndex = lines.findIndex(line => line.includes('총 이용 인원 정보'));
  let 총이용인원 = '';
  if (totalPeopleIndex !== -1 && totalPeopleIndex + 1 < lines.length) {
    총이용인원 = lines[totalPeopleIndex + 1].trim();
  }

  let checkInTimeIndex = lines.findIndex(line => line.includes('입실 시간 선택'));
  let 입실시간 = '';
  if (checkInTimeIndex !== -1 && checkInTimeIndex + 1 < lines.length) {
    입실시간 = lines[checkInTimeIndex + 1].trim();
  }

  const 결제예상금액 = getValue('결제예상금액');
  const 결제금액     = getValue('결제금액');
  const 무통장여부   = 결제예상금액 ? true : "";
  const 예약플랫폼   = 무통장여부 ? '네이버무통장' : '네이버';

  return {
    예약번호:     getValue('예약번호'),
    예약자,
    전화번호,
    이용객실,
    이용기간:     getValue('이용기간'),
    수량:         getValue('수량'),
    옵션:         filteredOptions.join(', '),
    총이용인원,
    입실시간,
    결제금액:     결제금액 || 결제예상금액,
    예약플랫폼,
    무통장여부
  };
}

// [야놀자 파싱]
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

  const 체크인라인   = lines.find(line => line.includes('~'));
  const idx          = lines.indexOf(체크인라인);
  const 체크아웃라인 = idx !== -1 ? lines[idx + 1] : '';

  const 이용유형 = lines[1] || '';
  let 이용기간 = '';
  let 입실시간 = '';

  const formatDate = date => {
    const match = date.match(/(\d{4})-(\d{2})-(\d{2})\((.)\)/);
    if (!match) return date;
    const [y, m, d, day] = match.slice(1);
    return `${Number(y)}. ${Number(m)}. ${Number(d)}.(${day})`;
  };

  if (이용유형.includes('대실')) {
    // 당일(대실)
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
      const outDateStr= 체크아웃라인.split(' ')[0];
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
    예약플랫폼: '야놀자'
  };
}

// [여기어때 파싱]
function parseHereReservation(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

  const 예약번호라인   = lines.find(line => line.includes('예약번호:'));
  const 예약번호       = 예약번호라인
                          ? 예약번호라인.split(':')[1].trim()
                          : '';

  const 객실정보라인   = lines.find(line => line.includes('객실정보:'));
  const 객실정보       = 객실정보라인
                          ? 객실정보라인.split('/')[1].trim()
                          : '';

  const 판매금액라인   = lines.find(line => line.includes('판매금액:'));
  const 결제금액       = 판매금액라인
                          ? 판매금액라인.split(':')[1].trim()
                          : '';

  const 예약자라인     = lines.find(line => line.includes('예약자명 :'));
  const 예약자         = 예약자라인
                          ? 예약자라인.split(':')[1].trim()
                          : '';

  const 안심번호라인   = lines.find(line => line.includes('안심번호:'));
  const 전화번호       = 안심번호라인
                          ? 안심번호라인.split(':')[1].trim()
                          : '';

  const 입실일시라인   = lines.find(line => line.includes('입실일시:'));
  const 퇴실일시라인   = lines.find(line => line.includes('퇴실일시:'));

  const 예약날짜Match  = 예약번호.match(/^(\d{2})(\d{2})(\d{2})/);
  let 예약날짜         = new Date();
  if (예약날짜Match) {
    const 예약연도 = Number('20' + 예약날짜Match[1]);
    const 예약월   = Number(예약날짜Match[2]);
    const 예약일   = Number(예약날짜Match[3]);
    예약날짜       = new Date(예약연도, 예약월 - 1, 예약일);
  }

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

  let 입실날짜   = '';
  let 퇴실날짜   = '';
  let 이용기간   = '';
  let 입실시간   = '';

  if (입실일시라인 && 퇴실일시라인) {
    입실날짜 = formatDate(입실일시라인, 예약날짜);
    퇴실날짜 = formatDate(퇴실일시라인, 예약날짜);
    이용기간 = `${입실날짜}~${퇴실날짜}`;

    const inMatch  = 입실일시라인.match(/\d{2}:\d{2}/);
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
    예약플랫폼: '여기어때'
  };
}

/** =========================================
 *  [5] 수기작성 탭: 여러 객실 행 UI 추가
 * ========================================= */
function addRoomRow() {
  const container = document.getElementById('roomsContainer');

  const rowDiv = document.createElement('div');
  rowDiv.className = 'room-row';

  const roomSelect = document.createElement('select');
  roomSelect.className = 'room-type';
  {
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = '(객실 선택)';
    roomSelect.appendChild(defaultOpt);

    const roomTypes = ['대형 카라반','복층 우드캐빈','파티룸','몽골텐트'];
    roomTypes.forEach(rt=>{
      const opt = document.createElement('option');
      opt.value= rt;
      opt.textContent= rt;
      roomSelect.appendChild(opt);
    });
  }
  roomSelect.addEventListener('change', ()=> {
    populateRoomCountOptions(roomSelect.value, countSelect);
  });
  rowDiv.appendChild(roomSelect);

  const countSelect = document.createElement('select');
  countSelect.className = 'room-count';
  countSelect.disabled = true;
  rowDiv.appendChild(countSelect);

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.textContent = '삭제';
  removeBtn.onclick = () => {
    container.removeChild(rowDiv);
  };
  rowDiv.appendChild(removeBtn);

  container.appendChild(rowDiv);
}

function populateRoomCountOptions(roomName, countSelect) {
  countSelect.innerHTML= '';

  let range = [];
  if(!roomName) {
    countSelect.disabled= true;
    const opt= document.createElement('option');
    opt.value = '';
    opt.textContent = '(수량)';
    countSelect.appendChild(opt);
    return;
  }

  if(roomName==='대형 카라반'){
    range= Array.from({length:13}, (_,i)=> i);
  } else if(roomName==='복층 우드캐빈'){
    range= Array.from({length:7}, (_,i)=> i);
  } else if(roomName==='파티룸'){
    range= [0,1,2];
  } else if(roomName==='몽골텐트'){
    range= [0,1];
  }

  countSelect.disabled= false;
  range.forEach(num => {
    const opt= document.createElement('option');
    opt.value= String(num);
    opt.textContent= num + '개';
    countSelect.appendChild(opt);
  });
}

/** =========================================
 *  [6] "안내문자용" 단일 데이터 + "시트 전송용" 다중 데이터
 * ========================================= */
// (A) 안내문자/파싱결과 용: 모든 객실 한 줄
function getManualReservationDataSingle() {
  const rowNodes = document.querySelectorAll('#roomsContainer .room-row');
  let roomsArr = [];
  let totalCount = 0;

  rowNodes.forEach(row => {
    const roomType = row.querySelector('.room-type').value.trim();
    const countVal = parseInt(row.querySelector('.room-count').value.trim() || "0", 10);
    if (roomType && countVal > 0) {
      roomsArr.push(`${roomType} ${countVal}개`);
      totalCount += countVal;
    }
  });

  const 이용객실  = roomsArr.join(', ');
  const 입실시간  = document.getElementById('manualCheckinTime').value.trim();
  const 예약번호  = generateReservationNumber();

  return {
    예약번호,
    예약자:        document.getElementById('manualGuest').value.trim(),
    전화번호:      document.getElementById('manualPhone').value.trim(),
    이용객실,
    이용기간:      document.getElementById('manualPeriod').value.trim(),
    수량:          String(totalCount),
    옵션:          document.getElementById('manualOption').value.trim(),
    총이용인원:    document.getElementById('manualTotalPeople').value.trim(),
    입실시간,
    결제금액:      document.getElementById('manualPayment').value.trim(),
    예약플랫폼:    '수기입력',
    무통장여부:    true
  };
}

// (B) 스프레드시트 전송 용: 객실마다 각 행
function getManualReservationDataMultiple() {
  const 예약자    = document.getElementById('manualGuest').value.trim();
  const 전화번호  = document.getElementById('manualPhone').value.trim();
  const 이용기간  = document.getElementById('manualPeriod').value.trim();
  const 옵션      = document.getElementById('manualOption').value.trim();
  const 총인원    = document.getElementById('manualTotalPeople').value.trim();
  const 입실시간  = document.getElementById('manualCheckinTime').value.trim();
  const 결제금액  = document.getElementById('manualPayment').value.trim();

  const rowNodes = document.querySelectorAll('#roomsContainer .room-row');
  const baseNumber = generateBaseReservationNumber();

  let result = [];
  rowNodes.forEach((row, idx) => {
    const roomType = row.querySelector('.room-type').value.trim();
    const countVal = row.querySelector('.room-count').value.trim();
    if(!roomType || countVal==='0') return;

    const uniqueReservationNo = baseNumber + String(idx+1);

    let oneRow = {
      예약번호: uniqueReservationNo,
      예약자,
      전화번호,
      이용객실: roomType,
      이용기간,
      수량: countVal,
      옵션,
      총이용인원: 총인원,
      입실시간,
      결제금액,
      예약플랫폼: '상담',
      무통장여부: true
    };
    result.push(oneRow);
  });

  return result;
}

function generateReservationNumber() {
  const d = new Date();
  const YYYY= d.getFullYear();
  const MM  = String(d.getMonth()+1).padStart(2,'0');
  const DD  = String(d.getDate()).padStart(2,'0');
  const hh  = String(d.getHours()).padStart(2,'0');
  const mm  = String(d.getMinutes()).padStart(2,'0');
  const ss  = String(d.getSeconds()).padStart(2,'0');
  return `${YYYY}${MM}${DD}${hh}${mm}${ss}`;
}

function generateBaseReservationNumber() {
  const d = new Date();
  const YYYY= d.getFullYear();
  const MM  = String(d.getMonth()+1).padStart(2,'0');
  const DD  = String(d.getDate()).padStart(2,'0');
  const hh  = String(d.getHours()).padStart(2,'0');
  const mm  = String(d.getMinutes()).padStart(2,'0');
  const ss  = String(d.getSeconds()).padStart(2,'0');
  return `${YYYY}${MM}${DD}${hh}${mm}${ss}`;
}

/** =========================================
 *  [7] 버튼 동작: 파싱결과 보기, 안내문자 양식적용, 스프레드시트로 전송
 * ========================================= */
function processReservation() {
  if(isManualTabActive()){
    const singleData = getManualReservationDataSingle();
    document.getElementById('outputData').textContent = JSON.stringify(singleData,null,2);
  } else {
    const text = document.getElementById('inputData').value;
    const data = parseReservation(text);
    document.getElementById('outputData').textContent = JSON.stringify(data,null,2);
  }
}

function generateReservationMessage() {
  let data;
  let rawText='';

  if(isManualTabActive()){
    data = getManualReservationDataSingle();
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
- 수량: ${data.수량 || '(복수객실)'}
- 옵션: ${data.옵션 ? data.옵션.replace(/, /g,'\n') : '없음'}
- 총 이용 인원: ${data.총이용인원}
- 입실시간: ${data.입실시간}
- 결제금액: ${data.결제금액}
- 예약플랫폼: ${data.예약플랫폼}`;

  let message='';

  // 무통장할인 or 네이버무통장
  if (rawText.includes('무통장할인') || data.예약플랫폼 === '네이버무통장') {
    message = `고객님 예약 신청해 주셔서 진심으로 감사드립니다.

${formattedParsedData}

*추가 옵션 설정을 정확하게 선택해 주셔야 되며 체크인 시 현장 결제도 가능합니다.
 (인원추가, 시간연장, 얼리체크인, 레이트체크아웃 / 바베큐, 불멍, 온수풀, 고기세트 별도)

*숙박은 “15시”부터 입실 가능하며 수영은 13시부터 이용하실 수 있습니다.
얼리체크인을 원하실 경우 카톡으로 별도 문의주세요.

▶계좌번호  우리 1005 504 540028 (주) 유연음

※입금 시 입금자, 예약자명이 동일해야 하며, 예약 안내 수신 후 "2시간 이내" 입금 확인이 안 될 시 자동 취소 처리됩니다.`;
  }
  else if (data.예약플랫폼 === '네이버' && data.이용기간 && !data.이용기간.includes('~')) {
    // 네이버(당일)
    message = `[양주잼잼] 예약해 주셔서 진심으로 감사합니다♬

*기본 이용시간은 6시간이며 예약해주신 방문시간을 엄수해 주세요.

${formattedParsedData}

*2인 기준 요금이며 인원추가 미선택 시 현장에서 추가결제해 주셔야 합니다.
*옵션(바베큐, 불멍, 고기세트)은 별도이며 체크인 시 현장 결제도 가능합니다.
*대형풀 무료 이용 / 온수풀 유료 이용

예약 내용 확인해보시고 수정 또는 변경해야할 내용이 있다면 말씀 부탁드립니다.`;
  }
  else if (data.예약플랫폼 === '네이버') {
    // 네이버(숙박)
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
  else if (data.예약플랫폼 === '수기입력'){
    message = `고객님 예약 신청해 주셔서 진심으로 감사드립니다.

${formattedParsedData}

*추가 옵션 설정을 정확하게 선택해 주셔야 되며 체크인 시 현장 결제도 가능합니다.
 (인원추가, 시간연장, 얼리체크인, 레이트체크아웃 / 바베큐, 불멍, 온수풀, 고기세트 별도)

*숙박은 “15시”부터 입실 가능하며 수영은 13시부터 이용하실 수 있습니다.
얼리체크인을 원하실 경우 카톡으로 별도 문의주세요.

▶계좌번호  우리 1005 504 540028 (주) 유연음

※입금 시 입금자, 예약자명이 동일해야 하며, 예약 안내 수신 후 "2시간 이내" 입금 확인이 안 될 시 자동 취소 처리됩니다.`;
  }

  document.getElementById('outputData').textContent= message;
  navigator.clipboard.writeText(message)
    .then(()=> alert('안내문자가 클립보드에 복사되었습니다.'));
}

function sendToSheet() {
  if(isManualTabActive()){
    // 수기작성: 여러 객실 -> 다중 행
    const dataArr = getManualReservationDataMultiple();
    if(dataArr.length===0) {
      alert("추가된 객실이 없습니다. (객실 이름이 없거나 수량이 0개)");
      return;
    }
    let successCount=0;
    let failCount=0;

    (async ()=>{
      for(let i=0; i<dataArr.length; i++){
        const success = await sendOneRowToGAS(dataArr[i]);
        if(success) successCount++;
        else failCount++;
      }
      alert(`전송 완료: 성공 ${successCount}건 / 실패 ${failCount}건`);
    })();

  } else {
    // 붙여넣기 파싱 -> 단일 행
    const text= document.getElementById('inputData').value;
    const data= parseReservation(text);
    sendOneRowToGAS(data).then(success=>{
      if(success) alert("전송 성공");
      else       alert("전송 실패");
    });
  }
}

async function sendOneRowToGAS(d) {
  const params= new URLSearchParams({
    예약번호:    d.예약번호||"",
    예약자:     d.예약자||"",
    전화번호:   d.전화번호||"",
    이용객실:   d.이용객실||"",
    이용기간:   d.이용기간||"",
    수량:       d.수량||"",
    옵션:       d.옵션? d.옵션.replace(/, /g,'\n') : "",
    총이용인원: d.총이용인원||"",
    입실시간:   d.입실시간||"",
    결제금액:   d.결제금액||"",
    예약플랫폼: d.예약플랫폼||""
  });
  try {
    const url = gasUrl + '?' + params.toString();
    const res = await fetch(url);
    const msg = await res.text();
    console.log(`[${d.예약번호}] → ${msg}`);
    if(msg.includes("오류") || msg.includes("이미 있는 예약")) {
      return false;
    }
    return true;
  } catch(e) {
    console.error(e);
    return false;
  }
}

/** =========================================
 *  [8] 달력
 * ========================================= */
let currentMonth = new Date().getMonth();
let currentYear  = new Date().getFullYear();
let firstSelectedDate = null;
let secondSelectedDate= null;

function buildCalendar() {
  const container = document.getElementById('calendarContainer');
  container.innerHTML = '';

  const headerDiv = document.createElement('div');
  headerDiv.className = 'calendar-header';

  const prevBtn = document.createElement('button');
  prevBtn.textContent = '<';
  prevBtn.onclick = () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth=11;
      currentYear--;
    }
    buildCalendar();
  };

  const nextBtn = document.createElement('button');
  nextBtn.textContent = '>';
  nextBtn.onclick = () => {
    currentMonth++;
    if (currentMonth>11) {
      currentMonth=0;
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

  const dayNames = ['일','월','화','수','목','금','토'];
  const gridDiv = document.createElement('div');
  gridDiv.className = 'calendar-grid';
  dayNames.forEach(d => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-day inactive';
    dayHeader.style.fontWeight = 'bold';
    dayHeader.textContent = d;
    gridDiv.appendChild(dayHeader);
  });

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const lastDate = new Date(currentYear, currentMonth+1, 0).getDate();

  for(let i=0; i<firstDay; i++){
    const blank = document.createElement('div');
    blank.className='calendar-day inactive';
    gridDiv.appendChild(blank);
  }
  for(let date=1; date<=lastDate; date++){
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    dayDiv.textContent= date;
    const thisDate = new Date(currentYear, currentMonth, date);
    dayDiv.onclick = ()=> onDateClick(thisDate);
    gridDiv.appendChild(dayDiv);
  }

  container.appendChild(gridDiv);
  highlightSelectedDates();
}

function onDateClick(dateObj) {
  if(!firstSelectedDate) {
    firstSelectedDate = dateObj;
    secondSelectedDate= null;
  } else if(!secondSelectedDate) {
    const isSame = sameDay(dateObj, firstSelectedDate);
    if(isSame){
      secondSelectedDate= null;
    } else {
      if(dateObj < firstSelectedDate){
        secondSelectedDate = firstSelectedDate;
        firstSelectedDate  = dateObj;
      } else {
        secondSelectedDate = dateObj;
      }
    }
  } else {
    firstSelectedDate = dateObj;
    secondSelectedDate= null;
  }
  highlightSelectedDates();
  updatePeriodInput();
}

function highlightSelectedDates() {
  const container = document.getElementById('calendarContainer');
  const dayCells = container.getElementsByClassName('calendar-day');
  for(let i=0; i<dayCells.length;i++){
    dayCells[i].classList.remove('selected','range');
  }

  if(!firstSelectedDate) return;

  for(let i=0; i<dayCells.length;i++){
    const cell = dayCells[i];
    if(cell.classList.contains('inactive')) continue;

    const dayNum = Number(cell.textContent);
    if(isNaN(dayNum)) continue;

    const cellDate = new Date(currentYear, currentMonth, dayNum);

    if(sameDay(cellDate, firstSelectedDate) && !secondSelectedDate){
      cell.classList.add('selected');
    }
    else if(secondSelectedDate){
      const minD = firstSelectedDate < secondSelectedDate ? firstSelectedDate : secondSelectedDate;
      const maxD = firstSelectedDate < secondSelectedDate ? secondSelectedDate : firstSelectedDate;

      if(cellDate>=minD && cellDate<=maxD){
        if(sameDay(cellDate, minD) || sameDay(cellDate, maxD)){
          cell.classList.add('selected');
        } else {
          cell.classList.add('range');
        }
      }
    }
  }
}

function updatePeriodInput() {
  const periodInput = document.getElementById('manualPeriod');
  if(!firstSelectedDate){
    periodInput.value='';
    return;
  }
  const getKoreanDay = date => {
    const dayNames = ['일','월','화','수','목','금','토'];
    return dayNames[date.getDay()];
  };
  const fmt = d=> `${d.getFullYear()}. ${d.getMonth()+1}. ${d.getDate()}.(${getKoreanDay(d)})`;

  if(!secondSelectedDate){
    periodInput.value = fmt(firstSelectedDate);
  } else {
    let start = firstSelectedDate < secondSelectedDate ? firstSelectedDate : secondSelectedDate;
    let end   = firstSelectedDate < secondSelectedDate ? secondSelectedDate : firstSelectedDate;
    periodInput.value = `${fmt(start)} ~ ${fmt(end)}`;
  }
}

function sameDay(d1,d2){
  return d1.getFullYear()===d2.getFullYear()
      && d1.getMonth()===d2.getMonth()
      && d1.getDate()===d2.getDate();
}

function onlyNumbers(el) {
  el.value = el.value.replace(/\D/g, '');
}

function formatPayment() {
  const el = document.getElementById('manualPayment');
  let val  = el.value.replace(/\D/g, '');
  if (!val) {
    el.value = '';
    return;
  }
  const num = parseInt(val, 10);
  el.value = num.toLocaleString('ko-KR') + '원';
}

/** =========================================
 *  [9] 무통장 입금확인 탭 로직
 * ========================================= */
async function loadDepositData() {
  const container = document.getElementById('depositListContainer');
  if (!container) return;
  container.innerHTML = "불러오는 중...";

  const url = gasUrl + '?mode=fetchDeposit'; 
  // L열='네이버무통장','상담','수기입력' / O열 != '취소'인 행만 리턴

  try {
    const res = await fetch(url);
    const list = await res.json(); // [{ rowIndex, 예약번호, 예약자, 전화번호, ... }]
    renderDepositList(list);
  } catch (err) {
    console.error(err);
    container.innerHTML = "오류 발생 (콘솔 확인)";
  }
}

function renderDepositList(listRows) {
  const container = document.getElementById('depositListContainer');
  if (!container) return;

  if (!listRows || listRows.length === 0) {
    container.innerHTML = "<p>무통장 입금 대상이 없습니다.</p>";
    return;
  }

  const table = document.createElement('table');
  table.className = 'deposit-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>예약번호</th><th>예약자</th><th>전화번호</th>
        <th>이용객실</th><th>이용기간</th><th>수량</th>
        <th>옵션</th><th>총이용인원</th><th>입실시간</th><th>결제금액</th>
        <th>입금확인</th><th>취소</th>
      </tr>
    </thead>
  `;
  const tbody = document.createElement('tbody');

  listRows.forEach(row => {
    const tr = document.createElement('tr');

    const tdB = document.createElement('td');
    tdB.textContent = row.예약번호; // B열
    tr.appendChild(tdB);

    const tdC = document.createElement('td');
    tdC.textContent = row.예약자;   // C열
    tr.appendChild(tdC);

    const tdD = document.createElement('td');
    tdD.textContent = row.전화번호; // D열
    tr.appendChild(tdD);

    const tdE = document.createElement('td');
    tdE.textContent = row.이용객실; 
    tr.appendChild(tdE);

    const tdF = document.createElement('td');
    tdF.textContent = row.이용기간; 
    tr.appendChild(tdF);

    const tdG = document.createElement('td');
    tdG.textContent = row.수량; 
    tr.appendChild(tdG);

    const tdH = document.createElement('td');
    tdH.textContent = row.옵션;
    tr.appendChild(tdH);

    const tdI = document.createElement('td');
    tdI.textContent = row.총이용인원;
    tr.appendChild(tdI);

    const tdJ = document.createElement('td');
    tdJ.textContent = row.입실시간;
    tr.appendChild(tdJ);

    const tdK = document.createElement('td');
    tdK.textContent = row.결제금액;
    tr.appendChild(tdK);

    // (1) 입금확인 버튼
    const tdBtn = document.createElement('td');
    const btnConfirm = document.createElement('button');
    btnConfirm.textContent = "입금 확인";
    btnConfirm.onclick = () => confirmPaymentAlimtalk(row); 
    tdBtn.appendChild(btnConfirm);
    tr.appendChild(tdBtn);

    // (2) 취소 버튼
    const tdBtn2 = document.createElement('td');
    const btnCancel = document.createElement('button');
    btnCancel.textContent = "취소";
    btnCancel.onclick = () => confirmCancel(row.rowIndex);
    tdBtn2.appendChild(btnCancel);
    tr.appendChild(tdBtn2);

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.innerHTML = "";
  container.appendChild(table);
}

async function confirmCancel(rowIndex) {
  const ok = confirm("예약이 취소되었습니까?");
  if(!ok) return;

  const url = gasUrl + `?mode=updateCancel&rowIndex=${rowIndex}&newValue=취소`;
  try {
    const res = await fetch(url);
    const txt = await res.text();
    if(txt.includes("완료") || txt.includes("성공")) {
      alert("취소 처리 완료");
      loadDepositData();
    } else {
      alert("취소 처리 실패: " + txt);
    }
  } catch(err) {
    console.error(err);
    alert("취소 처리 중 오류 발생");
  }
}

/** =========================================
 *  [10] 전날메세지 탭 로직
 * ========================================= */

// "내일 예약" 목록을 저장할 전역 변수
let reminderList = [];

/**
 * 전날메세지 탭 클릭 -> "내일 예약" 불러오기
 *  - code.gs => mode=fetchAll => 시트1 전체
 *  - 내일 날짜 문자열(YYYY. M. D.(요일))로 시작하는 F열(이용기간)만 필터
 *  - 목록에 예약자(C열), 전화번호(D열), 이용기간(F열) 표시
 */
async function loadTomorrowData() {
  const container = document.getElementById('reminderListContainer');
  container.innerHTML = "불러오는 중...";

  try {
    // 1) 시트1 전체 조회
    const url = gasUrl + '?mode=fetchAll';
    const res = await fetch(url);
    const list = await res.json();

    // 2) 내일 날짜 문자열 => "2025. 4. 8.(화)"
    const tomorrowStr = getTomorrowString();

    // 3) 필터 => "이용기간"이 tomorrowStr로 시작하는 행만
    reminderList = list.filter(row => {
      const period = (row.이용기간 || "").trim();
      return period.startsWith(tomorrowStr);
    });

    // 4) 화면 표시
    if (reminderList.length === 0) {
      container.innerHTML = "<p>내일 이용하는 예약이 없습니다.</p>";
      return;
    }

    let html = `
      <table class="deposit-table">
        <thead>
          <tr>
            <th>예약자</th>
            <th>전화번호</th>
            <th>이용기간</th>
          </tr>
        </thead>
        <tbody>
    `;
    reminderList.forEach(row => {
      html += `
        <tr>
          <td>${row.예약자}</td>
          <td>${row.전화번호}</td>
          <td>${row.이용기간}</td>
        </tr>
      `;
    });
    html += `</tbody></table>`;

    container.innerHTML = html;
  } catch (err) {
    console.error(err);
    container.innerHTML = "오류 발생 (콘솔 확인)";
  }
}

/**
 * 오늘 날짜의 내일을 "YYYY. M. D.(요일)" 형태로 반환
 */
function getTomorrowString() {
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const y = tomorrow.getFullYear();
  const m = tomorrow.getMonth() + 1; // 1..12
  const d = tomorrow.getDate();
  const dayKorean = ['일','월','화','수','목','금','토'][ tomorrow.getDay() ];

  // "2025. 4. 8.(화)" 예시
  return `${y}. ${m}. ${d}.(${dayKorean})`;
}

/**
 * 전날메세지 보내기 버튼 -> reminderList 전체 발송
 *  - script_talk.js 의 sendOneReminder(row) 호출
 */
function sendReminderMessages() {
  if (!reminderList || reminderList.length === 0) {
    alert("메시지 보낼 대상이 없습니다.");
    return;
  }
  const ok = confirm("메세지를 보낼까요?");
  if (!ok) return;

  (async ()=>{
    let successCount = 0;
    let failCount = 0;

    for (let row of reminderList) {
      // sendOneReminder는 script_talk.js 에서 정의 (async)
      const success = await sendOneReminder(row);
      if (success) successCount++;
      else failCount++;
    }

    alert(`전날 메세지 전송 완료\n성공=${successCount}, 실패=${failCount}`);
  })();
}
