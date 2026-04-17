import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  doc,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";



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


// =============================
// 🔙 BACK BUTTON
// =============================
const backBtn = document.getElementById("backBtn");

backBtn?.addEventListener("click", () => {
  window.history.back();
});


// =============================
// 🛒 LOAD CART
// =============================
let cart = JSON.parse(localStorage.getItem("cart")) || [];


// =============================
// 🎯 ELEMENT
// =============================
const orderList = document.getElementById("orderList");
const totalHarga = document.getElementById("totalHarga");
const payBtn = document.getElementById("payBtn");

// =============================
// 📅 TODAY (WAJIB UNTUK FILTER)
// =============================
const now = new Date();
const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  .toISOString()
  .slice(0, 10);
// =============================
// 🔥 GENERATE KODE RB (ANTI Nabrak)
// =============================
async function generateKodePesanan() {
  const counterRef = doc(db, "counters", "pesanan");

  const result = await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);

    let lastNumber = 0;

    // 🔥 kalau belum ada
    if (!counterDoc.exists()) {
      lastNumber = 1;
      transaction.set(counterRef, { lastNumber: lastNumber });
      return lastNumber;
    }

    // 🔥 ambil data lama + amankan dari NaN
    const data = counterDoc.data();
    lastNumber = Number(data.lastNumber) || 0;
    lastNumber += 1;

    transaction.update(counterRef, {
      lastNumber: lastNumber
    });

    return lastNumber;
  });

  return `RB ${String(result).padStart(3, "0")}`;
}


// =============================
// 💾 SIMPAN CART
// =============================
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}


// =============================
// 🔄 RENDER UI
// =============================
function render() {

  orderList.innerHTML = "";

  let total = 0;

  cart.forEach((item, index) => {

    const subtotal = item.qty * item.price;
    total += subtotal;

    const row = document.createElement("div");
    row.classList.add("order-item");

    row.innerHTML = `
      <div class="item-info">
        <span class="item-name">${item.name}</span>
        <span class="item-price">Rp ${item.price.toLocaleString("id-ID")}</span>
      </div>

      <div class="item-action">
        <button class="qty-btn minus" data-i="${index}">-</button>
        <span class="qty">${item.qty}</span>
        <button class="qty-btn plus" data-i="${index}">+</button>

        <button class="delete-btn" data-i="${index}">
          <img src="assets/icons/icon-close.svg">
        </button>
      </div>
    `;

    orderList.appendChild(row);
  });

  totalHarga.textContent = (total || 0).toLocaleString("id-ID");

  attachEvents();
}


// =============================
// 🎯 EVENT HANDLER
// =============================
function attachEvents() {

  document.querySelectorAll(".plus").forEach(btn => {
    btn.onclick = (e) => {
      const i = e.currentTarget.dataset.i;
      cart[i].qty++;
      saveCart();
      render();
    };
  });

  document.querySelectorAll(".minus").forEach(btn => {
    btn.onclick = (e) => {
      const i = e.currentTarget.dataset.i;

      if (cart[i].qty > 1) {
        cart[i].qty--;
      } else {
        cart.splice(i, 1);
      }

      saveCart();
      render();
    };
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.onclick = (e) => {
      const i = e.currentTarget.dataset.i;
      cart.splice(i, 1);
      saveCart();
      render();
    };
  });
}


// =============================
// 💳 BAYAR (SUDAH FIX)
// =============================
payBtn?.addEventListener("click", async () => {

  if (cart.length === 0) {
    showToast("Pesanan kosong!");
    return;
  }

  try {

    // 💰 HITUNG TOTAL
    const total = cart.reduce((sum, item) => {
      return sum + item.qty * item.price;
    }, 0);

    // 🔢 KODE RB
    const kode = await generateKodePesanan();

    // 💾 SIMPAN KE FIRESTORE
    await addDoc(collection(db, "penjualan"), {
      kode: kode,                 // ✅ INI KUNCI UTAMA
      items: cart,
      total: total,
      metode: "Tunai",           // default
      tipe: "masuk",
      tanggal: today, // 🔥 WAJIB untuk filter & reset harian

      createdAt: serverTimestamp()
    });

    // 🧹 RESET CART
    cart = [];
    localStorage.removeItem("cart");

    localStorage.setItem("toastMessage", `Pesanan ${kode}`);
        setTimeout(() => {
      window.location.href = "riwayat-pesanan.html";
    }, 200);

  } catch (err) {
    console.error("Gagal simpan:", err);
    showToast("Terjadi kesalahan saat menyimpan");
  }

  payBtn.disabled = false;
  payBtn.innerText = "Sudah dipesan";
});




// =============================
// 🚀 INIT
// =============================
render();




