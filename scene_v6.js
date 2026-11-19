// ================== Three.js 씬 구성 ==================
var canvas = document.getElementById('gl');
var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;

var scene = new THREE.Scene();
scene.background = new THREE.Color(0xf1e7de);

var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 160);
var camYaw = -0.62, camPitch = 0.60, camDist = 6.4;
var camTarget = new THREE.Vector3(0, 0.60, -0.30);

// ================== 조명 (따뜻한 크림빛 실내 + 노을 창빛) ==================
var hemi = new THREE.HemisphereLight(0xfff7ee, 0xd9c8bb, 0.95);
scene.add(hemi);

var sun = new THREE.DirectionalLight(0xffe6c6, 1.45);
sun.position.set(-1.0, 5.6, -7.6);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 26;
sun.shadow.camera.left = -6; sun.shadow.camera.right = 6;
sun.shadow.camera.top = 6; sun.shadow.camera.bottom = -6;
sun.shadow.bias = -0.0007;
scene.add(sun);

var roomLight = new THREE.PointLight(0xffe8ca, 0.55, 12, 2);
roomLight.position.set(-0.2, 2.2, -1.0);
scene.add(roomLight);

var lampLight = new THREE.PointLight(0xffc98c, 1.2, 4.8, 2);
lampLight.position.set(0.16, 1.60, 0.90);
scene.add(lampLight);

// ================== 재질 / 지오메트리 헬퍼 ==================
function mat(col, rough, metal) {
  return new THREE.MeshStandardMaterial({
    color: col, roughness: rough !== undefined ? rough : 0.82, metalness: metal || 0
  });
}
function texMat(tex, rough, metal) {
  return new THREE.MeshStandardMaterial({
    map: tex, roughness: rough !== undefined ? rough : 0.9, metalness: metal || 0
  });
}
function makeTex(w, h, draw, rx, ry) {
  var c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  var t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (rx || ry) t.repeat.set(rx || 1, ry || 1);
  t.anisotropy = 4;
  return t;
}

var stickyTargets = [];
function addMesh(geo, material, x, y, z, parent, stick) {
  var m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  (parent || scene).add(m);
  if (stick !== false) stickyTargets.push(m);
  return m;
}
function addBox(w, h, d, color, x, y, z, parent, stickable) {
  return addMesh(new THREE.BoxGeometry(w, h, d), mat(color), x, y, z, parent, stickable);
}
function addBoxT(w, h, d, tex, x, y, z, parent, stickable, rough) {
  return addMesh(new THREE.BoxGeometry(w, h, d), texMat(tex, rough), x, y, z, parent, stickable);
}
function addSphere(rx, ry, rz, color, x, y, z, parent, rough) {
  var m = addMesh(new THREE.SphereGeometry(1, 20, 14), mat(color, rough), x, y, z, parent);
  m.scale.set(rx, ry, rz);
  return m;
}
function addCyl(rTop, rBot, h, color, x, y, z, parent, seg, rough) {
  return addMesh(new THREE.CylinderGeometry(rTop, rBot, h, seg || 20), mat(color, rough), x, y, z, parent);
}

// ================== 텍스처 ==================
// 원목 마루 (길이 방향 플랑크)
var floorTex = makeTex(512, 512, function(ctx, w, h) {
  var tones = ['#e8cba3', '#e2c296', '#eed5b0', '#e6c79c', '#ead0a8'];
  for (var i = 0; i < 5; i++) {
    var x0 = i * (w / 5);
    ctx.fillStyle = tones[i];
    ctx.fillRect(x0, 0, w / 5 + 1, h);
    // 나뭇결
    for (var g = 0; g < 14; g++) {
      var gx = x0 + 4 + Math.random() * (w / 5 - 8);
      ctx.strokeStyle = 'rgba(158,116,72,' + (0.05 + Math.random() * 0.09) + ')';
      ctx.lineWidth = 1 + Math.random();
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.bezierCurveTo(gx + 6, h * 0.3, gx - 6, h * 0.66, gx + 2, h);
      ctx.stroke();
    }
    // 플랑크 이음선
    ctx.fillStyle = 'rgba(126,92,58,0.34)';
    ctx.fillRect(x0, 0, 2, h);
    var seam = (i * 197) % h;
    ctx.fillStyle = 'rgba(126,92,58,0.26)';
    ctx.fillRect(x0, seam, w / 5, 2);
  }
}, 2, 2.6);

// 크림 러그 (보클레 느낌)
var rugTex = makeTex(256, 256, function(ctx, w, h) {
  ctx.fillStyle = '#f2e9dc';
  ctx.fillRect(0, 0, w, h);
  for (var i = 0; i < 2600; i++) {
    var x = Math.random() * w, y = Math.random() * h;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.5)' : 'rgba(206,190,170,0.35)';
    ctx.beginPath(); ctx.arc(x, y, 1 + Math.random() * 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(212,196,176,0.8)';
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, w - 20, h - 20);
}, 1.6, 1.4);

// 스트라이프 니트 (트롤리 커버 / 슬리퍼)
var stripeTex = makeTex(128, 128, function(ctx, w, h) {
  ctx.fillStyle = '#fbf7f0';
  ctx.fillRect(0, 0, w, h);
  for (var y = 6; y < h; y += 22) {
    ctx.fillStyle = '#3d4152';
    ctx.fillRect(0, y, w, 4);
    ctx.fillStyle = 'rgba(61,65,82,0.25)';
    ctx.fillRect(0, y + 4, w, 2);
  }
  for (var i = 0; i < 400; i++) {
    ctx.fillStyle = 'rgba(190,175,160,0.16)';
    ctx.fillRect(Math.random() * w, Math.random() * h, 3, 2);
  }
}, 2, 2);

