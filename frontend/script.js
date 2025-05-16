// Setze hier die URL deiner Render-API ein:
const API_URL = 'https://DEIN-RENDER-URL.onrender.com/api/leaderboard';

fetch(API_URL)
  .then(res => res.json())
  .then(data => {
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '';
    data.forEach((entry, i) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="px-4 py-2">${i + 1}</td>
        <td class="px-4 py-2">${entry.name}</td>
        <td class="px-4 py-2">${entry.distance.toFixed(2)}</td>
        <td class="px-4 py-2">${entry.moving_time}</td>
      `;
      tbody.appendChild(row);
    });
  });