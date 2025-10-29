/**
 * 🧠 Script giúp AI đọc & lưu embedding các file công văn PDF vào Firestore.
 * Đặt các file congvan03.pdf → congvan09.pdf ngoài thư mục functions/
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const { OpenAI } = require("openai");
const admin = require("firebase-admin");

// 🔹 Đọc serviceAccountKey.json
const serviceAccountPath = path.join(__dirname, "../serviceAccountKey.json");
if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ Không tìm thấy serviceAccountKey.json!");
  process.exit(1);
}
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

// 🔹 Khởi tạo Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// 🔹 Khởi tạo OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Thiếu OPENAI_API_KEY trong file .env!");
  process.exit(1);
}

// 🔹 Thư mục chứa PDF
const pdfFolder = path.join(__dirname, "../");

// 🔹 Danh sách file PDF cần đọc
const pdfFiles = [
  "congvan03.pdf",
  "congvan04.pdf",
  "congvan05.pdf",
  "congvan06.pdf",
  "congvan07.pdf",
  "congvan08.pdf",
  "congvan09.pdf",
];

// ✂️ Hàm chia text thành đoạn nhỏ
function splitTextIntoChunks(text, chunkSize = 1000) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

// 🔹 Lưu embedding vào Firestore
async function storeEmbeddingInFirestore(fileName, chunk, embedding) {
  const docRef = db.collection("docs").doc();
  await docRef.set({
    title: fileName,
    text: chunk,
    excerpt: chunk.substring(0, 800),
    embedding,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// 🔹 Đọc và xử lý tất cả PDF
async function readAllPDFs() {
  console.log("🚀 Bắt đầu đọc các công văn PDF...");

  for (const file of pdfFiles) {
    const pdfPath = path.join(pdfFolder, file);

    if (!fs.existsSync(pdfPath)) {
      console.warn(`⚠️ Không tìm thấy ${file}, bỏ qua.`);
      continue;
    }

    console.log(`📘 Đang đọc: ${file}`);
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    const text = data.text.replace(/\s+/g, " ").trim();
    const chunks = splitTextIntoChunks(text);

    console.log(`✂️ ${file} có ${chunks.length} đoạn văn cần embedding...`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        const response = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: chunk,
        });

        const embedding = response.data[0].embedding;
        await storeEmbeddingInFirestore(file, chunk, embedding);
        console.log(`✅ Đã lưu ${file} - đoạn ${i + 1}/${chunks.length}`);
      } catch (err) {
        console.error(`❌ Lỗi khi xử lý ${file} - đoạn ${i + 1}:`, err.message);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  console.log("🎉 Hoàn tất nạp toàn bộ công văn vào Firestore!");
}

// 🏁 Chạy script
readAllPDFs().catch((err) => {
  console.error("🔥 Lỗi tổng:", err);
});