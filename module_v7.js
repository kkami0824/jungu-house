// ================== 생활 인터랙션 · 오디오 · 시간대 · 가구배치 ==================

// ---------- 오디오 (iOS Safari: 사용자 제스처에서 초기화) ----------
var actx = null;
function acInit() {
  if (!actx) {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { actx = new AC(); } catch (e) { actx = null; }
  }
  if (actx && actx.state === 'suspended') actx.resume();
  return actx;
}
function tone(freq, dur, type, vol, delay) {
  var a = acInit(); if (!a) return;
  var t0 = a.currentTime + (delay || 0);
  var o = a.createOscillator(), g = a.createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(a.destination);
  o.start(t0); o.stop(t0 + dur + 0.03);
}
var noiseBuf = null;
function noiseSource(vol, dur, lp) {
  var a = acInit(); if (!a) return null;
  if (!noiseBuf) {
    noiseBuf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  var src = a.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  var f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp || 1200;
  var g = a.createGain(); g.gain.value = vol || 0.08;
  src.connect(f); f.connect(g); g.connect(a.destination);
  src.start();
  if (dur) {
    g.gain.setValueAtTime(vol || 0.08, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    src.stop(a.currentTime + dur + 0.05);
  }
  return { src: src, gain: g };
}
var loopNodes = {};
function startLoop(key, kind) {
  stopLoop(key);
  if (kind === 'water') loopNodes[key] = noiseSource(0.05, 0, 2200);
  else if (kind === 'sizzle') loopNodes[key] = noiseSource(0.045, 0, 900);
}
function stopLoop(key) {
  var n = loopNodes[key];
  if (n) { try { n.gain.gain.value = 0; n.src.stop(); } catch (e) {} delete loopNodes[key]; }
}
function sfx(kind) {
  if (kind === 'bed') { tone(392, 0.25, 'sine', 0.06); tone(294, 0.35, 'sine', 0.05, 0.22); }
  else if (kind === 'type') { tone(880 + Math.random() * 220, 0.04, 'square', 0.03); }
  else if (kind === 'nom') { noiseSource(0.05, 0.09, 700); }
  else if (kind === 'coffee') { noiseSource(0.07, 1.1, 1400); tone(220, 0.5, 'sine', 0.05, 0.9); }
  else if (kind === 'cook') { noiseSource(0.06, 0.5, 900); tone(1200, 0.05, 'square', 0.03); }
  else if (kind === 'chop') { tone(600, 0.04, 'square', 0.05); tone(420, 0.05, 'square', 0.045, 0.09); }
  else if (kind === 'dish') { tone(1500, 0.06, 'triangle', 0.04); noiseSource(0.04, 0.3, 2500); }
  else if (kind === 'flush') { noiseSource(0.08, 1.6, 900); tone(180, 0.6, 'sine', 0.05); }
  else if (kind === 'plop') { tone(150, 0.12, 'sine', 0.08); tone(90, 0.18, 'sine', 0.07, 0.1); }
  else if (kind === 'open') { tone(520, 0.06, 'triangle', 0.05); tone(700, 0.06, 'triangle', 0.04, 0.06); }
  else if (kind === 'fridge') { tone(180, 0.12, 'sine', 0.07); noiseSource(0.03, 0.4, 500); }
  else if (kind === 'sit') { tone(330, 0.1, 'sine', 0.05); }
  else if (kind === 'zzz') { tone(240, 0.4, 'sine', 0.04); tone(200, 0.5, 'sine', 0.035, 0.5); }
}

// ---------- TV 테마 ----------
var tvTheme = 'off';        // off | carol | jazz | cartoon
var tvLoop = null;
var tvThemeTex = {};
function makeThemeTex(name) {
  return makeTex(512, 288, function(ctx, w, h) {
    if (name === 'carol') {
      var g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#0d2242'); g.addColorStop(0.6, '#1c3f66'); g.addColorStop(1, '#2b5478');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      for (var i = 0; i < 70; i++) { ctx.globalAlpha = 0.4 + Math.random() * 0.6; ctx.beginPath(); ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 1.8 + 0.6, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#f7f3e8'; ctx.beginPath(); ctx.ellipse(w / 2, h + 30, w * 0.75, 90, 0, 0, Math.PI * 2); ctx.fill();
      // 트리
      ctx.fillStyle = '#2e6b46';
      for (var t = 0; t < 3; t++) { ctx.beginPath(); ctx.moveTo(w * 0.5, 60 + t * 42); ctx.lineTo(w * 0.5 - 55 + t * 12, 150 + t * 40); ctx.lineTo(w * 0.5 + 55 - t * 12, 150 + t * 40); ctx.fill(); }
      ctx.fillStyle = '#8a5a34'; ctx.fillRect(w * 0.47, 235, 26, 34);
      ['#ffd166', '#ff7b7b', '#8ecae6', '#ffd166', '#c8f5a0'].forEach(function(c, i) {
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(w * 0.5 + Math.sin(i * 2.1) * 38, 120 + i * 22, 5, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = '#ffd166'; ctx.font = 'bold 22px sans-serif'; ctx.fillText('Merry Christmas', 22, 38);
    } else if (name === 'jazz') {
      ctx.fillStyle = '#171a26'; ctx.fillRect(0, 0, w, h);
      for (var i = 0; i < 26; i++) {
        var r = 12 + (i * 9) % 70;
        ctx.strokeStyle = 'rgba(255,' + (150 + i * 3) + ',120,0.20)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(w * 0.5, h * 0.55, r, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,214,150,0.9)';
      ctx.beginPath(); ctx.arc(w * 0.5, h * 0.55, 16, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(140,220,255,0.8)'; ctx.lineWidth = 3; ctx.beginPath();
      for (var x = 0; x < w; x += 6) {
        var y = h * 0.72 + Math.sin(x * 0.05) * 14 * Math.sin(x * 0.011);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = '#ffd8a8'; ctx.font = 'bold 20px serif'; ctx.fillText('♫ Late Night Jazz', 20, h - 22);
    } else {
      var g2 = ctx.createLinearGradient(0, 0, w, h);
      g2.addColorStop(0, '#ffd6e8'); g2.addColorStop(0.5, '#c9f0ff'); g2.addColorStop(1, '#fff4c2');
      ctx.fillStyle = g2; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ff8fb8';
      for (var b = 0; b < 8; b++) {
        ctx.beginPath();
        ctx.arc(40 + b * 62, h * 0.5 + Math.sin(b * 1.4) * 55, 16 + (b % 3) * 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#3a2e28'; ctx.beginPath(); ctx.arc(w * 0.5, h * 0.42, 46, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(w * 0.5 - 15, h * 0.38, 12, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(w * 0.5 + 15, h * 0.38, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a2e28'; ctx.beginPath(); ctx.arc(w * 0.5 - 15, h * 0.38, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(w * 0.5 + 15, h * 0.38, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#3a2e28'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(w * 0.5, h * 0.5, 14, 0.2, Math.PI - 0.2); ctx.stroke();
      ctx.font = 'bold 24px sans-serif'; ctx.fillStyle = '#5b4bb7'; ctx.fillText('만화나라', 24, 40);
      ctx.font = 'bold 18px sans-serif'; ctx.fillStyle = '#e05b7a'; ctx.fillText('PPANG! BOING!', w - 190, h - 26);
    }
  });
}
['carol', 'jazz', 'cartoon'].forEach(function(n) { tvThemeTex[n] = makeThemeTex(n); });

function tvPlay(name) {
  stopTvLoop();
  if (name === 'carol') {
    var mel = [659, 659, 659, 523, 659, 659, 784, 659, 523, 587, 494];
    var i = 0;
    tvLoop = setInterval(function() {
      var f = mel[i % mel.length]; i++;
      tone(f, 0.22, 'triangle', 0.045);
      if (i % 4 === 0) tone(f / 2, 0.3, 'sine', 0.03);
    }, 260);
  } else if (name === 'jazz') {
    var prog = [[261.6, 329.6, 392.0, 493.9], [293.7, 349.2, 440.0, 523.3], [246.9, 311.1, 370.0, 466.2], [220.0, 277.2, 329.6, 415.3]];
    var j = 0;
    tvLoop = setInterval(function() {
      var ch = prog[j % prog.length]; j++;
      ch.forEach(function(f, k) { tone(f * (k === 3 ? 1 : 1), 0.5, 'sine', 0.028, k * 0.02); });
      tone(ch[0] * 2, 0.18, 'triangle', 0.02, 0.30);
      tone(ch[2] * 2.5, 0.12, 'triangle', 0.016, 0.46);
    }, 620);
  } else if (name === 'cartoon') {
    var seq = [523, 784, 523, 880, 660, 1046, 784, 660];
    var q = 0;
    tvLoop = setInterval(function() {
      var f = seq[q % seq.length];
      tone(f, 0.09, 'square', 0.03);
      if (q % 3 === 0) tone(f * 0.5, 0.16, 'sawtooth', 0.012);
      q++;
    }, 150);
  }
}
function stopTvLoop() { if (tvLoop) { clearInterval(tvLoop); tvLoop = null; } }

function setTvTheme(name) {
  tvTheme = name;
  if (name === 'off') {
    stopTvLoop();
    tvScreenMat.emissiveIntensity = 0;
    tvScreenMat.map = null; tvScreenMat.emissiveMap = null;
    tvScreenMat.color.setHex(0x15181c);
  } else {
    tvScreenMat.map = tvThemeTex[name];
    tvScreenMat.emissiveMap = tvThemeTex[name];
    tvScreenMat.emissiveIntensity = 0.55;
    tvScreenMat.color.setHex(0xffffff);
    tvPlay(name);
  }
  tvScreenMat.needsUpdate = true;
  var b = document.getElementById('btn-tv');
  if (b) b.textContent = '📺 ' + ({ off: 'TV', carol: '캐롤', jazz: '재즈', cartoon: '만화' })[name];
}
// 기존 TV 토글을 테마 순환으로 교체
function toggleTV() {
  var order = ['off', 'carol', 'jazz', 'cartoon'];
  var next = order[(order.indexOf(tvTheme) + 1) % order.length];
  setTvTheme(next);
  sfx('open');
}

// ---------- 냉장고 문 ----------
var fridgeOpen = false;
function toggleFridge() {
  fridgeOpen = !fridgeOpen;
  sfx('fridge');
}

// ---------- 파티클 이펙트 ----------
var fxList = [];
function fxTex(kind) {
  if (kind === 'zzz') return makeTex(64, 64, function(c, w, h) {
    c.clearRect(0, 0, w, h); c.fillStyle = '#6b8cff'; c.font = 'bold 46px sans-serif';
    c.fillText('z', 14, 46);
  });
  return null;
}
var zzzTex = fxTex('zzz');
function addFx(kind, pos, opt) {
  opt = opt || {};
  var mesh;
  if (kind === 'zzz' || kind === 'heart' || kind === 'note' || kind === 'poop' || kind === 'smoke') {
    var txt = { zzz: zzzTex, heart: makeTex(64, 64, function(c, w, h) { c.clearRect(0, 0, w, h); c.font = '48px sans-serif'; c.fillText('💗', 4, 50); }),
      note: makeTex(64, 64, function(c, w, h) { c.clearRect(0, 0, w, h); c.font = '44px sans-serif'; c.fillText('🎵', 6, 50); }),
      poop: makeTex(64, 64, function(c, w, h) { c.clearRect(0, 0, w, h); c.font = '44px sans-serif'; c.fillText('💩', 6, 50); }),
      smoke: makeTex(64, 64, function(c, w, h) { c.clearRect(0, 0, w, h); c.font = '44px sans-serif'; c.fillText('💨', 6, 50); })
    }[kind];
    mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.16),
      new THREE.MeshBasicMaterial({ map: txt, transparent: true, depthWrite: false }));
    mesh.position.copy(pos);
    scene.add(mesh);
    fxList.push({ m: mesh, life: opt.life || 1.6, t: 0, vy: 0.35, kind: kind });
  } else if (kind === 'drop' || kind === 'bubble' || kind === 'steam') {
    var col = kind === 'drop' ? 0x8fd0f5 : (kind === 'bubble' ? 0xffffff : 0xffffff);
    mesh = new THREE.Mesh(new THREE.SphereGeometry(kind === 'drop' ? 0.018 : 0.026, 8, 6),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: kind === 'steam' ? 0.5 : 0.85 }));
    mesh.position.copy(pos);
    scene.add(mesh);
    fxList.push({
      m: mesh, life: opt.life || 1.2, t: 0, kind: kind,
      vy: kind === 'drop' ? -0.9 : 0.55,
      vx: (Math.random() - 0.5) * 0.25, vz: (Math.random() - 0.5) * 0.25
    });
  }
  if (fxList.length > 90) { var old = fxList.shift(); scene.remove(old.m); }
}
function updateFx(dt) {
  for (var i = fxList.length - 1; i >= 0; i--) {
    var f = fxList[i];
    f.t += dt;
    var k = f.t / f.life;
    if (k >= 1) { scene.remove(f.m); fxList.splice(i, 1); continue; }
    if (f.kind === 'zzz') {
      f.m.position.y += dt * 0.28;
      f.m.position.x += dt * 0.06;
      f.m.material.opacity = 1 - k;
      f.m.scale.setScalar(0.7 + k * 0.8);
      f.m.lookAt(camera.position);
    } else if (f.kind === 'heart' || f.kind === 'note' || f.kind === 'poop' || f.kind === 'smoke') {
      f.m.position.y += dt * (f.kind === 'smoke' ? 0.5 : 0.25);
      f.m.material.opacity = 1 - k;
      f.m.lookAt(camera.position);
      f.m.scale.setScalar(1 + k * 0.5);
    } else {
      f.m.position.x += f.vx * dt;
      f.m.position.z += f.vz * dt;
      f.m.position.y += f.vy * dt;
      if (f.kind === 'steam') f.m.scale.setScalar(1 + k * 2);
      f.m.material.opacity = (f.kind === 'steam' ? 0.45 : 0.85) * (1 - k);
    }
  }
}
var fxTimers = {};
function startFx(id, kind) {
  stopFx(id);
  fxTimers[id] = setInterval(function() {
    var c = chars[id];
    if (!c || !c.act) { stopFx(id); return; }
    var p = c.mesh.position;
    if (kind === 'sleep') {
      addFx('zzz', new THREE.Vector3(p.x + 0.18, p.y + 0.55, p.z));
    } else if (kind === 'game') {
      addFx('note', new THREE.Vector3(p.x + 0.2, p.y + 0.75, p.z));
    } else if (kind === 'eat') {
      addFx('heart', new THREE.Vector3(p.x + (Math.random() - 0.5) * 0.3, p.y + 0.6, p.z + 0.1));
    } else if (kind === 'shower') {
      for (var i = 0; i < 3; i++) addFx('drop', new THREE.Vector3(1.62 + (Math.random() - 0.5) * 0.5, 1.75, 2.26 + (Math.random() - 0.5) * 0.35), { life: 0.8 });
    } else if (kind === 'wash') {
      addFx('drop', new THREE.Vector3(1.78 + (Math.random() - 0.5) * 0.2, 0.95, 1.58 + (Math.random() - 0.5) * 0.2), { life: 0.7 });
    } else if (kind === 'dish') {
      for (var j = 0; j < 2; j++) addFx('bubble', new THREE.Vector3(-1.68 + (Math.random() - 0.5) * 0.3, 1.0, 2.36 + (Math.random() - 0.5) * 0.3), { life: 1.1 });
    } else if (kind === 'cook') {
      addFx('smoke', new THREE.Vector3(-1.68 + (Math.random() - 0.5) * 0.2, 1.15, 2.36 + (Math.random() - 0.5) * 0.2));
    } else if (kind === 'coffee') {
      addFx('steam', new THREE.Vector3(-1.28 + (Math.random() - 0.5) * 0.1, 1.12, 1.92 + (Math.random() - 0.5) * 0.1), { life: 1.0 });
    } else if (kind === 'poop') {
      addFx('poop', new THREE.Vector3(p.x + 0.15, p.y + 0.7, p.z + 0.1));
    }
  }, kind === 'shower' ? 120 : 420);
}
function stopFx(id) {
  if (fxTimers[id]) { clearInterval(fxTimers[id]); delete fxTimers[id]; }
}

// ---------- 가구 그룹 (배치 이동용) ----------
var furn = [];
function wrapFurniture(name, px, pz, objs) {
  var g = new THREE.Group();
  g.position.set(px, 0, pz);
  scene.add(g);
  objs.forEach(function(o) {
    if (!o || o.parent !== scene) return;
    scene.remove(o);
    o.position.sub(new THREE.Vector3(px, 0, pz));
    g.add(o);
  });
  g.userData.base = { x: px, z: pz, ry: 0 };
  g.userData.furnName = name;
  furn.push({ name: name, g: g, key: name });
  return g;
}
function registerFurniture(name, g) {
  if (!g) return;
  g.userData.base = { x: g.position.x, z: g.position.z, ry: g.rotation.y };
  g.userData.furnName = name;
  furn.push({ name: name, g: g, key: name });
  return g;
}

// ---------- 스테이션(가구별 상호작용 지점) ----------
var stations = [];
function station(o) {
  o.reach = o.reach || 1.25;
  o.acts.forEach(function(a) {
    (a.slots || [{}]).forEach(function(s) {
      if (o.g) {
        var v = new THREE.Vector3(s.x, 0, s.z);
        o.g.worldToLocal(v);
        s.lx = v.x; s.lz = v.z;
      } else { s.lx = s.x; s.lz = s.z; }
    });
  });
  stations.push(o);
  return o;
}
function slotPos(st, s) {
  if (st.g) { st.g.updateMatrixWorld(); return st.g.localToWorld(new THREE.Vector3(s.lx, 0, s.lz)); }
  return new THREE.Vector3(s.x, 0, s.z);
}
function slotRot(st, s) { return (s.rot || 0) + (st.g ? st.g.rotation.y : 0); }

function buildStations() {
  station({ id: 'bed', name: '침대', g: bedWrap, acts: [
    { id: 'sleep', label: '😴 잠자기', fx: 'sleep', sound: 'bed', slots: [
      { x: -0.42, z: -2.56, rot: -Math.PI / 2, lie: true, y: 0.60 },
      { x: -0.42, z: -2.06, rot: -Math.PI / 2, lie: true, y: 0.60 }
    ] }
  ] });
  station({ id: 'desk', name: '컴퓨터 책상', g: deskWrap, acts: [
    { id: 'game', label: '🎮 게임하기', fx: 'game', sound: 'type', slots: [
      { x: 1.06, z: -2.04, rot: Math.PI / 2, sit: true, y: 0.44 }
    ] }
  ] });
  station({ id: 'sofa', name: '소파', g: sofaWrap, acts: [
    { id: 'sofa_sit', label: '🪑 앉기', fx: null, sound: 'sit', slots: [
      { x: 1.45, z: -0.98, rot: -Math.PI / 2, sit: true, y: 0.44 },
      { x: 1.45, z: -0.28, rot: -Math.PI / 2, sit: true, y: 0.44 }
    ] },
    { id: 'sofa_lie', label: '🛋️ 눕기', fx: 'sleep', sound: 'bed', slots: [
      { x: 1.62, z: -0.02, rot: Math.PI, lie: true, y: 0.44 }
    ] }
  ] });
  station({ id: 'table', name: '소파 테이블', g: tableWrap, acts: [
    { id: 'eat', label: '🍚 밥먹기', fx: 'eat', sound: 'nom', slots: [
      { x: -0.48, z: -1.10, rot: Math.PI, sit: true, y: 0.30, food: true },
      { x: -0.48, z: 0.06, rot: 0, sit: true, y: 0.30, food: true }
    ] }
  ] });
  station({ id: 'coffee', name: '커피머신', g: rollG, acts: [
    { id: 'coffee', label: '☕ 커피 내리기', fx: 'coffee', sound: 'coffee', slots: [
      { x: -0.98, z: 1.92, rot: -Math.PI / 2 }
    ] }
  ] });
  station({ id: 'shower', name: '샤워부스', acts: [
    { id: 'shower', label: '🚿 샤워하기', fx: 'shower', sound: 'flush', slots: [
      { x: 1.56, z: 2.28, rot: Math.PI / 2 }
    ] }
  ] });
  station({ id: 'basin', name: '세면대', acts: [
    { id: 'wash', label: '💧 세수하기', fx: 'wash', sound: 'flush', slots: [
      { x: 1.36, z: 1.58, rot: Math.PI / 2 }
    ] }
  ] });
  station({ id: 'toilet', name: '변기', acts: [
    { id: 'poop', label: '🚽 응가하기', fx: 'poop', sound: 'plop', slots: [
      { x: 1.58, z: 1.00, rot: Math.PI / 2, sit: true, y: 0.42 }
    ] }
  ] });
  station({ id: 'sink', name: '싱크대', acts: [
    { id: 'cook', label: '🍳 요리하기', fx: 'cook', sound: 'cook', slots: [
      { x: -1.34, z: 2.30, rot: -Math.PI / 2, cook: true }
    ] },
    { id: 'dish', label: '🫧 설거지하기', fx: 'dish', sound: 'dish', slots: [
      { x: -1.34, z: 2.52, rot: -Math.PI / 2 }
    ] }
  ] });
  station({ id: 'fridge', name: '냉장고', acts: [
    { id: 'fridge', label: '🧊 냉장고 열기', fx: null, sound: 'fridge', slots: [
      { x: -1.10, z: 1.78, rot: -Math.PI / 2 }
    ] }
  ] });
}

// ---------- 액션 상태 ----------
var myAct = null;          // { stId, actId, slot, label, fx }
var nearStation = null;
var pinnedStation = null, pinnedUntil = 0;

function freeSlot(st, a) {
  var used = [];
  Object.keys(chars).forEach(function(id) {
    var c = chars[id];
    if (c.act && c.act.stId === st.id && c.act.actId === a.id) used.push(c.act.slot);
  });
  var slots = a.slots || [{}];
  for (var i = 0; i < slots.length; i++) if (used.indexOf(i) === -1) return i;
  return 0;
}

function startAction(st, a) {
  var me = chars[clientId];
  if (!me) return;
  var slot = freeSlot(st, a);
  var s = (a.slots || [{}])[slot];
  myAct = { stId: st.id, actId: a.id, slot: slot, label: a.label, fx: a.fx, sound: a.sound, st: st, s: s };
  me.act = myAct;
  sfx(a.sound || 'sit');
  if (a.fx) startFx(clientId, a.fx);
  if (a.id === 'fridge') toggleFridge();
  if (a.id === 'sleep') showBubble(clientId, '쿨쿨... 💤');
  if (a.id === 'eat') showBubble(clientId, '냠냠 맛있다 😋');
  if (a.id === 'shower') showBubble(clientId, '샤워 중~ 🚿');
  if (a.id === 'poop') showBubble(clientId, '끙... 💩');
  if (a.id === 'game') showBubble(clientId, '한 판만 더! 🎮');
  if (a.id === 'coffee') showBubble(clientId, '커피 타임 ☕');
  if (a.id === 'cook') showBubble(clientId, '냠냠 요리 중 🍳');
  if (a.id === 'wash') showBubble(clientId, '세수 중 💧');
  if (a.id === 'dish') showBubble(clientId, '설거지 중 🫧');
  if (a.fx === 'shower') startLoop('water', 'water');
  else if (a.fx === 'cook') startLoop('sizzle', 'sizzle');
  hideActionBar();
  refreshActBtns();
}
function stopAction(silent) {
  var me = chars[clientId];
  myAct = null;
  if (me) me.act = null;
  stopFx(clientId);
  stopLoop('water'); stopLoop('sizzle');
  if (!silent) sfx('sit');
  refreshActBtns();
}
function refreshActBtns() {
  var bar = document.getElementById('act-now');
  if (!bar) return;
  if (myAct) {
    bar.style.display = 'flex';
    document.getElementById('act-now-label').textContent = myAct.label.replace(/^\S+\s/, '');
  } else bar.style.display = 'none';
}

// ---------- 액션 바 UI ----------
function showActionBar(st) {
  var bar = document.getElementById('action-bar');
  if (!bar) return;
  document.getElementById('action-title').textContent = st.name;
  var box = document.getElementById('action-btns');
  box.innerHTML = '';
  st.acts.forEach(function(a) {
    var b = document.createElement('button');
    b.className = 'act-btn';
    b.textContent = a.label;
    b.onclick = function(e) { e.stopPropagation(); startAction(st, a); };
    box.appendChild(b);
  });
  bar.classList.add('show');
}
function hideActionBar() {
  var bar = document.getElementById('action-bar');
  if (bar) bar.classList.remove('show');
}

// ---------- 포즈 ----------
function applyPose(c, t) {
  var mesh = c.mesh, rig = mesh.userData.rig, parts = mesh.userData.parts;
  if (!rig) return;
  var a = c.act;
  var targetY = 0, rigRotX = 0, legRot = 0, legY = 0, legZ = 0, armRot = 0;
  if (a && a.s) {
    if (a.s.lie) { rigRotX = -Math.PI / 2; targetY = (a.s.y || 0.6) + 0.02; }
    else if (a.s.sit) { targetY = (a.s.y || 0.4) - 0.16; legRot = -1.25; legY = 0.02; legZ = 0.06; }
    if (a.actId === 'game') armRot = -0.8 + Math.sin(t * 14) * 0.25;
    else if (a.actId === 'eat') armRot = -1.1 + Math.sin(t * 5) * 0.5;
    else if (a.actId === 'coffee') armRot = -1.3;
    else if (a.actId === 'wash') armRot = -1.0 + Math.sin(t * 6) * 0.4;
    else if (a.actId === 'cook') armRot = -1.2 + Math.sin(t * 8) * 0.3;
    else if (a.actId === 'dish') armRot = -1.1 + Math.sin(t * 4) * 0.35;
    else if (a.actId === 'shower') armRot = -2.3;
    else if (a.actId === 'sleep') armRot = -0.2;
  }
  rig.rotation.x += (rigRotX - rig.rotation.x) * 0.2;
  rig.position.y += (targetY - rig.position.y) * 0.2;
  if (parts) {
    if (parts.legL) {
      parts.legL.rotation.x += (legRot - parts.legL.rotation.x) * 0.2;
      parts.legR.rotation.x += (legRot - parts.legR.rotation.x) * 0.2;
      parts.legL.position.z += (legZ - parts.legL.position.z) * 0.2;
      parts.legR.position.z += (legZ - parts.legR.position.z) * 0.2;
    }
    if (parts.armL) {
      parts.armL.rotation.x += (armRot - parts.armL.rotation.x) * 0.25;
      parts.armR.rotation.x += (armRot - parts.armR.rotation.x) * 0.25;
    }
  }
  // 앉기/눕기 시 머리 위 아이템
  if (parts && parts.cup) parts.cup.visible = !!(a && (a.actId === 'coffee' || a.actId === 'eat'));
  if (parts && parts.cup && parts.cup.visible) {
    parts.cup.position.set(0.13, 0.34 + Math.sin(t * 3) * 0.01, 0.14);
  }
}

// ---------- 프레임별 업데이트 ----------
function updateActors(dt) {
  var t = performance.now() * 0.001;
  Object.keys(chars).forEach(function(id) {
    var c = chars[id];
    if (!c.act || !c.act.st) { applyPose(c, t); return; }
    var s = c.act.s, st = c.act.st;
    var p = slotPos(st, s);
    var rot = slotRot(st, s);
    if (id === clientId) {
      c.mesh.position.lerp(new THREE.Vector3(p.x, 0, p.z), 0.18);
    } else {
      c.targetPos.set(p.x, 0, p.z);
    }
    var cur = c.mesh.rotation.y;
    var d = ((rot - cur + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    c.mesh.rotation.y = cur + d * 0.15;
    applyPose(c, t);
  });
}

// ---------- 가구배치 모드 ----------
var placeMode = false;
var selFurn = null;
var dragging = false;
var dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
function togglePlaceMode() {
  placeMode = !placeMode;
  document.getElementById('btn-place').classList.toggle('on', placeMode);
  document.getElementById('place-panel').classList.toggle('show', placeMode);
  if (placeMode) {
    myAct && stopAction(true);
    document.getElementById('place-name').textContent = '가구를 터치해 고르세요';
    document.getElementById('place-rot').style.display = 'none';
  } else {
    selFurn = null;
  }
}
function selectFurn(g) {
  selFurn = g;
  var f = furn.find(function(x) { return x.g === g; });
  document.getElementById('place-name').textContent = f ? f.name : '가구';
  document.getElementById('place-rot').style.display = 'inline-block';
  sfx('open');
}
function rotateSel() {
  if (!selFurn) return;
  selFurn.rotation.y += Math.PI / 2;
  saveFurniture();
  sfx('type');
}
function resetFurniture() {
  furn.forEach(function(f) {
    f.g.position.set(f.g.userData.base.x, 0, f.g.userData.base.z);
    f.g.rotation.y = f.g.userData.base.ry;
  });
  saveFurniture();
  sfx('bed');
}
function saveFurniture() {
  var data = furn.map(function(f) {
    return { k: f.key, x: +f.g.position.x.toFixed(3), z: +f.g.position.z.toFixed(3), r: +f.g.rotation.y.toFixed(3) };
  });
  try { localStorage.setItem('jungu_furn_v1', JSON.stringify(data)); } catch (e) {}
  if (sbChannel) sbChannel.send({ type: 'broadcast', event: 'furn', payload: { items: data } });
}
function applyFurniture(data) {
  if (!data) return;
  data.forEach(function(d) {
    var f = furn.find(function(x) { return x.key === d.k; });
    if (f) { f.g.position.x = d.x; f.g.position.z = d.z; f.g.rotation.y = d.r; }
  });
}
function loadFurniture() {
  try {
    var s = localStorage.getItem('jungu_furn_v1');
    if (s) applyFurniture(JSON.parse(s));
  } catch (e) {}
}

// ---------- 시간대 ----------
var timeMode = 'auto';
var timeLabels = { auto: '🕒 실시간', day: '☀️ 낮', sunset: '🌇 노을', night: '🌙 밤', dawn: '🌅 새벽' };
var skyMats = {};
function skyFor(phase) {
  var c1, c2, c3, c4;
  if (phase === 'day') { c1 = '#8fc4ea'; c2 = '#c6e2f5'; c3 = '#e8f3fb'; c4 = '#f4f9fd'; }
  else if (phase === 'sunset') { c1 = '#7b8fd0'; c2 = '#e3a3b8'; c3 = '#ffc79a'; c4 = '#ffe0bd'; }
  else if (phase === 'night') { c1 = '#05070f'; c2 = '#0d1424'; c3 = '#182238'; c4 = '#26324a'; }
  else { c1 = '#6f7fa8'; c2 = '#c2a8bd'; c3 = '#f0c3b0'; c4 = '#ffe0cf'; }
  return makeTex(512, 300, function(ctx, w, h) {
    var g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, c1); g.addColorStop(0.45, c2); g.addColorStop(0.78, c3); g.addColorStop(1, c4);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    if (phase === 'night') {
      for (var i = 0; i < 90; i++) {
        ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + Math.random() * 0.7) + ')';
        ctx.beginPath(); ctx.arc(Math.random() * w, Math.random() * h * 0.7, Math.random() * 1.4 + 0.4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,245,220,0.9)';
      ctx.beginPath(); ctx.arc(w * 0.78, h * 0.2, 16, 0, Math.PI * 2); ctx.fill();
    } else if (phase === 'sunset') {
      var rg = ctx.createRadialGradient(w * 0.7, h * 0.7, 6, w * 0.7, h * 0.7, 130);
      rg.addColorStop(0, 'rgba(255,235,200,0.95)'); rg.addColorStop(1, 'rgba(255,200,150,0)');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
    }
  });
}
function currentPhase() {
  var d = new Date();
  var h = d.getHours() + d.getMinutes() / 60;
  if (h >= 7 && h < 16.5) return 'day';
  if (h >= 16.5 && h < 19) return 'sunset';
  if (h >= 5 && h < 7) return 'dawn';
  return 'night';
}
function applyTime() {
  var phase = timeMode === 'auto' ? currentPhase() : timeMode;
  if (!skyMats[phase]) skyMats[phase] = skyFor(phase);
  if (sky && sky.material) { sky.material.map = skyMats[phase]; sky.material.needsUpdate = true; }
  var night = phase === 'night';
  var sunset = phase === 'sunset';
  var dawn = phase === 'dawn';
  if (phase === 'day') {
    scene.background.setHex(0xdfeaf2);
    scene.fog.color.setHex(0xdfeaf2);
    sun.color.setHex(0xfff4e2); sun.intensity = 2.0;
    hemi.color.setHex(0xffffff); hemi.groundColor.setHex(0xe0d5c8); hemi.intensity = 1.25;
    roomLight.intensity = 0.3; lampLight.intensity = 0.25; winGlow.intensity = 0.7; winGlow.color.setHex(0xfff6e8);
    renderer.toneMappingExposure = 1.05;
  } else if (sunset) {
    scene.background.setHex(0xf0d2b8);
    scene.fog.color.setHex(0xf0c8a8);
    sun.color.setHex(0xff9d5c); sun.intensity = 1.9;
    hemi.color.setHex(0xffdcc0); hemi.groundColor.setHex(0xc9a894); hemi.intensity = 0.95;
    roomLight.intensity = 0.5; lampLight.intensity = 0.8;
    winGlow.intensity = 0.95; winGlow.color.setHex(0xffb277);
    renderer.toneMappingExposure = 1.0;
  } else if (night) {
    scene.background.setHex(0x0f1420);
    scene.fog.color.setHex(0x121a28);
    sun.color.setHex(0x93a8cc); sun.intensity = 0.28;
    hemi.color.setHex(0x4a5670); hemi.groundColor.setHex(0x2a2a33); hemi.intensity = 0.55;
    roomLight.intensity = 0.85; lampLight.intensity = 1.6;
    winGlow.intensity = 0.25; winGlow.color.setHex(0x8fa6c8);
    renderer.toneMappingExposure = 1.12;
  } else {
    scene.background.setHex(0xd8d2dc);
    scene.fog.color.setHex(0xd8d0d8);
    sun.color.setHex(0xffcfc0); sun.intensity = 1.0;
    hemi.color.setHex(0xf0e2ea); hemi.groundColor.setHex(0xcabfc4); hemi.intensity = 0.9;
    roomLight.intensity = 0.55; lampLight.intensity = 0.9;
    winGlow.intensity = 0.7; winGlow.color.setHex(0xffd6c8);
    renderer.toneMappingExposure = 1.02;
  }
  if (nightGroup) nightGroup.visible = night;
  if (cityMats) cityMats.forEach(function(m) { m.emissiveIntensity = night ? 0.85 : 0; });
  if (lampShadeMat) lampShadeMat.emissiveIntensity = (night || sunset) ? 0.95 : 0.35;
  var b = document.getElementById('btn-time');
  if (b) b.textContent = timeLabels[timeMode];
}
function cycleTime() {
  var order = ['auto', 'day', 'sunset', 'night'];
  timeMode = order[(order.indexOf(timeMode) + 1) % order.length];
  applyTime();
  sfx('open');
}
