import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// =====================================================
// 📦 STATE
// =====================================================
let transaksi = [];


// =====================================================
// 🔐 DOM
// =====================================================
const listEl = document.getElementById("transaksiKeluar");
const nominalInput = document.getElementById("saldoAwalInput");
const keteranganInput = document.getElementById("keteranganInput");
const saveBtn = document.getElementById("saveSaldoBtn");

const inputTanggal = document.getElementById("filterTanggal");


// =====================================================
// 📅 TODAY
// =====================================================
const now = new Date();
const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  .toISOString()
  .slice(0, 10);
if (inputTanggal) {
  inputTanggal.value = today;
}


// =====================================================
// ➕ TAMBAH TRANSAKSI
// =====================================================
async function tambahTransaksi(keterangan, nominal) {
  await addDoc(collection(db, "transaksi"), {
    type: "keluar",
    keterangan,
    nominal: Number(nominal),

    tanggal: today, // 🔥 PENTING UNTUK FILTER

    createdAt: serverTimestamp()
  });
}


// =====================================================
// ❌ DELETE
// =====================================================
window.hapusTransaksi = async function (id) {
  if (!confirm("Yakin hapus transaksi ini?")) return;
  await deleteDoc(doc(db, "transaksi", id));
};


// =====================================================
// 🔄 REALTIME FIRESTORE
// =====================================================
const q = query(
  collection(db, "transaksi"),
  orderBy("createdAt", "desc")
);

onSnapshot(q, (snapshot) => {

  transaksi = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  renderTransaksi();
});


// =====================================================
// 🧾 RENDER + FILTER
// =====================================================
function renderTransaksi() {

  if (!listEl) return;

  const selectedDate = inputTanggal?.value || today;

  listEl.innerHTML = "";

  const filtered = transaksi.filter(item =>
    item.type === "keluar" &&
    item.tanggal === selectedDate
  );

  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div style="text-align:center; opacity:0.6; padding:20px;">
        Tidak ada transaksi di tanggal ini
      </div>
    `;
    return;
  }

  filtered.forEach((item) => {

    const waktu = item.createdAt?.toDate
      ? item.createdAt.toDate().toLocaleString("id-ID")
      : "-";

    const div = document.createElement("div");

    div.innerHTML = `
      <div class="rincian-item">

        <div class="rincian-top">
          <span class="rincian-date">${waktu}</span>

          <button onclick="hapusTransaksi('${item.id}')" class="delete-btn">
            ✕
          </button>
        </div>

        <div class="rincian-bottom">
          <span class="rincian-desc">${item.keterangan || "-"}</span>

          <span class="rincian-nominal">
            Rp ${(item.nominal || 0).toLocaleString("id-ID")}
          </span>
        </div>

      </div>
    `;

    listEl.appendChild(div);
  });
}


// =====================================================
// 🎯 EVENT FILTER
// =====================================================
inputTanggal?.addEventListener("change", renderTransaksi);


// =====================================================
// 💾 SAVE BUTTON
// =====================================================
document.addEventListener("DOMContentLoaded", () => {

  saveBtn?.addEventListener("click", async () => {

    const nominal = parseInt(
      nominalInput?.value.replace(/\./g, "")
    ) || 0;

    const keterangan = keteranganInput?.value;

    if (!keterangan) {
      alert("Keterangan wajib diisi");
      return;
    }

    if (nominal <= 0) {
      alert("Nominal harus lebih dari 0");
      return;
    }

    await tambahTransaksi(keterangan, nominal);

    nominalInput.value = "";
    keteranganInput.value = "";

    window.scrollTo({ top: 0, behavior: "smooth" });
  });

});


updateChart();