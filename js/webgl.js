// WebGL shader and rendering functionality
(function () {
  // Vertex shader
  const vsSource = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;
void main() {
  gl_Position = vec4(a_position, 0, 1);
  v_texCoord = a_texCoord;
}`;

  // Fragment shader
  const fsSource = `
precision mediump float;
varying vec2 v_texCoord;
uniform sampler2D u_image;
uniform float u_hMin, u_hMax, u_sMin, u_sMax, u_desat, u_hi;
uniform float u_zoom;
uniform vec2 u_zoomCenter;

vec3 rgb2hsv(vec3 c) {
  float r = c.r, g = c.g, b = c.b;
  float mx = max(max(r,g),b), mn = min(min(r,g),b);
  float d = mx - mn;
  float h = 0.0;
  if (d > 0.0) {
    if (mx == r) h = mod((g-b)/d,6.0);
    else if (mx == g) h = (b-r)/d + 2.0;
    else h = (r-g)/d + 4.0;
    h *= 60.0;
    if (h < 0.0) h += 360.0;
  }
  float s = mx == 0.0 ? 0.0 : d/mx;
  return vec3(h, s, mx);
}

void main() {
  // Apply zoom to texture coordinates
  vec2 zoomedCoord = v_texCoord;
  if (u_zoom > 1.0) {
    // Calculate coordinates relative to zoom center
    zoomedCoord = (v_texCoord - u_zoomCenter) / u_zoom + u_zoomCenter;
  }

  // Get color from zoomed coordinates (only if in bounds)
  vec4 color;
  if (zoomedCoord.x >= 0.0 && zoomedCoord.x <= 1.0 && 
      zoomedCoord.y >= 0.0 && zoomedCoord.y <= 1.0) {
    color = texture2D(u_image, zoomedCoord);
  } else {
    // Show black for out of bounds
    color = vec4(0.0, 0.0, 0.0, 1.0);
    gl_FragColor = color;
    return;
  }

  vec3 hsv = rgb2hsv(color.rgb);
  float h = hsv.x;
  float s = hsv.y * 100.0;
  float v = hsv.z;
  bool hueMatch = (u_hMin <= u_hMax) ? (h >= u_hMin && h <= u_hMax) : (h >= u_hMin || h <= u_hMax);
  bool match = hueMatch && s >= u_sMin && s <= u_sMax;
  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  if (match) {
    float satFactor = 1.0 + u_hi;
    vec3 ncolor = gray + (color.rgb - gray) * satFactor;
    gl_FragColor = vec4(clamp(ncolor, 0.0, 1.0), 1.0);
  } else {
    vec3 ncolor = color.rgb * u_desat + gray * (1.0 - u_desat);
    gl_FragColor = vec4(ncolor, 1.0);
  }
}`;

  // Compile shader utility
  function compileShader(gl, src, type) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(s);
    return s;
  }

  // Initialize WebGL with the canvas
  function initWebGL(canvas) {
    const gl = canvas.getContext('webgl');
    if (!gl) {
      alert('WebGL not supported');
      return null;
    }

    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      alert('WebGL context lost. Please reload the page.');
    });

    // Create program
    const program = gl.createProgram();
    gl.attachShader(program, compileShader(gl, vsSource, gl.VERTEX_SHADER));
    gl.attachShader(program, compileShader(gl, fsSource, gl.FRAGMENT_SHADER));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw gl.getProgramInfoLog(program);

    // Look up locations
    const posLoc = gl.getAttribLocation(program, 'a_position');
    const texLoc = gl.getAttribLocation(program, 'a_texCoord');
    const u_image = gl.getUniformLocation(program, 'u_image');
    const u_hMin = gl.getUniformLocation(program, 'u_hMin');
    const u_hMax = gl.getUniformLocation(program, 'u_hMax');
    const u_sMin = gl.getUniformLocation(program, 'u_sMin');
    const u_sMax = gl.getUniformLocation(program, 'u_sMax');
    const u_desat = gl.getUniformLocation(program, 'u_desat');
    const u_hi = gl.getUniformLocation(program, 'u_hi');
    const u_zoom = gl.getUniformLocation(program, 'u_zoom');
    const u_zoomCenter = gl.getUniformLocation(program, 'u_zoomCenter');

    // Fullscreen quad
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 0, 1,
      1, -1, 1, 1,
      -1, 1, 0, 0,
      1, 1, 1, 0,
    ]), gl.STATIC_DRAW);

    // Texture for video frame
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    return {
      gl,
      program,
      quad,
      tex,
      posLoc,
      texLoc,
      uniforms: {
        u_image,
        u_hMin,
        u_hMax,
        u_sMin,
        u_sMax,
        u_desat,
        u_hi,
        u_zoom,
        u_zoomCenter
      }
    };
  }

  // Export WebGL module
  window.webglModule = {
    initWebGL,
    compileShader
  };
})();