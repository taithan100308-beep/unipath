// ===============================================================
// Unipath AI Chat - FIXED v9.2.0
// ✅ Fix: Gemini systemInstruction - move PDF to user message
// ✅ Fix: Short system prompt < 500 chars
// ✅ Fix: Better PDF reading for both Gemini and GPT
// ===============================================================
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require("openai");
const axios = require("axios");
const pdfParse = require("pdf-parse");

admin.initializeApp();

const VERSION = "9.2.0-split-strategy";

// ===============================================================
// 🎯 AI ROUTING
// ===============================================================
const AI_ROUTING = {
  TUYEN_SINH: {
    knowledgeBase: 'gpt-4o-mini',
    pdfReader: 'gemini-2.5-flash',
    searchFallback: 'perplexity-search',
    finalFallback: 'gpt-4o'
  },
  PHUONG_PHAP: {
    primary: 'gemini-2.5-flash',
    fallback: 'gpt-4o-mini'
  },
  TAM_LY: {
    primary: 'gemini-2.5-flash',
    fallback: 'gpt-4o-mini'
  }
};

// ===============================================================
// 🔑 API CONFIGURATION
// ===============================================================
function getAPIKeys() {
  return {
    gemini: process.env.GEMINI_API_KEY || 
            (functions.config().gemini && functions.config().gemini.key),
    openai: process.env.OPENAI_API_KEY || 
            (functions.config().openai && functions.config().openai.key),
    perplexity: process.env.PERPLEXITY_API_KEY || 
                (functions.config().perplexity && functions.config().perplexity.key)
  };
}

// ===============================================================
// 🔍 SEARCH DETECTION
// ===============================================================
const SEARCH_KEYWORDS = [
  'năm 2026', 'năm 2027', '2026', '2027', '2028', '2029',
  'mới nhất', 'hiện tại', 'bây giờ', 'hôm nay',
  'gần đây', 'tin tức', 'cập nhật',
  'điểm chuẩn', 'diem chuan',
];

function needsRealTimeSearch(question) {
  const lowerQuestion = question.toLowerCase();
  
  for (const keyword of SEARCH_KEYWORDS) {
    if (lowerQuestion.includes(keyword.toLowerCase())) {
      console.log(`✅ SEARCH MODE: Found keyword "${keyword}"`);
      return true;
    }
  }
  
  const yearMatch = question.match(/\b(202[6-9]|20[3-9]\d)\b/);
  if (yearMatch) {
    console.log(`✅ SEARCH MODE: Future year detected (${yearMatch[0]})`);
    return true;
  }
  
  return false;
}

// ===============================================================
// 📚 KNOWLEDGE BASE - Rút gọn, không emoji
// ===============================================================
const KNOWLEDGE_BASE = `
--- QUY DINH MIEN THI NGOAI NGU ---

TIENG ANH (Bac 3 = B1 CEFR):

DUOC MIEN THI NEU CO:
- IELTS >= 4.0
- TOEFL iBT >= 45
- TOEIC 4 ky nang >= 550

LUU Y:
- Chung chi phai con han (khong qua 2 nam)
- Ban chinh hoac ban sao co chung thuc
- Nop ho so truoc thoi han

--- QUY DINH MAY TINH CAM TAY ---

DUOC PHEP:
- Casio: fx-570, fx-880, fx-991
- Vinacal: 570ES Plus, 991ES Plus

KHONG DUOC PHEP:
- May co ban phim QWERTY
- May co Word Processor
- May ket noi internet/bluetooth
`;

// ===============================================================
// 📄 PDF CACHING
// ===============================================================
let pdfCache = {
  data: null,
  timestamp: null,
  expiryMs: 60 * 60 * 1000
};

async function getCachedPDFContent() {
  const now = Date.now();
  
  if (pdfCache.data && pdfCache.timestamp && 
      (now - pdfCache.timestamp) < pdfCache.expiryMs) {
    console.log("✅ Using cached PDF content");
    return pdfCache.data;
  }
  
  console.log("🔄 Loading PDFs from Storage...");
  const pdfContents = await getAllPDFsFromStorage();
  const pdfContext = formatPDFContext(pdfContents);
  
  pdfCache.data = pdfContext;
  pdfCache.timestamp = now;
  
  return pdfContext;
}

