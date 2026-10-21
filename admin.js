// =========================================
// Номын Ертөнц — Админ удирдлагын модуль (admin.js)
// Үндсэн script.js-ээс тусгаарласан админ профайл, захиалга, ном,
// ангилал, зохиолч, түрээс, хүргэлт болон сайтын тохиргооны удирдлага.
// =========================================

// ---------- Админ хуудасны маркап: admin.html → #adminTohirgooRoot саванд ачилна ----------
(function () {
  const сав = document.getElementById("adminTohirgooRoot");
  if (!сав || сав.dataset.ачилсан === "тийм") {
    window.__админМаркапБэлэн = window.__админМаркапБэлэн || Promise.resolve();
    return;
  }
  сав.dataset.ачилсан = "тийм";
  let тх = null;
  try {
    const х = new XMLHttpRequest();
    х.open("GET", "admin.html", false); // синхрон: DOMContentLoaded-оос өмнө бэлэн байх ёстой
    х.send(null);
    if (х.status === 200 || х.status === 304 || х.status === 0) тх = х.responseText;
  } catch (e) { тх = null; }
  if (тх && тх.trim()) {
    сав.innerHTML = тх;
    window.__админМаркапБэлэн = Promise.resolve();
    return;
  }
  // Синхрон олдсонгүй (ж: file://) — асинхрон fetch-ээр оролдох
  window.__админМаркапБэлэн = fetch("admin.html").then(х => {
    if (!х.ok) throw new Error("HTTP " + х.status);
    return х.text();
  }).then(т => {
    сав.innerHTML = т;
    админМаркапТүглэх("админМаркапБэлэн");
  }).catch(() => {
    сав.innerHTML = '<p class="tohirgoo-tailbar">Админ тохиргооны хуудас ачаалагдсангүй. Сайтыг серверээс нээнэ үү: <code>node server.js</code> → <a href="http://localhost:3000">http://localhost:3000</a>.</p>';
    админМаркапТүглэх("админМаркапБэлэн");
  });
}) ();

function хэрэглэгчДэлгэрэнгүйHtml(мэйл) {
  мэйл = String(мэйл || "").trim();
  let бүртгэл = null;
  try {
    const бүх = JSON.parse(localStorage.getItem("hereglegchid") || "[]");
    бүртгэл = (Array.isArray(бүх) ? бүх : []).find(х => х.мэйл === мэйл) || null;
  } catch (e) {
}  let п = {
 нэр: "", утас: "", намтар: "", сонирхол: "", зураг: "", үүсгэсэн: "" };
  try {
    const х = JSON.parse(localStorage.getItem("профайл:" + мэйл.toLowerCase()) || "{}");
    if (х && typeof х === "object") п = Object.assign(п, х);
  } catch (e) {
}  const нэр = п.нэр || (бүртгэл && бүртгэл.ner) || "";
  const огноо = (бүртгэл && бүртгэл.үүссэн) || п.үүссэн || "";
  const огнооТекст = огноо ? new Date(огноо).toLocaleDateString("mn-MN") : "—";
  let захиалгаТоо = 0, нийтДүн = 0, сүүлийн = [];
  try {
    const захиалгууд = захиалгаЖагсаалтАвах().filter(з => з.мэйл === мэйл || з.аккаунтМэйл === мэйл)      .sort((a, b) => new Date(b.огноо) - new Date(a.огноо));
    захиалгаТоо = захиалгууд.length;
    нийтДүн = захиалгууд.reduce((с, з) => с + (Number(з.дүн) || 0), 0);
    сүүлийн = захиалгууд.slice(0, 3);
  } catch (e) {
}  let сэтгэгдлүүд = [];
  try {
    const бүх = сэтгэгдэлБүхАвах();
    const нэрс = [String(нэр).trim().toLowerCase(), мэйл.toLowerCase()].filter(Boolean);
    Object.keys(бүх || {}).forEach(номId => {      (бүх[номId] || []).forEach(с => {        if (нэрс.includes(String((с && с.нэр) || "").trim().toLowerCase())) сэтгэгдлүүд.push({ номId: Number(номId), од: с.од, текст: с.текст });      });    });
  } catch (e) {
}  let зорьсон = [];
  try {
    const ж = JSON.parse(localStorage.getItem("sonirhol:" + мэйл.toLowerCase()) || "[]");
    if (Array.isArray(ж)) зорьсон = ж.map(id => window.НомАвах(Number(id))).filter(Boolean);
  } catch (e) {
}  const эхнийҮсэг = (нэр || "Х").charAt(0).toUpperCase();  const авХтмл = п.зураг ? ('<img src="' + п.зураг + '" alt="">') : htmlЭскейп(эхнийҮсэг);  let html = '<div style="display:flex;justify-content:center;margin-bottom:10px;"><span class="mp-avatar">' + авХтмл + '</span></div>' +    '<div class="mp-info-row"><span class="mp-info-label">Нэр</span><span class="mp-info-value">' + htmlЭскейп(нэр || "—") + '</span></div>' +    '<div class="mp-info-row"><span class="mp-info-label">И-мэйл</span><span class="mp-info-value">' + htmlЭскейп(мэйл) + '</span></div>' +    '<div class="mp-info-row"><span class="mp-info-label">Утас</span><span class="mp-info-value">' + htmlЭскейп(п.утас || "—") + '</span></div>' +    '<div class="mp-info-row"><span class="mp-info-label">Бүртгүүлсэн</span><span class="mp-info-value">' + htmlЭскейп(огнооТекст) + '</span></div>';
  if (п.намтар) html += '<div class="mp-info-row"><span class="mp-info-label">Намтар</span><span class="mp-info-value">' + htmlЭскейп(п.намтар) + '</span></div>';
  if (п.сонирхол) html += '<div class="mp-info-row"><span class="mp-info-label">Сонирхол</span><span class="mp-info-value">' + htmlЭскейп(п.сонирхол) + '</span></div>';
  html += '<div class="mp-info-row"><span class="mp-info-label">Захиалга</span><span class="mp-info-value">' + захиалгаТоо + ' • Нийт ' + мөнгөТооцоо(нийтДүн) + '</span></div>';
  if (сүүлийн.length) html += '<div class="mp-info-row"><span class="mp-info-label">Сүүлийн захиалга</span><span class="mp-info-value">' + сүүлийн.map(з => htmlЭскейп(з.дугаар || "")).join(", ") + '</span></div>';
  html += '<div class="mp-info-row"><span class="mp-info-label">Сэтгэгдэл</span><span class="mp-info-value">' + сэтгэгдлүүд.length + '</span></div>';
  if (сэтгэгдлүүд.length) html += сэтгэгдлүүд.slice(0, 5).map(с => {    const ном = window.НомАвах(с.номId);    return '<div class="mp-comment-row"><div class="mp-c-head"><span>' + htmlЭскейп(ном ? ном.title : "Ном") + '</span><span class="mp-c-stars">' + одХаруулах(с.од) + '</span></div>' +      '<p>' + htmlЭскейп(с.текст || "") + '</p></div>';  }).join("");
  html += '<div class="mp-info-row"><span class="mp-info-label">Зорьсон ном</span><span class="mp-info-value">' + (зорьсон.length ? зорьсон.map(n => htmlЭскейп(n.title)).join(", ") : "—") + '</span></div>';
  return html;
}
window.хэрэглэгчДэлгэрэнгүйHtml = хэрэглэгчДэлгэрэнгүйHtml;

// ---------- Админы профайл (хэрэглэгчээс тусдаа) ----------
function админПрофайлАвах() {
  const үндсэн = {
 нэр: "Админ", албан: "Админ", мэйл: АДМИН.мэйл, утас: "", ажилЭхэлсэн: "2025-10-20", намтар: "" };
  try {
 const х = JSON.parse(localStorage.getItem("админПрофайл") || "{}");
 return Object.assign(үндсэн, х || {});
 } catch (e) {
 return үндсэн;
 }}
function админПрофайлЗурах() {
  const эл = document.getElementById("adminProfailHarah");
  if (!эл) return;
  if (!админБайгаа()) {
 эл.innerHTML = "";
 return;
 }  const п = админПрофайлАвах();
  let хэрэглэгчТоо = 0;
  try {
 const х = JSON.parse(localStorage.getItem("hereglegchid") || "[]");
 if (Array.isArray(х)) хэрэглэгчТоо = х.length;
 } catch (e) {
}  const ажилЭхэлсэн = п.ажилЭхэлсэн || "2025-10-20";
  let ажилласанЖил = "—";
  try {
    const эхлэх = new Date(ажилЭхэлсэн + "T00:00:00");
    if (!isNaN(эхлэх.getTime())) {      const одоо = new Date();      let жил = одоо.getFullYear() - эхлэх.getFullYear();      const сарӨдөр = (одоо.getMonth() * 100 + одоо.getDate()) - (эхлэх.getMonth() * 100 + эхлэх.getDate());      if (сарӨдөр < 0) жил--;      ажилласанЖил = Math.max(0, жил) + " жил";    }  } catch (e) {
}  const стат = профайлСтатистик();
  const огнооТекст = "2025-10-20";
  эл.innerHTML = '<div class="mp-wrap">' +    '<div class="mp-card"><div class="mp-top"><span class="mp-avatar">А</span>' +    '<div class="mp-name-row"><div class="mp-name">' + htmlЭскейп(п.нэр) + '</div>' +    '<div class="mp-role">Администратор</div>' +    '<div class="mp-comment">Бичсэн сэтгэгдэл: ' + стат.сэтгэгдэл + '</div></div>' +    '<button type="button" class="mp-edit saaral" data-mp="edit">Засах</button></div>' +    '<div class="mp-stats">' +    '<div class="mp-stat"><strong>' + htmlЭскейп(ажилласанЖил) + '</strong><span>Ажилласан жил</span></div>' +    '<div class="mp-stat"><strong>' + htmlЭскейп(п.албан || "Админ") + '</strong><span>Албан тушаал</span></div>' +    '<div class="mp-stat" data-mp-stat="reviews"><strong>' + стат.сэтгэгдэл + '</strong><span>Бичсэн сэтгэгдэл</span></div>' +    '<div class="mp-stat"><strong>' + хэрэглэгчТоо + '</strong><span>Хэрэглэгчид</span></div>' +    '</div><div class="mp-stat-detail" id="mpStatDetail" style="display:none;"></div></div>' +    '<div class="mp-info-card"><div class="mp-info-title">Админ мэдээлэл</div>' +    '<div class="mp-info-row"><span class="mp-info-label">Нэр</span><span class="mp-info-value">' + htmlЭскейп(п.нэр) + '</span></div>' +    '<div class="mp-info-row"><span class="mp-info-label">Албан тушаал</span><span class="mp-info-value">' + htmlЭскейп(п.албан || "Админ") + '</span></div>' +    '<div class="mp-info-row"><span class="mp-info-label">И-мэйл</span><span class="mp-info-value">' + htmlЭскейп(п.мэйл) + '</span></div>' +    '<div class="mp-info-row"><span class="mp-info-label">Утас</span><span class="mp-info-value">' + htmlЭскейп(п.утас || "+976 9X XXX XXX") + '</span></div>' +    '<div class="mp-info-row"><span class="mp-info-label">Бүртгүүлсэн огноо</span><span class="mp-info-value">' + htmlЭскейп(огнооТекст) + '</span></div>' +    '</div>' +    '<button type="button" class="mp-exit-btn" data-mp="logout">Гарах</button>' +    '<button type="button" class="mp-admin-btn" data-mp="settings">Админ тохиргоо</button>' +    '</div>' +    '<div class="mp-edit-form" id="mpEditForm" style="display:none;"></div>';
  const форм = document.getElementById("adminProfailForm");
  if (форм) {
    const н = document.getElementById("apNer");
 if (н) н.value = п.нэр || "";
    const а = document.getElementById("apAlban");
 if (а) а.value = п.албан || "";
    const м = document.getElementById("apEmail");
 if (м) м.value = п.мэйл || "";
    const у = document.getElementById("apUtas");
 if (у) у.value = п.утас || "";
    const ае = document.getElementById("apAжилЭхэлсэн");
 if (ае) ае.value = п.ажилЭхэлсэн || "2025-10-20";
    const нт = document.getElementById("apBio");
 if (нт) нт.value = п.намтар || "";
  }}
