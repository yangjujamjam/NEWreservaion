/** =========================================
 *  [1] 전역 설정
 * ========================================= */
const gasUrl = 'https://script.google.com/macros/s/AKfycby2D33Ulsl5aQOjaDyLv5vePU1F9vGlSXe9Z5JhV2hLGY9Uofu4fjNQXFoGSpYs2oI5/exec';
// ↑ 여기로 교체하세요 (새로운 GAS 웹 앱 URL)

/** =========================================
 *  [2] 페이지 로드 시점 초기 처리
 * ========================================= */
window.onload = function() {
  showTab('paste');
  buildCalendar(); // 달력 초기화

  // 페이지 로드 시점에 수량 옵션 초기화
  // (객실 Select를 아직 안 골랐으므로 ""로 초기화)
  populateRoomCountOptions("");
};


/** =========================================
 *  [3] '붙여넣기'와 '수기작성' 탭 전환 로직
 * ========================================= */
function showTab(tabName) {
  const pasteTab = document.getElementById('tabPaste');
  const manualTab = document.getElementById('tabManual');

  document.getElementById('tabPasteBtn').classList.toggle('active', (tabName==='paste'));
  document.getElementById('tabManualBtn').classList.toggle('active', (tabName==='manual'));

  pasteTab.style.display  = (tabName==='paste') ? 'block' : 'none';
  manualTab.style.display = (tabName==='manual')? 'block' : 'none';
}

function isManualTabActive() {
  return document.getElementById('tabManual').style.display === 'block';
}

/** =========================================
 *  [4] 붙여넣기 탭 (예약 정보 파싱)
 *    - 그대로 백업 코드 사용
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
  return parseNaverReservation(text); // fallback
}

// [네이버 파싱 로직] : 백업 코드 그대로
function parseNaverReservation(text) {
  const lines = text.split('\n').map(line => line.trim());
  const getValue = (keyword) => {
    const line = lines.find(l => l.includes(keyword));
    return line ? line.replace(keyword, '').trim() : '';
  };

  let 예약자     = getValue('예약자');
  let 전화번호   = getValue('전화번호');

  // 객실
  let siteLine = lines.find(line => line.includes('사이트'));
  let 이용객실 = '';
  if (siteLine) {
    const rooms = ['대형카라반','복층우드캐빈','파티룸','몽골텐트'];
    const normalizedSiteLine = siteLine.replace(/\s+/g,'');
    이용객실 = rooms.find(room => normalizedSiteLine.includes(room)) || '';
    if (이용객실 === '대형카라반')    이용객실 = '대형 카라반';
    if (이용객실 === '복층우드캐빈') 이용객실 = '복층 우드캐빈';
  }
  
  // 옵션
  const optionsStartIndex = lines.findIndex(line => line.includes('옵션'));
  let optionsEndIndex     = lines.findIndex(line => line.includes('요청사항'));
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

  // 총 이용 인원 정보
  let 총이용인원     = '';
  let totalPeopleIdx = lines.findIndex(line => line.includes('총 이용 인원 정보'));
  if (totalPeopleIdx !== -1 && totalPeopleIdx + 1 < lines.length) {
    총이용인원 = lines[totalPeopleIdx + 1].trim();
  }

  // 입실 시간
  let 입실시간= '';
  let checkInTimeIdx= lines.findIndex(line => line.includes('입실 시간 선택'));
  if(checkInTimeIdx!==-1 && checkInTimeIdx+1<lines.length){
    입실시간= lines[checkInTimeIdx+1].trim();
  }

  const 결제예상금액 = getValue('결제예상금액');
  const 결제금액     = getValue('결제금액');
  const 무통장여부   = 결제예상금액 ? true : "";
  const 예약플랫폼   = 무통장여부 ? '네이버무통장' : '네이버';

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

// [야놀자 파싱 로직]
function parseYanoljaReservation(text) {
  // 생략 (백업)
  return {
    예약번호:'YN123',
    예약자:'야놀자고객',
    전화번호:'010-...',
    이용객실:'복층 우드캐빈',
    이용기간:'2025. 4. 16.(목)',
    수량:'1',
    옵션:'',
    총이용인원:'대인2',
    입실시간:'15시',
    결제금액:'150,000원',
    예약플랫폼:'야놀자',
    무통장여부:''
  };
}

// [여기어때 파싱 로직]
function parseHereReservation(text) {
  // 생략 (백업)
  return {
    예약번호:'HY123',
    예약자:'여기어때고객',
    전화번호:'010-...',
    이용객실:'몽골텐트',
    이용기간:'2025. 4. 20.(일)',
    수량:'1',
    옵션:'',
    총이용인원:'대인2',
    입실시간:'6시간',
    결제금액:'120,000원',
    예약플랫폼:'여기어때',
    무통장여부:''
  };
}

/** =========================================
 *  [5] 수기작성: 객실 select + 수량 select
 * ========================================= */
