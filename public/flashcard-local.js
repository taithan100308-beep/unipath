document.addEventListener("DOMContentLoaded", () => {
  const createSetBtn = document.getElementById("createSetBtn");
  const setNameInput = document.getElementById("setName");
  const flashcardArea = document.getElementById("flashcardArea");
  const setTitle = document.getElementById("setTitle");
  const addCardBtn = document.getElementById("addCardBtn");
  const termInput = document.getElementById("termInput");
  const definitionInput = document.getElementById("definitionInput");
  const flashcardList = document.getElementById("flashcardList");

  let currentSetId = null;
  let flashcardSets = JSON.parse(localStorage.getItem("flashcardSets") || "{}");

  // ✅ Khi tạo bộ flashcard mới
  createSetBtn.addEventListener("click", () => {
    const setName = setNameInput.value.trim();
    if (!setName) {
      alert("Vui lòng nhập tên bộ flashcard!");
      return;
    }

    currentSetId = `set_${Date.now()}`;
    flashcardSets[currentSetId] = { name: setName, cards: [] };
    localStorage.setItem("flashcardSets", JSON.stringify(flashcardSets));

    setTitle.textContent = `📘 ${setName}`;
    flashcardArea.style.display = "block";
    flashcardList.innerHTML = "";
    setNameInput.value = "";
  });

  // ✅ Khi thêm thẻ mới
  addCardBtn.addEventListener("click", () => {
    if (!currentSetId) {
      alert("Hãy tạo một bộ flashcard trước!");
      return;
    }

    const term = termInput.value.trim();
    const def = definitionInput.value.trim();

    if (!term || !def) {
      alert("Vui lòng nhập đầy đủ thuật ngữ và định nghĩa!");
      return;
    }

    const card = { term, definition: def };
    flashcardSets[currentSetId].cards.push(card);
    localStorage.setItem("flashcardSets", JSON.stringify(flashcardSets));

    renderCard(card);
    termInput.value = "";
    definitionInput.value = "";
  });

  // ✅ Hàm hiển thị 1 thẻ ra màn hình
  function renderCard(card) {
    const div = document.createElement("div");
    div.className = "flashcard";
    div.innerHTML = `<b>${card.term}</b><br><hr><small>${card.definition}</small>`;
    flashcardList.appendChild(div);
  }
});