window.админПрофайлЗурах = админПрофайлЗурах;
window.админПрофайлЗурах = админПрофайлЗурах;
// ---------- Админ: ангилал + зохиолч удирдах (бодитоор ажиллана) ----------
function ангилалБүхАвах() {
  const багц = {
};
  try {
 номнууд.forEach(n => { const к = String(n.category || "").trim(); if (к) багц[к] = (багц[к] || 0) + 1; });
 } catch (e) {
}  try {
    let custom = JSON.parse(localStorage.getItem("customAngilal") || "[]");
    if (!Array.isArray(custom)) custom = [];
    custom.forEach(к => { к = String(к || "").trim(); if (к && !(к in багц)) багц[к] = 0; });
  } catch (e) {
}  return багц;
}
function ангилалХааяалах(жагсаалт) {
 try {
 localStorage.setItem("customAngilal", JSON.stringify(жагсаалт));
 } catch (e) {
} }
function ангилалСонголтДүүргэх() {
  const нэрс = Object.keys(ангилалБүхАвах());
  const дүүргэх = (id, хоосонСонголт) => {
    const эл = document.getElementById(id);
    if (!эл) return;
    const хуучин = эл.value;
    let html = хоосонСонголт ? '<option value="">Бүгд</option>' : "";
    html += нэрс.map(к => '<option value="' + htmlЭскейп(к) + '">' + htmlЭскейп(к) + '</option>').join("");
    эл.innerHTML = html;
    if (нэрс.includes(хуучин)) эл.value = хуучин;
    else if (id === "anCategory" && нэрс.length) эл.value = нэрс[0];
  };
  дүүргэх("anCategory", false);
  дүүргэх("shuultAngilal", true);
}
let засажБуйАнгилал = null;
function ангилалЗурах() {
  const эл = document.getElementById("adminAngilalList");
  if (!эл) return;
  const багц = ангилалБүхАвах();
  const нэрс = Object.keys(багц).sort((a, b) => a.localeCompare(b, "mn"));
  if (!нэрс.length) {
 эл.innerHTML = '<p class="tohirgoo-tailbar">Ангилал байхгүй байна.</p>';
 return;
 }  эл.innerHTML = нэрс.map(нэр => {    const тоо = багц[нэр] || 0;    if (засажБуйАнгилал === нэр) {      return '<div class="admin-cat-row"><input type="text" id="adminAngilalEditInput" maxlength="30" value="' + htmlЭскейп(нэр) + '">' +        '<button type="button" data-cat-save="' + htmlЭскейп(нэр) + '">Хадгалах</button>' +        '<button type="button" data-cat-cancel class="saaral">Болих</button></div>';    }    let шилжүүлэх = "";    if (тоо > 0) {      const бусад = нэрс.filter(к => к !== нэр);      шилжүүлэх = бусад.length        ? '<select data-cat-move="' + htmlЭскейп(нэр) + '">' + бусад.map(к => '<option value="' + htmlЭскейп(к) + '">' + htmlЭскейп(к) + '</option>').join("") + '</select>'        : "";    }    return '<div class="admin-cat-row"><span class="k-ner">' + htmlЭскейп(нэр) + '</span>' +      '<span class="k-too">' + тоо + ' ном</span>' + шилжүүлэх +      '<button type="button" data-cat-edit="' + htmlЭскейп(нэр) + '" class="saaral">Засах</button>' +      '<button type="button" data-cat-del="' + htmlЭскейп(нэр) + '" class="saaral">Устгах</button></div>';  }).join("");
}
window.ангилалЗурах = ангилалЗурах;
function ангилалНэрСолих(хуучин, шинэ) {
  хуучин = String(хуучин || "").trim();
 шинэ = String(шинэ || "").trim().slice(0, 30);
  if (!хуучин || !шинэ) {
 мэдэгдэл("Ангиллын нэр хоосон байж болохгүй.");
 return false;
 }  if (хуучин === шинэ) return true;
  const багц = ангилалБүхАвах();
  if (шинэ in багц) {
 мэдэгдэл("«" + шинэ + "» ангилал аль хэдийнэ байна.");
 return false;
 }  let тоо = 0;
  номнууд.forEach(n => { if (String(n.category) === хуучин) { номТалбарХадгалах(n, { category: шинэ }); тоо++; } });
  try {
    let custom = JSON.parse(localStorage.getItem("customAngilal") || "[]");
    if (!Array.isArray(custom)) custom = [];
    const i = custom.indexOf(хуучин);
    if (i >= 0) { custom[i] = шинэ; ангилалХааяалах(custom); }  } catch (e) {
}  return тоо;
}
function номТалбарХадгалах(ном, талбарууд) {
  if (!ном) return;
  Object.assign(ном, талбарууд);
  try {
    const customs = захиалгатУнших("customBooks", []);
    const idx = customs.findIndex(т => (ном.uid && т.uid === ном.uid));
    if (idx >= 0) {      Object.assign(customs[idx], талбарууд);      try { localStorage.setItem("customBooks", JSON.stringify(customs)); } catch (e) {}    }    const зассан = захиалгатУнших("bookEdit", {});
    const түлхүүрүүд = [];
    if (Number(ном.id) < 10000) түлхүүрүүд.push(String(ном.id));
 else түлхүүрүүд.push("c" + ном.id);
    if (ном.uid) түлхүүрүүд.push(ном.uid);
    түлхүүрүүд.forEach(к => { зассан[к] = Object.assign(зассан[к] || {}, талбарууд); });
    try { localStorage.setItem("bookEdit", JSON.stringify(зассан)); } catch (e) {}    try { ном.image = хавтасЗурах(ном.title, ном.author, ном.category, ном.өнгө1, ном.өнгө2, ном.id % 4); } catch (e) {}  } catch (e) {
}}
function зохиолчСтатАвах() {
  const багц = {
};
  try {
 номнууд.forEach(n => { const з = String(n.author || "").trim(); if (з) багц[з] = (багц[з] || 0) + 1; });
 } catch (e) {
}  try {
    let custom = JSON.parse(localStorage.getItem("customZohiolch") || "[]");
    if (!Array.isArray(custom)) custom = [];
    custom.forEach(з => { з = String(з || "").trim(); if (з && !(з in багц)) багц[з] = 0; });
  } catch (e) {
}  return багц;
}
function зохиолчХааяалах(жагсаалт) {
 try {
 localStorage.setItem("customZohiolch", JSON.stringify(жагсаалт));
 } catch (e) {
} }
function зохиолчСаналуудДүүргэх() {
  const эл = document.getElementById("anAuthorList");
  if (!эл) return;
  эл.innerHTML = Object.keys(зохиолчСтатАвах()).sort((a, b) => a.localeCompare(b, "mn"))    .map(з => '<option value="' + htmlЭскейп(з) + '">').join("");
}
let засажБуйЗохиолч = null;
function админЗохиолчЗурах() {
  const эл = document.getElementById("adminZohiolchList");
  if (!эл) return;
  const багц = зохиолчСтатАвах();
  const нэрс = Object.keys(багц).sort((a, b) => a.localeCompare(b, "mn"));
  if (!нэрс.length) {
 эл.innerHTML = '<p class="tohirgoo-tailbar">Зохиолч байхгүй байна.</p>';
 return;
 }  эл.innerHTML = нэрс.map(нэр => {    const тоо = багц[нэр] || 0;    if (засажБуйЗохиолч === нэр) {      return '<div class="admin-cat-row"><input type="text" id="adminZohiolchEditInput" maxlength="60" value="' + htmlЭскейп(нэр) + '">' +        '<button type="button" data-zoh-save="' + htmlЭскейп(нэр) + '">Хадгалах</button>' +        '<button type="button" data-zoh-cancel class="saaral">Болих</button></div>';    }    return '<div class="admin-cat-row"><span class="k-ner">' + htmlЭскейп(нэр) + '</span>' +      '<span class="k-too">' + тоо + ' ном</span>' +      '<button type="button" data-zoh-edit="' + htmlЭскейп(нэр) + '" class="saaral">Засах</button>' +      '<button type="button" data-zoh-del="' + htmlЭскейп(нэр) + '" class="saaral">Устгах</button></div>';  }).join("");
}
window.админЗохиолчЗурах = админЗохиолчЗурах;
function зохиолчНэрСолих(хуучин, шинэ) {
  хуучин = String(хуучин || "").trim();
 шинэ = String(шинэ || "").trim().slice(0, 60);
  if (!хуучин || !шинэ) {
 мэдэгдэл("Зохиолчийн нэр хоосон байж болохгүй.");
 return false;
 }  if (хуучин === шинэ) return true;
  const багц = зохиолчСтатАвах();
  if (шинэ in багц) {
 мэдэгдэл("«" + шинэ + "» зохиолч аль хэдийнэ байна.");
 return false;
 }  let тоо = 0;
  номнууд.forEach(n => { if (String(n.author) === хуучин) { номТалбарХадгалах(n, { author: шинэ }); тоо++; } });
  try {
    let custom = JSON.parse(localStorage.getItem("customZohiolch") || "[]");
    if (!Array.isArray(custom)) custom = [];
    const i = custom.indexOf(хуучин);
    if (i >= 0) { custom[i] = шинэ; зохиолчХааяалах(custom); }  } catch (e) {
}  return тоо;
}
// ---------- Админ тохиргоо хуудас (карт цэс + одоо байгаа удирдлага) ----------
function админТохиргооНээх() {
  if (!админБайгаа()) {
 try { хуудасНээх("nevtreh"); } catch (e) {} return;
 }  try {
 админЗурах();
 } catch (e) {
}  const grid = document.getElementById("adminSettingsGrid");
  if (grid) grid.style.display = "";
  document.querySelectorAll(".admin-section").forEach(с => { с.style.display = "none"; });
  try {
 window.scrollTo({ top: 0, behavior: "smooth" });
 } catch (e) {
 try { window.scrollTo(0, 0); } catch (е2) {} }}
