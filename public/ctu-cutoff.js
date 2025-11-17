import { universityData } from './ctu-data.js';

const schoolSelect = document.getElementById('schoolSelect');
const methodSelect = document.getElementById('methodSelect');
const majorSelect = document.getElementById('majorSelect');
const searchBtn = document.getElementById('searchBtn');
const resultBox = document.getElementById('resultBox');

const schoolName = document.getElementById('schoolName');
// XÓA dòng này vì không còn majorName trong HTML
// const majorName = document.getElementById('majorName');
const majorScore = document.getElementById('majorScore');

// Tên phương thức hiển thị
const methodNames = {
  thpt: 'Thi THPT Quốc gia',
  hocba: 'Xét học bạ',
  dgnl: 'Đánh giá năng lực',
  other: 'Phương thức khác'
};

// Khi chọn trường -> hiển thị danh sách phương thức
schoolSelect.addEventListener('change', () => {
  const school = schoolSelect.value;
  
  // Reset
  methodSelect.innerHTML = '<option value="">-- Chọn phương thức --</option>';
  majorSelect.innerHTML = '<option value="">-- Chọn ngành --</option>';
  methodSelect.disabled = true;
  majorSelect.disabled = true;
  searchBtn.disabled = true;
  resultBox.classList.remove('show');
  
  if (school && universityData[school]) {
    const methods = Object.keys(universityData[school].methods);
    
    methods.forEach(method => {
      const opt = document.createElement('option');
      opt.value = method;
      opt.textContent = methodNames[method] || method;
      methodSelect.appendChild(opt);
    });
    
    methodSelect.disabled = false;
  }
});

// Khi chọn phương thức -> hiển thị danh sách ngành
methodSelect.addEventListener('change', () => {
  const school = schoolSelect.value;
  const method = methodSelect.value;
  
  majorSelect.innerHTML = '<option value="">-- Chọn ngành --</option>';
  majorSelect.disabled = true;
  searchBtn.disabled = true;
  resultBox.classList.remove('show');
  
  if (school && method && universityData[school]) {
    const data = universityData[school].methods[method];
    
    if (data && data.length > 0) {
      data.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.code;
        opt.textContent = `${item.major} (${item.code})`;
        majorSelect.appendChild(opt);
      });
      
      majorSelect.disabled = false;
    }
  }
});

// Khi chọn ngành -> enable nút tra cứu
majorSelect.addEventListener('change', () => {
  if (majorSelect.value) {
    searchBtn.disabled = false;
  } else {
    searchBtn.disabled = true;
  }
  resultBox.classList.remove('show');
});

// Khi nhấn nút Tra cứu
searchBtn.addEventListener('click', () => {
  const school = schoolSelect.value;
  const method = methodSelect.value;
  const code = majorSelect.value;
  
  if (!school || !method || !code) {
    alert('Vui lòng chọn đủ thông tin!');
    return;
  }
  
  const data = universityData[school].methods[method];
  const record = data.find(item => item.code === code);
  
  if (!record) {
    alert('Không tìm thấy ngành này!');
    return;
  }
  
  // Hiển thị kết quả - Gộp tên trường + tên ngành vào schoolName
  schoolName.textContent = `${universityData[school].name} - ${record.major}`;
  
  // XÓA dòng này vì không còn majorName
  // majorName.textContent = record.major;
  
  // Hiển thị điểm chuẩn với đơn vị phù hợp
  let scoreText = record.cutoff;
  if (method === 'dgnl') {
    scoreText = `${record.cutoff} điểm`;
  } else if (method === 'other') {
    scoreText = `${record.cutoff}/100`;
  } else {
    scoreText = `${record.cutoff}/30`;
  }
  
  majorScore.textContent = scoreText;
  
  resultBox.classList.add('show');
  
  // Cuộn xuống kết quả
  resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// HAMBURGER MENU
const hamburger = document.getElementById('hamburgerBtn');
const navMenu = document.getElementById('navMenu');
const navOverlay = document.getElementById('navOverlay');

// Toggle menu
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  navMenu.classList.toggle('active');
  navOverlay.classList.toggle('active');
  
  // Prevent body scroll khi menu mở
  document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
});

// Đóng menu khi click overlay
navOverlay.addEventListener('click', () => {
  hamburger.classList.remove('active');
  navMenu.classList.remove('active');
  navOverlay.classList.remove('active');
  document.body.style.overflow = '';
});

// 📂 DROPDOWN CONTROL trong mobile
const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
dropdownToggles.forEach(toggle => {
  toggle.addEventListener('click', (e) => {
    // Chỉ chặn default trên mobile
    if (window.innerWidth <= 992) {
      e.preventDefault();
      const dropdown = toggle.closest('.dropdown');
      dropdown.classList.toggle('active');
    }
  });
});

// 📂 SUBMENU CONTROL trong mobile
const submenuToggles = document.querySelectorAll('.submenu-toggle');
submenuToggles.forEach(toggle => {
  toggle.addEventListener('click', (e) => {
    if (window.innerWidth <= 992) {
      e.preventDefault();
      const parent = toggle.closest('.dropdown-item-with-sub');
      parent.classList.toggle('active');
    }
  });
});

// Đóng menu khi click vào link (trừ dropdown toggles)
const navLinks = navMenu.querySelectorAll('a:not(.dropbtn):not(.submenu-toggle)');
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    if (window.innerWidth <= 992) {
      hamburger.classList.remove('active');
      navMenu.classList.remove('active');
      navOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
});

// Reset khi resize window
window.addEventListener('resize', () => {
  if (window.innerWidth > 992) {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
    navOverlay.classList.remove('active');
    document.body.style.overflow = '';
    
    // Reset dropdowns
    document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('active'));
    document.querySelectorAll('.dropdown-item-with-sub').forEach(d => d.classList.remove('active'));
  }
});