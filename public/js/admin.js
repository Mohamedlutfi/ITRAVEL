document.addEventListener('DOMContentLoaded', function () {
  const usersList = document.getElementById('users-list');
  const tripsList = document.getElementById('trips-list');
  const contactsList = document.getElementById('contacts-list');
  const statsPanel = document.getElementById('stats-panel');
  const locationsList = document.getElementById('locations-list');
  const addLocationForm = document.getElementById('add-location-form');

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

  async function loadContacts() {
    if (!contactsList) return;
    try {
      const res = await fetch('/admin/contacts');
      if (!res.ok) throw new Error('Failed to load contacts');
      const data = await res.json();
      renderContacts(data.contacts || []);
    } catch (err) {
      contactsList.textContent = 'Failed to load contacts.';
    }
  }

  async function loadLocations() {
    if (!locationsList) return;
    try {
      const res = await fetch('/admin/locations');
      if (!res.ok) throw new Error('Failed to load locations');
      const data = await res.json();
      renderLocations(data.locations || []);
    } catch (err) {
      locationsList.textContent = 'Failed to load locations.';
    }
  }

  async function loadStats() {
    if (!statsPanel) return;
    try {
      const res = await fetch('/admin/stats');
      if (!res.ok) throw new Error('Failed to load stats');
      const data = await res.json();
      renderStats(data.stats || {});
    } catch (err) {
      statsPanel.textContent = 'Failed to load stats.';
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

  function renderContacts(contacts) {
    if (!contactsList) return;
    contactsList.innerHTML = '';
    if (!contacts.length) {
      contactsList.textContent = 'No contact submissions.';
      return;
    }
    contacts.forEach(c => {
      const row = document.createElement('div');
      row.className = 'admin-contact';
      row.innerHTML = `<div class="contact-main"><div class="contact-meta"><strong>${escapeHtml(c.name)}</strong> &lt;${escapeHtml(c.email)}&gt; <small>${escapeHtml(c.created_at)}</small></div><div class="contact-subject">${escapeHtml(c.subject || '')}</div><div class="contact-message">${escapeHtml(c.message)}</div></div><div class="contact-actions"><button data-id="${c.id}" class="del-contact">Delete</button></div>`;
      contactsList.appendChild(row);
    });
    contactsList.querySelectorAll('.del-contact').forEach(b => b.addEventListener('click', onDeleteContact));
  }

  function renderLocations(locations) {
    if (!locationsList) return;
    locationsList.innerHTML = '';
    locations.forEach(l => {
      const row = document.createElement('div');
      row.className = 'admin-row';
      row.innerHTML = `<div class="admin-row-main"><strong>${escapeHtml(l.name)}</strong> <small>${escapeHtml(l.description || '')}</small></div><div><button data-id="${l.id}" class="del-location">Delete</button></div>`;
      locationsList.appendChild(row);
    });
    locationsList.querySelectorAll('.del-location').forEach(b => b.addEventListener('click', onDeleteLocation));
  }

  async function onDeleteLocation(e) {
    const id = e.currentTarget.dataset.id;
    if (!confirm('Delete this location?')) return;
    try {
      const res = await fetch('/admin/locations/' + id, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await loadLocations();
    } catch (err) { alert('Failed to delete location'); }
  }

  if (addLocationForm) {
    addLocationForm.addEventListener('submit', async function (ev) {
      ev.preventDefault();
      const fd = new FormData(addLocationForm);
      const payload = { name: fd.get('name'), description: fd.get('description') };
      try {
        const res = await fetch('/admin/locations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('Failed to add');
        addLocationForm.reset();
        await loadLocations();
      } catch (err) { alert('Failed to add location'); }
    });
  }

  function renderStats(s) {
    if (!statsPanel) return;
    const users = s.users || 0;
    const trips = s.trips || 0;
    const avg = (typeof s.avgTripsPerUser === 'number') ? s.avgTripsPerUser.toFixed(2) : '0.00';
    statsPanel.innerHTML = `<div class="stats-grid"><div class="stat"><div class="stat-num">${users}</div><div class="stat-label">Users</div></div><div class="stat"><div class="stat-num">${trips}</div><div class="stat-label">Memories</div></div><div class="stat"><div class="stat-num">${avg}</div><div class="stat-label">Avg Memories / User</div></div></div>`;
  }

  async function onDeleteContact(e) {
    const id = e.currentTarget.dataset.id;
    if (!confirm('Delete this contact message?')) return;
    try {
      const res = await fetch('/admin/contacts/' + id, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await loadContacts();
    } catch (err) { alert('Failed to delete contact'); }
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
  loadContacts();
  loadStats();
  loadLocations();
});