window.админТохиргооНээх = админТохиргооНээх;
function админТохиргооЦэсНээх(төрөл) {
  if (!админБайгаа()) {
 try { мэдэгдэл("Зөвхөн админ."); } catch (e) {} return;
 }  const grid = document.getElementById("adminSettingsGrid");
  if (grid) grid.style.display = "none";
  let олдсон = false;
  document.querySelectorAll(".admin-section").forEach(с => {    const таарах = с.getAttribute("data-section") === төрөл;    с.style.display = таарах ? "block" : "none";    if (таарах) олдсон = true;  });
  if (!олдсон && grid) grid.style.display = "";
  try {
 админЗурах();
 } catch (e) {
}  try {
 window.scrollTo({ top: 0, behavior: "smooth" });
 } catch (e) {
 try { window.scrollTo(0, 0); } catch (е2) {} }}
window.админТохиргооЦэсНээх = админТохиргооЦэсНээх;

function админРууБуцах() {
  хуудасНээх("nevtreh");
  try {
 хэрэглэгчШинэчлэх();
 } catch (e) {
}  try {
 админЗурах();
 } catch (e) {
}  try {
 профайлЗурах();
 } catch (e) {
}  try {
    const tp = document.getElementById("tabProfail");
    const tz = document.getElementById("tabZahialga");
    const ts = document.getElementById("tabSonirhol");
    if (tz) tz.classList.remove("идэвхтэй");
    if (ts) ts.classList.remove("идэвхтэй");
    if (tp) tp.classList.add("идэвхтэй");
    try { localStorage.setItem("profileTab", "profail"); } catch (e) {}  } catch (e) {
}  try {
    requestAnimationFrame(function() {      const p = document.getElementById("adminPanel");      if (p) p.scrollIntoView({ behavior: "smooth", block: "start" });    });
  } catch (e) {
}}
window.админРууБуцах = админРууБуцах;
// ---------- Админ ----------
function админЗурах() {
  if (!админБайгаа()) return;
  let бүх = [];
  try {
 бүх = JSON.parse(localStorage.getItem("zahialga") || "[]");
 } catch (e) {
}  бүх = [...бүх].sort((a, b) => new Date(b.огноо) - new Date(a.огноо));
  const тооЭл = document.getElementById("adminOrdToo");
  if (тооЭл) тооЭл.textContent = бүх.length;
  const хайхЭл = document.getElementById("adminOrderHailt");
  const шүүлтЭл = document.getElementById("adminOrderFilter");
  const хайлт = хайхЭл ? хайхЭл.value.trim().toLowerCase() : "";
  const шүүлт = шүүлтЭл ? шүүлтЭл.value : "";
  const ол = document.getElementById("adminOrderList");
  if (ол) {
    let харуулах = бүх;
    if (шүүлт === "0" || шүүлт === "1" || шүүлт === "2") харуулах = харуулах.filter(з => захиалгаТөлөв(з.огноо, з.дугаар, з) === Number(шүүлт));
    if (хайлт) харуулах = харуулах.filter(з => ((з.дугаар || "") + " " + (з.нэр || "") + " " + (з.мэйл || "") + " " + (з.утас || "")).toLowerCase().includes(хайлт));
    ол.innerHTML = харуулах.length ? харуулах.map(з => {      const шат = захиалгаТөлөв(з.огноо, з.дугаар, з);      const огноо = new Date(з.огноо).toLocaleString("mn-MN");      const товчнууд = ЗАХИАЛГА_ШАТ.map((н, к) =>        '<button type="button" data-admin-id="' + з.дугаар + '" data-admin-stage="' + к + '" class="' + (к === шат ? "идэвхтэй" : "saaral") + '">' + н + '</button>').join("");      const алхам = ЗАХИАЛГА_ШАТ.map((н, к) => '<div class="z-step' + (к <= шат ? ' хийсэн' : '') + '">' + н + '</div>').join("");      const хувь = шат === 0 ? 8 : шат === 1 ? 55 : 100;      const дэлгэрэнгүй = (з.номнууд && з.номнууд.length)        ? з.номнууд.map(н => '<div class="z-nom">📖 <strong>' + н.title + '</strong> <small>' + (н.author || "") + ' • ' + мөнгөТооцоо(н.price) + ' × ' + н.тоо + '</small></div>').join("") +          '<div class="z-ognoo">Нийт: <strong>' + мөнгөТооцоо(з.дүн != null ? з.дүн : 0) + '</strong></div>'        : '<div class="z-ognoo">Номын мэдээлэл хадгалагдаагүй.</div>';      return '<div class="admin-ord"><div class="z-dugaar">' + з.дугаар + ' <span class="z-status-admin z-status-' + шат + '">' + ЗАХИАЛГА_ШАТ[шат] + '</span>' + (шат === 2 ? ' ✓' : '') + ' <small class="z-toggle">ном харах ▼</small>' +        '<button type="button" data-admin-del="' + з.дугаар + '" class="admin-ord-del" title="Захиалгыг устгах">🗑 Устгах</button></div>' +        '<div class="z-ognoo">' + (з.мэйл || "зочин") + ' • ' + (з.утас || "") + ' • ' + огноо + '</div>' +        (з.төлбөр ? '<div class="z-ognoo">Төлбөр: ' + htmlЭскейп(з.төлбөр.арга || "—") + ' • ' + htmlЭскейп(з.төлбөр.төлөв || "хүлээгдэж буй") + (з.төлбөр.ref ? ' • ' + htmlЭскейп(з.төлбөр.ref) : '') + '</div>' : '') +        '<div class="z-ognoo">' + (з.хаяг || "") + (з.шатОгноо ? ' • шинэчилсэн: ' + new Date(з.шатОгноо).toLocaleString("mn-MN") : '') + '</div>' +        '<div class="z-steps">' + алхам + '</div><div class="z-bar"><i style="width:' + хувь + '%"></i></div>' +        '<div class="z-details" style="display:none;">' + дэлгэрэнгүй + '</div>' +        '<div class="admin-stage">' + товчнууд + '</div>' +        (шат < 2 ? '<button type="button" data-admin-next="' + з.дугаар + '" class="admin-next">Дараагийн шат → ' + ЗАХИАЛГА_ШАТ[шат + 1] + '</button>' : '') + '</div>';    }).join("") : '<p style="color:#8a6d5b;">Захиалга байхгүй' + (хайлт || шүүлт ? ' (хайлт/шүүлт таарахгүй).' : '.') + '</p>';
  }  админХэрэглэгчЗурах(бүх);  const хайлтНом = document.getElementById("adminNomHailt");
  админНомЗурах(хайлтНом ? хайлтНом.value : "");
  админЗурвасЗурах();
  const бб = window.НомАвах(захиалгатУнших("adminBest", null));
  const бо = document.getElementById("adminBestOdoo");
  if (бо) бо.textContent = бб ? бб.title + " — " + бб.author : "—";
  const ро = document.getElementById("adminRecOdoo");
  if (ро) {
    const рр = захиалгатУнших("adminRec", []).map(window.НомАвах).filter(Boolean);
    ро.textContent = рр.length ? рр.map(n => n.title).join("; ") : "—";
  }  try {
 админХүргэлтЗурах();
 } catch (e) {
}  try {
 админТохиргооФормДүүргэх();
 } catch (e) {
}  try {
 админТүрээсЗурах();
 } catch (e) {
}  try {
 ангилалСонголтДүүргэх();
 } catch (e) {
}  try {
 зохиолчСаналуудДүүргэх();
 } catch (e) {
}  try {
 ангилалЗурах();
 } catch (e) {
}  try {
 админЗохиолчЗурах();
 } catch (e) {
}}
window.админЗурах = админЗурах;
// ---------- Админ: хэрэглэгчийн жагсаалт (хайлт + устгах) ----------
function админХэрэглэгчЗурах(бүхЗахиалга) {
  if (!админБайгаа()) return;
  let хэрэглэгчид = [];
  try {
 хэрэглэгчид = JSON.parse(localStorage.getItem("hereglegchid") || "[]");
 } catch (e) {
}  const хт = document.getElementById("adminUserToo");
  if (хт) хт.textContent = хэрэглэгчид.length;
  const ул = document.getElementById("adminUserList");
  if (!ул) return;
  const хайлтЭл = document.getElementById("adminUserHailt");
  const хайлт = хайлтЭл ? хайлтЭл.value.trim().toLowerCase() : "";
  const шүүсэн = хайлт ? хэрэглэгчид.filter(х => ((х.ner || "") + " " + (х.мэйл || "")).toLowerCase().indexOf(хайлт) >= 0) : хэрэглэгчид;
  const бүх = бүхЗахиалга || [];
  ул.innerHTML = хэрэглэгчид.length ? (
    шүүсэн.length ? шүүсэн.map(х => {
      const минийЗахиалга = бүх.filter(з => з.мэйл === х.мэйл || з.аккаунтМэйл === х.мэйл).sort((a, b) => new Date(b.огноо) - new Date(a.огноо));
      const сүүлд = минийЗахиалга[0];
      const төлөв = сүүлд ? " • сүүлд: " + ЗАХИАЛГА_ШАТ[захиалгаТөлөв(сүүлд.огноо, сүүлд.дугаар, сүүлд)] : " • захиалгагүй";
      return '<div class="admin-user" data-huser="' + htmlЭскейп(х.мэйл) + '"><div class="au-avatar">' + (userAvatarHtml(х.мэйл) || htmlЭскейп((х.ner || "Х").charAt(0).toUpperCase())) + '</div>' +
        '<div class="au-idalgaa"><strong>' + htmlЭскейп(х.ner) + '</strong><br><small style="color:#8a6d5b;">' + htmlЭскейп(х.мэйл) + ' • ' + минийЗахиалга.length + ' захиалга' + төлөв + '</small></div>' +
        '<button type="button" class="admin-user-del" data-user-del="' + htmlЭскейп(х.мэйл) + '" title="Хэрэглэгчийг устгах">🗑 Устгах</button></div>' +
        '<div class="admin-user-detail" style="display:none;" data-hudetail="' + htmlЭскейп(х.мэйл) + '"></div>';
    }).join("") : '<p style="color:#8a6d5b;">Хайлтад тохирох хэрэглэгч олдсонгүй.</p>'
  ) : '<p style="color:#8a6d5b;">Бүртгэлтэй хэрэглэгч байхгүй.</p>';
}
window.админХэрэглэгчЗурах = админХэрэглэгчЗурах;
// Хэрэглэгч устгах: бүртгэл + түүний хувийн хадгалалтууд (профайл, сонирхол, карт) цэвэрлэнэ
function хэрэглэгчУстгах(имэйл) {
  if (!админБайгаа()) { мэдэгдэл("Зөвхөн админ."); return false; }
  const мэйл = String(имэйл || "");
  const нэв = нэвтэрсэнАвах();
  if (нэв && нэв.мэйл === мэйл) { мэдэгдэл("Өөрийн бүртгэлийг устгах боломжгүй."); return false; }
  if (!confirm("«" + мэйл + "» хэрэглэгчийг устгах уу? Түүний хувийн хадгалалтууд мөн цэвэрлэгдэнэ.")) return false;
  let хэрэглэгчид = [];
  try { хэрэглэгчид = JSON.parse(localStorage.getItem("hereglegchid") || "[]"); } catch (e) {}
  const үлдсэн = хэрэглэгчид.filter(х => х.мэйл !== мэйл);
  if (үлдсэн.length === хэрэглэгчид.length) { мэдэгдэл("Хэрэглэгч олдсонгүй."); return false; }
  try { localStorage.setItem("hereglegchid", JSON.stringify(үлдсэн)); } catch (e) {}
  const устгагдахТүлхүүр = [];
  try {
    const дагавар = ":" + мэйл.toLowerCase();
    for (let i = 0; i < localStorage.length; i++) {
      const к = localStorage.key(i);
      if (к && к.toLowerCase().slice(-дагавар.length) === дагавар) устгагдахТүлхүүр.push(к);
    }
  } catch (e) {}
  устгагдахТүлхүүр.forEach(к => { try { localStorage.removeItem(к); } catch (e) {} });
  админХэрэглэгчЗурах(захиалгаЖагсаалтАвах());
  мэдэгдэл("«" + мэйл + "» хэрэглэгч устгагдлаа.");
  return true;
}
window.хэрэглэгчУстгах = хэрэглэгчУстгах;
// ---------- Админ: захиалга устгах + ирсэн зурвас ----------
function захиалгаУстгах(дугаар) {
  if (!админБайгаа()) {
 мэдэгдэл("Зөвхөн админ устгаж болно.");
 return false;
 }  const бүх = захиалгаЖагсаалтАвах();
  const үлдсэн = бүх.filter(з => з.дугаар !== дугаар);
  if (үлдсэн.length === бүх.length) {
 мэдэгдэл("Захиалга олдсонгүй.");
 return false;
 }  захиалгаЖагсаалтХадгалах(үлдсэн);
  try {
    const статус = захиалгаСтатусАвах();
    delete статус[дугаар];
    localStorage.setItem("ztatus", JSON.stringify(статус));
  } catch (e) {
}  админЗурах();
  try {
 профайлЗурах();
 } catch (e) {
}  try {
 тохиргооХэрэглэх();
 } catch (e) {
}  мэдэгдэл(дугаар + " захиалга устгагдлаа.");
  return true;
}
window.захиалгаУстгах = захиалгаУстгах;
function холбооЗурвасАвах() {
 try {
 const ж = JSON.parse(localStorage.getItem("holbooZurvas") || "[]");
 return Array.isArray(ж) ? ж : [];
 } catch (e) {
 return [];
 } }
