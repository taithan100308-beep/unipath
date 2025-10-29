// ===== MBTI TEST SCRIPT =====
// 40 câu hỏi, 4 cặp nhóm (E/I, S/N, T/F, J/P)
// Điểm cộng dồn, hiển thị kết quả + gợi ý ngành nghề

const questions = [
  // E–I
  "Tôi cảm thấy tràn đầy năng lượng khi được ở bên người khác.",
  "Tôi thích chia sẻ ý tưởng của mình với nhiều người.",
  "Tôi thường suy nghĩ nội tâm, ít nói ra cảm xúc của mình.",
  "Tôi thấy việc giao tiếp với người lạ đôi khi mệt mỏi.",
  "Tôi dễ dàng bắt chuyện với người mới.",
  "Tôi thích dành thời gian một mình để nạp lại năng lượng.",
  "Tôi thấy mình là người hướng ngoại, cởi mở.",
  "Tôi cảm thấy thoải mái khi ở trong các nhóm đông người.",
  // S–N
  "Tôi chú ý đến chi tiết và sự thật hơn là tưởng tượng.",
  "Tôi thích nghĩ về khả năng và ý tưởng tương lai.",
  "Tôi tin tưởng vào trải nghiệm thực tế hơn là giả thuyết.",
  "Tôi thường nhìn nhận vấn đề theo hướng sáng tạo, khác biệt.",
  "Tôi có xu hướng làm việc có kế hoạch và rõ ràng.",
  "Tôi thích thử những điều mới, ngay cả khi chưa chắc kết quả.",
  "Tôi thường tập trung vào hiện tại hơn là tương lai xa.",
  "Tôi thường tưởng tượng ra nhiều kịch bản khác nhau.",
  // T–F
  "Khi ra quyết định, tôi dựa trên lý trí hơn là cảm xúc.",
  "Tôi đặt tình cảm và mối quan hệ lên hàng đầu.",
  "Tôi coi trọng sự công bằng hơn là lòng trắc ẩn.",
  "Tôi thường cân nhắc cảm xúc của người khác trước khi nói.",
  "Tôi thích tranh luận logic và rõ ràng.",
  "Tôi dễ đồng cảm với người khác khi họ gặp khó khăn.",
  "Tôi thường khách quan khi giải quyết vấn đề.",
  "Tôi dễ bị ảnh hưởng bởi cảm xúc của bản thân.",
  // J–P
  "Tôi thích lập kế hoạch trước cho mọi việc.",
  "Tôi linh hoạt và thích để mọi thứ diễn ra tự nhiên.",
  "Tôi cảm thấy thoải mái khi công việc được sắp xếp rõ ràng.",
  "Tôi thường hoãn lại công việc đến phút cuối.",
  "Tôi muốn mọi thứ theo đúng kế hoạch.",
  "Tôi thích có nhiều lựa chọn và không muốn bị ràng buộc.",
  "Tôi thường hoàn thành công việc sớm hơn hạn.",
  "Tôi hay thay đổi kế hoạch tùy theo cảm hứng."
];

const traits = [
  "E", "E", "I", "I", "E", "I", "E", "E",
  "S", "N", "S", "N", "S", "N", "S", "N",
  "T", "F", "T", "F", "T", "F", "T", "F",
  "J", "P", "J", "P", "J", "P", "J", "P"
];

const form = document.getElementById("mbtiForm");

function renderQuestions() {
  const existingActions = form.querySelector(".test-actions");
  form.innerHTML = "";
  questions.forEach((q, i) => {
    const div = document.createElement("div");
    div.className = "question-card";
    div.innerHTML = `
      <p><b>${i + 1}. ${q}</b></p>
      <div class="options">
        <label><input type="radio" name="q${i}" value="1"> Rất không đồng ý</label>
        <label><input type="radio" name="q${i}" value="2"> Không đồng ý</label>
        <label><input type="radio" name="q${i}" value="3"> Trung lập</label>
        <label><input type="radio" name="q${i}" value="4"> Đồng ý</label>
        <label><input type="radio" name="q${i}" value="5"> Rất đồng ý</label>
      </div>
    `;
    form.appendChild(div);
  });
  if (existingActions) form.appendChild(existingActions);
}

