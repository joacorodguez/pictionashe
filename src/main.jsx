import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(<App />);

// PWA: registra el service worker SOLO en producción (nunca en localhost).
// En dev, un service worker cacheado puede servir versiones viejas del
// código y "colgar" la app aunque el servidor ya tenga los cambios nuevos.
const isLocalhost = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
if ("serviceWorker" in navigator) {
  if (isLocalhost) {
    // limpia cualquier SW/caché viejo que haya quedado activo de una prueba anterior
    navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
    if (window.caches) caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
  } else if (location.protocol.startsWith("http")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }
}
