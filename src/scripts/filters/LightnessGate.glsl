
precision mediump float;
varying vec2 vTextureCoord;   // PIXI
uniform sampler2D uSampler;

float gate = .525;
float gateRange = .15;

float width = 16.0*20.0;
float height = 16.0*12.0;

float pick(float lum, float a, float b, float coefficient) {
  float lim = (gateRange*coefficient) + gate - gateRange/2.0;
  return (lum > lim) ? b : a;
}

float quantize(float n) {
  float q = 4.0;
  return floor(n * q) / q;
}

void main() {
  vec4 base = texture2D(uSampler, vTextureCoord);
  float lum = (0.2126*base.r + 0.7152*base.g + 0.0722*base.b);
  // float lum = (base.r + base.g + base.b)/3.0;

  vec2 coord = vTextureCoord * vec2(width,height);
  coord = vec2(floor(coord.x), floor(coord.y));

  float lightGate = quantize(mod(coord.x, 2.0)) * quantize(mod(coord.y, 2.0)) / 2.0;

  vec4 black = vec4(0, 0, 0, 1);
  vec4 gray = vec4(.20, .15, .20, 1);

  vec4 color = vec4(
    pick(lum, black.r, gray.r, lightGate),
    pick(lum, black.g, gray.g, lightGate),
    pick(lum, black.b, gray.b, lightGate),
    1
  );

  gl_FragColor = color;
}