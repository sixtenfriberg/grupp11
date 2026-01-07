(() => {
  const el = document.getElementById("events-data");
const events = el ? JSON.parse(el.textContent) : [];


  // Startposition (Malmö default)
  const map = L.map("map").setView([55.60498, 13.00382], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap",
  }).addTo(map);

  const esc = (s) =>
    (s ?? "")
      .toString()
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  function popupCard(ev) {
    const title = esc(ev.name);
    const venue = esc(ev.venue || "");
    const city = esc(ev.city || "");
    const when = esc(ev.localDate || ev.dateTime || "");
    const img = ev.image
      ? `<img style="width:100%;height:140px;object-fit:cover;border-radius:12px;margin-bottom:10px" src="${esc(ev.image)}" alt="">`
      : "";

    const url = esc(ev.url || "");

    // Hela kortet klickbart + knapp
    return `
      <div style="width:260px">
        <div style="cursor:pointer" onclick="window.open('${url}','_blank','noopener')">
          ${img}
          <div style="font-weight:900;font-size:14px;margin:0 0 6px">${title}</div>
          <div style="font-size:12px;opacity:.75;margin:0 0 10px;line-height:1.35">
            ${when}<br>${venue}${city ? " — " + city : ""}
          </div>
        </div>
        ${
          url
            ? `<a class="btn" href="${url}" target="_blank" rel="noopener" style="display:block;text-align:center">Öppna event</a>`
            : `<span class="btn disabled" style="display:block;text-align:center">Öppna event</span>`
        }
      </div>
    `;
  }

  const markersById = new Map();
  const bounds = [];

  for (const ev of events) {
    const lat = Number(ev.lat);
    const lng = Number(ev.lng);

    // Hoppa över events utan koordinater
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup(popupCard(ev), { maxWidth: 320 });

    markersById.set(String(ev.id), marker);
    bounds.push([lat, lng]);
  }

  if (bounds.length) {
    map.fitBounds(bounds, { padding: [20, 20] });
  }

  // Klick på event i listan -> zooma + öppna popup (men låt knappen fungera normalt)
  document.getElementById("eventsList")?.addEventListener("click", (e) => {
    const row = e.target.closest(".event");
    if (!row) return;

    // klick på länken "Hitta biljetter" ska inte trigga popup
    if (e.target.closest("a")) return;

    const id = row.getAttribute("data-id");
    const marker = markersById.get(String(id));
    if (!marker) return;

    map.setView(marker.getLatLng(), Math.max(map.getZoom(), 14), { animate: true });
    marker.openPopup();
  });
})();
