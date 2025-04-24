/*******************************************************
 * script_talk.js (모든 알림톡/대체문자 함수 포함 완전판)
 *******************************************************/

/** =========================================
 *  [1] 알림톡 전역 설정
 * ========================================= */
const ALIMTALK_API_URL   = 'https://kakaoapi.aligo.in/akv10/alimtalk/send/';
const ALIMTALK_API_KEY   = 's2qfjf9gxkhzv0ms04bt54f3w8w6b9jd';
const ALIMTALK_USER_ID   = 'yangjujamjam';
const ALIMTALK_SENDERKEY = 'fc0570b6c7f7785506ea85b62838fd6fb37a3bcc';
const ALIMTALK_SENDER    = '01059055559';

const DEFAULT_BUTTON_INFO = {
  button: [{
    name: "채널추가",
    linkType: "AC",
    linkTypeName: "채널 추가",
    linkMo: "http://pf.kakao.com/_xdJxcExj"
  }]
};

/** =========================================
 *  [2] 템플릿 코드 & 본문 정의
 * ========================================= */
// 무통장 템플릿 (TZ_1481)
const TEMPLATE_CODE_BANK    = 'TZ_1481';
const TEMPLATE_TEXT_BANK    = `고객님 예약 신청해 주셔서 
진심으로 감사드립니다.

#{파싱내용}

▶계좌번호  우리 1005 504 540028 (주) 유연음

※입금 시 입금자, 예약자명이 동일해야 하며, 예약 안내 수신 후 "2시간 이내" 입금 확인이 안 될 시 자동 취소 처리됩니다.

■ 이용 안내
▶ 2인을 초과하여 예약하셨을 경우, 인원추가를 선택하지 않으셨다면 현장에서 추가 결제가 필요합니다.

▶ 옵션(인원추가, 바베큐, 불멍, 온수풀)은 별도이며 현장 결제 가능합니다.  
※ 고기 및 채소 포함 옵션은 당일 취소가 불가능합니다.  
※ 대형풀은 무료, 온수풀은 유료로 운영됩니다.

▶ 얼리체크인, 레이트체크아웃 시 1시간당 1인 5,000원의 추가 요금이 부과됩니다.  
이용을 원하실 경우 반드시 사전에 문의해 주세요.

▶ 수영장은 체크인 시간 2시간 전부터 이용 가능합니다.

※예약 내용을 다시 한번 확인하시고 수정 또는 변경 사항이 있으면 연락 바랍니다.`;

// 숙박 템플릿 (TZ_1466)
const TEMPLATE_CODE_LODGING = 'TZ_1466';
const TEMPLATE_TEXT_LODGING = `예약해 주셔서 진심으로 감사합니다♪

#{파싱내용}

■ 숙박 안내
▶ 2인을 초과하여 예약하신 경우, 인원 추가를 선택하지 않으셨다면 현장에서 추가 결제가 필요합니다.

▶ 옵션(인원추가, 바베큐, 불멍, 온수풀)은 별도이며, 현장에서 결제 가능합니다.
※ 고기 및 채소 포함 옵션은 당일 취소가 불가능합니다.
※ 대형풀 무료 이용 / 온수풀 유료 이용

▶ 선택하신 입실 시간을 꼭 준수해 주시기 바랍니다.

▶ 얼리체크인, 레이트체크아웃 시 1시간당 1인 5,000원의 추가 요금이 부과됩니다.
이용을 원하시면 반드시 사전 문의 바랍니다.

▶ 수영장은 체크인 시간 2시간 전부터 이용 가능합니다.

예약 내용을 다시 한번 확인해 주시고, 수정이나 변경이 있으시면 연락 바랍니다.

■ 환불 규정  
- 입실 10일 전 : 없음  
- 입실 9일 전 : 10%  
- 입실 8일 전 : 20%  
- 입실 7일 전 : 30%  
- 입실 6일 전 : 40%  
- 입실 5일 전 : 50%  
- 입실 4일 전 : 60%  
- 입실 3일 전 : 70%  
- 입실 2일 전 ~ 당일 : 100%

※ 천재지변 등 예외는 별도 문의 바랍니다.`;

