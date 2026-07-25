import type { Translation } from '@/i18n/types';

const zhCN: Translation = {
  // ── App / boot ────────────────────────────────────────────────────────────
  appName:      'Gaia Studio',
  appVersion:   'v1.0',
  bootSubtitle: '正在初始化星球渲染器…',

  // ── Status bar ────────────────────────────────────────────────────────────
  webgl: 'WebGL 2.0',

  // ── Toolbar ───────────────────────────────────────────────────────────────
  collapseToolbar: '收起工具栏',
  expandToolbar:   '展开工具栏',
  toolOrbit:       '环绕',
  toolPan:         '平移',
  toolMeasure:     '测量',
  autoRotate:      '自动旋转',
  resetView:       '重置视角',
  toggleInspector: '切换信息面板',

  // ── Control center ────────────────────────────────────────────────────────
  controlCenter: '控制中心',
  pause:         '暂停',
  play:          '播放',
  collapse:      '收起',
  expand:        '展开',
  hide:          '隐藏',
  showControls:  '显示控制中心',

  // Render mode
  renderMode:       '渲染模式',
  viewRealistic:    '真实模式',
  viewTopographic:  '地形模式',
  viewNight:        '夜景模式',
  viewWireframe:    '线框模式',

  // Rotation
  rotationSpeed: '自转速度',

  // Layers
  layers:          '图层',
  layerAtmosphere: '大气层',
  layerClouds:     '云层',
  layerStars:      '星空',
  layerGrid:       '经纬网',
  layerNightLights:'城市灯光',

  // Environment
  sunIntensity:   '光照强度',
  cloudOpacity:   '云层透明度',
  atmosphereGlow: '大气辉光',
  starDensity:    '星空密度',

  // Time of day
  timeOfDay: '时间',
  localTime: '本地时间',

  // Simulation clock presets
  simClock: '模拟时钟',
  clock1x: '1x',
  clock24x: '24x',
  clock365x: '365x',
  clock1000x: '1000x',
  simYearLabel: '纪元',
  simDayLabel: '日序',

  // ── Inspector ─────────────────────────────────────────────────────────────
  inspector:      '信息面板',
  closeInspector: '关闭信息面板',

  // Object section
  sectionObject:    '对象',
  objectName:       '地球',
  objectSubtitle:   '程序化球体 · 半径 6371 km',
  statRenderMode:   '渲染模式',
  statActiveLayers: '激活图层',

  // Camera section
  sectionCamera:  '相机',
  statDistance:   '距离',
  statAutoRotate: '自动旋转',
  statRotation:   '转速',
  on:             '开启',
  off:            '关闭',

  // Time of day (inspector stat)
  statTimeOfDay: '时间',

  // Environment section
  sectionEnvironment: '环境',
  statSunIntensity:   '光照强度',
  statAtmosphere:     '大气层',
  statClouds:         '云层',
  statStarField:      '星空',
  enabled:            '已启用',
  disabled:           '已禁用',

  // Performance section
  sectionPerformance: '性能',
  statFrameRate:      '帧率',

  // Simulation report section
  sectionSimReport:  '模拟报告',
  reportRotation:    '自转参数',
  reportDayLength:   '白昼时长',
  reportAngularVel:  '角速度',
  reportCoriolis:    '科里奥利参数',
  reportGravityEq:   '赤道重力',
  reportGravityPole: '极点重力',
  reportFlattening:  '扁率',
  reportSolarConst:  '有效辐照度',
  reportAbsorbed:    '吸收能量',
  reportEquilTemp:   '平衡温度',
  reportSurfaceTemp: '表面温度',
  reportIceMelt:     '融冰趋势',
  reportOceanTend:   '海洋温度趋势',
  reportHadley:      '哈德利环流数',

  // ── 3-D scene ─────────────────────────────────────────────────────────────
  sunLabel: '太阳',

  // ── View mode display names ───────────────────────────────────────────────
  viewModeLabel: {
    realistic:   '真实模式',
    topographic: '地形模式',
    night:       '夜景模式',
    wireframe:   '线框模式',
  },
};

export default zhCN;
