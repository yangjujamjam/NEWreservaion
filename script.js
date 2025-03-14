/** =========================================
 *  [1] 전역 설정
 * ========================================= */
const gasUrl = 'https://script.google.com/macros/s/AKfycby2D33U.../exec';
// ↑ 실제 GAS 웹 앱 URL로 교체

/** =========================================
 *  [2] 페이지 로드 시점 초기 처리
 * ========================================= */
window.onload = function() {
  checkAuth();
  showTab('paste');
  buildCalendar(); // 달력 초기화

  // 가장 처음에 객실 한 개는 디폴트로 추가
  addRoomRow();
};

/**
 * 로컬스토리지에서 'jamjam_auth' 값 확인
 */
function checkAuth() {
  const hasAuth = (localStorage.getItem('jamjam_auth') === 'true');
  document.getElementById('loginScreen').style.display = hasAuth? 'none':'block';
  document.getElementById('app').style.display         = hasAuth? 'block':'none';
}

/**
 * 비밀번호 확인
 */
async function doLogin() {
  const inputPassword = document.getElementById('passwordInput').value.trim();
  if (!inputPassword) {
    alert("비밀번호를 입력하세요.");
    return;
  }
  const realPassword = await fetchPasswordFromGAS();
  if (!realPassword) {
    alert("비밀번호 조회에 실패했습니다.");
    return;
  }
  if (inputPassword === realPassword) {
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
 *  [3] 탭 전환
 * ========================================= */
function showTab(tabName) {
  document.getElementById('tabPaste').style.display  = (tabName==='paste')?'block':'none';
  document.getElementById('tabManual').style.display = (tabName==='manual')?'block':'none';
  document.getElementById('tabPasteBtn').classList.toggle('active', tabName==='paste');
  document.getElementById('tabManualBtn').classList.toggle('active', tabName==='manual');
}

/** =========================================
 *  [4] 붙여넣기 탭 (파싱)
 * ========================================= */
function detectPlatform(text) {
  if (text.includes("야놀자")) return "야놀자";
  if (text.includes("여기어때")) return "여기어때";
  return "네이버"; // default
}
function parseReservation(text) {
  const platform = detectPlatform(text);
  if (platform==='네이버') return parseNaverReservation(text);
  if (platform==='야놀자') return parseYanoljaReservation(text);
  if (platform==='여기어때') return parseHereReservation(text);
  return parseNaverReservation(text);
}
function parseNaverReservation(text) {
  // ... (기존 코드)
  return {
    예약번호: '...',
    예약자: '...',
    전화번호: '...',
    이용객실: '...',
    이용기간: '...',
    수량: '1',
    옵션: '',
    총이용인원: '대인2',
    입실시간: '',
    결제금액: '',
    예약플랫폼: '네이버',
    무통장여부: ''
  };
}
function parseYanoljaReservation(text) {
  // ... (기존)
  return {};
}
function parseHereReservation(text) {
  // ... (기존)
  return {};
}

/** =========================================
 *  [5] 수기작성 탭
 * ========================================= */
// ★ [A] '객실추가' 기능
function addRoomRow() {
  /*
    <div class="room-row">
      <select class="roomSelect">
        <option>대형 카라반</option> ...
      </select>
      <select class="roomCountSelect">
        <option>1</option> ...
      </select>
      <button class="removeBtn">삭제</button>
    </div>
  */
  const container = document.getElementById('roomsContainer');

  const rowDiv = document.createElement('div');
  rowDiv.className = 'room-row';

  // --- 객실 select ---
  const roomSelect = document.createElement('select');
  roomSelect.className = 'roomSelect';
  // 기본 옵션들
  const rooms = ['', '대형 카라반', '복층 우드캐빈', '파티룸', '몽골텐트'];
  rooms.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r;
    opt.textContent = (r===''?'(선택)':r);
    roomSelect.appendChild(opt);
  });
  roomSelect.onchange = function() {
    populateCountSelect(rowDiv);
  };
  rowDiv.appendChild(roomSelect);

  // --- 수량 select ---
  const countSelect = document.createElement('select');
  countSelect.className = 'roomCountSelect';
  rowDiv.appendChild(countSelect);

  // --- 삭제 버튼 ---
  const removeBtn = document.createElement('button');
  removeBtn.textContent = '삭제';
  removeBtn.onclick = function() {
    container.removeChild(rowDiv);
  };
  rowDiv.appendChild(removeBtn);

  container.appendChild(rowDiv);

  // 초기화 (수량 select 채우기)
  populateCountSelect(rowDiv);
}

