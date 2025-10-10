// Responsive navbar toggle
document.addEventListener('DOMContentLoaded', function () {
	const menuToggle = document.querySelector('.menu-toggle');
	const navLinks = document.querySelector('.nav-links');

	if (!menuToggle || !navLinks) return;

	function openMenu() {
		navLinks.classList.add('active');
		menuToggle.classList.add('open');
		menuToggle.setAttribute('aria-expanded', 'true');
	}

	function closeMenu() {
		navLinks.classList.remove('active');
		menuToggle.classList.remove('open');
		menuToggle.setAttribute('aria-expanded', 'false');
	}

	menuToggle.addEventListener('click', function (e) {
		if (navLinks.classList.contains('active')) {
			closeMenu();
		} else {
			openMenu();
		}
	});
	

	// Close when clicking outside the nav on small screens
	document.addEventListener('click', function (e) {
		if (!navLinks.classList.contains('active')) return;
		const isInsideNav = e.target.closest('.nav');
		if (!isInsideNav) closeMenu();
	});

	// Close and reset when resizing to larger screens
	window.addEventListener('resize', function () {
		if (window.innerWidth > 780) {
			// ensure nav is visible in desktop layout
			navLinks.classList.remove('active');
			menuToggle.classList.remove('open');
			menuToggle.setAttribute('aria-expanded', 'false');
		}
	});
});
