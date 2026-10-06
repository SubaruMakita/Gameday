import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ==========================================
// 0. DOM 元素初始化
// ==========================================
const sbPanel = document.getElementById('scoreboard-panel');
const sbTitleEl = document.getElementById('sb-title-el');
const sbVenueEl = document.getElementById('sb-venue-el');
const sbHeaderRow = document.getElementById('sb-header-row');
const awayRow = document.getElementById('away-row');
const homeRow = document.getElementById('home-row');
const awayInput = document.getElementById('team-away-btn');
const homeInput = document.getElementById('team-home-btn');
const cardEl = document.getElementById('player-card');
const pNameEl = document.getElementById('p-name');
const pPosEl = document.getElementById('p-pos');
const pOrderEl = document.getElementById('p-order');
const pNoEl = document.getElementById('p-no');
const statsContainer = document.getElementById('stats-container');

sbPanel.addEventListener('pointerdown', (e) => e.stopPropagation());
sbPanel.addEventListener('wheel', (e) => e.stopPropagation());

function calculateRowRuns(rowId, totalInputId) {
  const row = document.getElementById(rowId);
  const inningInputs = row.querySelectorAll('.inning-score');
  let total = 0;
  inningInputs.forEach((input) => {
    const val = parseInt(input.value.trim(), 10);
    if (!isNaN(val)) total += val;
  });
  document.getElementById(totalInputId).value = total;
}

// ==========================================
// BSO 狀態控制函式 (完全依據 JSON 數據設定)
// ==========================================
function clearBallsAndStrikes() {
  document.querySelectorAll('#bso-balls .dot').forEach((dot) => {
    dot.classList.remove('ball-on');
  });
  document.querySelectorAll('#bso-strikes .dot').forEach((dot) => {
    dot.classList.remove('strike-on');
  });
}

function clearAllBSODots() {
  clearBallsAndStrikes();
  document.querySelectorAll('#bso-outs .dot').forEach((dot) => {
    dot.classList.remove('out-on');
  });
}

function applyBSOFromJSON() {
  clearAllBSODots();
  const bso = appData.gameInfo?.bso;
  if (!bso) return;

  const ballDots = document.querySelectorAll('#bso-balls .dot');
  for (let i = 0; i < (bso.balls || 0) && i < ballDots.length; i++) {
    ballDots[i].classList.add('ball-on');
  }

  const strikeDots = document.querySelectorAll('#bso-strikes .dot');
  for (let i = 0; i < (bso.strikes || 0) && i < strikeDots.length; i++) {
    strikeDots[i].classList.add('strike-on');
  }

  const outDots = document.querySelectorAll('#bso-outs .dot');
  for (let i = 0; i < (bso.outs || 0) && i < outDots.length; i++) {
    outDots[i].classList.add('out-on');
  }
}

document.querySelectorAll('#bso-balls .dot').forEach((dot) => {
  dot.addEventListener('click', () => dot.classList.toggle('ball-on'));
});
document.querySelectorAll('#bso-strikes .dot').forEach((dot) => {
  dot.addEventListener('click', () => dot.classList.toggle('strike-on'));
});
document.querySelectorAll('#bso-outs .dot').forEach((dot) => {
  dot.addEventListener('click', () => {
    dot.classList.toggle('out-on');
    clearBallsAndStrikes();
  });
});

// ==========================================
// 1. Three.js 場景與相機
// ==========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111419);

const camera = new THREE.PerspectiveCamera(
  11,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(-5.6, 3.0, 1.8);
//camera.position.set(-1.8, 3.0, 5.6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('canvas-container').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0.95, 0.05, -0.95);
controls.update();

// ==========================================
// 2. 光源配置
// ==========================================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
scene.add(ambientLight);

const dirLight1 = new THREE.DirectionalLight(0xfff5e6, 1.25);
dirLight1.position.set(6, 10, 8);
dirLight1.castShadow = true;
dirLight1.shadow.mapSize.width = 2048;
dirLight1.shadow.mapSize.height = 2048;
scene.add(dirLight1);

const dirLight2 = new THREE.DirectionalLight(0x7688a2, 0.55);
dirLight2.position.set(-5, 4, -5);
scene.add(dirLight2);

// ==========================================
// 3. 球場幾何與圖元
// ==========================================
const outerRadius = 2.8;
const innerRadius = outerRadius * 0.5;
const squareSize = innerRadius * (3 / 5);

const height1 = 0.02;
const height2 = 0.005;
const height3 = 0.005;

const grassGreenMaterial = new THREE.MeshStandardMaterial({
  color: 0x2e7d32,
  roughness: 0.5,
  metalness: 0.05,
});

const brownMaterial = new THREE.MeshStandardMaterial({
  color: 0xa0522d,
  roughness: 0.65,
  metalness: 0.05,
});

function createSectorExtrudeGeometry(radius, depth) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(radius, 0);
  shape.absarc(0, 0, radius, 0, Math.PI / 2, false);
  shape.lineTo(0, 0);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: depth,
    bevelEnabled: false,
    curveSegments: 64,
  });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

const outerGeo = createSectorExtrudeGeometry(outerRadius, height1);
const outerMesh = new THREE.Mesh(outerGeo, grassGreenMaterial);
outerMesh.castShadow = true;
outerMesh.receiveShadow = true;
scene.add(outerMesh);

const innerGeo = createSectorExtrudeGeometry(innerRadius, height2);
const innerMesh = new THREE.Mesh(innerGeo, brownMaterial);
innerMesh.position.y = height1;
innerMesh.castShadow = true;
innerMesh.receiveShadow = true;
scene.add(innerMesh);

const boxGeo = new THREE.BoxGeometry(squareSize, height3, squareSize);
boxGeo.translate(squareSize / 2, height3 / 2, -squareSize / 2);
const boxMesh = new THREE.Mesh(boxGeo, grassGreenMaterial);
boxMesh.position.set(0, height1 + height2, 0);
boxMesh.castShadow = true;
boxMesh.receiveShadow = true;
scene.add(boxMesh);

