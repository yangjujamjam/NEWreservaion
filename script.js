/** =========================================
 *  [1] 전역 설정
 * ========================================= */
const gasUrl = 'https://script.google.com/macros/s/AKfycbybnzBaQPu87RaUsrTw0KJA0bSNfGKieTBfsOLkkMKBjH9rXxGHmnMNkxn9UuKZYToE/exec';
// ↑ 새 GAS 웹 앱 URL

/** =========================================
 *  [2] 페이지 로드 시점
 * ========================================= */
window.onload = function() {
  checkAuth();
  showTab('paste');
  buildCalendar();

  // 여러 객실 기능: 초기에 1개 디폴트 추가
  addRoomRow();
};

/**
 * 로컬스토리지 jamjam_auth
 */
function checkAuth(){
  const hasAuth = (localStorage.getItem('jamjam_auth')==='true');
  document.getElementById('loginScreen').style.display= hasAuth?'none':'block';
  document.getElementById('app').style.display= hasAuth?'block':'none';
}

async function doLogin(){
  const pw= document.getElementById('passwordInput').value.trim();
  if(!pw){
    alert("비밀번호를 입력하세요.");
    return;
  }
  const real= await fetchPasswordFromGAS();
  if(!real){
    alert("비밀번호 조회 실패");
    return;
  }
  if(pw===real){
    localStorage.setItem('jamjam_auth','true');
    checkAuth();
  } else {
    alert("비밀번호가 틀립니다.");
  }
}

async function fetchPasswordFromGAS(){
  try {
    const r= await fetch(gasUrl + '?mode=password');
    const data= await r.json(); // {password:'...'}
    return data.password;
  } catch(err){
    console.error(err);
    return '';
  }
}

/** =========================================
 *  [3] 탭 전환
 * ========================================= */
function showTab(tabName){
  document.getElementById('tabPaste').style.display = (tabName==='paste')?'block':'none';
  document.getElementById('tabManual').style.display= (tabName==='manual')?'block':'none';

  document.getElementById('tabPasteBtn').classList.toggle('active',(tabName==='paste'));
  document.getElementById('tabManualBtn').classList.toggle('active',(tabName==='manual'));
}

/** 수기/붙여넣기 구분 */
function isManualTabActive(){
  return document.getElementById('tabManual').style.display==='block';
}

/** =========================================
 *  [4] 붙여넣기 파싱 (네이버/야놀자/여기어때)
 * ========================================= */
function detectPlatform(text){
  if(text.includes('야놀자'))   return '야놀자';
  if(text.includes('여기어때')) return '여기어때';
  return '네이버'; // default
}

function parseReservation(text){
  const p= detectPlatform(text);
  if(p==='네이버')   return parseNaverReservation(text);
  if(p==='야놀자')   return parseYanoljaReservation(text);
  if(p==='여기어때') return parseHereReservation(text);
  return parseNaverReservation(text);
}

