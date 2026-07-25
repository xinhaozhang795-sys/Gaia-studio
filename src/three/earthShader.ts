import * as THREE from 'three';
import { SUN_DIRECTION } from '@/three/orbital';

/**
 * Procedural Earth — Sprint 2
 * PBR ocean with GGX specular + Fresnel, animated waves, sun-angle colour shift.
 * Accurate soft terminator with sunset/sunrise orange tint.
 * City lights on night side with realistic falloff.
 */

// ─── Shared noise library ───────────────────────────────────────────────────
const NOISE_GLSL = /* glsl */ `
  vec3 _mod289v3(vec3 x){return x-floor(x*(1./289.))*289.;}
  vec4 _mod289v4(vec4 x){return x-floor(x*(1./289.))*289.;}
  vec4 _perm(vec4 x){return _mod289v4(((x*34.)+1.)*x);}
  vec4 _tiSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}

  float snoise(vec3 v){
    const vec2 C=vec2(1./6.,1./3.);
    const vec4 D=vec4(0.,.5,1.,2.);
    vec3 i=floor(v+dot(v,C.yyy));
    vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);
    vec3 l=1.-g;
    vec3 i1=min(g.xyz,l.zxy);
    vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;
    vec3 x2=x0-i2+C.yyy;
    vec3 x3=x0-D.yyy;
    i=_mod289v3(i);
    vec4 p=_perm(_perm(_perm(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
    float n_=0.142857142857;
    vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z);
    vec4 y_=floor(j-7.*x_);
    vec4 x=x_*ns.x+ns.yyyy;
    vec4 y=y_*ns.x+ns.yyyy;
    vec4 h=1.-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);
    vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.+1.;
    vec4 s1=floor(b1)*2.+1.;
    vec4 sh=-step(h,vec4(0.));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
    vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);
    vec3 p1=vec3(a0.zw,h.y);
    vec3 p2=vec3(a1.xy,h.z);
    vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=_tiSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
    m=m*m;
    return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  float fbm(vec3 p,int oct,float lac,float gain){
    float s=0.;float a=.5;float f=1.;
    for(int i=0;i<8;i++){if(i>=oct)break;s+=a*snoise(p*f);f*=lac;a*=gain;}
    return s;
  }

  float ridged(vec3 p,int oct,float lac,float gain){
    float s=0.;float a=.5;float f=1.;
    for(int i=0;i<8;i++){if(i>=oct)break;float n=1.-abs(snoise(p*f));n*=n;s+=a*n;f*=lac;a*=gain;}
    return s;
  }
`;