async function getAllPDFsFromStorage() {
  try {
    const bucket = admin.storage().bucket();
    const [files] = await bucket.getFiles({ prefix: 'documents/' });
    
    const pdfFiles = files.filter(file => 
      file.name.toLowerCase().endsWith('.pdf')
    );
    
    const pdfContents = [];
    
    for (const file of pdfFiles) {
      try {
        const [buffer] = await file.download();
        const data = await pdfParse(buffer);
        
        pdfContents.push({
          fileName: file.name.split('/').pop(),
          content: data.text,
          numPages: data.numpages
        });
        
      } catch (error) {
        console.error(`Error reading ${file.name}:`, error.message);
      }
    }
    
    return pdfContents;
    
  } catch (error) {
    console.error("ERROR accessing Storage:", error);
    return [];
  }
}

function formatPDFContext(pdfContents) {
  if (!pdfContents || pdfContents.length === 0) {
    return "";
  }
  
  let context = "TAI LIEU PDF:\n\n";
  
  pdfContents.forEach((pdf, index) => {
    context += `--- ${pdf.fileName} ---\n`;
    context += `${pdf.content.substring(0, 2500)}\n\n`;
  });
  
  return context;
}

// ===============================================================
// 🤖 GOOGLE GEMINI API - ULTRA FIXED
// ===============================================================
async function callGeminiDirect(modelName, systemPrompt, userMessage, temperature = 0.7) {
  const apiKeys = getAPIKeys();
  
  if (!apiKeys.gemini) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  console.log(`🤖 Calling Google Gemini: ${modelName}...`);
  
  const genAI = new GoogleGenerativeAI(apiKeys.gemini);
  const model = genAI.getGenerativeModel({ model: modelName });

  // ✅ ULTRA CLEAN: Remove ALL special chars AND newlines
  const cleanSystemPrompt = systemPrompt
    .replace(/[✅❌🔹📋💡🤖😊💪🌟]/g, '')
    .replace(/━+/g, '---')
    .replace(/[\u2500-\u257F]/g, '-')
    .replace(/\n+/g, ' ')  // ← KEY FIX: Replace newlines with space
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .trim();

  const chat = model.startChat({
    generationConfig: {
      temperature: temperature,
      maxOutputTokens: 2000,
    },
    systemInstruction: cleanSystemPrompt
  });

  const result = await chat.sendMessage(userMessage);
  const response = await result.response;
  const text = response.text();
  
  console.log(`✅ Gemini response: ${text.length} chars`);
  return text;
}

// ===============================================================
// 🤖 OPENAI GPT API
// ===============================================================
async function callOpenAIDirect(modelName, systemPrompt, userMessage, temperature = 0.7) {
  const apiKeys = getAPIKeys();
  
  if (!apiKeys.openai) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  console.log(`🤖 Calling OpenAI: ${modelName}...`);
  
  const openai = new OpenAI({
    apiKey: apiKeys.openai
  });

  const completion = await openai.chat.completions.create({
    model: modelName,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ],
    temperature: temperature,
    max_tokens: 2000
  });

  const text = completion.choices[0].message.content;
  console.log(`✅ OpenAI response: ${text.length} chars`);
  return text;
}

