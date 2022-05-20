// #version 300 es    // WebGL2, but I don't know anything.

precision mediump float;

varying vec2 vTextureCoord;   // PIXI
uniform sampler2D uSampler;

uniform vec2 origin;          // Custom — These match the imported uniforms
// uniform float time;
// uniform float maxTime;
uniform int seed;
// uniform float mean;
// uniform float std_deviation;

float mean = .5;              // Custom — Test vals
float std_deviation = .25;

float max_brightness = .6;    // Dev settings, toggles, etc.

const float PI = 3.142;       // Constants
const float E  = 2.718;


float gauss_distribution(float x) {
  float e_exponent = -.5*pow((x - mean) / std_deviation, 2.0);
  float e = pow(E, e_exponent);
  float n = 1.0 / (std_deviation * sqrt(2.0 * PI)) * e;
  return n;
}

float noiseAtPoint(vec4 p) {
  float x = gauss_distribution(p.x / u_resolution.x);
  float y = gauss_distribution(p.y / u_resolution.y);
  return x;
}



void main() {
  // vec4 base = texture2D(uSampler, vTextureCoord);

  float n = noiseAtPoint(a_normal);

  gl_FragColor = vec4(n, n, n, 1.0);
}
