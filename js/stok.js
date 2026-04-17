const URUTAN_PRODUK = [
  "Roti Balok",
  "Cokelat Cream",
  "Vanilla Cream",
  "Tiramisu Cream",
  "Greentea Cream",
  "Strawberry Cream",
  "Choco Crunchy",
  "Keju Cheddar",
  "Cookies Crumb",
  "Caramel Crumb",
  "Red Velvet Crumb",
  "Matcha Crumb",
  "Peanuts Crumb",
  "Chocolate Powder",
  "Milo Powder",
  "Vanilla Latte Powder",
  "Cappuccino Powder",
  "Taro Powder",
  "Red Velvet Powder",
  "Greentea Powder",
  "Blackcurrant Powder",
  "Lemon Tea Powder",
  "Kertas Cokelat",
  "Kresek Roti",
  "Tisu Garpu",
  "Kresek 1 Cup",
  "Kresek 2 Cup",
  "Sedotan Es",
  "Kertas Struk",
  "Air Galon",
  "Gas LPG",
  "Cup Ice",
  "Minyak Crunchy",
  "Minyak Kelapa"
];

import {
  db,
  collection,
  doc,
  onSnapshot,
  setDoc,
  getDocs
} from "./firebase.js";

const container = document.getElementById("stokContainer");

let produkData = {};
let draftData = {};
let activeCardId = null;



let unsubProduk = null;
let unsubDraft = null;

// =========================
// LOAD PRODUK
// =========================
function loadProduk() {
  if (unsubProduk) unsubProduk();

  unsubProduk = onSnapshot(collection(db, "produk"), (snapshot) => {
    produkData = {};

    snapshot.forEach((d) => {
      produkData[d.id] = d.data();
    });

    renderAll();
  });
}

// =========================
// LOAD DRAFT
// =========================
function loadDraft() {
  if (unsubDraft) unsubDraft();

  unsubDraft = onSnapshot(collection(db, "stok_draft"), (snapshot) => {
    draftData = {};

    snapshot.forEach((d) => {
      draftData[d.id] = d.data();
    });

    renderAll();
  });
}

loadProduk();
loadDraft();

// =========================
// RENDER ALL
// =========================
function renderAll() {
  container.innerHTML = "";

  const sortedIds = Object.keys(produkData).sort((a, b) => {
    const namaA = produkData[a].nama;
    const namaB = produkData[b].nama;

    const indexA = URUTAN_PRODUK.indexOf(namaA);
    const indexB = URUTAN_PRODUK.indexOf(namaB);

    const safeA = indexA === -1 ? 999 : indexA;
    const safeB = indexB === -1 ? 999 : indexB;

    return safeA - safeB;
  });

    sortedIds.forEach((id) => {
      const p = produkData[id];
      const d = draftData[id] ?? {};
      const h = hitung(p, d);

      // 🔍 search filter
    if (!p.nama.toLowerCase().includes((searchKeyword || "").toLowerCase())) return;
      // 🔥 filter stok merah
      const isLowStock =
        (p.stokMinimal ?? 0) > 0 && h.total < p.stokMinimal;

      if (filterMode && !isLowStock) return;
      renderCard(id, p);
    });

  if (activeCardId) {
    const el = document.querySelector(`.stok-card[data-id="${activeCardId}"]`);
    if (el) el.classList.add("active");
  }
}

// =========================
// HITUNG STOK + NILAI
// =========================
function hitung(p, d = {}) {
  const outlet = (d.stokOutlet ?? p.stokOutlet ?? 0);
  const koma   = (d.stokKoma ?? p.stokKoma ?? 0);
  const gudang = (d.stokGudang ?? p.stokGudang ?? 0);

  const total = outlet + koma + gudang;
  const request = Math.max(0, (p.stokMinimal ?? 0) - total);

  const totalNilai = total * (p.harga ?? 0);

  return { outlet, koma, gudang, total, request, totalNilai };
}

// =========================
// RENDER CARD
// =========================
function renderCard(id, p) {
  const d = draftData[id] ?? {};
  const h = hitung(p, d);

function formatAngka(n) {
  return Number.isInteger(n)
    ? n
    : n.toLocaleString("id-ID", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      });
}

  
  const card = document.createElement("div");
  card.className = "stok-card";
  card.dataset.id = id;

