// holland.js - bản ổn định: tương thích button type=submit hoặc type=button (id=submitTest)
// - Render 30 câu (dựng DOM)
// - Hỗ trợ validate (bắt buộc trả lời tất cả câu)
// - Tính điểm dựa trên mảng types
// - Hiển thị kết quả vào resultSection trong holland.html

// câu hỏi (30)
const questions = [
  "Tôi thích làm việc bằng tay, sửa chữa hoặc lắp ráp đồ vật.",
  "Tôi thích tìm hiểu cách mọi thứ hoạt động.",
  "Tôi thích vẽ tranh, viết nhạc hoặc sáng tác.",
  "Tôi thích giúp đỡ người khác khi họ gặp khó khăn.",
  "Tôi thích nói trước đám đông hoặc thuyết phục người khác.",
  "Tôi thích công việc có quy tắc rõ ràng, sắp xếp gọn gàng.",
  "Tôi thích hoạt động ngoài trời, thể thao hoặc dùng sức mạnh cơ bắp.",
  "Tôi thích làm thí nghiệm, quan sát và phân tích dữ liệu.",
  "Tôi thích thể hiện cảm xúc thông qua hội họa, âm nhạc, diễn xuất.",
  "Tôi thích hướng dẫn, giảng dạy hoặc cố vấn cho người khác.",
  "Tôi thích lên kế hoạch, tổ chức sự kiện hoặc điều hành nhóm.",
  "Tôi thích nhập liệu, tính toán hoặc quản lý hồ sơ, tài liệu.",
  "Tôi thích sửa chữa xe máy, thiết bị điện tử hoặc đồ dùng gia đình.",
  "Tôi thích đọc sách khoa học hoặc tìm hiểu về hiện tượng tự nhiên.",
  "Tôi thích sáng tạo nội dung, làm video hoặc thiết kế đồ họa.",
  "Tôi thích lắng nghe và hỗ trợ người khác giải quyết vấn đề.",
  "Tôi thích kinh doanh hoặc đưa ra quyết định lớn.",
  "Tôi thích tuân thủ quy trình và làm việc theo kế hoạch cố định.",
  "Tôi thích dùng công cụ, máy móc để tạo ra sản phẩm cụ thể.",
  "Tôi thích đặt câu hỏi “Tại sao?” và đi tìm câu trả lời.",
  "Tôi thích tự do thể hiện bản thân thay vì theo khuôn mẫu.",
  "Tôi thích tham gia hoạt động xã hội, từ thiện hoặc giúp cộng đồng.",
  "Tôi thích làm việc trong môi trường năng động, nhiều thử thách.",
  "Tôi thích công việc hành chính, văn phòng, kế toán.",
  "Tôi thích sửa chữa, bảo dưỡng thiết bị, máy móc.",
  "Tôi thích nghiên cứu trong phòng thí nghiệm hoặc lập trình.",
  "Tôi thích làm những thứ mới, sáng tạo, nghệ thuật.",
  "Tôi thích nói chuyện, thuyết phục, hoặc động viên người khác.",
  "Tôi thích làm quản lý, điều hành hoặc bán hàng.",
  "Tôi thích làm việc tỉ mỉ, theo hướng dẫn, không quá rủi ro."
];

// types tương ứng cho từng câu (30 phần tử)
const types = [
  "R","I","A","S","E","C",
  "R","I","A","S","E","C",
  "R","I","A","S","E","C",
  "R","I","A","S","E","C",
  "R","I","A","S","E","C"
];

// DOM
const form = document.getElementById("hollandForm");
if (!form) {
  console.error("holland.js: Không tìm thấy phần tử #hollandForm trong DOM.");
}

// render câu hỏi (nếu chưa render)
function renderQuestions() {
  if (!form) return;
const existingActions = form.querySelector(".test-actions");
form.innerHTML = ""; // clear toàn bộ
questions.forEach((q, i) => {
  const div = document.createElement("div");
  div.className = "question-card";
  div.innerHTML = `
    <p><b>${i + 1}. ${q}</b></p>
    <div class="options">
      <label><input type="radio" name="q${i}" value="1"> Đồng ý</label>
      <label><input type="radio" name="q${i}" value="0"> Không đồng ý</label>
    </div>
  `;
  form.appendChild(div);
});

// 👇 Thêm lại nút sau khi render xong câu hỏi
if (existingActions) form.appendChild(existingActions);
}

