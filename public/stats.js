import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js"; // ✅ IMPORT CONFIG

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 🔧 Thiết lập persistence giống study.js
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("✅ Auth persistence enabled");
  })
  .catch((error) => {
    console.error("❌ Error setting persistence:", error);
  });

let barChart = null;
let pieChart = null;
let currentUser = null;
let lastDataHash = null;

// 🎨 Màu cố định cho từng môn học
const COLOR_MAP = {};
const FIXED_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", 
  "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2",
  "#F8B195", "#F67280", "#C06C84", "#6C5B7B",
  "#5DADE2", "#48C9B0", "#F8B500", "#E74C3C"
];

// ✅ ĐỢI AUTH LOAD XONG RỒI MỚI KIỂM TRA
let authChecked = false;

onAuthStateChanged(auth, async (user) => {
  authChecked = true;
  
  if (user) {
    currentUser = user;
    console.log("✅ User logged in:", user.uid);
    await loadData();
    setInterval(loadData, 3000);
  } else {
    console.log("❌ No user, redirecting...");
    // ✅ Đợi 500ms để chắc chắn không phải đang load auth
    setTimeout(() => {
      if (!currentUser) {
        window.location.href = "index.html";
      }
    }, 500);
  }
});

document.getElementById("logoutNavBtn")?.addEventListener("click", () => signOut(auth));

