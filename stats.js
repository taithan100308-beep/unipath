// stats.js (bản fix auto cập nhật + load ổn định)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let barChart = null;
let pieChart = null;
let currentUser = null;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    await loadData();
    setInterval(loadData, 3000); // 🔄 cập nhật mỗi 3 giây
  } else {
    window.location.href = "index.html";
  }
});

document.getElementById("logoutNavBtn").addEventListener("click", () => signOut(auth));

async function loadData() {
  const ref = doc(db, "studyTime", currentUser.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const tasks = snap.data().tasks || {};
  drawCharts(tasks);
}

function drawCharts(tasks) {
  const labels = Object.keys(tasks);
  const dataSeconds = Object.values(tasks).map(t => t.time || 0);

  const totalSeconds = dataSeconds.reduce((a, b) => a + b, 0);
  const totalMinutes = (totalSeconds / 60).toFixed(1);

  // Biểu đồ cột: tổng thời gian học
  const ctxBar = document.getElementById("barChart");
  if (!ctxBar) return;
  if (barChart) barChart.destroy();
  barChart = new Chart(ctxBar, {
    type: "bar",
    data: {
      labels: ["Tổng thời gian học"],
      datasets: [{
        label: "Phút",
        data: [totalMinutes],
        backgroundColor: "#4facfe"
      }]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });

  // Biểu đồ tròn: tỉ lệ theo từng giây
  const ctxPie = document.getElementById("pieChart");
  if (!ctxPie) return;
  if (pieChart) pieChart.destroy();

  const colors = ["#4facfe","#00f2fe","#a18cd1","#fbc2eb","#43e97b","#38f9d7","#ffb64d","#ff6b6b"];
  const total = totalSeconds || 1; // tránh chia 0
  const data = dataSeconds.map(s => (s / total) * 100);

  pieChart = new Chart(ctxPie, {
    type: "pie",
    data: {
      labels: labels.length ? labels : ["Không có dữ liệu"],
      datasets: [{
        data: labels.length ? data : [1],
        backgroundColor: colors.slice(0, labels.length || 1)
      }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });
}