function addRoomRow() {
  const container = document.getElementById('roomsContainer');
  
  // row 컨테이너
  const rowDiv = document.createElement('div');
  rowDiv.className = 'room-row';

  // 객실 select
  const roomSelect = document.createElement('select');
  roomSelect.className = 'room-type';
  // 기본 placeholder
  let defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = '(객실 선택)';
  roomSelect.appendChild(defaultOption);

  // 객실 목록
  const roomTypes = ['대형 카라반','복층 우드캐빈','파티룸','몽골텐트'];
  roomTypes.forEach(rt => {
    let opt = document.createElement('option');
    opt.value = rt;
    opt.textContent = rt;
    roomSelect.appendChild(opt);
  });

  // 수량 select
  const countSelect = document.createElement('select');
  countSelect.className = 'room-count';
  countSelect.disabled = true; // 아직 객실 선택 전이므로

  // roomSelect 변경 시 수량 옵션 업데이트
  roomSelect.addEventListener('change', () => {
    populateRoomCountOptions(roomSelect.value, countSelect);
  });

  // 삭제 버튼
  const removeBtn = document.createElement('button');
  removeBtn.textContent = '삭제';
  removeBtn.type = 'button';
  removeBtn.onclick = () => {
    container.removeChild(rowDiv);
  };

  // DOM 연결
  rowDiv.appendChild(roomSelect);
  rowDiv.appendChild(countSelect);
  rowDiv.appendChild(removeBtn);
  container.appendChild(rowDiv);
}

// roomName에 따라 countSelect를 0~최대값으로 채움
function populateRoomCountOptions(roomName, countSelect) {
  countSelect.innerHTML = '';

  let range = [];
  if (!roomName) {
    // 객실이 선택 안 되었으면 비활성화
    countSelect.disabled = true;
    let opt = document.createElement('option');
    opt.value = '';
    opt.textContent = '(수량)';
    countSelect.appendChild(opt);
    return;
  }

  // 객실별 수량 범위
  if (roomName === '대형 카라반') {
    range = Array.from({length: 13}, (_, i) => i); // 0~12
  } else if (roomName === '복층 우드캐빈') {
    range = Array.from({length: 7},  (_, i) => i); // 0~6
  } else if (roomName === '파티룸') {
    range = Array.from({length: 3},  (_, i) => i); // 0~2
  } else if (roomName === '몽골텐트') {
    range = [0, 1]; // 0 또는 1
  }

  countSelect.disabled = false;
  range.forEach(n => {
    const opt = document.createElement('option');
    opt.value = String(n);
    opt.textContent = n + '개';
    countSelect.appendChild(opt);
  });
}

/** =========================================
 *  [6] 여러 객실 정보 취합 (수기작성)
 * ========================================= */
