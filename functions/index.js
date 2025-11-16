// ===============================================================
// Unipath AI Chat - Perplexity Integration v8.0.0
// ✨ Smart Routing: Gemini 2.5 Pro (paid) + Perplexity (real-time search)
// 🎯 Strategy: Use Perplexity when search needed (has Google Search)
// ===============================================================
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const OpenAI = require("openai");
const axios = require("axios"); // NEW: For Perplexity API
const pdfParse = require("pdf-parse");

admin.initializeApp();

const VERSION = "8.0.0-perplexity";

// ===============================================================
// 🔥 HYBRID CONFIGURATION
// ===============================================================
const MEGALLM_CONFIG = {
  baseURL: 'https://ai.megallm.io/v1',
  defaultTimeout: 60000,
  maxRetries: 2
};

const PERPLEXITY_CONFIG = {
  baseURL: 'https://api.perplexity.ai',
  model: 'sonar', // Model with Google Search
  timeout: 45000
};

// ===============================================================
// 🎯 AI ROUTING - PERPLEXITY STRATEGY
// Primary: Gemini 2.5 Pro (paid, quality)
// Search Mode: Perplexity (paid but has real Google Search)
// ===============================================================
const AI_ROUTING = {
  TUYEN_SINH: {
    primary: 'gemini-2.5-pro',           // MegaLLM - Best quality
    searchFallback: 'perplexity-search', // Perplexity when search needed
    megallmFallback: 'gpt-4o-2024-11-20',
    finalFallback: 'gpt-4o-mini'
  },
  PHUONG_PHAP: {
    primary: 'gemini-2.5-pro',
    searchFallback: 'perplexity-search',
    megallmFallback: 'gpt-4o-2024-11-20',
    finalFallback: 'gpt-4o-mini'
  },
  TAM_LY: {
    primary: 'gemini-2.5-pro',
    searchFallback: 'perplexity-search',
    megallmFallback: 'gpt-4o-2024-11-20',
    finalFallback: 'gpt-4o-mini'
  }
};

// ===============================================================
// 🔍 SEARCH DETECTION - Detect if question needs real-time search
// ===============================================================
const SEARCH_KEYWORDS = [
  // Future years
  'năm 2026', 'năm 2027', 'năm 2028', 'năm 2029',
  '2026', '2027', '2028', '2029',
  
  // Time-based keywords
  'mới nhất', 'hiện tại', 'bây giờ', 'hôm nay', 'tuần này', 'tháng này',
  'gần đây', 'vừa rồi', 'ngày nay',
  
  // Future/Planning keywords
  'dự kiến', 'sắp tới', 'kế hoạch', 'sẽ', 'tương lai',
  
  // News/Updates keywords
  'tin tức', 'thông báo mới', 'cập nhật', 'tin mới',
  'thông tin mới', 'công bố mới',
  
  // Admission score keywords - CRITICAL FOR SEARCH
  'điểm chuẩn', 'diem chuan',
  'điểm trúng tuyển', 'diem trung tuyen',
  'điểm xét tuyển', 'diem xet tuyen',
  'ngưỡng điểm', 'nguong diem',
  'điểm đầu vào', 'diem dau vao',
  
  // University specific scores
  'bách khoa', 'bach khoa', 'hcmut',
  'kinh tế', 'kinh te', 'ueh',
  'y dược', 'y duoc', 'yds',
  'sư phạm', 'su pham',
  'khoa học tự nhiên', 'khtn',
  'ngoại thương', 'ngoai thuong', 'ftu',
  'bưu chính viễn thông', 'buu chinh vien thong', 'ptit',
  'hcmus','hcm','hn','hồ chí minh','hà nội',
  
  // Specific admission terms
  'điểm chuẩn 2024', 'điểm chuẩn 2025',
  'điểm chuẩn 2026', 'điểm chuẩn 2027', 'điểm chuẩn 2028',
  'tuyển sinh 2024', 'tuyển sinh 2025',
  'tuyển sinh 2026', 'tuyển sinh 2027',
];