// validate: kiểm tra đã trả lời tất cả câu
function validateAllAnswered() {
  for (let i = 0; i < questions.length; i++) {
    const checked = document.querySelector(`input[name="q${i}"]:checked`);
    if (!checked) return { ok: false, index: i };
  }
  return { ok: true };
}

// xử lý kết quả
function processResults() {
  try {
    const v = validateAllAnswered();
    if (!v.ok) {
      alert(`⚠️ Bạn chưa trả lời câu ${v.index + 1}. Vui lòng trả lời tất cả câu trước khi hoàn thành.`);
      return;
    }

    const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

    for (let i = 0; i < questions.length; i++) {
      const val = document.querySelector(`input[name="q${i}"]:checked`).value;
      if (val === "1") {
        const t = types[i];
        if (!t) {
          console.warn(`Không có types[${i}] — kiểm tra mảng types!`);
          continue;
        }
        scores[t] = (scores[t] || 0) + 1;
      }
    }

    // sắp xếp để lấy top3
    const sorted = Object.entries(scores).sort((a,b) => b[1] - a[1]);
    const top3 = sorted.slice(0,3).map(([k]) => k).join("");

    // hiển thị
    const resultSection = document.getElementById("resultSection");
    const typeCode = document.getElementById("typeCode");
    const details = document.getElementById("details");
    const suggestion = document.getElementById("suggestion");

    if (!resultSection || !typeCode || !details || !suggestion) {
      console.error("holland.js: Thiếu phần tử hiển thị kết quả (check IDs).");
      return;
    }

    typeCode.textContent = top3;

    const desc = {
      R: "Thực tế (Realistic): thích hành động, thao tác, làm việc với công cụ, máy móc.",
      I: "Nghiên cứu (Investigative): yêu thích khám phá, tư duy logic, tìm hiểu nguyên lý.",
      A: "Nghệ thuật (Artistic): sáng tạo, nhạy cảm, yêu cái đẹp và thể hiện cảm xúc.",
      S: "Xã hội (Social): thân thiện, thích giúp đỡ, dạy dỗ và làm việc nhóm.",
      E: "Quản lý (Enterprising): năng động, thích lãnh đạo, thuyết phục, tạo ảnh hưởng.",
      C: "Nghiệp vụ (Conventional): tỉ mỉ, ngăn nắp, thích trật tự và hệ thống."
    };

    details.innerHTML = sorted.slice(0,3).map(([k, v]) => `<li><b>${k}</b>: ${desc[k]} (score: ${v})</li>`).join("");

    const suggest = {
      R: "Kỹ thuật, cơ khí, công nghệ, nông nghiệp, xây dựng.",
      I: "Khoa học, y học, công nghệ thông tin, nghiên cứu, phân tích dữ liệu.",
      A: "Thiết kế, âm nhạc, nghệ thuật, truyền thông, sáng tạo nội dung.",
      S: "Sư phạm, tâm lý, xã hội học, y tá, hướng dẫn viên, nhân sự.",
      E: "Kinh doanh, marketing, quản lý, chính trị, luật, tài chính.",
      C: "Kế toán, hành chính, ngân hàng, thống kê, văn thư."
    };

    suggestion.textContent = sorted.slice(0,3).map(([k]) => suggest[k]).join(" ");

    // Ẩn form, hiện section kết quả
    form.style.display = "none";
    resultSection.style.display = "block";
    // cuộn tới kết quả
    resultSection.scrollIntoView({ behavior: "smooth" });

  } catch (err) {
    console.error("Lỗi khi xử lý kết quả Holland:", err);
    alert("Có lỗi xảy ra khi tính kết quả. Mở Console để xem chi tiết.");
  }
}

// event binding: nếu form submit được
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    processResults();
  });
}

// nếu button submit tồn tại (kiểu bạn dùng type=button với id=submitTest)
const submitBtn = document.getElementById("submitTest");
if (submitBtn) {
  submitBtn.addEventListener("click", () => {
    // ép validate giống submit: nếu form là type=button thì requestSubmit() tốt hơn, nhưng không hỗ trợ IE cũ
    if (typeof form.requestSubmit === "function") {
      form.requestSubmit(); // sẽ kích hoạt event submit
    } else {
      processResults();
    }
  });
}

// redo button (nếu có)
const redoBtn = document.getElementById("redoBtn");
if (redoBtn) {
  redoBtn.addEventListener("click", () => {
    window.location.reload();
  });
}

// render lúc đầu
renderQuestions();

// debug hint
console.log("holland.js loaded — questions:", questions.length, "types:", types.length);
