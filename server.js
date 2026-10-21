// =========================================
// Номын Ертөнц - хялбар backend сервер
// Ажиллуулах:  node server.js   →   http://localhost:3000
// Зөвхөн Node.js-ийн суурийн модулийг ашиглана (npm install шаардлагагүй).
//
// Үүрэг:
//   1) Статик файлуудыг (index.html, style.css, script.js) сервэрлэх
//   2) "Холбоо барих" формын зурвасыг data/messages.json файлд хадгалах
//   3) Админы зурвасын API-г токеноор хамгаалах
//
// Анхаар: Админы нууц үг ЗӨВХӨН энэ сервер талын файлд байна,
// frontend (script.js) кодод API түлхүүр, нууц үг хатуу бичигдээгүй.
// =========================================

const http = require("http");
const fs = require("fs");
const path = require("path");
const https = require("https");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const MSG_FILE = path.join(DATA_DIR, "messages.json");
const PAY_FILE = path.join(DATA_DIR, "payments.json");

// --- Админы нэвтрэх мэдээлэл (зөвхөн сервер талд) ---
// Үйлдвэрлэлийн орчинд заавал орчны хувьсагчаар (process.env) дамжуулах ёстой.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@nomiin-delguur.mn";
const ADMIN_PASS = process.env.ADMIN_PASS || "Admin1234";

// --- QPay мерчант тохиргоо (үйлдвэрлэлд ЗААВАЛ орчны хувьсагчаар) ---
// QP_CODE / QP_SECRET / QP_INVOICE_CODE тохируулагдаагүй үед QR үүсгэх
// боломжгүй. Бодит QPay merchant API интеграц:
//   1) POST /v2/auth/token           (Basic auth) → access_token
//   2) POST /v2/invoice              (Bearer)     → invoice_id, qr_code, qr_image_url
//   3) GET  /v2/invoice/{id}/payment (Bearer)     → төлөв шалгах (polling)
//   4) callback_url руу webhook: POST /api/tolov/<ref>/qpay-callback
// QR код нь зөвхөн QPay-ээс ирсэн бодит инвойсын (qr_code / qr_image_url)
// мэдээлэл дээр дүрсэлнэ. Хуурамч QR хэзээ ч үүсгэхгүй.
const QP_CODE = process.env.QP_CODE || "";
const QP_SECRET = process.env.QP_SECRET || "";
const QP_INVOICE_CODE = process.env.QP_INVOICE_CODE || "";
const QPAY_BASE = String(process.env.QPAY_BASE_URL || "https://merchant.qpay.mn");
// callback_url-ийн суурь (https://домайн гэх мэт нийтийн хаяг).
// Тохируулаагүй бол хүсэлтийн Host толгойгоос үүсгэнэ.
const QPAY_CALLBACK_BASE = String(process.env.QP_CALLBACK_BASE || "");
const qpayТохируулагдсан = () => !!(QP_CODE && QP_SECRET && QP_INVOICE_CODE);

let QPAY_HOST = "merchant.qpay.mn", QPAY_PORT = 443, QPAY_УГТАР = "";
try {
  const u = new URL(QPAY_BASE);
  if (u && u.hostname) { QPAY_HOST = u.hostname; QPAY_PORT = u.port ? Number(u.port) : 443; QPAY_УГТАР = String(u.pathname || "").replace(/\/+$/, ""); }
} catch (e) { QPAY_HOST = "merchant.qpay.mn"; }