const baseTopY = height1 + height2 + height3;
const infieldDirtY = height1 + height2;
const outfieldY = height1;
const L = squareSize;

const whiteMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.25,
  metalness: 0.1,
});

const linesBasesGroup = new THREE.Group();
const lineWidth = 0.012;
const lineThickness = 0.002;

const homeDirtRadius = 0.19;
const homeDirtCircle = new THREE.Mesh(
  new THREE.CylinderGeometry(homeDirtRadius, homeDirtRadius, 0.002, 48),
  brownMaterial,
);
homeDirtCircle.position.set(0.045, baseTopY + 0.001, -0.045);
linesBasesGroup.add(homeDirtCircle);

const pitcherDirtRadius = homeDirtRadius / 2;
const pitcherDirtCircle = new THREE.Mesh(
  new THREE.CylinderGeometry(pitcherDirtRadius, pitcherDirtRadius, 0.002, 40),
  brownMaterial,
);
pitcherDirtCircle.position.set(L * 0.52, baseTopY + 0.001, -L * 0.52);
linesBasesGroup.add(pitcherDirtCircle);

const lineStartCutOffset = 0.082;
const innerLineLen = L - lineStartCutOffset;

const line1BInner = new THREE.Mesh(
  new THREE.BoxGeometry(innerLineLen, lineThickness, lineWidth),
  whiteMat,
);
line1BInner.position.set(
  lineStartCutOffset + innerLineLen / 2,
  baseTopY + lineThickness / 2,
  0,
);
linesBasesGroup.add(line1BInner);

const line1BOuter = new THREE.Mesh(
  new THREE.BoxGeometry(outerRadius - L, lineThickness, lineWidth),
  whiteMat,
);
line1BOuter.position.set(
  L + (outerRadius - L) / 2,
  outfieldY + lineThickness / 2,
  0,
);
linesBasesGroup.add(line1BOuter);

const line3BInner = new THREE.Mesh(
  new THREE.BoxGeometry(lineWidth, lineThickness, innerLineLen),
  whiteMat,
);
line3BInner.position.set(
  0,
  baseTopY + lineThickness / 2,
  -(lineStartCutOffset + innerLineLen / 2),
);
linesBasesGroup.add(line3BInner);

const line3BOuter = new THREE.Mesh(
  new THREE.BoxGeometry(lineWidth, lineThickness, outerRadius - L),
  whiteMat,
);
line3BOuter.position.set(
  0,
  outfieldY + lineThickness / 2,
  -(L + (outerRadius - L) / 2),
);
linesBasesGroup.add(line3BOuter);

const line1Bto2B = new THREE.Mesh(
  new THREE.BoxGeometry(lineWidth, lineThickness, L),
  whiteMat,
);
line1Bto2B.position.set(L, baseTopY + lineThickness / 2, -L / 2);
linesBasesGroup.add(line1Bto2B);

const line3Bto2B = new THREE.Mesh(
  new THREE.BoxGeometry(L, lineThickness, lineWidth),
  whiteMat,
);
line3Bto2B.position.set(L / 2, baseTopY + lineThickness / 2, -L);
linesBasesGroup.add(line3Bto2B);

const baseBagSize = 0.045;
const baseBagHeight = 0.01;
const baseBagGeo = new THREE.BoxGeometry(
  baseBagSize,
  baseBagHeight,
  baseBagSize,
);

const clickableBases = [];

function createInteractiveBase(baseIndex, name, posX, posZ) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.25,
    metalness: 0.1,
  });
  const baseMesh = new THREE.Mesh(baseBagGeo, mat);
  baseMesh.position.set(posX, baseTopY + baseBagHeight / 2, posZ);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  baseMesh.userData = {
    isBase: true,
    baseIndex: baseIndex,
    baseName: name,
    isOccupied: false,
    runnerMesh: null,
  };
  clickableBases.push(baseMesh);
  linesBasesGroup.add(baseMesh);
  return baseMesh;
}

const base1B = createInteractiveBase(
  1,
  '一壘',
  L - baseBagSize / 2,
  -baseBagSize / 2,
);
const base2B = createInteractiveBase(2, '二壘', L, -L);
const base3B = createInteractiveBase(
  3,
  '三壘',
  baseBagSize / 2,
  -L + baseBagSize / 2,
);

const pitcherPlate = new THREE.Mesh(
  new THREE.BoxGeometry(0.045, 0.005, 0.014),
  whiteMat,
);
pitcherPlate.position.set(L * 0.52, baseTopY + 0.0035, -L * 0.52);
pitcherPlate.rotation.y = Math.PI / 4;
linesBasesGroup.add(pitcherPlate);

const homeAreaGroup = new THREE.Group();
homeAreaGroup.position.set(0.035, baseTopY + 0.002, -0.035);
homeAreaGroup.rotation.y = (3 * Math.PI) / 4;

const hpW = 0.038;
const hpShape = new THREE.Shape();
hpShape.moveTo(-hpW / 2, -hpW * 0.2);
hpShape.lineTo(hpW / 2, -hpW * 0.2);
hpShape.lineTo(hpW / 2, hpW * 0.35);
hpShape.lineTo(0, hpW * 0.85);
hpShape.lineTo(-hpW / 2, hpW * 0.35);
hpShape.closePath();

const homePlateGeo = new THREE.ExtrudeGeometry(hpShape, {
  depth: 0.005,
  bevelEnabled: false,
});
homePlateGeo.rotateX(-Math.PI / 2);
const homePlateMesh = new THREE.Mesh(homePlateGeo, whiteMat);
homePlateMesh.position.set(0, 0.001, 0);
homeAreaGroup.add(homePlateMesh);

function createBoxFrame(w, len, borderW) {
  const g = new THREE.Group();
  const bH = 0.002;
  const l1 = new THREE.Mesh(new THREE.BoxGeometry(borderW, bH, len), whiteMat);
  l1.position.set(-w / 2 + borderW / 2, bH / 2, 0);
  const l2 = new THREE.Mesh(new THREE.BoxGeometry(borderW, bH, len), whiteMat);
  l2.position.set(w / 2 - borderW / 2, bH / 2, 0);
  const s1 = new THREE.Mesh(new THREE.BoxGeometry(w, bH, borderW), whiteMat);
  s1.position.set(0, bH / 2, -len / 2 + borderW / 2);
  const s2 = new THREE.Mesh(new THREE.BoxGeometry(w, bH, borderW), whiteMat);
  s2.position.set(0, bH / 2, len / 2 - borderW / 2);
  g.add(l1, l2, s1, s2);
  return g;
}

