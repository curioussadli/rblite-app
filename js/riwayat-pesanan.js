import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  query,
  orderBy,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// =====================================================
// 🔐 DOM
// =====================================================
const listEl = document.getElementById("riwayatList");
const inputTanggal = document.getElementById("filterTanggal");

// =====================================================
// 📅 TANGGAL HARI INI
// =====================================================
const now = new Date();
const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  .toISOString()
  .slice(0, 10);
// set default ke hari ini
if (inputTanggal) {
  inputTanggal.value = today;
}

let allData = [];

// =====================================================
// 🔄 REALTIME
// =====================================================
const q = query(
  collection(db, "penjualan"),
  orderBy("createdAt", "desc")
);

onSnapshot(q, (snapshot) => {

  allData = [];

  snapshot.forEach(docSnap => {
    const data = docSnap.data();

    allData.push({
      id: docSnap.id,
      ...data
    });
  });

  renderData();
});

// =====================================================
// 🎯 RENDER FUNCTION (PAKAI FILTER)
// =====================================================
function renderData() {

  if (!listEl) return;

  const selectedDate = inputTanggal?.value || today;

  const filtered = allData.filter(d => d.tanggal === selectedDate);

  listEl.innerHTML = "";

  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div style="padding:20px;text-align:center;opacity:0.6;">
        Tidak ada penjualan di tanggal ini
      </div>
    `;
    return;
  }

  filtered.forEach((data, index) => {

    // =====================================================
    // 🕒 FORMAT WAKTU
    // =====================================================
    const waktu = data.createdAt?.toDate
      ? data.createdAt.toDate().toLocaleString("id-ID")
      : "-";

    const kode = data.kode || `RB ${String(index + 1).padStart(3, "0")}`;

    let itemsHTML = "";
    (data.items || []).forEach(item => {
      itemsHTML += `
        <div class="item-row">
          <span>${item.qty}x ${item.name}</span>
          <span>${(item.price || 0).toLocaleString("id-ID")}</span>
        </div>
      `;
    });

    const div = document.createElement("div");

    div.innerHTML = `
      <div class="riwayat-item">

        <div class="riwayat-header">
          <span class="kode">${kode}</span>

          <button class="delete-btn" data-id="${data.id}">
            ✕
          </button>
        </div>

        <div class="riwayat-date">${waktu}</div>

        <div class="riwayat-items">
          ${itemsHTML}
        </div>

        <div class="riwayat-total">
          Rp ${(data.total || 0).toLocaleString("id-ID")}
        </div>

        <select class="metode-select" data-id="${data.id}">
          <option value="Tunai" ${data.metode === "Tunai" ? "selected" : ""}>Tunai</option>
          <option value="QRIS" ${data.metode === "QRIS" ? "selected" : ""}>QRIS</option>
        </select>

      </div>
    `;

    listEl.appendChild(div);
  });

  // =====================================================
  // ❌ DELETE
  // =====================================================
  listEl.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;

      if (!confirm("Hapus pesanan ini?")) return;

      await deleteDoc(doc(db, "penjualan", id));
    });
  });

  // =====================================================
  // 🔄 UPDATE METODE
  // =====================================================
  listEl.querySelectorAll(".metode-select").forEach(select => {
    select.addEventListener("change", async () => {
      const id = select.dataset.id;

      await updateDoc(doc(db, "penjualan", id), {
        metode: select.value
      });
    });
  });
}

// =====================================================
// 📅 EVENT FILTER TANGGAL
// =====================================================
if (inputTanggal) {
  inputTanggal.addEventListener("change", renderData);
}





window.addEventListener("load", () => {
  const msg = localStorage.getItem("toastMessage");

  if (msg) {
    showToast(msg);
    localStorage.removeItem("toastMessage");
  }
});


function showToast(msg = "Berhasil") {
  const toast = document.getElementById("toast");

  if (!toast) return;

  toast.innerHTML = `
    <div class="toast-icon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#22c55e"/>
        <path d="M7 12.5L10 15.5L17 8.5"
              stroke="white"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"/>
      </svg>
    </div>
    <span class="toast-text">${msg}</span>
  `;

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 1500);
}


