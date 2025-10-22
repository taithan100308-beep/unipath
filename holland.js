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

// Render câu hỏi
const form = document.getElementById("hollandForm");

questions.forEach((q, index) => {
  const div = document.createElement("div");
  div.classList.add("question-card");
  div.innerHTML = `
    <p><b>${index + 1}. ${q}</b></p>
    <div class="options">
      <label><input type="radio" name="q${index}" value="1" required> Đồng ý</label>
      <label><input type="radio" name="q${index}" value="0"> Không đồng ý</label>
    </div>
  `;
  form.appendChild(div);
});

// Nút hoàn thành (tạm thời chỉ báo tổng điểm)
document.getElementById("submitTest").addEventListener("click", () => {
  const answers = Array.from(document.querySelectorAll("input[type=radio]:checked")).map(i => +i.value);
  if (answers.length < questions.length) {
    alert("⚠️ Bạn cần trả lời tất cả các câu hỏi trước khi hoàn thành!");
    return;
  }
  const total = answers.reduce((a, b) => a + b, 0);
  alert(`✅ Bạn đã hoàn thành bài test!\nTổng số câu bạn chọn "Đồng ý": ${total}/30`);
});