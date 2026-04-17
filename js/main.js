import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* =========================
   STATE
========================= */
let localTemp = {};

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  console.log("JS JALAN");

  const container = document.getElementById("stokContainer");

  if (!container) {
    console.error("❌ stokContainer tidak ditemukan");
    return;
  }

  /* =========================
     LOAD PRODUK
  ========================= */
  onSnapshot(collection(db, "produk"), (snapshot) => {
    console.log("JUMLAH PRODUK:", snapshot.size);

    container.innerHTML = "";

    if (snapshot.empty) {
      container.innerHTML = `
        <div style="padding:20px; text-align:center;">
          ❌ Tidak ada produk di Firestore
        </div>
      `;
      return;
    }

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;

      console.log("DATA:", id, data);

      // default local
      if (!localTemp[id]) {
        localTemp[id] = {
          stokMasuk: 0,
          stokKeluar: 0,
          stokBahanUtuh: 0,
          stokBahanKoma: 0,
          stokMinimal: 0
        };
      }

      container.innerHTML += `
        <div class="stok-card" data-id="${id}">

          <div class="stok-header" onclick="toggleCard(this)">
            <div>
              <h3>${data.nama || "-"}</h3>
              <p>${data.gramasi || "-"}</p>
              <small>Rp ${Number(data.harga || 0).toLocaleString("id-ID")}</small>
            </div>
            <div class="stok-arrow">⌄</div>
          </div>

          <div class="stok-body">

            <div class="stok-row">
              <span>Stok Masuk</span>
              <input type="number" value="0"
                onchange="updateLocal(this,'stokMasuk')">
            </div>

            <div class="stok-row">
              <span>Stok Keluar</span>
              <input type="number" value="0"
                onchange="updateLocal(this,'stokKeluar')">
            </div>

            <div class="stok-row">
              <span>Bahan Utuh</span>
              <input type="number" value="0"
                onchange="updateLocal(this,'stokBahanUtuh')">
            </div>

            <div class="stok-row">
              <span>Bahan Koma</span>
              <input type="number" step="0.1" value="0"
                onchange="updateLocal(this,'stokBahanKoma')">
            </div>

            <div class="stok-row">
              <span>Stok Minimal</span>
              <input type="number" value="0"
                onchange="updateLocal(this,'stokMinimal')">
            </div>

            <button onclick="updateStok(this)">
              Update Stok
            </button>

          </div>
        </div>
      `;
    });
  });

  /* =========================
     REALTIME STOK TEMP
  ========================= */
  onSnapshot(collection(db, "stok_temp"), (snap) => {
    snap.forEach((d) => {
      localTemp[d.id] = d.data();
    });
  });
});

/* =========================
   UPDATE LOCAL
========================= */
window.updateLocal = function (el, field) {
  const card = el.closest(".stok-card");
  const id = card.dataset.id;

  let val = Number(el.value || 0);

  if (field === "stokBahanKoma") {
    val = Math.max(0, Math.min(0.9, val));
    val = Math.round(val * 10) / 10;
  }

  if (val < 0) val = 0;

  localTemp[id][field] = val;
};

/* =========================
   UPDATE STOK (REALTIME)
========================= */
window.updateStok = async function (el) {
  const card = el.closest(".stok-card");
  const id = card.dataset.id;

  await setDoc(doc(db, "stok_temp", id), {
    ...localTemp[id],
    updatedAt: new Date()
  });

  alert("✅ Stok terupdate (semua device)");
};

/* =========================
   SIMPAN HARIAN
========================= */
window.simpanHarian = async function () {
  const snapshot = await getDocs(collection(db, "stok_temp"));

  const today = new Date().toISOString().slice(0, 10);

  const promises = [];

  snapshot.forEach((docSnap) => {
    const ref = doc(db, "stok_harian", today, "items", docSnap.id);

    promises.push(
      setDoc(ref, {
        ...docSnap.data(),
        createdAt: new Date()
      })
    );
  });

  await Promise.all(promises);

  alert("📦 Stok harian tersimpan!");
};

/* =========================
   ACCORDION
========================= */
window.toggleCard = function (el) {
  const card = el.parentElement;

  document.querySelectorAll(".stok-card").forEach((c) => {
    if (c !== card) c.classList.remove("active");
  });

  card.classList.toggle("active");
};