const clickableBoxes = [];
const boxW = 0.046;
const boxLen = 0.088;

function createInteractiveBatterBox(side, posX, posZ) {
  const boxFrame = createBoxFrame(boxW, boxLen, 0.004);
  boxFrame.position.set(posX, 0, posZ);

  const hitPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(boxW, boxLen),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hitPlane.rotation.x = -Math.PI / 2;
  hitPlane.position.set(0, 0.002, 0);

  hitPlane.userData = {
    isBatterBox: true,
    side: side,
    isOccupied: false,
    batterMesh: null,
    frameGroup: boxFrame,
  };

  boxFrame.add(hitPlane);
  clickableBoxes.push(hitPlane);
  homeAreaGroup.add(boxFrame);
  return hitPlane;
}

// 右打站在打擊區左側 (left)，左打站在打擊區右側 (right)
const leftBatterHitbox = createInteractiveBatterBox('left', 0.038, 0.005);
const rightBatterHitbox = createInteractiveBatterBox('right', -0.038, 0.005);

linesBasesGroup.add(homeAreaGroup);
scene.add(linesBasesGroup);

const wallGroup = new THREE.Group();
const wallHeight = 0.16;
const wallThick = 0.04;

const wallMat = new THREE.MeshStandardMaterial({
  color: 0x0f1828,
  roughness: 0.35,
  metalness: 0.2,
});
const yellowLineMat = new THREE.MeshStandardMaterial({
  color: 0xffd600,
  roughness: 0.3,
  metalness: 0.2,
});

const wallShape = new THREE.Shape();
wallShape.absarc(0, 0, outerRadius + wallThick, 0, Math.PI / 2, false);
wallShape.lineTo(0, outerRadius);
wallShape.absarc(0, 0, outerRadius, Math.PI / 2, 0, true);
wallShape.closePath();

const wallExtrudeGeo = new THREE.ExtrudeGeometry(wallShape, {
  depth: wallHeight,
  bevelEnabled: false,
  curveSegments: 64,
});
wallExtrudeGeo.rotateX(-Math.PI / 2);
const wallMesh = new THREE.Mesh(wallExtrudeGeo, wallMat);
wallMesh.position.y = outfieldY;
wallGroup.add(wallMesh);

const wallTopLineGeo = new THREE.ExtrudeGeometry(wallShape, {
  depth: 0.008,
  bevelEnabled: false,
  curveSegments: 64,
});
wallTopLineGeo.rotateX(-Math.PI / 2);
const wallTopLineMesh = new THREE.Mesh(wallTopLineGeo, yellowLineMat);
wallTopLineMesh.position.y = outfieldY + wallHeight + 0.001;
wallGroup.add(wallTopLineMesh);

function createRunAndRoarTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = 'bold 96px "Arial Black", Gadget, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#050a18';
  ctx.strokeText('味全龍總冠軍', canvas.width / 2, canvas.height / 2);
  ctx.fillStyle = '#ffeb3b';
  ctx.fillText('味全龍總冠軍', canvas.width / 2, canvas.height / 2);
  return new THREE.CanvasTexture(canvas);
}

const signMat = new THREE.MeshBasicMaterial({
  map: createRunAndRoarTexture(),
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false,
});

const geoRight = new THREE.CylinderGeometry(
  outerRadius - 0.005,
  outerRadius - 0.005,
  0.09,
  32,
  1,
  true,
  Math.PI + 0.1,
  0.22,
);
const meshRight = new THREE.Mesh(geoRight, signMat);
meshRight.position.set(0, outfieldY + wallHeight * 0.52, 0);
meshRight.scale.set(-1, 1, 1);
wallGroup.add(meshRight);

const geoLeft = new THREE.CylinderGeometry(
  outerRadius - 0.005,
  outerRadius - 0.005,
  0.09,
  32,
  1,
  true,
  Math.PI + 1.15,
  0.22,
);
const meshLeft = new THREE.Mesh(geoLeft, signMat);
meshLeft.position.set(0, outfieldY + wallHeight * 0.52, 0);
meshLeft.scale.set(-1, 1, 1);
wallGroup.add(meshLeft);

function createFoulPole() {
  const poleGroup = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.5, 16),
    yellowLineMat,
  );
  pole.position.y = 0.25;
  poleGroup.add(pole);

  const wing = new THREE.Mesh(
    new THREE.BoxGeometry(0.002, 0.35, 0.05),
    yellowLineMat,
  );
  wing.position.set(0, 0.275, 0.025);
  poleGroup.add(wing);
  return poleGroup;
}

const rightPole = createFoulPole();
rightPole.position.set(outerRadius + wallThick / 2, outfieldY, 0);
rightPole.rotation.y = -Math.PI;
wallGroup.add(rightPole);

const leftPole = createFoulPole();
leftPole.position.set(0, outfieldY, -(outerRadius + wallThick / 2));
leftPole.rotation.y = Math.PI / 2;
wallGroup.add(leftPole);

scene.add(wallGroup);

// ==========================================
// 6. 全域資料庫與公仔生成器
// ==========================================
let appData = {
  gameInfo: {},
  teams: {},
  rosters: {},
};

const skinMat = new THREE.MeshStandardMaterial({
  color: 0xffdfba,
  roughness: 0.5,
});
const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
const gloveMat = new THREE.MeshStandardMaterial({
  color: 0xa0522d,
  roughness: 0.7,
});
const batMat = new THREE.MeshStandardMaterial({
  color: 0xdeb887,
  roughness: 0.3,
});

const teamMaterials = {};