function админТокенАвах() {
 try {
 return sessionStorage.getItem("adminToken") || "";
 } catch (e) {
 return "";
 } }
// Админ зурвасын жагсаалт: сервер (server.js) ажиллаж байвал тэндээс, үгүй бол хөтчийн хадгалалтаас
async function админЗурвасЗурах() {
  const тооЭл = document.getElementById("adminMsgToo");
  const жагс = document.getElementById("adminMsgList");
  let бүх = null;
  const токен = админТокенАвах();
  if (токен) {
    try {      const хариу = await fetch("/api/zurvas", { headers: { "Authorization": "Bearer " + токен } });      if (хариу.ok) { const д = await хариу.json(); бүх = (д && д.зурвасууд) || []; }      else if (хариу.status === 401) { try { sessionStorage.removeItem("adminToken"); } catch (e) {} }    } catch (e) {}  }  if (!бүх) бүх = холбооЗурвасАвах().slice().sort((a, b) => new Date(b.огноо) - new Date(a.огноо));
  if (тооЭл) тооЭл.textContent = бүх.length;
  if (!жагс) return;
  жагс.innerHTML = бүх.length ? бүх.map((м, к) =>    '<div class="admin-msg"><strong>' + (м.нэр || "Нэргүй") + ' <small>• ' + (м.мэйл || "") + ' • ' + (м.огноо ? new Date(м.огноо).toLocaleString("mn-MN") : "") + '</small></strong>' +    '<p>' + (м.зурвас || "") + '</p>' +    '<button type="button" data-msg-del="' + (м.id || к) + '" class="saaral">Устгах</button></div>'  ).join("") : '<p style="color:#8a6d5b;">Ирсэн зурвас байхгүй.</p>';
}
window.админЗурвасЗурах = админЗурвасЗурах;
function админНомЗурах(хайлт) {
  const эл = document.getElementById("adminNomList");
  if (!эл) return;
  хайлт = (хайлт || "").trim().toLowerCase();
  const олсон = номнууд.filter(n => !хайлт || n.title.toLowerCase().includes(хайлт) || n.author.toLowerCase().includes(хайлт)).slice(0, 20);
  const бест = захиалгатУнших("adminBest", null);
  const рек = захиалгатУнших("adminRec", []);
  эл.innerHTML = олсон.length ? олсон.map(n =>    '<div class="admin-nom"><strong>' + n.title + '</strong><small style="color:#8a6d5b;"> • ' + n.author + ' • id:' + n.id + '</small> ' +    '<span class="stock-badge' + (Number(n.stock) <= 0 ? " дууссан" : Number(n.stock) <= 5 ? " бага" : "") + '">Үлд: ' + n.stock + '</span>' +    '<div class="an-row"><select data-an-cat="' + n.id + '">' +      Object.keys(ангилалБүхАвах()).map(к => '<option value="' + к + '"' + (n.category === к ? " selected" : "") + '>' + к + '</option>').join("") +    '</select><input type="number" data-an-price="' + n.id + '" value="' + n.price + '" min="0" title="Үнэ">' +    '<div class="admin-stock-step"><button type="button" data-abtn="stockMinus" data-aid="' + n.id + '" title="Үлдэгдэл 1-ээр хасах">−</button>' +    '<input type="number" data-an-stock="' + n.id + '" value="' + n.stock + '" min="0" title="Үлдэгдэл">' +    '<button type="button" data-abtn="stockPlus" data-aid="' + n.id + '" title="Үлдэгдэл 1-ээр нэмэх">+</button></div></div>' +    '<div class="an-row"><button type="button" data-abtn="hadgalah" data-aid="' + n.id + '">Хадгалах</button>' +    '<button type="button" data-abtn="best" data-aid="' + n.id + '" class="' + (бест === n.id ? "" : "saaral") + '">Шилдэг' + (бест === n.id ? ' ✓' : '') + '</button>' +    '<button type="button" data-abtn="sanal" data-aid="' + n.id + '" class="' + (рек.includes(n.id) ? "" : "saaral") + '">Санал' + (рек.includes(n.id) ? ' ✓' : '') + '</button>' +    '<button type="button" data-abtn="ustgah" data-aid="' + n.id + '" class="saaral">Устгах</button></div></div>'  ).join("") : '<p style="color:#8a6d5b;">Ном олдсонгүй.</p>';
}
window.админНомЗурах = админНомЗурах;