function needsRealTimeSearch(question) {
  const lowerQuestion = question.toLowerCase();
  
  console.log(`\n🔍 Checking search need for: "${question}"`);
  console.log(`📝 Normalized question: "${lowerQuestion}"`);
  
  // Check if question contains search keywords
  for (const keyword of SEARCH_KEYWORDS) {
    const lowerKeyword = keyword.toLowerCase();
    if (lowerQuestion.includes(lowerKeyword)) {
      console.log(`✅ SEARCH MODE: Found keyword "${keyword}" (normalized: "${lowerKeyword}")`);
      return true;
    }
  }
  
  // Check for year > 2025 (beyond training data)
  const yearMatch = question.match(/\b(202[6-9]|20[3-9]\d)\b/);
  if (yearMatch) {
    console.log(`✅ SEARCH MODE: Future year detected (${yearMatch[0]})`);
    return true;
  }
  
  console.log(`❌ NO MATCH: None of ${SEARCH_KEYWORDS.length} keywords found`);
  console.log(`📚 STANDARD MODE: Using Gemini 2.5 Pro (no search needed)`);
  return false;
}

// ===============================================================
// KNOWLEDGE BASE (GIỮ NGUYÊN)
// ===============================================================
const KNOWLEDGE_BASE = `
BANG TRA CUU - KY THI TOT NGHIEP THPT

1. CHUNG CHI NGOAI NGU - MIEN THI

QUY DINH CHUNG:
Nguoi co chung chi ngoai ngu dat tu BAC 3 tro len duoc MIEN THI mon Ngoai ngu.

TIENG ANH (Bac 3 = B1):
- IELTS: >= 4.0 -> MIEN THI
- TOEFL iBT: >= 45 -> MIEN THI
- TOEFL ITP: >= 450 -> MIEN THI
- Cambridge: B1 (PET) -> MIEN THI
- TOEIC 4 ky nang: >= 550 -> MIEN THI

TIENG TRUNG: HSK cap 3+ -> MIEN THI
TIENG NHAT: JLPT N3+ -> MIEN THI
TIENG HAN: TOPIK cap 3+ -> MIEN THI
TIENG PHAP: DELF B1+ -> MIEN THI
TIENG DUC: Goethe B1+ -> MIEN THI

DIEU KIEN: Chung chi phai con han den ngay lam thu tuc du thi

2. MAY TINH CAM TAY - QUY DINH MANG VAO PHONG THI

KHONG DUOC PHEP:
May tinh cam tay co kha nang soan thao van ban

MAY BI CAM:
- May co ban phim QWERTY day du
- May co chuc nang text editor, word processor
- May tinh do hoa co lap trinh phuc tap

MAY DUOC PHEP:
- Casio fx-880: DUOC PHEP (may tinh khoa hoc co ban)
- Casio fx-570VN Plus II: DUOC PHEP
- Casio fx-570ES Plus: DUOC PHEP
- Casio fx-991EX: DUOC PHEP (khong co soan thao van ban)
- Vinacal 570ES Plus II: DUOC PHEP
- Casio fx-580: DUOC PHEP

NGUYEN TAC PHAN BIET:
- Neu may CHI tinh toan khoa hoc -> DUOC PHEP
- Neu may co Word/Text Editor -> BI CAM
- Cac dong fx-570, fx-880, fx-991 deu DUOC PHEP
`;

// ===============================================================
// PDF CACHING
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
  
  console.log(`✅ Cached ${pdfContents.length} PDFs`);
  return pdfContext;
}