function getTeamStyles(teamKey) {
  const t = appData.teams[teamKey] || {
    name: teamKey,
    themeColor: '#ffffff',
    cardSubColor: '#cccccc',
    capColor: '#333333',
    jerseyColor: '#555555',
    pantsColor: '#ffffff',
  };

  if (!teamMaterials[teamKey]) {
    teamMaterials[teamKey] = {
      name: t.name,
      themeColor: t.themeColor,
      cardSubColor: t.cardSubColor,
      capMat: new THREE.MeshStandardMaterial({
        color: new THREE.Color(t.capColor),
        roughness: 0.35,
      }),
      jerseyMat: new THREE.MeshStandardMaterial({
        color: new THREE.Color(t.jerseyColor),
        roughness: 0.4,
      }),
      pantsMat: new THREE.MeshStandardMaterial({
        color: new THREE.Color(t.pantsColor),
        roughness: 0.5,
      }),
    };
  }
  return teamMaterials[teamKey];
}

function getPositionCoords(posCode) {
  const coordsMap = {
    P: { x: L * 0.52, y: baseTopY + 0.002, z: -L * 0.52 },
    C: { x: -0.06, y: baseTopY + 0.002, z: 0.06 },
    '1B': { x: 1.05, y: infieldDirtY, z: -0.15 },
    '2B': { x: L * 1.15, y: infieldDirtY, z: -L * 0.68 },
    '3B': { x: 0.15, y: infieldDirtY, z: -1.05 },
    SS: { x: L * 0.68, y: infieldDirtY, z: -L * 1.15 },
    LF: { x: outerRadius * 0.2, y: outfieldY, z: -outerRadius * 0.76 },
    CF: { x: outerRadius * 0.55, y: outfieldY, z: -outerRadius * 0.55 },
    RF: { x: outerRadius * 0.76, y: outfieldY, z: -outerRadius * 0.2 },
    DH: { x: -0.28, y: 0, z: -1.08 },
  };
  return coordsMap[posCode] || { x: 0, y: 0, z: 0 };
}

function createPlayerNameSprite(name) {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.font =
    'bold 44px "PingFang TC", "Microsoft JhengHei", "Noto Sans TC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.lineWidth = 9;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#05080f';
  ctx.strokeText(name, canvas.width / 2, canvas.height / 2);

  ctx.fillStyle = '#ffffff';
  ctx.fillText(name, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });

  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(0.36, 0.09, 1.0);
  sprite.position.set(0, 0.175, 0);
  return sprite;
}

function createBaseballFigure(
  role = 'fielder',
  name = '',
  teamKey = 'wdragons',
  bats = 'R',
) {
  const style = getTeamStyles(teamKey);
  const figure = new THREE.Group();

  const bodyGeo = new THREE.CylinderGeometry(0.024, 0.032, 0.045, 16);
  const body = new THREE.Mesh(bodyGeo, style.jerseyMat);
  body.position.y = 0.038;
  body.castShadow = true;
  figure.add(body);

  const pantsGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.016, 16);
  const pants = new THREE.Mesh(pantsGeo, style.pantsMat);
  pants.position.y = 0.008;
  pants.castShadow = true;
  figure.add(pants);

  const headGeo = new THREE.SphereGeometry(0.038, 20, 16);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 0.082;
  head.castShadow = true;
  figure.add(head);

  const capTopGeo = new THREE.SphereGeometry(
    0.04,
    20,
    12,
    0,
    Math.PI * 2,
    0,
    Math.PI * 0.5,
  );
  const capTop = new THREE.Mesh(capTopGeo, style.capMat);
  capTop.position.y = 0.085;
  capTop.castShadow = true;
  figure.add(capTop);

  const visorGeo = new THREE.CylinderGeometry(
    0.038,
    0.044,
    0.005,
    16,
    1,
    false,
    0,
    Math.PI,
  );
  const visor = new THREE.Mesh(visorGeo, style.capMat);
  visor.position.set(0, 0.09, 0.022);
  visor.rotation.x = 0.15;
  visor.castShadow = true;
  figure.add(visor);

  const eyeGeo = new THREE.SphereGeometry(0.004, 8, 8);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(0.013, 0.082, 0.034);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(-0.013, 0.082, 0.034);
  figure.add(leftEye, rightEye);

  const armGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.03, 8);

  if (role === 'pitcher') {
    const lArm = new THREE.Mesh(armGeo, style.jerseyMat);
    lArm.position.set(0.022, 0.042, 0.018);
    lArm.rotation.set(0.8, -0.4, 0);

    const rArm = new THREE.Mesh(armGeo, style.jerseyMat);
    rArm.position.set(-0.022, 0.042, 0.018);
    rArm.rotation.set(0.8, 0.4, 0);
    figure.add(lArm, rArm);

    const ballGlove = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 12, 12),
      gloveMat,
    );
    ballGlove.position.set(0, 0.045, 0.032);
    figure.add(ballGlove);
  } else if (role === 'dh') {
    const isRightBat = bats === 'R';
    const batSide = isRightBat ? 1 : -1;

    const lArm = new THREE.Mesh(armGeo, style.jerseyMat);
    lArm.position.set(-0.028 * batSide, 0.042, 0.015);
    lArm.rotation.set(0.5, -0.3 * batSide, 0.3 * batSide);

    const rArm = new THREE.Mesh(armGeo, style.jerseyMat);
    rArm.position.set(0.028 * batSide, 0.042, 0.015);
    rArm.rotation.set(0.5, 0.3 * batSide, -0.3 * batSide);
    figure.add(lArm, rArm);

    const batGeo = new THREE.CylinderGeometry(0.012, 0.004, 0.12, 12);
    batGeo.translate(0, 0.045, 0);
    const bat = new THREE.Mesh(batGeo, batMat);
    bat.position.set(0.01 * batSide, 0.042, 0.02);
    bat.rotation.set(-0.35, -0.15 * batSide, -0.45 * batSide);
    figure.add(bat);
  } else if (role === 'runner') {
    const lArm = new THREE.Mesh(armGeo, style.jerseyMat);
    lArm.position.set(0.024, 0.042, 0.015);
    lArm.rotation.set(0.4, 0, -0.2);

    const rArm = new THREE.Mesh(armGeo, style.jerseyMat);
    rArm.position.set(-0.024, 0.042, 0.015);
    rArm.rotation.set(0.4, 0, 0.2);
    figure.add(lArm, rArm);
  } else {
    const leftArm = new THREE.Mesh(armGeo, style.jerseyMat);
    leftArm.position.set(0.03, 0.045, 0.015);
    leftArm.rotation.set(0.6, 0.2, -0.4);
    figure.add(leftArm);

    const gloveGroup = new THREE.Group();
    const palm = new THREE.Mesh(
      new THREE.SphereGeometry(0.016, 12, 12),
      gloveMat,
    );
    palm.scale.set(1.1, 1.2, 0.7);
    gloveGroup.add(palm);
    gloveGroup.position.set(0.042, 0.05, 0.03);
    gloveGroup.rotation.y = -0.4;
    figure.add(gloveGroup);

    const rightArm = new THREE.Mesh(armGeo, style.jerseyMat);
    rightArm.position.set(-0.03, 0.04, 0.005);
    rightArm.rotation.set(0.2, 0, 0.3);
    figure.add(rightArm);
  }

  if (name) {
    const nameSprite = createPlayerNameSprite(name);
    figure.add(nameSprite);
  }

  return figure;
}

