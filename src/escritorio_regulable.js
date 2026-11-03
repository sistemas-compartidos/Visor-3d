import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { catalog, defaultClient } from "./catalog.js";
import { responsiveCamera } from "./responsive-camera.js";
import { createEdgeMaterial, createHighlightMaterial, createWoodMaterial, VIEWER_COLORS } from "./viewer-palette.js";
import "./styles.css";

const route = new URLSearchParams(location.search);
const slug = "escritorio-regulable";
const pieces = { lateral: "Laterales", tapa: "Tapa regulable", fondo: "Fondo", travesano: "Travesaño", traba: "Trabas de regulación" };
const T = 18.5;

function showCatalog() {
  const clientList = document.getElementById("clientList"), furnitureList = document.getElementById("furnitureList");
  const clientStep = document.getElementById("clientStep"), furnitureStep = document.getElementById("furnitureStep");
  let activeClient = route.get("cliente") || null;
  const clients = () => clientList.replaceChildren(...Object.entries(catalog).map(([id, client]) => {
    const b = document.createElement("button"); b.className = "catalog-card"; b.type = "button";
    b.innerHTML = `<span class="card-label">CLIENTE</span><strong>${client.name}</strong><small>${client.client} · ${client.description}</small><span class="card-action">Ver muebles →</span>`;
    b.onclick = () => { activeClient = id; furniture(); }; return b;
  }));
  const furniture = () => { const client = catalog[activeClient]; if (!client) return; clientStep.hidden = true; furnitureStep.hidden = false;
    document.getElementById("selectedClientName").textContent = `${client.name} · ${client.client}`;
    furnitureList.replaceChildren(...Object.entries(client.furniture).map(([id, item]) => { const b = document.createElement("button");
      b.className = "catalog-card furniture-card"; b.type = "button";
      b.innerHTML = `<span class="card-label">MUEBLE</span><strong>${item.name}</strong><small>${item.description}</small><span class="card-action">Abrir visor 3D →</span>`;
      b.onclick = () => location.href = `?cliente=${encodeURIComponent(activeClient)}&mueble=${encodeURIComponent(id)}`; return b; })); };
  document.getElementById("backToClients").onclick = () => { activeClient = null; furnitureStep.hidden = true; clientStep.hidden = false; history.replaceState({}, "", location.pathname); };
  clients(); if (activeClient && catalog[activeClient]) furniture();
}

