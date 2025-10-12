document.addEventListener('DOMContentLoaded', function () {
  const usersList = document.getElementById('users-list');
  const tripsList = document.getElementById('trips-list');

  async function loadUsers() {
    try {
      const res = await fetch('/admin/users');
      if (!res.ok) throw new Error('Failed to load users');
      const data = await res.json();
      renderUsers(data.users || []);
    } catch (err) {
      usersList.textContent = 'Failed to load users.';
    }
  }

  async function loadTrips() {
    try {
      const res = await fetch('/admin/trips');
      if (!res.ok) throw new Error('Failed to load trips');
      const data = await res.json();
      renderTrips(data.trips || []);
    } catch (err) {
      tripsList.textContent = 'Failed to load trips.';
    }
  }

  function renderUsers(users) {
    if (!usersList) return;
    usersList.innerHTML = '';
    users.forEach(u => {
      const row = document.createElement('div');
      row.className = 'admin-row';
      row.innerHTML = `<div class="admin-row-main"><strong>${escapeHtml(u.user)}</strong> <span>${escapeHtml(u.fullname || '')}</span> <small>${escapeHtml(u.email || '')}</small></div><div><button data-id="${u.id}" class="del-user">Delete</button></div>`;
      usersList.appendChild(row);
    });
    usersList.querySelectorAll('.del-user').forEach(b => b.addEventListener('click', onDeleteUser));
  }

  function renderTrips(trips) {
    if (!tripsList) return;
    tripsList.innerHTML = '';
    trips.forEach(t => {
      const row = document.createElement('div');
      row.className = 'admin-row';
      row.innerHTML = `<div class="admin-row-main"><img src="${t.img || '/img/pick.jpg'}" alt="${escapeHtml(t.title)}" class="mini-thumb"/><strong>${escapeHtml(t.title)}</strong><br/><small>by ${escapeHtml(t.username || 'unknown')}</small></div><div><button data-id="${t.id}" class="del-trip">Delete</button></div>`;
      tripsList.appendChild(row);
    });
    tripsList.querySelectorAll('.del-trip').forEach(b => b.addEventListener('click', onDeleteTrip));
  }

  async function onDeleteUser(e) {
    const id = e.currentTarget.dataset.id;
    if (!confirm('Delete this user? This will remove their account.')) return;
    try {
      const res = await fetch('/admin/users/' + id, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await loadUsers();
    } catch (err) { alert('Failed to delete user'); }
  }

  async function onDeleteTrip(e) {
    const id = e.currentTarget.dataset.id;
    if (!confirm('Delete this trip from gallery?')) return;
    try {
      const res = await fetch('/admin/trips/' + id, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await loadTrips();
    } catch (err) { alert('Failed to delete trip'); }
  }

  function escapeHtml(s) { return (s || '').replace(/[&<>'"]/g, function (c) { return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;" }[c]; }); }

  loadUsers();
  loadTrips();
});
