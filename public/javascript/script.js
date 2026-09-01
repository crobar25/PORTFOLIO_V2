if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

const hamMenu = document.querySelector('.ham-menu');
const offScreenMenu = document.querySelector('.off-screen-menu');

let lockedScrollY = 0;

function lockPageScroll() {
    lockedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    document.documentElement.classList.add('no-scroll');
    document.body.classList.add('no-scroll');
    document.body.style.top = `-${lockedScrollY}px`;
}

function unlockPageScroll() {
    document.documentElement.classList.remove('no-scroll');
    document.body.classList.remove('no-scroll');
    document.body.style.top = '';
    window.scrollTo(0, lockedScrollY);
}

hamMenu.addEventListener('click', () => {
    const isOpen = hamMenu.classList.toggle('active');
    offScreenMenu.classList.toggle('active');
    if (isOpen) {
        lockPageScroll();
    } else {
        unlockPageScroll();
    }
})

const menuLinks = document.querySelectorAll('.menu-link');

if (menuLinks.length) {
    const hoverDot = document.createElement('div');
    hoverDot.classList.add('hover-dot');
    document.body.appendChild(hoverDot);

    menuLinks.forEach((link) => {
        link.addEventListener('mouseenter', () => {
            const rect = link.getBoundingClientRect();
            hoverDot.style.top = `${rect.top + rect.height / 2}px`;
            hoverDot.classList.add('active');
        });
        link.addEventListener('mouseleave', () => {
            hoverDot.classList.remove('active');
        });
    });
}

const navbar = document.querySelector('.nav-header');
let lastScrollY = window.scrollY || 0;

window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY < 0) return;

    if (currentScrollY > lastScrollY) {
        navbar.classList.add('hidden');
    } else {
        navbar.classList.remove('hidden');
    }
    lastScrollY = currentScrollY;
});

const photowall = document.querySelector('.photowall');
const lightbox = document.getElementById('lightbox');