// ===============================================================
// 🔍 PERPLEXITY AI
// ===============================================================
async function callPerplexity(systemPrompt, userMessage) {
  const apiKeys = getAPIKeys();
  
  if (!apiKeys.perplexity) {
    throw new Error("PERPLEXITY_API_KEY not configured");
  }

  console.log(`🔍 Calling Perplexity with search...`);

  const response = await axios.post(
    'https://api.perplexity.ai/chat/completions',
    {
      model: 'sonar',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.2,
      max_tokens: 2000,
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKeys.perplexity}`,
        'Content-Type': 'application/json'
      },
      timeout: 45000
    }
  );

  return response.data.choices[0].message.content;
}

// ===============================================================
// 🧠 ROUTER AI - FIX PRIORITY
// ===============================================================
async function routeQuestion(question) {
  const lowerQ = question.toLowerCase();
  
  // ✅ CHECK PHUONG_PHAP FIRST (higher priority)
  const methodKeywords = [
    'cách học', 'cach hoc', 
    'phương pháp học', 'phuong phap hoc',
    'học hiệu quả', 'hoc hieu qua',
    'làm sao để học', 'lam sao de hoc',
    'học tốt', 'hoc tot',
    'quản lý thời gian', 'quan ly thoi gian',
    'ghi nhớ', 'ghi nho', 'học thuộc', 'hoc thuoc',
    'ôn tập', 'on tap', 'ôn thi', 'on thi'
  ];
  
  for (const keyword of methodKeywords) {
    if (lowerQ.includes(keyword)) {
      console.log(`🎯 Fast route: PHUONG_PHAP (keyword: "${keyword}")`);
      return 'PHUONG_PHAP';
    }
  }
  
  // ✅ CHECK TAM_LY SECOND
  const psychologyKeywords = [
    'stress', 'áp lực', 'ap luc', 'lo lắng', 'lo lang',
    'động viên', 'dong vien', 'tâm lý', 'tam ly',
    'buồn', 'buon', 'chán', 'chan', 'mệt mỏi', 'met moi'
  ];
  
  for (const keyword of psychologyKeywords) {
    if (lowerQ.includes(keyword)) {
      console.log(`🎯 Fast route: TAM_LY (keyword: "${keyword}")`);
      return 'TAM_LY';
    }
  }
  
  // ✅ CHECK TUYEN_SINH LAST (default nếu không match)
  const admissionKeywords = [
    'ielts', 'toefl', 'toeic', 'miễn thi', 'mien thi',
    'chứng chỉ', 'chung chi', 'điểm chuẩn', 'diem chuan',
    'tuyển sinh', 'tuyen sinh', 'công văn', 'cong van',
    'quyết định', 'quyet dinh', 'quy định', 'quy dinh',
    'máy tính cầm tay', 'may tinh cam tay', 'casio', 'vinacal',
    'phòng thi', 'phong thi', 'bộ giáo dục', 'bo giao duc'
  ];
  
  for (const keyword of admissionKeywords) {
    if (lowerQ.includes(keyword)) {
      console.log(`🎯 Fast route: TUYEN_SINH (keyword: "${keyword}")`);
      return 'TUYEN_SINH';
    }
  }
  
  // ✅ Default: Nếu không match gì → KHAC
  console.log(`🎯 No keyword match → KHAC`);
  return "KHAC";
}

// ===============================================================
// AI #1: TUYỂN SINH - SPLIT STRATEGY
// ===============================================================
async function askTuyenSinhAI(question, pdfContext, needsSearch) {
  const lowerQ = question.toLowerCase();
  
  // ✅ DETECT: Câu hỏi về KNOWLEDGE_BASE hay PDF?
  const knowledgeBaseKeywords = [
    'ielts', 'toefl', 'toeic', 'miễn thi', 'mien thi',
    'chứng chỉ', 'chung chi', 'máy tính', 'may tinh',
    'casio', 'vinacal', 'phòng thi', 'phong thi'
  ];
  
  const pdfKeywords = [
    'công văn', 'cong van', 'quyết định', 'quyet dinh',
    'số', 'so', 'ban hành', 'ban hanh', 'bộ', 'bo',
    'ngày', 'ngay', 'tháng', 'thang'
  ];
  
  let useKnowledgeBase = false;
  let usePDF = false;
  
  for (const kw of knowledgeBaseKeywords) {
    if (lowerQ.includes(kw)) {
      useKnowledgeBase = true;
      break;
    }
  }
  
  for (const kw of pdfKeywords) {
    if (lowerQ.includes(kw)) {
      usePDF = true;
      break;
    }
  }
  
  // ✅ STRATEGY 1: KNOWLEDGE_BASE → GPT-4o Mini
  if (useKnowledgeBase && !usePDF) {
    console.log("📚 Using KNOWLEDGE_BASE (GPT-4o Mini)");
    
    const systemPrompt = `Ban la chuyen gia tuyen sinh DH Viet Nam. TRA LOI BANG TIENG VIET CO DAU. QUY DINH MIEN THI: IELTS >= 4.0, TOEFL iBT >= 45, TOEIC >= 550 duoc mien thi. Chung chi con han < 2 nam. MAY TINH: Duoc dung Casio fx-570/880/991, Vinacal 570ES/991ES. Khong duoc dung may co QWERTY, Word Processor. Tra loi ro rang theo quy dinh.`;

    const userMessage = `VI DU: 
Q: "IELTS 4.5 duoc mien thi khong?" 
A: "ĐƯỢC MIỄN THI

Căn cứ: Quy định kỳ thi tốt nghiệp THPT

Chứng chỉ IELTS >= 4.0 được miễn thi môn Tiếng Anh. Chứng chỉ phải còn hạn (< 2 năm)."

---

CAU HOI: ${question}

Tra loi BANG TIENG VIET CO DAU:`;

    if (needsSearch) {
      return await callPerplexity(systemPrompt, userMessage);
    } else {
      return await callOpenAIDirect('gpt-4o-mini', systemPrompt, userMessage, 0.0);
    }
  }
  
  // ✅ STRATEGY 2: PDF DOCUMENT → Gemini Flash
  if (usePDF || (!useKnowledgeBase && pdfContext)) {
    console.log("📄 Using PDF CONTEXT (Gemini Flash)");
    
    const systemPrompt = `Ban la chuyen gia tuyen sinh, doc va tra loi dua tren tai lieu. TRA LOI BANG TIENG VIET CO DAU. Tra loi ro rang theo tai lieu.`;

    const shortPdfContext = pdfContext ? pdfContext.substring(0, 2500) : "";
    
    const userMessage = `TAI LIEU:

${shortPdfContext}

---

CAU HOI: ${question}

Tra loi BANG TIENG VIET CO DAU dua tren tai lieu tren (neu co):`;

    if (needsSearch) {
      return await callPerplexity(systemPrompt, userMessage);
    } else {
      const apiKeys = getAPIKeys();
      if (apiKeys.gemini) {
        try {
          return await callGeminiDirect('gemini-2.5-flash', systemPrompt, userMessage, 0.1);
        } catch (error) {
          console.log(`⚠️ Gemini failed for PDF, trying GPT: ${error.message}`);
          if (apiKeys.openai) {
            return await callOpenAIDirect('gpt-4o-mini', systemPrompt, userMessage, 0.1);
          }
          throw error;
        }
      } else if (apiKeys.openai) {
        return await callOpenAIDirect('gpt-4o-mini', systemPrompt, userMessage, 0.1);
      }
      throw new Error("No API keys available");
    }
  }
  
  // ✅ FALLBACK: Dùng GPT-4o Mini với cả 2
  console.log("🔄 Using BOTH KB + PDF (GPT-4o Mini)");
  
  const systemPrompt = `Ban la chuyen gia tuyen sinh DH Viet Nam. TRA LOI BANG TIENG VIET CO DAU. QUY DINH: IELTS >= 4.0, TOEFL iBT >= 45, TOEIC >= 550 duoc mien thi. Tra loi theo quy dinh va tai lieu.`;

  const shortPdfContext = pdfContext ? pdfContext.substring(0, 1500) : "";
  const userMessage = `TAI LIEU: ${shortPdfContext}

CAU HOI: ${question}

Tra loi BANG TIENG VIET CO DAU:`;

  return await callOpenAIDirect('gpt-4o-mini', systemPrompt, userMessage, 0.1);
}

// ===============================================================
// AI #2: PHƯƠNG PHÁP HỌC - KHÔNG DÙNG PDF
// ===============================================================
async function askPhuongPhapAI(question, needsSearch) {
  const systemPrompt = `Ban la giao vien gioi, huong dan phuong phap hoc hieu qua. TRA LOI BANG TIENG VIET CO DAU. Phong cach gan gui, cu the, co vi du thuc te.`;

  if (needsSearch) {
    return await callPerplexity(systemPrompt, question);
  } else {
    // Ưu tiên GPT vì response tốt hơn và có dấu
    const apiKeys = getAPIKeys();
    if (apiKeys.openai) {
      return await callOpenAIDirect('gpt-4o-mini', systemPrompt, question, 0.7);
    } else if (apiKeys.gemini) {
      try {
        return await callGeminiDirect('gemini-2.5-flash', systemPrompt, question, 0.7);
      } catch (error) {
        throw new Error("Cannot answer without API keys");
      }
    }
    throw new Error("No API keys available");
  }
}

// ===============================================================
// AI #3: TÂM LÝ HỌC TẬP - KHÔNG DÙNG PDF
// ===============================================================
async function askTamLyAI(question, needsSearch) {
  const systemPrompt = `Ban la chuyen vien tam ly hoc duong. TRA LOI BANG TIENG VIET CO DAU. Phong cach am ap, dong cam, tich cuc. Co the dung emoji phu hop.`;

  if (needsSearch) {
    return await callPerplexity(systemPrompt, question);
  } else {
    // Ưu tiên GPT vì response tốt hơn
    const apiKeys = getAPIKeys();
    if (apiKeys.openai) {
      return await callOpenAIDirect('gpt-4o-mini', systemPrompt, question, 0.9);
    } else if (apiKeys.gemini) {
      try {
        return await callGeminiDirect('gemini-2.5-flash', systemPrompt, question, 0.9);
      } catch (error) {
        throw new Error("Cannot answer without API keys");
      }
    }
    throw new Error("No API keys available");
  }
}

// ===============================================================
// 🔄 HYBRID FALLBACK CHAIN
// ===============================================================
async function callWithHybridFallback(category, question, pdfContext) {
  const needsSearch = needsRealTimeSearch(question);
  const apiKeys = getAPIKeys();
  
  const attempts = [];
  
  // ✅ Priority order based on question type
  const lowerQ = question.toLowerCase();
  const isPDFQuestion = lowerQ.includes('công văn') || lowerQ.includes('cong van') || 
                        lowerQ.includes('quyết định') || lowerQ.includes('quyet dinh');
  
  if (needsSearch && apiKeys.perplexity) {
    attempts.push({ model: 'perplexity-search', label: 'Perplexity Search' });
  }
  
  // If PDF question → Gemini first, else GPT first
  if (isPDFQuestion && apiKeys.gemini) {
    attempts.push({ model: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' });
  }
  
  if (apiKeys.openai) {
    attempts.push({ model: 'gpt-4o-mini', label: 'GPT-4o Mini' });
  }
  
  if (!isPDFQuestion && apiKeys.gemini) {
    attempts.push({ model: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' });
  }
  
  if (apiKeys.openai) {
    attempts.push({ model: 'gpt-4o', label: 'GPT-4o' });
  }
  
  if (attempts.length === 0) {
    throw new Error("No API keys configured!");
  }
  
  for (let i = 0; i < attempts.length; i++) {
    const { model, label } = attempts[i];
    
    try {
      console.log(`🤖 Attempt ${i + 1}/${attempts.length}: ${label}...`);
      
      const startTime = Date.now();
      let result;
      
      if (model === 'perplexity-search') {
        switch(category) {
          case 'TUYEN_SINH':
            result = await askTuyenSinhAI(question, pdfContext, true);
            break;
          case 'PHUONG_PHAP':
            result = await askPhuongPhapAI(question, true);
            break;
          case 'TAM_LY':
            result = await askTamLyAI(question, true);
            break;
        }
      } else if (model.startsWith('gemini-')) {
        switch(category) {
          case 'TUYEN_SINH':
            result = await askTuyenSinhAI(question, pdfContext, false);
            break;
          case 'PHUONG_PHAP':
            result = await askPhuongPhapAI(question, false);
            break;
          case 'TAM_LY':
            result = await askTamLyAI(question, false);
            break;
        }
      } else {
        // OpenAI models
        switch(category) {
          case 'TUYEN_SINH':
            result = await askTuyenSinhAI(question, pdfContext, false);
            break;
          case 'PHUONG_PHAP':
            result = await askPhuongPhapAI(question, false);
            break;
          case 'TAM_LY':
            result = await askTamLyAI(question, false);
            break;
        }
      }
      
      const callTime = Date.now() - startTime;
      console.log(`✅ Success with ${label}! (${callTime}ms)`);
      
      return { 
        reply: result, 
        aiUsed: label,
        callTimeMs: callTime,
        searchMode: model === 'perplexity-search'
      };
      
    } catch (error) {
      console.error(`❌ ${label} failed:`, error.message);
      
      if (i === attempts.length - 1) {
        throw new Error(`All AI providers failed. Last error: ${error.message}`);
      }
      
      console.log(`🔄 Falling back to ${attempts[i + 1].label}...`);
    }
  }
}

// ===============================================================
// 💰 COST TRACKING
// ===============================================================
function logCostEstimate(modelLabel, tokenEstimate) {
  const PRICE_PER_1M = {
    'Perplexity Search': 1.0,
    'Gemini 2.5 Flash': 0.075,
    'GPT-4o Mini': 0.15,
    'Gemini 2.5 Pro': 0.30,
    'GPT-4o': 2.50
  };
  
  const pricePerMillion = PRICE_PER_1M[modelLabel] || 0.5;
  const estimatedCost = (tokenEstimate / 1000000) * pricePerMillion;
  
  console.log(`💰 Estimated cost: ${estimatedCost.toFixed(6)} (${modelLabel})`);
}

// ===============================================================
// MAIN CHAT FUNCTION
// ===============================================================
exports.chatWithAI = functions
  .runWith({ 
    timeoutSeconds: 300,
    memory: "2GB"
  })
  .https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      return res.status(204).send('');
    }
    
    if (req.method !== "POST") {
      return res.status(405).send("Method not allowed");
    }

    try {
      const { message } = req.body;
      if (!message) return res.status(400).send("message required");

      console.log(`\n${'='.repeat(70)}`);
      console.log(`🚀 Unipath AI v${VERSION}`);
      console.log(`📝 Question: ${message}`);
      console.log('='.repeat(70));

      const startTime = Date.now();
      const category = await routeQuestion(message);

      let result;

      if (category === 'KHAC') {
        result = {
          reply: `Xin chào! Mình chỉ chuyên tư vấn về:

📚 TUYỂN SINH: IELTS/TOEFL/TOEIC, điểm chuẩn, quy chế thi, máy tính cầm tay
📖 PHƯƠNG PHÁP HỌC: Cách học hiệu quả, quản lý thời gian, ôn tập
💪 TÂM LÝ: Động viên, giải tỏa stress, lo lắng trước kỳ thi

Câu hỏi của bạn có vẻ nằm ngoài các chủ đề trên. Bạn có câu hỏi nào khác không? 😊`,
          aiUsed: 'Router (Rejected)',
          callTimeMs: 0,
          searchMode: false
        };
      } else {
        const pdfContext = category === 'TUYEN_SINH' 
          ? await getCachedPDFContent().catch(() => null)
          : null;  // ← PHUONG_PHAP và TAM_LY KHÔNG dùng PDF
        
        console.log(`\n🎯 Category: ${category}`);
        if (category !== 'TUYEN_SINH' && pdfContext) {
          console.log(`⚠️ ${category} doesn't need PDF, skipping...`);
        }
        
        result = await callWithHybridFallback(category, message, pdfContext);
        
        const tokenEstimate = message.length + result.reply.length + 
          (pdfContext ? pdfContext.length : 0);
        logCostEstimate(result.aiUsed, tokenEstimate);
      }

      const totalTime = Date.now() - startTime;

      console.log(`\n✅ AI Used: ${result.aiUsed}`);
      console.log(`⏱️  Total: ${totalTime}ms`);
      console.log('='.repeat(70) + '\n');

      res.json({ 
        reply: result.reply,
        metadata: {
          aiUsed: result.aiUsed,
          category,
          version: VERSION,
          processingTimeMs: totalTime,
          searchMode: result.searchMode || false,
          timestamp: new Date().toISOString()
        }
      });

    } catch (err) {
      console.error("❌ ERROR:", err);
      res.status(500).json({ 
        error: "Lỗi server. Vui lòng thử lại.",
        details: err.message
      });
    }
  });

