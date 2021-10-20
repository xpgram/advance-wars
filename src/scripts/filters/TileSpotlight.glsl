
precision mediump float;
varying vec2 vTextureCoord;   // PIXI
uniform sampler2D uSampler;
uniform vec2 dimensions;      // Custom
uniform float time;

float max_brightness = .6;    // Settings
float light_diffusion = .7;     // lower is more diffuse; default is 1.0

float brightness(vec2 a, vec2 b) {
  float light_width = min(dimensions.x, dimensions.y) * .90;

  float grad = distance(a, b) / light_width;
  grad = clamp(1.0 - grad, 0.0, max_brightness);
  grad = pow(grad, light_diffusion);    // Brightens the middle
  return grad;
}

vec2 pixelate(vec2 a) {
  return vec2(
    floor(a.x * 16.0) / 16.0,
    floor(a.y * 16.0) / 16.0
  );
}

void main() {
  vec4 base = texture2D(uSampler, vTextureCoord);

  vec4 c1 = vec4(vec3(0.6), 1.0);   // Root color.
  vec4 c2 = vec4(1.0);              // Spotlight color.

  vec2 light_dimensions = vec2(dimensions.x, dimensions.y / 2.0);
  vec2 light_offset = vec2(0.0, dimensions.y / 2.0);
  
  vec2 pos = pixelate(vTextureCoord) * dimensions;
  
  vec2 lightsource = pixelate(vec2(
    clamp(sin(time - 3.14)*.7+.5, 0.0, 1.0),
    clamp(cos(time - 3.14)*.7+.5, 0.0, 1.0)
  )) * light_dimensions + light_offset;
  
  float intensity = brightness(pos, lightsource);
  
  vec4 color = mix(c1, c2, intensity);
  color *= base.a * 1.1;
  
  gl_FragColor = color;
}