// ==========================================
// 7. 球員群組動態切換與自動抓取 situation 實作
// ==========================================
const playersGroup = new THREE.Group();
scene.add(playersGroup);

let currentFieldTeam = 'wdragons';
const homePlate = new THREE.Vector3(0, 0, 0);
let hoveredFigure = null;

function clearRunners() {
  clickableBases.forEach((base) => {
    if (base.userData.runnerMesh) {
      playersGroup.remove(base.userData.runnerMesh);
      base.userData.runnerMesh = null;
    }
    base.userData.isOccupied = false;
  });
}

function clearBatters() {
  clickableBoxes.forEach((box) => {
    if (box.userData.batterMesh) {
      playersGroup.remove(box.userData.batterMesh);
      box.userData.batterMesh = null;
    }
    box.userData.isOccupied = false;
  });
}

function getSituationPlayer(targetKey) {
  const { awayTeamKey, homeTeamKey, situation } = appData.gameInfo;
  const isAwayAttacking = currentFieldTeam === homeTeamKey;
  const oppTeamKey = isAwayAttacking ? awayTeamKey : homeTeamKey;
  const oppRoster = appData.rosters[oppTeamKey] || [];

  const sitConfig = situation
    ? isAwayAttacking
      ? situation.awayAttacking
      : situation.homeAttacking
    : null;

  let playerIdentifier = sitConfig ? sitConfig[targetKey] : null;

  let foundPlayer = oppRoster.find(
    (p) => p.name === playerIdentifier || p.no === String(playerIdentifier),
  );

  if (!foundPlayer && playerIdentifier) {
    if (targetKey === 'batter') {
      foundPlayer = oppRoster.find((p) => p.role === 'dh') || oppRoster[2];
    } else if (targetKey === 'base1') {
      foundPlayer = oppRoster[0] || oppRoster[1];
    } else if (targetKey === 'base2') {
      foundPlayer = oppRoster[1] || oppRoster[3];
    } else if (targetKey === 'base3') {
      foundPlayer = oppRoster[2] || oppRoster[4];
    }
  }

  return {
    playerData: foundPlayer || null,
    teamKey: oppTeamKey,
    sitConfig: sitConfig,
  };
}

function applySituation() {
  const { awayTeamKey, homeTeamKey, situation } = appData.gameInfo;
  if (!situation) return;

  const isAwayAttacking = currentFieldTeam === homeTeamKey;
  const oppTeamKey = isAwayAttacking ? awayTeamKey : homeTeamKey;
  const sit = isAwayAttacking
    ? situation.awayAttacking
    : situation.homeAttacking;
  if (!sit) return;

  // 1. 自動站上打者
  if (sit.batter) {
    const { playerData: batterData } = getSituationPlayer('batter');
    if (batterData) {
      const isRightBat = (batterData.bats || 'R').toUpperCase() === 'R';
      const targetHitbox = isRightBat ? leftBatterHitbox : rightBatterHitbox;

      targetHitbox.userData.isOccupied = true;
      const batterFig = createBaseballFigure(
        'dh',
        batterData.name,
        oppTeamKey,
        batterData.bats || 'R',
      );

      const worldPos = new THREE.Vector3();
      targetHitbox.getWorldPosition(worldPos);

      batterFig.position.set(worldPos.x, baseTopY + 0.002, worldPos.z);
      batterFig.lookAt(L * 0.52, baseTopY + 0.002, -L * 0.52);

      //const sideLabel = isRightBat ? '打擊區左側 (右打)' : '打擊區右側 (左打)';
      const sideLabel = isRightBat ? '' : '';
      batterFig.userData = {
        //playerData: { ...batterData, posName: `打者 · ${sideLabel}` },
        playerData: { ...batterData, posName: '打者' },
        teamKey: oppTeamKey,
        targetScale: 1.0,
        isFigureRoot: true,
      };
      if (batterData.bats == 'R') {
        camera.position.set(-1.8, 3.0, 5.6);
      } else {
        camera.position.set(-5.6, 3.0, 1.8);
      }

      playersGroup.add(batterFig);
      targetHitbox.userData.batterMesh = batterFig;
    }
  }

  // 2. 自動站上一、二、三壘跑壘員
  [base1B, base2B, base3B].forEach((baseMesh) => {
    const baseKey = `base${baseMesh.userData.baseIndex}`;
    if (sit[baseKey]) {
      const { playerData: runnerData } = getSituationPlayer(baseKey);
      if (runnerData) {
        baseMesh.userData.isOccupied = true;
        const runnerFig = createBaseballFigure(
          'runner',
          runnerData.name,
          oppTeamKey,
          runnerData.bats || 'R',
        );

        const runnerY = baseTopY + baseBagHeight;
        runnerFig.position.set(
          baseMesh.position.x,
          runnerY,
          baseMesh.position.z,
        );

        if (baseMesh.userData.baseIndex === 1) {
          runnerFig.lookAt(base2B.position.x, runnerY, base2B.position.z);
        } else if (baseMesh.userData.baseIndex === 2) {
          runnerFig.lookAt(base3B.position.x, runnerY, base3B.position.z);
        } else {
          runnerFig.lookAt(homePlate.x, runnerY, homePlate.z);
        }

        runnerFig.userData = {
          playerData: {
            ...runnerData,
            posName: `${baseMesh.userData.baseName}跑壘員`,
          },
          teamKey: oppTeamKey,
          targetScale: 1.0,
          isFigureRoot: true,
        };

        playersGroup.add(runnerFig);
        baseMesh.userData.runnerMesh = runnerFig;
      }
    }
  });
}