// 창밖 노을 하늘
var skyTex = makeTex(512, 300, function(ctx, w, h) {
  var g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#bcd4ea');
  g.addColorStop(0.38, '#dfe6ee');
  g.addColorStop(0.62, '#fbe3c8');
  g.addColorStop(0.82, '#fbd0ac');
  g.addColorStop(1, '#f7dcc2');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // 해 근처 번짐
  var rg = ctx.createRadialGradient(w * 0.72, h * 0.62, 8, w * 0.72, h * 0.62, 150);
  rg.addColorStop(0, 'rgba(255,240,205,0.95)');
  rg.addColorStop(0.45, 'rgba(255,214,160,0.35)');
  rg.addColorStop(1, 'rgba(255,214,160,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, w, h);
  // 옅은 구름
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  for (var i = 0; i < 7; i++) {
    var cx = Math.random() * w, cy = 40 + Math.random() * 110;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 50 + Math.random() * 60, 5 + Math.random() * 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
});

// 원경 빌딩 외벽
function facadeTex(base, lit) {
  return makeTex(64, 128, function(ctx, w, h) {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    for (var y = 6; y < h - 4; y += 9) {
      for (var x = 5; x < w - 4; x += 9) {
        var on = Math.random() < 0.18;
        ctx.fillStyle = on ? lit : 'rgba(120,132,148,0.55)';
        ctx.fillRect(x, y, 5, 5);
      }
    }
  }, 1, 1);
}
var facadeA = facadeTex('#ddd9d4', '#ffe1a8');
var facadeB = facadeTex('#cfd6dc', '#ffecc4');
var facadeC = facadeTex('#e6dfd6', '#ffd79b');

// TV 축구 중계 화면
var pitchTex = makeTex(512, 288, function(ctx, w, h) {
  ctx.fillStyle = '#3f9b46';
  ctx.fillRect(0, 0, w, h);
  for (var i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,60,0,0.05)';
    ctx.fillRect(0, i * h / 6, w, h / 6);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 3;
  ctx.strokeRect(14, 14, w - 28, h - 28);
  ctx.beginPath(); ctx.moveTo(w / 2, 14); ctx.lineTo(w / 2, h - 14); ctx.stroke();
  ctx.beginPath(); ctx.arc(w / 2, h / 2, 44, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(w / 2, h / 2, 4, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.strokeRect(14, h / 2 - 62, 56, 124);
  ctx.strokeRect(w - 70, h / 2 - 62, 56, 124);
  // 관중석
  ctx.fillStyle = '#26456b';
  ctx.fillRect(0, 0, w, 14);
  ctx.fillRect(0, h - 14, w, 14);
  // 선수들
  for (var p = 0; p < 20; p++) {
    ctx.fillStyle = p % 2 ? '#f3f6ff' : '#e8494f';
    ctx.beginPath();
    ctx.arc(40 + Math.random() * (w - 80), 40 + Math.random() * (h - 80), 3.4, 0, Math.PI * 2);
    ctx.fill();
  }
  // 하단 스코어바
  ctx.fillStyle = 'rgba(10,18,30,0.85)';
  ctx.fillRect(6, 6, 78, 18);
  ctx.fillStyle = '#9ef0a0';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('LIVE', 14, 19);
});

// 캐릭터 얼굴 (투명 데칼)
function faceTex(kind) {
  return makeTex(128, 128, function(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#3a302b';
    // 눈
    ctx.beginPath(); ctx.arc(44, 58, 6.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(84, 58, 6.5, 0, Math.PI * 2); ctx.fill();
    // 볼
    ctx.fillStyle = 'rgba(255,150,170,0.55)';
    ctx.beginPath(); ctx.ellipse(32, 74, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(96, 74, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
    // 입
    ctx.strokeStyle = '#3a302b';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    if (kind === 'usagi') {
      ctx.fillStyle = '#c4695f';
      ctx.beginPath(); ctx.ellipse(64, 78, 15, 12, 0, 0, Math.PI * 2); ctx.fill();
    } else if (kind === 'hachiware') {
      ctx.beginPath(); ctx.arc(56, 74, 5, 0.1, Math.PI - 0.1); ctx.stroke();
      ctx.beginPath(); ctx.arc(72, 74, 5, 0.1, Math.PI - 0.1); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(56, 76); ctx.quadraticCurveTo(64, 84, 72, 76); ctx.stroke();
    }
  });
}
var faceTexes = {
  chiikawa: faceTex('chiikawa'),
  hachiware: faceTex('hachiware'),
  usagi: faceTex('usagi')
};

// 액자 속 사진
var photoTexes = [];
(function() {
  var arts = [
    function(ctx, w, h) { // 바다
      var g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#8fc4e6'); g.addColorStop(0.55, '#5b93b8'); g.addColorStop(1, '#2f5b78');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (var i = 0; i < 12; i++) ctx.fillRect(Math.random() * w, h * 0.55 + Math.random() * h * 0.4, 18, 2);
    },
    function(ctx, w, h) { // 도시
      var g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#cfe3f2'); g.addColorStop(1, '#e9dcc8');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#7d8794';
      for (var i = 0; i < 9; i++) {
        var bw = 10 + Math.random() * 16, bh = 20 + Math.random() * 45;
        ctx.fillRect(i * (w / 9) + 2, h - bh, bw, bh);
      }
    },
    function(ctx, w, h) { // 흑백 인물
      var g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#efece8'); g.addColorStop(1, '#b9b4ad');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#5b5550';
      ctx.beginPath(); ctx.arc(w * 0.5, h * 0.42, w * 0.19, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.82, w * 0.28, h * 0.2, 0, Math.PI, 0); ctx.fill();
    },
    function(ctx, w, h) { // 노을 풍경
      var g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#f6d3b0'); g.addColorStop(0.6, '#f2b591'); g.addColorStop(1, '#a9705f');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(90,60,50,0.55)';
      ctx.beginPath(); ctx.moveTo(0, h * 0.78); ctx.lineTo(w * 0.4, h * 0.55); ctx.lineTo(w * 0.72, h * 0.8); ctx.lineTo(w, h * 0.62); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
    }
  ];
  for (var i = 0; i < arts.length; i++) {
    photoTexes.push(makeTex(160, 200, arts[i]));
  }
})();

// ================== 방 크기 ==================
// X: -2.0 ~ +2.0 (4.0m) / Z: -3.0 ~ +3.0 (6.0m) / 벽높이 2.42m
var RW = 4.0, RD = 6.0, RH = 2.42;
var WALL = 0xf8f1e9, WALL2 = 0xf6eee5;
var WOOD = 0xd3a97c, WOOD_D = 0xb98a5d, CREAM = 0xf3e7d8, WHITE = 0xfdfbf7;

// 바닥
addBox(RW, 0.10, RD, 0xf0e0cd, 0, -0.05, 0, scene, false);
var floorTop = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD), texMat(floorTex, 0.72));
floorTop.rotation.x = -Math.PI / 2;
floorTop.position.set(0, 0.002, 0);
floorTop.receiveShadow = true;
scene.add(floorTop);

// 벽 (왼쪽 = 붙박이장 벽, 오른쪽 = 소파 벽)
addBox(0.10, RH, RD, WALL, -2.02, RH / 2, 0, scene, true);
addBox(0.10, RH, RD, WALL, 2.02, RH / 2, 0, scene, true);
// 걸레받이
addBox(0.04, 0.09, RD, 0xf0e6da, -1.96, 0.045, 0, scene, false);
addBox(0.04, 0.09, RD, 0xf0e6da, 1.96, 0.045, 0, scene, false);

// ================== 창가 (북쪽 벽 Z = -3.0) ==================
// 창 개구부: X -1.75 ~ +1.55, Y 0.80 ~ 2.16
addBox(RW, 0.80, 0.10, WALL, 0, 0.40, -3.0, scene, true);
addBox(RW, RH - 2.16, 0.10, WALL, 0, (RH + 2.16) / 2, -3.0, scene, true);
addBox(0.25, 1.36, 0.10, WALL, -1.875, 1.48, -3.0, scene, true);
addBox(0.45, 1.36, 0.10, WALL, 1.775, 1.48, -3.0, scene, true);

// 창틀 (원목)
var wt = 0.055;
addBox(3.36, wt, 0.13, WOOD, -0.10, 2.16, -2.97, scene, false);
addBox(3.36, wt, 0.13, WOOD, -0.10, 0.80, -2.97, scene, false);
addBox(wt, 1.36, 0.13, WOOD, -1.78, 1.48, -2.97, scene, false);
addBox(wt, 1.36, 0.13, WOOD, 1.58, 1.48, -2.97, scene, false);
// 창틀 기둥 + 가로대 (상단 큰 창 / 하단 작은 창)
addBox(0.075, 1.36, 0.11, WOOD, 0.02, 1.48, -2.97, scene, false);
addBox(3.30, 0.05, 0.11, WOOD, -0.10, 1.03, -2.97, scene, false);
addBox(0.035, 0.23, 0.09, WOOD, -0.86, 0.915, -2.97, scene, false);
addBox(0.035, 0.23, 0.09, WOOD, 0.86, 0.915, -2.97, scene, false);
// 창 유리
var glassMat = new THREE.MeshStandardMaterial({
  color: 0xe6f3ff, transparent: true, opacity: 0.16, roughness: 0.06, metalness: 0.2
});
addMesh(new THREE.PlaneGeometry(3.26, 1.32), glassMat, -0.10, 1.48, -2.98, scene, false);
// 창틀 선반 (인형 놓는 넓은 우드 턱)
addBox(3.44, 0.06, 0.24, WOOD, -0.10, 0.795, -2.84, scene, true);

// 롤스크린 (그레이 2개 + 상단 하우징)
addBox(1.46, 0.30, 0.10, 0xbfc1c0, -0.86, 1.98, -2.87, scene, false);
addBox(1.46, 0.30, 0.10, 0xbfc1c0, 0.86, 1.98, -2.87, scene, false);
addCyl(0.055, 0.055, 3.30, 0xaeadab, -0.10, 2.15, -2.87, scene, 16);
var blindEdge = addCyl(0.012, 0.012, 1.46, 0x9fa1a0, -0.86, 1.83, -2.83, scene, 8);
blindEdge.rotation.z = Math.PI / 2;

// ================== 창밖 시티뷰 (동천역 대로변 · 노을) ==================
var city = new THREE.Group();
scene.add(city);
// 하늘
var sky = new THREE.Mesh(new THREE.PlaneGeometry(46, 20), new THREE.MeshBasicMaterial({ map: skyTex }));
sky.position.set(-1, 6.5, -13);
city.add(sky);
// 지면
var ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), mat(0xcdd0c8, 1));
ground.rotation.x = -Math.PI / 2;
ground.position.set(0, -7.5, -12);
city.add(ground);
// 대로 (아래로 길게 뻗은 도로)
var road = new THREE.Mesh(new THREE.PlaneGeometry(9, 60), mat(0x6f747a, 1));
road.rotation.x = -Math.PI / 2;
road.position.set(0.5, -7.44, -12);
city.add(road);
var road2 = new THREE.Mesh(new THREE.PlaneGeometry(40, 5), mat(0x777c82, 1));
road2.rotation.x = -Math.PI / 2;
road2.position.set(0, -7.43, -6.2);
city.add(road2);
// 차선
for (var li = 0; li < 12; li++) {
  addBox(0.12, 0.02, 1.4, 0xe9e6dd, 0.5, -7.42, -16 + li * 2.4, city, false).receiveShadow = false;
}
// 가로수
for (var ti = 0; ti < 14; ti++) {
  var tz = -18 + ti * 2.6;
  addCyl(0.08, 0.10, 1.0, 0x6c5a48, 4.2, -7.0, tz, city, 6);
  addSphere(0.75, 0.95, 0.75, ti % 3 === 0 ? 0x8a9a63 : 0xa08a4f, 4.2, -6.2, tz, city);
  addSphere(0.6, 0.7, 0.6, 0x93a06a, -3.3, -6.4, tz + 1.3, city);
}
// 자동차
for (var ci = 0; ci < 9; ci++) {
  var cz = -17 + ci * 2.7;
  var cc = [0xf2f1ec, 0x3d4148, 0xb9c0c8, 0xe4dfd4][ci % 4];
  addBox(0.42, 0.34, 0.9, cc, 0.5 + (ci % 2 ? 1.6 : -1.6), -7.16, cz, city, false);
}
// 중경 건물 (대로변 상가)
for (var bi = 0; bi < 9; bi++) {
  var bz = -4.6 - bi * 1.4;
  addBox(1.5 + Math.random() * 1.2, 1.6 + Math.random() * 1.4, 1.1, 0xe4e0d9, -4.4 - Math.random() * 1.2, -5.6, bz, city, false);
  addBox(1.2 + Math.random() * 1.4, 1.2 + Math.random() * 1.8, 1.1, 0xe8e3db, 4.6 + Math.random() * 1.4, -5.9, bz, city, false);
}
// 원경 아파트 단지
var ftexs = [facadeA, facadeB, facadeC];
for (var di = 0; di < 26; di++) {
  var dx = -17 + Math.random() * 34;
  var dz = -14 - Math.random() * 6;
  var dh = 3.2 + Math.random() * 3.6;
  var dw = 0.9 + Math.random() * 1.1;
  addMesh(new THREE.BoxGeometry(dw, dh, dw * 0.8), texMat(ftexs[di % 3], 0.95), dx, -7.4 + dh / 2, dz, city, false);
}
// 먼 산 (노을에 물든)
addSphere(9, 2.2, 4, 0xb9b7ae, -12, -5.4, -20, city);
addSphere(11, 2.6, 4, 0xc2bdb2, 6, -5.2, -21, city);
addSphere(7, 1.8, 3, 0xb5b3aa, 18, -5.6, -19, city);

// ================== 침대 (창가 · 우드 서랍형) ==================
var bedG = new THREE.Group();
scene.add(bedG);
// 서랍형 프레임
addBox(2.06, 0.32, 1.38, 0xc9a074, -0.28, 0.16, -2.28, bedG, true);
// 서랍 2칸 (앞면)
addBox(0.94, 0.22, 0.03, 0xd9b58d, -0.80, 0.17, -1.585, bedG, false);
addBox(0.94, 0.22, 0.03, 0xd9b58d, 0.30, 0.17, -1.585, bedG, false);
addBox(0.10, 0.03, 0.03, 0xb98a5d, -0.80, 0.17, -1.565, bedG, false);
addBox(0.10, 0.03, 0.03, 0xb98a5d, 0.30, 0.17, -1.565, bedG, false);
// 매트리스 + 화이트 이불
addBox(2.02, 0.20, 1.34, 0xfdfcf9, -0.28, 0.42, -2.28, bedG, true);
// 이불 (몽글몽글)
addBox(1.60, 0.12, 1.36, 0xfffdfa, -0.62, 0.55, -2.28, bedG, true);
for (var bi2 = 0; bi2 < 7; bi2++) {
  addSphere(0.22 + Math.random() * 0.12, 0.075, 0.16, 0xfffdfa,
    -1.35 + bi2 * 0.22, 0.60 + Math.random() * 0.02, -2.28 + (Math.random() - 0.5) * 0.55, bedG, 0.9);
}
// 베개 2개 (오른쪽 머리맡)
addSphere(0.17, 0.11, 0.23, 0xfffdf8, 0.55, 0.56, -2.58, bedG, 0.95);
addSphere(0.17, 0.11, 0.23, 0xfffdf8, 0.55, 0.56, -2.00, bedG, 0.95);
// 발치 니트 담요
addBox(0.62, 0.09, 1.34, 0xe3d2ba, -1.12, 0.56, -2.28, bedG, true);
addBox(0.06, 0.13, 1.30, 0xd9c4a8, -0.82, 0.50, -2.28, bedG, false);

// 창틀 인형 4총사
function makePlush(kind) {
  var g = new THREE.Group();
  var bodyCol = kind === 'usagi' ? 0xf7eba6 : 0xfffdf8;
  var headCol = bodyCol;
  // 몸통
  addSphere(0.062, 0.062, 0.055, bodyCol, 0, 0.062, 0, g, 0.95);
  // 머리
  addSphere(0.072, 0.070, 0.066, headCol, 0, 0.128, 0.004, g, 0.95);
  // 발
  addSphere(0.028, 0.020, 0.030, bodyCol, -0.036, 0.022, 0.045, g, 0.95);
  addSphere(0.028, 0.020, 0.030, bodyCol, 0.036, 0.022, 0.045, g, 0.95);
  // 귀
  if (kind === 'usagi') {
    addSphere(0.019, 0.055, 0.016, bodyCol, -0.032, 0.196, 0, g, 0.95);
    addSphere(0.019, 0.055, 0.016, bodyCol, 0.032, 0.196, 0, g, 0.95);
  } else {
    addSphere(0.026, 0.030, 0.017, bodyCol, -0.058, 0.182, 0, g, 0.95);
    addSphere(0.026, 0.030, 0.017, bodyCol, 0.058, 0.182, 0, g, 0.95);
  }
  // 후드 (빨간)
  if (kind === 'redhood') {
    addSphere(0.078, 0.070, 0.072, 0xd93c46, 0, 0.140, -0.004, g, 0.92);
    addSphere(0.075, 0.050, 0.060, 0xfffdf8, 0, 0.115, 0.030, g, 0.95);
    addSphere(0.020, 0.020, 0.020, 0xd93c46, -0.062, 0.196, 0, g, 0.9);
    addSphere(0.020, 0.020, 0.020, 0xd93c46, 0.062, 0.196, 0, g, 0.9);
  }
  // 하치와레 파란 머리 마킹
  if (kind === 'hachiware') {
    var cap = addMesh(new THREE.SphereGeometry(0.0735, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), mat(0xa9c6e8, 0.9), 0, 0.128, 0.004, g, false);
    cap.scale.set(1, 1, 0.94);
  }
  // 얼굴 데칼
  var fk = kind === 'redhood' ? 'chiikawa' : kind;
  var face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.13, 0.13),
    new THREE.MeshBasicMaterial({ map: faceTexes[fk], transparent: true, depthWrite: false })
  );
  face.position.set(0, 0.126, 0.062);
  g.add(face);
  return g;
}
var sillY = 0.825;
var plushX = [-1.32, -1.13, -0.95, -0.76];
var plushKinds = ['chiikawa', 'hachiware', 'usagi', 'redhood'];
for (var pi = 0; pi < 4; pi++) {
  var pl = makePlush(plushKinds[pi]);
  pl.position.set(plushX[pi], sillY, -2.83);
  pl.rotation.y = 0.06 * (pi - 1.5);
  scene.add(pl);
}

// ================== 책상 + 뽀글이 회전의자 (오른쪽 벽 창가쪽) ==================
addBox(0.60, 0.05, 1.12, 0xfaf7f2, 1.70, 0.74, -2.06, scene, true); // 상판
addBox(0.05, 0.72, 0.05, 0xf0ebe4, 1.44, 0.37, -2.58, scene, false);
addBox(0.05, 0.72, 0.05, 0xf0ebe4, 1.44, 0.37, -1.54, scene, false);
addBox(0.50, 0.70, 0.03, 0xfaf7f2, 1.96, 0.36, -2.06, scene, false);
// 노트북
addBox(0.36, 0.02, 0.24, 0x4a4d55, 1.68, 0.78, -2.22, scene, true);
var lapTop = addBox(0.34, 0.22, 0.015, 0x3e4148, 1.52, 0.90, -2.22, scene, false);
lapTop.rotation.z = 0.32;
// 곽티슈
addBox(0.13, 0.075, 0.10, 0xf7f1e8, 1.72, 0.80, -1.72, scene, true);
addBox(0.07, 0.02, 0.06, 0xffffff, 1.72, 0.845, -1.72, scene, false);
// 디퓨저
addCyl(0.028, 0.030, 0.10, 0xd9c3b0, 1.80, 0.82, -1.60, scene, 12);
addCyl(0.004, 0.004, 0.10, 0x2f2b28, 1.80, 0.92, -1.60, scene, 6);
addCyl(0.004, 0.004, 0.10, 0x2f2b28, 1.79, 0.92, -1.605, scene, 6);
// 작은 캔들 (은은한 불빛)
addCyl(0.035, 0.035, 0.06, 0xf2e6d2, 1.84, 0.80, -2.45, scene, 14);
addSphere(0.012, 0.018, 0.012, 0xffc98a, 1.84, 0.845, -2.45, scene, 0.5);

// 뽀글이(부클레) 회전의자
var chairG = new THREE.Group();
chairG.position.set(1.06, 0, -2.04);
chairG.rotation.y = -0.9;
scene.add(chairG);
addCyl(0.26, 0.26, 0.03, 0xcfd1d3, 0, 0.045, 0, chairG, 20);
for (var ci2 = 0; ci2 < 5; ci2++) {
  var ang = ci2 * Math.PI * 2 / 5;
  var leg = addBox(0.30, 0.03, 0.05, 0xd7d8da, Math.cos(ang) * 0.16, 0.04, Math.sin(ang) * 0.16, chairG, false);
  leg.rotation.y = -ang;
  addSphere(0.028, 0.028, 0.025, 0x3d3f45, Math.cos(ang) * 0.30, 0.028, Math.sin(ang) * 0.30, chairG, 0.5);
}
addCyl(0.045, 0.045, 0.30, 0xdadcde, 0, 0.20, 0, chairG, 10);
addSphere(0.24, 0.09, 0.23, 0xf7f2ea, 0, 0.40, 0.01, chairG, 0.98); // 좌방석
addSphere(0.21, 0.20, 0.10, 0xf9f5ee, 0, 0.60, -0.20, chairG, 0.98); // 등받이
addCyl(0.055, 0.055, 0.06, 0xf3ede4, 0, 0.79, -0.20, chairG, 12);   // 목 지지
var headrest = addCyl(0.085, 0.085, 0.30, 0xf9f5ee, 0, 0.85, -0.20, chairG, 14);
headrest.rotation.z = Math.PI / 2;
addSphere(0.10, 0.075, 0.10, 0xf7f2ea, -0.16, 0.53, 0.02, chairG, 0.98);
addSphere(0.10, 0.075, 0.10, 0xf7f2ea, 0.16, 0.53, 0.02, chairG, 0.98);

// ================== 소파 (아이보리 2인용) + 치이카와 쿠션 ==================
var sofaG = new THREE.Group();
scene.add(sofaG);
// 베이스 / 좌방석
addBox(0.86, 0.30, 1.46, 0xf6efe4, 1.57, 0.22, -0.62, sofaG, true);
addSphere(0.40, 0.11, 0.68, 0xfbf6ee, 1.50, 0.42, -0.98, sofaG, 0.96);
addSphere(0.40, 0.11, 0.68, 0xfbf6ee, 1.50, 0.42, -0.28, sofaG, 0.96);
// 등받이
addBox(0.22, 0.56, 1.46, 0xf2ebdf, 1.91, 0.50, -0.62, sofaG, true);
addSphere(0.13, 0.18, 0.66, 0xfaf5ec, 1.80, 0.52, -0.98, sofaG, 0.96);
addSphere(0.13, 0.18, 0.66, 0xfaf5ec, 1.80, 0.52, -0.28, sofaG, 0.96);
// 팔걸이
addBox(0.84, 0.16, 0.14, 0xf2ebdf, 1.57, 0.34, -1.32, sofaG, true);
addBox(0.84, 0.16, 0.14, 0xf2ebdf, 1.57, 0.34, 0.08, sofaG, true);
addSphere(0.12, 0.09, 0.08, 0xfbf6ee, 1.20, 0.40, -1.32, sofaG, 0.96);
addSphere(0.12, 0.09, 0.08, 0xfbf6ee, 1.20, 0.40, 0.08, sofaG, 0.96);
// 다리
addCyl(0.03, 0.03, 0.10, 0x6d5a48, 1.24, 0.05, -1.26, sofaG, 8);
addCyl(0.03, 0.03, 0.10, 0x6d5a48, 1.24, 0.05, 0.02, sofaG, 8);
addCyl(0.03, 0.03, 0.10, 0x6d5a48, 1.90, 0.05, -1.26, sofaG, 8);
addCyl(0.03, 0.03, 0.10, 0x6d5a48, 1.90, 0.05, 0.02, sofaG, 8);

// 치이카와 얼굴 쿠션
var cush = new THREE.Group();
cush.position.set(1.62, 0.60, -0.42);
cush.rotation.z = 0.18;
cush.rotation.y = -0.35;
scene.add(cush);
var cushBody = addSphere(0.20, 0.19, 0.09, 0xfffdf8, 0, 0, 0, cush, 0.95);
var cushFace = new THREE.Mesh(
  new THREE.PlaneGeometry(0.30, 0.30),
  new THREE.MeshBasicMaterial({ map: faceTexes.chiikawa, transparent: true, depthWrite: false })
);
cushFace.position.set(0, 0.0, 0.088);
cushFace.rotation.y = -0.18;
cush.add(cushFace);

// 소파 앞 스트라이프 슬리퍼
var slipper1 = addBoxT(0.13, 0.045, 0.26, stripeTex, 0.86, 0.025, -0.62, scene, true, 0.95);
slipper1.rotation.y = 0.15;
var slipper2 = addBoxT(0.13, 0.045, 0.26, stripeTex, 0.86, 0.025, -0.34, scene, true, 0.95);
slipper2.rotation.y = -0.08;

// ================== 화이트 스툴(오토만) + 강아지 인형 ==================
addBox(0.58, 0.40, 0.50, 0xfaf6ef, 1.40, 0.20, 0.32, scene, true);
addSphere(0.29, 0.06, 0.25, 0xfdfaf5, 1.40, 0.41, 0.32, scene, 0.97);
// 강아지 인형 (베이지, 엎드린 자세)
var dogG = new THREE.Group();
dogG.position.set(1.40, 0.44, 0.32);
dogG.rotation.y = -1.15;
scene.add(dogG);
addSphere(0.15, 0.085, 0.10, 0xd8b489, 0, 0.07, 0, dogG, 0.95);        // 몸통
addSphere(0.095, 0.085, 0.085, 0xdcb98f, 0.15, 0.10, 0, dogG, 0.95);   // 머리
addSphere(0.045, 0.035, 0.035, 0xe4c39a, 0.22, 0.075, 0, dogG, 0.95);  // 주둥이
addSphere(0.016, 0.014, 0.014, 0x3a2d24, 0.245, 0.085, 0, dogG, 0.6);  // 코
addSphere(0.022, 0.014, 0.010, 0x3a2d24, 0.205, 0.115, 0.045, dogG, 0.6); // 눈
addSphere(0.022, 0.014, 0.010, 0x3a2d24, 0.205, 0.115, -0.045, dogG, 0.6);
addSphere(0.030, 0.070, 0.045, 0xc9a173, 0.145, 0.075, 0.085, dogG, 0.95); // 귀
addSphere(0.030, 0.070, 0.045, 0xc9a173, 0.145, 0.075, -0.085, dogG, 0.95);
addSphere(0.045, 0.035, 0.035, 0xd8b489, -0.12, 0.035, 0.06, dogG, 0.95);  // 앞발
addSphere(0.045, 0.035, 0.035, 0xd8b489, -0.12, 0.035, -0.06, dogG, 0.95);
addSphere(0.05, 0.03, 0.03, 0xc9a173, -0.17, 0.075, 0, dogG, 0.95);       // 꼬리

// ================== 러그 + 조약돌 테이블 ==================
var rug = new THREE.Mesh(new THREE.PlaneGeometry(2.66, 2.28), texMat(rugTex, 0.95));
rug.rotation.x = -Math.PI / 2;
rug.position.set(-0.22, 0.008, -0.55);
rug.receiveShadow = true;
scene.add(rug);

// 화이트 조약돌 테이블
var tableG = new THREE.Group();
tableG.position.set(-0.48, 0, -0.55);
scene.add(tableG);
var topGeo = new THREE.CylinderGeometry(0.56, 0.56, 0.045, 44);
var tableTop = addMesh(topGeo, mat(0xf4ede2, 0.55), 0, 0.355, 0, tableG);
tableTop.scale.set(1, 1, 0.72);
var tableRim = addMesh(new THREE.TorusGeometry(0.555, 0.022, 8, 44), mat(0xf7f1e7, 0.5), 0, 0.335, 0, tableG, false);
tableRim.rotation.x = Math.PI / 2;
tableRim.scale.set(1, 0.72, 1);
// 우드 V자 다리
var legA = addBox(0.055, 0.42, 0.13, 0xd2a878, 0, 0.19, 0.12, tableG, true);
legA.rotation.x = 0.30;
var legB = addBox(0.055, 0.42, 0.13, 0xd2a878, 0, 0.19, -0.12, tableG, true);
legB.rotation.x = -0.30;
addBox(0.06, 0.06, 0.30, 0xd2a878, 0, 0.36, 0, tableG, false);
// 테이블 위 소품: 꽃병 + 캔들
addCyl(0.035, 0.028, 0.09, 0xe7eef0, -0.10, 0.42, 0.02, tableG, 12);
addCyl(0.004, 0.004, 0.13, 0x6f8c5e, -0.10, 0.52, 0.02, tableG, 6);
addSphere(0.032, 0.028, 0.032, 0xf0a7b6, -0.115, 0.585, 0.02, tableG, 0.9);
addSphere(0.026, 0.024, 0.026, 0xfff3e2, -0.075, 0.575, 0.035, tableG, 0.9);
addSphere(0.022, 0.020, 0.022, 0xd8e5c8, -0.10, 0.56, -0.03, tableG, 0.9);
addCyl(0.038, 0.038, 0.055, 0xf0e4d0, 0.14, 0.405, -0.02, tableG, 14);
addSphere(0.011, 0.016, 0.011, 0xffc98a, 0.14, 0.44, -0.02, tableG, 0.5);

// ================== 왼쪽 벽 붙박이장 (크림 하이그로시) ==================
var closetG = new THREE.Group();
scene.add(closetG);
addBox(0.58, 2.36, 3.94, 0xf2e7da, -1.71, 1.18, -1.02, closetG, true);
// 상단 몰딩 / 하단 걸레받이
addBox(0.60, 0.05, 3.96, 0xe8dccd, -1.71, 2.33, -1.02, closetG, false);
addBox(0.60, 0.05, 3.96, 0xe4d8c9, -1.71, 0.03, -1.02, closetG, false);
// 문짝 세로 이음선 + 손잡이 (도어 6장)
for (var dz2 = -2.86; dz2 <= 0.86; dz2 += 0.62) {
  addBox(0.012, 2.26, 0.012, 0xded1c1, -1.415, 1.18, dz2, closetG, false);
  addBox(0.014, 0.30, 0.014, 0xc6b8a8, -1.408, 1.16, dz2 + 0.07, closetG, false);
}
// 문짝 손잡이 라인 (가로)
addBox(0.014, 0.012, 3.9, 0xe6d9c9, -1.412, 1.62, -1.02, closetG, false);

// 붙박이장에 걸린 가방 (검정 토트)
var bagG = new THREE.Group();
bagG.position.set(-1.38, 1.26, 0.34);
scene.add(bagG);
addBox(0.10, 0.34, 0.30, 0x2e2c2c, 0, 0, 0, bagG, true);
addBox(0.055, 0.06, 0.10, 0x242222, 0, 0.19, 0, bagG, false);
var handle1 = addMesh(new THREE.TorusGeometry(0.075, 0.008, 6, 14, Math.PI), mat(0x3a3737, 0.6), 0, 0.19, 0.07, bagG, false);
handle1.rotation.y = Math.PI / 2;
var handle2 = addMesh(new THREE.TorusGeometry(0.075, 0.008, 6, 14, Math.PI), mat(0x3a3737, 0.6), 0, 0.19, -0.07, bagG, false);
handle2.rotation.y = Math.PI / 2;

// ================== 주방 (현관 왼쪽) ==================
var kitG = new THREE.Group();
scene.add(kitG);
// 1) 붙박이 키큰장 (전자레인지 니치 포함)
addBox(0.58, 2.36, 1.02, 0xf1e6d9, -1.71, 1.18, 1.52, kitG, true);
addBox(0.014, 1.20, 0.012, 0xded1c1, -1.415, 0.62, 1.52, kitG, false);   // 아래 도어 이음선
addBox(0.014, 0.30, 0.014, 0xc6b8a8, -1.408, 1.10, 1.72, kitG, false);
// 니치 안쪽 (전자레인지 자리)
addBox(0.02, 0.50, 0.52, 0xe4d8ca, -1.43, 1.58, 1.52, kitG, false);
addBox(0.58, 0.02, 0.52, 0xe4d8ca, -1.71, 1.33, 1.52, kitG, false);
addBox(0.58, 0.02, 0.52, 0xe4d8ca, -1.71, 1.83, 1.52, kitG, false);
addBox(0.58, 0.50, 0.02, 0xe4d8ca, -1.71, 1.58, 1.77, kitG, false);
addBox(0.58, 0.50, 0.02, 0xe4d8ca, -1.71, 1.58, 1.27, kitG, false);
// 전자레인지 (화이트 + 우드 손잡이)
addBox(0.44, 0.32, 0.46, 0xf2f1ee, -1.60, 1.58, 1.52, kitG, true);
addBox(0.02, 0.24, 0.30, 0x30343a, -1.375, 1.58, 1.46, kitG, false);
addBox(0.025, 0.30, 0.05, 0xb98a5d, -1.372, 1.58, 1.67, kitG, false);
addBox(0.022, 0.10, 0.06, 0x8a8f96, -1.375, 1.58, 1.24, kitG, false);
// 니치 위 수납 문
addBox(0.014, 0.44, 0.012, 0xded1c1, -1.415, 2.10, 1.52, kitG, false);
// 가방걸이 + 백팩 (검정)
addBox(0.03, 0.05, 0.03, 0xc9bdae, -1.40, 1.86, 1.12, kitG, false);
var packG = new THREE.Group();
packG.position.set(-1.36, 1.52, 1.12);
scene.add(packG);
addBox(0.16, 0.30, 0.24, 0x27262a, 0, 0, 0, packG, true);
addBox(0.05, 0.10, 0.16, 0x1f1e22, 0.06, 0.14, 0, packG, false);
var strap = addMesh(new THREE.TorusGeometry(0.10, 0.012, 6, 14, Math.PI), mat(0x2f2e32, 0.7), 0, 0.17, 0, packG, false);
strap.rotation.z = Math.PI / 2;

// 2) 싱크대 + 드럼세탁기 (현관쪽 벽)
addBox(0.60, 0.86, 1.00, 0xf2e7da, -1.70, 0.43, 2.46, kitG, true);  // 하부장
addBox(0.63, 0.045, 1.02, 0xefe9e0, -1.70, 0.885, 2.46, kitG, true); // 상판
addBox(0.40, 0.03, 0.44, 0xcfd6dc, -1.70, 0.895, 2.36, kitG, false);  // 싱크볼
addBox(0.40, 0.02, 0.44, 0xb9c1c8, -1.70, 0.905, 2.36, kitG, false);
addCyl(0.018, 0.018, 0.22, 0xc2c9d0, -1.86, 1.00, 2.36, kitG, 10);
addBox(0.16, 0.02, 0.02, 0xc2c9d0, -1.78, 1.10, 2.36, kitG, false);
// 상부장 + 후드
addBox(0.34, 0.66, 1.00, 0xf6ece0, -1.86, 1.98, 2.46, kitG, true);
addBox(0.30, 0.10, 0.60, 0xd3d7dc, -1.80, 1.60, 2.36, kitG, false);
// 드럼세탁기
addBox(0.56, 0.80, 0.58, 0xf3f2ef, -1.70, 0.40, 2.72, kitG, true);
addMesh(new THREE.TorusGeometry(0.17, 0.028, 8, 22), mat(0xd6dadf, 0.4, 0.5), -1.415, 0.42, 2.72, kitG, false);
var wmDoor = addMesh(new THREE.CircleGeometry(0.155, 22), mat(0x5f6b78, 0.2, 0.6), -1.408, 0.42, 2.72, kitG, false);
wmDoor.rotation.y = Math.PI / 2;
addCyl(0.045, 0.045, 0.03, 0xc9ced4, -1.408, 0.72, 2.72, kitG, 12).rotation.z = Math.PI / 2;

// 3) 이동식 간이 테이블 + 에스프레소 머신
var rollG = new THREE.Group();
rollG.position.set(-1.28, 0, 1.92);
scene.add(rollG);
addBox(0.34, 0.04, 0.60, 0xf5f2ec, 0, 0.84, 0, rollG, true);
for (var rx2 = -1; rx2 <= 1; rx2 += 2) {
  for (var rz2 = -1; rz2 <= 1; rz2 += 2) {
    addBox(0.03, 0.80, 0.03, 0x9aa0a8, rx2 * 0.14, 0.42, rz2 * 0.26, rollG, false);
    addSphere(0.028, 0.028, 0.028, 0x2e3034, rx2 * 0.14, 0.03, rz2 * 0.26, rollG, 0.5);
  }
}
addBox(0.28, 0.02, 0.52, 0xd8dbdf, 0, 0.30, 0, rollG, false);
// 에스프레소 머신 (크림 + 우드)
addBox(0.24, 0.26, 0.22, 0xf4eee2, 0.0, 0.99, -0.05, rollG, true);
addBox(0.20, 0.06, 0.16, 0xe6ded0, 0, 0.86, 0.06, rollG, false);
addCyl(0.032, 0.032, 0.015, 0x3a3a3a, -0.06, 1.06, 0.062, rollG, 14).rotation.x = Math.PI / 2;
addBox(0.02, 0.02, 0.10, 0x40403f, 0.02, 1.00, 0.13, rollG, false);
addCyl(0.035, 0.030, 0.045, 0xfffdf8, 0.0, 0.895, 0.10, rollG, 12);
// 물병 (투명)
addCyl(0.045, 0.048, 0.26, 0xdceaf2, 0.02, 1.00, 0.22, rollG, 14, 0.25);
addCyl(0.02, 0.02, 0.04, 0x4f9fd0, 0.02, 1.15, 0.22, rollG, 10);
// 작은 오렌지 포인트 (머신 스티커 느낌)
addBox(0.10, 0.05, 0.005, 0xe08a3c, 0.06, 1.02, 0.115, rollG, false);

// ================== 화장실 + TV 가벽 ==================
// 화장실 바닥 (타일)
addBox(2.10, 0.02, 2.38, 0xeef1f3, 0.95, 0.012, 1.79, scene, false);
// 가벽 (TV 벽) — X -0.10 ~ +2.0, Z = +0.60
var tvWall = addBox(2.10, 2.36, 0.10, WALL2, 0.95, 1.18, 0.60, scene, true);
// 가벽 상단 몰딩
addBox(2.10, 0.06, 0.14, 0xf0e6da, 0.95, 2.35, 0.60, scene, false);
// 화장실 서쪽 벽 (문틀 포함)
addBox(0.08, 2.36, 0.72, WALL2, -0.10, 1.18, 0.98, scene, true);
addBox(0.08, 2.36, 1.02, WALL2, -0.10, 1.18, 2.49, scene, true);
addBox(0.08, 0.36, 0.70, WALL2, -0.10, 2.18, 1.66, scene, true); // 문 위 인방
// 화장실 문 (피벗 회전)
var doorPivot = new THREE.Group();
doorPivot.position.set(-0.10, 0, 1.32);
scene.add(doorPivot);
var bathDoor = addBox(0.05, 2.00, 0.68, 0xf6f1ea, 0, 1.00, 0.34, doorPivot, true);
addBox(0.045, 0.02, 0.56, 0xece4da, 0, 1.00, 0.34, doorPivot, false);
addBox(0.055, 0.10, 0.045, 0xb9ab9c, 0, 1.00, 0.60, doorPivot, false);
var doorOpen = false;
function toggleDoor() { doorOpen = !doorOpen; }

// 화장실 내부
addBox(0.38, 0.36, 0.44, 0xfdfcf9, 0.35, 0.18, 0.95, scene, false); // 변기 하부
addBox(0.40, 0.40, 0.16, 0xfdfcf9, 0.35, 0.52, 0.80, scene, false); // 물탱크
addBox(0.38, 0.04, 0.40, 0xf6f8fa, 0.35, 0.37, 0.99, scene, false); // 시트
addBox(0.44, 0.12, 0.36, 0xfdfcf9, 1.02, 0.78, 0.90, scene, false); // 세면볼
addBox(0.14, 0.72, 0.14, 0xf2f4f7, 1.02, 0.36, 0.87, scene, false);
addBox(0.42, 0.54, 0.03, 0xdcf0fb, 1.02, 1.44, 0.70, scene, false); // 거울
addBox(0.02, 0.16, 0.02, 0xc2c9d0, 1.02, 0.92, 0.80, scene, false); // 수전
var showerGlass = new THREE.Mesh(
  new THREE.BoxGeometry(0.03, 1.95, 1.00),
  new THREE.MeshStandardMaterial({ color: 0xdff2ff, transparent: true, opacity: 0.36, roughness: 0.08 })
);
showerGlass.position.set(1.42, 0.98, 1.72);
scene.add(showerGlass);
addBox(0.05, 0.60, 0.05, 0xc8d0d8, 1.94, 1.50, 2.20, scene, false);
addCyl(0.10, 0.10, 0.02, 0xd8e0e8, 1.94, 1.78, 2.14, scene, 16);
// 화장실 내부 조명
var bathLight = new THREE.PointLight(0xf2f7ff, 0.5, 3.2, 2);
bathLight.position.set(0.95, 2.1, 1.6);
scene.add(bathLight);

// 벽걸이 TV (가벽 북쪽 면)
var tvScreenMat = new THREE.MeshStandardMaterial({
  map: pitchTex, roughness: 0.32, metalness: 0.0, emissive: 0xffffff, emissiveMap: pitchTex, emissiveIntensity: 0.42
});
addBox(1.36, 0.80, 0.06, 0x24262a, 1.02, 1.50, 0.545, scene, false);
var tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.28, 0.72), tvScreenMat);
tvScreen.position.set(1.02, 1.50, 0.512);
tvScreen.rotation.y = Math.PI;
scene.add(tvScreen);
var tvOn = true;
function toggleTV() {
  tvOn = !tvOn;
  tvScreenMat.emissiveIntensity = tvOn ? 0.42 : 0.0;
  tvScreenMat.map = tvOn ? pitchTex : null;
  tvScreenMat.emissiveMap = tvOn ? pitchTex : null;
  tvScreenMat.color.setHex(tvOn ? 0xffffff : 0x15181c);
  tvScreenMat.needsUpdate = true;
}