// 객실 select 값에 따라 수량 select를 채운다
function populateCountSelect(roomRowDiv) {
  const roomSelect = roomRowDiv.querySelector('.roomSelect');
  const countSelect = roomRowDiv.querySelector('.roomCountSelect');
  countSelect.innerHTML = '';

  const val = roomSelect.value.trim();
  let range = [];
  if (!val) {
    range = [];
  } else if (val==='대형 카라반') {
    range = Array.from({length:12},(_,i)=> i+1); // 1..12
  } else if (val==='복층 우드캐빈') {
    range = Array.from({length:6},(_,i)=> i+1);  // 1..6
  } else if (val==='파티룸') {
    range = [2];
  } else if (val==='몽골텐트') {
    range = [1];
  }

  if (range.length===0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = '(수량)';
    countSelect.appendChild(opt);
    countSelect.disabled = true;
  } else {
    countSelect.disabled = false;
    range.forEach(num=>{
      const opt = document.createElement('option');
      opt.value = num.toString();
      opt.textContent = num.toString()+'개';
      countSelect.appendChild(opt);
    });
  }
}

/**
 * [B] 수기작성 공통 정보 + 객실별 배열
 *   - 예약자, 전화번호, 이용기간, 총이용인원, 입실시간, 결제금액 등은 공통
 *   - 객실/수량은 여러 개
 */
function gatherManualData() {
  // 공통 값
  const guest = document.getElementById('manualGuest').value.trim();
  const phone = document.getElementById('manualPhone').value.trim();
  const period = document.getElementById('manualPeriod').value.trim();
  const totalPeople = document.getElementById('manualTotalPeople').value.trim();
  const checkinTime = document.getElementById('manualCheckinTime').value.trim();
  const payment = document.getElementById('manualPayment').value.trim();

  // 객실 데이터
  const container = document.getElementById('roomsContainer');
  const rowDivs = container.querySelectorAll('.room-row');

  // 최종 결과용 배열
  const resultArray = [];

  // 예약번호(기본값)
  // 예) 2025031409555 (14자리)
  const baseNum = generateBaseReservationNumber();

  // 각 객실마다 별도의 예약번호 = baseNum + i (마지막 2자리 정도)
  rowDivs.forEach((rowDiv, index) => {
    const roomVal = rowDiv.querySelector('.roomSelect').value.trim();
    const countVal = rowDiv.querySelector('.roomCountSelect').value.trim();

    // 만약 roomVal=='' 이면 무효 처리
    if (!roomVal) return;

    // 실제 예약번호 생성
    // baseNum + (index+1)  → 예) 20250314095551, 20250314095552 ...
    const finalReservationNumber = baseNum + String(index+1);

    const obj = {
      예약번호: finalReservationNumber,
      예약자: guest,
      전화번호: phone,
      이용객실: roomVal,
      이용기간: period,
      수량: countVal || '1',
      옵션: '', // 필요하다면 추가
      총이용인원: totalPeople,
      입실시간: checkinTime,
      결제금액: payment,
      예약플랫폼: '수기입력',
      무통장여부: true
    };
    resultArray.push(obj);
  });

  return resultArray;
}

/** 예약번호(14자리) + 1자리 인덱스 → 최종 15자리 */
function generateBaseReservationNumber() {
  const d = new Date();
  const YYYY = d.getFullYear();
  const MM = String(d.getMonth()+1).padStart(2,'0');
  const DD = String(d.getDate()).padStart(2,'0');
  const HH = String(d.getHours()).padStart(2,'0');
  const mm = String(d.getMinutes()).padStart(2,'0');
  const ss = String(d.getSeconds()).padStart(2,'0');
  // 14자리
  return `${YYYY}${MM}${DD}${HH}${mm}${ss}`;
}

/** =========================================
 *  [6] 버튼들
 * ========================================= */

