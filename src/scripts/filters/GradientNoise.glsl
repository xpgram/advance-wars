precision mediump float;

// PIXI
varying vec2 vTextureCoord;
uniform sampler2D uSampler;

// Custom
uniform vec2 uResolution;
uniform float uSize;                            // The density of the generated texture. Default 16.
uniform float uBrightness;                      // Default .5
uniform float uContrast;                        // Default 0
uniform int octaves;                            // Default 0
uniform float uSeed;                            // I need to split this into four numbers
uniform bool uPixelated;

// Custom — Changing
uniform float uTime;

// Constants
//


vec2 random2(vec2 st){
    float r = 43758.5453123 + uTime;
    st = vec2( dot(st,vec2(127.1,311.7)),       // Modify these vectors to change the seed
               dot(st,vec2(269.5,183.3)) );
    return -1.0 + 2.0*fract(sin(st)*r);
}

// Gradient Noise by Inigo Quilez - iq/2013
// https://www.shadertoy.com/view/XdXGW8
float noise(vec2 st, float octave) {
    octave = pow(2., octave);
    st = st * uSize * octave;

    vec2 i = floor(st);
    vec2 f = fract(st);

    float m = (uPixelated) ? 8.5 : 10.;
    vec2 u = f*f*f*(f*(f*6.-15.)+m);

    float n = mix( mix( dot( random2(i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ),
                        dot( random2(i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                   mix( dot( random2(i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ),
                        dot( random2(i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
    
    float b = uBrightness / octave;
    float c = uContrast / octave;
    return n*(b + c) + b;
}

void main() {
    vec2 st = gl_FragCoord.xy / uResolution.xy;
    st.x *= uResolution.x / uResolution.y;
    
    float value = noise(st, 0.);
    value += noise(st, 1.);
    value += noise(st, 2.);
    value += noise(st, 3.);

    gl_FragColor = vec4(vec3(value),1.0);
}
