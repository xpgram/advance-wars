// #version 300 es    // WebGL2, but I don't know anything.

precision mediump float;

// varying vec2 vTextureCoord;   // PIXI
// uniform sampler2D uSampler;

uniform vec2 origin;          // Custom — These match the imported uniforms
// uniform float time;
// uniform float maxTime;
uniform int seed;

uniform float u_time;          // GLSL Canvas

float max_brightness = .6;    // Dev settings, toggles, etc.

// A function which returns 1.0
float one(vec2 a) {
  return 1.0;
}

void main() {
  // vec4 base = texture2D(uSampler, vTextureCoord);

  float test = one(vec2(0.5, 0.5));
  // stub

  gl_FragColor = vec4(abs(sin(u_time)));
}