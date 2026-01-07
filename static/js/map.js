// Karta + markers för events som Flask skickar in via window.EVENTS
document.addEventListener('DOMContentLoaded', () => {
  // Skapa kartan
  const map = L.map('map').setView([59.3293, 18.0686], 11); // Stockholm

  // OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap-bidragsgivare'
  }).addTo(map);

  const events = Array.isArray(window.EVENTS) ? window.EVENTS : [];

  const markers = [];
  for (const ev of events) {
    const latRaw = ev.lat ?? ev.latitude;
    const lngRaw = ev.lng ?? ev.longitude;
    const lat = parseFloat(latRaw);
    const lng = parseFloat(lngRaw);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const name = ev.name || ev.title || 'Event';
    const venue = ev.venue || ev.venue_name || '';
    const date = ev.localDate || ev.date || '';
    const time = (ev.localTime || ev.time || '').toString().slice(0, 5);
    const url = ev.url || ev.link || '';

    const popupHtml = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; max-width: 260px;">
        <div style="font-weight:700; margin-bottom:4px;">${escapeHtml(name)}</div>
        ${(date || time) ? `<div style="margin-bottom:4px;">🗓️ ${escapeHtml([date, time].filter(Boolean).join(' '))}</div>` : ''}
        ${venue ? `<div style="margin-bottom:6px;">📍 ${escapeHtml(venue)}</div>` : ''}
        ${url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">Öppna</a>` : ''}
      </div>
    `;

    const marker = L.marker([lat, lng]).addTo(map).bindPopup(popupHtml);
    markers.push(marker);
  }

  if (markers.length > 0) {
    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.2));
  }

  function escapeHtml(s) {
    return (s ?? '').toString()
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
});