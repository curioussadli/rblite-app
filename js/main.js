// =====================================================
// 📦 MAIN JS (CLEAN FINAL VERSION)
// Fokus: PWA + Service Worker saja
// Login system SUDAH DIHAPUS TOTAL
// =====================================================


// =============================
// 📦 PWA INSTALL PROMPT
// =============================
let deferredPrompt;

// simpan event install PWA
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault(); // cegah popup otomatis
  deferredPrompt = e; // simpan event install

  console.log("📦 PWA siap diinstall");
});


// =============================
// ⚙️ SERVICE WORKER (OFFLINE CACHE + AUTO UPDATE)
// =============================
if ("serviceWorker" in navigator) {

  navigator.serviceWorker
    .register("service-worker.js") // file SW kamu

    .then((reg) => {

      console.log("⚙️ Service Worker aktif");

      // paksa cek update saat pertama load
      reg.update();

      // auto cek update tiap 60 detik
      setInterval(() => {
        reg.update();
      }, 60000);

    })

    .catch((err) => {
      console.error("Service Worker error:", err);
    });
}


// =============================
// 🚀 OPTIONAL INSTALL BUTTON
// =============================

// kalau nanti kamu tambah tombol install di HTML:
// <button id="installBtn">Install App</button>

const installBtn = document.getElementById("installBtn");

if (installBtn) {

  installBtn.addEventListener("click", async () => {

    if (!deferredPrompt) return;

    deferredPrompt.prompt(); // tampilkan popup install

    const result = await deferredPrompt.userChoice;

    console.log("📲 Install result:", result.outcome);

    deferredPrompt = null; // reset
  });
}
