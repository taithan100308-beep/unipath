// study.js (bản fix ổn định)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;
let tasks = {};
let currentTask = null;
let timerInterval = null;

const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");
const logoutNavBtn = document.getElementById("logoutNavBtn");
const totalTimeEl = document.getElementById("totalTime");

if (logoutNavBtn) {
  logoutNavBtn.addEventListener("click", () => signOut(auth));
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    await loadData();
  } else {
    window.location.href = "index.html";
  }
});

async function loadData() {
  const ref = doc(db, "studyTime", currentUser.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    tasks = snap.data().tasks || {};
  } else {
    await setDoc(ref, { tasks: {} });
    tasks = {};
  }
  renderTasks();
  updateTotalTime();
}

// ✅ Fix 1: Bảo đảm tạo mới doc nếu chưa có
async function saveToFirestore() {
  const ref = doc(db, "studyTime", currentUser.uid);
  try {
    await updateDoc(ref, { tasks });
  } catch (err) {
    // nếu doc chưa tồn tại -> tạo mới
    await setDoc(ref, { tasks });
  }
}

addTaskBtn.addEventListener("click", async () => {
  const name = taskInput.value.trim();
  if (!name) return alert("⚠️ Vui lòng nhập tên môn học!");
  if (tasks[name]) return alert("❌ Mục này đã tồn tại!");

  tasks[name] = { time: 0, running: false, startTime: null };
  await saveToFirestore();
  renderTasks();
  taskInput.value = "";
});

function renderTasks() {
  taskList.innerHTML = "";
  for (const name in tasks) {
    const task = tasks[name];
    const t = Math.floor(task.time);
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;

    const div = document.createElement("div");
    div.className = "task-card";
    div.innerHTML = `
      <div class="task-row">
        <div class="task-left">
          <h3>${name}</h3>
          <p>⏱️ <b>${h} giờ ${m} phút ${s} giây</b></p>
        </div>
        <div class="task-actions">
          <button class="startBtn" ${task.running ? "disabled" : ""}>▶ Bắt đầu</button>
          <button class="stopBtn" ${!task.running ? "disabled" : ""}>⏸ Dừng</button>
          <button class="deleteBtn">🗑 Xóa</button>
        </div>
      </div>
    `;

    const startBtn = div.querySelector(".startBtn");
    const stopBtn = div.querySelector(".stopBtn");
    const delBtn = div.querySelector(".deleteBtn");

    startBtn.addEventListener("click", () => startTask(name));
    stopBtn.addEventListener("click", () => stopTask(name));
    delBtn.addEventListener("click", () => deleteTask(name));

    taskList.appendChild(div);
  }
  updateTotalTime();
}

function startTask(name) {
  if (currentTask && currentTask !== name) {
    alert("⚠️ Chỉ được chạy 1 mục học tại 1 thời điểm!");
    return;
  }
  currentTask = name;
  tasks[name].running = true;
  tasks[name].startTime = Date.now();

  timerInterval = setInterval(() => {
    if (!tasks[name]) return stopTask(name);
    tasks[name].time += 1;
    renderTasks();
  }, 1000);

  saveToFirestore();
}

function stopTask(name) {
  if (!tasks[name]) return;
  tasks[name].running = false;
  tasks[name].startTime = null;
  clearInterval(timerInterval);
  timerInterval = null;
  currentTask = null;
  saveToFirestore();
  renderTasks();
}

async function deleteTask(name) {
  if (!tasks[name]) return;
  if (tasks[name].running) stopTask(name);
  if (!confirm(`Xóa mục "${name}"?`)) return;
  delete tasks[name];
  await saveToFirestore();
  renderTasks();
}

// 🧮 Tính tổng thời gian
function updateTotalTime() {
  let total = 0;
  for (const k in tasks) total += tasks[k].time || 0;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (totalTimeEl) totalTimeEl.textContent = `${h} giờ ${m} phút ${s} giây`;
}

setInterval(updateTotalTime, 1000);