// (A) 안내문자/파싱결과용: 모든 객실을 한 줄로 합쳐서 반환
function getManualReservationDataSingle() {
  // 객실 행들을 모두 가져옴
  const rowNodes = document.querySelectorAll('#roomsContainer .room-row');

  // 객실명 + 수량 합치기
  let roomsArr = [];
  rowNodes.forEach(row => {
    const roomType = row.querySelector('.room-type').value.trim();
    const countVal = row.querySelector('.room-count').value.trim();
    if (roomType && countVal !== '0') {
      roomsArr.push(`${roomType} ${countVal}개`);
    }
  });
  // 쉼표로 연결
  let 이용객실 = roomsArr.join(', ');

  return {
    예약번호: generateReservationNumber(),
    예약자: document.getElementById('manualGuest').value.trim(),
    전화번호: document.getElementById('manualPhone').value.trim(),
    이용객실,
    이용기간: document.getElementById('manualPeriod').value.trim(),
    수량: '', // 여러개를 합쳤으므로 단일 '수량'은 따로 두지 않음
    옵션: document.getElementById('manualOption').value.trim(),
    총이용인원: document.getElementById('manualTotalPeople').value.trim(),
    입실시간: document.getElementById('manualCheckinTime').value.trim(),
    결제금액: document.getElementById('manualPayment').value.trim(),
    예약플랫폼: '수기입력',
    무통장여부: true
  };
}

// (B) 스프레드시트용: 객실마다 한 행씩 나누어 반환 (객실명/수량만 다르고 나머지는 동일)
function getManualReservationDataMultiple() {
  const rowNodes = document.querySelectorAll('#roomsContainer .room-row');

  // 공통 데이터(예약번호 등)
  const common = {
    예약번호: generateReservationNumber(),
    예약자: document.getElementById('manualGuest').value.trim(),
    전화번호: document.getElementById('manualPhone').value.trim(),
    이용기간: document.getElementById('manualPeriod').value.trim(),
    옵션: document.getElementById('manualOption').value.trim(),
    총이용인원: document.getElementById('manualTotalPeople').value.trim(),
    입실시간: document.getElementById('manualCheckinTime').value.trim(),
    결제금액: document.getElementById('manualPayment').value.trim(),
    예약플랫폼: '수기입력',
    무통장여부: true
  };

  let result = [];
  rowNodes.forEach(row => {
    const roomType = row.querySelector('.room-type').value.trim();
    const countVal = row.querySelector('.room-count').value.trim();
    // 0개나 객실이 미선택이면 제외
    if (roomType && countVal !== '0') {
      // 공통정보 복사해서, 이 row객실만 대입
      let rowData = { ...common };
      rowData.이용객실 = roomType;
      rowData.수량 = countVal;
      result.push(rowData);
    }
  });

  return result;
}

// 예약번호 생성(연-월-일-시-분-초)
function generateReservationNumber() {
  const d = new Date();
  const YYYY = d.getFullYear();
  const MM   = String(d.getMonth()+1).padStart(2,'0');
  const DD   = String(d.getDate()).padStart(2,'0');
  const hh   = String(d.getHours()).padStart(2,'0');
  const mm   = String(d.getMinutes()).padStart(2,'0');
  const ss   = String(d.getSeconds()).padStart(2,'0');
  return `${YYYY}${MM}${DD}${hh}${mm}${ss}`;
}

/** =========================================
 *  [7] 버튼 동작
 * ========================================= */
function processReservation(){
  let data;
  if(isManualTabActive()){
    // 여러 객실을 합쳐서 한 오브젝트로만 보여주기
    data = getManualReservationDataSingle();
  } else {
    const text= document.getElementById('inputData').value;
    data= parseReservation(text);
  }
  document.getElementById('outputData').textContent= JSON.stringify(data,null,2);
}

