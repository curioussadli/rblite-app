// =====================================================
// 📅 TODAY (ANTI ERROR TIMEZONE)
// =====================================================
const now = new Date();
const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  .toISOString()
  .slice(0, 10);


// =====================================================
// 🎛️ TAB SYSTEM
// =====================================================
const saldoBtn = document.getElementById("saldoBtn");
const inputBtn = document.getElementById("inputBtn");

const saldoContent = document.getElementById("saldoContent");
const inputContent = document.getElementById("inputContent");

function setActiveTab(type) {
  if (!saldoBtn || !inputBtn) return;

  if (type === "saldo") {
    saldoBtn.classList.add("active");
    inputBtn.classList.remove("active");

    saldoContent.style.display = "block";
    inputContent.style.display = "none";
  } else {
    inputBtn.classList.add("active");
    saldoBtn.classList.remove("active");

    inputContent.style.display = "block";
    saldoContent.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  saldoBtn?.addEventListener("click", () => setActiveTab("saldo"));
  inputBtn?.addEventListener("click", () => setActiveTab("input"));
  setActiveTab("saldo");
});


// =====================================================
// 🔥 FIREBASE
// =====================================================
import { db } from "./firebase.js";
import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// =====================================================
// 📦 STATE
// =====================================================
let saldoAwalVal = 0;
let saldoAkhirVal = 0;
let pemasukanVal = 0;
let pengeluaranVal = 0;

let penjualan = [];
let transaksi = [];


// =====================================================
// 💰 FORMAT INPUT
// =====================================================
function formatInput(el) {
  if (!el) return;

  el.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "");
    e.target.value = new Intl.NumberFormat("id-ID").format(value);
  });
}

formatInput(document.getElementById("saldoAwalInput"));
formatInput(document.getElementById("saldoAkhirInput"));


// =====================================================
// 💾 SIMPAN SALDO
// =====================================================
async function saveSaldo() {

  const saldoAwal =
    parseInt(document.getElementById("saldoAwalInput")?.value.replace(/\./g, "")) || 0;

  const saldoAkhir =
    parseInt(document.getElementById("saldoAkhirInput")?.value.replace(/\./g, "")) || 0;

  await setDoc(doc(db, "saldo", today), {
    saldoAwal,
    saldoAkhir,
    tanggal: today,
    updatedAt: serverTimestamp()
  });

  showToast("Saldo tersimpan");
}

document.getElementById("saveSaldoBtn")?.addEventListener("click", saveSaldo);
document.getElementById("saveSaldoAkhirBtn")?.addEventListener("click", saveSaldo);


// =====================================================
// 🔄 REALTIME SALDO
// =====================================================
onSnapshot(doc(db, "saldo", today), (snap) => {

  if (!snap.exists()) {
    saldoAwalVal = 0;
    saldoAkhirVal = 0;
  } else {
    const data = snap.data();
    saldoAwalVal = data.saldoAwal || 0;
    saldoAkhirVal = data.saldoAkhir || 0;
  }

  document.getElementById("saldoAwal").textContent =
    saldoAwalVal.toLocaleString("id-ID");

  document.getElementById("saldoAkhir").textContent =
    saldoAkhirVal.toLocaleString("id-ID");

  updateSummary();
});


// =====================================================
// 🔄 REALTIME DATA (HARI INI)
// =====================================================
const qTodayPenjualan = query(
  collection(db, "penjualan"),
  where("tanggal", "==", today)
);

onSnapshot(qTodayPenjualan, (snapshot) => {
  penjualan = snapshot.docs.map(doc => doc.data());
  hitungPemasukan();
});

const qTodayTransaksi = query(
  collection(db, "transaksi"),
  where("tanggal", "==", today)
);

onSnapshot(qTodayTransaksi, (snapshot) => {
  transaksi = snapshot.docs.map(doc => doc.data());
  hitungPengeluaran();
});

let semuaPenjualan = [];
let semuaTransaksi = [];

onSnapshot(collection(db, "penjualan"), (snapshot) => {
  semuaPenjualan = snapshot.docs.map(doc => doc.data());
  updateChart();
  hitungRekap();
});

onSnapshot(collection(db, "transaksi"), (snapshot) => {
  semuaTransaksi = snapshot.docs.map(doc => doc.data());
  updateChart();
  hitungRekap();
});





// =====================================================
// 💰 HITUNG
// =====================================================
function hitungPemasukan() {
  const total = penjualan.reduce((sum, item) => sum + (item.total || 0), 0);
  pemasukanVal = total;
  document.getElementById("pemasukanValue").textContent =
    total.toLocaleString("id-ID");
  updateSummary();
}

function hitungPengeluaran() {
  const total = transaksi.reduce((sum, item) => sum + (item.nominal || 0), 0);
  pengeluaranVal = total;
  document.getElementById("pengeluaranValue").textContent =
    total.toLocaleString("id-ID");
  updateSummary();
}


