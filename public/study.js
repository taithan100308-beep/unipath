import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 🔧 Thiết lập persistence để giữ đăng nhập
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("✅ Auth persistence enabled");
  })
  .catch((error) => {
    console.error("❌ Error setting persistence:", error);
  });

let currentUser = null;
let tasks = {};
let activeTimers = {};
let saveTimeout = null;
let isSaving = false;
let lastSavedTimes = {}; // 🔧 Lưu thời gian trước đó để tính delta

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    await loadTasks();
    renderTasks();
    updateTotalTime();
  } else {
    window.location.href = "index.html";
  }
});

document.getElementById("logoutNavBtn")?.addEventListener("click", () => signOut(auth));

document.getElementById("addTaskBtn")?.addEventListener("click", async () => {
  const input = document.getElementById("taskInput");
  const taskName = input.value.trim();
  
  if (!taskName) {
    alert("⚠️ Vui lòng nhập tên môn học!");
    return;
  }

  const taskKey = `${taskName}_${Date.now()}`;
  
  const existingTask = Object.keys(tasks).find(key => {
    const existingName = tasks[key].displayName || tasks[key].name || key.split('_')[0];
    return existingName === taskName;
  });
  
  if (existingTask) {
    const confirm = window.confirm(`⚠️ Đã có môn "${taskName}" rồi. Bạn có muốn tạo thêm không?`);
    if (!confirm) return;
  }

  tasks[taskKey] = { 
    name: taskName, 
    time: 0, 
    isRunning: false,
    displayName: taskName
  };
  
  input.value = "";
  await saveTasks();
  renderTasks();
  updateTotalTime();
});

async function loadTasks() {
  if (!currentUser) return;
  
  const ref = doc(db, "studyTime", currentUser.uid);
  
  try {
    const snap = await getDoc(ref);
    
    if (snap.exists()) {
      tasks = snap.data().tasks || {};
      Object.keys(tasks).forEach(key => {
        if (!tasks[key].displayName) {
          tasks[key].displayName = tasks[key].name || key.split('_')[0];
        }
        tasks[key].isRunning = false;
        // 🔧 Lưu thời gian hiện tại để tính delta
        lastSavedTimes[key] = tasks[key].time || 0;
      });
    } else {
      tasks = {};
    }
  } catch (error) {
    console.error("Lỗi khi load dữ liệu:", error);
    tasks = {};
  }
}

function scheduleSave() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  saveTimeout = setTimeout(async () => {
    await saveTasks();
  }, 5000);
}

async function saveTasks() {
  if (!currentUser || isSaving) return;
  
  isSaving = true;
  const ref = doc(db, "studyTime", currentUser.uid);
  
  try {
    const today = new Date().toISOString().split('T')[0];
    const snap = await getDoc(ref);
    const dailyStats = snap.exists() ? (snap.data().dailyStats || {}) : {};
    
    if (!dailyStats[today]) {
      dailyStats[today] = {};
    }
    
    Object.keys(tasks).forEach(key => {
      const task = tasks[key];
      const taskName = task.displayName || task.name || key.split('_')[0];
      const currentTime = task.time || 0;
      const lastTime = lastSavedTimes[key] || 0;
      const delta = currentTime - lastTime;
      
      if (delta > 0) {
        if (!dailyStats[today][taskName]) {
          dailyStats[today][taskName] = 0;
        }
        dailyStats[today][taskName] += delta;
        lastSavedTimes[key] = currentTime;
      }
    });
    
    await setDoc(ref, { tasks, dailyStats }, { merge: true });
    console.log("✅ Đã lưu dữ liệu");
  } catch (error) {
    console.error("❌ Lỗi khi lưu:", error);
    if (error.code === 'permission-denied') {
      alert("⚠️ Lỗi quyền truy cập! Vui lòng kiểm tra Firebase Rules.");
    }
  } finally {
    isSaving = false;
  }
}

function renderTasks() {
  const container = document.getElementById("taskList");
  if (!container) return;
  
  container.innerHTML = "";
  
  const taskKeys = Object.keys(tasks);
  
  if (taskKeys.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#999; padding:2rem;">Chưa có môn học nào. Hãy thêm môn học mới!</p>';
    return;
  }
  
  taskKeys.forEach(key => {
    const task = tasks[key];
    const div = document.createElement("div");
    div.className = "task-item";
    
    const hours = Math.floor(task.time / 3600);
    const mins = Math.floor((task.time % 3600) / 60);
    const secs = task.time % 60;
    
    div.innerHTML = `
      <div class="task-info">
        <h3>${task.displayName || task.name}</h3>
        <p class="task-time">${hours}h ${mins}m ${secs}s</p>
      </div>
      <div class="task-controls">
        <button class="toggle-btn ${task.isRunning ? 'running' : ''}" data-key="${key}">
          ${task.isRunning ? '⏸️ Dừng' : '▶️ Bắt đầu'}
        </button>
        <button class="delete-btn" data-key="${key}">🗑️ Xóa</button>
      </div>
    `;
    
    container.appendChild(div);
  });
  
  document.querySelectorAll(".toggle-btn").forEach(btn => {
    btn.addEventListener("click", () => toggleTimer(btn.dataset.key));
  });
  
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => deleteTask(btn.dataset.key));
  });
}

function toggleTimer(key) {
  const task = tasks[key];
  if (!task) return;
  
  task.isRunning = !task.isRunning;
  
  if (task.isRunning) {
    activeTimers[key] = setInterval(() => {
      task.time++;
      renderTasks();
      updateTotalTime();
      scheduleSave();
    }, 1000);
  } else {
    if (activeTimers[key]) {
      clearInterval(activeTimers[key]);
      delete activeTimers[key];
    }
    saveTasks();
  }
  
  renderTasks();
}

async function deleteTask(key) {
  const task = tasks[key];
  if (!task) return;
  
  const confirmDelete = window.confirm(`Xóa môn "${task.displayName || task.name}"?`);
  if (!confirmDelete) return;
  
  if (activeTimers[key]) {
    clearInterval(activeTimers[key]);
    delete activeTimers[key];
  }
  
  delete tasks[key];
  delete lastSavedTimes[key];
  await saveTasks();
  renderTasks();
  updateTotalTime();
}

function updateTotalTime() {
  const total = Object.values(tasks).reduce((sum, t) => sum + (t.time || 0), 0);
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  
  const el = document.getElementById("totalTime");
  if (el) {
    el.textContent = `${hours} giờ ${mins} phút ${secs} giây`;
  }
}

window.addEventListener("beforeunload", () => {
  Object.keys(activeTimers).forEach(key => {
    clearInterval(activeTimers[key]);
  });
  
  if (currentUser) {
    const ref = doc(db, "studyTime", currentUser.uid);
    navigator.sendBeacon && setDoc(ref, { tasks }, { merge: true });
  }
});

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