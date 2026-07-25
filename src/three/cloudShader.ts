import * as THREE from 'three';

/**
 * Clouds — Sprint 2
 * Sharper cloud shapes, smoother self-shadow, faster independent rotation.
 * The cloud-shadow value is read back by the Earth shader via uCloudShadow uniform.
 */

const NOISE_GLSL = /* glsl */ `
  vec3 _cm289v3(vec3 x){return x-floor(x*(1./289.))*289.;}
  vec4 _cm289v4(vec4 x){return x-floor(x*(1./289.))*289.;}
  vec4 _cperm(vec4 x){return _cm289v4(((x*34.)+1.)*x);}
  vec4 _ctiSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
    vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;
    vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
    i=_cm289v3(i);
    vec4 p=_cperm(_cperm(_cperm(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
    float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
    vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;
    vec4 sh=-step(h,vec4(0.));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=_ctiSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
    m=m*m;return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }
  float fbm(vec3 p,int oct,float lac,float gain){
    float s=0.;float a=.5;float f=1.;
    for(int i=0;i<8;i++){if(i>=oct)break;s+=a*snoise(p*f);f*=lac;a*=gain;}return s;
  }
`;

const cloudVert = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vObjectPos;
  varying vec3 vWorldPos;
  void main(){
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vObjectPos   = normalize(position);
    vec4 wp      = modelMatrix * vec4(position, 1.0);
    vWorldPos    = wp.xyz;
    gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const cloudFrag = /* glsl */ `
  precision highp float;
  varying vec3 vWorldNormal;
  varying vec3 vObjectPos;
  varying vec3 vWorldPos;
  uniform float uOpacity;
  uniform float uTime;
  uniform vec3  uSunDir;

  ${NOISE_GLSL}

  float cloudDensity(vec3 p, float t){
    // primary weather pattern — slow large-scale warp
    vec3 q  = p * 2.8 + vec3(t * 0.025,  0.0,  t * 0.010);
    float c = fbm(q, 5, 2.15, 0.52);
    // domain-warp a second pass for wispy tendrils
    vec3 r  = p * 5.5 + vec3(snoise(q)*0.22, 0., snoise(q+47.)*0.22) + vec3(t*0.04, 0., 0.);
    c += fbm(r, 3, 2.0, 0.5) * 0.35;
    return c;
  }

  void main(){
    vec3 P  = vObjectPos;               // object-space — clouds rotate w/ Earth
    vec3 N  = normalize(vWorldNormal);   // world-space normal for lighting
    vec3 L  = normalize(uSunDir);

    float c = cloudDensity(P, uTime);

    // Sharper, more realistic cloud edges
    float coverage = smoothstep(0.18, 0.52, c);

    // Suppress clouds near poles (Hadley cell approximation)
    float lat    = abs(P.y);
    float hadley = 1.0 - smoothstep(0.60, 0.85, lat) * 0.6;
    coverage    *= hadley;

    // Self-shadow: sample slightly toward sun for a thin shadow
    vec3  shadowP  = normalize(P - L * 0.045);
    float shadowC  = cloudDensity(shadowP, uTime);
    float selfShad = smoothstep(0.18, 0.52, shadowC);
    float shadow   = 1.0 - selfShad * 0.45;

    // Diffuse + ambient
    float NdotL = max(dot(N, L), 0.0);
    float light = NdotL * 0.80 + 0.20;

    // Silver-lining: rim lit on day edge
    float silverLining = pow(1.0 - max(dot(N, L), 0.0), 4.0) * NdotL * 1.6;

    vec3 col = vec3(1.0) * light * shadow + vec3(0.95,0.96,1.0) * silverLining;

    gl_FragColor = vec4(col, coverage * uOpacity);
  }
`;

import { SUN_DIRECTION } from '@/three/orbital';

export function createCloudMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader:   cloudVert,
    fragmentShader: cloudFrag,
    uniforms: {
      uOpacity: { value: 0.72 },
      uTime:    { value: 0 },
      uSunDir:  { value: SUN_DIRECTION.clone() },
    },
    transparent: true,
    depthWrite:  false,
  });
}