// ─── Vertex ─────────────────────────────────────────────────────────────────
const earthVertex = /* glsl */ `
  varying vec3 vWorldNormal;   // normal in world space (camera-independent)
  varying vec3 vObjectPos;     // position on the unit sphere, in object space (rotates w/ Earth)
  varying vec3 vWorldPos;      // position in world space
  varying vec3 vViewDir;       // camera -> fragment, world space

  void main(){
    // World-space normal — invariant under camera movement. Only Earth's
    // own rotation (modelMatrix) changes it, which is exactly what we want:
    // the lit hemisphere always faces the fixed Sun.
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vObjectPos   = normalize(position);
    vec4 wp      = modelMatrix * vec4(position, 1.0);
    vWorldPos    = wp.xyz;
    vViewDir     = normalize(cameraPosition - wp.xyz);
    gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// ─── Fragment ────────────────────────────────────────────────────────────────
const earthFragment = /* glsl */ `
  precision highp float;

  varying vec3 vWorldNormal;
  varying vec3 vObjectPos;
  varying vec3 vWorldPos;
  varying vec3 vViewDir;

  uniform vec3  uSunDir;        // normalized world-space sun direction
  uniform float uSunIntensity;
  uniform float uTime;
  uniform float uNightLights;
  uniform int   uViewMode;      // 0 realistic | 1 topo | 2 night | 3 wireframe-tint
  uniform float uCloudShadow;   // 0..1  how dark cloud shadows are

  ${NOISE_GLSL}

  // ── Terrain ──────────────────────────────────────────────────────────────
  float continentField(vec3 p){
    float base = fbm(p*1.6, 5, 2.0, 0.5);
    vec3  q    = p + 0.15*vec3(snoise(p*3.1), snoise(p*3.1+100.), snoise(p*3.1+200.));
    float det  = fbm(q*4.5, 4, 2.0, 0.5);
    return base*0.7 + det*0.3;
  }

  float elevation(vec3 p){
    float c   = continentField(p);
    float mtn = ridged(p*6.0, 4, 2.1, 0.5);
    float land= smoothstep(0.02, 0.12, c);
    return c + mtn*0.35*land;
  }

  // ── GGX specular (physically-based) ──────────────────────────────────────
  float ggxD(float NdotH, float roughness){
    float a  = roughness*roughness;
    float a2 = a*a;
    float d  = NdotH*NdotH*(a2-1.)+1.;
    return a2/(3.14159265*d*d);
  }
  float schlickG(float NdotX, float k){ return NdotX/(NdotX*(1.-k)+k); }
  float smithG(float NdotL, float NdotV, float roughness){
    float k = (roughness+1.)*(roughness+1.)/8.;
    return schlickG(NdotL,k)*schlickG(NdotV,k);
  }
  vec3 fresnelSchlick(float cosTheta, vec3 F0){
    return F0+(1.-F0)*pow(clamp(1.-cosTheta,0.,1.),5.);
  }

  // ── Ocean micro-waves (two scrolling layers) ──────────────────────────────
  float oceanWaves(vec3 p){
    // primary swell direction
    float w1 = snoise(p*12.0 + vec3(uTime*0.04, 0., uTime*0.025));
    // secondary chop perpendicular
    float w2 = snoise(p*28.0 + vec3(-uTime*0.07, uTime*0.03, 0.));
    return (w1*0.6 + w2*0.4)*0.5 + 0.5;
  }

  void main(){
    vec3 N  = normalize(vWorldNormal);   // world-space surface normal
    vec3 P  = vObjectPos;                 // object-space position (terrain locked to planet)
    vec3 L  = normalize(uSunDir);         // fixed world sun direction
    vec3 V  = normalize(vViewDir);        // world view direction
    vec3 H  = normalize(L + V);

    float NdotL = dot(N, L);
    float NdotV = max(dot(N, V), 0.001);
    float NdotH = max(dot(N, H), 0.0);

    // ── Terrain data ────────────────────────────────────────────────────────
    float h        = elevation(P);
    float lat      = abs(P.y);
    float seaLevel = 0.02;
    float landMask = smoothstep(seaLevel, seaLevel+0.04, h);
    float mtn      = ridged(P*6.0, 4, 2.1, 0.5);

    // ── Day / night terminator ───────────────────────────────────────────────
    // Narrow band for sharp but anti-aliased terminator
    float dayAmt   = smoothstep(-0.06, 0.18, NdotL);

    // Sunset/sunrise tint: how close to the terminator on the day side
    float terminator = 1.0 - smoothstep(0.0, 0.35, NdotL);
    vec3  sunsetTint = mix(vec3(1.0,0.45,0.1), vec3(1.0,0.8,0.5), terminator*0.5);

    // ── Ocean ───────────────────────────────────────────────────────────────
    float oceanDepth = smoothstep(seaLevel, -0.25, h);
    // depth-based hue: shallow=tropical cyan, deep=navy
    vec3 deepColor    = vec3(0.012, 0.055, 0.18);
    vec3 shallowColor = vec3(0.04, 0.26, 0.44);
    vec3 sunsetOcean  = vec3(0.22, 0.10, 0.04);  // warm sunset reflection
    vec3 oceanBase    = mix(shallowColor, deepColor, oceanDepth);
    // blend in sunset hue near terminator
    oceanBase = mix(oceanBase, sunsetOcean, terminator*dayAmt*0.45);

    // animated wave normals (cheap height-field normal approximation)
    float waveH   = oceanWaves(P);
    float eps     = 0.008;
    float wE      = oceanWaves(P + vec3(eps,0.,0.));
    float wN_     = oceanWaves(P + vec3(0.,0.,eps));
    vec3  waveN   = normalize(N + vec3((waveH-wE)/eps, 0., (waveH-wN_)/eps)*0.35);

    // PBR ocean: F0 = 0.02 (water), roughness driven by waves
    float roughness = mix(0.04, 0.18, waveH);
    vec3  F0ocean   = vec3(0.02);
    float diff_o    = max(dot(waveN, L), 0.0);

    // GGX specular lobe
    float NdotHw = max(dot(waveN, H), 0.0);
    float D      = ggxD(NdotHw, roughness);
    float G      = smithG(max(dot(waveN,L),0.001), NdotV, roughness);
    vec3  F      = fresnelSchlick(max(dot(H,V),0.0), F0ocean);
    vec3  spec   = (D*G*F) / max(4.*max(dot(waveN,L),0.001)*NdotV, 0.001);
    // specular colour warms toward sunset
    spec *= mix(vec3(0.85,0.92,1.0), sunsetTint, terminator*dayAmt);

    // Fresnel rim on ocean (sky reflection)
    float fresnelRim = pow(1.0 - NdotV, 4.0);
    vec3  skyRefl    = mix(vec3(0.1,0.3,0.7), vec3(0.7,0.4,0.15), terminator);

    vec3 oceanColor  = oceanBase*(diff_o*uSunIntensity + 0.04)
                       + spec*uSunIntensity*2.5
                       + skyRefl*fresnelRim*0.25*dayAmt;

    // ── Land ─────────────────────────────────────────────────────────────────
    float desertBand = smoothstep(0.35,0.5,lat)*(1.0-smoothstep(0.6,0.75,lat));
    float tropical   = 1.0 - smoothstep(0.0, 0.3, lat);

    vec3 beach    = vec3(0.72, 0.66, 0.45);
    vec3 grass    = vec3(0.22, 0.42, 0.20);
    vec3 forest   = vec3(0.12, 0.30, 0.14);
    vec3 desert   = vec3(0.76, 0.62, 0.36);
    vec3 rock     = vec3(0.44, 0.38, 0.33);
    vec3 snow     = vec3(0.92, 0.94, 0.98);

    vec3 lowland  = mix(grass, forest, smoothstep(0.05, 0.15, h));
    lowland       = mix(lowland, desert, desertBand*0.85);
    lowland       = mix(lowland, vec3(0.16,0.34,0.18), tropical*0.4);
    vec3 highland = mix(lowland, rock, smoothstep(0.18, 0.32, mtn));
    vec3 landColor= mix(beach, lowland, smoothstep(0.03, 0.07, h));
    landColor     = mix(landColor, highland, smoothstep(0.12, 0.22, h));
    landColor     = mix(landColor, snow, smoothstep(0.30, 0.42, h));

    float iceCap  = smoothstep(0.78, 0.92, lat);
    landColor     = mix(landColor, snow, iceCap);

    // land diffuse with sunset warm tint at terminator
    float diffLand = max(NdotL, 0.0);
    vec3 litLand   = landColor*(diffLand*uSunIntensity + 0.06);
    litLand        = mix(litLand, litLand*sunsetTint*1.15, terminator*dayAmt*0.6);

    // ── Merge surfaces ────────────────────────────────────────────────────
    vec3 oceanFull = mix(oceanColor, vec3(0.80,0.88,0.95), iceCap*0.7);
    vec3 surface   = mix(oceanFull, litLand, landMask);

    // ── Cloud shadow ──────────────────────────────────────────────────────
    float cloudShadowNoise = fbm(P*3.0 + vec3(uTime*0.015, 0., uTime*0.008), 4, 2.2, 0.55);
    float cShadow = smoothstep(0.05, 0.55, cloudShadowNoise) * (1.0-landMask*0.3);
    surface *= 1.0 - cShadow * uCloudShadow * dayAmt * 0.38;

    // ── Night side ────────────────────────────────────────────────────────
    float nightSide = 1.0 - dayAmt;
    vec3  nightDark = surface * 0.012;
    float cityNoise = fbm(P*48.0, 3, 2.0, 0.5);
    float cityField = smoothstep(0.15, 0.45, cityNoise) * landMask;
    cityField      *= smoothstep(0.0, 0.25, 1.0-h)*0.5 + 0.5;
    vec3  cityGlow  = vec3(1.0,0.82,0.45)*cityField*nightSide*uNightLights*1.8;
    vec3  nightColor= nightDark + cityGlow;

    vec3 color = mix(nightColor, surface, dayAmt);

    // ── View modes ────────────────────────────────────────────────────────
    if(uViewMode == 1){
      float bands   = fract(h*24.0);
      float contour = smoothstep(0.92,1.0,bands)+smoothstep(0.0,0.04,bands);
      vec3  topo    = mix(vec3(0.05,0.1,0.3),vec3(0.9,0.5,0.15),smoothstep(-0.1,0.4,h));
      topo = mix(topo, vec3(1.0), contour*0.6);
      color = topo*(diffLand*0.8+0.2);
    } else if(uViewMode == 2){
      color = nightDark*0.5 + cityGlow*2.2 + vec3(0.02,0.04,0.08);
    } else if(uViewMode == 3){
      float fres2 = pow(1.0-NdotV,3.0);
      color = mix(vec3(0.02,0.05,0.12),vec3(0.1,0.6,0.3),landMask)*0.8
              + vec3(0.0,0.3,0.6)*fres2*0.4;
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;

// ─── Exports ─────────────────────────────────────────────────────────────────

export { SUN_DIRECTION } from '@/three/orbital';

export function createEarthMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: earthVertex,
    fragmentShader: earthFragment,
    uniforms: {
      uSunDir:       { value: SUN_DIRECTION.clone() },
      uSunIntensity: { value: 1.4 },
      uTime:         { value: 0 },
      uNightLights:  { value: 1.0 },
      uViewMode:     { value: 0 },
      uCloudShadow:  { value: 0.6 },
    },
  });
}

export const VIEW_MODE_INDEX = {
  realistic:   0,
  wireframe:   3,
  topographic: 1,
  night:       2,
} as const;
