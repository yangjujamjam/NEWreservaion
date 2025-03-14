/** =========================================
 *  [1] 전역 설정
 * ========================================= */
const gasUrl = 'https://script.google.com/macros/s/AKfycbwgQahS2cgLrRPFHdIg2VaE4CL7UA1Cvx7-40-fnG1MxWb0o7AD1ItO5rZ2lslBGV9I/exec';
// ↑ 실제 발급된 GAS 웹 앱 URL로 교체

/** =========================================
 *  [2] 페이지 로드 시점
 * ========================================= */
window.onload = function() {
  checkAuth();
  showTab('paste');
  buildCalendar(); // 달력 초기화

  // 페이지 로드 시점에 객실 한 줄 디폴트 추가
  addRoomRow();
};

/**
 * 로컬스토리지에 jamjam_auth === true 면 로그인 상태
 */
function checkAuth() {
  const hasAuth = localStorage.getItem('jamjam_auth') === 'true';
  document.getElementById('loginScreen').style.display = hasAuth ? 'none' : 'block';
  document.getElementById('app').style.display = hasAuth ? 'block' : 'none';
}

async function doLogin() {
  const inputPassword = document.getElementById('passwordInput').value.trim();
  if (!inputPassword) {
    alert("비밀번호를 입력하세요.");
    return;
  }
  const realPassword = await fetchPasswordFromGAS();
  if (!realPassword) {
    alert("비밀번호 조회 실패");
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
    const data = await response.json(); 
    return data.password; // { password: '...' }
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
 *  [4] 붙여넣기 파싱
 * ========================================= */
function detectPlatform(text) {
  if (text.includes("야놀자")) return "야놀자";
  if (text.includes("여기어때")) return "여기어때";
  return "네이버";
}
function parseReservation(text) {
  const p = detectPlatform(text);
  if (p==='네이버') return parseNaverReservation(text);
  if (p==='야놀자') return parseYanoljaReservation(text);
  if (p==='여기어때') return parseHereReservation(text);
  return parseNaverReservation(text);
}
function parseNaverReservation(text) {
  // 실제 파싱 로직은 생략/축약
  return {
    예약번호:  '20250314101805',
    예약자:   '홍길동',
    전화번호: '010-1234-5678',
    이용객실: '대형 카라반',
    이용기간: '2025. 3. 14.(금)~2025. 3. 16.(일)',
    수량:     '2',
    옵션:     '고기세트',
    총이용인원: '대인2',
    입실시간: '15시',
    결제금액: '178,000원',
    예약플랫폼: '네이버',
    무통장여부: ''
  };
}
function parseYanoljaReservation(text) {
  return { 예약번호:'...', 예약플랫폼:'야놀자' };
}
function parseHereReservation(text) {
  return { 예약번호:'...', 예약플랫폼:'여기어때' };
}

/** =========================================
 *  [5] 수기작성: 여러 객실 추가
 * ========================================= */

/** [5-A] + 객실추가 버튼 → 새 row */
function addRoomRow() {
  /* 구조
    <div class="room-row">
      <select class="roomSelect"> (대형 카라반 / 복층 우드캐빈 / 파티룸 / 몽골텐트) </select>
      <select class="roomCountSelect"> (동적으로 1..n) </select>
      <button>삭제</button>
    </div>
  */
  const container = document.getElementById('roomsContainer');
  const rowDiv = document.createElement('div');
  rowDiv.className = 'room-row';

  // 객실 select
  const selRoom = document.createElement('select');
  selRoom.className = 'roomSelect';
  const roomOptions = ['', '대형 카라반', '복층 우드캐빈', '파티룸', '몽골텐트'];
  roomOptions.forEach(r=>{
    const opt = document.createElement('option');
    opt.value = r;
    opt.textContent = (r===''?'(객실선택)': r);
    selRoom.appendChild(opt);
  });
  selRoom.onchange= ()=> populateRoomCount(rowDiv);
  rowDiv.appendChild(selRoom);

  // 수량 select
  const selCount = document.createElement('select');
  selCount.className = 'roomCountSelect';
  rowDiv.appendChild(selCount);

  // 삭제버튼
  const btnDel = document.createElement('button');
  btnDel.textContent = '삭제';
  btnDel.onclick= ()=> container.removeChild(rowDiv);
  rowDiv.appendChild(btnDel);

  container.appendChild(rowDiv);

  // 초기화
  populateRoomCount(rowDiv);
}

/** 특정 rowDiv의 roomSelect를 보고 countSelect 옵션 채우기 */
function populateRoomCount(rowDiv) {
  const roomSelect = rowDiv.querySelector('.roomSelect');
  const countSelect = rowDiv.querySelector('.roomCountSelect');
  countSelect.innerHTML = '';

  const val = roomSelect.value;
  let range = [];
  if (!val) {
    // 미선택
  } else if (val==='대형 카라반') {
    range = Array.from({length:12},(_,i)=>i+1);
  } else if (val==='복층 우드캐빈') {
    range = Array.from({length:6},(_,i)=>i+1);
  } else if (val==='파티룸') {
    range = [2];
  } else if (val==='몽골텐트') {
    range = [1];
  }

  if (range.length===0) {
    const opt = document.createElement('option');
    opt.value='';
    opt.textContent='(수량)';
    countSelect.appendChild(opt);
    countSelect.disabled=true;
  } else {
    countSelect.disabled=false;
    range.forEach(n=>{
      const opt = document.createElement('option');
      opt.value= n.toString();
      opt.textContent= n+'개';
      countSelect.appendChild(opt);
    });
  }
}

/** [5-B] 수기작성 탭 전체 데이터 + 모든 객실 배열을 모아 반환 */
function gatherManualData() {
  // 공통(예약자, 전화번호, 기간, 인원, 입실시간, 결제금액, 옵션)
  const guest = document.getElementById('manualGuest').value.trim();
  const phone = document.getElementById('manualPhone').value.trim();
  const period= document.getElementById('manualPeriod').value.trim();
  const totalPeople= document.getElementById('manualTotalPeople').value.trim();
  const checkinTime= document.getElementById('manualCheckinTime').value.trim();
  const payment= document.getElementById('manualPayment').value.trim();
  const option = document.getElementById('manualOption').value.trim();

  // 객실들
  const container= document.getElementById('roomsContainer');
  const rowDivs= container.querySelectorAll('.room-row');

  const result = [];

  // 예약번호 (14자리) → 각 객실에서 + (index+1)
  const baseNum= generateBaseReservationNumber();

  rowDivs.forEach((rowDiv, idx)=>{
    const roomVal= rowDiv.querySelector('.roomSelect').value.trim();
    const cntVal = rowDiv.querySelector('.roomCountSelect').value.trim();
    if (!roomVal) return; // 객실 미선택 skip

    const finalReservationNumber= baseNum + String(idx+1); 
    result.push({
      예약번호: finalReservationNumber,
      예약자: guest,
      전화번호: phone,
      이용객실: roomVal,
      이용기간: period,
      수량: cntVal || '1',
      옵션: option, 
      총이용인원: totalPeople,
      입실시간: checkinTime,
      결제금액: payment,
      예약플랫폼: '수기입력',
      무통장여부: true
    });
  });
  return result;
}

function generateBaseReservationNumber() {
  const d = new Date();
  const YYYY = d.getFullYear();
  const MM = String(d.getMonth()+1).padStart(2,'0');
  const DD = String(d.getDate()).padStart(2,'0');
  const HH = String(d.getHours()).padStart(2,'0');
  const mm = String(d.getMinutes()).padStart(2,'0');
  const ss = String(d.getSeconds()).padStart(2,'0');
  return `${YYYY}${MM}${DD}${HH}${mm}${ss}`; // 14자리
}

/** =========================================
 *  [6] 버튼 / 기능 함수
 * ========================================= */

/** 파싱 결과 보기 */
function processReservation() {
  if (isManualTabActive()) {
    // 여러 객실 (수기작성)
    const dataArr = gatherManualData();
    document.getElementById('outputData').textContent= JSON.stringify(dataArr, null,2);
  } else {
    // 붙여넣기
    const text= document.getElementById('inputData').value;
    const data= parseReservation(text);
    document.getElementById('outputData').textContent= JSON.stringify(data,null,2);
  }
}

/** 안내문자 양식적용 */
function generateReservationMessage() {
  if (isManualTabActive()) {
    // 여러 객실 → 한 줄로 모아서 안내문자
    const dataArr = gatherManualData();
    if (dataArr.length===0) {
      alert("객실 정보가 없습니다.");
      return;
    }

    // (1) 예약번호는 첫 객실 것을 사용 (ex. 202503141018051)
    const firstRoom = dataArr[0];
    // (2) 객실 목록: "대형 카라반 2, 복층 우드캐빈 2" ...
    const roomString = dataArr.map(obj=> obj.이용객실 + ' ' + obj.수량).join(', ');
    // (3) 총 수량 합
    const totalQty= dataArr.reduce((acc,obj)=> acc+ parseInt(obj.수량||'0'), 0);
    // (4) 옵션
    const finalOption = firstRoom.옵션? firstRoom.옵션: '없음';

    // 안내문자 만들기
    const msg = `
- 예약번호: ${firstRoom.예약번호}
- 예약자: ${firstRoom.예약자}
- 전화번호: ${firstRoom.전화번호}
- 이용객실: ${roomString}
- 이용기간: ${firstRoom.이용기간}
- 수량: ${totalQty}
- 옵션: ${finalOption}
- 총 이용 인원: ${firstRoom.총이용인원}
- 입실시간: ${firstRoom.입실시간}
- 결제금액: ${firstRoom.결제금액}
- 예약플랫폼: ${firstRoom.예약플랫폼}
`.trim();

    document.getElementById('outputData').textContent= msg;
    navigator.clipboard.writeText(msg)
      .then(()=> alert("안내문자가 클립보드에 복사되었습니다."));

  } else {
    // 붙여넣기 (기존 단일 파싱)
    const text= document.getElementById('inputData').value;
    const data= parseReservation(text);

    // 안에 객실만 1개이므로 기본 예시
    const finalOption= data.옵션? data.옵션: '없음';
    const msg= `
- 예약번호: ${data.예약번호}
- 예약자: ${data.예약자}
- 전화번호: ${data.전화번호}
- 이용객실: ${data.이용객실}
- 이용기간: ${data.이용기간}
- 수량: ${data.수량}
- 옵션: ${finalOption}
- 총 이용 인원: ${data.총이용인원}
- 입실시간: ${data.입실시간}
- 결제금액: ${data.결제금액}
- 예약플랫폼: ${data.예약플랫폼}
`.trim();

    document.getElementById('outputData').textContent= msg;
    navigator.clipboard.writeText(msg)
      .then(()=>alert("안내문자가 클립보드에 복사되었습니다."));
  }
}

/** 스프레드시트로 보내기 */
function sendToSheet() {
  if (isManualTabActive()) {
    // 여러 객실
    const dataArr= gatherManualData();
    if (dataArr.length===0) {
      alert("객실이 없습니다.");
      return;
    }
    // 비동기로 순차 전송
    (async()=>{
      let success=0, fail=0;
      for (let i=0;i<dataArr.length;i++){
        const ok= await sendSingleRow(dataArr[i]);
        if(ok) success++; else fail++;
      }
      alert(`총 ${dataArr.length}개의 객실 중 ${success}개 전송 성공 / ${fail}개 실패`);
    })();
  } else {
    // 붙여넣기
    const text= document.getElementById('inputData').value;
    const data= parseReservation(text);
    // 단일
    (async()=>{
      const ok= await sendSingleRow(data);
      if(ok) alert("전송 성공");
      else alert("전송 실패");
    })();
  }
}

/** 한 건의 예약정보를 fetch 전송 */
async function sendSingleRow(d) {
  const params= new URLSearchParams({
    예약번호:      d.예약번호       || "",
    예약자:       d.예약자        || "",
    전화번호:     d.전화번호      || "",
    이용객실:     d.이용객실      || "",
    이용기간:     d.이용기간      || "",
    수량:         d.수량          || "",
    옵션:         d.옵션 ? d.옵션.replace(/, /g, '\n') : "",
    총이용인원:   d.총이용인원    || "",
    입실시간:     d.입실시간      || "",
    결제금액:     d.결제금액      || "",
    예약플랫폼:   d.예약플랫폼    || ""
  });
  const url= gasUrl + '?' + params.toString();
  try {
    const res= await fetch(url);
    const msg= await res.text();
    console.log(`[${d.예약번호}] → ${msg}`);
    // 여기서 "이미 있는 예약" 등 문구를 체크할 수도 있음
    if (msg.includes("오류") || msg.includes("이미 있는 예약")) return false;
    return true;
  } catch(err){
    console.error(err);
    return false;
  }
}

/** =========================================
 *  [7] 모달
 * ========================================= */
function openTemplateModal() {
  document.getElementById('templateModal').style.display='block';
}
function closeTemplateModal() {
  document.getElementById('templateModal').style.display='none';
}

const defaultTemplates={
  bank:`...`,
  naverStay:`...`,
  naverDay:`...`,
  yanolja:`...`,
  here:`...`
};
function saveTemplates(){
  // ...
  alert('양식 저장되었습니다.');
  closeTemplateModal();
}

/** isManualTabActive */
function isManualTabActive(){
  return document.getElementById('tabManual').style.display==='block';
}

/** =========================================
 *  [8] 달력
 * ========================================= */
let currentMonth= new Date().getMonth();
let currentYear= new Date().getFullYear();
let firstSelectedDate=null;
let secondSelectedDate=null;

function buildCalendar(){
  const container= document.getElementById('calendarContainer');
  container.innerHTML='';
  const headerDiv= document.createElement('div');
  headerDiv.className='calendar-header';
  // prev/next
  const prevBtn= document.createElement('button');
  prevBtn.textContent='<';
  prevBtn.onclick=()=>{
    currentMonth--;
    if(currentMonth<0){currentMonth=11; currentYear--;}
    buildCalendar();
  };
  const nextBtn= document.createElement('button');
  nextBtn.textContent='>';
  nextBtn.onclick=()=>{
    currentMonth++;
    if(currentMonth>11){currentMonth=0; currentYear++;}
    buildCalendar();
  };
  const monthYearSpan= document.createElement('span');
  monthYearSpan.textContent=`${currentYear}년 ${currentMonth+1}월`;
  headerDiv.appendChild(prevBtn);
  headerDiv.appendChild(monthYearSpan);
  headerDiv.appendChild(nextBtn);
  container.appendChild(headerDiv);

  // grid
  const dayNames=['일','월','화','수','목','금','토'];
  const gridDiv= document.createElement('div');
  gridDiv.className='calendar-grid';
  dayNames.forEach(d=>{
    const dayHeader= document.createElement('div');
    dayHeader.className='calendar-day inactive';
    dayHeader.style.fontWeight='bold';
    dayHeader.textContent=d;
    gridDiv.appendChild(dayHeader);
  });
  const firstDay= new Date(currentYear,currentMonth,1).getDay();
  const lastDate= new Date(currentYear, currentMonth+1,0).getDate();
  for(let i=0;i<firstDay;i++){
    const blank= document.createElement('div');
    blank.className='calendar-day inactive';
    gridDiv.appendChild(blank);
  }
  for(let date=1; date<=lastDate; date++){
    const dayDiv= document.createElement('div');
    dayDiv.className='calendar-day';
    dayDiv.textContent=date;
    const thisDate= new Date(currentYear, currentMonth, date);
    dayDiv.onclick= ()=> onDateClick(thisDate);
    gridDiv.appendChild(dayDiv);
  }
  container.appendChild(gridDiv);
  highlightSelectedDates();
}

function onDateClick(dateObj){
  if(!firstSelectedDate){
    firstSelectedDate=dateObj;
    secondSelectedDate=null;
  } else if(!secondSelectedDate){
    const same= sameDay(dateObj, firstSelectedDate);
    if(same){ secondSelectedDate=null; }
    else {
      if(dateObj<firstSelectedDate){
        secondSelectedDate= firstSelectedDate;
        firstSelectedDate= dateObj;
      } else {
        secondSelectedDate= dateObj;
      }
    }
  } else {
    firstSelectedDate=dateObj; secondSelectedDate=null;
  }
  highlightSelectedDates();
  updatePeriodInput();
}

function highlightSelectedDates(){
  const container= document.getElementById('calendarContainer');
  const days= container.getElementsByClassName('calendar-day');
  for(let i=0;i<days.length;i++){
    days[i].classList.remove('selected','range');
  }
  if(firstSelectedDate){
    for(let i=0;i<days.length;i++){
      const cell= days[i];
      if(cell.classList.contains('inactive')) continue;
      const dayNum=Number(cell.textContent);
      if(isNaN(dayNum)) continue;

      const cellDate= new Date(currentYear, currentMonth, dayNum);
      if(sameDay(cellDate, firstSelectedDate) && !secondSelectedDate){
        cell.classList.add('selected');
      } else if(secondSelectedDate){
        const minD= (firstSelectedDate<secondSelectedDate? firstSelectedDate:secondSelectedDate);
        const maxD= (firstSelectedDate<secondSelectedDate? secondSelectedDate:firstSelectedDate);
        if(cellDate>=minD && cellDate<=maxD){
          if(sameDay(cellDate,minD)||sameDay(cellDate,maxD)){
            cell.classList.add('selected');
          } else {
            cell.classList.add('range');
          }
        }
      }
    }
  }
}
function updatePeriodInput(){
  const periodInput= document.getElementById('manualPeriod');
  if(!firstSelectedDate){
    periodInput.value='';
    return;
  }
  const getKDay=d=>{
    const dn=['일','월','화','수','목','금','토'];
    return dn[d.getDay()];
  };
  const fmt=d=>{
    return `${d.getFullYear()}. ${d.getMonth()+1}. ${d.getDate()}.(${getKDay(d)})`;
  };
  if(!secondSelectedDate){
    periodInput.value=fmt(firstSelectedDate);
  } else {
    let start= (firstSelectedDate<secondSelectedDate? firstSelectedDate:secondSelectedDate);
    let end  = (firstSelectedDate<secondSelectedDate? secondSelectedDate:firstSelectedDate);
    periodInput.value= `${fmt(start)}~${fmt(end)}`;
  }
}
function sameDay(d1,d2){
  return d1.getFullYear()===d2.getFullYear()
      && d1.getMonth()===d2.getMonth()
      && d1.getDate()===d2.getDate();
}
