// Main application file for Color Hunt
(function () {
  const video = document.getElementById('camera');
  const canvas = document.getElementById('overlay');

  const desatEl = document.getElementById('desat');
  const hiEl = document.getElementById('highlight');
  let currentStream = null;

  /* Initialize WebGL */
  const webgl = webglModule.initWebGL(canvas);
  if (!webgl) return;

  const { gl, program, quad, tex, posLoc, texLoc, uniforms } = webgl;

  function updateQuad() {
    const vr = video.videoWidth / video.videoHeight;
    const sr = innerWidth / innerHeight;
    let sx = 1, sy = 1;
    if (vr > sr) sy = sr / vr; else sx = vr / sr;
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -sx, -sy, 0, 1, sx, -sy, 1, 1, -sx, sy, 0, 0, sx, sy, 1, 0]), gl.STATIC_DRAW);
  }

  /* Resize */
  function fit() {
    if (!video.videoWidth) return;

    // Get device pixel ratio
    const dpr = window.devicePixelRatio || 1;

    // Set canvas dimensions to match the window size, scaled by the pixel ratio
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    // Set the canvas style dimensions to match the window size
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    // Set WebGL viewport to match the canvas size
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  let animationId = null;

  function draw(now, metadata) {
    if (video.readyState < 2 || !video.videoWidth) {
      animationId = video.requestVideoFrameCallback(draw);
      return;
    }

    // Process frame
    gl.useProgram(program);

    // Set uniforms only when they change, not every frame
    const [hMin, hMax] = hueSlider.noUiSlider.get().map(Number);
    const [sMin, sMax] = satSlider.noUiSlider.get().map(Number);
    const desat = +desatEl.value / 100;
    const hi = +hiEl.value / 100;

    // Upload video frame as texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);

    // Set uniforms
    gl.uniform1i(uniforms.u_image, 0);
    gl.uniform1f(uniforms.u_hMin, hMin);
    gl.uniform1f(uniforms.u_hMax, hMax);
    gl.uniform1f(uniforms.u_sMin, sMin);
    gl.uniform1f(uniforms.u_sMax, sMax);
    gl.uniform1f(uniforms.u_desat, desat);
    gl.uniform1f(uniforms.u_hi, hi);

    // Set up quad (this doesn't need to happen every frame if it's not changing)
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(texLoc);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 16, 8);

    // Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Schedule next frame
    animationId = video.requestVideoFrameCallback(draw);
  }

  // Start the process
  video.onloadedmetadata = () => {
    fit();
    updateQuad();
    animationId = video.requestVideoFrameCallback(draw);
  };

  // Add cleanup if needed
  function cleanup() {
    if (animationId) {
      video.cancelVideoFrameCallback(animationId);
    }
  }

  window.addEventListener('resize', () => { fit(); updateQuad(); });

  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      fit();
      updateQuad();
    }, 200);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && animationId) {
      video.cancelVideoFrameCallback(animationId);
      animationId = null;
    } else if (!document.hidden && !animationId) {
      animationId = video.requestVideoFrameCallback(draw);
    }
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
  }

  // Export functions for use in other modules
  window.colorHunt = {
    updateQuad,
    fit,
    startAnimation: () => {
      if (!animationId) {
        animationId = video.requestVideoFrameCallback(draw);
      }
    },
    stopAnimation: () => {
      if (animationId) {
        video.cancelVideoFrameCallback(animationId);
        animationId = null;
      }
    }
  };
})();