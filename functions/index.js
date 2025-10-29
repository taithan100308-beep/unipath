// ===============================================================
// ✅ Unipath AI Chat - CommonJS version (chạy được cả local & deploy)
// ===============================================================
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const OpenAI = require("openai");

admin.initializeApp();

// ===============================================================
// 💬 Cloud Function: Chat với công văn
// ===============================================================
exports.chatWithAI = functions.https.onRequest(async (req, res) => {
  try {
    // 🔒 Chỉ cho phép POST
    if (req.method !== "POST") {
      return res.status(405).send("Method not allowed");
    }

    const { message } = req.body;
    if (!message) return res.status(400).send("message required");

    // ===============================================================
    // 🔑 Lấy OpenAI API Key (đặt trong .env hoặc config)
    // ===============================================================
    const openaiKey =
      process.env.OPENAI_API_KEY ||
      (functions.config().openai && functions.config().openai.key);

    if (!openaiKey) {
      console.error("❌ Thiếu OPENAI_API_KEY — hãy đặt trong env hoặc config!");
      return res
        .status(500)
        .json({ error: "Thiếu OPENAI_API_KEY. Vui lòng cấu hình trước khi chạy." });
    }

    // Tạo client ở đây để luôn chắc chắn có key
    const client = new OpenAI({ apiKey: openaiKey });

    // ===============================================================
    // 🗂️ Nội dung công văn mẫu
    // ===============================================================
    const documentText = `
      Bộ GD&ĐT công bố kỳ thi tốt nghiệp THPT năm 2025 sẽ tổ chức vào cuối tháng 6.
      Thí sinh có thể sử dụng chứng chỉ IELTS để xét tuyển vào nhiều trường đại học theo đề án tuyển sinh riêng của từng trường.
      Thời hạn chứng chỉ IELTS là 2 năm kể từ ngày thi.
      Mỗi thí sinh chỉ được đăng ký một nguyện vọng cao nhất để xét tuyển bằng phương thức điểm thi.
    `;

    // ===============================================================
    // 🧠 Prompt gửi GPT
    // ===============================================================
    const prompt = `
      Bạn là trợ lý AI của Unipath 🤖.
      Nhiệm vụ: trả lời ngắn gọn, dễ hiểu về **công văn, tuyển sinh hoặc thông tin đại học**.

      --- Công văn ---
      ${documentText}
      -----------------

      ❓ Câu hỏi người dùng: "${message}"

      Trả lời dựa vào nội dung trên.
    `;

    // ===============================================================
    // 🚀 Gọi OpenAI
    // ===============================================================
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const reply =
      completion.choices?.[0]?.message?.content || "Xin lỗi, mình chưa hiểu câu hỏi.";

    // Gửi kết quả về frontend
    res.json({ reply });
  } catch (err) {
    console.error("❌ Lỗi khi gọi OpenAI:", err);
    res.status(500).json({ error: err.message });
  }
});