/** 파싱 결과 보기 */
function processReservation() {
  if (isManualTabActive()) {
    // 여러 객실을 배열 형태로 보여주기
    const dataArray = gatherManualData();
    document.getElementById('outputData').textContent = JSON.stringify(dataArray, null, 2);
  } else {
    // 붙여넣기
    const text = document.getElementById('inputData').value;
    const data = parseReservation(text);
    document.getElementById('outputData').textContent = JSON.stringify(data, null, 2);
  }
}

/** 안내문자 양식적용 */
function generateReservationMessage() {
  if (isManualTabActive()) {
    // 여러 객실 중 "첫 번째" 객실 정보만 안내문자에 반영(혹은 여러 개?)
    const dataArray = gatherManualData();
    if (dataArray.length===0) {
      alert("객실 정보를 하나 이상 선택해주세요.");
      return;
    }
    // 첫 객실 기준으로 안내문자 생성
    const data = dataArray[0];
    const message = makeMessage(data);
    document.getElementById('outputData').textContent = message;
    navigator.clipboard.writeText(message)
      .then(()=>alert("안내문자가 클립보드에 복사되었습니다."));
  } else {
    // 붙여넣기
    const text = document.getElementById('inputData').value;
    const data = parseReservation(text);
    const message = makeMessage(data);
    document.getElementById('outputData').textContent = message;
    navigator.clipboard.writeText(message)
      .then(()=>alert("안내문자가 클립보드에 복사되었습니다."));
  }
}

/** 구글 스프레드시트로 보내기 */
function sendToSheet() {
  if (!isManualTabActive()) {
    // 붙여넣기 (단일)
    const text = document.getElementById('inputData').value;
    const data = parseReservation(text);
    sendSingleRow(data);
  } else {
    // 수기작성 (여러 객실)
    const dataArray = gatherManualData();
    if (dataArray.length===0) {
      alert("객실을 하나 이상 선택해야 전송이 가능합니다.");
      return;
    }
    // 각 객실별로 전송
    // fetch 호출을 여러 번
    let successCount = 0;
    let failCount = 0;

    // 순차적으로 처리(혹은 Promise.all도 가능)
    // 여기서는 간단히 for문 + await 사용 (최신 브라우저 환경 기준)
    (async function(){
      for (let i=0; i<dataArray.length; i++){
        const d = dataArray[i];
        const success = await sendSingleRow(d);
        if (success) successCount++;
        else failCount++;
      }
      alert(`총 ${dataArray.length}개의 객실 중 ${successCount}개 전송 성공 / ${failCount}개 실패`);
    })();
  }
}

/** 특정 data(예약정보) 1개를 GAS로 전송하는 함수 */
async function sendSingleRow(data) {
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

  const url = gasUrl + '?' + params.toString();
  try {
    const res = await fetch(url);
    const msg = await res.text();
    console.log(`[${data.예약번호}] → ${msg}`);
    return !msg.includes("오류"); // 단순히 "이미 있는 예약입니다" 등을 파악할 수도 있음
  } catch (err) {
    console.error(err);
    return false;
  }
}

/** isManualTabActive */
function isManualTabActive() {
  return document.getElementById('tabManual').style.display === 'block';
}

/** 안내문자 생성 함수 (단일 data) */
function makeMessage(data) {
  const formattedParsedData = `
- 예약번호: ${data.예약번호}
- 예약자: ${data.예약자}
- 전화번호: ${data.전화번호}
- 이용객실: ${data.이용객실}
- 이용기간: ${data.이용기간}
- 수량: ${data.수량}
- 옵션: ${data.옵션 || '없음'}
- 총 이용 인원: ${data.총이용인원}
- 입실시간: ${data.입실시간}
- 결제금액: ${data.결제금액}
- 예약플랫폼: ${data.예약플랫폼}`;

  // 간단히 무통장 예시만:
  let message = `고객님 예약 신청해 주셔서 진심으로 감사드립니다.

${formattedParsedData}

*추가 옵션 설정을 정확하게 선택...
`;
  return message;
}

/** =========================================
 *  [7] 모달 (양식 수정)
 * ========================================= */
function openTemplateModal() {
  document.getElementById('templateModal').style.display = 'block';
}
function closeTemplateModal() {
  document.getElementById('templateModal').style.display = 'none';
}

/** =========================================
 *  [8] 기본 안내문자 양식 (예시)
 * ========================================= */