if (photowall && lightbox) {
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.getElementById('lightbox-close');

    const openLightbox = (src, alt) => {
        lightboxImg.src = src;
        lightboxImg.alt = alt || '';
        lightbox.classList.add('active');
    };

    const closeLightbox = () => {
        lightbox.classList.remove('active');
        lightboxImg.src = '';
    };

    photowall.addEventListener('click', (e) => {
        if (e.target instanceof HTMLImageElement) {
            openLightbox(e.target.dataset.full || e.target.src, e.target.alt);
        }
    });

    lightboxClose.addEventListener('click', closeLightbox);

    lightbox.addEventListener('click', (e) => {
        if (e.target !== lightboxImg) {
            closeLightbox();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
    });
}

/*----------------------HOME HERO: ROLE ROTATOR---------------------------------*/
// "software development" scrolls downward out of view while the next role
// scrolls downward into the slot it left behind, like a mechanical flip sign.

const roleViewport = document.querySelector('.role-viewport');

if (roleViewport) {
    const roleWords = ['software development', 'creative direction', 'photographer', 'videographer'];
    const easing = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

    let activeEl = document.getElementById('role-a');
    let standbyEl = document.getElementById('role-b');
    let idx = 0;

    // Park/land using a measured pixel offset (not translateY(-100%)) so the parked
    // word's edge lines up exactly with the viewport's clip boundary. A percentage
    // offset is relative to the word's own rendered box, which can round to a
    // different pixel than the container's own (independently-rounded) height —
    // that mismatch is what let a sliver of the parked word peek into view.
    function step() {
        return roleViewport.getBoundingClientRect().height;
    }

    activeEl.textContent = roleWords[0];
    activeEl.style.transform = 'translateY(0px)';
    standbyEl.style.transform = `translateY(-${step()}px)`;

    function tickRole() {
        const s = step();
        const nextIdx = (idx + 1) % roleWords.length;
        standbyEl.textContent = roleWords[nextIdx];
        standbyEl.style.transition = 'none';
        standbyEl.style.transform = `translateY(-${s}px)`;

        // force reflow so the parked position above is committed before transitioning
        void standbyEl.offsetWidth;

        activeEl.style.transition = `transform 0.7s ${easing}`;
        standbyEl.style.transition = `transform 0.7s ${easing}`;
        activeEl.style.transform = `translateY(${s}px)`;
        standbyEl.style.transform = 'translateY(0px)';

        const outgoingEl = activeEl;
        [activeEl, standbyEl] = [standbyEl, activeEl];
        idx = nextIdx;

        setTimeout(() => {
            outgoingEl.style.transition = 'none';
            outgoingEl.style.transform = `translateY(-${step()}px)`;
        }, 720);
    }

    if (roleWords.length > 1) {
        setInterval(tickRole, 2800);
    }
}

/*----------------------HOME HERO: COLLAGE "PICK UP" ENLARGE---------------------------------*/
// Clicking a photo grows it, in place, from its collage position/rotation up to
// preview size — as if it were physically lifted off the surface to look at it closer.

const collage = document.querySelector('.collage');
const heroLightbox = document.getElementById('hero-lightbox');

if (collage && heroLightbox) {
    const heroLightboxClose = document.getElementById('hero-lightbox-close');
    const easing = 'cubic-bezier(0.22, 1, 0.36, 1)';
    let activeClone = null;
    let activeSource = null;

    function currentRect(el) {
        const box = el.getBoundingClientRect();
        return {
            centerX: box.left + box.width / 2,
            centerY: box.top + box.height / 2,
            width: el.offsetWidth,
            height: el.offsetHeight,
        };
    }

    function openPickup(sourceEl) {
        if (activeClone) return;

        const rot = sourceEl.style.getPropertyValue('--rot') || '0deg';
        const rect = currentRect(sourceEl);
        const fullSrc = sourceEl.dataset.full;
        const radius = getComputedStyle(sourceEl).borderRadius;

        const clone = document.createElement('img');
        clone.src = fullSrc;
        clone.alt = '';
        clone.className = 'collage-clone';
        clone.style.top = `${rect.centerY - rect.height / 2}px`;
        clone.style.left = `${rect.centerX - rect.width / 2}px`;
        clone.style.width = `${rect.width}px`;
        clone.style.height = `${rect.height}px`;
        clone.style.borderRadius = radius;
        clone.style.transform = `rotate(${rot})`;
        clone.style.boxShadow = '0 14px 26px rgba(0,0,0,0.24), 0 3px 8px rgba(0,0,0,0.14)';
        document.body.appendChild(clone);

        sourceEl.classList.add('lifted');
        heroLightbox.classList.add('active');
        lockPageScroll();

        activeClone = clone;
        activeSource = sourceEl;

        requestAnimationFrame(() => {
            const naturalRatio = rect.width / rect.height;
            let targetW = Math.min(window.innerWidth * 0.72, 880);
            let targetH = targetW / naturalRatio;
            const maxH = window.innerHeight * 0.8;
            if (targetH > maxH) {
                targetH = maxH;
                targetW = targetH * naturalRatio;
            }
            const targetTop = (window.innerHeight - targetH) / 2;
            const targetLeft = (window.innerWidth - targetW) / 2;

            clone.style.transition = [
                `top 0.55s ${easing}`,
                `left 0.55s ${easing}`,
                `width 0.55s ${easing}`,
                `height 0.55s ${easing}`,
                `transform 0.55s ${easing}`,
                'box-shadow 0.55s ease',
            ].join(', ');
            clone.style.top = `${targetTop}px`;
            clone.style.left = `${targetLeft}px`;
            clone.style.width = `${targetW}px`;
            clone.style.height = `${targetH}px`;
            clone.style.transform = 'rotate(0deg)';
            clone.style.boxShadow = '0 30px 70px rgba(0,0,0,0.5)';
        });
    }

    function closePickup() {
        if (!activeClone || !activeSource) return;

        const rot = activeSource.style.getPropertyValue('--rot') || '0deg';
        const rect = currentRect(activeSource);
        const clone = activeClone;
        const source = activeSource;

        clone.style.top = `${rect.centerY - rect.height / 2}px`;
        clone.style.left = `${rect.centerX - rect.width / 2}px`;
        clone.style.width = `${rect.width}px`;
        clone.style.height = `${rect.height}px`;
        clone.style.transform = `rotate(${rot})`;
        clone.style.boxShadow = '0 14px 26px rgba(0,0,0,0.24), 0 3px 8px rgba(0,0,0,0.14)';

        heroLightbox.classList.remove('active');
        unlockPageScroll();

        activeClone = null;
        activeSource = null;

        // Any one of the transitioning properties (top/left/width/height/transform/
        // box-shadow) can be the first to fire transitionend, so clean up on whichever
        // arrives first rather than waiting on a specific property that might not be
        // the one the browser reports — with a timer fallback in case none fire at all
        // (e.g. reduced-motion disabling transitions).
        let cleaned = false;
        const cleanup = () => {
            if (cleaned) return;
            cleaned = true;
            clone.remove();
            source.classList.remove('lifted');
        };
        clone.addEventListener('transitionend', cleanup, { once: true });
        setTimeout(cleanup, 650);
    }

    collage.addEventListener('click', (e) => {
        const item = e.target.closest('.collage-item');
        if (item) openPickup(item);
    });

    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('collage-clone')) closePickup();
    });

    heroLightboxClose.addEventListener('click', closePickup);

    // The blurred backdrop is built from several stacked, unclassed divs (for the
    // layered blur vignette), so a click anywhere in the backdrop lands on one of
    // those — not on .lightbox-scrim/.lightbox-blur themselves. The clone image sits
    // above this element entirely (it's a fixed-position sibling appended to <body>),
    // so any click that actually reaches heroLightbox is by definition outside the
    // photo — close on all of them, including ones that bubble up from the close
    // button itself (harmless, closePickup() is a no-op once already closed).
    heroLightbox.addEventListener('click', () => {
        closePickup();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closePickup();
    });
}

const growSelector = '.fullscreen-content > *:not(.photowall):not(.gallery):not(.hero), .photowall-item, .gallery > *, footer > *';
const growTargets = document.querySelectorAll(growSelector);

if (growTargets.length && 'IntersectionObserver' in window) {
    growTargets.forEach((el) => el.classList.add('scroll-grow'));

    const growObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('grown');
                growObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    growTargets.forEach((el) => growObserver.observe(el));
}