async function getAllPDFsFromStorage() {
  try {
    const bucket = admin.storage().bucket();
    const [files] = await bucket.getFiles({ prefix: 'documents/' });
    
    const pdfFiles = files.filter(file => 
      file.name.toLowerCase().endsWith('.pdf')
    );
    
    console.log(`Found ${pdfFiles.length} PDF files`);
    
    const pdfContents = [];
    
    for (const file of pdfFiles) {
      try {
        const [buffer] = await file.download();
        const data = await pdfParse(buffer);
        
        const fileName = file.name.split('/').pop();
        
        pdfContents.push({
          fileName: fileName,
          displayName: fileName.replace('.pdf', '').replace(/-/g, ' ').toUpperCase(),
          content: data.text,
          numPages: data.numpages
        });
        
        console.log(`  ✓ ${fileName} (${data.numpages} pages)`);
        
      } catch (error) {
        console.error(`  ✗ ERROR reading ${file.name}: ${error.message}`);
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
    return "Khong co tai lieu PDF nao duoc tim thay.";
  }
  
  let context = "TAI LIEU CHINH THUC TU BO GIAO DUC VA DAO TAO\n\n";
  
  pdfContents.forEach((pdf, index) => {
    context += `━━━ TAI LIEU ${index + 1}: ${pdf.displayName} ━━━\n`;
    context += `Ten file: ${pdf.fileName}\n`;
    context += `So trang: ${pdf.numPages}\n\n`;
    context += `NOI DUNG:\n${pdf.content.substring(0, 4000)}\n`;
    context += `${pdf.content.length > 4000 ? '...(con tiep)\n' : ''}\n\n`;
  });
  
  return context;
}

// ===============================================================
// 🔧 CLIENT INITIALIZATION
// ===============================================================
function initMegaLLMClient(apiKey) {
  return new OpenAI({
    baseURL: MEGALLM_CONFIG.baseURL,
    apiKey: apiKey,
    timeout: MEGALLM_CONFIG.defaultTimeout,
    maxRetries: MEGALLM_CONFIG.maxRetries
  });
}

// ===============================================================
// 🔍 PERPLEXITY AI (with Real Google Search) - PAID
// ===============================================================
async function callPerplexity(systemPrompt, userMessage) {
  const perplexityKey = process.env.PERPLEXITY_API_KEY || 
    (functions.config().perplexity && functions.config().perplexity.key);
  
  if (!perplexityKey) {
    throw new Error("PERPLEXITY_API_KEY not configured");
  }

  console.log(`🔍 Calling Perplexity with search capability...`);
  console.log(`📝 Message length: ${userMessage.length} chars`);

  try {
    const response = await axios.post(
      `${PERPLEXITY_CONFIG.baseURL}/chat/completions`,
      {
        model: PERPLEXITY_CONFIG.model,
        messages: [
          { 
            role: 'system', 
            content: systemPrompt 
          },
          { 
            role: 'user', 
            content: userMessage 
          }
        ],
        temperature: 0.2, // Lower for factual accuracy
        max_tokens: 2000,
        // Perplexity automatically searches Google when needed
      },
      {
        headers: {
          'Authorization': `Bearer ${perplexityKey}`,
          'Content-Type': 'application/json'
        },
        timeout: PERPLEXITY_CONFIG.timeout
      }
    );

    const content = response.data.choices[0].message.content;
    
    // Check if Perplexity cited sources
    const hasCitations = content.includes('[') || content.includes('nguồn') || content.includes('theo');
    console.log(`✅ Perplexity response received (${content.length} chars)`);
    console.log(`📚 Citations found: ${hasCitations ? 'YES' : 'NO'}`);
    
    return content;

  } catch (error) {
    console.error(`❌ Perplexity API error:`, error.response?.data || error.message);
    throw new Error(`Perplexity failed: ${error.response?.data?.error || error.message}`);
  }
}

// ===============================================================
// 🤖 GEMINI 2.5 PRO (via MegaLLM) - PAID but BEST QUALITY
// ===============================================================
async function callGeminiPro(systemPrompt, userMessage, temperature = 0.7, maxTokens = 1500) {
  const megaKey = process.env.MEGALLM_API_KEY || 
    (functions.config().megallm && functions.config().megallm.key);
  
  if (!megaKey) {
    throw new Error("MEGALLM_API_KEY not configured");
  }

  const client = initMegaLLMClient(megaKey);

  const response = await client.chat.completions.create({
    model: 'gemini-2.5-pro',
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ],
    temperature: temperature,
    max_tokens: maxTokens
  });

  return response.choices[0].message.content;
}

// ===============================================================
// 🤖 GPT FALLBACK (via MegaLLM)
// ===============================================================
async function callGPT(modelName, systemPrompt, userMessage, temperature = 0.7, maxTokens = 1200) {
  const megaKey = process.env.MEGALLM_API_KEY || 
    (functions.config().megallm && functions.config().megallm.key);
  
  if (!megaKey) {
    throw new Error("MEGALLM_API_KEY not configured");
  }

  const client = initMegaLLMClient(megaKey);

  const response = await client.chat.completions.create({
    model: modelName,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ],
    temperature: temperature,
    max_tokens: maxTokens
  });

  return response.choices[0].message.content;
}