// ===============================================================
// UPLOAD PDF
// ===============================================================
exports.uploadDocument = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).send('');
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const { fileName, fileData } = req.body;
    
    if (!fileName || !fileData) {
      return res.status(400).json({ error: "Missing fileName or fileData" });
    }

    const bucket = admin.storage().bucket();
    const file = bucket.file(`documents/${fileName}`);
    const buffer = Buffer.from(fileData, 'base64');
    
    await file.save(buffer, {
      metadata: { contentType: 'application/pdf' }
    });

    pdfCache.data = null;
    pdfCache.timestamp = null;

    res.json({ 
      success: true, 
      message: `Đã upload ${fileName} thành công`
    });

  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===============================================================
// VERSION CHECK
// ===============================================================
exports.version = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  
  const apiKeys = getAPIKeys();
  
  res.json({
    version: VERSION,
    status: "✅ Unipath AI - Split Strategy",
    strategy: {
      knowledgeBase: "GPT-4o Mini (IELTS, TOEFL, máy tính)",
      pdfReader: "Gemini Flash (Công văn, quyết định)",
      routing: "Auto-detect based on keywords"
    },
    improvements: [
      "✅ Split KB vs PDF handling",
      "✅ GPT-4o Mini for KNOWLEDGE_BASE (fast, cheap)",
      "✅ Gemini Flash for PDF reading (accurate)",
      "✅ Smart routing based on question type",
      "✅ Cost tracking per request"
    ],
    apiKeys: {
      gemini: !!apiKeys.gemini,
      openai: !!apiKeys.openai,
      perplexity: !!apiKeys.perplexity
    },
    routing: AI_ROUTING
  });
});