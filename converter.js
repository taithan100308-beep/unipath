    const data = {
      toan: [
        {a:132, b:150, c:8.5, d:10}, {a:128.5, b:132, c:8.1, d:8.5}, {a:122.5, b:128.5, c:7.75, d:8.1},
        {a:114.5, b:122.5, c:7.0, d:7.75}, {a:108, b:114.5, c:6.6, d:7.0}, {a:102.5, b:108, c:6.2, d:6.6},
        {a:97, b:102.5, c:5.9, d:6.2}, {a:91, b:97, c:5.6, d:5.9}, {a:85, b:91, c:5.2, d:5.6},
        {a:77, b:85, c:4.9, d:5.2}, {a:68, b:77, c:4.5, d:4.9}, {a:6, b:68, c:1.5, d:4.5}
      ],
      ngu_van: [
        {a:129.5, b:146, c:9.5, d:9.75}, {a:127.5, b:129.5, c:9.25, d:9.5}, {a:124, b:127.5, c:9, d:9.25},
        {a:119.5, b:124, c:8.75, d:9}, {a:115.5, b:119.5, c:8.5, d:8.75}, {a:112.5, b:115.5, c:8.25, d:8.5},
        {a:109, b:112.5, c:8, d:8.25}, {a:106, b:109, c:7.75, d:8}, {a:102, b:106, c:7.5, d:7.75},
        {a:97, b:102, c:7.25, d:7.5}, {a:90, b:97, c:6.75, d:7.25}, {a:5, b:90, c:3.5, d:6.75}
      ],
      vat_li: [
        {a:123, b:147, c:9.5, d:10}, {a:118.5, b:123, c:9.25, d:9.5}, {a:112.5, b:118.5, c:9, d:9.25},
        {a:105, b:112.5, c:8.5, d:9}, {a:99.5, b:105, c:8, d:8.5}, {a:94.5, b:99.5, c:7.75, d:8},
        {a:90, b:94.5, c:7.5, d:7.75}, {a:85, b:90, c:7.25, d:7.5}, {a:80, b:85, c:6.75, d:7.25},
        {a:74, b:80, c:6.35, d:6.75}, {a:66.5, b:74, c:5.75, d:6.35}, {a:17, b:66.5, c:3.05, d:5.75}
      ],
      hoa_hoc: [
        {a:129, b:150, c:9.5, d:10}, {a:124.5, b:129, c:9, d:9.5}, {a:117, b:124.5, c:8.5, d:9},
        {a:107.5, b:117, c:8.25, d:8.5}, {a:100.5, b:107.5, c:7.75, d:8.25}, {a:94, b:100.5, c:7.25, d:7.75},
        {a:88, b:94, c:6.75, d:7.25}, {a:81, b:88, c:6.25, d:6.75}, {a:75.5, b:81, c:5.75, d:6.25},
        {a:68.5, b:75.5, c:5.25, d:5.75}, {a:59.5, b:68.5, c:4.6, d:5.25}, {a:20, b:59.5, c:1.35, d:4.6}
      ],
      dia_li: [
        {a:124, b:141, c:9.75, d:10}, {a:120.5, b:124, c:9.5, d:9.75}, {a:115.5, b:120.5, c:9.25, d:9.5},
        {a:108.5, b:115.5, c:9, d:9.25}, {a:103, b:108.5, c:8.75, d:9}, {a:98.5, b:103, c:8.5, d:8.75},
        {a:94, b:98.5, c:8.25, d:8.5}, {a:89.5, b:94, c:8, d:8.25}, {a:84.5, b:89.5, c:7.5, d:8},
        {a:79, b:84.5, c:7.25, d:7.5}, {a:71, b:79, c:6.5, d:7.25}, {a:31, b:71, c:3, d:6.5}
      ],
      lich_su: [
        {a:133.5, b:150, c:9.75, d:10}, {a:131, b:133.5, c:9.5, d:9.75}, {a:126, b:131, c:9.25, d:9.5},
        {a:120.5, b:126, c:9, d:9.25}, {a:115, b:120.5, c:8.5, d:9}, {a:110, b:115, c:8.25, d:8.5},
        {a:105, b:110, c:8, d:8.25}, {a:101, b:105, c:7.75, d:8}, {a:95.5, b:101, c:7.5, d:7.75},
        {a:88.5, b:95.5, c:7, d:7.5}, {a:79.5, b:88.5, c:6.35, d:7}, {a:36.5, b:79.5, c:2.95, d:6.35}
      ],
      tieng_anh: [
        {a:131, b:150, c:7.75, d:9.75}, {a:127.5, b:131, c:7.5, d:7.75}, {a:120.5, b:127.5, c:7, d:7.5},
        {a:112, b:120.5, c:6.5, d:7}, {a:105, b:112, c:6, d:6.5}, {a:98.5, b:105, c:5.75, d:6},
        {a:92, b:98.5, c:5.5, d:5.75}, {a:85.5, b:92, c:5, d:5.5}, {a:78.5, b:85.5, c:4.5, d:5},
        {a:70.5, b:78.5, c:4, d:4.5}, {a:60, b:70.5, c:1.25, d:4}
      ],
      sinh_hoc: [
        {a:130.5, b:150, c:9, d:9.75}, {a:126.5, b:130.5, c:8.75, d:9}, {a:120.5, b:126.5, c:8.34, d:8.75},
        {a:112.5, b:120.5, c:7.85, d:8.34}, {a:105.5, b:112.5, c:7.5, d:7.85}, {a:100, b:105.5, c:7.25, d:7.5},
        {a:94.5, b:100, c:6.85, d:7.25}, {a:88.5, b:94.5, c:6.5, d:6.85}, {a:82.5, b:88.5, c:6, d:6.5},
        {a:76, b:82.5, c:5.5, d:6}, {a:66.5, b:76, c:5.25, d:5.85}, {a:26.5, b:66.5, c:2.8, d:5.25}
      ]
    };

    function convertScore() {
      const subject = document.getElementById("subject").value;
      const x = parseFloat(document.getElementById("vsatScore").value);
      const ranges = data[subject];

      if (isNaN(x) || !ranges) {
        document.getElementById("result").innerHTML = "❌ Vui lòng nhập điểm hợp lệ!";
        return;
      }

      let range = ranges.find(r => x > r.a && x <= r.b);
      if (!range) {
        document.getElementById("result").innerHTML = "⚠️ Điểm ngoài phạm vi quy đổi!";
        return;
      }

      const y = range.c + ((x - range.a) / (range.b - range.a)) * (range.d - range.c);
      document.getElementById("result").innerHTML = `🔹 Điểm THPT tương đương: <b>${y.toFixed(2)}</b>`;
    }

    // 🧮 Hàm nội suy tuyến tính