// ===============================================================
// ROUTER AI - Phân loại câu hỏi
// ===============================================================
async function routeQuestion(question, megaClient) {
  const routerPrompt = `
Phan loai cau hoi vao 1 trong 4 loai. Chi tra loi CHINH XAC 1 tu:

1. TUYEN_SINH - Cau hoi ve:
   • Tuyen sinh dai hoc, diem chuan, ngành học, trường học
   • Ky thi tot nghiep THPT
   • Quy che thi, quy dinh Bo GD&DT
   • DO VAT MANG VAO PHONG THI: May tinh cam tay (Casio, Vinacal, fx-570, fx-580, fx-991...)
   • Chung chi ngoai ngu (IELTS, TOEFL, TOEIC, HSK, JLPT...), mien thi
   • Ho so, thu tuc dang ky, giay to
   • Phuong thuc xet tuyen, to hop mon
   • Thoi gian thi, lich thi

2. PHUONG_PHAP - Cau hoi ve:
   • Cach hoc, phuong phap on thi
   • Quan ly thoi gian hoc tap
   • Ky nang ghi nho, hoc tap
   • Ky thuat lam bai thi
   • Cong cu hoc tap

3. TAM_LY - Cau hoi ve:
   • Tam ly thi cu, lo lang, stress
   • Dong vien, tao dong luc
   • Kho khan trong hoc tap
   • Ap luc gia dinh, ban be
   • Tu tin, khac phuc that bai

4. KHAC - Cau hoi HOAN TOAN khong lien quan den hoc tap/tuyen sinh/giao duc
   • Thoi tiet, nau an, the thao, giai tri, du lich...

VI DU:
- "Casio fx-570 co duoc phep khong?" → TUYEN_SINH (quy che thi)
- "IELTS 5.0 co du khong?" → TUYEN_SINH (chung chi)
- "Cach hoc tu vung" → PHUONG_PHAP
- "Stress truoc thi" → TAM_LY
- "Thoi tiet hom nay" → KHAC

Cau hoi: "${question}"

CHI TRA LOI 1 TU: TUYEN_SINH hoac PHUONG_PHAP hoac TAM_LY hoac KHAC
`;

  try {
    const response = await megaClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: routerPrompt }],
      temperature: 0,
      max_tokens: 20
    });

    const category = response.choices[0].message.content.trim().toUpperCase();
    console.log(`🧠 Router: "${question.substring(0, 40)}..." → ${category}`);
    
    return category;
  } catch (error) {
    console.error("❌ Router error:", error);
    return "TUYEN_SINH"; // Fallback default
  }
}