// ---------- Админ: түрээсийн удирдлага ----------
function админТүрээсЗурах() {
  if (!админБайгаа()) return;
  const стат = document.getElementById("rentStats");
  const бүх = түрээсАвах();
  const төлөвтэй = бүх.map(р => ({ р: р, т: түрээсТөлөвБодох(р) }));
  const тоолох = т => төлөвтэй.filter(x => x.т === т).length;
  const идэвхтэйТоо = төлөвтэй.filter(x => ["Баталгаажсан", "Түрээслэгдсэн", "Дуусах дөхсөн"].includes(x.т)).length;
  const орлого = бүх.filter(р => түрээсТөлөвБодох(р) !== "Цуцлагдсан").reduce((с, р) => с + (Number(р.нийтДүн) || 0) + (Number(р.торгууль) || 0), 0);
  if (стат) стат.innerHTML =    '<div class="rent-stat"><strong>' + бүх.length + "</strong><small>Нийт түрээс</small></div>" +    '<div class="rent-stat"><strong>' + идэвхтэйТоо + "</strong><small>Түрээслэгдсэн ном</small></div>" +    '<div class="rent-stat"><strong>' + тоолох("Дуусах дөхсөн") + "</strong><small>Дуусах дөхсөн</small></div>" +    '<div class="rent-stat анхааруулга"><strong>' + тоолох("Хугацаа хэтэрсэн") + "</strong><small>Хугацаа хэтэрсэн</small></div>" +    '<div class="rent-stat"><strong>' + тоолох("Буцаагдсан") + "</strong><small>Буцаагдсан</small></div>" +    '<div class="rent-stat"><strong>' + мөнгөТооцоо(орлого) + "</strong><small>Түрээсийн орлого</small></div>";
  const хайхЭл = document.getElementById("rentHailt");
  const шүүлтЭл = document.getElementById("rentFilter");
  const огнооЭл = document.getElementById("rentDate");
  const хайлт = хайхЭл ? хайхЭл.value.trim().toLowerCase() : "";
  const шүүлт = шүүлтЭл ? шүүлтЭл.value : "";
  const огноо = огнооЭл ? огнооЭл.value : "";
  const ол = document.getElementById("rentList");
  if (!ол) return;
  let харуулах = төлөвтэй.slice().sort((a, b) => new Date(b.р.үүссэнОгноо) - new Date(a.р.үүссэнОгноо));
  if (шүүлт) харуулах = харуулах.filter(x => x.т === шүүлт);
  if (хайлт) харуулах = харуулах.filter(x => ((x.р.дугаар || "") + " " + (x.р.нэр || "") + " " + (x.р.мэйл || "") + " " + (x.р.номTitle || "")).toLowerCase().includes(хайлт));
  if (огноо) харуулах = харуулах.filter(x => String(x.р.эхлэхОгноо).slice(0, 10) <= огноо && огноо <= String(x.р.дуусахОгноо).slice(0, 10));
  ол.innerHTML = харуулах.length ? харуулах.map(x => {    const р = x.р, т = x.т;    const үлд = өдөрҮлдсэн(р);    let үйлдэл = "";    if (р.төлөвГарын === "Хүлээгдэж буй") үйлдэл += '<button type="button" data-radmin="confirm" data-id="' + р.дугаар + '">Баталгаажуулах</button>';    if (түрээсИдэвхтэйЭсэх(р)) {      үйлдэл += '<button type="button" data-radmin="extend" data-id="' + р.дугаар + '" class="saaral">Сунгах</button>';      үйлдэл += '<button type="button" data-radmin="return" data-id="' + р.дугаар + '">Буцаалт ✓</button>';    }    if (т !== "Буцаагдсан" && т !== "Цуцлагдсан") үйлдэл += '<button type="button" data-radmin="cancel" data-id="' + р.дугаар + '" class="saaral">Цуцлах</button>';    үйлдэл += '<button type="button" data-radmin="pay" data-id="' + р.дугаар + '" class="saaral">Төлбөр: ' + р.төлбөрТөлөв + '</button>';    return '<div class="admin-rent' + (т === "Хугацаа хэтэрсэн" ? " хугацаа-хэтэрсэн" : "") + '">' +      '<div class="z-dugaar">' + р.дугаар + ' • <strong>' + т + "</strong>" + (т === "Хугацаа хэтэрсэн" ? " ⚠ АНХААРУУЛГА" : "") + ' <small class="z-toggle">дэлгэрэнгүй ▼</small></div>' +      '<div class="z-ognoo">📖 ' + р.номTitle + " • " + (р.нэр || "") + " • " + (р.мэйл || "") + " • " + (р.утас || "") + "</div>" +      '<div class="z-ognoo">' + new Date(р.эхлэхОгноо).toLocaleDateString("mn-MN") + " → " + new Date(р.дуусахОгноо).toLocaleDateString("mn-MN") +      " (" + р.хоног + " хоног" + (р.сунгасанХоног ? ", сунгасан +" + р.сунгасанХоног : "") + ") • Үлдсэн: <strong>" + (т === "Буцаагдсан" || т === "Цуцлагдсан" ? "—" : (үлд >= 0 ? үлд + " хоног" : Math.abs(үлд) + " хоног хэтэрсэн")) + "</strong></div>" +      '<div class="z-details" style="display:none;">' +      '<div class="z-nom">Түрээс: ' + мөнгөТооцоо(р.түрээсТөлбөр) + " • Хүргэлт (" + (р.арга === "хүргэлт" ? р.хот : "өөрийн") + "): " + мөнгөТооцоо(р.хүргэлтТөлбөр) + " • Барьцаа: " + мөнгөТооцоо(р.барьцаа) + "</div>" +      '<div class="z-nom">Нийт: <strong>' + мөнгөТооцоо((Number(р.нийтДүн) || 0) + (Number(р.торгууль) || 0)) + "</strong>" + (р.торгууль ? " (торгууль " + мөнгөТооцоо(р.торгууль) + ")" : "") + " • Төлбөр: " + р.төлбөрТөлөв + "</div>" +      (р.буцаасанОгноо ? '<div class="z-nom">Буцаасан: ' + new Date(р.буцаасанОгноо).toLocaleString("mn-MN") + "</div>" : "") +      (р.зөвшөөрөл ? '<div class="z-nom">Зөвшөөрөл: v' + р.зөвшөөрөл.хувилбар + " • " + new Date(р.зөвшөөрөл.огноо).toLocaleString("mn-MN") + "</div>" : "") +      '<div class="z-nom">Үүссэн: ' + new Date(р.үүссэнОгноо).toLocaleString("mn-MN") + "</div></div>" +      '<div class="rent-stage">' + үйлдэл + "</div></div>";  }).join("") : '<p style="color:#8a6d5b;">Түрээс байхгүй' + ((хайлт || шүүлт || огноо) ? " (хайлт/шүүлт таарахгүй)." : ".") + "</p>";
}
window.админТүрээсЗурах = админТүрээсЗурах;
function админТүрээсҮйлдэл(үйлдэл, дугаар) {
  if (!админБайгаа()) {
 мэдэгдэл("Зөвхөн админ.");
 return;
 }  const бүх = түрээсАвах();
  const р = бүх.find(x => x.дугаар === дугаар);
  if (!р) {
 мэдэгдэл("Түрээс олдсонгүй.");
 return;
 }  const к = админТохиргооАвах().rental;
  if (үйлдэл === "confirm") {
    if (р.төлөвГарын !== "Хүлээгдэж буй") { мэдэгдэл("Зөвхөн хүлээгдэж буй түрээс баталгаажна."); return; }    const сан = window.НомАвах(р.номId);
    if (!сан || түрээсИдэвхтэйТоо(р.номId) >= (Number(сан.stock) || 0)) { мэдэгдэл("Үлдэгдэл хүрэлцэхгүй байна."); return; }    р.төлөвГарын = "Баталгаажсан";
    р.stockХассан = true;
    if (сан) { сан.stock = Math.max(0, (Number(сан.stock) || 0) - 1); try { үлдэгдэлХадгалах(сан); } catch (e) {} }    мэдэгдэл(дугаар + " баталгаажлаа.");
  } else if (үйлдэл === "extend") {
    if (!түрээсИдэвхтэйЭсэх(р)) { мэдэгдэл("Идэвхтэй түрээс биш."); return; }    if ((р.хоног + (р.сунгасанХоног || 0) + к.extendDays) > к.maxDays) { мэдэгдэл("Хамгийн их сунгалт хэтэрнэ (" + к.maxDays + ")."); return; }    const дуусах = new Date(р.дуусахОгноо);
    дуусах.setDate(дуусах.getDate() + к.extendDays);
    р.дуусахОгноо = дуусах.toISOString();
    р.сунгасанХоног = (р.сунгасанХоног || 0) + к.extendDays;
    р.нийтДүн = (Number(р.нийтДүн) || 0) + к.extendDays * (Number(к.daily) || 0);
    р.төлбөрТөлөв = "хүлээгдэж буй";
    мэдэгдэл(дугаар + " +" + к.extendDays + " хоногоор сунгагдлаа.");
  } else if (үйлдэл === "return") {
    if (!түрээсИдэвхтэйЭсэх(р) || р.төлөвГарын === "Хүлээгдэж буй") { мэдэгдэл("Буцаах боломжгүй төлөв."); return; }    if (!confirm(дугаар + " буцаалт хүлээн авах уу?")) return;
    const хэтэрсэнХоног = Math.max(0, -1 * өдөрҮлдсэн(р));
    р.торгууль = хэтэрсэнХоног * (Number(к.fine) || 0);
    р.буцаасанОгноо = new Date().toISOString();
    р.төлөвГарын = "Буцаагдсан";
    if (р.stockХассан) {      const сан = window.НомАвах(р.номId);      if (сан) { сан.stock = (Number(сан.stock) || 0) + 1; try { үлдэгдэлХадгалах(сан); } catch (e) {} }      р.stockХассан = false;    }    мэдэгдэл(дугаар + " буцаагдлаа." + (р.торгууль ? " Торгууль: " + мөнгөТооцоо(р.торгууль) : " Барьцаа буцаагдана."));
  } else if (үйлдэл === "cancel") {
    if (р.төлөвГарын === "Буцаагдсан" || р.төлөвГарын === "Цуцлагдсан") { мэдэгдэл("Аль хэдийн хаагдсан."); return; }    if (!confirm(дугаар + " түрээсийг цуцлах уу?")) return;
    if (р.stockХассан) {      const сан = window.НомАвах(р.номId);      if (сан) { сан.stock = (Number(сан.stock) || 0) + 1; try { үлдэгдэлХадгалах(сан); } catch (e) {} }      р.stockХассан = false;    }    р.төлөвГарын = "Цуцлагдсан";
    мэдэгдэл(дугаар + " цуцлагдлаа.");
  } else if (үйлдэл === "pay") {
    р.төлбөрТөлөв = р.төлбөрТөлөв === "төлөгдсөн" ? "хүлээгдэж буй" : "төлөгдсөн";
    мэдэгдэл(дугаар + " төлбөр: " + р.төлбөрТөлөв);
  } else return;
  р.шинэчлэгдсэнОгноо = new Date().toISOString();
  түрээсХадгалах(бүх);
  try {
 номЖагсаалтСэргээх();
 } catch (e) {
}  админТүрээсЗурах();
  try {
 түрээсПрофайлЗурах();
 } catch (e) {
}}
window.админТүрээсҮйлдэл = админТүрээсҮйлдэл;
// ---------- Админ: хүргэлт + түрээс + сайтын тохиргооны UI ----------
function админХүргэлтЗурах() {
  const жагс = document.getElementById("adminDeliveryList");
  if (!жагс) return;
  const с = админТохиргооАвах().delivery;
  жагс.innerHTML = с.cities.map((хот, к) =>    '<div class="delivery-row"><strong>' + хот.name + (с.freeCities.includes(хот.name) ? ' <span class="stock-badge">80к+ үнэгүй</span>' : "") + "</strong>" +    '<span>₮</span><input type="number" data-city-fee="' + к + '" value="' + хот.fee + '" min="0">' +    '<label class="tohirgoo-шалгах"><input type="checkbox" data-city-on="' + к + '"' + (хот.enabled ? " checked" : "") + "> Идэвхтэй</label>" +    '<button type="button" data-city-del="' + к + '" class="saaral">Устгах</button></div>'  ).join("") +    '<div class="tohirgoo-tovchnuud" style="margin-top:8px;"><button type="button" id="adminDeliverySave">Хотын үнэ хадгалах</button></div>';
  const cb = document.getElementById("asFreeCities");
  if (cb) cb.innerHTML = с.cities.filter(c => c.enabled).map(c => '<label><input type="checkbox" data-free-city="' + c.name + '"' + (с.freeCities.includes(c.name) ? " checked" : "") + "> " + c.name + "</label>").join("");
  const bs = document.getElementById("asThreshold");
  if (bs && bs.value !== String(с.freeThreshold)) bs.value = с.freeThreshold;
  const saveBtn = document.getElementById("adminDeliverySave");
  if (saveBtn && !saveBtn.__bound) {
    saveBtn.__bound = true;
    saveBtn.addEventListener("click", () => {      if (!админБайгаа()) { мэдэгдэл("Зөвхөн админ."); return; }      const а = админТохиргооАвах();      document.querySelectorAll("[data-city-fee]").forEach(inp => {        const i = Number(inp.getAttribute("data-city-fee"));        if (а.delivery.cities[i]) а.delivery.cities[i].fee = Math.max(0, Number(inp.value) || 0);      });      document.querySelectorAll("[data-city-on]").forEach(inp => {        const i = Number(inp.getAttribute("data-city-on"));        if (а.delivery.cities[i]) а.delivery.cities[i].enabled = inp.checked;      });      а.delivery.freeCities = а.delivery.freeCities.filter(n => а.delivery.cities.some(c => c.name === n && c.enabled));      if (админТохиргооХадгалах({ delivery: а.delivery })) {        админХүргэлтЗурах();        try { хүргэлтМэдээлэлШинэчлэх(); } catch (e) {}        try { худалдахТооцоо(); } catch (e) {}        мэдэгдэл("Хүргэлтийн үнэ хадгалагдлаа ✓");      }    });
  }  const жагс2 = document.getElementById("adminDeliveryList");
  if (жагс2 && !жагс2.__bound) {
    жагс2.__bound = true;
    жагс2.addEventListener("click", э => {      const б = э.target.closest("[data-city-del]");      if (!б || !админБайгаа()) return;      if (!confirm("Энэ хотыг устгах уу?")) return;      const а = админТохиргооАвах();      const устгасан = а.delivery.cities.splice(Number(б.getAttribute("data-city-del")), 1)[0];      if (устгасан) а.delivery.freeCities = а.delivery.freeCities.filter(n => n !== устгасан.name);      if (админТохиргооХадгалах({ delivery: а.delivery })) { админХүргэлтЗурах(); мэдэгдэл("Хот устгагдлаа."); }    });
  }}
