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
  // 네이버 예약정보 파싱 로직 (다음 단계에서 작성)
  return {};
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
