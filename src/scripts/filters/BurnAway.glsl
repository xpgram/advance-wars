
precision mediump float;

varying vec2 vTextureCoord;   // PIXI
uniform sampler2D uSampler;

uniform vec2 origin;          // Custom — These match the imported uniforms
uniform float slider;
uniform int seed;

float max_brightness = .6;    // Dev settings, toggles, etc.

// A function which returns 1.0
float one(vec2 a) {
  return 1.0;
}

void main() {
  vec4 base = texture2D(uSampler, vTextureCoord);

  // stuff

  gl_FragColor = base;
}