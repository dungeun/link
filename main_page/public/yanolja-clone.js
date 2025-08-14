document.addEventListener('DOMContentLoaded', () => {
    const mainBanner = document.getElementById('mainBanner');
    const paginationDots = document.getElementById('paginationDots');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const slides = Array.from(mainBanner.children);
    const totalSlides = slides.length;
    let currentIndex = 0;
    let slideInterval;
    let isPlaying = true;

    // Create pagination dots
    for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        dot.addEventListener('click', () => goToSlide(i));
        paginationDots.appendChild(dot);
    }

    const dots = Array.from(paginationDots.children);

    function updateSlider() {
        // Calculate how many slides are visible based on current width
        let slidesPerView;
        const containerWidth = mainBanner.offsetWidth;

        if (window.innerWidth >= 1440) {
            slidesPerView = 4;
        } else if (window.innerWidth >= 768) {
            slidesPerView = 2;
        } else {
            slidesPerView = 1;
        }

        // Adjust currentIndex to ensure it's within valid range for the current view
        const maxIndex = totalSlides - slidesPerView;
        if (currentIndex > maxIndex) {
            currentIndex = maxIndex;
        }
        if (currentIndex < 0) {
            currentIndex = 0;
        }

        const slideWidth = slides[0].offsetWidth + 20; // slide width + margin-right
        mainBanner.style.transform = `translateX(-${currentIndex * slideWidth}px)`;

        // Update active dot
        dots.forEach((dot, index) => {
            if (index === currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    function goToSlide(index) {
        currentIndex = index;
        updateSlider();
    }

    function nextSlide() {
        let slidesPerView;
        if (window.innerWidth >= 1440) {
            slidesPerView = 4;
        } else if (window.innerWidth >= 768) {
            slidesPerView = 2;
        } else {
            slidesPerView = 1;
        }

        const maxIndex = totalSlides - slidesPerView;
        currentIndex = (currentIndex + 1) > maxIndex ? 0 : currentIndex + 1;
        updateSlider();
    }

    function startSlideShow() {
        slideInterval = setInterval(nextSlide, 3000); // Change slide every 3 seconds
        isPlaying = true;
        playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    }

    function pauseSlideShow() {
        clearInterval(slideInterval);
        isPlaying = false;
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }

    playPauseBtn.addEventListener('click', () => {
        if (isPlaying) {
            pauseSlideShow();
        } else {
            startSlideShow();
        }
    });

    // Initial setup
    updateSlider();
    startSlideShow();

    // Update slider on window resize
    window.addEventListener('resize', () => {
        updateSlider();
        // Restart slideshow to adjust to new slide count if playing
        if (isPlaying) {
            pauseSlideShow();
            startSlideShow();
        }
    });
});
