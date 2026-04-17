import { db, collection, onSnapshot } from "./firebase.js";

console.log("🔥 MENU JS LOADED");

// =============================
// 🛒 CART SYSTEM (GLOBAL)
// =============================
let cart = [];

// ambil cart dari localStorage (biar tidak hilang)
const saved = localStorage.getItem("cart");
if (saved) {
  cart = JSON.parse(saved);
}

// =============================
// 💾 SIMPAN CART
// =============================
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// =============================
// ➕ ADD TO CART
// =============================
function addToCart(id, name, price) {

  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id,
      name,
      price,
      qty: 1
    });
  }

  saveCart();
  updateCartUI();
}

// =============================
// 💰 UPDATE CART UI
// =============================
function updateCartUI() {

  const cartCount = document.getElementById("cartCount");
  const cartTotal = document.getElementById("cartBottomTotal");

  if (!cartCount || !cartTotal) return;

  let totalItem = 0;
  let totalHarga = 0;

  cart.forEach(item => {
    totalItem += item.qty;
    totalHarga += item.qty * item.price;
  });

  cartCount.textContent = `${totalItem} item`;
  cartTotal.textContent = "Rp " + totalHarga.toLocaleString("id-ID");
}

// =============================
// 🚀 LOAD MENU FIREBASE (HANYA 1X)
// =============================
document.addEventListener("DOMContentLoaded", () => {

  const menuGrid = document.getElementById("posMenu");

  if (!menuGrid) {
    console.error("posMenu tidak ditemukan");
    return;
  }

  // =============================
  // 🔥 FIREBASE MENU LISTENER (ONLY ONCE)
  // =============================
  onSnapshot(collection(db, "menu"), (snapshot) => {

    menuGrid.innerHTML = "";

    snapshot.forEach((docSnap) => {

      const data = docSnap.data();

      const card = document.createElement("div");
      card.classList.add("menu-card");

      card.innerHTML = `
        <div class="menu-img">
          <img src="${data.img}">
        </div>

        <div class="menu-info">
          <h3>${data.name}</h3>
          <p>Rp ${Number(data.price).toLocaleString("id-ID")}</p>
        </div>

        <button class="btn-add">+ Tambah</button>
      `;

      // =============================
      // 🍔 CLICK MENU → ADD CART ONLY
      // =============================
      const btn = card.querySelector(".btn-add");

      btn.addEventListener("click", () => {
        addToCart(docSnap.id, data.name, data.price);
      });

      menuGrid.appendChild(card);
    });

    updateCartUI();
  });

  // =============================
  // 🛒 CLICK CART → PESANAN PAGE
  // =============================
  const cartBar = document.getElementById("cartBottomBar");

  if (cartBar) {
    cartBar.addEventListener("click", () => {
      window.location.href = "pesanan.html";
    });
  }

});