/** ---------- 네이버 ---------- */
function parseNaverReservation(text) {
  const lines = text.split('\n').map(line => line.trim());

  // 특정 키워드가 포함된 줄에서 값을 추출하는 헬퍼 함수
  const getValue = (keyword) => {
    const line = lines.find(l => l.includes(keyword));
    return line ? line.replace(keyword, '').trim() : '';
  };

  // 예약자와 전화번호 추출
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

  // 사이트(이용객실) 정보 추출
  let siteLine = lines.find(line => line.includes('사이트'));
  let 이용객실 = '';
  if (siteLine) {
    const rooms = ['대형카라반', '복층우드캐빈', '파티룸', '몽골텐트'];
    const normalizedSiteLine = siteLine.replace(/\s+/g, '');
    이용객실 = rooms.find(room => normalizedSiteLine.includes(room));
    if (이용객실 === '대형카라반') 이용객실 = '대형 카라반';
    if (이용객실 === '복층우드캐빈') 이용객실 = '복층 우드캐빈';
  }

  // 옵션 정보 추출 (필터링 처리)
  const optionsStartIndex = lines.findIndex(line => line.includes('옵션'));
  let optionsEndIndex = lines.findIndex(line => line.includes('요청사항'));
  if (optionsEndIndex === -1) {
    optionsEndIndex = lines.findIndex(line => line.includes('유입경로'));
  }
  const optionLines = lines.slice(optionsStartIndex + 1, optionsEndIndex).filter(Boolean);
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
  const filteredOptions = optionLines.filter(line => !unwantedOptions.some(unwanted => line.includes(unwanted)));

  // 총 이용 인원 정보 추출
  let totalPeopleIndex = lines.findIndex(line => line.includes('총 이용 인원 정보'));
  let 총이용인원 = '';
  if (totalPeopleIndex !== -1 && totalPeopleIndex + 1 < lines.length) {
    총이용인원 = lines[totalPeopleIndex + 1].trim();
  }

  // 입실 시간 추출
  let checkInTimeIndex = lines.findIndex(line => line.includes('입실 시간 선택'));
  let 입실시간 = '';
  if (checkInTimeIndex !== -1 && checkInTimeIndex + 1 < lines.length) {
    입실시간 = lines[checkInTimeIndex + 1].trim();
  }

  // 결제 관련 정보 추출
  const 결제예상금액 = getValue('결제예상금액');
  const 결제금액 = getValue('결제금액');

  // 네이버 예약인 경우, 결제예상금액이 있으면 무통장 예약으로 판단
  const 무통장여부 = 결제예상금액 ? true : "";
  
  // 무통장여부가 true이면 예약플랫폼을 '네이버무통장'으로, 아니면 '네이버'로 설정
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
    예약플랫폼: 예약플랫폼,
    무통장여부: 무통장여부
  };
}

/** ---------- 야놀자 ---------- */
function parseYanoljaReservation(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

  const 예약번호 = lines[3];
  const 객실라인 = lines.find(line => line.includes('카라반') || line.includes('우드캐빈') || line.includes('파티룸') || line.includes('몽골'));
  const 이용객실 = 객실라인.replace(/\(.*\)/, '').trim();

  const 금액라인 = lines.find(line => line.includes('원'));
  const 결제금액 = 금액라인 ? 금액라인.replace('원', '').replace(/,/g, '').trim() + '원' : '';

  const 예약자라인 = lines.find(line => line.includes('/'));
  const [예약자, 전화번호] = 예약자라인.split('/').map(v => v.trim());

  const 체크인라인 = lines.find(line => line.includes('~'));
  const 체크아웃라인 = lines[lines.indexOf(체크인라인) + 1];

  const 이용유형 = lines[1];
  let 이용기간 = '';
  let 입실시간 = '';

  const formatDate = date => {
    const [y, m, d, day] = date.match(/(\d{4})-(\d{2})-(\d{2})\((.)\)/).slice(1);
    return `${Number(y)}. ${Number(m)}. ${Number(d)}.(${day})`;
  };

  if (이용유형.includes('대실')) {
    이용기간 = formatDate(체크인라인.split(' ')[0]);
    const 입실시간Match = 체크인라인.match(/\d{2}:\d{2}/)[0];
    const 퇴실시간Match = 체크아웃라인.match(/\d{2}:\d{2}/)[0];
    입실시간 = `${입실시간Match}~${퇴실시간Match}`;
  } else {
    이용기간 = `${formatDate(체크인라인.split(' ')[0])}~${formatDate(체크아웃라인.split(' ')[0])}`;
    const 입실시간Match = 체크인라인.match(/\d{2}:\d{2}/)[0];
    const 퇴실시간Match = 체크아웃라인.match(/\d{2}:\d{2}/)[0];
    입실시간 = `[숙박] ${입실시간Match} 입실 / ${퇴실시간Match} 퇴실`;
  }

  return {
    예약번호,
    예약자,
    전화번호,
    이용객실,
    이용기간,
    수량: '1',  // ✅ 수정된 부분 (기본값 '1')
    옵션: '',
    총이용인원: '대인2',
    입실시간,
    결제금액,
    예약플랫폼: '야놀자'
  };
}