// ===============================================================
// AI #1: TUYỂN SINH SPECIALIST
// ===============================================================
async function askTuyenSinhAI(question, pdfContext, needsSearch) {
  const systemPrompt = `
Ban la chuyen gia tuyen sinh NGHIEM NGAT cua Unipath.

THONG TIN QUAN TRONG:
- TAI LIEU CUA BAN: Nam hoc 2024-2025
- NAM HIEN TAI: 2025
${needsSearch ? '- Ban DANG CO KHA NANG TIM KIEM GOOGLE TRUC TIEP: Hay search de tim thong tin moi nhat, dac biet la diem chuan 2024/2025' : ''}
- NEU hoi ve nam 2026+ va khong co trong tai lieu -> ${needsSearch ? 'TIM KIEM Google va trich dan nguon cu the' : 'Noi ro chua co thong tin'}

NHIEM VU:
- CHI tra loi cau hoi ve tuyen sinh DH/THPT
- UU TIEN dung tai lieu chinh thuc duoi day
${needsSearch ? '- Neu tai lieu khong co hoac can info moi -> TIM KIEM Google va TRICH DAN NGUON (link, ten bai viet)' : '- Neu tai lieu khong co -> Suy luan tu quy dinh chung hoac noi ro khong co thong tin'}
- Tra loi CHINH XAC, RO RANG

FORMAT TRA LOI:
Theo [Ten tai lieu${needsSearch ? ' / Link nguon tim kiem' : ''}]...

✓ CO/KHONG - Tra loi truc tiep

LY DO:
[Giai thich cu the]

${needsSearch ? 'NGUON TIM KIEM:\n[Link hoac ten website neu search]' : ''}

LUU Y:
[Dieu can chu y]

TAI LIEU CHINH THUC (NAM HOC 2024-2025):
${pdfContext}

KNOWLEDGE BASE:
${KNOWLEDGE_BASE}

QUY TAC:
1. LUON trich dan nguon thong tin
2. Tra loi TRUC TIEP truoc khi giai thich
3. ${needsSearch ? 'NEU search Google, phai CITE link website cu the' : 'Suy luan hop ly tu tai lieu hien co'}
4. NEU hoi ve nam 2026+ -> ${needsSearch ? 'TIM KIEM va noi ro "thong tin tam thoi tu nguon ..."' : 'Noi ro "chua co cong van chinh thuc"'}
`;

  if (needsSearch) {
    // Use Perplexity (has real Google Search) - PAID but accurate
    return await callPerplexity(systemPrompt, question);
  } else {
    // Use Gemini 2.5 Pro (best quality) - PAID
    return await callGeminiPro(systemPrompt, question, 0.1, 1500);
  }
}

// ===============================================================
// AI #2: PHƯƠNG PHÁP HỌC
// ===============================================================
async function askPhuongPhapAI(question, needsSearch) {
  const systemPrompt = `
Ban la giao vien kinh nghiem 20 nam, chuyen huong dan phuong phap hoc hieu qua.

${needsSearch ? 'Ban co the TIM KIEM phuong phap hoc tap moi nhat tren Google neu can. Hay trich dan nguon tin cay.' : ''}

PHONG CACH:
- Gan gui, than thien nhu anh/chi
- Cu the, co vi du thuc te
- Khong qua hoc thuat, de hieu
- Cau truc ro rang: 1-2-3

NHIEM VU:
- Huong dan phuong phap hoc tap hieu qua
- Chia se kinh nghiem on thi
- Tu van quan ly thoi gian
- Goi y ky thuat ghi nho, doc hieu

FORMAT TRA LOI:
[Gioi thieu ngan]

BUOC 1: [Chi tiet]
BUOC 2: [Chi tiet]
BUOC 3: [Chi tiet]

VI DU: [Vi du cu the]

${needsSearch ? 'THAM KHAO:\n[Nguon neu search]' : ''}

LUU Y: [Dieu can chu y]
`;

  if (needsSearch) {
    return await callPerplexity(systemPrompt, question);
  } else {
    return await callGeminiPro(systemPrompt, question, 0.7, 1000);
  }
}

// ===============================================================
// AI #3: TÂM LÝ HỌC TẬP
// ===============================================================
async function askTamLyAI(question, needsSearch) {
  const systemPrompt = `
Ban la chuyen vien tam ly hoc duong, am hieu tam tu cua hoc sinh/sinh vien.

PHONG CACH:
- Am ap, chan thanh, dong cam
- Tich cuc, lac quan
- Su dung emoji phu hop 😊💪🌟
- Khong phe phan, khong hoc thuat
- Noi nhu nguoi ban than

NHIEM VU:
- Dong vien tinh than hoc tap
- Giai toa lo lang, stress, ap luc thi cu
- Tao dong luc, tu tin
- Tu van vuot qua kho khan tam ly

FORMAT TRA LOI:
[Dong cam voi cam xuc cua ban]

[Tu van cu the 2-3 diem]

[Dong vien, khich le]

[Ket thuc bang cau tich cuc]
`;

  if (needsSearch) {
    return await callPerplexity(systemPrompt, question);
  } else {
    return await callGeminiPro(systemPrompt, question, 0.9, 1000);
  }
}

