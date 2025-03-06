const gasUrl = 'https://script.google.com/macros/s/AKfycbyWgJ77LSr7gbVvpwSyBIyn5wX-TA8DmTrz5qppqtN6FEovsN0_rFixzcFjHwuVP_GB/exec'; // GAS 배포 후 URL 입력

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
}

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

    if (이용객실 === '대형카라반') 이용객실 = '대형 카라반';
    if (이용객실 === '복층우드캐빈') 이용객실 = '복층 우드캐빈';
  }

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
    결제금액: getValue('결제금액') || getValue('결제예상금액'), // 👈 수정된 부분
    예약플랫폼: '네이버'
  };
}


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



function processReservation() {
  const text = document.getElementById('inputData').value;
  const data = parseReservation(text);
  document.getElementById('outputData').textContent = JSON.stringify(data, null, 2);
}

function createMessage(type) {
  const data = parseReservation(document.getElementById('inputData').value);
  let message = '';

  switch(type) {
    case 1: message = `무통장 예약 안내\n${JSON.stringify(data)}`; break;
    case 2: message = `숙박 예약 확정\n${JSON.stringify(data)}`; break;
    case 3: message = `당일캠핑 예약 확정\n${JSON.stringify(data)}`; break;
    case 4: message = `늦은 입실 예약 확정\n${JSON.stringify(data)}`; break;
    case 5: message = `빠른 입실 예약 확정\n${JSON.stringify(data)}`; break;
    case 6: message = `야놀자 예약 확정\n${JSON.stringify(data)}`; break;
    case 7: message = `여기어때 예약 확정\n${JSON.stringify(data)}`; break;
  }

  navigator.clipboard.writeText(message).then(() => alert('안내문 복사됨'));
}

function copyResult() {
  const text = document.getElementById('outputData').textContent;
  navigator.clipboard.writeText(text).then(() => alert('결과 복사됨'));
}

function sendToSheet() {
  const data = parseReservation(document.getElementById('inputData').value);
  const params = new URLSearchParams({
  ...data,
  옵션: data.옵션 ? data.옵션.replace(/, /g, '\n') : ''
  });

  fetch(gasUrl + '?' + params)
    .then(r => r.text())
    .then(msg => alert(msg))
    .catch(err => alert('전송 중 오류 발생: ' + err));
}