// TV 아래 화이트 2단 서랍장
addBox(0.64, 0.62, 0.38, 0xfbf8f2, 0.84, 0.31, 0.40, scene, true);
addBox(0.60, 0.26, 0.02, 0xf1ebe2, 0.84, 0.44, 0.215, scene, false);
addBox(0.60, 0.26, 0.02, 0xf1ebe2, 0.84, 0.16, 0.215, scene, false);
addCyl(0.035, 0.035, 0.02, 0xf0e9df, 0.72, 0.44, 0.20, scene, 12).rotation.x = Math.PI / 2;
addCyl(0.035, 0.035, 0.02, 0xf0e9df, 0.72, 0.16, 0.20, scene, 12).rotation.x = Math.PI / 2;
// 2단 오픈 선반
addBox(0.60, 0.42, 0.26, 0xfbf8f2, 0.84, 0.85, 0.46, scene, true);
addBox(0.56, 0.02, 0.24, 0xf1ebe2, 0.84, 0.86, 0.46, scene, false);
addBox(0.56, 0.02, 0.24, 0xf1ebe2, 0.84, 1.05, 0.46, scene, false);
// 선반 소품 (산타 와인병 · 미니 박스 · 화장품)
addCyl(0.026, 0.026, 0.20, 0x2f4a34, 0.66, 1.16, 0.46, scene, 10);
addBox(0.05, 0.08, 0.05, 0xd94a4a, 0.66, 1.08, 0.46, scene, false);
addBox(0.14, 0.10, 0.10, 0xf2b6c8, 0.94, 0.97, 0.46, scene, false);
addBox(0.05, 0.12, 0.05, 0xe8dcc8, 0.76, 0.97, 0.44, scene, false);
addBox(0.05, 0.10, 0.05, 0xd8e2ea, 0.86, 0.96, 0.44, scene, false);
addBox(0.06, 0.14, 0.06, 0xf6e2a8, 1.02, 0.98, 0.46, scene, false);
addBox(0.10, 0.10, 0.10, 0xe08a3c, 1.06, 1.14, 0.47, scene, false);
addBox(0.05, 0.05, 0.05, 0x3d3a37, 0.74, 1.14, 0.48, scene, false);
// 서랍장 위 리모컨/소품
addBox(0.16, 0.025, 0.05, 0x232323, 0.62, 0.635, 0.30, scene, false);
addBox(0.10, 0.035, 0.06, 0xf4f0e8, 0.78, 0.64, 0.30, scene, false);

