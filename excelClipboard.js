// excelClipboard.js 수정본 (DOMContentLoaded 추가)
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('excelUnifiedCopyBtn').addEventListener('click', function() {
        let excelText = '';
        
        if (isManualTabActive()) {
            excelText = parseManualTabForExcel();
        } else {
            const inputText = document.getElementById('inputData').value;
            const platform = detectPlatform(inputText);
            
            if (platform === '네이버') {
                excelText = parseNaverForExcel(inputText);
            } else if (platform === '야놀자') {
                excelText = parseYanoljaForExcel(inputText);
            } else if (platform === '여기어때') {
                excelText = parseHereForExcel(inputText);
            } else {
                alert('플랫폼을 인식할 수 없습니다.');
                return;
            }
        }

        navigator.clipboard.writeText(excelText)
            .then(() => alert('엑셀 형식으로 복사되었습니다!'))
            .catch(() => alert('클립보드 복사에 실패했습니다.'));
    });
});


// 플랫폼 자동 인식 함수
function detectPlatform(text) {
    if (text.includes("야놀자") || text.includes("NOL")) return "야놀자";
    if (text.includes("여기어때")) return "여기어때";
    return "네이버"; 
}

// 기존 (2) 파일에서 사용하던 함수 (그대로 복사해서 옮김)
function parseNaverForExcel(inputText) {
    const filteredLines = inputText.split('\n').filter(line => {
        const unwantedKeywords = [
            '예약번호', '예약유형', '이메일', '예약내역', '데이유즈',
            '1박 2일', '2박 3일', '3박 4일', '수량', '결제정보', '결제상태',
            'NPay주문번호', '결제수단', '! 인원수를 꼭 체크해주세요.'
        ];
        return !unwantedKeywords.some(keyword => line.includes(keyword));
    });

    let result = [];
    let paymentAmount = '';
    let checkInTime = '';
    let isProcessingOptions = false;
    let optionDetails = [];
    let optionColumns = ['AB','AC','AD','AE','AF','AG','AH','AI','AJ','AK','AL','AM','AN','AO','AP'];
    result.push(Array(50).fill(''));

    filteredLines.forEach((line, i) => {
        if (line.includes('예약자')) result[0][3] = line.split(/\s+/)[1] || ''; // D열
        if (line.includes('전화번호')) result[0][4] = line.split(/\s+/)[1] || ''; // E열
        if (line.includes('사이트')) result[0][2] = line.includes('무통장') ? '네이버무통장' : '네이버확정'; // C열
        if (line.includes('사이트')) result[0][8] = line.replace(/\[.*?\]/g, '').trim(); // I열
        if (line.includes('총 이용 인원 정보') && filteredLines[i+1]) result[0][6] = filteredLines[i+1].trim(); // G열
        if (line.includes('입실 시간 선택') && filteredLines[i+1]) checkInTime = filteredLines[i+1].trim();
        if (line.includes('이용기간')) result[0][7] = line.replace('이용기간','').trim(); // H열
        if (line.includes('결제금액') || line.includes('결제예상금액')) paymentAmount = line.split(/\s+/)[1] || '';

        if (line.includes('옵션')) { isProcessingOptions = true; return; }
        if (isProcessingOptions && (line.includes('유입경로') || line.includes('요청사항'))) { isProcessingOptions = false; return; }
        if (isProcessingOptions && !line.includes('쿠폰')) optionDetails.push(line);
    });

    optionDetails.forEach((opt, idx) => { if(idx < optionColumns.length) result[0][27 + idx] = opt; });
    result[0][9] = '=TEXTJOIN(CHAR(10), TRUE,' + optionColumns.map(c => `INDIRECT("${c}"&ROW())`).join(',') + ')';
    result[0][45] = checkInTime; // AT열
    result[0][26] = paymentAmount; // AA열

    return result.map(row => row.join('\t')).join('\n');
}

// 야놀자 파싱 함수 ((2) 코드 그대로 옮김)
function parseYanoljaForExcel(text) {
    let channel = "야놀자", roomType = "", name = "", phone = "", price = "", checkInLine = "", checkOutLine = "", people = "대인2";
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    lines.forEach((line) => {
        if (line.match(/원$/)) price = line;
        else if (line.includes('/') && line.includes(' ')) {
            [name, phone] = line.split('/').map(p => p.trim());
        } else if (line.includes('카라반') || line.includes('복층') || line.includes('파티룸') || line.includes('몽골')) {
            roomType = line;
        } else if (line.includes('~')) {
            if (!checkInLine) checkInLine = line;
            else checkOutLine = line;
        }
    });

    const dateInfo = checkOutLine ? `${checkInLine} ~ ${checkOutLine}` : checkInLine;

    return [Array(50).fill('').map((_, idx) => {
        if (idx === 2) return channel;
        if (idx === 3) return name;
        if (idx === 4) return phone;
        if (idx === 6) return people;
        if (idx === 7) return dateInfo;
        if (idx === 8) return roomType;
        if (idx === 26) return price;
        return '';
    })].map(row => row.join('\t')).join('\n');
}

// 여기어때 파싱 함수 ((2) 코드 그대로 옮김)
function parseHereForExcel(text) {
    let channel = "여기어때", roomType = "", price = "", name = "", phone = "", checkIn = "", checkOut = "", people = "대인2";
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    lines.forEach(line => {
        if (line.startsWith('객실정보:')) roomType = line.replace('객실정보:', '').trim();
        if (line.startsWith('판매금액:')) price = line.replace('판매금액:', '').trim();
        if (line.startsWith('예약자명 :')) name = line.replace('예약자명 :', '').trim();
        if (line.startsWith('안심번호:')) phone = line.replace('안심번호:', '').trim();
        if (line.startsWith('입실일시:')) checkIn = line.replace('입실일시:', '').trim();
        if (line.startsWith('퇴실일시:')) checkOut = line.replace('퇴실일시:', '').trim();
    });

    const dateInfo = `${checkIn} ~ ${checkOut}`;

    return [Array(50).fill('').map((_, idx) => {
        if (idx === 2) return channel;
        if (idx === 3) return name;
        if (idx === 4) return phone;
        if (idx === 6) return people;
        if (idx === 7) return dateInfo;
        if (idx === 8) return roomType;
        if (idx === 26) return price;
        return '';
    })].map(row => row.join('\t')).join('\n');
}