/** ---------- 여기어때 ---------- */
function parseHereReservation(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

  const 예약번호라인 = lines.find(line => line.includes('예약번호:'));
  const 예약번호 = 예약번호라인.split(':')[1].trim();

  const 객실정보라인 = lines.find(line => line.includes('객실정보:'));
  const 객실정보 = 객실정보라인.split('/')[1].trim();

  const 판매금액라인 = lines.find(line => line.includes('판매금액:'));
  const 결제금액 = 판매금액라인.split(':')[1].trim();

  const 예약자라인 = lines.find(line => line.includes('예약자명 :'));
  const 예약자 = 예약자라인.split(':')[1].trim();

  const 안심번호라인 = lines.find(line => line.includes('안심번호:'));
  const 전화번호 = 안심번호라인.split(':')[1].trim();

  const 입실일시라인 = lines.find(line => line.includes('입실일시:'));
  const 퇴실일시라인 = lines.find(line => line.includes('퇴실일시:'));

  // 예약한 날짜 추출 (YYMMDD 형식)
  const 예약날짜Match = 예약번호.match(/^(\d{2})(\d{2})(\d{2})/);
  const 예약연도 = Number('20' + 예약날짜Match[1]);
  const 예약월 = Number(예약날짜Match[2]);
  const 예약일 = Number(예약날짜Match[3]);
  const 예약날짜 = new Date(예약연도, 예약월 - 1, 예약일);

  // 날짜 포맷 함수 (연도 추론 포함)
  const formatDate = (dateStr, refDate) => {
    const [m, d, day] = dateStr.match(/(\d+)\/(\d+)\s*\((.)\)/).slice(1);
    let year = refDate.getFullYear();

    const targetDate = new Date(year, Number(m) - 1, Number(d));
    if (targetDate < refDate) {
      year += 1; // 예약한 날짜보다 이전 날짜라면 다음 해로 설정
    }

    return `${year}. ${Number(m)}. ${Number(d)}.(${day})`;
  };

  // 날짜 추론 적용
  const 입실날짜 = formatDate(입실일시라인, 예약날짜);
  const 퇴실날짜 = formatDate(퇴실일시라인, 예약날짜);
  const 이용기간 = `${입실날짜}~${퇴실날짜}`;

  const 입실시간Match = 입실일시라인.match(/\d{2}:\d{2}/)[0];
  const 퇴실시간Match = 퇴실일시라인.match(/\d{2}:\d{2}/)[0];
  const 입실시간 = `[숙박] ${입실시간Match} 입실 / ${퇴실시간Match} 퇴실`;

  return {
    예약번호,
    예약자,
    전화번호,
    이용객실: 객실정보,
    이용기간,
    수량: '1', // 기본값
    옵션: '', // 옵션 없음
    총이용인원: '대인2', // 기본값
    입실시간,
    결제금액,
    예약플랫폼: '여기어때'
  };
}

/** =========================================
 *  [5] 여러 객실 (수기작성) 로직
 * ========================================= */

