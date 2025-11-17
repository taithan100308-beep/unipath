// home.js - FIXED VERSION
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

// ✅ Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ================== USER UI ==================
document.addEventListener("DOMContentLoaded", () => {
  const name = localStorage.getItem("name");
  const photo = localStorage.getItem("photo");
  const uid = localStorage.getItem("uid");

  if (!uid) window.location.href = "index.html";

  const nameEl = document.getElementById("userName");
  const photoEl = document.getElementById("userPhoto");
  if (nameEl) nameEl.textContent = name || "Người dùng";
  if (photoEl) photoEl.src = photo || "default-avatar.png";

  // Logout button
  const logoutNavBtn = document.getElementById("logoutNavBtn");
  if (logoutNavBtn) {
    logoutNavBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "index.html";
    });
  }

  // ================== FIREBASE COUNTER ==================
  updateVisitStats();
  
  // ================== SCROLL ANIMATIONS ==================
  initScrollAnimations();
  
  // ================== LAZY LOAD IMAGES ==================
  initLazyLoad();
});

// ================== HÀM ĐẾM LƯỢT TRUY CẬP ==================
async function updateVisitStats() {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const statsRef = ref(db, "stats");

  try {
    const snapshot = await get(statsRef);
    let stats = snapshot.exists() ? snapshot.val() : { total: 0, monthly: {} };

    stats.total = (stats.total || 0) + 1;
    stats.monthly[month] = (stats.monthly?.[month] || 0) + 1;

    await set(statsRef, stats);

    // ✅ Chỉ update 2 elements
    const totalEl = document.getElementById("student-count");
    const monthlyEl = document.getElementById("postgraduate-count");
    
    if (totalEl) totalEl.textContent = stats.total;
    if (monthlyEl) monthlyEl.textContent = stats.monthly[month];
    
  } catch (err) {
    console.error("❌ Lỗi cập nhật Firebase:", err);
  }
}

// ================== SCROLL ANIMATIONS ==================
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // Chỉ trigger 1 lần
      }
    });
  }, observerOptions);

  // Observe sections
  const sections = document.querySelectorAll('.stats-section, .news-grid, .contact-section');
  sections.forEach(el => {
    el.classList.add('fade-in-view');
    observer.observe(el);
  });
}

// ================== LAZY LOAD IMAGES ==================
function initLazyLoad() {
  const lazyImages = document.querySelectorAll('img.lazy');
  
  if (lazyImages.length === 0) return;
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.classList.remove('lazy');
        }
        imageObserver.unobserve(img);
      }
    });
  });

  lazyImages.forEach(img => imageObserver.observe(img));
}


(function() {
  console.log('🧪 TESTING FIXED VERSION...\n');
  
  // 1. Check stats elements
  const total = document.getElementById("student-count");
  const monthly = document.getElementById("postgraduate-count");
  const professor = document.getElementById("professor-count");
  
  console.log('✅ Total counter:', total ? 'FOUND' : '❌ NOT FOUND');
  console.log('✅ Monthly counter:', monthly ? 'FOUND' : '❌ NOT FOUND');
  console.log('⚠️ Professor counter:', professor ? 'FOUND (wrong)' : '✅ CORRECTLY REMOVED');
  
  // 2. Check background
  const bodyBg = getComputedStyle(document.body).background;
  console.log('✅ Body background:', bodyBg.includes('gradient') ? '❌ Still has gradient' : '✅ White background');
  
  // 3. Check animations
  const newsItems = document.querySelectorAll('.news-item');
  console.log('✅ News items:', newsItems.length, 'found');
  if (newsItems.length > 0) {
    const firstAnim = getComputedStyle(newsItems[0]).animation;
    console.log('✅ Animation:', firstAnim !== 'none' ? 'WORKING' : '❌ NOT WORKING');
  }
  
  // 4. Check lazy load
  const lazyImgs = document.querySelectorAll('img.lazy');
  console.log('✅ Lazy images:', lazyImgs.length, 'found');
  
  console.log('\n✅ TEST COMPLETE!');
})();