async function loadData() {
  if (!currentUser) return;
  
  const ref = doc(db, "studyTime", currentUser.uid);
  
  try {
    console.log("📥 Loading data for:", currentUser.uid);
    const snap = await getDoc(ref);
    
    if (!snap.exists()) {
      console.log("⚠️ No data found, drawing empty charts");
      drawEmptyCharts();
      return;
    }
    
    const data = snap.data();
    const tasks = data.tasks || {};
    const dailyStats = data.dailyStats || {};
    
    console.log("✅ Data loaded:", { tasks, dailyStats });
    
    const dataHash = JSON.stringify({ tasks, dailyStats });
    if (dataHash === lastDataHash) return;
    
    lastDataHash = dataHash;
    drawCharts(tasks, dailyStats);
  } catch (error) {
    console.error("❌ Error loading data:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
  }
}

function drawCharts(tasks, dailyStats) {
  const taskEntries = Object.entries(tasks);
  
  if (taskEntries.length === 0) {
    drawEmptyCharts();
    return;
  }
  
  // Tạo màu cố định cho từng môn học
  taskEntries.forEach(([key, task]) => {
    const taskName = task.displayName || task.name || key.split('_')[0];
    if (!COLOR_MAP[taskName]) {
      const colorIndex = Object.keys(COLOR_MAP).length % FIXED_COLORS.length;
      COLOR_MAP[taskName] = FIXED_COLORS[colorIndex];
    }
  });
  
  drawBarChart(dailyStats);
  drawPieChart(tasks);
}

function drawBarChart(dailyStats) {
  const ctxBar = document.getElementById("barChart");
  if (!ctxBar) return;
  
  // Lấy 7 ngày gần nhất
  const sortedDates = Object.keys(dailyStats).sort().slice(-7);
  
  if (sortedDates.length === 0) {
    if (barChart) barChart.destroy();
    drawEmptyBarChart();
    return;
  }
  
  // Tính tổng thời gian mỗi ngày (phút)
  const dailyTotals = sortedDates.map(date => {
    const dayData = dailyStats[date];
    const totalSeconds = Object.values(dayData).reduce((sum, time) => sum + time, 0);
    return (totalSeconds / 60).toFixed(1); // chuyển sang phút
  });
  
  // Format labels (dd/mm)
  const labels = sortedDates.map(date => {
    const d = new Date(date + 'T00:00:00');
    const day = d.getDate();
    const month = d.getMonth() + 1;
    return `${day}/${month}`;
  });
  
  if (barChart) barChart.destroy();
  
  barChart = new Chart(ctxBar, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Thời gian học (phút)",
        data: dailyTotals,
        backgroundColor: "rgba(79, 172, 254, 0.7)",
        borderColor: "#4FACFE",
        borderWidth: 2,
        borderRadius: 10,
        barPercentage: 0.7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          labels: {
            font: { size: 14, weight: 'bold' },
            color: '#333',
            padding: 15
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 13 },
          padding: 12,
          callbacks: {
            label: function(context) {
              const minutes = parseFloat(context.parsed.y);
              const hours = Math.floor(minutes / 60);
              const mins = Math.round(minutes % 60);
              return hours > 0 
                ? `${hours} giờ ${mins} phút` 
                : `${mins} phút`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            font: { size: 12 },
            color: '#666',
            callback: function(value) {
              return value + ' phút';
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          }
        },
        x: {
          ticks: {
            font: { size: 12, weight: 'bold' },
            color: '#333'
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
}

function drawPieChart(tasks) {
  const ctxPie = document.getElementById("pieChart");
  if (!ctxPie) return;
  
  const taskEntries = Object.entries(tasks);
  
  if (taskEntries.length === 0) {
    if (pieChart) pieChart.destroy();
    drawEmptyPieChart();
    return;
  }
  
  const labels = taskEntries.map(([key, task]) => 
    task.displayName || task.name || key.split('_')[0]
  );
  const dataSeconds = taskEntries.map(([_, task]) => task.time || 0);
  const totalSeconds = dataSeconds.reduce((a, b) => a + b, 0);
  
  if (totalSeconds === 0) {
    if (pieChart) pieChart.destroy();
    drawEmptyPieChart();
    return;
  }
  
  // 🎨 Dùng màu cố định từ COLOR_MAP
  const colors = labels.map(label => COLOR_MAP[label]);
  
  if (pieChart) pieChart.destroy();
  
  pieChart = new Chart(ctxPie, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [{
        data: dataSeconds,
        backgroundColor: colors,
        borderColor: '#ffffff',
        borderWidth: 3,
        hoverOffset: 20,
        hoverBorderWidth: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            font: { size: 14, weight: '600' },
            color: '#333',
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 15,
            boxHeight: 15
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleFont: { size: 15, weight: 'bold' },
          bodyFont: { size: 13 },
          padding: 15,
          callbacks: {
            label: function(context) {
              const seconds = context.parsed;
              const hours = Math.floor(seconds / 3600);
              const mins = Math.floor((seconds % 3600) / 60);
              const percent = ((seconds / totalSeconds) * 100).toFixed(1);
              
              let timeStr = hours > 0 
                ? `${hours}h ${mins}m` 
                : `${mins} phút`;
              
              return `${context.label}: ${timeStr} (${percent}%)`;
            }
          }
        }
      }
    }
  });
}

function drawEmptyBarChart() {
  const ctxBar = document.getElementById("barChart");
  if (!ctxBar) return;
  
  barChart = new Chart(ctxBar, {
    type: "bar",
    data: {
      labels: ["Chưa có dữ liệu"],
      datasets: [{
        label: "Thời gian học (phút)",
        data: [0],
        backgroundColor: "rgba(224, 224, 224, 0.5)",
        borderColor: "#e0e0e0",
        borderWidth: 2
      }]
    },
    options: { 
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function drawEmptyPieChart() {
  const ctxPie = document.getElementById("pieChart");
  if (!ctxPie) return;
  
  pieChart = new Chart(ctxPie, {
    type: "doughnut",
    data: {
      labels: ["Chưa có dữ liệu"],
      datasets: [{
        data: [1],
        backgroundColor: ["rgba(224, 224, 224, 0.5)"],
        borderColor: "#e0e0e0",
        borderWidth: 2
      }]
    },
    options: { 
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });
}

function drawEmptyCharts() {
  drawEmptyBarChart();
  drawEmptyPieChart();
}


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