/** +객실추가 버튼 */
function addRoomRow(){
  /*
    <div class="room-row">
      <select class="roomSelect">
        (객실 선택)
      </select>
      <select class="roomCountSelect">
        (1..12)
      </select>
      <button>삭제</button>
    </div>
  */
  const container= document.getElementById('roomsContainer');
  const rowDiv= document.createElement('div');
  rowDiv.className='room-row';

  // 객실 select
  const selRoom= document.createElement('select');
  selRoom.className='roomSelect';
  const rooms= ['', '대형 카라반','복층 우드캐빈','파티룸','몽골텐트'];
  rooms.forEach(r=>{
    const opt= document.createElement('option');
    opt.value= r;
    opt.textContent= (r===''?'(객실선택)': r);
    selRoom.appendChild(opt);
  });
  selRoom.onchange= ()=> populateRoomCount(rowDiv);
  rowDiv.appendChild(selRoom);

  // 수량 select
  const selCount= document.createElement('select');
  selCount.className='roomCountSelect';
  rowDiv.appendChild(selCount);

  // 삭제버튼
  const btnDel= document.createElement('button');
  btnDel.textContent='삭제';
  btnDel.onclick= ()=> container.removeChild(rowDiv);
  rowDiv.appendChild(btnDel);

  container.appendChild(rowDiv);

  // 초기화
  populateRoomCount(rowDiv);
}

/** 객실이 바뀔 때 수량 select 채우기 */
function populateRoomCount(rowDiv){
  const roomSelect= rowDiv.querySelector('.roomSelect');
  const countSelect= rowDiv.querySelector('.roomCountSelect');
  countSelect.innerHTML= '';

  const val= roomSelect.value.trim();
  let range= [];
  if(!val){
    // 아직 선택 안함
  } else if(val==='대형 카라반'){
    range= Array.from({length:12},(_,i)=> i+1); //1..12
  } else if(val==='복층 우드캐빈'){
    range= Array.from({length:6},(_,i)=> i+1); //1..6
  } else if(val==='파티룸'){
    range= [2];
  } else if(val==='몽골텐트'){
    range= [1];
  }

  if(range.length===0){
    const opt= document.createElement('option');
    opt.value='';
    opt.textContent='(수량)';
    countSelect.appendChild(opt);
    countSelect.disabled= true;
  } else {
    countSelect.disabled= false;
    range.forEach(n=>{
      const opt= document.createElement('option');
      opt.value= n.toString();
      opt.textContent= n+'개';
      countSelect.appendChild(opt);
    });
  }
}

/**
 * 수기작성 폼에서 여러 객실 + 공통정보 → 객체 배열
 */