// =====================================================
// 📊 SUMMARY
// =====================================================
function updateSummary() {

  const pendapatan = pemasukanVal - pengeluaranVal;
  const selisih = (saldoAkhirVal - saldoAwalVal) - pendapatan;

  document.getElementById("pendapatan").textContent =
    "Rp " + pendapatan.toLocaleString("id-ID");

  const selisihEl = document.getElementById("selisih");

  const sign = selisih >= 0 ? "+" : "-";

  selisihEl.textContent =
    sign + "Rp " + Math.abs(selisih).toLocaleString("id-ID");

  selisihEl.style.color =
    selisih >= 0 ? "#2ecc71" : "#e74c3c";
}


// =====================================================
// 📤 KIRIM LAPORAN
// =====================================================
document.getElementById("kirimLaporanBtn")?.addEventListener("click", async () => {

  const pendapatan = pemasukanVal - pengeluaranVal;
  const selisih = (saldoAkhirVal - saldoAwalVal) - pendapatan;

  await addDoc(collection(db, "laporan"), {
    tanggal: today,
    saldoAwal: saldoAwalVal,
    saldoAkhir: saldoAkhirVal,
    pemasukan: pemasukanVal,
    pengeluaran: pengeluaranVal,
    pendapatan,
    selisih,
    createdAt: serverTimestamp()
  });

  showToast("Laporan terkirim");
});


// =====================================================
// 📅 RANGE (MINGGU & BULAN)
// =====================================================
const dateObj = new Date(today);

const startOfWeek = new Date(dateObj);
const day = startOfWeek.getDay();
const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
startOfWeek.setDate(diff);

const startWeekStr = startOfWeek.toISOString().slice(0, 10);

const startMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
const startMonthStr = startMonth.toISOString().slice(0, 10);


// =====================================================
// 📊 REKAP
// =====================================================
function getDiffHari(tglString) {
  const today = new Date();
  const tgl = new Date(tglString);

  // 🔥 reset jam
  today.setHours(0,0,0,0);
  tgl.setHours(0,0,0,0);

  return (today - tgl) / (1000 * 60 * 60 * 24);
}

function hitungRekap() {

  const now = new Date();

  let mingguMasuk = 0;
  let mingguKeluar = 0;

  let bulanMasuk = 0;
  let bulanKeluar = 0;

  semuaPenjualan.forEach(item => {
    let tgl = item.tanggal;

    if (!tgl && item.createdAt?.toDate) {
      tgl = item.createdAt.toDate().toISOString().slice(0, 10);
    }

    if (!tgl) return; // 🔥 biar aman

    const date = new Date(tgl);
    const diffHari = getDiffHari(tgl);

    if (diffHari >= 0 && diffHari <= 7) {
      mingguMasuk += item.total || 0;
    }

    if (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    ) {
      bulanMasuk += item.total || 0;
    }
  });

  semuaTransaksi.forEach(item => {
    let tgl = item.tanggal;

    if (!tgl && item.createdAt?.toDate) {
      tgl = item.createdAt.toDate().toISOString().slice(0, 10);
    }

    const date = new Date(tgl);
    const diffHari = getDiffHari(tgl);
    if (diffHari >= 0 && diffHari <= 7) {
      mingguKeluar += item.nominal || 0;
    }

    if (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    ) {
      bulanKeluar += item.nominal || 0;
    }
  });

  document.getElementById("mingguMasuk").textContent =
    mingguMasuk.toLocaleString("id-ID");

  document.getElementById("mingguKeluar").textContent =
    mingguKeluar.toLocaleString("id-ID");

  document.getElementById("bulanMasuk").textContent =
    bulanMasuk.toLocaleString("id-ID");

  document.getElementById("bulanKeluar").textContent =
    bulanKeluar.toLocaleString("id-ID");
}


// =====================================================
// 📊 CHART
// =====================================================
let chart;

Chart.defaults.font.family = "Roboto, sans-serif";
Chart.defaults.color = "#333";

function updateChart() {

  const map = {};

  penjualan.forEach(item => {
    const tgl = item.tanggal;
    if (!map[tgl]) map[tgl] = { masuk: 0, keluar: 0 };
    map[tgl].masuk += item.total || 0;
  });

  transaksi.forEach(item => {
    const tgl = item.tanggal;
    if (!map[tgl]) map[tgl] = { masuk: 0, keluar: 0 };
    map[tgl].keluar += item.nominal || 0;
  });

  const labels = Object.keys(map).sort();

  const dataMasuk = labels.map(t => map[t].masuk);
  const dataKeluar = labels.map(t => map[t].keluar);

  const ctx = document.getElementById("chartKeuangan");
  if (!ctx) return;

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          data: dataMasuk,
          backgroundColor: "rgba(46, 204, 113, 0.7)"
        },
        {
          data: dataKeluar,
          backgroundColor: "rgba(231, 76, 60, 0.7)"
        }
      ]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { display: false } }
      }
    }
  });
}


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



window.addEventListener("load", () => {
  const msg = localStorage.getItem("toastMessage");

  if (msg) {
    showToast(msg);
    localStorage.removeItem("toastMessage");
  }
});
