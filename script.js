/*******************************************************
 * script.js (수정본)
 *******************************************************/

/** =========================================
 *  [1] 전역 설정
 * ========================================= */
const gasUrl = 'https://script.google.com/macros/s/AKfycbxpmpsfV_Rb6YDk7gGxZw3qGB71oFPRVTzDinAetRORjjRc6wjdqB1UQRzyfzu7giU/exec';

/** =========================================
 *  [2] 페이지 로드 시 초기 처리
 * ========================================= */
window.onload = function() {
  showTab('paste');  // 기본 탭: "붙여넣기"
  buildCalendar();    // 달력 초기화
  fetchLastCContent();
  initPreReservationTab();
};

/** =========================================
 *  [3] 탭 전환
 * ========================================= */
function showTab(tabName) {
  const tabs = ['paste','manual','deposit','reminder','checkoutStay','checkoutDay','manner','reserveAlert'];
  tabs.forEach(name => {
    document.getElementById('tab'+name.charAt(0).toUpperCase()+name.slice(1)).style.display = (tabName===name?'block':'none');
    document.getElementById('tab'+name.charAt(0).toUpperCase()+name.slice(1)+'Btn')?.classList.toggle('active', tabName===name);
  });
}

function isManualTabActive() {
  return document.getElementById('tabManual').style.display === 'block';
}

/** =========================================
 *  [4] 붙여넣기 탭 (예약 정보 파싱)
 * ========================================= */
function detectPlatform(text) {
  if (text.includes("야놀자") || text.includes("NOL")) return "야놀자";
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

function format12DigitPhone(raw) {
  // 숫자만 추출
  const digits = raw.replace(/\D/g, '');
  // 길이가 12라면 4-4-4 형태로
  if (digits.length === 12) {
    return digits.replace(/^(\d{4})(\d{4})(\d{4})$/, '$1-$2-$3');
  }
  return raw;
}

/** ========================
 *  [네이버 파싱 로직]
 * ======================== */
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

  // 옵션 처리
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

  // 3) "요청사항" 파싱
  let requestLine = lines.find(line => line.includes('요청사항'));
  let 요청사항 = '';

  if (requestLine) {
    // 2-1) "요청사항"이라는 단어 끝 위치
    const startIndex = requestLine.indexOf('요청사항') + '요청사항'.length;

    // 2-2) startIndex부터 라인의 끝까지 잘라내기
    let snippet = requestLine.substring(startIndex).trim();

    //    "요청사항:" 이라면 콜론, 등호 등 불필요한 문자 제거
    snippet = snippet.replace(/^[:=]/, '').trim();

    // 2-3) 만약 같은 줄에 "유입경로"가 있다면 그 전까지만.
    const uipIndex = snippet.indexOf('유입경로');
    if (uipIndex !== -1) {
      snippet = snippet.substring(0, uipIndex).trim();
    }

    요청사항 = snippet;  // 최종 저장
  }

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
    요청사항,
    총이용인원,
    입실시간,
    결제금액:     결제금액 || 결제예상금액,
    예약플랫폼,
    무통장여부
  };
}

/** ==========================
 *    [야놀자 파싱]
 * ========================== */
