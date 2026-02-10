

const map = L.map("map").setView([59.3293, 18.0686], 6);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap-bidragsgivare",
}).addTo(map);

const listEl = document.getElementById("eventsList");
const countEl = document.getElementById("count");
const metaEl = document.getElementById("meta");
const formEl = document.getElementById("searchForm");

let markersLayer = L.featureGroup().addTo(map);

// id -> Leaflet marker (för hover/click-koppling)
let markerById = new Map();

function escapeHtml(str) {
  return (str ?? "")
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setMeta(text) {
  if (metaEl) metaEl.textContent = text || "";
}

function setCount(n) {
  if (countEl) countEl.textContent = String(n ?? 0);
}

function clearMarkers() {
  markersLayer.clearLayers();
  markerById.clear();
}

function renderMarkers(events) {
  clearMarkers();

  let any = false;

  (events || []).forEach((e) => {
    if (!e) return;

    const lat = parseFloat(e.lat);
    const lng = parseFloat(e.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

    const marker = L.marker([lat, lng]);
    marker.bindPopup(`
      <strong>${escapeHtml(e.name || "")}</strong><br>
      ${escapeHtml(e.venue || "")}<br>
      ${escapeHtml(e.localDate || "")} ${escapeHtml((e.localTime || "").toString().slice(0, 5))}
    `);

    marker.addTo(markersLayer);
    if (e.id != null) markerById.set(String(e.id), marker);

    any = true;
  });

  if (any) {
    map.fitBounds(markersLayer.getBounds().pad(0.2));
  } else {
    map.setView([59.3293, 18.0686], 6);
  }
}

function renderList(events) {
  if (!listEl) return;

  if (!events || events.length === 0) {
    listEl.innerHTML = `<div style="padding:14px 12px; color: rgba(0,0,0,0.65);">
      Inga träffar. Prova ett annat sökord eller datumintervall.
    </div>`;
    return;
  }

  // Matchar din gamla Jinja-markup (day + dow/time + title + venue + knapp)
  listEl.innerHTML = events
    .map((e) => {
      const localDate = e.localDate || "";
      const localTime = (e.localTime || "").toString().slice(0, 5);
      const day = localDate ? localDate.slice(8, 10) : "--";

      return `
        <div class="event" data-id="${escapeHtml(e.id)}">
          <div class="datebox">
            <div class="day">${escapeHtml(day)}</div>
          </div>

          <div class="info">
            <div class="topline">
              <span class="dow">${escapeHtml(localDate)}</span>
              <span class="time">${escapeHtml(localTime)}</span>
            </div>

            <div class="title">${escapeHtml(e.name || "")}</div>
            <div class="sub">${escapeHtml(e.venue || "")}</div>
          </div>

          <div class="actions">
            ${
              e.url
                ? `<a class="btn" href="${escapeHtml(e.url)}" target="_blank" rel="noopener">Hitta biljetter</a>`
                : `<span class="btn disabled">Hitta biljetter</span>`
            }
          </div>
        </div>
      `;
    })
    .join("");

  // Koppla listan till markers (hover + klick)
  listEl.querySelectorAll(".event[data-id]").forEach((el) => {
    const id = el.getAttribute("data-id");
    const marker = markerById.get(String(id));
    if (!marker) return;

    el.addEventListener("mouseenter", () => {
      try {
        marker.openPopup();
      } catch (_) {}
    });

    el.addEventListener("mouseleave", () => {
      try {
        marker.closePopup();
      } catch (_) {}
    });

    el.addEventListener("click", () => {
      try {
        map.setView(marker.getLatLng(), Math.max(map.getZoom(), 12));
        marker.openPopup();
      } catch (_) {}
    });
  });
}

function renderEvents(events) {
  const arr = Array.isArray(events) ? events : [];

  setCount(arr.length);

  if (arr.length === 0) {
    // Om sidan precis laddats (ingen sökning), låt meta stå kvar om den redan har text
    if (metaEl && metaEl.textContent && metaEl.textContent.trim().length > 0) {
      // behåll
    } else {
      setMeta("Inga träffar.");
    }
  } else {
    setMeta(`Hittade ${arr.length} events`);
  }

  renderMarkers(arr);
  renderList(arr);
}

async function loadEventsFromApi({ keyword, start, end } = {}) {
  const params = new URLSearchParams();
  if (keyword) params.set("keyword", keyword);
  if (start) params.set("start", start);
  if (end) params.set("end", end);

  setMeta("Söker…");

  const qs = params.toString();
  const url = qs ? `/api/events?${qs}` : `/api/events`;

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`API-fel: ${res.status}`);

  const events = await res.json();
  renderEvents(events);
}

if (formEl) {
  formEl.addEventListener("submit", async (e) => {
    e.preventDefault(); // stoppar omladdning

    const formData = new FormData(formEl);
    const keyword = (formData.get("keyword") || "").toString().trim();
    const start = (formData.get("start") || "").toString().trim();
    const end = (formData.get("end") || "").toString().trim();

    if (!keyword && !start && !end) {
      setMeta("Välj sökord eller datum för att söka");
      return;
    }

    try {
      await loadEventsFromApi({ keyword, start, end });
    } catch (err) {
      console.error(err);
      setCount(0);
      setMeta("Något gick fel vid sökning. Försök igen.");
      renderEvents([]);
    }
  });
}

// Startläge: tom sida (som läraren föreslog)
renderEvents([]);
setMeta("Sök efter event för att visa resultat på kartan.");
