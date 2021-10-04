
// TODO There are really only two uniforms necessary.
// And with a little rework, only one, but eh.
// Anyway, I need to tell game to update it.
// But I also need to tell game to stop updating it.
// Hm.
// I'm tired.

export function TintSpotlight(baseRect: PIXI.Rectangle, lightRect: PIXI.Rectangle): PIXI.Filter {

  const fragment = `

  precision mediump float;
  varying vec2 vTextureCoord;   // PIXI
  uniform sampler2D uSampler;
  uniform vec2 spotlightRange;  // Custom
  uniform float spotlightWidth;
  uniform vec2 dimensions;
  uniform vec2 offset;
  uniform vec3 tint;
  uniform float time;
  
  float max_brightness = .7;    // Settings
  float light_diffusion = .8; // lower is more diffuse; default is 1.0
  
  float brightness(vec2 a, vec2 b) {
    float grad = distance(a, b) / spotlightWidth;
    grad = clamp(1.0 - grad, 0.0, max_brightness);
    grad = pow(grad, light_diffusion);    // Brightens the middle
    return grad;
  }
  
  void main() {
    vec4 base = texture2D(uSampler, vTextureCoord);
  
    vec4 c1 = vec4(tint, base.a);           // Base color.
    vec4 c2 = vec4(tint*.3 + .7, base.a);   // Spotlight color.
    
    vec2 pos = vTextureCoord * dimensions + offset;
    
    vec2 lightsource = vec2(
      clamp(sin(time - 3.14)*.6+.5, 0.0, 1.0),
      clamp(cos(time - 3.14)*.6+.5, 0.0, 1.0)
    ) * spotlightRange;
    
    float intensity = brightness(pos, lightsource);
    
    vec4 color = mix(base, c1, .4);
    color = mix(color, c2, intensity);
    color *= base.a;
    color.a = base.a;
    
    gl_FragColor = vec4(color);
  }
  
  `;
  
  const uniforms = {
    spotlightRange: [lightRect.width, lightRect.height],
    spotlightWidth: lightRect.width/2,
    dimensions: [baseRect.width, baseRect.height],
    offset: [baseRect.x, baseRect.y],
    tint: [0,1,0],
    time: 0,
  }

  return new PIXI.Filter('', fragment, uniforms);
}