// 우드 상판 스트라이프 천 트롤리
var trolleyG = new THREE.Group();
trolleyG.position.set(0.56, 0, 0.16);
scene.add(trolleyG);
addBox(0.40, 0.04, 0.36, 0xd7ab78, 0, 0.74, 0, trolleyG, true);   // 우드 상판
addBox(0.38, 0.56, 0.34, 0xfbf8f2, 0, 0.44, 0, trolleyG, true);    // 프레임
var cloth = addBoxT(0.36, 0.44, 0.32, stripeTex, 0, 0.44, 0.012, trolleyG, false, 0.95);
addBox(0.36, 0.02, 0.30, 0xf1ebe2, 0, 0.20, 0, trolleyG, false);   // 하단 선반
addBox(0.02, 0.02, 0.30, 0xc8ccd2, 0.19, 0.12, 0, trolleyG, false);
addBox(0.02, 0.02, 0.30, 0xc8ccd2, -0.19, 0.12, 0, trolleyG, false);
addSphere(0.02, 0.02, 0.02, 0x303234, 0.17, 0.03, 0.12, trolleyG, 0.5);
addSphere(0.02, 0.02, 0.02, 0x303234, 0.17, 0.03, -0.12, trolleyG, 0.5);
addSphere(0.02, 0.02, 0.02, 0x303234, -0.17, 0.03, 0.12, trolleyG, 0.5);
addSphere(0.02, 0.02, 0.02, 0x303234, -0.17, 0.03, -0.12, trolleyG, 0.5);
// 트롤리 위 소품: 캔들 2개 · 디퓨저 · 탁상시계
addCyl(0.033, 0.033, 0.06, 0xe8ebe0, -0.10, 0.79, 0.03, trolleyG, 12);
addSphere(0.010, 0.014, 0.010, 0xffcb8e, -0.10, 0.826, 0.03, trolleyG, 0.5);
addCyl(0.030, 0.030, 0.05, 0xf1e6c8, -0.02, 0.785, 0.0, trolleyG, 12);
addCyl(0.028, 0.030, 0.09, 0x6b5c58, 0.06, 0.805, 0.02, trolleyG, 12);
addCyl(0.004, 0.004, 0.13, 0x201f1e, 0.06, 0.90, 0.02, trolleyG, 6);
addCyl(0.004, 0.004, 0.13, 0x201f1e, 0.075, 0.90, 0.0, trolleyG, 6);
addBox(0.10, 0.10, 0.075, 0xf7f4ec, 0.13, 0.81, 0.03, trolleyG, false);
addMesh(new THREE.CircleGeometry(0.036, 18), mat(0xfdfbf6, 0.8), 0.13, 0.81, 0.07, trolleyG, false);
addCyl(0.003, 0.003, 0.02, 0x2b2b2b, 0.13, 0.818, 0.072, trolleyG, 6);
// 하단 선반 병들
addCyl(0.028, 0.028, 0.14, 0xf4f2ee, -0.08, 0.28, 0.02, trolleyG, 10);
addCyl(0.024, 0.024, 0.12, 0xe8dfd2, 0.02, 0.27, -0.04, trolleyG, 10);
addBox(0.12, 0.07, 0.10, 0xe8d27a, 0.09, 0.255, 0.04, trolleyG, false);

