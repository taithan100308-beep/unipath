import { ctuData } from './ctu-data.js';

const schoolSelect = document.getElementById('schoolSelect');
const methodSelect = document.getElementById('methodSelect');
const majorSelect = document.getElementById('majorSelect');
const searchBtn = document.getElementById('searchBtn');
const resultBox = document.getElementById('resultBox');

const majorName = document.getElementById('majorName');
const majorCode = document.getElementById('majorCode');
const majorScore = document.getElementById('majorScore');
const majorGroup = document.getElementById('majorGroup');

// ✅ Load danh sách ngành theo phương thức
function loadMajors() {
  const method = methodSelect.value;
  const data = ctuData[method];
  majorSelect.innerHTML = '<option value="">-- Chọn ngành học --</option>';

  data.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item['Mã ngành'];
    opt.textContent = `${item['Tên ngành']} (${item['Mã ngành']})`;
    majorSelect.appendChild(opt);
  });
}

// ✅ Hiển thị kết quả
function showResult() {
  const method = methodSelect.value;
  const code = majorSelect.value;
  if (!code) return;

  const major = ctuData[method].find(m => m['Mã ngành'] === code);
  if (major) {
    majorName.textContent = major['Tên ngành'];
    majorCode.textContent = major['Mã ngành'];
    majorScore.textContent = major['Điểm chuẩn'];
    majorGroup.textContent = major['Tổ hợp'];
    resultBox.style.display = 'block';
  }
}

methodSelect.addEventListener('change', loadMajors);
searchBtn.addEventListener('click', showResult);

// Khởi tạo ban đầu

loadMajors();