const defaultTemplates = {
  bank: `고객님 예약 신청해 주셔서 진심으로 감사드립니다...`,
  naverStay: `[양주잼잼] 예약해 주셔서 진심으로 감사합니다♬...`,
  naverDay: `...`,
  yanolja: `...`,
  here: `...`
};

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
 *  [9] 달력
 * ========================================= */
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let firstSelectedDate = null;
let secondSelectedDate = null;

function buildCalendar() {
  const container = document.getElementById('calendarContainer');
  container.innerHTML = '';

  const headerDiv = document.createElement('div');
  headerDiv.className = 'calendar-header';

  const prevBtn = document.createElement('button');
  prevBtn.textContent = '<';
  prevBtn.onclick = () => {
    currentMonth--;
    if (currentMonth<0) {currentMonth=11; currentYear--;}
    buildCalendar();
  };

  const nextBtn = document.createElement('button');
  nextBtn.textContent = '>';
  nextBtn.onclick = () => {
    currentMonth++;
    if (currentMonth>11) {currentMonth=0; currentYear++;}
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

  // 요일 헤더
  dayNames.forEach(d=>{
    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-day inactive';
    dayHeader.style.fontWeight = 'bold';
    dayHeader.textContent = d;
    gridDiv.appendChild(dayHeader);
  });

  // 날짜
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const lastDate = new Date(currentYear, currentMonth+1, 0).getDate();
  for (let i=0;i<firstDay;i++){
    const blank = document.createElement('div');
    blank.className='calendar-day inactive';
    gridDiv.appendChild(blank);
  }
  for(let date=1; date<=lastDate; date++){
    const dayDiv = document.createElement('div');
    dayDiv.className='calendar-day';
    dayDiv.textContent = date;
    const thisDate = new Date(currentYear, currentMonth, date);
    dayDiv.onclick= ()=>onDateClick(thisDate);
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
    const isSame = sameDay(dateObj, firstSelectedDate);
    if (isSame) {
      secondSelectedDate = null; // 단일
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
    // 새로시작
    firstSelectedDate = dateObj;
    secondSelectedDate = null;
  }
  highlightSelectedDates();
  updatePeriodInput();
}
function highlightSelectedDates() {
  const container = document.getElementById('calendarContainer');
  const days = container.getElementsByClassName('calendar-day');
  for (let i=0;i<days.length;i++){
    days[i].classList.remove('selected','range');
  }
  if (firstSelectedDate) {
    for (let i=0;i<days.length;i++){
      const cell = days[i];
      if (cell.classList.contains('inactive')) continue;
      const dayNum = Number(cell.textContent);
      if (isNaN(dayNum)) continue;

      const cellDate = new Date(currentYear, currentMonth, dayNum);

      // 단일
      if (sameDay(cellDate, firstSelectedDate) && !secondSelectedDate){
        cell.classList.add('selected');
      }
      // 범위
      else if (secondSelectedDate) {
        const minD = (firstSelectedDate<secondSelectedDate? firstSelectedDate:secondSelectedDate);
        const maxD = (firstSelectedDate<secondSelectedDate? secondSelectedDate:firstSelectedDate);
        if (cellDate>=minD && cellDate<=maxD){
          if (sameDay(cellDate,minD) || sameDay(cellDate,maxD)) {
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
  if(!firstSelectedDate){
    periodInput.value='';
    return;
  }
  const getKDay = d=>{
    const dn=['일','월','화','수','목','금','토'];
    return dn[d.getDay()];
  };
  const fmt = d=>{
    return `${d.getFullYear()}. ${d.getMonth()+1}. ${d.getDate()}.(${getKDay(d)})`;
  };
  if(!secondSelectedDate){
    // 단일
    periodInput.value=fmt(firstSelectedDate);
  } else {
    // 범위
    let start = (firstSelectedDate<secondSelectedDate? firstSelectedDate:secondSelectedDate);
    let end   = (firstSelectedDate<secondSelectedDate? secondSelectedDate:firstSelectedDate);
    periodInput.value=`${fmt(start)}~${fmt(end)}`;
  }
}
function sameDay(d1,d2){
  return d1.getFullYear()===d2.getFullYear()
      && d1.getMonth()===d2.getMonth()
      && d1.getDate()===d2.getDate();
}
