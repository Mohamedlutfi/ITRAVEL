// Auto-calc top padding so a sticky .infoSection doesn't overlap following content.
// Places the calculated spacing onto .home-body as inline padding-top and resets
// any existing margin-top so layout is consistent.

(function () {
	const SELECTORS = {
		header: '.nav',
		homeBody: '.home-body',
		info: '.infoSection',
		infoImages: '.infoSection img',
		heroVideo: '.video-container video'
	};

	function px(n) { return `${Math.round(n)}px`; }

	function getHeight(el) {
		if (!el) return 0;
		const r = el.getBoundingClientRect();
		return r.height || 0;
	}

	function updateSpacing() {
		const header = document.querySelector(SELECTORS.header);
		const homeBody = document.querySelector(SELECTORS.homeBody);
		const info = document.querySelector(SELECTORS.info);
		if (!homeBody || !info) return;

		// measure
		const headerH = getHeight(header);
		const infoH = getHeight(info);

		// include computed margin between header and info if present
		const infoStyle = window.getComputedStyle(info);
		const infoMarginTop = parseFloat(infoStyle.marginTop) || 0;

		// small gap so it doesn't sit flush against header
		const EXTRA = window.innerWidth <= 768 ? 12 : 24;

		// get current margin-top on homeBody and neutralize it (we'll use padding instead)
		const homeStyle = window.getComputedStyle(homeBody);
		const currentHomeMarginTop = parseFloat(homeStyle.marginTop) || 0;
		homeBody.style.marginTop = '0px';

		// final padding ensures header + info + extra space is reserved
		const finalPadding = Math.max(0, headerH + infoH + infoMarginTop + EXTRA - currentHomeMarginTop);
		homeBody.style.paddingTop = px(finalPadding);
	}

	// debounce helper
	function debounce(fn, wait = 120) {
		let t;
		return function () {
			clearTimeout(t);
			t = setTimeout(() => fn(), wait);
		};
	}

	// init
	document.addEventListener('DOMContentLoaded', () => {
		updateSpacing();

		// update on window resize
		window.addEventListener('resize', debounce(updateSpacing, 150));

		// observe size changes to the info section (e.g., dynamic content)
		const infoEl = document.querySelector(SELECTORS.info);
		if (infoEl && 'ResizeObserver' in window) {
			const ro = new ResizeObserver(debounce(updateSpacing, 80));
			ro.observe(infoEl);
		}

		// ensure images inside infoSection trigger recalculation after they load
		const imgs = document.querySelectorAll(SELECTORS.infoImages);
		imgs.forEach(img => {
			if (img.complete) return;
			img.addEventListener('load', () => updateSpacing());
		});

		// ensure video metadata load triggers recalculation
		const video = document.querySelector(SELECTORS.heroVideo);
		if (video) {
			video.addEventListener('loadedmetadata', () => updateSpacing());
			// also try once when the page fully loads
			window.addEventListener('load', () => setTimeout(updateSpacing, 100));
		}
	});
})();