// 당일 템플릿 (TZ_1465)
const TEMPLATE_CODE_DAYUSE  = 'TZ_1465';
const TEMPLATE_TEXT_DAYUSE  = `예약해 주셔서 진심으로 감사합니다♪

■ 선택하신 이용시간은
#{이용시간}이며, 예약하신 방문 시간을 꼭 지켜주시기 바랍니다.

#{파싱내용}

■ 이용 안내
▶ 2인을 초과하여 예약하셨을 경우, 인원추가를 선택하지 않으셨다면 현장에서 추가 결제가 필요합니다.

▶ 옵션(인원추가, 바베큐, 불멍, 온수풀)은 별도이며 현장 결제 가능합니다.  
※ 고기 및 채소 포함 옵션은 당일 취소가 불가능합니다.  
※ 대형풀은 무료, 온수풀은 유료로 운영됩니다.

▶ 예약하신 입실 시간을 꼭 준수해 주시기 바랍니다.

▶ 얼리체크인, 레이트체크아웃 시 1시간당 1인 5,000원의 추가 요금이 부과됩니다.  
이용을 원하실 경우 반드시 사전에 문의해 주세요.

▶ 수영장은 체크인 시간 2시간 전부터 이용 가능합니다.

예약 내용을 다시 한번 확인하시고 수정 또는 변경 사항이 있으면 연락 바랍니다.

■ 환불 규정  
- 입실 10일 전 : 없음  
- 입실 9일 전 : 10%  
- 입실 8일 전 : 20%  
- 입실 7일 전 : 30%  
- 입실 6일 전 : 40%  
- 입실 5일 전 : 50%  
- 입실 4일 전 : 60%  
- 입실 3일 전 : 70%  
- 입실 2일 전~당일 : 100%

※ 천재지변 등 예외는 별도 문의 바랍니다.`;

// 전날 안내 숙박 (TY_8998)
const TEMPLATE_REMIND_LODGING_CODE = 'TY_8998';
const TEMPLATE_REMIND_LODGING_TEXT = `안녕하세요 양주잼잼입니다. 
방문 전 확인 부탁드립니다.

■ 숙박 이용안내
▶ 입실: 오후 3시~8시 (8시 이후 사전 연락 필수)
▶ 퇴실: 오전 11시까지

■ 체크인 안내
- 관리동(노란 건물)에서 입실 안내
- 웨건 카트로 짐 이동 가능

■ 옵션 및 추가 요금
- 얼리체크인/레이트체크아웃: 1시간당 1인 5,000원

■ 공용시설 안내
- 매점: 8시~21시
- 샤워장/화장실: 관리동 왼편
- 흡연장: 주차장 옆
- 분리수거장: 주차장 옆

■ 주의사항
- 예약 인원 외 방문 불가
- 반려동물 동반 불가
- 개인 화로대 금지(가스 가능)
- 소음/취사 주의

■ 비치용품 및 준비물
- 침대, TV, 에어컨, 냉장고, 전자레인지 등
- 개인 세면도구, 수건, 수영복 등
`;

// 전날 안내 당일 (TZ_1472)
const TEMPLATE_REMIND_DAYUSE_CODE = 'TZ_1472';
const TEMPLATE_REMIND_DAYUSE_TEXT = `안녕하세요 양주잼잼입니다. 
방문 전 확인 부탁드립니다.

■ 당일캠핑 이용 안내
- #{이용시간}
- 시간 연장 불가
- 얼리/레이트 체크: 1시간당 1인 5,000원

■ 체크인 안내
- 관리동(노란 건물)에서 입실 안내

■ 공용시설 안내
- 매점: 8시~21시
- 샤워장/화장실: 관리동 왼편

■ 주의사항
- 반려동물 금지
- 화로대 금지
- 소음 자제

■ 준비물
- 개인 세면도구, 수영복, 타올 등
`;