// --- Хялбар https хүсэлт (зөвхөн Node суурийн модуль; npm шаардлагагүй) ---
function qpayХүсэлт(метод, уутар, толгой, бие) {
  return new Promise(шийд => {
    let шийдсэн = false;
    const дуусгах = хариу => { if (!шийдсэн) { шийдсэн = true; шийд(хариу || null); } };
    try {
      const хүсэлт = https.request({
        hostname: QPAY_HOST, port: QPAY_PORT,
        path: QPAY_УГТАР + уутар, method: метод,
        headers: Object.assign({ "Content-Type": "application/json", Accept: "application/json" }, толгой || {})
      }, хариу => {
        let өг = "";
        хариу.setEncoding("utf8");
        хариу.on("data", х => { өг += х; if (өг.length > 512000) { try { хүсэлт.destroy(); } catch (e) {} } });
        хариу.on("end", () => { let д = null; try { д = JSON.parse(өг || "null"); } catch (e) {} дуусгах({ статус: хариу.statusCode, бие: д }); });
      });
      хүсэлт.setTimeout(8000, () => { try { хүсэлт.destroy(); } catch (e) {} });
      хүсэлт.on("error", () => дуусгах(null));
      if (бие) хүсэлт.write(бие);
      хүсэлт.end();
    } catch (e) { дуусгах(null); }
  });
}

let qpayТокенУтга = "", qpayТокенДуустах = 0;
async function qpayТокенАвах() {
  if (qpayТокенУтга && Date.now() < qpayТокенДуустах) return qpayТокенУтга;
  const basic = Buffer.from(QP_CODE + ":" + QP_SECRET).toString("base64");
  const х = await qpayХүсэлт("POST", "/v2/auth/token", { Authorization: "Basic " + basic }, "");
  const д = х && х.бие;
  const токен = д && (д.access_token || д.token);
  if (!токен) { qpayТокенУтга = ""; qpayТокенДуустах = 0; return null; }
  qpayТокенУтга = String(токен);
  // access_token-ий хугацаа (expires_in, сек) — эцсээс 30 сек өмнө шинэчилнэ
  qpayТокенДуустах = Date.now() + Math.max(60000, Number(д.expires_in || 120) * 1000 - 30000);
  return qpayТокенУтга;
}

// Бодит QPay инвойс үүсгэх. Амжилтгүй → { алдаа }, амжилттай →
// { invoiceId, invoiceNumber, qrТекст, qrЗурагUrl, шуудUrl }
async function qpayИнвойсҮүсгэх(бичилт, req) {
  const токен = await qpayТокенАвах();
  if (!токен) return { алдаа: "QPay токен авахад алдаа гарлаа (QP_CODE, QP_SECRET, QPAY_BASE_URL-ийг шалгана уу)." };
  const байаз = (QPAY_CALLBACK_BASE || (req && req.headers && req.headers.host ? "http://" + String(req.headers.host) : "http://localhost:" + PORT)).replace(/\/+$/, "");
  const бие = JSON.stringify({
    invoice_code: QP_INVOICE_CODE,
    sender_invoice_no: бичилт.ref,
    invoice_receiver_code: QP_INVOICE_CODE,
    invoice_description: String("Номын Ертөнц захиалга " + бичилт.ref).slice(0, 90),
    amount: Math.round(Number(бичилт.дүн)),
    callback_url: байаз + "/api/tolov/" + encodeURIComponent(бичилт.ref) + "/qpay-callback"
  });
  const х = await qpayХүсэлт("POST", "/v2/invoice", { Authorization: "Bearer " + токен }, бие);
  if (!х) return { алдаа: "QPay серверт холбогдож чадсангүй." };
  const д = х && х.бие;
  if (!д || х.статус >= 300 || д.error || д.errno || д.fault) {
    return { алдаа: (д && (д.desc || д.message || д.fault)) || ("HTTP " + String(х.статус) + " — QPay инвойсийн хариу буруу байна.") };
  }
  return {
    invoiceId: String(д.invoice_id || ""),
    invoiceNumber: String(д.invoice_number || ""),
    qrТекст: String(д.qr_code || ""),
    qrЗурагUrl: String(д.qr_image_url || ""),
    шуудUrl: String(д["qPay_shortUrl"] || (д.urls && д.urls[0] && д.urls[0].link) || "")
  };
}