function renderTeamFigures(teamKey) {
  currentFieldTeam = teamKey;

  while (playersGroup.children.length > 0) {
    playersGroup.remove(playersGroup.children[0]);
  }
  clearRunners();
  clearBatters();

  const rawRoster = appData.rosters[teamKey] || [];

  rawRoster.forEach((pData) => {
    const coords = getPositionCoords(pData.posCode);
    const posX = coords.x;
    const posY = coords.y;
    const posZ = coords.z;

    const fig = createBaseballFigure(
      pData.role,
      pData.name,
      teamKey,
      pData.bats || 'R',
    );
    fig.position.set(posX, posY, posZ);

    fig.userData = {
      playerData: pData,
      teamKey: teamKey,
      targetScale: 1.0,
      isFigureRoot: true,
    };

    if (pData.posName.includes('捕手')) {
      fig.lookAt(L * 0.52, posY, -L * 0.52);
    } else if (pData.role === 'dh') {
      fig.lookAt(0.15, posY, -1.05);
    } else {
      fig.lookAt(homePlate.x, posY, homePlate.z);
    }

    playersGroup.add(fig);
  });

  applySituation();

  if (cardEl) cardEl.style.display = 'none';
  hoveredFigure = null;
}

// ==========================================
// 8. 懸停偵測 (Raycaster) 與 互動
// ==========================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(-1000, -1000);

function updateCardContent(data, teamKey) {
  const style = getTeamStyles(teamKey);
  pNameEl.textContent = data.name;
  pNameEl.style.color = style.themeColor;
  pNoEl.textContent = `No. ${data.no}`;
  pNoEl.style.color = style.cardSubColor;

  const batText = data.bats ? ` (${data.bats === 'L' ? '左打' : '右打'})` : '';
  pPosEl.textContent = `${style.name} · ${data.posName}${batText}`;

  if (data.role === 'pitcher') {
    pOrderEl.style.display = 'none';
    const s = data.pitcherStats;
    statsContainer.innerHTML = `
            <div class="stat-item"><span class="stat-label">防禦率</span><span class="stat-value">${s.era}</span></div>
            <div class="stat-item"><span class="stat-label">WHIP</span><span class="stat-value">${s.whip}</span></div>
            <div class="stat-item"><span class="stat-label">勝投</span><span class="stat-value">${s.win}</span></div>
            <div class="stat-item"><span class="stat-label">敗投</span><span class="stat-value">${s.loss}</span></div>
            <div class="stat-item"><span class="stat-label">奪三振</span><span class="stat-value">${s.so}</span></div>
            <div class="stat-item"><span class="stat-label">四死球</span><span class="stat-value">${s.bb}</span></div>
          `;
  } else {
    pOrderEl.style.display = 'inline-block';
    pOrderEl.textContent = data.order;
    statsContainer.innerHTML = `
            <div class="stat-item"><span class="stat-label">打擊率</span><span class="stat-value">${data.avg}</span></div>
            <div class="stat-item"><span class="stat-label">全壘打</span><span class="stat-value">${data.hr}</span></div>
            <div class="stat-item"><span class="stat-label">打點</span><span class="stat-value">${data.rbi}</span></div>
            <div class="stat-item"><span class="stat-label">盜壘</span><span class="stat-value">${data.sb}</span></div>
          `;
  }
}

window.addEventListener('pointermove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  if (cardEl && cardEl.style.display === 'block') {
    let left = event.clientX + 16;
    let top = event.clientY + 16;
    const cardWidth = cardEl.offsetWidth || 250;
    const cardHeight = cardEl.offsetHeight || 180;

    if (left + cardWidth > window.innerWidth)
      left = event.clientX - cardWidth - 16;
    if (top + cardHeight > window.innerHeight)
      top = event.clientY - cardHeight - 16;

    cardEl.style.left = `${left}px`;
    cardEl.style.top = `${top}px`;
  }

  raycaster.setFromCamera(mouse, camera);

  const playerIntersects = raycaster.intersectObjects(
    playersGroup.children,
    true,
  );
  let currentHovered = null;
  if (playerIntersects.length > 0) {
    let obj = playerIntersects[0].object;
    while (obj && obj.parent && !obj.userData?.isFigureRoot) {
      obj = obj.parent;
    }
    if (obj && obj.userData?.isFigureRoot) {
      currentHovered = obj;
    }
  }

  const baseIntersects = raycaster.intersectObjects(clickableBases, false);
  const boxIntersects = raycaster.intersectObjects(clickableBoxes, false);

  if (currentHovered !== hoveredFigure) {
    if (hoveredFigure) {
      hoveredFigure.userData.targetScale = 1.0;
    }
    if (currentHovered) {
      currentHovered.userData.targetScale = 1.3;
      document.body.style.cursor = 'pointer';

      updateCardContent(
        currentHovered.userData.playerData,
        currentHovered.userData.teamKey,
      );
      cardEl.style.display = 'block';
      cardEl.style.left = `${event.clientX + 16}px`;
      cardEl.style.top = `${event.clientY + 16}px`;
    } else {
      if (baseIntersects.length === 0 && boxIntersects.length === 0) {
        document.body.style.cursor = 'default';
      }
      if (cardEl) cardEl.style.display = 'none';
    }
    hoveredFigure = currentHovered;
  }

  if (baseIntersects.length > 0 || boxIntersects.length > 0) {
    document.body.style.cursor = 'pointer';
  } else if (!hoveredFigure) {
    document.body.style.cursor = 'default';
  }
});