function validateAllAnswered() {
  for (let i = 0; i < questions.length; i++) {
    if (!document.querySelector(`input[name="q${i}"]:checked`))
      return { ok: false, index: i };
  }
  return { ok: true };
}

function processResults() {
  const v = validateAllAnswered();
  if (!v.ok) {
    alert(`⚠️ Bạn chưa trả lời câu ${v.index + 1}.`);
    return;
  }

  const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

  for (let i = 0; i < questions.length; i++) {
    const val = parseInt(document.querySelector(`input[name="q${i}"]:checked`).value);
    const trait = traits[i];
    scores[trait] += val - 3; // âm nếu nghiêng về phía ngược lại, dương nếu đồng ý
  }

  const result =
    (scores.E >= scores.I ? "E" : "I") +
    (scores.S >= scores.N ? "S" : "N") +
    (scores.T >= scores.F ? "T" : "F") +
    (scores.J >= scores.P ? "J" : "P");

  const desc = {
    E: "Hướng ngoại – thích giao tiếp, năng động, hướng ra ngoài.",
    I: "Hướng nội – thích yên tĩnh, suy tư, tập trung vào nội tâm.",
    S: "Giác quan – thực tế, chi tiết, chú trọng hiện tại.",
    N: "Trực giác – sáng tạo, nhìn xa, thích khám phá ý tưởng.",
    T: "Lý trí – logic, khách quan, quyết đoán.",
    F: "Cảm xúc – đồng cảm, quan tâm, coi trọng giá trị cá nhân.",
    J: "Nguyên tắc – có kế hoạch, tổ chức, thích sự ổn định.",
    P: "Linh hoạt – tự do, linh động, thích khám phá bất ngờ."
  };

  const suggestionMap = {
    INTJ: "Kỹ sư, nhà khoa học, lập trình viên, chiến lược gia.",
    INTP: "Nghiên cứu viên, lập trình viên, nhà triết học, phân tích dữ liệu.",
    ENTJ: "Quản lý, doanh nhân, lãnh đạo, nhà chính trị.",
    ENTP: "Nhà sáng tạo, marketer, khởi nghiệp, truyền thông.",
    INFJ: "Tư vấn, tâm lý học, giáo viên, nhà văn.",
    INFP: "Thiết kế, nghệ sĩ, sáng tạo nội dung, nhân sự.",
    ENFJ: "Giảng viên, nhà huấn luyện, lãnh đạo cộng đồng.",
    ENFP: "Truyền thông, sáng tạo, sự kiện, quảng cáo.",
    ISTJ: "Kế toán, quản trị, kiểm toán, hành chính.",
    ISFJ: "Y tá, giáo viên, chăm sóc, nhân viên xã hội.",
    ESTJ: "Quản lý, luật, điều hành, tài chính.",
    ESFJ: "Giảng viên, điều dưỡng, tư vấn viên, dịch vụ khách hàng.",
    ISTP: "Kỹ thuật, cơ khí, lập trình, thể thao.",
    ISFP: "Nghệ sĩ, thiết kế, chăm sóc, tự do sáng tạo.",
    ESTP: "Doanh nhân, phóng viên, vận động viên, marketing.",
    ESFP: "Diễn viên, MC, sự kiện, truyền thông."
  };

  // Hiển thị kết quả
  document.getElementById("typeCode").textContent = result;
  document.getElementById("details").innerHTML = `
    <li>${desc[result[0]]}</li>
    <li>${desc[result[1]]}</li>
    <li>${desc[result[2]]}</li>
    <li>${desc[result[3]]}</li>
  `;
  document.getElementById("suggestion").textContent =
    suggestionMap[result] || "Chưa có gợi ý cụ thể.";

  // Ẩn form, hiện kết quả
  form.style.display = "none";
  document.getElementById("resultSection").style.display = "block";
  document.getElementById("resultSection").scrollIntoView({ behavior: "smooth" });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  processResults();
});

renderQuestions();