// QPay invoice төлбөр шалгах (polling). Зөвхөн PAID төлөвт, дүн таарах тохиолдолд
// төлөгдсөн гэж тооцно (хоног/дутуу төлөлт болон UNPAID, VOID-ийг л галдана).
async function qpayТөлөвШалгаПровайдер(бичилт) {
  try {
    if (!бичилт.qpay || !бичилт.qpay.invoiceId) return { төлөгдсөн: false, алдаа: "QPay инвойс үүсгээгүй байна." };
    const токен = await qpayТокенАвах();
    if (!токен) return { төлөгдсөн: false, алдаа: "QPay токен авахад алдаа гарлаа." };
    const х = await qpayХүсэлт("GET", "/v2/invoice/" + encodeURIComponent(бичилт.qpay.invoiceId) + "/payment", { Authorization: "Bearer " + токен }, null);
    const д = х && х.бие;
    if (!д) return { төлөгдсөн: false, алдаа: "QPay серверт холбогдож чадсангүй." };
    if (х.статус >= 300) return { төлөгдсөн: false, алдаа: (д && (д.desc || д.message)) || ("HTTP " + String(х.статус)) };
    const жагс = Array.isArray(д) ? д : (Array.isArray(д.paginatedPaymentList) ? д.paginatedPaymentList : []);
    const төлөгдсөн = жагс.some(п => п && (п.payment_status === "PAID" || п.status === "PAID") && (п.amount == null || Number(п.amount) + 0.5 >= Number(бичилт.дүн)));
    return { төлөгдсөн: төлөгдсөн, алдаа: "" };
  } catch (e) {
    return { төлөгдсөн: false, алдаа: "QPay төлөв шалгахад алдаа гарлаа." };
  }
}

// --- Санах ойн токенууд (demo; сервер дахин ачаалагдахад хүчингүй болно) ---
const tokens = new Map(); // token -> { created }
const TOKEN_TTL = 1000 * 60 * 60 * 12; // 12 цаг

// ---------- Туслах функцууд ----------
function зурвасУнших() {
  try {
    const ж = JSON.parse(fs.readFileSync(MSG_FILE, "utf8"));
    return Array.isArray(ж) ? ж : [];
  } catch (e) { return []; }
}
function зурвасХадгалах(жагсаалт) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(MSG_FILE, JSON.stringify(жагсаалт, null, 2), "utf8");
    return true;
  } catch (e) { return false; }
}
function jsonИлгээх(res, код, объект) {
  const бие = JSON.stringify(объект);
  res.writeHead(код, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS"
  });
  res.end(бие);
}
function биеУнших(req) {
  return new Promise(шийд => {
    let өг = "";
    req.on("data", хэсэг => { өг += хэсэг; if (өг.length > 1e6) req.destroy(); });
    req.on("end", () => { try { шийд(JSON.parse(өг || "{}")); } catch (e) { шийд({}); } });
  });
}
function имэйлЗөв(м) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(м || "").trim()); }
function төлбөрУнших() {
  try {
    const ж = JSON.parse(fs.readFileSync(PAY_FILE, "utf8"));
    return Array.isArray(ж) ? ж : [];
  } catch (e) { return []; }
}
function төлбөрХадгалах(жагсаалт) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(PAY_FILE, JSON.stringify(жагсаалт, null, 2), "utf8");
    return true;
  } catch (e) { return false; }
}
function вебхукТөлбөрБаталгаажсан(бие) {
  try {
    const жагс = Array.isArray(бие) ? бие : (Array.isArray((бие || {}).paginatedPaymentList) ? бие.paginatedPaymentList : [бие]);
    return жагс.some(п => п && (п.payment_status === "PAID" || п.status === "PAID"));
  } catch (e) { return false; }
}
function токенЗөв(req) {
  const толгой = req.headers.authorization || "";
  const токен = толгой.replace(/^Bearer\s+/i, "");
  const бичилт = tokens.get(токен);
  if (!бичилт) return false;
  if (Date.now() - бичилт.created > TOKEN_TTL) { tokens.delete(токен); return false; }
  return true;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml", ".ico": "image/x-icon", ".webp": "image/webp",
  ".woff": "font/woff", ".woff2": "font/woff2"
};

