const name = localStorage.getItem("name");
const photo = localStorage.getItem("photo");
const uid = localStorage.getItem("uid");

if (!uid) {
  window.location.href = "index.html";
}

document.getElementById("userName").textContent = name;
document.getElementById("userPhoto").src = photo;

document.getElementById("toolBtn").addEventListener("click", () => {
  window.location.href = "study.html";
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "index.html";
});

document.getElementById("uniBtn").addEventListener("click", () => {
  window.location.href = "universities.html";
});

const logoutNavBtn = document.getElementById("logoutNavBtn");
if (logoutNavBtn) {
  logoutNavBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "index.html";
  });
}