// ===============================================================
// 🔄 HYBRID FALLBACK CHAIN
// Priority: Gemini 2.5 Pro → Perplexity (if search) → GPT-4o → GPT-4o-mini
// ===============================================================
async function callWithHybridFallback(category, question, pdfContext) {
  const route = AI_ROUTING[category];
  const needsSearch = needsRealTimeSearch(question);
  
  // Build attempt list based on search needs
  const attempts = [];
  
  if (needsSearch) {
    // If needs search, prioritize Perplexity (has real Google Search)
    console.log(`🔍 Search mode activated - using Perplexity with Google Search`);
    attempts.push({ model: route.searchFallback, label: 'Perplexity (Google Search)' });
    attempts.push({ model: route.primary, label: 'Gemini 2.5 Pro (fallback)' });
  } else {
    // Standard flow: Gemini Pro first
    attempts.push({ model: route.primary, label: 'Gemini 2.5 Pro' });
    attempts.push({ model: route.searchFallback, label: 'Perplexity (fallback)' });
  }
  
  // Add MegaLLM GPT fallbacks
  if (route.megallmFallback) {
    attempts.push({ model: route.megallmFallback, label: route.megallmFallback });
  }
  if (route.finalFallback) {
    attempts.push({ model: route.finalFallback, label: route.finalFallback });
  }
  
  for (let i = 0; i < attempts.length; i++) {
    const { model, label } = attempts[i];
    
    try {
      console.log(`🤖 Attempt ${i + 1}/${attempts.length}: ${label}...`);
      
      const startTime = Date.now();
      let result;
      
      // Route to appropriate AI function
      if (model === 'perplexity-search') {
        // Use Perplexity (real Google Search)
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
      } else if (model === 'gemini-2.5-pro') {
        // Use Gemini 2.5 Pro via MegaLLM
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
        // Use GPT models via MegaLLM
        const systemPrompt = category === 'TUYEN_SINH' 
          ? `Tuyen sinh specialist. Context: ${pdfContext ? pdfContext.substring(0, 2000) : 'No PDF'}...`
          : `${category} specialist`;
        result = await callGPT(model, systemPrompt, question);
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
        throw new Error(`All AI providers failed: ${error.message}`);
      }
      
      console.log(`🔄 Falling back to ${attempts[i + 1].label}...`);
    }
  }
}