function interpolate(x, a, b, c, d) {
  return c + ((x - a) / (b - a)) * (d - c);
}

/* ================= V-SAT ================= */
function convertScoreVSAT() {
  const subject = document.getElementById("subject").value;
  const x = parseFloat(document.getElementById("vsatScore").value);
  const ranges = data[subject];

  if (isNaN(x) || !ranges) {
    document.getElementById("resultVSAT").innerHTML = "❌ Vui lòng nhập điểm hợp lệ!";
    return;
  }

  const range = ranges.find((r) => x > r.a && x <= r.b);
  if (!range) {
    document.getElementById("resultVSAT").innerHTML = "⚠️ Điểm ngoài phạm vi quy đổi!";
    return;
  }

  const y = interpolate(x, range.a, range.b, range.c, range.d);
  document.getElementById("resultVSAT").innerHTML = `🔹 Điểm THPT tương đương: <b>${y.toFixed(2)}</b>`;
}

/* ================= ĐGNL (V-ACT) ================= */
const vactData = [
  { a: 958, b: 1122, c: 27.0, d: 30.0 },
  { a: 932, b: 958, c: 26.0, d: 27.0 },
  { a: 886, b: 932, c: 24.5, d: 26.0 },
  { a: 815, b: 886, c: 22.35, d: 24.5 },
  { a: 755, b: 815, c: 20.5, d: 22.35 },
  { a: 701, b: 755, c: 19.0, d: 20.5 },
  { a: 652, b: 701, c: 17.6, d: 19.0 },
  { a: 605, b: 652, c: 16.25, d: 17.6 },
  { a: 560, b: 605, c: 14.8, d: 16.25 },
  { a: 514, b: 560, c: 13.2, d: 14.8 },
  { a: 458, b: 514, c: 11.15, d: 13.2 },
  { a: 0, b: 458, c: 0, d: 11.15 }
];

function convertScoreVACT() {
  const x = parseFloat(document.getElementById("vactScore").value);

  if (isNaN(x)) {
    document.getElementById("resultVACT").innerHTML = "❌ Vui lòng nhập điểm hợp lệ!";
    return;
  }

  const range = vactData.find((r) => x > r.a && x <= r.b);
  if (!range) {
    document.getElementById("resultVACT").innerHTML = "⚠️ Điểm ngoài phạm vi quy đổi!";
    return;
  }

  const y = interpolate(x, range.a, range.b, range.c, range.d);
  document.getElementById("resultVACT").innerHTML = `🔹 Điểm THPT tương đương: <b>${y.toFixed(2)}</b>`;
}