let downPos = { x: 0, y: 0 };
window.addEventListener('pointerdown', (e) => {
  downPos = { x: e.clientX, y: e.clientY };
});

window.addEventListener('pointerup', (event) => {
  const dist = Math.hypot(event.clientX - downPos.x, event.clientY - downPos.y);
  if (dist > 5) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // 點擊打擊區手動切換
  const boxHits = raycaster.intersectObjects(clickableBoxes, false);
  if (boxHits.length > 0) {
    const hitBox = boxHits[0].object;
    const isOcc = !hitBox.userData.isOccupied;

    clearBatters();

    if (isOcc) {
      hitBox.userData.isOccupied = true;
      const { playerData: batterData, teamKey: oppTeamKey } =
        getSituationPlayer('batter');

      if (batterData) {
        const batterFig = createBaseballFigure(
          'dh',
          batterData.name,
          oppTeamKey,
          batterData.bats || 'R',
        );
        const worldPos = new THREE.Vector3();
        hitBox.getWorldPosition(worldPos);

        batterFig.position.set(worldPos.x, baseTopY + 0.002, worldPos.z);
        batterFig.lookAt(L * 0.52, baseTopY + 0.002, -L * 0.52);

        const sideLabel =
          hitBox.userData.side === 'left'
            ? '' //'打擊區左側 (右打)'
            : ''; //'打擊區右側 (左打)';
        batterFig.userData = {
          playerData: { ...batterData, posName: `打者 · ${sideLabel}` },
          teamKey: oppTeamKey,
          targetScale: 1.0,
          isFigureRoot: true,
        };

        playersGroup.add(batterFig);
        hitBox.userData.batterMesh = batterFig;
      }
    } else {
      if (cardEl) cardEl.style.display = 'none';
      hoveredFigure = null;
    }
    return;
  }

  // 點擊壘包手動切換
  const hits = raycaster.intersectObjects(clickableBases, false);
  if (hits.length > 0) {
    const baseMesh = hits[0].object;
    const isOcc = !baseMesh.userData.isOccupied;
    baseMesh.userData.isOccupied = isOcc;

    if (isOcc) {
      const baseMapKey = `base${baseMesh.userData.baseIndex}`;
      const { playerData: runnerData, teamKey: oppTeamKey } =
        getSituationPlayer(baseMapKey);

      if (runnerData) {
        const runnerFig = createBaseballFigure(
          'runner',
          runnerData.name,
          oppTeamKey,
          runnerData.bats || 'R',
        );
        const runnerY = baseTopY + baseBagHeight;
        runnerFig.position.set(
          baseMesh.position.x,
          runnerY,
          baseMesh.position.z,
        );

        if (baseMesh.userData.baseIndex === 1) {
          runnerFig.lookAt(base2B.position.x, runnerY, base2B.position.z);
        } else if (baseMesh.userData.baseIndex === 2) {
          runnerFig.lookAt(base3B.position.x, runnerY, base3B.position.z);
        } else {
          runnerFig.lookAt(homePlate.x, runnerY, homePlate.z);
        }

        runnerFig.userData = {
          playerData: {
            ...runnerData,
            posName: `${baseMesh.userData.baseName}跑壘員`,
          },
          teamKey: oppTeamKey,
          targetScale: 1.0,
          isFigureRoot: true,
        };

        playersGroup.add(runnerFig);
        baseMesh.userData.runnerMesh = runnerFig;
      }
    } else {
      if (baseMesh.userData.runnerMesh) {
        playersGroup.remove(baseMesh.userData.runnerMesh);
        baseMesh.userData.runnerMesh = null;
      }
      if (cardEl) cardEl.style.display = 'none';
      hoveredFigure = null;
    }
  }
});

