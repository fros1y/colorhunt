// Camera handling functionality
(function () {
  const video = document.getElementById('camera');
  const startScreen = document.getElementById('startScreen');
  let currentStream = null;

  // Hide start screen on mobile browsers
  function isMobile() {
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent);
  }

  if (isMobile()) {
    startScreen.style.display = 'none';
    startStream();
  }

  document.getElementById('startBtn').addEventListener('click', async () => {
    startScreen.style.display = 'none';
    await startStream();
  });

  async function startStream() {
    if (currentStream) { currentStream.getTracks().forEach(t => t.stop()); }
    const constraints = { video: { facingMode: { ideal: 'environment' } } };

    try {
      currentStream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (e) {
      currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
    }

    video.srcObject = currentStream;
    await video.play();
  }

  // Export camera functions
  window.cameraModule = {
    startStream
  };
})();