// 화이트 스탠드 서큘레이터
var fanG = new THREE.Group();
fanG.position.set(0.30, 0, 0.66);
scene.add(fanG);
addCyl(0.16, 0.17, 0.03, 0xf6f4f0, 0, 0.02, 0, fanG, 20);
addCyl(0.045, 0.045, 0.52, 0xf8f6f2, 0, 0.28, 0, fanG, 12);
var fanHead = new THREE.Group();
fanHead.position.set(0, 0.62, 0);
fanHead.rotation.x = -0.22;
fanG.add(fanHead);
var fanRing = addMesh(new THREE.TorusGeometry(0.16, 0.022, 8, 26), mat(0xf0eeea, 0.6), 0, 0, 0, fanHead, false);
addCyl(0.155, 0.155, 0.10, 0xf6f4f0, 0, 0, -0.03, fanHead, 24).rotation.x = Math.PI / 2;
addMesh(new THREE.CircleGeometry(0.15, 24), mat(0xd9d8d5, 0.9), 0, 0, 0.03, fanHead, false);
for (var bl = 0; bl < 7; bl++) {
  var blade = addBox(0.10, 0.014, 0.03, 0xe8e6e2, 0, 0, 0.02, fanHead, false);
  blade.rotation.z = bl * Math.PI / 3.5;
  blade.position.set(Math.cos(bl * Math.PI / 3.5) * 0.07, Math.sin(bl * Math.PI / 3.5) * 0.07, 0.02);
}
addBox(0.22, 0.16, 0.10, 0xf8f6f2, 0, -0.14, -0.12, fanHead, false);