card.innerHTML = `
  <div class="stok-header" onclick="toggleCard(this)">

    <!-- BARIS 1 -->
    <div class="stok-top">
      <div class="stok-left-top">
        <h3>${p.nama}</h3>
      </div>

      <div class="stok-right-top ${
        (p.stokMinimal ?? 0) > 0 && h.total < p.stokMinimal
          ? 'stok-warning'
          : ''
      }">
        ${formatAngka(h.total)} 
        </div>
    </div>

    <!-- BARIS 2 -->
    <div class="stok-mid">
      <div>${p.gramasi ?? "-"}</div>
      <div>${p.satuan ?? "-"}</div>
    </div>

    <!-- BARIS 3 -->
    <div class="stok-price-row">
      <div>Rp ${(p.harga ?? 0).toLocaleString("id-ID")}</div>
      <div>Rp ${Math.round(h.totalNilai).toLocaleString("id-ID")}</div>
    </div>

  </div>

    <!-- DETAIL (BISA BUKA / TUTUP) -->
    <div class="stok-body" onclick="event.stopPropagation()">

      <div class="stok-summary">
        <span>Stok Outlet</span>
        <div class="qty-control">
          <button onclick="change('${id}','stokOutlet',-1)">-</button>
          <input value="${h.outlet}" readonly>
          <button onclick="change('${id}','stokOutlet',1)">+</button>
        </div>
      </div>

      <div class="stok-summary">
        <span>Stok Koma</span>
        <div class="qty-control">
          <button onclick="change('${id}','stokKoma',-0.1)">-</button>
            <input value="${formatAngka(h.koma)}" readonly>
          <button onclick="change('${id}','stokKoma',0.1)">+</button>
        </div>
      </div>

      <div class="stok-summary">
        <span>Stok Gudang</span>
        <div class="qty-control">
          <button onclick="change('${id}','stokGudang',-1)">-</button>
          <input value="${h.gudang}" readonly>
          <button onclick="change('${id}','stokGudang',1)">+</button>
        </div>
      </div>

      <hr/>

      <div class="stok-summary">
        <span>Stok Minimal</span>
        <strong>${p.stokMinimal ?? 0}</strong>
      </div>

      <div class="stok-summary">
        <span>Stok Request</span>
        <strong>${formatAngka(h.request)}</strong>
      </div>

      <div class="stok-summary">
        <span>Total Nilai</span>
        <strong>Rp ${Math.round(h.totalNilai).toLocaleString("id-ID")}</strong>
      </div>

      <button onclick="updateStok('${id}')" class="stok-save">
        🔥 Update Stok
      </button>

    </div>
  `;

  container.appendChild(card);
}





// =========================
// CHANGE STOK
// =========================
window.change = function (id, field, delta) {
  const p = produkData[id];

  if (!draftData[id]) {
    draftData[id] = {
      stokOutlet: p.stokOutlet ?? 0,
      stokKoma: p.stokKoma ?? 0,
      stokGudang: p.stokGudang ?? 0
    };
  }

  let current = draftData[id][field] ?? p[field] ?? 0;
  let next = current + delta;

  if (field === "stokKoma") {
    next = Math.round(next * 10) / 10;
  }

  if (next < 0) next = 0;

  draftData[id][field] = next;

  activeCardId = id;
  renderAll();
};

// =========================
// UPDATE STOK KE FIRESTORE
// =========================
window.updateStok = async function (id) {
  const p = produkData[id];
  const d = draftData[id];

  const updated = {
    stokOutlet: d.stokOutlet ?? p.stokOutlet ?? 0,
    stokKoma: d.stokKoma ?? p.stokKoma ?? 0,
    stokGudang: d.stokGudang ?? p.stokGudang ?? 0,
  };

  await setDoc(doc(db, "produk", id), {
    ...p,
    ...updated
  });

  await setDoc(doc(db, "stok_draft", id), updated);

  showToast("🔥 Stok berhasil diupdate");

  // 🔥 TAMBAHAN INI (auto tutup card)
  const card = document.querySelector(`.stok-card[data-id="${id}"]`);
  if (card) {
    card.classList.remove("active");
  }

  activeCardId = null;
};

// =========================
// TOGGLE CARD
// =========================
window.toggleCard = function (el) {
  const card = el.parentElement;
  const id = card.dataset.id;

  if (card.classList.contains("active")) {
    card.classList.remove("active");
    activeCardId = null;
  } else {
    document.querySelectorAll(".stok-card").forEach(c => c.classList.remove("active"));
    card.classList.add("active");
    activeCardId = id;
  }
};