// ===============================================================
// 📊 COST TRACKING
// ===============================================================
function logCostEstimate(modelLabel, tokenEstimate, searchMode) {
  const PRICE_PER_1K = {
    'Perplexity (Google Search)': 0.001,    // $1/1K requests ≈ $0.001/request
    'Perplexity (fallback)': 0.001,
    'Gemini 2.5 Pro': 0.0005,               // MegaLLM pricing
    'Gemini 2.5 Pro (fallback)': 0.0005,
    'gpt-4o-2024-11-20': 0.0025,
    'gpt-4o-mini': 0.00015
  };
  
  const pricePerToken = PRICE_PER_1K[modelLabel] || 0.0005;
  const estimatedCost = (tokenEstimate / 1000) * pricePerToken;
  
  console.log(`💰 Cost: ${estimatedCost.toFixed(6)} (${modelLabel})`);
  if (searchMode) {
    console.log(`🔍 Search mode: Using Perplexity with real-time Google Search`);
  }
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
      console.log(`🚀 Unipath Perplexity v${VERSION}`);
      console.log(`📝 Question: ${message}`);
      console.log('='.repeat(70));

      const megaKey = process.env.MEGALLM_API_KEY || 
        (functions.config().megallm && functions.config().megallm.key);

      if (!megaKey) {
        return res.status(500).json({ error: "MegaLLM API key not configured" });
      }

      const megaClient = initMegaLLMClient(megaKey);
      const startTime = Date.now();

      // Step 1: Route question
      const category = await routeQuestion(message, megaClient);

      let result;

      if (category === 'KHAC') {
        result = {
          reply: `Mình chỉ chuyên tư vấn về 3 lĩnh vực thôi nha:

📚 TUYỂN SINH: Điểm chuẩn, quy chế thi, hồ sơ đăng ký
📖 PHƯƠNG PHÁP HỌC: Cách học hiệu quả, quản lý thời gian
💪 TÂM LÝ HỌC TẬP: Động viên, giải tỏa stress

Về câu hỏi của bạn, mình không có chuyên môn để tư vấn chính xác. Bạn nên tìm hiểu thêm từ các nguồn khác nhé! 😊

Còn về 3 lĩnh vực trên, mình luôn sẵn sàng giúp bạn! 🌟`,
          aiUsed: 'Router (Rejected)',
          callTimeMs: 0,
          searchMode: false
        };
      } else {
        // Step 2: Get PDF if needed
        let pdfContext = null;
        if (category === 'TUYEN_SINH') {
          console.log("\n📄 Getting PDF content...");
          pdfContext = await getCachedPDFContent();
        }

        // Step 3: Hybrid AI call
        console.log(`\n🎯 Category: ${category}`);
        result = await callWithHybridFallback(category, message, pdfContext);
        
        // Log cost
        const tokenEstimate = message.length + result.reply.length + 
          (pdfContext ? pdfContext.length : 0);
        logCostEstimate(result.aiUsed, tokenEstimate, result.searchMode);
      }

      const totalTime = Date.now() - startTime;

      console.log(`\n✅ AI Used: ${result.aiUsed}`);
      console.log(`🔍 Search Mode: ${result.searchMode ? 'YES (Perplexity)' : 'NO (Gemini Pro)'}`);
      console.log(`⏱️  Total: ${totalTime}ms`);
      console.log(`📤 Preview: ${result.reply.substring(0, 150)}...`);
      console.log('='.repeat(70) + '\n');

      res.json({ 
        reply: result.reply,
        metadata: {
          aiUsed: result.aiUsed,
          category,
          version: VERSION,
          processingTimeMs: totalTime,
          aiCallTimeMs: result.callTimeMs,
          pdfCached: category === 'TUYEN_SINH' && pdfCache.data !== null,
          searchMode: result.searchMode || false,
          hybrid: true,
          timestamp: new Date().toISOString()
        }
      });

    } catch (err) {
      console.error("❌ ERROR:", err);
      res.status(500).json({ 
        error: "Loi server. Vui long thu lai.",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });

// ===============================================================
// Upload PDF
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
      metadata: { 
        contentType: 'application/pdf',
        metadata: {
          uploadedAt: new Date().toISOString()
        }
      }
    });

    pdfCache.data = null;
    pdfCache.timestamp = null;
    console.log(`✓ Uploaded: ${fileName}`);

    res.json({ 
      success: true, 
      message: `Da upload ${fileName} thanh cong`,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===============================================================
// List Documents
// ===============================================================
exports.listDocuments = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  
  try {
    const bucket = admin.storage().bucket();
    const [files] = await bucket.getFiles({ prefix: 'documents/' });
    
    const pdfFiles = files
      .filter(file => file.name.toLowerCase().endsWith('.pdf'))
      .map(file => ({
        name: file.name.split('/').pop(),
        path: file.name,
        size: file.metadata.size,
        updated: file.metadata.updated
      }));
    
    res.json({
      total: pdfFiles.length,
      files: pdfFiles
    });
    
  } catch (err) {
    console.error("❌ ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===============================================================
// Debug PDF Content
// ===============================================================
exports.debugPDFContent = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  
  try {
    const pdfContents = await getAllPDFsFromStorage();
    
    const debug = pdfContents.map(pdf => ({
      fileName: pdf.fileName,
      displayName: pdf.displayName,
      numPages: pdf.numPages,
      contentPreview: pdf.content.substring(0, 500) + '...',
      contentLength: pdf.content.length
    }));
    
    res.json({
      totalDocuments: pdfContents.length,
      documents: debug
    });
    
  } catch (err) {
    console.error("❌ ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===============================================================
// Clear Cache
// ===============================================================
exports.clearCache = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  
  pdfCache.data = null;
  pdfCache.timestamp = null;
  
  res.json({ 
    success: true,
    message: "Cache cleared",
    timestamp: new Date().toISOString()
  });
});

// ===============================================================
// Version Check
// ===============================================================
exports.version = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.json({ 
    version: VERSION,
    architecture: 'Perplexity Integration',
    strategy: {
      description: 'Smart routing based on search needs - Real Google Search via Perplexity',
      standardMode: {
        model: 'Gemini 2.5 Pro (via MegaLLM)',
        cost: 'Paid (~$0.50/1M tokens)',
        features: ['Best quality', 'PDF native', 'Structured reasoning']
      },
      searchMode: {
        model: 'Perplexity AI (llama-3.1-sonar-large-128k-online)',
        cost: 'Paid (~$1/1K requests)',
        features: ['Real Google Search', 'Real-time info', 'Citations', 'Current events']
      }
    },
    searchDetection: {
      keywords: SEARCH_KEYWORDS.length,
      futureYears: '2026-2099',
      autoSwitch: true,
      sampleKeywords: SEARCH_KEYWORDS.slice(0, 10)
    },
    fallbackChain: [
      'Gemini 2.5 Pro / Perplexity (auto-select based on need)',
      'GPT-4o-2024-11-20',
      'GPT-4o-mini'
    ],
    providers: {
      geminiPro: {
        name: 'Gemini 2.5 Pro',
        via: 'MegaLLM API',
        cost: 'Paid',
        useCase: 'Standard queries, PDF analysis'
      },
      perplexity: {
        name: 'Perplexity AI (Sonar Large)',
        via: 'Direct Perplexity API',
        cost: 'Paid ($1/1K requests)',
        useCase: 'Real-time search, admission scores, current info',
        capabilities: ['Google Search', 'Citations', 'Up-to-date info']
      },
      gptFallback: {
        models: ['GPT-4o', 'GPT-4o-mini'],
        via: 'MegaLLM API'
      }
    },
    features: [
      'Hybrid AI routing (quality vs search)',
      'Real-time Google Search via Perplexity',
      'Auto-detect search needs (điểm chuẩn, admission scores)',
      'PDF Caching (1 hour)',
      '4-tier fallback chain',
      'Source citations from Perplexity'
    ],
    cacheStatus: {
      active: pdfCache.data !== null,
      timestamp: pdfCache.timestamp,
      expiresIn: pdfCache.timestamp ? 
        Math.max(0, pdfCache.expiryMs - (Date.now() - pdfCache.timestamp)) : 0
    },
    configuration: {
      perplexityKey: !!(process.env.PERPLEXITY_API_KEY || (functions.config().perplexity && functions.config().perplexity.key)),
      megallmKey: !!(process.env.MEGALLM_API_KEY || (functions.config().megallm && functions.config().megallm.key))
    },
    timestamp: new Date().toISOString(),
    status: "running"
  });
});

// ===============================================================
// 🧪 DEBUG SEARCH DETECTION
// ===============================================================
exports.debugSearch = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  
  const question = req.query.q || "điểm chuẩn bách khoa hcm";
  const lowerQuestion = question.toLowerCase();
  
  const matches = [];
  for (const keyword of SEARCH_KEYWORDS) {
    const lowerKeyword = keyword.toLowerCase();
    const found = lowerQuestion.includes(lowerKeyword);
    if (found) {
      matches.push({
        keyword: keyword,
        normalized: lowerKeyword,
        position: lowerQuestion.indexOf(lowerKeyword)
      });
    }
  }
  
  const needsSearch = needsRealTimeSearch(question);
  
  res.json({
    test: "Debug Search Detection",
    question: question,
    normalized: lowerQuestion,
    needsSearch: needsSearch,
    willUse: needsSearch ? 'Perplexity (Google Search)' : 'Gemini 2.5 Pro',
    totalKeywords: SEARCH_KEYWORDS.length,
    matchedKeywords: matches,
    matchCount: matches.length,
    debugChecks: {
      hasDiem: lowerQuestion.includes('điểm'),
      hasDiemNoAccent: lowerQuestion.includes('diem'),
      hasBachKhoa: lowerQuestion.includes('bách khoa'),
      hasBachKhoaNoAccent: lowerQuestion.includes('bach khoa'),
      hasDiemChuan: lowerQuestion.includes('điểm chuẩn'),
      hasDiemChuanNoAccent: lowerQuestion.includes('diem chuan')
    },
    firstTenKeywords: SEARCH_KEYWORDS.slice(0, 10),
    lastTenKeywords: SEARCH_KEYWORDS.slice(-10)
  });
});