// 블랙 플로어 스탠드 조명 (따뜻한 불빛)
var lampG = new THREE.Group();
lampG.position.set(0.14, 0, 0.92);
scene.add(lampG);
addCyl(0.16, 0.17, 0.025, 0x1f1f21, 0, 0.012, 0, lampG, 20);
addCyl(0.016, 0.016, 1.68, 0x232325, 0, 0.86, 0, lampG, 10);
var shadeMat = new THREE.MeshStandardMaterial({
  color: 0xfff3dd, emissive: 0xffd9a0, emissiveIntensity: 0.85, roughness: 0.7, side: THREE.DoubleSide
});
var shade = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.10, 0.18, 26, 1, true), shadeMat);
shade.position.set(0, 1.70, 0);
lampG.add(shade);
addSphere(0.05, 0.05, 0.05, 0xfff0d0, 0, 1.62, 0, lampG, 0.4);

// ================== 소파 위 액자 4개 + 월패드 / 보일러 조절기 ==================
function makeFrame(w, h, frameCol, tex, x, y, z, rotY) {
  var g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  addBox(w, h, 0.03, frameCol, 0, 0, 0, g, true);
  var pic = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.05, h - 0.05), new THREE.MeshBasicMaterial({ map: tex }));
  pic.position.z = 0.018;
  g.add(pic);
  scene.add(g);
  return g;
}
var frameWallX = 1.955;
makeFrame(0.30, 0.38, 0x1e1e20, photoTexes[2], frameWallX, 1.98, -1.16, -Math.PI / 2);
makeFrame(0.26, 0.34, 0xfdfcf8, photoTexes[1], frameWallX, 2.10, -0.86, -Math.PI / 2);
makeFrame(0.28, 0.36, 0x1e1e20, photoTexes[3], frameWallX, 1.72, -0.74, -Math.PI / 2);
makeFrame(0.26, 0.34, 0xfdfcf8, photoTexes[0], frameWallX, 1.95, -0.44, -Math.PI / 2);
// 월패드 (인터폰)
addBox(0.03, 0.20, 0.30, 0xfdfcf8, 1.955, 1.62, -0.08, scene, true);
addBox(0.012, 0.13, 0.20, 0x35507a, 1.938, 1.62, -0.08, scene, false);
// 보일러 / 에어컨 조절기 2개
addBox(0.03, 0.13, 0.18, 0xf6f4ee, 1.955, 1.34, 0.06, scene, true);
addBox(0.012, 0.07, 0.11, 0xcfe0b8, 1.938, 1.35, 0.03, scene, false);
addBox(0.03, 0.13, 0.13, 0xf6f4ee, 1.955, 1.34, 0.24, scene, true);
addBox(0.012, 0.06, 0.07, 0xb8d6e8, 1.938, 1.35, 0.22, scene, false);

