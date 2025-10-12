// Client-side script for MyProfile: load user's trips, create/update/delete via AJAX
document.addEventListener('DOMContentLoaded', function () {
	var form = document.querySelector('.profile-form form');
	var tripsContainer = document.querySelector('.profile-trips');
	 var locationSelect = document.getElementById('location-select');
	// If the server pre-renders trips we should skip the client fetch once to avoid duplicate cards.
	var skippedInitialServerRender = false;

	async function loadTrips() {
		// If server pre-rendered trip cards exist, skip fetching once and attach handlers to them.
		if (tripsContainer && tripsContainer.querySelector('.card') && !skippedInitialServerRender) {
			attachHandlersToExisting();
			skippedInitialServerRender = true; // future calls should fetch from server
			return;
		}
		// Otherwise fetch from server and render the latest state
		await fetchAndRender();
	}

	async function fetchAndRender() {
		try {
			var res = await fetch('/trips');
			var data = await res.json();
			renderTrips(data.trips || []);
		} catch (err) {
			console.error('Failed to load trips', err);
		}
	}

	function renderTrips(trips) {
		if (!tripsContainer) return;
		tripsContainer.innerHTML = '';
		trips.forEach(function (t) {
			var div = document.createElement('div');
			div.className = 'card';
			div.innerHTML = '\n        <img src="' + (t.img || '/img/pick.jpg') + '" alt="' + escapeHtml(t.title) + '" class="cardimg">\n        <div class="cardoverlay">\n          <h2 class="cardtitleoverlay">' + escapeHtml(t.title) + '</h2>\n          <p class="cardtextoverlay">' + escapeHtml(t.description) + '</p>\n          ' + (t.location_name ? ('<p class="cardloc">Location: ' + escapeHtml(t.location_name) + '</p>') : '') + '\n          <div class="cardoverlaybg"></div>\n          <div class="card-actions">\n            <button data-id="' + t.id + '" class="editBtn">Edit</button>\n            <button data-id="' + t.id + '" class="delBtn">Delete</button>\n          </div>\n        </div>\n      ';
			tripsContainer.appendChild(div);
		});

		// attach handlers
		tripsContainer.querySelectorAll('.delBtn').forEach(function (b) { b.addEventListener('click', onDelete); });
		tripsContainer.querySelectorAll('.editBtn').forEach(function (b) { b.addEventListener('click', onEdit); });
	}

		function attachHandlersToExisting() {
			if (!tripsContainer) return;
			tripsContainer.querySelectorAll('.delBtn').forEach(function (b) {
				b.removeEventListener('click', onDelete);
				b.addEventListener('click', onDelete);
			});
			tripsContainer.querySelectorAll('.editBtn').forEach(function (b) {
				b.removeEventListener('click', onEdit);
				b.addEventListener('click', onEdit);
			});
		}

	function escapeHtml(s) { return (s || '').replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

	async function onDelete(e) {
		var id = e.currentTarget.dataset.id;
		if (!confirm('Delete this memory?')) return;
		try {
			var res = await fetch('/trips/' + id, { method: 'DELETE' });
			var j = await res.json();
			console.log('deleted', j);
			// After deleting, fetch fresh list from server and re-render
			await fetchAndRender();
		} catch (err) { console.error(err); }
	}

	async function onEdit(e) {
		var id = e.currentTarget.dataset.id;
		// Try to read title/description from the DOM first (if server rendered or already in page)
		try {
			var card = e.currentTarget.closest('.card');
			var titleText = '';
			var descText = '';
			if (card) {
				var titleEl = card.querySelector('.cardtitleoverlay');
				var descEl = card.querySelector('.cardtextoverlay');
				if (titleEl) titleText = titleEl.textContent || '';
				if (descEl) descText = descEl.textContent || '';
			}
			if (form && form.querySelector('[name="title"]')) form.querySelector('[name="title"]').value = titleText || '';
			if (form && form.querySelector('[name="description"]')) form.querySelector('[name="description"]').value = descText || '';
			// set location select if available
			if (form && form.querySelector('[name="location_id"]')) {
				if (card && card.querySelector('.cardloc')) {
					// parse location name from card DOM and try to match an option
					var locText = card.querySelector('.cardloc').textContent.replace(/^Location:\s*/i, '').trim();
					var opt = Array.from(form.querySelector('[name="location_id"]').options).find(o => o.text === locText);
					if (opt) form.querySelector('[name="location_id"]').value = opt.value;
				}
			}
			if (form) form.dataset.editId = id;
			var btn = form ? form.querySelector('button[type=submit]') : null;
			if (btn) btn.textContent = 'Update memory';
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} catch (err) {
			// fallback: fetch full list and find trip
			try {
				var res = await fetch('/trips');
				var data = await res.json();
				var trip = (data.trips || []).find(function (t) { return String(t.id) === String(id); });
				if (!trip) return alert('Trip not found');
				if (form && form.querySelector('[name="title"]')) form.querySelector('[name="title"]').value = trip.title || '';
				if (form && form.querySelector('[name="description"]')) form.querySelector('[name="description"]').value = trip.description || '';
				if (form) form.dataset.editId = trip.id;
				// prefill location if available
				if (form && form.querySelector('[name="location_id"]')) {
					form.querySelector('[name="location_id"]').value = trip.location_id || '';
				}
				var btn2 = form ? form.querySelector('button[type=submit]') : null;
				if (btn2) btn2.textContent = 'Update memory';
				window.scrollTo({ top: 0, behavior: 'smooth' });
			} catch (err2) { console.error(err2); }
		}
	}

	// Image validation config
	var MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
	var ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

	// Preview and validation elements
	var fileInput = document.getElementById('trip-file');
	var previewWrap = document.getElementById('file-preview');
	var previewImg = document.getElementById('file-preview-img');
	var validationEl = document.getElementById('file-validation');

	function showValidation(msg, isError) {
		if (!validationEl) return;
		validationEl.style.display = msg ? 'block' : 'none';
		validationEl.style.color = isError ? '#ffb3b3' : '#ffd';
		validationEl.textContent = msg || '';
	}

	if (fileInput) {
		fileInput.addEventListener('change', function (ev) {
			var f = fileInput.files && fileInput.files[0];
			if (!f) {
				previewWrap.style.display = 'none';
				showValidation('', false);
				return;
			}
			if (ALLOWED_TYPES.indexOf(f.type) === -1) {
				showValidation('Invalid file type. Please choose a JPG/PNG/GIF/WEBP image.', true);
				previewWrap.style.display = 'none';
				return;
			}
			if (f.size > MAX_IMAGE_BYTES) {
				showValidation('File too large. Max 5 MB allowed.', true);
				previewWrap.style.display = 'none';
				return;
			}
			// Valid file — show preview
			var reader = new FileReader();
			reader.onload = function (e) {
				previewImg.src = e.target.result;
				previewWrap.style.display = 'block';
				showValidation('Image ready to upload', false);
			};
			reader.readAsDataURL(f);
		});
	}

	if (form) {
		form.addEventListener('submit', async function (ev) {
			ev.preventDefault();
			// Validate before submitting
			var f = fileInput && fileInput.files && fileInput.files[0];
			if (!f) {
				showValidation('Please choose an image file.', true);
				return;
			}
			if (ALLOWED_TYPES.indexOf(f.type) === -1) {
				showValidation('Invalid file type. Please choose a JPG/PNG/GIF/WEBP image.', true);
				return;
			}
			if (f.size > MAX_IMAGE_BYTES) {
				showValidation('File too large. Max 5 MB allowed.', true);
				return;
			}

			var fd = new FormData(form);
			// include location select if present
			if (locationSelect && locationSelect.value) fd.set('location_id', locationSelect.value);
			var editId = form.dataset.editId;
			try {
				var url = editId ? '/trips/' + editId : '/trips';
				var method = editId ? 'PUT' : 'POST';
				var res = await fetch(url, { method: method, body: fd });
				var j = await res.json();
				console.log('saved', j);
				form.reset();
				previewWrap.style.display = 'none';
				showValidation('Memory saved', false);
				delete form.dataset.editId;
				var btn = form.querySelector('button[type=submit]'); if (btn) btn.textContent = 'Create/Update memory';
				// After create/update, fetch latest trips and re-render
				await fetchAndRender();
			} catch (err) {
				console.error('Error saving trip', err);
				showValidation('Failed to save memory. Try again later.', true);
			}
		});
	}

	loadTrips();
});
