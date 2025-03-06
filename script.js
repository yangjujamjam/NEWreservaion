<!DOCTYPE html>
<html lang="ko">

<head>
  <meta charset="UTF-8">
  <title>예약 업무 관리</title>
  <link rel="stylesheet" href="style.css">
</head>

<body>
  <header class="top-menu">
    <nav>
      <ul>
        <li><a href="index.html">예약업무</a></li>
        <li><a href="#">예약관리</a></li>
        <li><a href="#">예약캘린더</a></li>
      </ul>
    </nav>
  </header>

  <h1>예약 업무 관리</h1>
  <!-- 수기예약 입력 폼 (수정 최종본) -->
<div style="display: flex; gap: 20px; margin-bottom:20px; align-items:flex-start;">
  
  <div id="manualForm" style="display:flex; flex-direction:column; gap:5px;">
    <input type="text" id="reservationNumber" placeholder="예약번호 (수기 입력 가능)">
    <input type="text" id="reservationName" placeholder="예약자">
    <input type="text" id="phoneNumber" placeholder="전화번호">

    <div id="roomContainer">
      <div class="roomSelection">
        <select class="roomType">
          <option value="대형 카라반">대형 카라반</option>
          <option value="복층 우드캐빈">복층 우드캐빈</option>
          <option value="파티룸">파티룸</option>
          <option value="몽골텐트">몽골텐트</option>
        </select>

        <select class="roomQty">
          <option>1</option><option>2</option><option>3</option>
          <option>4</option><option>5</option><option>6</option>
          <option>7</option><option>8</option><option>9</option>
          <option>10</option><option>11</option><option>12</option>
        </select>

        <button onclick="removeRoomSelection(this)">삭제</button>
      </div>
    </div>

    <button onclick="addRoomSelection()">객실 추가</button>

    <input type="text" id="period" placeholder="이용기간 (yyyy. m. d.(a)~yyyy. m. d.(a))">
    <input type="text" id="totalQuantity" placeholder="수량 (자동계산)" readonly>
    <input type="text" id="options" placeholder="옵션">
    <input type="text" id="totalPeople" placeholder="총 이용 인원">
    <input type="text" id="checkinTime" placeholder="입실시간">
    <input type="text" id="payment" placeholder="결제금액">

    <select id="platform">
      <option value="전화예약">전화예약</option>
      <option value="네이버톡톡">네이버톡톡</option>
      <option value="카카오문의">카카오문의</option>
      <option value="인스타그램">인스타그램</option>
      <option value="기타">기타</option>
    </select>

    <button onclick="sendManualReservation()">수기예약 전송</button>
  </div>

  <textarea id="inputData" placeholder="여기에 예약정보 텍스트를 붙여넣으세요" style="width:200px;"></textarea>
  <div class="manual-reservation">
  <div class="manual-input">
    <label>예약번호: <input type="text" id="reservationNumber"></label>
    <label>예약자: <input type="text" id="reservationName"></label>
    <label>전화번호: <input type="text" id="phoneNumber"></label>

    <label>이용객실:
      <select id="roomType">
        <option value="대형 카라반">대형 카라반</option>
        <option value="복층 우드캐빈">복층 우드캐빈</option>
        <option value="파티룸">파티룸</option>
        <option value="몽골텐트">몽골텐트</option>
      </select>
    </label>

    <label>수량:
      <select id="roomQuantity">
        <option value="1">1개</option>
        <option value="2">2개</option>
        <option value="3">3개</option>
        <option value="4">4개</option>
        <option value="5">5개</option>
        <option value="6">6개</option>
        <option value="7">7개</option>
        <option value="8">8개</option>
        <option value="9">9개</option>
        <option value="10">10개</option>
        <option value="11">11개</option>
        <option value="12">12개</option>
      </select>
    </label>

    <button onclick="addRoom()">객실 추가</button>
    <div id="selectedRooms"></div>

    <label>이용기간:
      <input type="text" id="reservationPeriod" placeholder="yyyy. m. d.(a)~yyyy. m. d.(a)">
    </label>

    <label>옵션: <input type="text" id="option"></label>
    <label>총 이용 인원: <input type="text" id="totalGuests"></label>
    <label>입실 시간: <input type="text" id="checkInTime"></label>
    <label>결제금액: <input type="text" id="paymentAmount"></label>

    <label>예약플랫폼:
      <select id="reservationPlatform">
        <option value="전화예약">전화예약</option>
        <option value="네이버톡톡">네이버톡톡</option>
        <option value="카카오문의">카카오문의</option>
        <option value="인스타그램">인스타그램</option>
        <option value="기타">기타</option>
      </select>
    </label>

    <button onclick="manualReservationParsing()">파싱결과 보기</button>
    <button onclick="generateCustomMessage()">안내문자 양식적용</button>
    <button onclick="sendManualToSheet()">구글 스프레드시트로 보내기</button>