// ================== 현관 (남쪽 벽) ==================
addBox(RW, RH, 0.10, WALL, 0, RH / 2, 3.0, scene, true);
// 현관문 (그레이)
addBox(0.94, 2.06, 0.06, 0x9aa1a8, -0.62, 1.03, 2.94, scene, true);
addBox(0.90, 0.02, 0.05, 0x8d949b, -0.62, 1.50, 2.91, scene, false);
// 도어락 + 손잡이
addBox(0.10, 0.20, 0.03, 0x26282b, -0.62, 1.14, 2.90, scene, false);
addBox(0.03, 0.03, 0.02, 0x74d18a, -0.62, 1.19, 2.885, scene, false);
addCyl(0.02, 0.02, 0.10, 0xc9ccd0, -0.30, 1.02, 2.90, scene, 10).rotation.z = Math.PI / 2;
// 현관 매트
addBox(0.80, 0.015, 0.50, 0xd9d3c9, -0.62, 0.008, 2.62, scene, false);
// 현관 슬리퍼
addBox(0.12, 0.04, 0.24, 0xe6e0d6, -0.86, 0.02, 2.60, scene, false);
addBox(0.12, 0.04, 0.24, 0xe6e0d6, -0.70, 0.02, 2.60, scene, false);
// 벽 후크 + 에코백
addBox(0.04, 0.05, 0.02, 0xc9bdae, -1.30, 1.72, 2.93, scene, false);
var ecoG = new THREE.Group();
ecoG.position.set(-1.30, 1.40, 2.90);
scene.add(ecoG);
addBox(0.22, 0.30, 0.05, 0xdcd6c8, 0, 0, 0, ecoG, false);

