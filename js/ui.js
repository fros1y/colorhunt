// UI handling functionality
(function () {
  const hueSlider = document.getElementById('hueSlider');
  const satSlider = document.getElementById('satSlider');
  const aboutBtn = document.getElementById('aboutBtn');
  const aboutModal = document.getElementById('aboutModal');
  const closeBtn = document.querySelector('.close');

  function updateSatGradient() {
    const [h1, h2] = hueSlider.noUiSlider.get().map(Number);
    let mid = h1 <= h2 ? (h1 + h2) / 2 : ((h1 + (h2 + 360)) / 2) % 360;
    satSlider.querySelector('.noUi-base').style.background = `linear-gradient(90deg,hsl(${mid},0%,50%) 0%,hsl(${mid},100%,50%) 100%)`;
  }

  // About modal functionality
  aboutBtn.addEventListener('click', () => {
    aboutModal.style.display = 'block';
  });

  closeBtn.addEventListener('click', () => {
    aboutModal.style.display = 'none';
  });

  window.addEventListener('click', (event) => {
    if (event.target === aboutModal) {
      aboutModal.style.display = 'none';
    }
  });

  // Initialize sliders
  function initSliders() {
    // Hue slider (if not already initialized)
    if (!hueSlider.noUiSlider) {
      noUiSlider.create(hueSlider, {
        start: [0, 60],
        connect: true,
        range: { min: 0, max: 360 },
        step: 1
      });
    }

    // Saturation slider (if not already initialized)
    if (!satSlider.noUiSlider) {
      noUiSlider.create(satSlider, {
        start: [50, 100],
        connect: true,
        range: { min: 0, max: 100 },
        step: 1
      });
    }

    // Add event listeners
    hueSlider.noUiSlider.on('update', updateSatGradient);

    // Initial update
    updateSatGradient();
  }

  // Export UI functions
  window.uiModule = {
    initSliders,
    updateSatGradient
  };

  // Initialize sliders
  initSliders();
})();