function startViewer() {
  document.getElementById("catalogApp").hidden = true; document.getElementById("viewerApp").hidden = false;
  document.getElementById("clientName").textContent = "PICKY KIDS · GUÍA DE ARMADO 3D";
  document.getElementById("productName").textContent = "Escritorio Regulable";
  document.getElementById("sceneName").textContent = "Tapa regulable en seis alturas";
  document.getElementById("homeButton").onclick = () => location.href = `?cliente=${encodeURIComponent(route.get("cliente") || defaultClient)}`;
  const select = document.getElementById("pieceSelect");
  select.replaceChildren(...Object.entries(pieces).map(([value, label]) => { const o = document.createElement("option"); o.value = value; o.textContent = label; return o; }));

  const canvas = document.getElementById("viewer"), renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xe9eee9, 130, 225);
  const camera = new THREE.PerspectiveCamera(30, 1, .05, 260), controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = .07; controls.maxPolarAngle = Math.PI * .72;
  const framing = responsiveCamera(camera, controls, canvas, 1.17);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x65726b, 2.35));
  const light = new THREE.DirectionalLight(0xffffff, 3.25); light.position.set(10, 16, 13); light.castShadow = true; light.shadow.mapSize.set(2048, 2048); scene.add(light);
  const wood = createWoodMaterial(), selected = createHighlightMaterial(), edgeMat = createEdgeMaterial();
  wood.side = THREE.DoubleSide; selected.side = THREE.DoubleSide;
  const dowel = new THREE.MeshStandardMaterial({ color: VIEWER_COLORS.dowel, roughness: .45 });
  const hardware = new THREE.MeshStandardMaterial({ color: VIEWER_COLORS.hardware, roughness: .35, metalness: .18 });
  const root = new THREE.Group(); root.scale.setScalar(.01); root.position.y = -.02; scene.add(root);
  const parts = [], markers = [];

  function sideGeometry(curveAtLeft = false) {
    const s = new THREE.Shape();
    s.moveTo(-240, -430); s.lineTo(240, -430);
    if (curveAtLeft) {
      s.lineTo(240, 430); s.lineTo(-215, 430);
      s.quadraticCurveTo(-240, 430, -240, 405); s.lineTo(-240, -430);
    } else {
      s.lineTo(240, 405); s.quadraticCurveTo(240, 430, 215, 430);
      s.lineTo(-240, 430); s.lineTo(-240, -430);
    }
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false, curveSegments: 12 });
    g.translate(0, 0, -T/2); g.computeVertexNormals(); return g;
  }
  function boxGeometry(w, h, d) { return new THREE.BoxGeometry(w, h, d); }
  function addPart(type, geometry, pos, explode, rot = [0,0,0]) {
    const group = new THREE.Group(), mesh = new THREE.Mesh(geometry, wood);
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.partType = type;
    group.add(mesh); group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 25), edgeMat));
    group.position.set(...pos); group.rotation.set(...rot);
    group.userData = { base: new THREE.Vector3(...pos), explode: new THREE.Vector3(...explode), partType: type };
    root.add(group); parts.push({ group, mesh, type }); return group;
  }
  function dot(parent, x, y, z, diameter = 8, axis = "z") {
    const mat = diameter <= 8 ? dowel : hardware;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(Math.max(diameter/2, 2.8), Math.max(diameter/2, 2.8), 2.2, 20), mat);
    m.position.set(x, y, z); if (axis === "z") m.rotation.x = Math.PI/2; if (axis === "x") m.rotation.z = Math.PI/2;
    m.visible = false; m.userData.partType = parent.userData.partType; parent.add(m); markers.push(m);
  }

  const sideX = 480 + T/2;
  // Ambos perfiles tienen la curva hacia el frente (+Z). El izquierdo debe
  // espejarse antes de girarlo para que no quede mirando hacia el fondo.
  const left = addPart("lateral", sideGeometry(true), [-sideX, 430, 0], [-190, 0, 0], [0, Math.PI/2, 0]);
  const right = addPart("lateral", sideGeometry(), [sideX, 430, 0], [190, 0, 0], [0, -Math.PI/2, 0]);
  const railHeights = [480, 540, 600, 660, 720, 780];
  const railZ = -31.5;
  const sideLocalX = (side, worldZ) => side === left ? -worldZ : worldZ;
  for (const side of [left, right]) {
    // Tras ambos giros, +Z local es siempre la cara interior del lateral.
    const inner = T/2 + .9;
    for (const y of railHeights) for (const worldZ of [-126.5, 63.5]) {
      dot(side, sideLocalX(side, worldZ), y-430, inner, 6);
    }
    // Fondo en el canto posterior recto y travesaño horizontal bajo la guía inferior.
    for (const [y,worldZ,d] of [[490,-230.75,8],[650,-230.75,8],[810,-230.75,8],
                                [449,-183.25,8],[449,-138.25,5]]) {
      dot(side, sideLocalX(side, worldZ), y-430, inner, d);
    }
  }

  const back = addPart("fondo", boxGeometry(960, 420, T), [0, 650, -230.75], [0, 70, -190]);
  for (const y of [490,650,810]) { dot(back, -480, y-650, 0, 8, "x"); dot(back, 480, y-650, 0, 8, "x"); }
  for (const x of [-446,446]) for (const y of [-128,128]) dot(back, x, y, T/2+.9, 15);
  for (const x of [-430,-64,430,64]) dot(back, x, 210, 0, 8, "y");

  // Travesaño horizontal 960 x 150: su cara superior queda bajo la guía de
  // Y=480. Los agujeros de canto en Z=-183,25/-138,25 coinciden con el lateral.
  const cross = addPart("travesano", boxGeometry(960, T, 150), [0, 449, -145.75], [0, -95, -145]);
  for (const [x,z] of [[-446,7.5],[0,-41],[398,-41],[446,7.5]]) dot(cross, x, T/2+.9, z, 15, "y");
  for (const x of [-430,-64,64,430]) dot(cross, x, 0, -75, 8, "z");
  for (const x of [-480,480]) {
    dot(cross, x, 0, -37.5, 8, "x");
    dot(cross, x, 0, 7.5, 5, "x");
  }

  // La tapa está apoyada sobre la guía intermedia de Y=600, no atravesándola.
  const top = addPart("tapa", boxGeometry(955, T, 400), [0, 629.25, railZ], [0, 145, 105]);

  for (const x of [-470.75, 470.75]) for (let i=0; i<6; i++) {
    const y = railHeights[i], dz = i < 3 ? -55 : 55;
    const rail = addPart("traba", boxGeometry(T, 40, 380), [x, y, railZ], [x < 0 ? -145 : 145, (i-2.5)*18, dz]);
    const end = x < 0 ? T/2+.9 : -(T/2+.9);
    for (const z of [-95,95]) dot(rail, end, 0, z, 6, "x");
  }

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 18), new THREE.MeshStandardMaterial({ color: VIEWER_COLORS.floor, roughness: 1 }));
  ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);
  let active = route.get("pieza") || "lateral", amount = 0; if (!pieces[active]) active = "lateral"; select.value = active;
  function refresh() { for (const item of parts) item.mesh.material = item.type === active ? selected : wood; for (const m of markers) m.visible = amount > .001; }
  function explode(value) { amount = value; const eased = 1-Math.pow(1-value, 2); for (const { group } of parts) group.position.copy(group.userData.base).addScaledVector(group.userData.explode, eased); refresh(); }
  select.onchange = () => { active = select.value; refresh(); const url = new URL(location.href); url.searchParams.set("cliente", "picky-kids"); url.searchParams.set("mueble", slug); url.searchParams.set("pieza", active); history.replaceState({}, "", url); };
  const slider = document.getElementById("explode"), button = document.getElementById("explodeButton"); slider.value = "0";
  slider.oninput = () => { const v=Number(slider.value); explode(v/100); button.textContent = v===100 ? "Ver armado completo" : "Ver despiece completo"; };
  button.onclick = () => { slider.value = slider.value === "100" ? "0" : "100"; explode(Number(slider.value)/100); button.textContent = slider.value === "100" ? "Ver armado completo" : "Ver despiece completo"; };
  camera.position.set(15.5, 9.4, 20); controls.target.set(0, 4.7, 0); controls.minDistance = 5; controls.maxDistance = 120;
  refresh(); function resize() { renderer.setSize(canvas.clientWidth, canvas.clientHeight, false); framing.resize(); }
  new ResizeObserver(resize).observe(canvas); resize();
  function animate() { requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); } animate();
  document.getElementById("loading").classList.add("ready");
}

if (route.has("mueble") || route.has("pieza") || route.has("p")) startViewer(); else showCatalog();