// =========================
// SIMPAN HARIAN
// =========================
window.simpanHarian = async function () {
  const snap = await getDocs(collection(db, "produk"));

  const today = new Date().toISOString().slice(0, 10);
  const batch = [];

  snap.forEach((docSnap) => {
    const data = docSnap.data();

    const total = (data.stokOutlet ?? 0) + (data.stokKoma ?? 0) + (data.stokGudang ?? 0);

    batch.push(
      setDoc(doc(db, "stok_harian", today, "items", docSnap.id), {
        nama: data.nama ?? "",
        harga: data.harga ?? 0,
        satuan: data.satuan ?? "",
        stokOutlet: data.stokOutlet ?? 0,
        stokKoma: data.stokKoma ?? 0,
        stokGudang: data.stokGudang ?? 0,
        stokMinimal: data.stokMinimal ?? 0,
        total,
        totalNilai: total * (data.harga ?? 0),
        timestamp: new Date().toISOString()
      })
    );
  });

  await Promise.all(batch);

  showToast(`Stok Tersimpan: ${today}`);
};




function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.innerText = msg;

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}






window.importCSV = async function (file) {
  if (!file) {
    alert("Pilih file dulu");
    return;
  }

  const text = await file.text();
  const rows = text.split("\n").slice(1);

  const batch = [];

  rows.forEach((row) => {
    if (!row.trim()) return;

    const cols = row.split(/[,;]+/).map(v => v.trim());
    const [id, nama, satuan, gramasi, harga, stokMinimal] = cols;

    console.log("ROW:", cols);

    batch.push(
      setDoc(doc(db, "produk", id), {
        nama,
        satuan,
        gramasi,
        harga: Number(harga) || 0,

        stokOutlet: 0,
        stokKoma: 0,
        stokGudang: 0,

        stokMinimal: Number(stokMinimal) || 0,
        stokRequest: 0
      })
    );
  });

  await Promise.all(batch);

  alert("✅ Import CSV berhasil");
};






let searchKeyword = "";

window.handleSearch = function (val) {
  searchKeyword = val.toLowerCase();
  renderAll();
};






// =========================
// TOGGLE
// =========================
window.toggleCalculator = function () {
  const el = document.getElementById("calculator");
  el.classList.toggle("show");
};

// =========================
// CALC LOGIC
// =========================
let calcValue = "";

// =========================
// UPDATE DISPLAY (FORMAT ID)
// =========================
function updateDisplay() {
  const display = document.getElementById("calcDisplay");

  if (!calcValue) {
    display.value = "";
    return;
  }

  // kalau ada koma di belakang (contoh: "8.")
  if (calcValue.endsWith(".")) {
    const numberPart = calcValue.slice(0, -1);

    if (!isNaN(numberPart)) {
      display.value = Number(numberPart).toLocaleString("id-ID") + ",";
    } else {
      display.value = calcValue.replace(".", ",");
    }

    return;
  }

  let number = Number(calcValue);

  if (!isNaN(number)) {
    display.value = number.toLocaleString("id-ID");
  } else {
    display.value = calcValue.replace(/\./g, ",");
  }
}



// =========================
// INPUT
// =========================
window.calcInput = function (val) {
  if (val === ",") val = ".";
  calcValue += val;
  updateDisplay();
};

// =========================
// CLEAR
// =========================
window.calcClear = function () {
  calcValue = "";
  updateDisplay();
};

// =========================
// DELETE
// =========================
window.calcDelete = function () {
  calcValue = calcValue.slice(0, -1);
  updateDisplay();
};

// =========================
// EQUAL
// =========================
window.calcEqual = function () {
  try {
    calcValue = eval(calcValue).toString();
    updateDisplay();
  } catch {
    document.getElementById("calcDisplay").value = "Error";
  }
};

// =========================
// PERCENT
// =========================
window.calcPercent = function () {
  try {
    calcValue = (eval(calcValue) / 100).toString();
    updateDisplay();
  } catch {
    document.getElementById("calcDisplay").value = "Error";
  }
};


let filterMode = false; // false = normal, true = hanya stok merah

window.toggleFilter = function () {
  filterMode = !filterMode;

  const icon = document.querySelector(".filter-icon");
  icon.classList.toggle("active");

  renderAll();
};
