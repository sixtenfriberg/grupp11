document.addEventListener('DOMContentLoaded', () => {
  // Skapa kartan
  const map = L.map('map').setView([59.3293, 18.0686], 11); // Stockholm

  // OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap-bidragsgivare'
  }).addTo(map);
});