import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Chart.js instances
let barChart = null;
let pieChart = null;

// State
let currentUser = null;
let currentTask = null; // tên task đang chạy
let tasks = {}; // { taskName: { time: seconds, running: bool, startTime: timestamp } }

let timerInterval = null; // interval global (chỉ có 1 interval chạy tại 1 thời điểm)

// DOM
const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");

// logout navbar (nếu có)
const logoutNavBtn = document.getElementById("logoutNavBtn");
if (logoutNavBtn) {
  logoutNavBtn.addEventListener("click", () => {
    localStorage.clear();
    signOut(auth).catch(() => {});
    window.location.href = "index.html";
  });
}

// Auth state
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    await loadUserData();
  } else {
    window.location.href = "index.html";
  }
});

// Load or init user doc
async function loadUserData() {
  const userRef = doc(db, "studyTime", currentUser.uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    const data = snap.data();
    tasks = data.tasks || {};
  } else {
    await setDoc(userRef, { tasks: {} });
    tasks = {};
  }
  // normalize tasks (ensure numbers)
  for (const k of Object.keys(tasks)) {
    tasks[k].time = Number(tasks[k].time || 0);
    tasks[k].running = Boolean(tasks[k].running || false);
    tasks[k].startTime = tasks[k].startTime || null;
    // If any task was marked running (shouldn't be across sessions), reset running to false
    if (tasks[k].running) {
      tasks[k].running = false;
      tasks[k].startTime = null;
    }
  }
  renderTasks();
  updateCharts();
}

// Add task
addTaskBtn.addEventListener("click", async () => {
  const name = taskInput.value.trim();
  if (!name) return alert("⚠️ Vui lòng nhập tên môn học!");
  if (tasks[name]) return alert("❌ Mục này đã tồn tại!");
  tasks[name] = { time: 0, running: false, startTime: null };
  await saveToFirestore();
  renderTasks();
  taskInput.value = "";
});

// Save to Firestore (overwrites tasks field)
async function saveToFirestore() {
  const userRef = doc(db, "studyTime", currentUser.uid);
  // Ensure doc exists
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, { tasks });
  } else {
    await updateDoc(userRef, { tasks });
  }
  updateCharts();
}

// Render tasks list
function renderTasks() {
  taskList.innerHTML = "";
  for (const name of Object.keys(tasks)) {
    const task = tasks[name];
    const totalSeconds = Math.floor(task.time);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const div = document.createElement("div");
    div.className = "task-card";
    div.innerHTML = `
      <div class="task-row">
        <div class="task-left">
          <h3 class="task-name">${escapeHtml(name)}</h3>
          <p class="task-time">⏱️ Thời gian: <b>${hours} giờ ${minutes} phút ${seconds} giây</b></p>
        </div>
        <div class="task-actions">
          <button class="startBtn" ${task.running ? "disabled" : ""}>▶ Bắt đầu</button>
          <button class="stopBtn" ${!task.running ? "disabled" : ""}>⏸ Dừng</button>
          <button class="deleteBtn">🗑 Xóa</button>
        </div>
      </div>
    `;

    // events
    const startBtn = div.querySelector(".startBtn");
    const stopBtn = div.querySelector(".stopBtn");
    const delBtn = div.querySelector(".deleteBtn");

    startBtn.addEventListener("click", () => startTask(name));
    stopBtn.addEventListener("click", () => stopTask(name));
    delBtn.addEventListener("click", () => deleteTask(name));

    taskList.appendChild(div);
  }
}

// Start task (only one at a time)
function startTask(name) {
  // if task doesn't exist
  if (!tasks[name]) return;

  // if another task running -> prevent
  if (currentTask && currentTask !== name) {
    alert("⚠️ Chỉ có thể chạy một mục học tại một thời điểm!");
    return;
  }

  // if this task already running, ignore
  if (tasks[name].running) return;

  // set state
  currentTask = name;
  tasks[name].running = true;
  tasks[name].startTime = Date.now();

  // start interval that increments time every second
  timerInterval = setInterval(() => {
    // safety: if task removed mid-interval, stop
    if (!tasks[name]) {
      clearInterval(timerInterval);
      timerInterval = null;
      currentTask = null;
      return;
    }
    // increment time by 1 second
    tasks[name].time = Number(tasks[name].time || 0) + 1;
    renderTasks();
  }, 1000);

  // persist started flag (optional)
  saveToFirestore();
}

// Stop task
function stopTask(name) {
  if (!tasks[name]) return;
  if (!tasks[name].running) return;

  // mark stopped
  tasks[name].running = false;
  tasks[name].startTime = null;

  // clear interval only if it's the current running one
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  currentTask = null;

  // save
  saveToFirestore();
  renderTasks();
}

// Delete task (if running -> stop first)
async function deleteTask(name) {
  if (!tasks[name]) return;
  // If it's running, stop it first
  if (tasks[name].running) {
    // stopTask will clear interval and set currentTask = null
    stopTask(name);
  }
  // confirm
  if (!confirm(`Bạn có chắc muốn xóa mục "${name}" không?`)) return;
  // remove
  delete tasks[name];
  await saveToFirestore();
  renderTasks();
}

// Charts update
function updateCharts() {
  const labels = Object.keys(tasks);
  // minutes for charts (convert seconds to minutes with rounding)
  const minutesData = labels.map((k) => Math.round((tasks[k].time || 0) / 60));

  // Bar chart (minutes)
  const barCtx = document.getElementById("barChart");
  if (barCtx) {
    if (barChart) barChart.destroy();
    barChart = new Chart(barCtx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Thời gian học (phút)",
          data: minutesData,
          backgroundColor: "#4facfe"
        }]
      },
      options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
  }

  // Pie chart (proportion)
  const pieCtx = document.getElementById("pieChart");
  if (pieCtx) {
    if (pieChart) pieChart.destroy();
    // if no labels or all zeros, show empty dataset to avoid Chart errors
    const allZero = minutesData.every(v => v === 0);
    const pieData = allZero ? [1] : minutesData;
    const pieLabels = allZero ? ["Không có dữ liệu"] : labels;
    const colors = generateColors(pieLabels.length);

    pieChart = new Chart(pieCtx, {
      type: "pie",
      data: {
        labels: pieLabels,
        datasets: [{
          data: pieData,
          backgroundColor: colors
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }
}

// helpers
function generateColors(n) {
  // some preset colors, will repeat if n > length
  const base = ["#4facfe", "#00f2fe", "#a18cd1", "#fbc2eb", "#43e97b", "#38f9d7", "#ffb64d", "#ff6b6b"];
  const out = [];
  for (let i = 0; i < n; i++) out.push(base[i % base.length]);
  return out;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// update charts periodically (in case time is running)
setInterval(() => {
  // only update charts occasionally to avoid heavy re-rendering
  if (document.visibilityState === "visible") updateCharts();
}, 5000);
