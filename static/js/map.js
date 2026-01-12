// Läs events från HTML
const eventsDataEl = document.getElementById("events-data");

let EVENTS = [];
if (eventsDataEl) {
  try {
    EVENTS = JSON.parse(eventsDataEl.textContent);
  } catch (err) {
    console.error("Kunde inte parsa events-data", err);
  }
}

const map = L.map("map").setView([59.3293, 18.0686], 6); // Sverige som default

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap-bidragsgivare",
}).addTo(map);


const markersById = {};

EVENTS.forEach((e) => {
  if (!e.lat || !e.lng) return;

  const lat = parseFloat(e.lat);
  const lng = parseFloat(e.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return;

  const marker = L.marker([lat, lng]).addTo(map);

  marker.bindPopup(`
    <strong>${escapeHtml(e.name)}</strong><br>
    ${escapeHtml(e.venue || "")}<br>
    ${escapeHtml(e.localDate || "")}
  `);

  markersById[e.id] = marker;
});

// Anpassa zoom så alla markers syns
const markerList = Object.values(markersById);
if (markerList.length > 0) {
  const group = L.featureGroup(markerList);
  map.fitBounds(group.getBounds().pad(0.2));
}


const listEl = document.getElementById("eventsList");

if (listEl) {
  listEl.querySelectorAll(".event").forEach((eventEl) => {
    const id = eventEl.dataset.id;
    const marker = markersById[id];
    if (!marker) return;

    eventEl.addEventListener("mouseenter", () => {
      marker.openPopup();
      marker.setZIndexOffset(1000);
    });

    eventEl.addEventListener("mouseleave", () => {
      marker.closePopup();
      marker.setZIndexOffset(0);
    });
  });
}


function escapeHtml(str) {
  return (str || "")
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
