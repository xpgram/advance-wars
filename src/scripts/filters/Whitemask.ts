
const fragment = `

varying ve2 vTextureCoord;
uniform sampler2D uSampler;

void main() {
  float alpha = texture2D(uSampler, vTextureCoord).a;
  gl_FragColor = vec4( vec3(1.0)*alpha, alpha );
}

`;

export const whitemask = new PIXI.Filter('', fragment, {});
