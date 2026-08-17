if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

const hamMenu = document.querySelector('.ham-menu');
const offScreenMenu = document.querySelector('.off-screen-menu');

hamMenu.addEventListener('click', () => {
    hamMenu.classList.toggle('active');
    offScreenMenu.classList.toggle('active');
})

const navbar = document.querySelector('.nav-header');
const scroller = document.body;
scroller.scrollTop = 0;
let lastScrollY = 0;

scroller.addEventListener('scroll', () => {
    const currentScrollY = scroller.scrollTop;

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
            openLightbox(e.target.src, e.target.alt);
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