// 빨래 건조대 + 옷 2벌 (현관 안쪽)
var rackG = new THREE.Group();
rackG.position.set(-1.02, 0, 0.42);
rackG.rotation.y = 0.12;
scene.add(rackG);
addCyl(0.012, 0.012, 1.10, 0xc9ccd0, -0.26, 0.55, -0.16, rackG, 8);
addCyl(0.012, 0.012, 1.10, 0xc9ccd0, 0.26, 0.55, -0.16, rackG, 8);
addCyl(0.012, 0.012, 1.10, 0xc9ccd0, -0.26, 0.55, 0.16, rackG, 8);
addCyl(0.012, 0.012, 1.10, 0xc9ccd0, 0.26, 0.55, 0.16, rackG, 8);
var rackBar = addCyl(0.010, 0.010, 0.56, 0xc9ccd0, 0, 1.06, 0, rackG, 8);
rackBar.rotation.z = Math.PI / 2;
// 티셔츠 2벌
addBox(0.30, 0.42, 0.015, 0xfdfcf8, -0.14, 0.78, 0.02, rackG, false);
addBox(0.26, 0.40, 0.015, 0xcdb9e4, 0.16, 0.79, 0.02, rackG, false);
addMesh(new THREE.TorusGeometry(0.045, 0.007, 6, 12, Math.PI), mat(0x9c8f7f, 0.7), -0.14, 1.00, 0.02, rackG, false);
addMesh(new THREE.TorusGeometry(0.045, 0.007, 6, 12, Math.PI), mat(0x9c8f7f, 0.7), 0.16, 1.00, 0.02, rackG, false);

// ================== 천장 없음(돌하우스 뷰) 대신 상단 마감 몰딩 ==================
addBox(RW, 0.05, 0.06, 0xf0e6da, 0, RH - 0.02, -2.98, scene, false);
addBox(0.06, 0.05, RD, 0xf0e6da, -1.98, RH - 0.02, 0, scene, false);
addBox(0.06, 0.05, RD, 0xf0e6da, 1.98, RH - 0.02, 0, scene, false);
addBox(RW, 0.05, 0.06, 0xf0e6da, 0, RH - 0.02, 2.98, scene, false);
