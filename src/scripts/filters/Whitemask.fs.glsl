
precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;

void main() {
  float alpha = texture2D(uSampler, vTextureCoord).a;
  gl_FragColor = vec4(alpha);
}