function generateReservationMessage() {
  const rawText = document.getElementById('inputData').value;
  const data = parseReservation(rawText);
  let message = '';

  // 파싱된 내용을 보기 좋게 구성하는 공통함수
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

  // 무통장 (네이버 무통장 신청인 경우)
  if (rawText.includes('무통장할인')) {
    message = `고객님 예약 신청해 주셔서 진심으로 감사드립니다.

${formattedParsedData}

*추가 옵션 설정을 정확하게 선택해 주셔야 되며 체크인 시 현장 결제도 가능합니다.
 (인원추가, 시간연장, 얼리체크인, 레이트체크아웃 / 바베큐, 불멍, 온수풀, 고기세트 별도)

*숙박은 “15시”부터 입실 가능하며 수영은 13시부터 이용하실 수 있습니다.
얼리체크인을 원하실 경우 카톡으로 별도 문의주세요.

▶계좌번호  우리 1005 504 540028 (주) 유연음

※입금 시 입금자, 예약자명이 동일해야 하며, 예약 안내 수신 후 "2시간 이내" 입금 확인이 안 될 시 자동 취소 처리됩니다.`;
  } 
  // 네이버 당일캠핑
  else if (data.예약플랫폼 === '네이버' && data.이용기간 && !data.이용기간.includes('~')) {
    message = `[양주잼잼] 예약해 주셔서 진심으로 감사합니다♬

*기본 이용시간은 6시간이며 예약해주신 방문시간을 엄수해 주세요.

${formattedParsedData}

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

얼리체크인/레이트체크아웃을 원하실 경우 카톡 또는 문자로 별도 문의주세요.

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

  // 최종 결과를 화면에 표시 및 클립보드에 복사
  document.getElementById('outputData').textContent = message;
  navigator.clipboard.writeText(message).then(() => alert('안내문자가 클립보드에 복사되었습니다.'));
}

// 모달창 열기
function openTemplateModal() {
  document.getElementById('templateBank').value = localStorage.getItem('templateBank') || defaultTemplates.bank;
  document.getElementById('templateNaverStay').value = localStorage.getItem('templateNaverStay') || defaultTemplates.naverStay;
  document.getElementById('templateNaverDay').value = localStorage.getItem('templateNaverDay') || defaultTemplates.naverDay;
  document.getElementById('templateYanolja').value = localStorage.getItem('templateYanolja') || defaultTemplates.yanolja;
  document.getElementById('templateHere').value = localStorage.getItem('templateHere') || defaultTemplates.here;

  document.getElementById('templateModal').style.display = 'block';
}

// 모달창 닫기
function closeTemplateModal() {
  document.getElementById('templateModal').style.display = 'none';
}

// 기본 양식 설정
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

// 양식 저장하기
function saveTemplates() {
  localStorage.setItem('templateBank', document.getElementById('templateBank').value);
  localStorage.setItem('templateNaverStay', document.getElementById('templateNaverStay').value);
  localStorage.setItem('templateNaverDay', document.getElementById('templateNaverDay').value);
  localStorage.setItem('templateYanolja', document.getElementById('templateYanolja').value);
  localStorage.setItem('templateHere', document.getElementById('templateHere').value);

  alert('양식이 저장되었습니다.');
  closeTemplateModal();
}

function addRoom() {
  const roomContainer = document.getElementById('roomContainer');
  const roomDiv = document.createElement('div');
  roomDiv.className = 'roomSelection';
  roomDiv.innerHTML = `
    <select class="roomType">
      <option>대형 카라반</option>
      <option>복층 우드캐빈</option>
      <option>파티룸</option>
      <option>몽골텐트</option>
    </select>
    <select class="roomCount">
      ${Array.from({length:12},(_,i)=>`<option>${i+1}</option>`).join('')}
    </select>
    <button onclick="removeRoom(this)">삭제</button>
  `;
  document.getElementById('roomContainer').appendChild(roomDiv);
}

function removeRoom(btn){
  btn.parentElement.remove();
}

// 수기 입력된 내용을 textarea에 전달하고 파싱결과 보기 실행
function manualReservationParsing() {
  const reservationNumber = document.getElementById('reservationNumber').value;
  const reserver = document.getElementById('reserver').value;
  const phoneNumber = document.getElementById('phoneNumber').value;
  const usePeriod = document.getElementById('usePeriod').value;
  const options = document.getElementById('options').value || '없음';
  const totalGuests = document.getElementById('totalGuests').value;
  const checkinTime = document.getElementById('checkinTime').value;
  const payment = document.getElementById('payment').value;
  const platform = document.getElementById('platform').value;

  let rooms = "";
  let totalQuantity = 0;

  document.querySelectorAll('.room-selection').forEach(selection => {
    const roomType = selection.querySelector('.roomType').value;
    const roomCount = parseInt(selection.querySelector('.roomCount').value, 10);
    rooms += `${roomType} ${roomCount}개, `;
    if(roomType !== '파티룸') {
      totalQuantity += Number(roomCount);
    }
  });

  const manualText = `
예약번호: ${reservationNumber}
예약자: ${reserver}
전화번호: ${phoneNumber}
이용객실: ${rooms}
이용기간: ${usePeriod}
수량: ${totalQuantity}
옵션: 없음
총 이용 인원: ${document.getElementById('totalGuests').value}
입실 시간: ${document.getElementById('checkinTime').value}
결제금액: ${payment}
예약플랫폼: ${platform}`;

  document.getElementById('inputData').value = manualData;
  
  processReservation();  // 기존 기능 호출
}