function gatherManualData(){
  // 공통
  const guest= document.getElementById('manualGuest').value.trim();
  const phone= document.getElementById('manualPhone').value.trim();
  const period= document.getElementById('manualPeriod').value.trim();
  const totalPeople= document.getElementById('manualTotalPeople').value.trim();
  const checkinTime= document.getElementById('manualCheckinTime').value.trim();
  const payment= document.getElementById('manualPayment').value.trim();
  const option= document.getElementById('manualOption').value.trim();

  // 여러 객실 rows
  const container= document.getElementById('roomsContainer');
  const rowDivs= container.querySelectorAll('.room-row');

  const baseNum= generateBaseReservationNumber();
  const result= [];

  rowDivs.forEach((rowDiv, idx)=>{
    const sel= rowDiv.querySelector('.roomSelect').value.trim();
    const cnt= rowDiv.querySelector('.roomCountSelect').value.trim();
    if(!sel) return; // 객실선택 안함 skip

    // 예약번호 = baseNum + (idx+1)
    const finalNum= baseNum + String(idx+1);

    result.push({
      예약번호: finalNum,
      예약자: guest,
      전화번호: phone,
      이용객실: sel,
      이용기간: period,
      수량: cnt||'1',
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

/** 14자리(YYYYMMDDHHmmss) */
function generateBaseReservationNumber(){
  const d= new Date();
  const YYYY= d.getFullYear();
  const MM= String(d.getMonth()+1).padStart(2,'0');
  const DD= String(d.getDate()).padStart(2,'0');
  const HH= String(d.getHours()).padStart(2,'0');
  const mm= String(d.getMinutes()).padStart(2,'0');
  const ss= String(d.getSeconds()).padStart(2,'0');
  return `${YYYY}${MM}${DD}${HH}${mm}${ss}`;
}

/** =========================================
 *  [6] 버튼 함수
 * ========================================= */

/** 파싱 결과 보기 */
function processReservation(){
  if(isManualTabActive()){
    // 여러 객실 배열
    const arr= gatherManualData();
    document.getElementById('outputData').textContent= JSON.stringify(arr,null,2);
  } else {
    // 붙여넣기
    const text= document.getElementById('inputData').value;
    const data= parseReservation(text);
    document.getElementById('outputData').textContent= JSON.stringify(data,null,2);
  }
}

/** 안내문자 양식적용 */
function generateReservationMessage(){
  if(isManualTabActive()){
    // 여러 객실 → 하나의 안내문
    const arr= gatherManualData();
    if(arr.length===0){
      alert("객실 정보를 하나 이상 추가해주세요.");
      return;
    }
    // 첫 번째객실 정보
    const first= arr[0];

    // “이용객실: 대형 카라반 2, 복층 우드캐빈 2”처럼 합치기
    const roomsString= arr.map(o=> `${o.이용객실} ${o.수량}`).join(', ');
    // 수량 합
    const totalCount= arr.reduce((acc,o)=> acc+ parseInt(o.수량||'0',10), 0);
    // 옵션
    const finalOption= first.옵션? first.옵션 : '없음';

    // 안내문 (무통장)
    let message= `
고객님 예약 신청해 주셔서 진심으로 감사드립니다.

- 예약번호: ${first.예약번호}
- 예약자: ${first.예약자}
- 전화번호: ${first.전화번호}
- 이용객실: ${roomsString}
- 이용기간: ${first.이용기간}
- 수량: ${totalCount}
- 옵션: ${finalOption}
- 총 이용 인원: ${first.총이용인원}
- 입실시간: ${first.입실시간}
- 결제금액: ${first.결제금액}
- 예약플랫폼: ${first.예약플랫폼}

(무통장 안내)
우리 1005-504-540028 (주)유연음
...
`.trim();

    // output + clipboard
    document.getElementById('outputData').textContent= message;
    navigator.clipboard.writeText(message)
      .then(()=> alert("안내문자가 클립보드에 복사되었습니다."));

  } else {
    // 붙여넣기
    const text= document.getElementById('inputData').value;
    const data= parseReservation(text);

    // 기존 if/else 분기 (네이버, 야놀자, 여기어때 등)
    // 무통장, 네이버당일, 네이버숙박, 야놀자, 여기어때
    let msg= '';
    const formatted= `
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
- 예약플랫폼: ${data.예약플랫폼}
`.trim();

    // 1) 무통장
    if (text.includes('무통장할인') || data.예약플랫폼==='네이버무통장' || data.무통장여부===true) {
      msg= `고객님 예약 신청해 주셔서 진심으로 감사드립니다.

${formatted}
*추가 옵션 설정을 정확하게 선택해 주셔야 되며 체크인 시 현장 결제도 가능합니다.
 (인원추가, 시간연장, 얼리체크인, 레이트체크아웃 / 바베큐, 불멍, 온수풀, 고기세트 별도)

*숙박은 “15시”부터 입실 가능하며 수영은 13시부터 이용하실 수 있습니다.
얼리체크인을 원하실 경우 카톡으로 별도 문의주세요.

▶계좌번호  우리 1005 504 540028 (주) 유연음

※입금 시 입금자, 예약자명이 동일해야 하며, 예약 안내 수신 후 "2시간 이내" 입금 확인이 안 될 시 자동 취소 처리됩니다.`;
  } 
    // 2) 네이버 당일(기간에 ~ 없음)
    else if(data.예약플랫폼==='네이버' && data.이용기간 && !data.이용기간.includes('~')){
      msg= `[양주잼잼] 예약해 주셔서 진심으로 감사합니다♬
      *기본 이용시간은 6시간이며 예약해주신 방문시간을 엄수해 주세요.
${formatted}
*2인 기준 요금이며 인원추가 미선택 시 현장에서 추가결제해 주셔야 합니다.

*옵션(바베큐, 불멍, 고기세트)은 별도이며 체크인 시 현장 결제도 가능합니다.

*대형풀 무료 이용 / 온수풀 유료 이용

*예약 시 시간연장 신청을 안 할 경우에는 추가 시간연장이 불가할 수 있습니다. 당일 일정에 따라 입실 후에도 시간연장이 가능할 수 있으니 별도 문의 바랍니다.

*빠른 입실을 원하시면 카톡 또는 문자로 가능 여부를 문의하시기 바랍니다. 시간연장은 30분, 1시간 단위로 가능하며 종일권( ~22시), 야간권(22시~ ) 상품도 있으니 참고바랍니다.

예약 내용 확인해보시고 수정 또는 변경해야할 내용이 있다면 말씀 부탁드립니다.

(광고) 
양손 가볍게, 잼잼 바베큐 키트 출시🍖
https://litt.ly/jamjam_bbq`;
  } 
    // 3) 네이버 숙박
    else if(data.예약플랫폼==='네이버'){
      msg= `[양주잼잼] 네이버 숙박
${formatted}
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
    // 4) 야놀자
    else if(data.예약플랫폼==='야놀자'){
      msg= `[양주잼잼] 예약해 주셔서 진심으로 감사합니다♬
      
야놀자로 예약하셨다면
여기로 성함과 전화번호를 꼭 남겨주세요!
${formatted}
*기준인원 2인 기준 요금이며 인원추가 미선택 시 현장에서 추가결제해 주셔야 합니다.

*옵션(바베큐, 불멍, 고기세트)은 별도이며 체크인 시 현장 결제도 가능합니다.
*대형풀 무료 이용 / 온수풀 유료 이용

*대실 이용시간은 6시간이며 예약해주신 방문시간을 엄수해 주세요.
*숙박은 “15시”부터 입실 가능하며 수영장 이용은 13시부터 이용하실 수 있습니다.

얼리체크인/레이트체크아웃을 원하실 경우 카톡 또는 문자로 별도 문의주세요.

체크인 또는 체크아웃 하실 때 관리동에 말씀해 주시면 환불처리 도와드립니다.^^
예약 내용 확인해보시고 수정 또는 변경해야할 내용이 있다면 말씀 부탁드립니다.

(광고)
양손 가볍게, 잼잼 바베큐 키트 출시🍖
https://litt.ly/jamjam_bbq`;
  }
    // 5) 여기어때
    else if(data.예약플랫폼==='여기어때'){
      msg= `[양주잼잼] 예약해 주셔서 진심으로 감사합니다♬

여기어때로 예약하셨다면
여기로 성함과 전화번호를 꼭 남겨주세요!
${formatted}
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

    document.getElementById('outputData').textContent= msg;
    navigator.clipboard.writeText(msg)
      .then(()=> alert("안내문자가 클립보드에 복사되었습니다."));
  }
}

/** 구글 스프레드시트로 보내기 */
function sendToSheet(){
  if(isManualTabActive()){
    // 여러 객실
    const arr= gatherManualData();
    if(!arr.length){
      alert("객실 정보가 없습니다.");
      return;
    }
    (async()=>{
      let success=0,fail=0;
      for(let i=0;i<arr.length;i++){
        const ok= await sendSingleRow(arr[i]);
        if(ok) success++; else fail++;
      }
      alert(`총 ${arr.length}개 중 ${success}개 성공, ${fail}개 실패`);
    })();
  } else {
    // 붙여넣기
    const text= document.getElementById('inputData').value;
    const data= parseReservation(text);
    (async()=>{
      const ok= await sendSingleRow(data);
      alert(ok?"전송 성공":"전송 실패");
    })();
  }
}

/** 단일 row 전송 */
async function sendSingleRow(d){
  const params= new URLSearchParams({
    예약번호:    d.예약번호||"",
    예약자:     d.예약자||"",
    전화번호:   d.전화번호||"",
    이용객실:   d.이용객실||"",
    이용기간:   d.이용기간||"",
    수량:       d.수량||"",
    옵션:       d.옵션 ? d.옵션.replace(/, /g, '\n') : "",
    총이용인원: d.총이용인원||"",
    입실시간:   d.입실시간||"",
    결제금액:   d.결제금액||"",
    예약플랫폼: d.예약플랫폼||""
  });
  const url= gasUrl+'?'+params.toString();
  try {
    const r= await fetch(url);
    const msg= await r.text();
    console.log(`[${d.예약번호}] => ${msg}`);
    return !msg.includes("오류") && !msg.includes("이미 있는 예약");
  } catch(err){
    console.error(err);
    return false;
  }
}

/** =========================================
 *  [7] 모달
 * ========================================= */
function openTemplateModal(){
  document.getElementById('templateModal').style.display='block';
}
function closeTemplateModal(){
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
  alert("양식이 저장되었습니다.");
  closeTemplateModal();
}

/** =========================================
 *  [9] 달력 (기존)
 * ========================================= */
let currentMonth= new Date().getMonth();
let currentYear= new Date().getFullYear();
let firstSelectedDate= null;
let secondSelectedDate= null;

function buildCalendar(){
  const container= document.getElementById('calendarContainer');
  container.innerHTML='';

  const headerDiv= document.createElement('div');
  headerDiv.className='calendar-header';

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
  monthYearSpan.textContent= `${currentYear}년 ${currentMonth+1}월`;

  headerDiv.appendChild(prevBtn);
  headerDiv.appendChild(monthYearSpan);
  headerDiv.appendChild(nextBtn);
  container.appendChild(headerDiv);

  // 달력 grid
  const dayNames=['일','월','화','수','목','금','토'];
  const gridDiv= document.createElement('div');
  gridDiv.className='calendar-grid';

  // 요일 헤더
  dayNames.forEach(d=>{
    const dh= document.createElement('div');
    dh.className='calendar-day inactive';
    dh.style.fontWeight='bold';
    dh.textContent= d;
    gridDiv.appendChild(dh);
  });

  const firstDay= new Date(currentYear, currentMonth,1).getDay();
  const lastDate= new Date(currentYear, currentMonth+1,0).getDate();

  for(let i=0;i<firstDay;i++){
    const blank= document.createElement('div');
    blank.className='calendar-day inactive';
    gridDiv.appendChild(blank);
  }
  for(let date=1; date<=lastDate; date++){
    const dayDiv= document.createElement('div');
    dayDiv.className='calendar-day';
    dayDiv.textContent= date;

    const thisDate= new Date(currentYear,currentMonth,date);
    dayDiv.onclick=()=> onDateClick(thisDate);

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
    if(same){
      secondSelectedDate=null;
    } else {
      if(dateObj<firstSelectedDate){
        secondSelectedDate= firstSelectedDate;
        firstSelectedDate= dateObj;
      } else {
        secondSelectedDate= dateObj;
      }
    }
  } else {
    firstSelectedDate= dateObj;
    secondSelectedDate= null;
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
      const dayNum= Number(cell.textContent);
      if(isNaN(dayNum)) continue;

      const cellDate= new Date(currentYear,currentMonth,dayNum);

      // 단일
      if(sameDay(cellDate, firstSelectedDate) && !secondSelectedDate){
        cell.classList.add('selected');
      }
      // 범위
      else if(secondSelectedDate){
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
    periodInput.value= fmt(firstSelectedDate);
  } else {
    let start= (firstSelectedDate<secondSelectedDate? firstSelectedDate: secondSelectedDate);
    let end=   (firstSelectedDate<secondSelectedDate? secondSelectedDate:firstSelectedDate);
    periodInput.value= `${fmt(start)}~${fmt(end)}`;
  }
}
function sameDay(d1,d2){
  return d1.getFullYear()===d2.getFullYear() &&
    d1.getMonth()===d2.getMonth() &&
    d1.getDate()===d2.getDate();
}