</div>

<script>
function sendManualToSheet(){
  const data = {
    reservationNumber: new Date().toISOString().replace(/[^0-9]/g, "").slice(0,14),
    reservationName: document.getElementById('reservationName').value,
    phoneNumber: document.getElementById('phoneNumber').value,
    roomType: document.getElementById('roomType').value,
    roomQuantity: document.getElementById('roomQuantity').value,
    period: document.getElementById('period').value,
    option: document.getElementById('option').value,
    totalGuests: document.getElementById('totalGuests').value,
    checkinTime: document.getElementById('checkinTime').value,
    platform: document.getElementById('platform').value
  };

  google.script.run.withSuccessHandler(() => {
    alert("스프레드시트에 저장되었습니다.");
  }).sendManualReservation(data);
}

</script>


</div>

<script>
function addRoomSelection(){
  const container = document.getElementById('roomContainer');
  const newDiv = document.createElement('div');
  newDiv.classList.add('roomSelection');
  newDiv.innerHTML = `
    <select class="roomType">
      <option value="대형 카라반">대형 카라반</option>
      <option value="복층 우드캐빈">복층 우드캐빈</option>
      <option value="파티룸">파티룸</option>
      <option value="몽골텐트">몽골텐트</option>
    </select>

    <select class="roomQty">
      ${Array.from({length:12},(_,i)=>`<option>${i+1}</option>`).join('')}
    </select>

    <button onclick="removeRoomSelection(this)">삭제</button>
  `;
  container.appendChild(newDiv);
}

function removeRoomSelection(btn){
  btn.parentNode.remove();
}

function calculateTotalQuantity(){
  const selections = document.querySelectorAll('.roomSelection');
  let total = 0;

  selections.forEach(selection => {
    const roomType = selection.querySelector('.roomType').value;
    const roomQty = parseInt(selection.querySelector('.roomQty').value);

    if(roomType !== "파티룸" && roomType !== "몽골텐트"){
      total += roomQty;
    }
  });

  document.getElementById('totalQuantity').value = total;
}

setInterval(calculateTotalQuantity, 1000);

function sendManualReservation(){
  const now = new Date().toLocaleString();
  const rooms = [];
  const selections = document.querySelectorAll('.roomSelection');

  selections.forEach(selection=>{
    const roomType = selection.querySelector('.roomType').value;
    const roomQty = selection.querySelector('.roomQty').value;
    rooms.push(`${roomType} ${roomQty}개`);
  });

  const reservation = {
    예약번호: document.getElementById('reservationNumber').value || now,
    예약자: document.getElementById('reservationName').value,
    전화번호: document.getElementById('phoneNumber').value,
    이용객실: rooms.join(', '),
    이용기간: document.getElementById('period').value,
    수량: document.getElementById('totalQuantity').value,
    옵션: document.getElementById('options').value,
    총이용인원: document.getElementById('totalPeople').value,
    입실시간: document.getElementById('checkinTime').value,
    결제금액: document.getElementById('payment').value,
    예약플랫폼: document.getElementById('platform').value,
    입력일시: now
  };

  google.script.run.withSuccessHandler(()=>{
    alert('수기 예약이 저장되었습니다.');
  }).doPost(reservation);
}
</script>


  <textarea id="inputData" placeholder="여기에 예약정보 텍스트를 붙여넣으세요"></textarea>

  <!-- 버튼 부분 -->
<div class="buttons">
  <button onclick="processReservation()">파싱 결과 보기</button>
  <button onclick="generateReservationMessage()">안내문자 양식적용</button>
  <button onclick="sendToSheet()">구글 스프레드시트로 보내기</button>
</div>

<div class="button-container">
  <button onclick="openTemplateModal()">양식 변경하기</button>
</div>

<!-- 양식수정 모달창 -->
<div id="templateModal" class="modal">
  <div class="modal-content">
    <span class="close" onclick="closeTemplateModal()">&times;</span>
    <h3>안내문자 양식 수정</h3>

    <label>무통장 양식:</label>
    <textarea id="templateBank"></textarea>

    <label>네이버 숙박 양식:</label>
    <textarea id="templateNaverStay"></textarea>

    <label>네이버 당일 양식:</label>
    <textarea id="templateNaverDay"></textarea>

    <label>야놀자 양식:</label>
    <textarea id="templateYanolja"></textarea>

    <label>여기어때 양식:</label>
    <textarea id="templateHere"></textarea>

    <button onclick="saveTemplates()">양식 저장하기</button>
  </div>
</div>


  <pre id="outputData">여기에 결과가 표시됩니다.</pre>

  <script src="script.js"></script>
</body>

</html>