// 퇴실 안내 숙박 (TZ_1475)
const TEMPLATE_CHECKOUT_STAY_CODE = 'TZ_1475';
const TEMPLATE_CHECKOUT_STAY_TEXT = `■ 퇴실 전 체크아웃 안내

금일 퇴실 시간은 #{퇴실시간}시입니다.

▶ 설거지, 조명/문 확인
▶ 쓰레기 분리배출
▶ 리모컨 바구니 관리실 반납

즐거운 글램핑 되셨길 바랍니다.`;

// 퇴실 안내 당일 (TZ_1476)
const TEMPLATE_CHECKOUT_DAY_CODE = 'TZ_1476';
const TEMPLATE_CHECKOUT_DAY_TEXT = `■ 퇴실 전 확인사항

▶ 퇴실 시간: #{퇴실시간}
▶ 설거지, 쓰레기 배출
▶ 리모컨 반납, 문/조명 확인

감사합니다.`;

// 매너타임 안내 (TY_8981)
const TEMPLATE_MANNER_CODE = 'TY_8981';
const TEMPLATE_MANNER_TEXT = `■ 매너타임 안내

▶ 밤 10시 이후 소음 금지
▶ 흡연 장소 준수
▶ 불멍 시 안전거리 확보

협조 부탁드립니다.`;

// 오픈 알림 (TZ_3719)
const TEMPLATE_PREOPEN_CODE = 'TZ_3719';
const TEMPLATE_PREOPEN_TEXT = `안녕하세요, 양주잼잼 글램핑입니다.

#{월}월 예약 오픈되었습니다!
실시간 예약 바로가기: https://naver.me/5l7kbLzr

인기 날짜 빠른 마감 유의 부탁드립니다.`;

/** =========================================
 *  [3] 알림톡 전송 로직
 * ========================================= */