// ==========================================
// 9. 動畫循環
// ==========================================
function animate() {
  requestAnimationFrame(animate);

  playersGroup.children.forEach((fig) => {
    const target = fig.userData.targetScale || 1.0;
    fig.scale.lerp(new THREE.Vector3(target, target, target), 0.15);
  });

  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==========================================
// 10. 計分板動態局數建構與初始化
// ==========================================
function populateScoreboard(data) {
  const { gameInfo, teams } = data;
  const awayTeam = teams[gameInfo.awayTeamKey];
  const homeTeam = teams[gameInfo.homeTeamKey];

  if (gameInfo.title) sbTitleEl.textContent = gameInfo.title;
  if (gameInfo.venue) sbVenueEl.textContent = gameInfo.venue;

  awayInput.value = awayTeam.name;
  awayInput.style.color = awayTeam.themeColor;
  awayInput.title = `點擊切換為${homeTeam.name}先發公仔`;

  homeInput.value = homeTeam.name;
  homeInput.style.color = homeTeam.themeColor;
  homeInput.title = `點擊切換為${awayTeam.name}先發公仔`;

  // 依據 currentAttackingTeam 設定目前進攻方高亮標籤樣式
  const isAwayAttacking = (gameInfo.currentAttackingTeam || 'away') === 'away';
  if (isAwayAttacking) {
    awayInput.classList.add('active-team');
    homeInput.classList.remove('active-team');
  } else {
    homeInput.classList.add('active-team');
    awayInput.classList.remove('active-team');
  }

  const awayInningsData = gameInfo.awayScore?.innings || [];
  const homeInningsData = gameInfo.homeScore?.innings || [];
  const totalInnings = Math.max(
    9,
    awayInningsData.length,
    homeInningsData.length,
  );

  const oldThs = sbHeaderRow.querySelectorAll('th.dynamic-inning');
  oldThs.forEach((th) => th.remove());
  const summaryFirstTh = sbHeaderRow.querySelector('th.summary-col');

  for (let i = 1; i <= totalInnings; i++) {
    const th = document.createElement('th');
    th.className = 'dynamic-inning';
    th.textContent = i;
    sbHeaderRow.insertBefore(th, summaryFirstTh);
  }

  awayRow.querySelectorAll('td.dynamic-inning-td').forEach((td) => td.remove());
  const awaySummaryTd = awayRow.querySelector('td.summary-col');

  for (let i = 0; i < totalInnings; i++) {
    const td = document.createElement('td');
    td.className = 'dynamic-inning-td';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'score-input inning-score';
    input.maxLength = 3;
    input.value =
      awayInningsData[i] !== undefined && awayInningsData[i] !== null
        ? awayInningsData[i]
        : '';
    input.addEventListener('input', () =>
      calculateRowRuns('away-row', 'away-r'),
    );
    td.appendChild(input);
    awayRow.insertBefore(td, awaySummaryTd);
  }

  homeRow.querySelectorAll('td.dynamic-inning-td').forEach((td) => td.remove());
  const homeSummaryTd = homeRow.querySelector('td.summary-col');

  for (let i = 0; i < totalInnings; i++) {
    const td = document.createElement('td');
    td.className = 'dynamic-inning-td';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'score-input inning-score';
    input.maxLength = 3;
    input.value =
      homeInningsData[i] !== undefined && homeInningsData[i] !== null
        ? homeInningsData[i]
        : '';
    input.addEventListener('input', () =>
      calculateRowRuns('home-row', 'home-r'),
    );
    td.appendChild(input);
    homeRow.insertBefore(td, homeSummaryTd);
  }

  document.getElementById('away-h').value =
    gameInfo.awayScore?.h !== undefined ? gameInfo.awayScore.h : '0';
  document.getElementById('away-e').value =
    gameInfo.awayScore?.e !== undefined ? gameInfo.awayScore.e : '0';
  calculateRowRuns('away-row', 'away-r');

  document.getElementById('home-h').value =
    gameInfo.homeScore?.h !== undefined ? gameInfo.homeScore.h : '0';
  document.getElementById('home-e').value =
    gameInfo.homeScore?.e !== undefined ? gameInfo.homeScore.e : '0';
  calculateRowRuns('home-row', 'home-r');

  applyBSOFromJSON();

  // 手動點擊切換攻守隊伍
  awayInput.onclick = () => {
    awayInput.classList.add('active-team');
    homeInput.classList.remove('active-team');
    applyBSOFromJSON();
    renderTeamFigures(gameInfo.homeTeamKey);
  };

  homeInput.onclick = () => {
    homeInput.classList.add('active-team');
    awayInput.classList.remove('active-team');
    applyBSOFromJSON();
    renderTeamFigures(gameInfo.awayTeamKey);
  };
}

// 僅針對 situation (跑者/打者) 進行局部汰換，不重繪全場野手
function updateSituationDiff() {
  clearRunners();
  clearBatters();
  applySituation();
}

// ==========================================
// 11. 20 秒差量輪詢 (Polling)
// ==========================================
async function refreshGameData() {
  try {
    const res = await fetch(`./json/roster.json?t=${Date.now()}`);
    if (!res.ok) return;
    const newData = await res.json();

    const oldAttacking = appData.gameInfo?.currentAttackingTeam || 'away';
    const newAttacking = newData.gameInfo?.currentAttackingTeam || 'away';

    appData = newData;

    // 若進攻方變更（攻守交換）：更新計分板樣式並重新切換守備隊公仔
    if (newAttacking !== oldAttacking) {
      populateScoreboard(appData);
      const isAwayAttacking = newAttacking === 'away';
      const fieldTeamKey = isAwayAttacking
        ? appData.gameInfo.homeTeamKey
        : appData.gameInfo.awayTeamKey;
      renderTeamFigures(fieldTeamKey);
      return;
    }

    // 若進攻方未變：僅局部更新 DOM 比分、BSO 與壘包打者，不重新繪製全場
    const awayScores = appData.gameInfo.awayScore?.innings || [];
    const homeScores = appData.gameInfo.homeScore?.innings || [];
    const awayInputs = awayRow.querySelectorAll('.inning-score');
    const homeInputs = homeRow.querySelectorAll('.inning-score');

    awayScores.forEach((val, i) => {
      if (awayInputs[i] && awayInputs[i].value !== val)
        awayInputs[i].value = val;
    });
    homeScores.forEach((val, i) => {
      if (homeInputs[i] && homeInputs[i].value !== val)
        homeInputs[i].value = val;
    });

    document.getElementById('away-h').value =
      appData.gameInfo.awayScore?.h ?? '0';
    document.getElementById('away-e').value =
      appData.gameInfo.awayScore?.e ?? '0';
    document.getElementById('home-h').value =
      appData.gameInfo.homeScore?.h ?? '0';
    document.getElementById('home-e').value =
      appData.gameInfo.homeScore?.e ?? '0';

    calculateRowRuns('away-row', 'away-r');
    calculateRowRuns('home-row', 'home-r');

    applyBSOFromJSON();
    updateSituationDiff();
  } catch (err) {
    console.warn('輪詢更新暫時失敗，下個週期將自動重試', err);
  }
}

// 啟動 20 秒定時差量輪詢
const REFRESH_INTERVAL = 20000;
setInterval(refreshGameData, REFRESH_INTERVAL);

// ==========================================
// 12. 初始載入
// ==========================================
async function initApp() {
  try {
    const res = await fetch(`./json/roster.json?t=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP 狀態碼: ${res.status}`);
    appData = await res.json();

    populateScoreboard(appData);

    // 依據 JSON 的 currentAttackingTeam 決定守備方
    // currentAttackingTeam 為 away (客攻) -> 守備隊伍為 homeTeamKey (主守)
    // currentAttackingTeam 為 home (主攻) -> 守備隊伍為 awayTeamKey (客守)
    const isAwayAttacking =
      (appData.gameInfo.currentAttackingTeam || 'away') === 'away';
    const initFieldTeamKey = isAwayAttacking
      ? appData.gameInfo.homeTeamKey
      : appData.gameInfo.awayTeamKey;

    renderTeamFigures(initFieldTeamKey);
  } catch (err) {
    console.error('載入名冊與計分板 JSON 失敗：', err);
  }
}

initApp();