function sendToSheet(){
  // “수기작성”이면 객실별로 나누어 여러행을 전송
  if(isManualTabActive()){
    const dataArr = getManualReservationDataMultiple();
    if(dataArr.length === 0) {
      alert("추가된 객실이 없습니다. (객실 0개는 전송 안 함)");
      return;
    }
    // 객실별로 반복 전송
    dataArr.forEach(data => {
      const params = new URLSearchParams({
        예약번호:    data.예약번호||"",
        예약자:     data.예약자||"",
        전화번호:   data.전화번호||"",
        이용객실:   data.이용객실||"",
        이용기간:   data.이용기간||"",
        수량:       data.수량||"",
        옵션:       data.옵션? data.옵션.replace(/, /g,'\n'): "",
        총이용인원: data.총이용인원||"",
        입실시간:   data.입실시간||"",
        결제금액:   data.결제금액||"",
        예약플랫폼: data.예약플랫폼||""
      });
      fetch(gasUrl + '?' + params.toString())
        .then(r=>r.text())
        .then(msg=> console.log(`전송결과(${data.이용객실}): ` + msg))
        .catch(err=> console.error(`오류(${data.이용객실}): ` + err));
    });
    alert("구글 스프레드시트로 전송을 시도했습니다. (콘솔 로그 참고)");
  }
  else {
    // 붙여넣기 탭 → 기존 로직
    const text= document.getElementById('inputData').value;
    let data= parseReservation(text);

    const params= new URLSearchParams({
      예약번호:    data.예약번호||"",
      예약자:     data.예약자||"",
      전화번호:   data.전화번호||"",
      이용객실:   data.이용객실||"",
      이용기간:   data.이용기간||"",
      수량:       data.수량||"",
      옵션:       data.옵션? data.옵션.replace(/, /g,'\n'): "",
      총이용인원: data.총이용인원||"",
      입실시간:   data.입실시간||"",
      결제금액:   data.결제금액||"",
      예약플랫폼: data.예약플랫폼||""
    });
    fetch(gasUrl+'?'+params.toString())
      .then(r=>r.text())
      .then(msg=> alert(msg))
      .catch(err=> alert("전송 중 오류: "+err));
  }
}

