// Main application file for Color Hunt
(function () {
  const video = document.getElementById('camera');
  const canvas = document.getElementById('overlay');

  const desatEl = document.getElementById('desat');
  const hiEl = document.getElementById('highlight');
  let currentStream = null;

  // Add zoom state variables
  let zoomLevel = 1.0;
  let zoomCenterX = 0.5;
  let zoomCenterY = 0.5;
  let lastDistance = 0;
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;

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
    
    // Set zoom uniforms
    gl.uniform1f(uniforms.u_zoom, zoomLevel);
    gl.uniform2f(uniforms.u_zoomCenter, zoomCenterX, zoomCenterY);

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

  // Touch event handlers for pinch zoom
  canvas.addEventListener('touchstart', handleTouchStart, false);
  canvas.addEventListener('touchmove', handleTouchMove, false);
  canvas.addEventListener('touchend', handleTouchEnd, false);

  function handleTouchStart(event) {
    event.preventDefault();
    const touches = event.touches;
    
    // Pinch detection
    if (touches.length === 2) {
      const touch1 = touches[0];
      const touch2 = touches[1];
      lastDistance = getDistance(touch1, touch2);
      isDragging = false;
    } 
    // Drag detection
    else if (touches.length === 1) {
      isDragging = true;
      lastX = touches[0].clientX;
      lastY = touches[0].clientY;
    }
  }

  function handleTouchMove(event) {
    event.preventDefault();
    const touches = event.touches;
    
    // Handle pinch zoom
    if (touches.length === 2) {
      const touch1 = touches[0];
      const touch2 = touches[1];
      const currentDistance = getDistance(touch1, touch2);
      
      // Calculate zoom factor
      if (lastDistance > 0) {
        const delta = currentDistance / lastDistance;
        
        // Limit zoom between 1.0 and 4.0
        zoomLevel = Math.max(1.0, Math.min(4.0, zoomLevel * delta));
        
        // Calculate center point of the pinch
        const centerX = (touch1.clientX + touch2.clientX) / 2;
        const centerY = (touch1.clientY + touch2.clientY) / 2;
        
        // Convert to normalized coordinates (0-1)
        zoomCenterX = centerX / window.innerWidth;
        zoomCenterY = centerY / window.innerHeight;
      }
      
      lastDistance = currentDistance;
    } 
    // Handle panning when zoomed in
    else if (touches.length === 1 && isDragging && zoomLevel > 1.0) {
      const touch = touches[0];
      const deltaX = (touch.clientX - lastX) / window.innerWidth;
      const deltaY = (touch.clientY - lastY) / window.innerHeight;
      
      // Adjust zoom center with limits
      const moveScale = 0.01 * zoomLevel; // Scale movement based on zoom level
      zoomCenterX = Math.max(0, Math.min(1, zoomCenterX - deltaX * moveScale));
      zoomCenterY = Math.max(0, Math.min(1, zoomCenterY - deltaY * moveScale));
      
      lastX = touch.clientX;
      lastY = touch.clientY;
    }
  }

  function handleTouchEnd(event) {
    event.preventDefault();
    if (event.touches.length < 2) {
      lastDistance = 0;
    }
    if (event.touches.length === 0) {
      isDragging = false;
    }
  }

  function getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Double tap to reset zoom
  let lastTap = 0;
  canvas.addEventListener('touchend', function(event) {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength < 300 && tapLength > 0 && event.touches.length === 0) {
      // Double tap detected
      zoomLevel = 1.0;
      zoomCenterX = 0.5;
      zoomCenterY = 0.5;
    }
    lastTap = currentTime;
  });

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
    },
    resetZoom: () => {
      zoomLevel = 1.0;
      zoomCenterX = 0.5;
      zoomCenterY = 0.5;
    }
  };
})();