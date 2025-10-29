// home.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, get, set, update, increment } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";
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

  // 🔹 Các nút điều hướng (nếu có)
  const toolBtn = document.getElementById("toolBtn");
  if (toolBtn) toolBtn.addEventListener("click", () => window.location.href = "study.html");

  const uniBtn = document.getElementById("uniBtn");
  if (uniBtn) uniBtn.addEventListener("click", () => window.location.href = "universities.html");

  const logoutNavBtn = document.getElementById("logoutNavBtn");
  if (logoutNavBtn) logoutNavBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "index.html";
  });

  // ================== FIREBASE COUNTER ==================
  updateVisitStats();
});

// ================== HÀM ĐẾM LƯỢT TRUY CẬP ==================
async function updateVisitStats() {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const dayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const statsRef = ref(db, "stats");

  try {
    // 🔹 Lấy dữ liệu cũ
    const snapshot = await get(statsRef);
    let stats = snapshot.exists() ? snapshot.val() : { total: 0, monthly: {}, daily: {} };

    // 🔹 Cập nhật giá trị mới
    stats.total = (stats.total || 0) + 1;
    stats.monthly[month] = (stats.monthly?.[month] || 0) + 1;
    stats.daily[dayKey] = (stats.daily?.[dayKey] || 0) + 1;

    await set(statsRef, stats);

    // 🔹 Hiển thị
    document.getElementById("student-count").textContent = stats.total;
    document.getElementById("postgraduate-count").textContent = stats.monthly[month];
    document.getElementById("professor-count").textContent = stats.daily[dayKey];
  } catch (err) {
    console.error("❌ Lỗi cập nhật Firebase:", err);
  }
}