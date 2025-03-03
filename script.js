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

  const optionsStartIndex = lines.findIndex(line => line.includes('옵션'));
  const totalPeopleIndex = lines.findIndex(line => line.includes('총 이용 인원 정보'));
  const optionLines = lines.slice(optionsStartIndex + 1, totalPeopleIndex).filter(Boolean);

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

  let siteLine = lines.find(line => line.includes('사이트'));
  let 이용객실 = '';

  if (siteLine) {
    const rooms = ['대형카라반', '복층우드캐빈', '파티룸', '몽골텐트'];
    const normalizedSiteLine = siteLine.replace(/\s+/g, '');

    이용객실 = rooms.find(room => normalizedSiteLine.includes(room));

    if (이용객실 === '대형카라반') 이용객실 = '대형 카라반';
    if (이용객실 === '복층우드캐빈') 이용객실 = '복층 우드캐빈';
  }

  return {
    예약번호: getValue('예약번호'),
    예약자: getValue('예약자'),
    전화번호: getValue('전화번호'),
    이용객실,
    이용기간: getValue('이용기간'),
    수량: getValue('수량'),
    옵션: filteredOptions.join(', '),
    총이용인원: getValue('총 이용 인원 정보'),
    입실시간: getValue('입실 시간 선택'),
    결제금액: getValue('결제금액'),
    예약플랫폼: '네이버'
  };
}



function parseYanoljaReservation(text) {
  // 야놀자 예약정보 파싱 로직 (다음 단계에서 작성)
  return {};
}

function parseHereReservation(text) {
  // 여기어때 예약정보 파싱 로직 (다음 단계에서 작성)
  return {};
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
