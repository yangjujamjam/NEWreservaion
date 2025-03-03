const gasUrl = 'https://script.google.com/macros/s/AKfycbwCiRN7TNVJ6VWk97aD02jndsE5vTcx1pmGNpsTwGK495QsdYg5Lb3aio4RxHKMmuMR/exec'; // GAS 배포 후 URL 입력

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

  // 방문자 처리 로직 추가
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

  // 객실 이름 파싱
  let siteLine = lines.find(line => line.includes('사이트'));
  let 이용객실 = '';
  if (siteLine) {
    const rooms = ['대형카라반', '복층우드캐빈', '파티룸', '몽골텐트'];
    const normalizedSiteLine = siteLine.replace(/\s+/g, '');
    이용객실 = rooms.find(room => normalizedSiteLine.includes(room));

    if (이용객실 === '대형카라반') 이용객실 = '대형 카라반';
    if (이용객실 === '복층우드캐빈') 이용객실 = '복층 우드캐빈';
  }

  // 옵션 처리 로직
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
    'Please make sure to check the number of people.',
    'Information on swimming pools and external facilities',
    'Room Facilities Guide'
  ];
  const filteredOptions = optionLines.filter(line => !unwantedOptions.some(unwanted => line.includes(unwanted)));

  // 총 이용 인원 정보 파싱
  let totalPeopleIndex = lines.findIndex(line => line.includes('총 이용 인원 정보'));
  let 총이용인원 = '';
  if (totalPeopleIndex !== -1 && totalPeopleIndex + 1 < lines.length) {
    총이용인원 = lines[totalPeopleIndex + 1].trim();
  }

  // 입실 시간 파싱
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
    결제금액: getValue('결제금액'),
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

  const formatDate = (dateStr) => {
    const [m, d, day] = dateStr.match(/(\d+)\/(\d+)\s*\((.)\)/).slice(1);
    const year = new Date().getFullYear(); // 현재 연도를 사용하거나 명시적으로 지정 가능
    return `${year}. ${Number(m)}. ${Number(d)}.(${day})`;
  };

  const 이용기간 = `${formatDate(입실일시라인)}~${formatDate(퇴실일시라인)}`;

  const 입실시간Match = 입실일시라인.match(/\d{2}:\d{2}/)[0];
  const 퇴실시간Match = 퇴실일시라인.match(/\d{2}:\d{2}/)[0];
  const 입실시간 = `[숙박] ${입실시간Match} 입실 / ${퇴실시간Match} 퇴실`;

  return {
    예약번호,
    예약자,
    전화번호,
    이용객실: 객실정보,
    이용기간,
    수량: '1', // 기본값 1로 설정
    옵션: '', // 옵션 없음
    총이용인원: '대인2', // 기본값으로 설정
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
  fetch(gasUrl + '?' + new URLSearchParams(data))
    .then(r => r.text())
    .then(msg => alert(msg));
}
