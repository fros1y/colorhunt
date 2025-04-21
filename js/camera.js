// Camera handling functionality
(function () {
  const video = document.getElementById('camera');
  const startScreen = document.getElementById('startScreen');
  const camSel = document.getElementById('camSelect');
  let currentStream = null;

  // Hide start screen on mobile browsers
  function isMobile() {
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent);
  }

  if (isMobile()) {
    startScreen.style.display = 'none';
    startStream();
    populateCamSelect();
  }

  document.getElementById('startBtn').addEventListener('click', async () => {
    startScreen.style.display = 'none';
    await startStream();
    await populateCamSelect();
  });

  async function startStream(deviceId) {
    if (currentStream) { currentStream.getTracks().forEach(t => t.stop()); }
    const constraints = deviceId
      ? { video: { deviceId: { exact: deviceId } } }
      : { video: { facingMode: { ideal: 'environment' } } };

    try {
      currentStream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (e) {
      currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
    }

    video.srcObject = currentStream;
    await video.play();
  }

  async function populateCamSelect() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const vids = devices.filter(d => d.kind === 'videoinput');
    camSel.innerHTML = '';
    vids.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.deviceId;
      opt.text = v.label || `Camera ${camSel.length + 1}`;
      camSel.appendChild(opt);
    });

    if (camSel.options.length > 0) {
      camSel.value = currentStream.getVideoTracks()[0].getSettings().deviceId || camSel.options[0].value;
    }
  }

  camSel.addEventListener('change', () => startStream(camSel.value));

  // Export camera functions
  window.cameraModule = {
    startStream,
    populateCamSelect
  };
})();