function generateReservationMessage(){
  let data;
  let rawText='';

  if(isManualTabActive()){
    // 안내문자용: 객실 여러개를 한 문자열로 합침
    data = getManualReservationDataSingle();
  } else {
    rawText = document.getElementById('inputData').value;
    data = parseReservation(rawText);
  }

  const formattedParsedData= `
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
  // [1] 무통장
  if (rawText.includes('무통장할인') || data.예약플랫폼==='네이버무통장' || data.무통장여부===true){
    message= `고객님 예약 신청해 주셔서 진심으로 감사드립니다.

${formattedParsedData}

*추가 옵션 설정을 정확하게 선택해 주셔야 되며 체크인 시 현장 결제도 가능합니다.
 (인원추가, 시간연장, 얼리체크인, 레이트체크아웃 / 바베큐, 불멍, 온수풀, 고기세트 별도)

*숙박은 “15시”부터 입실 가능하며 수영은 13시부터 이용하실 수 있습니다.
얼리체크인을 원하실 경우 카톡으로 별도 문의주세요.

▶계좌번호  우리 1005 504 540028 (주) 유연음

※입금 시 입금자, 예약자명이 동일해야 하며, 예약 안내 수신 후 "2시간 이내" 입금 확인이 안 될 시 자동 취소 처리됩니다.`;
  }
  // [2] 네이버 당일
  else if(data.예약플랫폼==='네이버' && data.이용기간 && !data.이용기간.includes('~')){
    message= `[양주잼잼] 예약해 주셔서 진심으로 감사합니다♬

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
  // [3] 네이버 숙박
  else if(data.예약플랫폼==='네이버'){
    message= `[양주잼잼] 예약해 주셔서 진심으로 감사합니다♬

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
  // [4] 야놀자
  else if(data.예약플랫폼==='야놀자'){
    message= `[양주잼잼] 예약해 주셔서 진심으로 감사합니다♬

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
  // [5] 여기어때
  else if(data.예약플랫폼==='여기어때'){
    message= `[양주잼잼] 예약해 주셔서 진심으로 감사합니다♬

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

  document.getElementById('outputData').textContent= message;
  navigator.clipboard.writeText(message)
    .then(()=> alert('안내문자가 클립보드에 복사되었습니다.'));
}

/** =========================================
 *  [9] 달력 관련 로직 (백업 코드 유지)
 * ========================================= */
let currentMonth = new Date().getMonth();
let currentYear  = new Date().getFullYear();
let firstSelectedDate = null;
let secondSelectedDate= null;

function buildCalendar() {
  const container = document.getElementById('calendarContainer');
  container.innerHTML = ''; // 초기화

  // 헤더
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

  // 1) 요일 헤더
  dayNames.forEach(d => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-day inactive'; 
    dayHeader.style.fontWeight = 'bold';
    dayHeader.textContent = d;
    gridDiv.appendChild(dayHeader);
  });

  // 2) 날짜 채우기
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const lastDate = new Date(currentYear, currentMonth+1, 0).getDate();

  // 이전 달 공백
  for (let i = 0; i < firstDay; i++) {
    const blank = document.createElement('div');
    blank.className = 'calendar-day inactive';
    gridDiv.appendChild(blank);
  }

  // 이번 달 날짜
  for (let date = 1; date <= lastDate; date++) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    dayDiv.textContent = date;
    
    const thisDate = new Date(currentYear, currentMonth, date);
    dayDiv.onclick = () => onDateClick(thisDate);

    gridDiv.appendChild(dayDiv);
  }

  container.appendChild(gridDiv);

  highlightSelectedDates();
}

function onDateClick(dateObj) {
  if (!firstSelectedDate) {
    firstSelectedDate = dateObj;
    secondSelectedDate = null;
  }
  else if (!secondSelectedDate) {
    const isSameDate = sameDay(dateObj, firstSelectedDate);
    if (isSameDate) {
      secondSelectedDate = null; // 단일 날짜
    } else {
      // 범위
      if (dateObj < firstSelectedDate) {
        secondSelectedDate = firstSelectedDate;
        firstSelectedDate = dateObj;
      } else {
        secondSelectedDate = dateObj;
      }
    }
  }
  else {
    // 이미 두 날짜가 선택 → 새로 시작
    firstSelectedDate = dateObj;
    secondSelectedDate = null;
  }

  highlightSelectedDates();
  updatePeriodInput();
}

function highlightSelectedDates() {
  const container = document.getElementById('calendarContainer');
  const dayCells = container.getElementsByClassName('calendar-day');

  for (let i=0;i<dayCells.length;i++){
    dayCells[i].classList.remove('selected','range');
  }

  if (firstSelectedDate) {
    for (let i=0;i<dayCells.length;i++){
      const cell = dayCells[i];
      if (cell.classList.contains('inactive')) continue; 
      const dayNum = Number(cell.textContent);
      if (isNaN(dayNum)) continue; // 요일헤더

      const cellDate = new Date(currentYear, currentMonth, dayNum);

      // 단일
      if (sameDay(cellDate, firstSelectedDate) && !secondSelectedDate) {
        cell.classList.add('selected');
      }
      // 범위
      else if (secondSelectedDate) {
        const minD = (firstSelectedDate < secondSelectedDate)? firstSelectedDate : secondSelectedDate;
        const maxD = (firstSelectedDate < secondSelectedDate)? secondSelectedDate : firstSelectedDate;
        if (cellDate >= minD && cellDate <= maxD) {
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

function updatePeriodInput() {
  const periodInput = document.getElementById('manualPeriod');
  if (!firstSelectedDate) {
    periodInput.value = '';
    return;
  }

  const getKoreanDay = (date) => {
    const dayNames = ['일','월','화','수','목','금','토'];
    return dayNames[date.getDay()];
  };
  const formatKoreanDate = (date) => {
    const yyyy = date.getFullYear();
    const m = date.getMonth()+1;
    const d = date.getDate();
    return `${yyyy}. ${m}. ${d}.(${getKoreanDay(date)})`;
  };

  // 단일 날짜
  if (!secondSelectedDate) {
    periodInput.value = formatKoreanDate(firstSelectedDate);
  } else {
    // 범위
    let start = (firstSelectedDate < secondSelectedDate)? firstSelectedDate : secondSelectedDate;
    let end   = (firstSelectedDate < secondSelectedDate)? secondSelectedDate : firstSelectedDate;
    periodInput.value = `${formatKoreanDate(start)}~${formatKoreanDate(end)}`;
  }
}

function sameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear()
      && d1.getMonth() === d2.getMonth()
      && d1.getDate() === d2.getDate();
}