function parseYanoljaReservation(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  // 1) 플랫폼 태그 확인
  const isStay   = lines.some(l => l.includes('<숙박>'));
  const isDayUse = lines.some(l => l.includes('<대실>') || l.includes('<데이유즈>'));

  // 2) 예약번호: 순수 숫자 12자리 이상인 첫 번째 라인
  const 예약번호 = lines.find(l => /^\d{12,}$/.test(l)) || '';
  const 객실명   = lines.find(l => /\)\s*[가-힣]+\s?카라반|우드캐빈/.test(l)) || '';
  const 이용객실 = (객실명.match(/대형 카라반|복층 우드캐빈/) || [''])[0];
  const 금액행   = lines.find(l => /^\(?[0-9,]+원$/.test(l)) || '';
  const 결제금액 = 금액행.replace(/\D/g, '') + '원';
  const rsrvLine = lines.find(l => /\s*\/\s*[0-9]{9,}/.test(l)) || '';
  let [예약자, 전화] = rsrvLine.split('/').map(s => s.trim());
  전화 = format12DigitPhone(전화);

  // 3) 날짜·시간 라인 추출
  const dateLines = lines.filter(l => /^\d{4}-\d{2}-\d{2}\([^)]+\)/.test(l) || l.startsWith('~'));
  const formatDate = dstr => {
    const m = dstr.replace(/^~/,'').match(/^(\d{4})-(\d{2})-(\d{2})(\([^)]+\))/);
    if (!m) return '';
    const [ , Y, M, D, day ] = m;
    return `${Y}. ${parseInt(M,10)}. ${parseInt(D,10)}.${day}`;
  };
  const parseTime = str => (str.match(/(\d{1,2}:\d{2})/g)||[])[0] || '';
  let 이용기간, 입실시간;

  if (isStay && dateLines.length >= 2) {
    const first = dateLines[0];
    const second = dateLines[1];
    const d1 = formatDate(first);
    const d2 = formatDate(second);
    이용기간 = `${d1}~${d2}`;
    const t1 = parseTime(first);
    const t2 = parseTime(second);
    입실시간 = `[숙박] ${t1} 입실 / ${t2} 퇴실`;
  } else if (isDayUse && dateLines.length >= 2) {
    const first = dateLines[0];
    // 두번째 명시된 라인에서 시간만
    const second = dateLines[1];
    이용기간 = formatDate(first);
    const t1 = parseTime(first);
    const t2 = parseTime(second);
    입실시간 = `${t1}~${t2}`;
  } else {
    // fallback
    이용기간 = '';
    입실시간 = '';
  }

  return {
    예약번호,
    예약자,
    전화번호: 전화,
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

/** ==========================
 *   [여기어때 파싱]
 * ========================== */
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

  const 안심번호라인 = lines.find(line => line.includes('안심번호:'));
  let 전화번호 = 안심번호라인
    ? 안심번호라인.split(':')[1].trim()
    : '';
  전화번호 = format12DigitPhone(전화번호);

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
 *  [7] 버튼 동작
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
- 요청사항: ${data.요청사항 ? data.요청사항 : '없음'} 
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
  try {
    const res = await fetch(url);
    const list = await res.json(); 
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
        <th>예약번호</th>
        <th>예약자</th>
        <th>전화번호</th>
        <th>이용객실</th>
        <th>이용기간</th>
        <th>수량</th>
        <!-- 옵션, 총이용인원, 입실시간 제거 -->
        <th>결제금액</th>
        <th>입금확인</th>
        <th>취소</th>
      </tr>
    </thead>
  `;
  const tbody = document.createElement('tbody');

  listRows.forEach(row => {
    const tr = document.createElement('tr');

    const tdB = document.createElement('td');
    tdB.textContent = row.예약번호; 
    tr.appendChild(tdB);

    const tdC = document.createElement('td');
    tdC.textContent = row.예약자;
    tr.appendChild(tdC);

    const tdD = document.createElement('td');
    tdD.textContent = row.전화번호;
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
let reminderList=[];  // 전날메세지용

async function loadTomorrowData() {
  const container= document.getElementById("reminderListContainer");
  container.innerHTML= "불러오는 중...";

  try {
    const url= gasUrl+"?mode=fetchAll";
    const res= await fetch(url);
    const list= await res.json();

    const todayStr   = getTodayString();
    const tomorrowStr= getTomorrowString();

    // 요구사항: 오늘+내일
    reminderList= list.filter(row=>{
      const period= (row.이용기간||"").trim();
      return period.startsWith(todayStr) || period.startsWith(tomorrowStr);
    });

    if(!reminderList.length){
      container.innerHTML="<p>해당 날짜의 예약이 없습니다.</p>";
      return;
    }

    // 표 생성
    const table= document.createElement("table");
    table.className="deposit-table";
    table.innerHTML=`
      <thead>
        <tr>
          <th>예약자</th>
          <th>전화번호</th>
          <th>이용기간</th>
          <th>제외</th>
        </tr>
      </thead>
    `;
    const tbody= document.createElement("tbody");

    reminderList.forEach(row=>{
      row.excluded = row.sendStamp === "발송됨" || row.colU === "발송됨"; // 여기서 U열 확인 추가

      const tr= document.createElement("tr");
      if(row.excluded) {
        tr.style.textDecoration="line-through";
        tr.style.color="red";
      }

      // 예약자
      const td1= document.createElement("td");
      td1.textContent= row.예약자;
      tr.appendChild(td1);

      // 전화번호
      const td2= document.createElement("td");
      td2.textContent= row.전화번호;
      tr.appendChild(td2);

      // 이용기간
      const td3= document.createElement("td");
      td3.textContent= row.이용기간;
      tr.appendChild(td3);

      // 제외버튼
      const td4= document.createElement("td");
      const excludeBtn= document.createElement("button");
      excludeBtn.textContent="제외";
      excludeBtn.style.backgroundColor="#dc3545";
      excludeBtn.style.color="#fff";
      if(row.excluded) {
        excludeBtn.disabled= true;
      }
      excludeBtn.onclick= ()=>{
        row.excluded= true;
        tr.style.textDecoration="line-through";
        tr.style.color="red";
        excludeBtn.disabled= true;
      };
      td4.appendChild(excludeBtn);
      tr.appendChild(td4);

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.innerHTML="";
    container.appendChild(table);

  } catch(err){
    console.error(err);
    container.innerHTML="오류 발생";
  }
}

function getTodayString() {
  const now= new Date();
  const y= now.getFullYear();
  const m= now.getMonth()+1;
  const d= now.getDate();
  const dayNames= ["일","월","화","수","목","금","토"];
  return `${y}. ${m}. ${d}.(${dayNames[now.getDay()]})`;
}

function getTomorrowString() {
  const now= new Date();
  const tom= new Date(now.getFullYear(), now.getMonth(), now.getDate()+1);
  const y= tom.getFullYear();
  const m= tom.getMonth()+1;
  const d= tom.getDate();
  const dayNames= ["일","월","화","수","목","금","토"];
  return `${y}. ${m}. ${d}.(${dayNames[tom.getDay()]})`;
}

// 전날메세지 -> 제외=false
async function sendReminderMessages() {
  const targets = reminderList.filter(r => !r.excluded);
  if (!targets.length) {
    alert("메시지 보낼 대상이 없습니다.");
    return;
  }

  if (!confirm("전날 메세지를 보낼까요?")) return;

  let successCount = 0, failCount = 0;

  for (let i = 0; i < targets.length; i++) {
    const row = targets[i];
    try {
      const success = await sendOneReminder(row);
      if (success) {
        successCount++;
        await updateSendTimestamp(row.rowIndex, 'updateReminder');
      } else {
        failCount++;
      }
    } catch (error) {
      console.error(error);
      failCount++;
    }
  }

  alert(`전날 메세지 전송 완료\n성공=${successCount}, 실패=${failCount}`);
}

/** =========================================
 *  [11] 퇴실메세지 (숙박)
 * ========================================= */
let checkoutStayList=[];

async function loadCheckoutStayData() {
  const container= document.getElementById("checkoutStayListContainer");
  container.innerHTML="불러오는 중...";

  try {
    const url= gasUrl+"?mode=fetchAll";
    const res= await fetch(url);
    const list= await res.json();

    const todayStr= getTodayString();
    checkoutStayList= list.filter(row=>{
      const period=(row.이용기간||"").trim();
      if(!period.includes("~")) return false;
      const parts= period.split("~").map(p=>p.trim());
      if(parts.length<2) return false;
      const last= parts[1];
      return (last===todayStr);
    });

    if(!checkoutStayList.length){
      container.innerHTML="<p>오늘 퇴실(숙박) 대상이 없습니다.</p>";
      return;
    }

    const table= document.createElement("table");
    table.className="deposit-table";
    table.innerHTML= `
      <thead>
        <tr>
          <th>예약자</th>
          <th>전화번호</th>
          <th>이용기간</th>
          <th>퇴실시간(R열)</th>
          <th>제외</th>
        </tr>
      </thead>
    `;
    const tbody= document.createElement("tbody");

    checkoutStayList.forEach(row=>{
      row.excluded = row.sendStamp === "발송됨" || row.colV === "발송됨"; // 여기서 V열 확인 추가

      const tr= document.createElement("tr");

      if (row.excluded) {
        tr.style.textDecoration = "line-through";
        tr.style.color = "red";
      }

      const td1= document.createElement("td");
      td1.textContent= row.예약자;
      tr.appendChild(td1);

      const td2= document.createElement("td");
      td2.textContent= row.전화번호;
      tr.appendChild(td2);

      const td3= document.createElement("td");
      td3.textContent= row.이용기간;
      tr.appendChild(td3);

      const td4= document.createElement("td");
      td4.textContent= row.stayOutR;
      tr.appendChild(td4);

      const td5= document.createElement("td");
      const excludeBtn= document.createElement("button");
      excludeBtn.textContent="제외";
      excludeBtn.style.backgroundColor="#dc3545";
      excludeBtn.style.color="#fff";
      if(row.excluded){
        excludeBtn.disabled=true;
      }
      excludeBtn.onclick= ()=>{
        row.excluded= true;
        tr.style.textDecoration="line-through";
        tr.style.color="red";
        excludeBtn.disabled= true;
      };
      td5.appendChild(excludeBtn);
      tr.appendChild(td5);

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.innerHTML="";
    container.appendChild(table);

  } catch(err){
    console.error(err);
    container.innerHTML="오류 발생";
  }
}

async function sendCheckoutStayMessages() {
  const targets = checkoutStayList.filter(r => !r.excluded);
  if (!targets.length) {
    alert("메시지 보낼 대상이 없습니다.");
    return;
  }

  if (!confirm("퇴실메세지(숙박)를 보낼까요?")) return;

  let successCount = 0, failCount = 0;

  for (let i = 0; i < targets.length; i++) {
    const row = targets[i];
    try {
      const success = await sendCheckoutStayOne(row);
      if (success) {
        successCount++;
        await updateSendTimestamp(row.rowIndex, 'updateCheckoutStay');
      } else {
        failCount++;
      }
    } catch (error) {
      console.error(error);
      failCount++;
    }
  }

  alert(`퇴실메세지(숙박) 전송 완료\n성공=${successCount}, 실패=${failCount}`);
}

/** =========================================
 *  [12] 퇴실메세지(당일)
 * ========================================= */
let checkoutDayList=[];

async function loadCheckoutDayData(){
  const container= document.getElementById("checkoutDayListContainer");
  container.innerHTML="불러오는 중...";

  try {
    const url= gasUrl+"?mode=fetchAll";
    const res= await fetch(url);
    const list= await res.json();

    const todayStr= getTodayString();
    checkoutDayList= list.filter(row=>{
      const period=(row.이용기간||"").trim();
      if(period.includes("~")) return false; // 당일은 ~없음
      return (period===todayStr);
    });

    if(!checkoutDayList.length){
      container.innerHTML="<p>오늘 퇴실(당일) 대상이 없습니다.</p>";
      return;
    }
    const table= document.createElement("table");
    table.className="deposit-table";
    table.innerHTML=`
      <thead>
        <tr>
          <th>예약자</th>
          <th>전화번호</th>
          <th>이용기간</th>
          <th>퇴실시간(Q열)</th>
          <th>제외</th>
        </tr>
      </thead>
    `;
    const tbody= document.createElement("tbody");

    checkoutDayList.forEach(row=>{
      row.excluded = row.sendStamp === "발송됨" || row.colW === "발송됨"; // 여기서 W열 확인 추가

      const tr= document.createElement("tr");

      if (row.excluded) {
        tr.style.textDecoration = "line-through";
        tr.style.color = "red";
      }

      const td1= document.createElement("td");
      td1.textContent= row.예약자;
      tr.appendChild(td1);

      const td2= document.createElement("td");
      td2.textContent= row.전화번호;
      tr.appendChild(td2);

      const td3= document.createElement("td");
      td3.textContent= row.이용기간;
      tr.appendChild(td3);

      const td4= document.createElement("td");
      td4.textContent= row.dayOutQ;
      tr.appendChild(td4);

      const td5= document.createElement("td");
      const excludeBtn= document.createElement("button");
      excludeBtn.textContent="제외";
      excludeBtn.style.backgroundColor="#dc3545";
      excludeBtn.style.color="#fff";
      if(row.excluded){
        excludeBtn.disabled=true;
      }
      excludeBtn.onclick= ()=>{
        row.excluded=true;
        tr.style.textDecoration="line-through";
        tr.style.color="red";
        excludeBtn.disabled=true;
      };
      td5.appendChild(excludeBtn);
      tr.appendChild(td5);

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.innerHTML="";
    container.appendChild(table);

  } catch(err){
    console.error(err);
    container.innerHTML="오류 발생";
  }
}

async function sendCheckoutDayMessages() {
  const targets = checkoutDayList.filter(r => !r.excluded);
  if (!targets.length) {
    alert("메시지 보낼 대상이 없습니다.");
    return;
  }

  if (!confirm("퇴실메세지(당일)를 보낼까요?")) return;

  let successCount = 0, failCount = 0;

  for (let i = 0; i < targets.length; i++) {
    const row = targets[i];
    try {
      const success = await sendCheckoutDayOne(row);
      if (success) {
        successCount++;
        await updateSendTimestamp(row.rowIndex, 'updateCheckoutDay');
      } else {
        failCount++;
      }
    } catch (error) {
      console.error(error);
      failCount++;
    }
  }

  alert(`퇴실메세지(당일) 전송 완료\n성공=${successCount}, 실패=${failCount}`);
}


/** =========================================
 *  [13] 매너타임 탭
 * ========================================= */
let mannerList=[];

async function loadMannerData(){
  const container= document.getElementById("mannerListContainer");
  container.innerHTML="불러오는 중...";

  try {
    const url= gasUrl+"?mode=fetchAll";
    const res= await fetch(url);
    const list= await res.json();

    const todayStr= getTodayString();
    mannerList= list.filter(row=>{
      const period=(row.이용기간||"").trim();
      if(!period.includes("~")) return false;
      const parts= period.split("~").map(p=>p.trim());
      if(parts.length<2) return false;
      const firstDate= parts[0];
      return firstDate===todayStr;
    });

    if(!mannerList.length){
      container.innerHTML="<p>오늘 매너타임 대상(숙박) 없습니다.</p>";
      return;
    }

    const table= document.createElement("table");
    table.className="deposit-table";
    table.innerHTML=`
      <thead>
        <tr>
          <th>예약자</th>
          <th>전화번호</th>
          <th>이용기간</th>
          <th>제외</th>
        </tr>
      </thead>
    `;
    const tbody= document.createElement("tbody");

    mannerList.forEach(row=>{
      row.excluded = row.sendStamp === "발송됨" || row.colX === "발송됨"; // 여기서 X열 확인 추가
      const tr= document.createElement("tr");

      if (row.excluded) {
        tr.style.textDecoration = "line-through";
        tr.style.color = "red";
      }

      const td1= document.createElement("td");
      td1.textContent= row.예약자;
      tr.appendChild(td1);

      const td2= document.createElement("td");
      td2.textContent= row.전화번호;
      tr.appendChild(td2);

      const td3= document.createElement("td");
      td3.textContent= row.이용기간;
      tr.appendChild(td3);

      const td4= document.createElement("td");
      const excludeBtn= document.createElement("button");
      excludeBtn.textContent="제외";
      excludeBtn.style.backgroundColor="#dc3545";
      excludeBtn.style.color="#fff";
      if(row.excluded){
        excludeBtn.disabled=true;
      }
      excludeBtn.onclick= ()=>{
        row.excluded= true;
        tr.style.textDecoration="line-through";
        tr.style.color="red";
        excludeBtn.disabled= true;
      };
      td4.appendChild(excludeBtn);
      tr.appendChild(td4);

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.innerHTML="";
    container.appendChild(table);

  } catch(e){
    console.error(e);
    container.innerHTML="오류 발생";
  }
}

async function sendMannerMessages() {
  const targets = mannerList.filter(r => !r.excluded);
  if (!targets.length) {
    alert("메시지 보낼 대상이 없습니다.");
    return;
  }

  if (!confirm("매너타임 메세지를 보낼까요?")) return;

  let successCount = 0, failCount = 0;

  for (let i = 0; i < targets.length; i++) {
    const row = targets[i];
    try {
      const success = await sendMannerOne(row);
      if (success) {
        successCount++;
        await updateSendTimestamp(row.rowIndex, 'updateManner');
      } else {
        failCount++;
      }
    } catch (error) {
      console.error(error);
      failCount++;
    }
  }

  alert(`매너타임 메세지 전송 완료\n성공=${successCount}, 실패=${failCount}`);
}


/**
 * 시트1 마지막 C열 내용을 가져와서 #lastCSpan 에 표시
 */
async function fetchLastCContent() {
  try {
    const url = gasUrl + '?mode=fetchLastC'; // code.gs에서 처리
    const res = await fetch(url);
    const text = await res.text(); // plain text
    const cSpan = document.getElementById('lastCSpan');
    if (cSpan) {
      cSpan.textContent = `! (${text}) 까지 완료함`;
    }
  } catch (err) {
    console.error('마지막 C열 가져오기 실패:', err);
  }
}


// ─────────────────────────────────────────
// 2) 사전예약 탭 초기화 및 기능 구현
// ─────────────────────────────────────────
function initPreReservationTab() {
  const now = new Date();
  const currentYear = now.getFullYear();

  // 검색용 연도/월
  const yearSel  = document.getElementById('reserveSearchYear');
  const monthSel = document.getElementById('reserveSearchMonth');
  yearSel.innerHTML = `<option value="${currentYear}">${currentYear}년</option>`;
  for (let m = 1; m <= 12; m++) {
    monthSel.innerHTML += `<option value="${m}">${m}월</option>`;
  }

  // 저장용 연도
  document.getElementById('preYearInput').value = currentYear;

  // **저장용 월</>**
  const preMonthSel = document.getElementById('preMonthInput');
  for (let m = 1; m <= 12; m++) {
    preMonthSel.innerHTML += `<option value="${m}">${m}월</option>`;
  }
}

// (C) 저장 버튼 핸들러
async function savePreReservationEntry() {
  const phone = document.getElementById('prePhoneInput').value.trim();
  const year  = document.getElementById('preYearInput').value.trim();
  const month = document.getElementById('preMonthInput').value.trim();
  if (!phone || !year || !month) {
    return alert('전화번호, 연도, 월을 모두 입력해주세요.');
  }
  try {
    const res  = await fetch(`${gasUrl}?mode=addPreReservation&phone=${phone}&year=${year}&month=${month}`);
    const txt  = await res.text();
    alert(txt);
    // 입력 필드 초기화
    document.getElementById('prePhoneInput').value = '';
  } catch (err) {
    console.error(err);
    alert('저장 중 오류가 발생했습니다.');
  }
}

// (D) 리스트 불러오기
async function loadPreReservationList() {
  const year  = document.getElementById('reserveSearchYear').value;
  const month = document.getElementById('reserveSearchMonth').value;
  if (!year || !month) {
    return alert('검색할 연도와 월을 선택해주세요.');
  }
  const container = document.getElementById('preReserveListContainer');
  container.innerHTML = '불러오는 중...';
  try {
    const res  = await fetch(`${gasUrl}?mode=getPreReservationList&year=${year}&month=${month}`);
    const list = await res.json();
    if (!list.length) {
      container.innerHTML = '<p>조회된 내역이 없습니다.</p>';
      return;
    }
    let html = `<table class="deposit-table">
                  <thead>
                    <tr><th>전화번호</th><th>연도</th><th>월</th></tr>
                  </thead><tbody>`;
    list.forEach(r => {
      html += `<tr><td>${r.phone}</td><td>${r.year}</td><td>${r.month}</td></tr>`;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p>오류가 발생했습니다.</p>';
  }
}

/** =========================================
 *  [14] 알림톡 발송 후 타임스탬프 업데이트 처리
 * ========================================= */
async function updateSendTimestamp(rowIndex, mode) {
  try {
    const res = await fetch(`${gasUrl}?mode=${mode}&rowIndex=${rowIndex}`);
    const txt = await res.text();
    if (txt.includes("완료") || txt.includes("성공")) {
      console.log(`[${rowIndex}] 상태 업데이트 성공`);
      return true;
    } else {
      console.error(`[${rowIndex}] 상태 업데이트 실패: ${txt}`);
      return false;
    }
  } catch (error) {
    console.error(`[${rowIndex}] 상태 업데이트 중 오류:`, error);
    return false;
  }
}