// ---------- Сервер ----------
const server = http.createServer(async (req, res) => {
  let зам;
  try { зам = decodeURIComponent(new URL(req.url, "http://localhost").pathname); }
  catch (e) { return jsonИлгээх(res, 400, { ok: false, алдаа: "Буруу хүсэлт." }); }

  if (req.method === "OPTIONS") return jsonИлгээх(res, 200, { ok: true });

  // --- API: Холбоо барих форм (нийтийн, нэвтрэлт шаардлагагүй) ---
  if (зам === "/api/holboo" && req.method === "POST") {
    const бие = await биеУнших(req);
    const нэр = String(бие.нэр || "").trim();
    const мэйл = String(бие.мэйл || "").trim();
    const зурвас = String(бие.зурвас || "").trim();
    if (!нэр || !мэйл || !зурвас) return jsonИлгээх(res, 400, { ok: false, алдаа: "Бүх талбарыг бөглөнө үү." });
    if (!имэйлЗөв(мэйл)) return jsonИлгээх(res, 400, { ok: false, алдаа: "Зөв и-мэйл хаяг оруулна уу." });
    const жагсаалт = зурвасУнших();
    жагсаалт.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      нэр: нэр, мэйл: мэйл, зурвас: зурвас,
      огноо: new Date().toISOString()
    });
    if (!зурвасХадгалах(жагсаалт)) return jsonИлгээх(res, 500, { ok: false, алдаа: "Серверт хадгалахад алдаа гарлаа." });
    return jsonИлгээх(res, 201, { ok: true });
  }

  // --- API: Админ нэвтрэх → токен авах ---
  if (зам === "/api/admin/nevtreh" && req.method === "POST") {
    const бие = await биеУнших(req);
    if (String(бие.мэйл || "").trim() === ADMIN_EMAIL && String(бие.нууц || "") === ADMIN_PASS) {
      const токен = Math.random().toString(36).slice(2) + Date.now().toString(36);
      tokens.set(токен, { created: Date.now() });
      return jsonИлгээх(res, 200, { ok: true, token: токен });
    }
    return jsonИлгээх(res, 401, { ok: false, алдаа: "Нэвтрэх мэдээлэл буруу байна." });
  }

  // --- API: Зурвасын жагсаалт (зөвхөн админ токентой) ---
  if (зам === "/api/zurvas" && req.method === "GET") {
    if (!токенЗөв(req)) return jsonИлгээх(res, 401, { ok: false, алдаа: "Зөвхөн эрх бүхий админ үзэх боломжтой." });
    const жагсаалт = зурвасУнших().slice().sort((a, b) => new Date(b.огноо) - new Date(a.огноо));
    return jsonИлгээх(res, 200, { ok: true, зурвасууд: жагсаалт });
  }

  // --- API: Бүх зурвас устгах (зөвхөн админ) ---
  if (зам === "/api/zurvas" && req.method === "DELETE") {
    if (!токенЗөв(req)) return jsonИлгээх(res, 401, { ok: false, алдаа: "Зөвхөн эрх бүхий админ." });
    зурвасХадгалах([]);
    return jsonИлгээх(res, 200, { ok: true });
  }

  // --- API: Нэг зурвас устгах (зөвхөн админ) ---
  const устгахТаарах = зам.match(/^\/api\/zurvas\/([A-Za-z0-9]+)$/);
  if (устгахТаарах && req.method === "DELETE") {
    if (!токенЗөв(req)) return jsonИлгээх(res, 401, { ok: false, алдаа: "Зөвхөн эрх бүхий админ." });
    const жагсаалт = зурвасУнших();
    зурвасХадгалах(жагсаалт.filter(м => м.id !== устгахТаарах[1]));
    return jsonИлгээх(res, 200, { ok: true });
  }

  // --- API: Төлбөрийн хүсэлт үүсгэх (карт / QPay; idempotent) ---
  // Сервер нийт дүнг бүтцийн хувьд шалгана (эерэг тоо, номын мөр бүрийн
  // үнэ/тоо хүчинтэй эсэх). Каталогийн үнэ сервер талд байхгүй тул бүрэн
  // үнэ-итгэлцэл (price-trust) шалгалт хийхэд номын санхүүгийн сантай
  // синк хийх шаардлагатай — "Үлдсэн ажил" хэсгээс харна уу.
  if (зам === "/api/tolov/intent" && req.method === "POST") {
    const бие = await биеУнших(req);
    const имэйл = String(бие.мэйл || бие.email || "").trim();
    const арга = String(бие.арга || "").trim();
    const дүн = Number(бие.дүн);
    const мөрүүд = Array.isArray(бие.номнууд) ? бие.номнууд : [];
    const idemKey = String(бие.idemKey || "").trim().slice(0, 80);
    const ЗӨВШӨӨРӨГДСӨН = ["Банкны картаар төлөх", "QPay-ээр төлөх"];
    if (имэйл && !имэйлЗөв(имэйл)) return jsonИлгээх(res, 400, { ok: false, алдаа: "Зөв и-мэйл хаяг оруулна уу." });
    if (!ЗӨВШӨӨРӨГДСӨН.includes(арга)) return jsonИлгээх(res, 400, { ok: false, алдаа: "Төлбөрийн хэлбэр зөвшөөрөгдөөгүй." });
    if (!мөрүүд.length) return jsonИлгээх(res, 400, { ok: false, алдаа: "Худалдан авах ном хоосон байна." });
    for (const м of мөрүүд) {
      if (!м || !isFinite(Number(м.price)) || Number(м.price) < 0 || !Number.isInteger(Number(м.тоо)) || Number(м.тоо) < 1)
        return jsonИлгээх(res, 400, { ok: false, алдаа: "Номын үнэ/тоо буруу байна." });
    }
    if (!isFinite(дүн) || дүн <= 0) return jsonИлгээх(res, 400, { ok: false, алдаа: "Нийт дүн буруу байна." });
    const хадгалагдсан = төлбөрУнших();
    if (idemKey) {
      const хуучин = хадгалагдсан.find(т => т.idemKey === idemKey);
      if (хуучин) return jsonИлгээх(res, 200, { ok: true, давхардсан: true, ref: хуучин.ref, төлөв: хуучин.төлөв });
    }
    const ref = "ТЛ-" + Date.now().toString(36).toUpperCase() + Math.floor(100 + Math.random() * 900);
    const бичилт = {
      ref: ref, idemKey: idemKey || null,
      имэйл: имэйл || "", арга: арга,
      дүн: Math.round(дүн),
      номынТоо: мөрүүд.reduce((с, м) => с + Number(м.тоо), 0),
      төлөв: "хүлээгдэж буй", провайдер: "холбогдоогүй",
      qpayТохируулагдсан: qpayТохируулагдсан(),
      үүсгэсэн: new Date().toISOString(), шинэчилсэн: new Date().toISOString()
    };
    хадгалагдсан.push(бичилт);
    if (!төлбөрХадгалах(хадгалагдсан)) return jsonИлгээх(res, 500, { ok: false, алдаа: "Серверт хадгалахад алдаа гарлаа." });
    // --- QPay: бодит инвойс үүсгэх (QR зөвхөн QPay-ээс ирсэн бодит мэдээлэлд суурилна) ---
    let qpayQR = null, qpayИнвойсАлдаа = "", qpayЗаавар = "";
    if (арга === "QPay-ээр төлөх") {
      if (qpayТохируулагдсан()) {
        const инв = await qpayИнвойсҮүсгэх(бичилт, req);
        if (инв && инв.invoiceId) {
          бичилт.провайдер = "qpay";
          бичилт.qpay = Object.assign({}, инв);
          бичилт.шинэчилсэн = new Date().toISOString();
          төлбөрХадгалах(хадгалагдсан);
          qpayQR = { тохируулагдсан: true, invoiceId: инв.invoiceId, invoiceNumber: инв.invoiceNumber, qrТекст: инв.qrТекст, qrЗурагUrl: инв.qrЗурагUrl, шуудUrl: инв.шуудUrl };
        } else {
          qpayИнвойсАлдаа = (инв && инв.алдаа) || "QPay инвойс үүсгэхэд алдаа гарлаа.";
          qpayQR = { тохируулагдсан: true, алдаа: qpayИнвойсАлдаа };
        }
      } else {
        qpayЗаавар = "QPay тохиргоо дутуу: сервер дээр QP_CODE, QP_SECRET, QP_INVOICE_CODE орчны хувьсагчийг тохируулна уу.";
        qpayQR = { тохируулагдсан: false, заавар: qpayЗаавар };
      }
    }
    return jsonИлгээх(res, 201, { ok: true, ref: ref, төлөв: бичилт.төлөв, qpayТохируулагдсан: бичилт.qpayТохируулагдсан, qpay: qpayQR, qpayАлдаа: qpayИнвойсАлдаа, заавар: qpayЗаавар });
  }

  // --- API: Төлбөрийн төлөв шалгах (backend-ээр баталгаажсан төлөв) ---
  if (зам.indexOf("/api/tolov/") === 0 && req.method === "GET" && зам !== "/api/tolov/intent") {
    const ref = decodeURIComponent(зам.slice("/api/tolov/".length)).split("/")[0];
    const олсон = төлбөрУнших().find(т => т.ref === ref);
    if (!олсон) return jsonИлгээх(res, 404, { ok: false, алдаа: "Төлбөр олдсонгүй." });
    return jsonИлгээх(res, 200, {
      ok: true,
      төлбөр: { ref: олсон.ref, арга: олсон.арга, дүн: олсон.дүн, төлөв: олсон.төлөв, qpayТохируулагдсан: qpayТохируулагдсан() }
    });
  }

  // --- API: QPay дахин шалгах (провайдер холбогдоогүй бол pending хэвээр) ---
  if (зам.indexOf("/api/tolov/") === 0 && зам.endsWith("/qpay-shinechleh") && req.method === "POST") {
    const ref = decodeURIComponent(зам.slice("/api/tolov/".length).replace(/\/qpay-shinechleh$/, ""));
    const хадгалагдсан = төлбөрУнших();
    const олсон = хадгалагдсан.find(т => т.ref === ref);
    if (!олсон) return jsonИлгээх(res, 404, { ok: false, алдаа: "Төлбөр олдсонгүй." });
    if (олсон.арга !== "QPay-ээр төлөх") return jsonИлгээх(res, 400, { ok: false, алдаа: "Энэ төлбөр QPay биш байна." });
    // Мерчант холбогдсон бол invoice төлбөрийн статус бодитоор шалгана
    let заавар = "";
    if (qpayТохируулагдсан()) {
      const шал = await qpayТөлөвШалгаПровайдер(олсон);
      if (шал.төлөгдсөн && олсон.төлөв !== "төлөгдсөн") {
        олсон.төлөв = "төлөгдсөн";
        олсон.шинэчилсэн = new Date().toISOString();
        төлбөрХадгалах(хадгалагдсан);
      } else if (шал.алдаа) заавар = шал.алдаа;
    } else {
      заавар = "QP_CODE, QP_SECRET, QP_INVOICE_CODE орчны хувьсагчдыг тохируулна уу.";
    }
    return jsonИлгээх(res, 200, {
      ok: true, төлөв: олсон.төлөв,
      qpayТохируулагдсан: qpayТохируулагдсан(),
      заавар: заавар
    });
  }

  // --- API: QPay QR мэдээлэл (бодит инвойсоос; давхар үүсгэхгүй, дахин ашиглана) ---
  const qpayQRТаарах = зам.match(/^\/api\/tolov\/([^\/]+)\/qpay$/);
  if (qpayQRТаарах && req.method === "POST") {
    const ref = decodeURIComponent(qpayQRТаарах[1]);
    const хадгалагдсан = төлбөрУнших();
    const олсон = хадгалагдсан.find(т => т.ref === ref);
    if (!олсон) return jsonИлгээх(res, 404, { ok: false, алдаа: "Төлбөр олдсонгүй." });
    if (олсон.арга !== "QPay-ээр төлөх") return jsonИлгээх(res, 400, { ok: false, алдаа: "Энэ төлбөр QPay биш байна." });
    const төлбөрИнфо = { ref: олсон.ref, арга: олсон.арга, дүн: олсон.дүн, төлөв: олсон.төлөв };
    if (!qpayТохируулагдсан()) {
      return jsonИлгээх(res, 200, {
        ok: true, төлбөр: төлбөрИнфо,
        qpay: { тохируулагдсан: false, заавар: "QPay тохиргоо дутуу: сервер дээр QP_CODE, QP_SECRET, QP_INVOICE_CODE орчны хувьсагчийг тохируулна уу." }
      });
    }
    // Инвойс байвал түүний QR-ийг дахин ашиглана (нэхэмжлэл давхар үүсэхгүй);
    // байхгүй бол энэ төлбөрийн хувьд бодит инвойс үүсгэнэ.
    if (!олсон.qpay || !олсон.qpay.invoiceId) {
      const инв = await qpayИнвойсҮүсгэх(олсон, req);
      if (инв && инв.invoiceId) {
        олсон.провайдер = "qpay";
        олсон.qpay = Object.assign({}, инв);
        олсон.шинэчилсэн = new Date().toISOString();
        төлбөрХадгалах(хадгалагдсан);
      } else {
        return jsonИлгээх(res, 200, {
          ok: true, төлбөр: төлбөрИнфо,
          qpay: { тохируулагдсан: true, алдаа: (инв && инв.алдаа) || "QPay инвойс үүсгэхэд алдаа гарлаа." }
        });
      }
    }
    const q = олсон.qpay;
    return jsonИлгээх(res, 200, {
      ok: true, төлбөр: төлбөрИнфо,
      qpay: { тохируулагдсан: true, invoiceId: q.invoiceId || "", invoiceNumber: q.invoiceNumber || "", qrТекст: q.qrТекст || "", qrЗурагUrl: q.qrЗурагUrl || "", шуудUrl: q.шуудUrl || "" }
    });
  }

  // --- API: QPay callback (webhook). QPay төлбөрийн мэдээллийг callback_url руу POST хийнэ.
  const qpayCallbackТаарах = зам.match(/^\/api\/tolov\/([^\/]+)\/qpay-callback$/);
  if (qpayCallbackТаарах && req.method === "POST") {
    const ref = decodeURIComponent(qpayCallbackТаарах[1]);
    const бие = await биеУнших(req);
    const хадгалагдсан = төлбөрУнших();
    const олсон = хадгалагдсан.find(т => т.ref === ref);
    if (!олсон) return jsonИлгээх(res, 404, { ok: false, алдаа: "Төлбөр олдсонгүй." });
    if (вебхукТөлбөрБаталгаажсан(бие) && олсон.төлөв !== "төлөгдсөн") {
      олсон.төлөв = "төлөгдсөн";
      олсон.шинэчилсэн = new Date().toISOString();
      олсон.qpay = олсон.qpay || {};
      олсон.qpay.төлбөрийнХариу = JSON.stringify(бие).slice(0, 2000);
      төлбөрХадгалах(хадгалагдсан);
    }
    return jsonИлгээх(res, 200, { ok: true, төлөв: олсон.төлөв });
  }

  if (зам.indexOf("/api/") === 0) return jsonИлгээх(res, 404, { ok: false, алдаа: "API олдсонгүй." });

  // --- Статик файлууд ---
  const файлЗам = path.normalize(path.join(ROOT, зам === "/" ? "index.html" : зам));
  if (файлЗам.indexOf(ROOT) !== 0) { res.writeHead(403); return res.end("Хориотой"); }
  fs.readFile(файлЗам, (алдаа, өгөгдөл) => {
    if (алдаа) { res.writeHead(404); return res.end("Олдсонгүй"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(файлЗам).toLowerCase()] || "application/octet-stream" });
    res.end(өгөгдөл);
  });
});

server.listen(PORT, () => {
  console.log("Номын Ертөнц сервер ажиллаж байна: http://localhost:" + PORT);
  console.log("Холбоо барих зурвасууд: " + MSG_FILE);
});
