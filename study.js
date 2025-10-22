import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const userName = document.getElementById("userName");
const userPhoto = document.getElementById("userPhoto");
const logoutBtn = document.getElementById("logoutBtn");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const timerDisplay = document.getElementById("timerDisplay");

let timerInterval;
let startTime;
let totalSeconds = 0;

const uid = localStorage.getItem("uid");
const name = localStorage.getItem("name");
const photo = localStorage.getItem("photo");

if (!uid) {
  window.location.href = "index.html";
}

userName.textContent = name;
userPhoto.src = photo;

logoutBtn.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "index.html";
});

startBtn.addEventListener("click", () => {
  startTime = new Date();
  startBtn.disabled = true;
  stopBtn.disabled = false;
  timerInterval = setInterval(updateTimer, 1000);
});

stopBtn.addEventListener("click", async () => {
  clearInterval(timerInterval);
  stopBtn.disabled = true;
  startBtn.disabled = false;

  const endTime = new Date();
  const seconds = Math.floor((endTime - startTime) / 1000);
  totalSeconds += seconds;

  const hours = (seconds / 3600).toFixed(2);
  await saveStudyTime(hours);
  alert(`Bạn đã học ${hours} giờ hôm nay!`);
  loadChart();
});

function updateTimer() {
  const now = new Date();
  const diff = Math.floor((now - startTime) / 1000);
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;
  timerDisplay.textContent = `${hours} giờ ${minutes} phút ${seconds} giây`;
}

async function saveStudyTime(hours) {
  const today = new Date().toISOString().split("T")[0];
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, { [today]: Number(hours) });
  } else {
    const data = userSnap.data();
    const newHours = (data[today] || 0) + Number(hours);
    await updateDoc(userRef, { [today]: newHours });
  }
}

async function loadChart() {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data();
    const labels = Object.keys(data);
    const values = Object.values(data);

    const ctx = document.getElementById("studyChart").getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "Giờ học mỗi ngày",
          data: values,
          backgroundColor: "rgba(54, 162, 235, 0.6)",
        }],
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }
}

loadChart();

const logoutNavBtn = document.getElementById("logoutNavBtn");
if (logoutNavBtn) {
  logoutNavBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "index.html";
  });
}
