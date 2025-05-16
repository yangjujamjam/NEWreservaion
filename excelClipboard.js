// excelClipboard.js (최종정리본)

// DOMContentLoaded로 버튼 이벤트 연결
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('excelUnifiedCopyBtn').addEventListener('click', function() {
        let reservationData;

        if (isManualTabActive()) {
            reservationData = getManualReservationDataSingle();
        } else {
            const inputText = document.getElementById('inputData').value;
            reservationData = parseReservation(inputText);  // 반드시 파싱된 결과 사용
        }

        // 최종 데이터 배열 생성 (50칸 초기화)
        let result = Array(50).fill('');

        // 요청하신대로 정확히 열 배정
        result[1] = reservationData.예약플랫폼 || '';      // B열 (index: 1)
        result[3] = reservationData.예약자 || '';          // D열 (index: 3)
        result[4] = reservationData.전화번호 || '';        // E열 (index: 4)
        result[6] = reservationData.총이용인원 || '';      // G열 (index: 6)
        result[7] = reservationData.이용기간 || '';        // H열 (index: 7)
        result[8] = reservationData.이용객실 || '';        // I열 (index: 8)

        // 엑셀형식으로 변환 (\t으로 연결)
        const excelText = result.join('\t');

        // 클립보드로 복사
        navigator.clipboard.writeText(excelText)
            .then(() => alert('엑셀 형식으로 복사되었습니다!'))
            .catch(() => alert('클립보드 복사에 실패했습니다.'));
    });
});

// 플랫폼 감지함수 유지
function detectPlatform(text) {
    if (text.includes("야놀자") || text.includes("NOL")) return "야놀자";
    if (text.includes("여기어때")) return "여기어때";
    return "네이버";
}

// 기존 parseReservation 함수 유지 및 통합 (필수!)
function parseReservation(text) {
    const platform = detectPlatform(text);
    let result = {};

    if (platform === '네이버') {
        result = parseNaverReservation(text);
    } else if (platform === '야놀자') {
        result = parseYanoljaReservation(text);
    } else if (platform === '여기어때') {
        result = parseHereReservation(text);
    } else {
        result = parseNaverReservation(text);
    }

    result.예약플랫폼 = platform; // 플랫폼 정보 추가
    return result;
}

// 네이버 파싱 함수 (예약 플랫폼 별 최종객체 생성)
function parseNaverReservation(text) {
    const lines = text.split('\n');
    const data = {};
    lines.forEach((line, i) => {
        if(line.includes('예약자')) data.예약자 = line.split(/\s+/)[1]?.trim();
        if(line.includes('전화번호')) data.전화번호 = line.split(/\s+/)[1]?.trim();
        if(line.includes('사이트')) data.이용객실 = line.replace(/.*사이트\s*/, '').trim();
        if(line.includes('총 이용 인원 정보')) data.총이용인원 = lines[i+1]?.trim();
        if(line.includes('이용기간')) data.이용기간 = line.replace('이용기간','').trim();
    });
    return data;
}

// 야놀자 파싱 함수
function parseYanoljaReservation(text) {
    const lines = text.split('\n');
    const data = { 총이용인원: '대인2' };
    lines.forEach((line, i) => {
        if(line.includes('/')) {
            const [name, phone] = line.split('/');
            data.예약자 = name.trim();
            data.전화번호 = phone.trim();
        }
        if(line.match(/카라반|복층|파티룸|몽골/)) data.이용객실 = line.trim();
        if(line.includes('~')) {
            data.이용기간 = lines[i] + ' ~ ' + lines[i+1];
        }
    });
    return data;
}

// 여기어때 파싱 함수
function parseHereReservation(text) {
    const lines = text.split('\n');
    const data = { 총이용인원: '대인2' };
    lines.forEach((line) => {
        if (line.startsWith('예약자명 :')) data.예약자 = line.replace('예약자명 :', '').trim();
        if (line.startsWith('안심번호:')) data.전화번호 = line.replace('안심번호:', '').trim();
        if (line.startsWith('객실정보:')) data.이용객실 = line.replace('객실정보:', '').trim();
        if (line.startsWith('입실일시:')) data.이용기간 = line.replace('입실일시:', '').trim();
        if (line.startsWith('퇴실일시:')) data.이용기간 += ' ~ ' + line.replace('퇴실일시:', '').trim();
    });
    return data;
}