function confirmAlimtalk() {
  if (!confirm('알림톡을 보내시겠습니까?')) return;
  sendAlimtalk();
}
async function sendAlimtalk() {
  let data = isManualTabActive() ? getManualReservationDataSingle() : parseReservation(document.getElementById('inputData').value);
  let templateCode = data.무통장여부 ? TEMPLATE_CODE_BANK : (['네이버','야놀자','여기어때'].includes(data.예약플랫폼) ? (data.이용기간.includes('~') ? TEMPLATE_CODE_LODGING : TEMPLATE_CODE_DAYUSE) : TEMPLATE_CODE_LODGING);
  let templateText = { TZ_1481: TEMPLATE_TEXT_BANK, TZ_1466: TEMPLATE_TEXT_LODGING, TZ_1465: TEMPLATE_TEXT_DAYUSE }[templateCode];
  const usageTime = (data.입실시간||'').replace('[당일캠핑] ', '');
  const opts = data.옵션 ? data.옵션.split(',').map(o=>`▶${o.trim()}`).join('\n') : '없음';
  const parsingContent = `- 예약번호: ${data.예약번호}\n- 예약자: ${data.예약자}\n- 전화번호: ${data.전화번호}\n- 이용객실: ${data.이용객실}\n- 이용기간: ${data.이용기간}\n- 수량: ${data.수량||'(복수객실)'}\n- 옵션:\n${opts}\n- 총 이용 인원: ${data.총이용인원}\n- 입실시간: ${data.입실시간}\n- 결제금액: ${data.결제금액}`;
  let messageText = templateText.replace('#{파싱내용}', parsingContent).replace('#{이용시간}', usageTime);

  const params = new URLSearchParams({ apikey: ALIMTALK_API_KEY, userid: ALIMTALK_USER_ID, senderkey: ALIMTALK_SENDERKEY, tpl_code: templateCode, sender: ALIMTALK_SENDER, receiver_1: data.전화번호.replace(/\D/g,''), recvname_1: data.예약자||'고객님', subject_1: '예약 안내', message_1: messageText, failover: 'Y' });
  if (['TZ_1481','TZ_1466','TZ_1465'].includes(templateCode)) params.append('button_1', JSON.stringify(DEFAULT_BUTTON_INFO));
  params.append('fsubject_1', '예약 안내'); params.append('fmessage_1', messageText);

  try {
    const res = await fetch(ALIMTALK_API_URL, { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'}, body:params });
    const result = await res.json();
    alert(result.code===0?'알림톡 발송 성공':`알림톡 실패: ${result.message}`);
  } catch(e) { alert('알림톡 전송 중 오류'); console.error(e); }
}

/** =========================================
 *  [4] 추가 알림톡 함수 정의
 * ========================================= */

// 무통장 입금확인 후 메시지 (숙박/당일)
async function sendAlimtalkForDeposit(row) {
  const isStay = row.이용기간.includes('~');
  const tplCode = isStay ? TEMPLATE_CODE_LODGING : TEMPLATE_CODE_DAYUSE;
  const tplText = isStay ? TEMPLATE_TEXT_LODGING : TEMPLATE_TEXT_DAYUSE;
  const usage = isStay ? '' : ((row.입실시간||'').replace('[당일캠핑]','').trim());
  const parsingContent = `- 예약번호: ${row.예약번호}\n- 예약자: ${row.예약자}\n- 전화번호: ${row.전화번호}\n- 객실: ${row.이용객실}\n- 옵션: ${row.옵션||'없음'}\n- 인원: ${row.총이용인원}\n- 입실시간: ${row.입실시간}\n- 금액: ${row.결제금액}`;
  const messageText = tplText.replace('#{파싱내용}', parsingContent).replace('#{이용시간}', usage);
  const params = new URLSearchParams({ apikey: ALIMTALK_API_KEY, userid: ALIMTALK_USER_ID, senderkey: ALIMTALK_SENDERKEY, tpl_code: tplCode, sender: ALIMTALK_SENDER, receiver_1: row.전화번호.replace(/\D/g,''), recvname_1: row.예약자||'고객님', subject_1: '예약 안내', message_1: messageText, failover: 'Y' });
  if ([TEMPLATE_CODE_LODGING, TEMPLATE_CODE_DAYUSE].includes(tplCode)) params.append('button_1', JSON.stringify(DEFAULT_BUTTON_INFO));
  params.append('fsubject_1', '예약 안내'); params.append('fmessage_1', messageText);
  try { const res=await fetch(ALIMTALK_API_URL,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:params}); const result=await res.json(); console.log(result.code===0?'입금확인 메시지 성공':'입금확인 메시지 실패', result); } catch(e){console.error(e);} }

// 전날 안내 (숙박/당일)
async function sendOneReminder(row) {
  const isStay = row.이용기간.includes('~');
  const tplCode = isStay ? TEMPLATE_REMIND_LODGING_CODE : TEMPLATE_REMIND_DAYUSE_CODE;
  const tplText = isStay ? TEMPLATE_REMIND_LODGING_TEXT : TEMPLATE_REMIND_DAYUSE_TEXT;
  const usage = isStay ? '' : ((row.입실시간||'').replace('[당일캠핑]','').trim()||'예약시간');
  const messageText = tplText.replace('#{이용시간}', usage);
  const params = new URLSearchParams({ apikey: ALIMTALK_API_KEY, userid: ALIMTALK_USER_ID, senderkey: ALIMTALK_SENDERKEY, tpl_code: tplCode, sender: ALIMTALK_SENDER, receiver_1: row.전화번호.replace(/\D/g,''), recvname_1: row.예약자||'고객님', subject_1: '전날 안내', message_1: messageText, failover: 'Y' });
  params.append('button_1', JSON.stringify({button: [ /* 웹링크 버튼 5개 */ ]}));
  params.append('fsubject_1', '전날 안내'); params.append('fmessage_1', messageText);
  try { const res=await fetch(ALIMTALK_API_URL,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:params}); console.log( (await res.json()).code===0?'전날 안내 성공':'전날 안내 실패' ); } catch(e){console.error(e);} }

