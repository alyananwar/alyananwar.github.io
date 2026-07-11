// Liquid-chrome landing name (Y2K liquid metal).
// Shader adapted from paper-design/liquid-logo (https://github.com/paper-design/liquid-logo).
// Exposes window.initLiquidName(canvas) -> boolean; script.js falls back to the
// dot-matrix renderer when this returns false (no WebGL2, compile failure).
(function () {
  "use strict";

  var VERT_SRC =
    "#version 300 es\n" +
    "precision mediump float;\n" +
    "in vec2 a_position;\n" +
    "out vec2 vUv;\n" +
    "void main() {\n" +
    "  vUv = .5 * (a_position + 1.);\n" +
    "  gl_Position = vec4(a_position, 0.0, 1.0);\n" +
    "}";

  // Fragment shader from paper-design/liquid-logo, unchanged.
  var FRAG_SRC = `#version 300 es
precision mediump float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D u_image_texture;
uniform float u_time;
uniform float u_ratio;
uniform float u_img_ratio;
uniform float u_patternScale;
uniform float u_refraction;
uniform float u_edge;
uniform float u_patternBlur;
uniform float u_liquid;

#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846

vec3 mod289(vec3 x) { return x - floor(x * (1. / 289.)) * 289.; }
vec2 mod289(vec2 x) { return x - floor(x * (1. / 289.)) * 289.; }
vec3 permute(vec3 x) { return mod289(((x*34.)+1.)*x); }
float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1., 0.) : vec2(0., 1.);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0., i1.y, 1.)) + i.x + vec3(0., i1.x, 1.));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.);
    m = m*m;
    m = m*m;
    vec3 x = 2. * fract(p * C.www) - 1.;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130. * dot(m, g);
}

vec2 get_img_uv() {
    vec2 img_uv = vUv;
    img_uv -= .5;
    if (u_ratio > u_img_ratio) {
        img_uv.x = img_uv.x * u_ratio / u_img_ratio;
    } else {
        img_uv.y = img_uv.y * u_img_ratio / u_ratio;
    }
    float scale_factor = 1.;
    img_uv *= scale_factor;
    img_uv += .5;
    img_uv.y = 1. - img_uv.y;
    return img_uv;
}
vec2 rotate(vec2 uv, float th) {
    return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}
float get_color_channel(float c1, float c2, float stripe_p, vec3 w, float extra_blur, float b) {
    float ch = c2;
    float border = 0.;
    float blur = u_patternBlur + extra_blur;

    ch = mix(ch, c1, smoothstep(.0, blur, stripe_p));

    border = w[0];
    ch = mix(ch, c2, smoothstep(border - blur, border + blur, stripe_p));

    b = smoothstep(.2, .8, b);
    border = w[0] + .4 * (1. - b) * w[1];
    ch = mix(ch, c1, smoothstep(border - blur, border + blur, stripe_p));

    border = w[0] + .5 * (1. - b) * w[1];
    ch = mix(ch, c2, smoothstep(border - blur, border + blur, stripe_p));

    border = w[0] + w[1];
    ch = mix(ch, c1, smoothstep(border - blur, border + blur, stripe_p));

    float gradient_t = (stripe_p - w[0] - w[1]) / w[2];
    float gradient = mix(c1, c2, smoothstep(0., 1., gradient_t));
    ch = mix(ch, gradient, smoothstep(border - blur, border + blur, stripe_p));

    return ch;
}

float get_img_frame_alpha(vec2 uv, float img_frame_width) {
    float img_frame_alpha = smoothstep(0., img_frame_width, uv.x) * smoothstep(1., 1. - img_frame_width, uv.x);
    img_frame_alpha *= smoothstep(0., img_frame_width, uv.y) * smoothstep(1., 1. - img_frame_width, uv.y);
    return img_frame_alpha;
}

void main() {
    vec2 uv = vUv;
    uv.y = 1. - uv.y;
    uv.x *= u_ratio;

    float diagonal = uv.x - uv.y;

    float t = .001 * u_time;

    vec2 img_uv = get_img_uv();
    vec4 img = texture(u_image_texture, img_uv);

    vec3 color = vec3(0.);
    float opacity = 1.;

    vec3 color1 = vec3(.98, 0.98, 1.);
    vec3 color2 = vec3(.1, .1, .1 + .1 * smoothstep(.7, 1.3, uv.x + uv.y));

    float edge = img.r;

    vec2 grad_uv = uv;
    grad_uv -= .5;

    float dist = length(grad_uv + vec2(0., .2 * diagonal));

    grad_uv = rotate(grad_uv, (.25 - .2 * diagonal) * PI);

    float bulge = pow(1.8 * dist, 1.2);
    bulge = 1. - bulge;
    bulge *= pow(uv.y, .3);

    float cycle_width = u_patternScale;
    float thin_strip_1_ratio = .12 / cycle_width * (1. - .4 * bulge);
    float thin_strip_2_ratio = .07 / cycle_width * (1. + .4 * bulge);
    float wide_strip_ratio = (1. - thin_strip_1_ratio - thin_strip_2_ratio);

    float thin_strip_1_width = cycle_width * thin_strip_1_ratio;
    float thin_strip_2_width = cycle_width * thin_strip_2_ratio;

    opacity = 1. - smoothstep(.9 - .5 * u_edge, 1. - .5 * u_edge, edge);
    opacity *= get_img_frame_alpha(img_uv, 0.01);

    float noise = snoise(uv - t);

    edge += (1. - edge) * u_liquid * noise;

    float refr = 0.;
    refr += (1. - bulge);
    refr = clamp(refr, 0., 1.);

    float dir = grad_uv.x;

    dir += diagonal;

    dir -= 2. * noise * diagonal * (smoothstep(0., 1., edge) * smoothstep(1., 0., edge));

    bulge *= clamp(pow(uv.y, .1), .3, 1.);
    dir *= (.1 + (1.1 - edge) * bulge);

    dir *= smoothstep(1., .7, edge);

    dir += .18 * (smoothstep(.1, .2, uv.y) * smoothstep(.4, .2, uv.y));
    dir += .03 * (smoothstep(.1, .2, 1. - uv.y) * smoothstep(.4, .2, 1. - uv.y));

    dir *= (.5 + .5 * pow(uv.y, 2.));

    dir *= cycle_width;

    dir -= t;

    float refr_r = refr;
    refr_r += .03 * bulge * noise;
    float refr_b = 1.3 * refr;

    refr_r += 5. * (smoothstep(-.1, .2, uv.y) * smoothstep(.5, .1, uv.y)) * (smoothstep(.4, .6, bulge) * smoothstep(1., .4, bulge));
    refr_r -= diagonal;

    refr_b += (smoothstep(0., .4, uv.y) * smoothstep(.8, .1, uv.y)) * (smoothstep(.4, .6, bulge) * smoothstep(.8, .4, bulge));
    refr_b -= .2 * edge;

    refr_r *= u_refraction;
    refr_b *= u_refraction;

    vec3 w = vec3(thin_strip_1_width, thin_strip_2_width, wide_strip_ratio);
    w[1] -= .02 * smoothstep(.0, 1., edge + bulge);
    float stripe_r = mod(dir + refr_r, 1.);
    float r = get_color_channel(color1.r, color2.r, stripe_r, w, 0.02 + .03 * u_refraction * bulge, bulge);
    float stripe_g = mod(dir, 1.);
    float g = get_color_channel(color1.g, color2.g, stripe_g, w, 0.01 / (1. - diagonal), bulge);
    float stripe_b = mod(dir - refr_b, 1.);
    float b = get_color_channel(color1.b, color2.b, stripe_b, w, .01, bulge);

    color = vec3(r, g, b);

    color *= opacity;

    fragColor = vec4(color, opacity);
}`;

  // Tuning knobs (same names/defaults as the liquid-logo controls)
  var PARAMS = {
    refraction: 0.02,
    edge: 0.4,
    patternBlur: 0.005,
    liquid: 0.07,
    speed: 0.3,
    patternScale: 4,
  };

  // Rasterize "ALYAN / ANWAR" and build the beveled mask the shader expects:
  // white outside the letters, dark ridge falling to bright at glyph edges.
  // ponytail: chamfer distance transform instead of the repo's 300-pass Poisson
  // solve; visually close for text strokes and runs in ~1 frame instead of
  // blocking the landing for seconds. Swap in the Poisson solve if the bevel
  // ever looks too linear.
  function buildNameMask() {
    var W = 1200;
    var H = 720; // same 0.6 aspect the canvas displays at
    var c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    var ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 " + Math.round(H * 0.42) + 'px "Space Grotesk", sans-serif';
    // Stroke pass fattens the glyphs; thin stems don't leave the shader
    // enough interior to build the chrome bevel ("shapes work better than
    // words" per the liquid-logo readme)
    ctx.strokeStyle = "#000";
    ctx.lineWidth = H * 0.02;
    ctx.lineJoin = "round";
    ctx.strokeText("ALYAN", W / 2, H * 0.27);
    ctx.fillText("ALYAN", W / 2, H * 0.27);
    ctx.strokeText("ANWAR", W / 2, H * 0.73);
    ctx.fillText("ANWAR", W / 2, H * 0.73);

    var src = ctx.getImageData(0, 0, W, H).data;
    var n = W * H;
    var INF = 1e9;
    var dist = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      // shape = anything that isn't pure white (matches liquid-logo's mask rule)
      dist[i] =
        src[i * 4] === 255 && src[i * 4 + 1] === 255 && src[i * 4 + 2] === 255
          ? 0
          : INF;
    }

    // Two-pass (3,4)-chamfer distance to the nearest outside pixel
    var x, y, idx, d;
    for (y = 0; y < H; y++) {
      for (x = 0; x < W; x++) {
        idx = y * W + x;
        d = dist[idx];
        if (d === 0) continue;
        if (x > 0) d = Math.min(d, dist[idx - 1] + 3);
        if (y > 0) {
          d = Math.min(d, dist[idx - W] + 3);
          if (x > 0) d = Math.min(d, dist[idx - W - 1] + 4);
          if (x < W - 1) d = Math.min(d, dist[idx - W + 1] + 4);
        }
        dist[idx] = d;
      }
    }
    var maxD = 0;
    for (y = H - 1; y >= 0; y--) {
      for (x = W - 1; x >= 0; x--) {
        idx = y * W + x;
        d = dist[idx];
        if (d !== 0) {
          if (x < W - 1) d = Math.min(d, dist[idx + 1] + 3);
          if (y < H - 1) {
            d = Math.min(d, dist[idx + W] + 3);
            if (x < W - 1) d = Math.min(d, dist[idx + W + 1] + 4);
            if (x > 0) d = Math.min(d, dist[idx + W - 1] + 4);
          }
          dist[idx] = d;
        }
        if (d > maxD && d < INF) maxD = d;
      }
    }

    // Same remap as parse-logo-image.ts: raw^2, inverted into a gray ramp
    var out = new Uint8Array(n * 4);
    for (i = 0; i < n; i++) {
      var gray = 255;
      if (dist[i] > 0) {
        var raw = dist[i] / maxD;
        gray = Math.round(255 * (1 - raw * raw));
      }
      out[i * 4] = gray;
      out[i * 4 + 1] = gray;
      out[i * 4 + 2] = gray;
      out[i * 4 + 3] = 255;
    }
    return { data: out, width: W, height: H };
  }

  function compile(gl, src, type) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  window.initLiquidName = function (canvas) {
    var gl = canvas.getContext("webgl2", {
      antialias: true,
      alpha: true,
      premultipliedAlpha: true,
    });
    if (!gl) return false;

    var vs = compile(gl, VERT_SRC, gl.VERTEX_SHADER);
    var fs = compile(gl, FRAG_SRC, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return false;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);

    var u = {};
    var count = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < count; i++) {
      var name = gl.getActiveUniform(prog, i).name;
      u[name] = gl.getUniformLocation(prog, name);
    }

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    var loc = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var mask = buildNameMask();
    var tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      mask.width,
      mask.height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      mask.data,
    );
    gl.uniform1i(u.u_image_texture, 0);

    gl.uniform1f(u.u_edge, PARAMS.edge);
    gl.uniform1f(u.u_patternBlur, PARAMS.patternBlur);
    gl.uniform1f(u.u_patternScale, PARAMS.patternScale);
    gl.uniform1f(u.u_refraction, PARAMS.refraction);
    gl.uniform1f(u.u_liquid, PARAMS.liquid);
    gl.uniform1f(u.u_img_ratio, mask.width / mask.height);

    function size() {
      var holder = canvas.parentElement;
      var cssW = Math.min(holder.clientWidth * 0.88, 860);
      var cssH = cssW * 0.6;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = cssW + "px";
      canvas.style.height = cssH + "px";
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(u.u_ratio, canvas.width / canvas.height);
    }
    size();
    var resizeTimer;
    window.addEventListener(
      "resize",
      function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(size, 150);
      },
      { passive: true },
    );

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      // Static chrome frame, no animation loop
      gl.uniform1f(u.u_time, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      return true;
    }

    var landing = document.getElementById("landing");
    var total = 0;
    var last = performance.now();
    function frame(now) {
      var dt = now - last;
      last = now;
      // Skip GPU work once the zoom-through has faded the landing out
      // (class toggles back off when the user scrolls up and re-enters)
      if (
        !document.hidden &&
        !(landing && landing.classList.contains("landing-done"))
      ) {
        total += dt * PARAMS.speed;
        gl.uniform1f(u.u_time, total);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return true;
  };
})();