window.админХүргэлтЗурах = админХүргэлтЗурах;
function админТохиргооФормДүүргэх() {
  try {
    const а = админТохиргооАвах();
    const set = (id, v) => { const e = document.getElementById(id); if (e && e.value !== String(v)) e.value = String(v); };
    const setC = (id, v) => { const e = document.getElementById(id); if (e) e.checked = !!v; };
    set("asThreshold", а.delivery.freeThreshold);
    set("arDurations", а.rental.durations.join(","));
    set("arDaily", а.rental.daily);
    set("arDeposit", а.rental.deposit);
    set("arFine", а.rental.fine);
    set("arExtend", а.rental.allowExtend ? "тийм" : "үгүй");
    set("arExtendDays", а.rental.extendDays);
    set("arMaxDays", а.rental.maxDays);
    set("arRemind", (а.rental.remind || []).join(","));
    setC("arEnabled", а.rental.enabled);
    set("asSiteText", а.site.deliveryText);
    set("asTerms", а.site.termsVersion);
  } catch (e) {
}}
window.админТохиргооФормДүүргэх = админТохиргооФормДүүргэх;

function админМаркапТүглэх(нэр) { try { document.dispatchEvent(new CustomEvent(нэр)); } catch (e) {} }

function админЭхлүүлэх() {
  on("adminTohirgooBack", "click", () => {    try { хуудасНээх("nevtreh"); } catch (e) {}    setTimeout(() => { try { const tp = document.getElementById("tabProfail"); if (tp) tp.click(); } catch (e) {} }, 30);  });  const adminGrid = document.getElementById("adminSettingsGrid");  if (adminGrid) adminGrid.addEventListener("click", э => {    const карт = э.target.closest ? э.target.closest("[data-admin-nav]") : null;    if (!карт) return;    if (!админБайгаа()) { try { мэдэгдэл("Зөвхөн админ."); } catch (e) {} return; }    try { админТохиргооЦэсНээх(карт.getAttribute("data-admin-nav")); } catch (e) {}  });  document.addEventListener("click", э => {    const буцах = э.target.closest ? э.target.closest("[data-sec-back]") : null;    if (буцах) { try { админТохиргооНээх(); } catch (e) {} return; }    const доторНав = э.target.closest ? э.target.closest("#adminSections [data-admin-nav]") : null;    if (доторНав) {      if (!админБайгаа()) { try { мэдэгдэл("Зөвхөн админ."); } catch (e) {} return; }      try { админТохиргооЦэсНээх(доторНав.getAttribute("data-admin-nav")); } catch (e) {}      return;    }    const товч = э.target.closest ? э.target.closest("[data-admin-settings]") : null;    if (!товч) return;    if (!админБайгаа()) { try { мэдэгдэл("Зөвхөн админ."); } catch (e) {} return; }    try { хуудасНээх("adminTohirgoo"); } catch (e) {}    try { админТохиргооНээх(); } catch (e) {}  });
  // Админы профайл засах (профайл дээрх Засах товчоор шууд нээгдэнэ)  
on("adminProfailBolih", "click", () => {    const форм = document.getElementById("adminProfailForm");    if (форм) { форм.style.display = "none"; try { форм.reset(); } catch (e) {} }  });  const админПрофайлФорм = document.getElementById("adminProfailForm");  if (админПрофайлФорм) админПрофайлФорм.addEventListener("submit", э => {    э.preventDefault();    if (!админБайгаа()) { мэдэгдэл("Зөвхөн админ."); return; }    const нэр = ((document.getElementById("apNer") || {}).value || "").trim().slice(0, 40);    const албан = ((document.getElementById("apAlban") || {}).value || "").trim().slice(0, 80);    const мэйл = ((document.getElementById("apEmail") || {}).value || "").trim().slice(0, 80);    const утас = ((document.getElementById("apUtas") || {}).value || "").trim().slice(0, 20);    const ажилЭхэлсэн = ((document.getElementById("apAжилЭхэлсэн") || {}).value || "").trim().slice(0, 10);    const намтар = ((document.getElementById("apBio") || {}).value || "").trim().slice(0, 500);    if (!нэр) { мэдэгдэл("Харуулах нэрээ оруулна уу."); return; }    if (мэйл && !имэйлЗөв(мэйл)) { мэдэгдэл("Зөв и-мэйл хаяг оруулна уу."); return; }    try { localStorage.setItem("админПрофайл", JSON.stringify({ нэр: нэр, албан: албан, мэйл: мэйл, утас: утас, ажилЭхэлсэн: ажилЭхэлсэн || "2025-10-20", намтар: намтар })); }    catch (e) { мэдэгдэл("Хадгалахад алдаа гарлаа."); return; }    const форм = document.getElementById("adminProfailForm"); if (форм) { форм.style.display = "none"; try { форм.reset(); } catch (e) {} }    try { админПрофайлЗурах(); хэрэглэгчШинэчлэх(); } catch (e) {}    мэдэгдэл("Админ профайл хадгалагдлаа ✓");  });
  // --- Админ: захиалгын төлөв ---  
const админЗахиалга = document.getElementById("adminOrderList");  if (админЗахиалга) админЗахиалга.addEventListener("click", э => {    const устгах = э.target.closest("[data-admin-del]");    if (устгах) {      if (!админБайгаа()) { мэдэгдэл("Зөвхөн админ."); return; }      if (!confirm(устгах.getAttribute("data-admin-del") + " захиалгыг устгах уу?")) return;      захиалгаУстгах(устгах.getAttribute("data-admin-del"));      return;    }    const дараах = э.target.closest("[data-admin-next]");    if (дараах) {      if (!админБайгаа()) { мэдэгдэл("Зөвхөн админ."); return; }      const дугаар = дараах.getAttribute("data-admin-next");      const одоо = захиалгаЖагсаалтАвах().find(з => з.дугаар === дугаар);      const одооШат = одоо ? захиалгаТөлөв(одоо.огноо, одоо.дугаар, одоо) : 0;      if (одооШат >= 2) { мэдэгдэл("Захиалга аль хэдийн хүргэгдсэн."); return; }      if (!админСтатусСолих(дугаар, одооШат + 1)) { мэдэгдэл("Захиалга олдсонгүй."); return; }      админЗурах();      try { профайлЗурах(); } catch (e) {}      if (одооШат + 1 === 2) мэдэгдэл(дугаар + " хүргэгдлээ ✓ Хэрэглэгчид мэдэгдэл очлоо.");      else мэдэгдэл(дугаар + " → " + ЗАХИАЛГА_ШАТ[одооШат + 1] + " боллоо ✓");      return;    }    const б = э.target.closest("[data-admin-id]");    if (б) {      const нэв = нэвтэрсэнАвах();      if (!нэв || нэв.role !== "admin") { мэдэгдэл("Зөвхөн админ өөрчилж болно."); return; }      const дугаар = б.getAttribute("data-admin-id");      const шат = Number(б.getAttribute("data-admin-stage"));      if (!админСтатусСолих(дугаар, шат)) { мэдэгдэл("Захиалга олдсонгүй."); return; }      админЗурах();      try { профайлЗурах(); } catch (e) {}      if (шат === 2) мэдэгдэл(дугаар + " хүргэгдлээ ✓ Хэрэглэгчид мэдэгдэл очлоо.");      else if (тохиргооАвах().orderNotify) мэдэгдэл(дугаар + " → " + ЗАХИАЛГА_ШАТ[шат] + " боллоо ✓");      else мэдэгдэл("Захиалга " + ЗАХИАЛГА_ШАТ[шат] + " боллоо.");      return;    }    const детайл = э.target.closest(".admin-ord .z-dugaar, .admin-ord .z-ognoo");    if (детайл) {      const карт = э.target.closest(".admin-ord");      const д = карт ? карт.querySelector(".z-details") : null;      if (д) д.style.display = д.style.display === "none" ? "block" : "none";    }  });  on("adminOrderHailt", "input", () => { try { админЗурах(); } catch (e) {} });  on("adminOrderFilter", "change", () => { try { админЗурах(); } catch (e) {} });  on("adminOrderRefresh", "click", () => { try { админЗурах(); профайлЗурах(); } catch (e) {} мэдэгдэл("Захиалгын жагсаалт шинэчлэгдлээ."); });  const админЗурвасЖагс = document.getElementById("adminMsgList");  if (админЗурвасЖагс) админЗурвасЖагс.addEventListener("click", async э => {    const б = э.target.closest("[data-msg-del]");    if (!б) return;    if (!админБайгаа()) { мэдэгдэл("Зөвхөн админ."); return; }    const утга = б.getAttribute("data-msg-del");    const токен = админТокенАвах();    let серверт = false;    if (токен) {      try { const хариу = await fetch("/api/zurvas/" + encodeURIComponent(утга), { method: "DELETE", headers: { "Authorization": "Bearer " + токен } }); серверт = хариу.ok; } catch (e) {}    }    if (!серверт) {      let бүх = холбооЗурвасАвах().slice().sort((a, b) => new Date(b.огноо) - new Date(a.огноо));      const индекс = Number(утга);      if (!isNaN(индекс) && String(индекс) === утга) бүх.splice(индекс, 1);      else бүх = бүх.filter(м => м.id !== утга);      try { localStorage.setItem("holbooZurvas", JSON.stringify(бүх)); } catch (e) {}    }    админЗурвасЗурах();    мэдэгдэл("Зурвас устгагдлаа.");  });  on("adminMsgRefresh", "click", () => { админЗурвасЗурах(); мэдэгдэл("Зурвас шинэчлэгдлээ."); });  const админХэрэглэгчЖагс = document.getElementById("adminUserList");  if (админХэрэглэгчЖагс) админХэрэглэгчЖагс.addEventListener("click", э => {    const мөр = э.target.closest ? э.target.closest("[data-huser]") : null;    if (!мөр) return;    if (!админБайгаа()) { мэдэгдэл("Зөвхөн админ."); return; }    const мэйл = мөр.getAttribute("data-huser");    const дэлгэр = админХэрэглэгчЖагс.querySelector('[data-hudetail="' + мэйл + '"]');    if (!дэлгэр) return;    if (дэлгэр.style.display !== "none" && дэлгэр.innerHTML) { дэлгэр.style.display = "none"; дэлгэр.innerHTML = ""; return; }    try { дэлгэр.innerHTML = хэрэглэгчДэлгэрэнгүйHtml(мэйл); } catch (e) { дэлгэр.innerHTML = ""; }    дэлгэр.style.display = "block";  });  on("adminMsgClear", "click", async () => {    if (!админБайгаа()) { мэдэгдэл("Зөвхөн админ."); return; }    if (!confirm("Бүх зурвасыг устгах уу?")) return;    const токен = админТокенАвах();    let серверт = false;    if (токен) {      try { const хариу = await fetch("/api/zurvas", { method: "DELETE", headers: { "Authorization": "Bearer " + токен } }); серверт = хариу.ok; } catch (e) {}    }    if (!серверт) { try { localStorage.setItem("holbooZurvas", "[]"); } catch (e) {} }    админЗурвасЗурах();    мэдэгдэл("Бүх зурвас устгагдлаа.");  });  
// Админ панел нээлттэй байх үед шинэ зурвасыг 20 сек тутам шалгана  
setInterval(() => {    try {      const панел = document.getElementById("adminPanel");      if (панел && панел.style.display !== "none" && админБайгаа() && админТокенАвах()) админЗурвасЗурах();    } catch (e) {}  }, 20000);
  // --- Админ: хэрэглэгч устгах + хайлт ---
const админUserЖагс = document.getElementById("adminUserList");
if (админUserЖагс) админUserЖагс.addEventListener("click", э => {
  const устгах = э.target.closest("[data-user-del]");
  if (устгах) {
    э.stopPropagation();
    хэрэглэгчУстгах(устгах.getAttribute("data-user-del"));
    return;
  }
});
on("adminUserHailt", "input", () => { try { админХэрэглэгчЗурах(захиалгаЖагсаалтАвах()); } catch (e) {} });
  // --- Админ: ном нэмэх/засах ---  
const админФорм = document.getElementById("adminNomForm");  if (админФорм) админФорм.addEventListener("submit", э => {    э.preventDefault();    if (!админБайгаа()) { мэдэгдэл("Зөвхөн админ нэмэж болно."); return; }    const ав = id => { const x = document.getElementById(id); return x ? x.value.trim() : ""; };    const т = {      uid: "c" + Date.now().toString(36) + Math.floor(Math.random() * 1e6),      title: ав("anTitle"), author: ав("anAuthor"),      price: Number((document.getElementById("anPrice") || {}).value) || 0,      category: ав("anCategory") || "Уран зохиол", topic: ав("anTopic") || "Амьдрал",      language: ав("anLang") || "Монгол хэл",      stock: Number((document.getElementById("anStock") || {}).value) || 0,      pages: Number((document.getElementById("anPages") || {}).value) || 200,      year: 2026, age: "Бүх нас", desc: ав("anDesc")    };    if (!т.title || !т.author || !т.price) { мэдэгдэл("Нэр, зохиолч, үнэ заавал."); return; }    const customs = захиалгатУнших("customBooks", []);    customs.push(т);    try { localStorage.setItem("customBooks", JSON.stringify(customs)); } catch (e) {}    номнууд.push(захиалгатНомБүтээх(т, Math.max(...номнууд.map(n => n.id)) + 1));    админФорм.reset();    номЖагсаалтСэргээх();    try { ангилалСонголтДүүргэх(); зохиолчСаналуудДүүргэх(); ангилалЗурах(); админЗохиолчЗурах(); } catch (e) {}    мэдэгдэл("«" + т.title + "» нэмэгдлээ.");  });  on("adminNomHailt", "input", э => админНомЗурах(э.target.value));  const админНомЖагс = document.getElementById("adminNomList");  if (админНомЖагс) админНомЖагс.addEventListener("click", э => {    const б = э.target.closest("[data-abtn]");    if (!б) return;    if (!админБайгаа()) { мэдэгдэл("Зөвхөн админ."); return; }    const id = Number(б.dataset.aid);    const н = window.НомАвах(id);    if (!н) return;    const үйлдэл = б.dataset.abtn;    if (үйлдэл === "ustgah") { номУстгах(id); return; }    if (үйлдэл === "stockMinus" || үйлдэл === "stockPlus") {      const input = document.querySelector('[data-an-stock="' + id + '"]');      if (input) {        let в = Number(input.value) || 0;        в = үйлдэл === "stockPlus" ? в + 1 : Math.max(0, в - 1);        input.value = в;      }      return;    }    if (үйлдэл === "best") {      const одоо = захиалгатУнших("adminBest", null);      try { localStorage.setItem("adminBest", JSON.stringify(одоо === id ? null : id)); } catch (e) {}      номЖагсаалтСэргээх();      мэдэгдэл(одоо === id ? "Best болиуллаа." : "«" + н.title + "» Best боллоо.");      return;    }    if (үйлдэл === "sanal") {      let рек = захиалгатУнших("adminRec", []);      рек = рек.includes(id) ? рек.filter(x => x !== id) : [...рек, id].slice(0, 10);      try { localStorage.setItem("adminRec", JSON.stringify(рек)); } catch (e) {}      номЖагсаалтСэргээх();      мэдэгдэл(рек.includes(id) ? "Санал болгоход нэмлээ." : "Саналаас хаслаа.");      return;    }    if (үйлдэл === "hadgalah") {      const кат = document.querySelector('[data-an-cat="' + id + '"]');      const үн = document.querySelector('[data-an-price="' + id + '"]');      const үлд = document.querySelector('[data-an-stock="' + id + '"]');      н.category = кат ? кат.value : н.category;      н.price = үн ? (Number(үн.value) || 0) : н.price;      н.stock = Math.max(0, үлд ? Number(үлд.value) : н.stock);      const зассан = захиалгатУнших("bookEdit", {});      const х = зассан[id] || {};      х.category = н.category; х.price = н.price; х.stock = н.stock;      зассан[id] = х;      if (н.uid) зассан[н.uid] = { category: н.category, price: н.price, stock: н.stock };      try { localStorage.setItem("bookEdit", JSON.stringify(зассан)); } catch (e) {}      try { үлдэгдэлХадгалах(н); } catch (e) {}      н.image = хавтасЗурах(н.title, н.author, н.category, н.өнгө1, н.өнгө2, н.id % 4);      номЖагсаалтСэргээх();      мэдэгдэл("«" + н.title + "» шинэчлэгдлээ (үлдэгдэл: " + н.stock + ").");    }  });  on("adminBestTseverleh", "click", () => { try { localStorage.setItem("adminBest", "null"); } catch (e) {} номЖагсаалтСэргээх(); });  on("adminRecTseverleh", "click", () => { try { localStorage.setItem("adminRec", "[]"); } catch (e) {} номЖагсаалтСэргээх(); });
  // Админ: хүргэлтийн тохиргооны формууд  
const хотФорм = document.getElementById("adminCityForm");  if (хотФорм) хотФорм.addEventListener("submit", э => {    э.preventDefault();    if (!админБайгаа()) { мэдэгдэл("Зөвхөн админ."); return; }    const нэр = ((document.getElementById("acName") || {}).value || "").trim();    const үнэ = Number((document.getElementById("acFee") || {}).value);    if (!нэр || !(үнэ >= 0)) { мэдэгдэл("Хотын нэр, үнэ зөв оруулна уу."); return; }    const а = админТохиргооАвах();    if (а.delivery.cities.some(c => c.name === нэр)) { мэдэгдэл("Энэ хот аль хэдийн байна."); return; }    а.delivery.cities.push({ name: нэр, fee: үнэ, enabled: true });    if (админТохиргооХадгалах({ delivery: а.delivery })) {      хотФорм.reset();      админХүргэлтЗурах();      try { хүргэлтМэдээлэлШинэчлэх(); } catch (e) {}      мэдэгдэл("«" + нэр + "» нэмэгдлээ.");    }  });  const босгоФорм = document.getElementById("adminShipForm");  if (босгоФорм) босгоФорм.addEventListener("submit", э => {    э.preventDefault();    if (!админБайгаа()) { мэдэгдэл("Зөвхөн админ."); return; }    const а = админТохиргооАвах();    а.delivery.freeThreshold = Math.max(0, Number((document.getElementById("asThreshold") || {}).value) || 0);    const сонгосон = [];    document.querySelectorAll("[data-free-city]").forEach(inp => { if (inp.checked) сонгосон.push(inp.getAttribute("data-free-city")); });    а.delivery.freeCities = сонгосон.filter(n => а.delivery.cities.some(c => c.name === n));    if (админТохиргооХадгалах({ delivery: а.delivery })) {      админХүргэлтЗурах();      try { хүргэлтМэдээлэлШинэчлэх(); } catch (e) {}      try { худалдахТооцоо(); } catch (e) {}      мэдэгдэл("Хүргэлтийн тохиргоо хадгалагдлаа ✓ Нүүр болон тооцоо шинэчлэгдлээ.");    }  });  
// Админ: түрээсийн тохиргоо  
const түрээсТохиргооФорм = document.getElementById("adminRentForm");  if (түрээсТохиргооФорм) түрээсТохиргооФорм.addEventListener("submit", э => {    э.preventDefault();    if (!админБайгаа()) { мэдэгдэл("Зөвхөн админ."); return; }    const ав = id => { const x = document.getElementById(id); return x ? x.value : ""; };    const авЧ = id => { const x = document.getElementById(id); return x ? x.checked : false; };    const hug = ав("arDurations").split(",").map(v => Number(v.trim())).filter(v => v > 0).slice(0, 6);    if (!hug.length) { мэдэгдэл("Хугацааны сонголт зөв оруулна уу (ж: 7,14,30)."); return; }    const а = админТохиргооАвах();    а.rental.enabled = авЧ("arEnabled");    а.rental.durations = hug;    а.rental.daily = Math.max(0, Number(ав("arDaily")) || 0);    а.rental.deposit = Math.max(0, Number(ав("arDeposit")) || 0);    а.rental.fine = Math.max(0, Number(ав("arFine")) || 0);    а.rental.allowExtend = ав("arExtend") !== "үгүй";    а.rental.extendDays = Math.max(1, Number(ав("arExtendDays")) || 7);    а.rental.maxDays = Math.max(а.rental.extendDays, Number(ав("arMaxDays")) || 60);    а.rental.remind = ав("arRemind").split(",").map(v => Number(v.trim())).filter(v => v >= 0).slice(0, 5);    if (админТохиргооХадгалах({ rental: а.rental })) {      try { хэрэглэгчТүрээсХураангуй(); } catch (e) {}      try { админТүрээсЗурах(); } catch (e) {}      мэдэгдэл("Түрээсийн тохиргоо хадгалагдлаа ✓");    }  });  
// Админ: сайтын тохиргоо  
const сайтФорм = document.getElementById("adminSiteForm");  if (сайтФорм) сайтФорм.addEventListener("submit", э => {    э.preventDefault();    if (!админБайгаа()) { мэдэгдэл("Зөвхөн админ."); return; }    const а = админТохиргооАвах();    const текст = ((document.getElementById("asSiteText") || {}).value || "").trim();    const хувилбар = ((document.getElementById("asTerms") || {}).value || "").trim();    if (текст) а.site.deliveryText = текст;    if (хувилбар) а.site.termsVersion = хувилбар;    if (админТохиргооХадгалах({ site: а.site })) {      try { хүргэлтМэдээлэлШинэчлэх(); } catch (e) {}      мэдэгдэл("Сайтын тохиргоо хадгалагдлаа ✓");    }  });  
// Админ: ангилал удирдах  
const ангилалФорм = document.getElementById("adminAngilalForm");  if (ангилалФорм) ангилалФорм.addEventListener("submit", э => {    э.preventDefault();    if (!админБайгаа()) { мэдэгдэл("Зөвхөн админ."); return; }    const нэр = ((document.getElementById("anAngilalNer") || {}).value || "").trim().slice(0, 30);    if (!нэр) { мэдэгдэл("Ангиллын нэр оруулна уу."); return; }    const багц = ангилалБүхАвах();    if (нэр in багц) { мэдэгдэл("«" + нэр + "» ангилал аль хэдийнэ байна."); return; }    try {      let custom = JSON.parse(localStorage.getItem("customAngilal") || "[]");      if (!Array.isArray(custom)) custom = [];      custom.push(нэр);      localStorage.setItem("customAngilal", JSON.stringify(custom));    } catch (e) { мэдэгдэл("Хадгалахад алдаа гарлаа."); return; }    try { ангилалФорм.reset(); } catch (e) {}    try { ангилалСонголтДүүргэх(); ангилалЗурах(); } catch (e) {}    мэдэгдэл("«" + нэр + "» ангилал нэмэгдлээ.");  });  const ангилалЖагс = document.getElementById("adminAngilalList");  if (ангилалЖагс) ангилалЖагс.addEventListener("click", э => {    if (!админБайгаа()) { мэдэгдэл("Зөвхөн админ."); return; }    const б = э.target.closest("[data-cat-edit],[data-cat-save],[data-cat-cancel],[data-cat-del]");    if (!б) return;    if (б.hasAttribute("data-cat-edit")) { засажБуйАнгилал = б.getAttribute("data-cat-edit"); try { ангилалЗурах(); } catch (e) {} return; }    if (б.hasAttribute("data-cat-cancel")) { засажБуйАнгилал = null; try { ангилалЗурах(); } catch (e) {} return; }    if (б.hasAttribute("data-cat-save")) {      const хуучин = б.getAttribute("data-cat-save");      const оролт = document.getElementById("adminAngilalEditInput");      const шинэ = оролт ? оролт.value : "";      const тоо = ангилалНэрСолих(хуучин, шинэ);      if (тоо === false) return;      засажБуйАнгилал = null;      try { номЖагсаалтСэргээх(); ангилалСонголтДүүргэх(); ангилалЗурах(); админЗурах(); } catch (e) {}      мэдэгдэл("«" + хуучин + "» → «" + String(шинэ).trim() + "» болголоо (" + тоо + " ном).");      return;    }    if (б.hasAttribute("data-cat-del")) {      const нэр = б.getAttribute("data-cat-del");      const багц = ангилалБүхАвах();      const тоо = багц[нэр] || 0;      let шилжүүлэх = null;      if (тоо > 0) {        const сонголт = ангилалЖагс.querySelector('[data-cat-move="' + нэр.replace(/"/g, "") + '"]');        шилжүүлэх = сонголт ? сонголт.value : null;        if (!шилжүүлэх || шилжүүлэх === нэр) { мэдэгдэл("Эхлээд номнуудыг шилжүүлэх ангиллаа сонгоно уу."); return; }        if (!confirm("«" + нэр + "»-ийн " + тоо + " номыг «" + шилжүүлэх + "» руу шилжүүлж, ангиллыг устгах уу?")) return;        номнууд.forEach(n => { if (String(n.category) === нэр) номТалбарХадгалах(n, { category: шилжүүлэх }); });      } else {        if (!confirm("«" + нэр + "» ангиллыг устгах уу?")) return;      }      try {        let custom = JSON.parse(localStorage.getItem("customAngilal") || "[]");        if (!Array.isArray(custom)) custom = [];        localStorage.setItem("customAngilal", JSON.stringify(custom.filter(к => к !== нэр)));      } catch (e) {}      try { номЖагсаалтСэргээх(); ангилалСонголтДүүргэх(); ангилалЗурах(); админЗурах(); } catch (e) {}      мэдэгдэл("«" + нэр + "» ангилал устгагдлаа.");    }  });  
// Админ: зохиолч удирдах  
const зохиолчНэмэхФорм = document.getElementById("adminZohiolchForm");  if (зохиолчНэмэхФорм) зохиолчНэмэхФорм.addEventListener("submit", э => {    э.preventDefault();    if (!админБайгаа()) { мэдэгдэл("Зөвхөн админ."); return; }    const нэр = ((document.getElementById("anZohiolchNer") || {}).value || "").trim().slice(0, 60);    if (!нэр) { мэдэгдэл("Зохиолчийн нэр оруулна уу."); return; }    const багц = зохиолчСтатАвах();    if (нэр in багц) { мэдэгдэл("«" + нэр + "» зохиолч аль хэдийнэ байна."); return; }    try {      let custom = JSON.parse(localStorage.getItem("customZohiolch") || "[]");      if (!Array.isArray(custom)) custom = [];      custom.push(нэр);      localStorage.setItem("customZohiolch", JSON.stringify(custom));    } catch (e) { мэдэгдэл("Хадгалахад алдаа гарлаа."); return; }    try { зохиолчНэмэхФорм.reset(); } catch (e) {}    try { зохиолчСаналуудДүүргэх(); админЗохиолчЗурах(); } catch (e) {}    мэдэгдэл("«" + нэр + "» зохиолч нэмэгдлээ. Ном нэмэхдээ сонгоно уу.");  });  const зохиолчЖагс = document.getElementById("adminZohiolchList");  if (зохиолчЖагс) зохиолчЖагс.addEventListener("click", э => {    if (!админБайгаа()) { мэдэгдэл("Зөвхөн админ."); return; }    const б = э.target.closest("[data-zoh-edit],[data-zoh-save],[data-zoh-cancel],[data-zoh-del]");    if (!б) return;    if (б.hasAttribute("data-zoh-edit")) { засажБуйЗохиолч = б.getAttribute("data-zoh-edit"); try { админЗохиолчЗурах(); } catch (e) {} return; }    if (б.hasAttribute("data-zoh-cancel")) { засажБуйЗохиолч = null; try { админЗохиолчЗурах(); } catch (e) {} return; }    if (б.hasAttribute("data-zoh-save")) {      const хуучин = б.getAttribute("data-zoh-save");      const оролт = document.getElementById("adminZohiolchEditInput");      const шинэ = оролт ? оролт.value : "";      const тоо = зохиолчНэрСолих(хуучин, шинэ);      if (тоо === false) return;      засажБуйЗохиолч = null;      try { номЖагсаалтСэргээх(); зохиолчСаналуудДүүргэх(); админЗохиолчЗурах(); админЗурах(); } catch (e) {}      мэдэгдэл("«" + хуучин + "» → «" + String(шинэ).trim() + "» болголоо (" + тоо + " ном).");      return;    }    if (б.hasAttribute("data-zoh-del")) {      const нэр = б.getAttribute("data-zoh-del");      const багц = зохиолчСтатАвах();      const тоо = багц[нэр] || 0;      if (тоо > 0) {        if (!confirm("«" + нэр + "»-ийн " + тоо + " номыг бүгдийг нь устгах уу?")) return;        номнууд.filter(n => String(n.author) === нэр).map(n => n.id).forEach(id => { try { номУстгах(id); } catch (e) {} });      } else {        if (!confirm("«" + нэр + "» зохиолчийг устгах уу?")) return;        try {          let custom = JSON.parse(localStorage.getItem("customZohiolch") || "[]");          if (!Array.isArray(custom)) custom = [];          localStorage.setItem("customZohiolch", JSON.stringify(custom.filter(з => з !== нэр)));        } catch (e) {}      }      try { номЖагсаалтСэргээх(); зохиолчСаналуудДүүргэх(); админЗохиолчЗурах(); админЗурах(); } catch (e) {}      мэдэгдэл("«" + нэр + "» устгагдлаа.");    }  });  
// Админ: түрээсийн жагсаалт  
const түрээсАдминЖагс = document.getElementById("rentList");  if (түрээсАдминЖагс) түрээсАдминЖагс.addEventListener("click", э => {    const дэлгэр = э.target.closest(".admin-rent .z-dugaar, .admin-rent .z-ognoo");    const б = э.target.closest("[data-radmin]");    if (б) { админТүрээсҮйлдэл(б.getAttribute("data-radmin"), б.getAttribute("data-id")); return; }    if (дэлгэр) {      const карт = э.target.closest(".admin-rent");      const д = карт ? карт.querySelector(".z-details") : null;      if (д) д.style.display = д.style.display === "none" ? "block" : "none";    }  });  ["rentHailt", "rentDate"].forEach(id => { on(id, "input", () => { try { админТүрээсЗурах(); } catch (e) {} }); });  on("rentFilter", "change", () => { try { админТүрээсЗурах(); } catch (e) {} });  on("rentRefresh", "click", () => { try { админТүрээсЗурах(); } catch (e) {} мэдэгдэл("Түрээсийн жагсаалт шинэчлэгдлээ."); });  
// Админ зураглалд шинэ хэсгүүдийг залгах  
алхам(() => { if (админБайгаа()) { try { админХүргэлтЗурах(); } catch (e) {} try { админТохиргооФормДүүргэх(); } catch (e) {} try { админТүрээсЗурах(); } catch (e) {} } });  алхам(() => { try { хүргэлтМэдээлэлШинэчлэх(); } catch (e) {} });  алхам(() => { try { хэрэглэгчТүрээсХураангуй(); } catch (e) {} });  алхам(() => { try { түрээсСануулгаШалгах(); } catch (e) {} });}
window.админЭхлүүлэх = админЭхлүүлэх;
document.addEventListener("DOMContentLoaded", () => {
  (window.__админМаркапБэлэн || Promise.resolve()).then(() => { try { window.админЭхлүүлэх(); } catch (e) {} });
});