// 퇴실 안내 (숙박)
async function sendCheckoutStayOne(row) {
  const tplCode = TEMPLATE_CHECKOUT_STAY_CODE;
  const tplText = TEMPLATE_CHECKOUT_STAY_TEXT;
  const time = row.stayOutR||'11:00';
  const messageText = tplText.replace('#{퇴실시간}', time);
  const params=new URLSearchParams({apikey:ALIMTALK_API_KEY,userid:ALIMTALK_USER_ID,senderkey:ALIMTALK_SENDERKEY,tpl_code:tplCode,sender:ALIMTALK_SENDER,receiver_1:row.전화번호.replace(/\D/g,''),recvname_1:row.예약자||'고객님',subject_1:'퇴실 안내(숙박)',message_1:messageText,failover:'Y'});
  params.append('fsubject_1','퇴실 안내(숙박)');params.append('fmessage_1',messageText);
  try{const res=await fetch(ALIMTALK_API_URL,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:params});console.log((await res.json()).code===0?'퇴실(숙박) 성공':'퇴실(숙박) 실패');}catch(e){console.error(e);} }

// 퇴실 안내 (당일)
async function sendCheckoutDayOne(row) {
  const tplCode = TEMPLATE_CHECKOUT_DAY_CODE;
  const tplText = TEMPLATE_CHECKOUT_DAY_TEXT;
  const time = row.dayOutQ||'19:00';
  const messageText = tplText.replace('#{퇴실시간}', time);
  const params=new URLSearchParams({apikey:ALIMTALK_API_KEY,userid:ALIMTALK_USER_ID,senderkey:ALIMTALK_SENDERKEY,tpl_code:tplCode,sender:ALIMTALK_SENDER,receiver_1:row.전화번호.replace(/\D/g,''),recvname_1:row.예약자||'고객님',subject_1:'퇴실 안내(당일)',message_1:messageText,failover:'Y'});
  params.append('fsubject_1','퇴실 안내(당일)');params.append('fmessage_1',messageText);
  try{const res=await fetch(ALIMTALK_API_URL,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:params});console.log((await res.json()).code===0?'퇴실(당일) 성공':'퇴실(당일) 실패');}catch(e){console.error(e);} }

// 매너타임 안내
async function sendMannerOne(row) {
  const tplCode = TEMPLATE_MANNER_CODE;
  const tplText = TEMPLATE_MANNER_TEXT;
  const messageText = tplText;
  const params=new URLSearchParams({apikey:ALIMTALK_API_KEY,userid:ALIMTALK_USER_ID,senderkey:ALIMTALK_SENDERKEY,tpl_code:tplCode,sender:ALIMTALK_SENDER,receiver_1:row.전화번호.replace(/\D/g,''),recvname_1:row.예약자||'고객님',subject_1:'매너타임 안내',message_1:messageText,failover:'Y'});
  params.append('fsubject_1','매너타임 안내');params.append('fmessage_1',messageText);
  try{const res=await fetch(ALIMTALK_API_URL,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:params});console.log((await res.json()).code===0?'매너타임 성공':'매너타임 실패');}catch(e){console.error(e);} }

// 사전 알림톡 (예약 오픈)
async function sendPreReserveTalkOne(phone, year, month) {
  const tplCode = TEMPLATE_PREOPEN_CODE;
  const tplText = TEMPLATE_PREOPEN_TEXT.replace('#{월}', month);
  const messageText = tplText;
  const params=new URLSearchParams({apikey:ALIMTALK_API_KEY,userid:ALIMTALK_USER_ID,senderkey:ALIMTALK_SENDERKEY,tpl_code:tplCode,sender:ALIMTALK_SENDER,receiver_1:phone.replace(/\D/g,''),recvname_1:'고객님',subject_1:'예약 오픈 안내',message_1:messageText,failover:'Y'});
  params.append('button_1',JSON.stringify({button:[{name:'실시간 예약 바로가기',linkType:'WL',linkMo:'https://naver.me/5l7kbLzr',linkPc:'https://naver.me/5l7kbLzr'}]}));
  params.append('fsubject_1','예약 오픈 안내');params.append('fmessage_1',messageText);
  try{const res=await fetch(ALIMTALK_API_URL,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:params});console.log((await res.json()).code===0?'사전알림톡 성공':'사전알림톡 실패');}catch(e){console.error(e);} }

