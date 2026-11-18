import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import data from "./esc-reg-librero-data.json";
import { catalog, defaultClient } from "./catalog.js";
import { responsiveCamera } from "./responsive-camera.js";
import { createEdgeMaterial, createHighlightMaterial, createWoodMaterial, VIEWER_COLORS } from "./viewer-palette.js";
import "./styles.css";

const route = new URLSearchParams(location.search), slug = "esc-reg-librero";
const T = 18.5, W = 480, D = 149.5, H = 860, INNER = 443, BASE_D = 112.5;
const pieces = {
  "lateral-izquierdo": "Lateral izquierdo",
  "lateral-derecho": "Lateral derecho",
  "base-inferior": "Base inferior",
  "base-central": "Base central",
  "base-superior": "Base superior",
  "frente-inferior": "Frente inferior",
  "frente-central": "Frente central",
  "frente-superior": "Frente superior",
  fondo: "Fondo",
};
const programs = Object.fromEntries(Object.entries(data.programs).map(([name, value]) => [name.slice(12, 14), value]));

function showCatalog() {
  const clientList = document.getElementById("clientList"), furnitureList = document.getElementById("furnitureList"), clientStep = document.getElementById("clientStep"), furnitureStep = document.getElementById("furnitureStep");
  let activeClient = route.get("cliente") || null;
  const clients = () => clientList.replaceChildren(...Object.entries(catalog).map(([id, client]) => {
    const button = document.createElement("button"); button.className = "catalog-card"; button.type = "button";
    button.innerHTML = `<span class="card-label">CLIENTE</span><strong>${client.name}</strong><small>${client.client} · ${client.description}</small><span class="card-action">Ver muebles →</span>`;
    button.onclick = () => { activeClient = id; furniture(); }; return button;
  }));
  const furniture = () => {
    const client = catalog[activeClient]; if (!client) return; clientStep.hidden = true; furnitureStep.hidden = false;
    document.getElementById("selectedClientName").textContent = `${client.name} · ${client.client}`;
    furnitureList.replaceChildren(...Object.entries(client.furniture).map(([id, item]) => {
      const button = document.createElement("button"); button.className = "catalog-card furniture-card"; button.type = "button";
      button.innerHTML = `<span class="card-label">MUEBLE</span><strong>${item.name}</strong><small>${item.description}</small><span class="card-action">Abrir visor 3D →</span>`;
      button.onclick = () => location.href = `?cliente=${encodeURIComponent(activeClient)}&mueble=${encodeURIComponent(id)}`; return button;
    }));
  };
  document.getElementById("backToClients").onclick = () => { activeClient = null; furnitureStep.hidden = true; clientStep.hidden = false; history.replaceState({}, "", location.pathname); };
  clients(); if (activeClient && catalog[activeClient]) furniture();
}

function startViewer() {
  document.getElementById("catalogApp").hidden = true; document.getElementById("viewerApp").hidden = false;
  document.getElementById("clientName").textContent = "PICKY KIDS · GUÍA DE ARMADO 3D";
  document.getElementById("productName").textContent = "Esc Reg Librero";
  document.getElementById("sceneName").textContent = "Tres niveles · 480 × 149,5 × 860 mm";
  document.getElementById("homeButton").onclick = () => location.href = `?cliente=${encodeURIComponent(route.get("cliente") || defaultClient)}`;
  const select = document.getElementById("pieceSelect");
  select.replaceChildren(...Object.entries(pieces).map(([value, label]) => { const option = document.createElement("option"); option.value = value; option.textContent = label; return option; }));

  const canvas = document.getElementById("viewer"), renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.07;
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xe9eee9, 35, 95);
  const camera = new THREE.PerspectiveCamera(30, 1, .05, 150), controls = new OrbitControls(camera, canvas); controls.enableDamping = true; controls.dampingFactor = .07; controls.maxPolarAngle = Math.PI * .72;
  const framing = responsiveCamera(camera, controls, canvas, 1.15);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x65726b, 2.35));
  const sun = new THREE.DirectionalLight(0xffffff, 3.2); sun.position.set(9, 15, 12); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); scene.add(sun);

  const wood = createWoodMaterial(), selected = createHighlightMaterial(), edgeMat = createEdgeMaterial(); wood.side = THREE.DoubleSide; selected.side = THREE.DoubleSide;
  const dowelMat = new THREE.MeshStandardMaterial({ color: VIEWER_COLORS.dowel, roughness: .45 });
  const hardwareMat = new THREE.MeshStandardMaterial({ color: VIEWER_COLORS.hardware, roughness: .35, metalness: .18 });
  const root = new THREE.Group(); root.scale.setScalar(.01); root.position.y = -.02; scene.add(root);
  const parts = [], markers = [];

  function addPart(type, geometry, position, explode, stage) {
    const group = new THREE.Group(), mesh = new THREE.Mesh(geometry, wood); mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.partType = type; group.add(mesh);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 25), edgeMat); group.add(edges);
    group.position.set(...position); group.userData = { base: new THREE.Vector3(...position), explode: new THREE.Vector3(...explode), stage, type };
    root.add(group); parts.push({ group, mesh, type }); return group;
  }
  function dot(parent, position, diameter, axis = "z") {
    const radius = Math.max(diameter / 2, 2.8), material = diameter >= 14 ? hardwareMat : dowelMat;
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 2.4, 20), material); mesh.position.set(...position);
    if (axis === "x") mesh.rotation.z = Math.PI / 2; else if (axis === "z") mesh.rotation.x = Math.PI / 2;
    mesh.userData.type = parent.userData.type; parent.add(mesh); markers.push(mesh); return mesh;
  }
  const ops = code => programs[code].operations;
  const sideX = W / 2 - T / 2;
  const left = addPart("lateral-izquierdo", new THREE.BoxGeometry(T, H, D), [-sideX, H / 2, 0], [-155, 0, 0], 2);
  const right = addPart("lateral-derecho", new THREE.BoxGeometry(T, H, D), [sideX, H / 2, 0], [155, 0, 0], 2);
  const sidePattern = ops("01").filter(op => op.type === "Vertical Hole");
  for (const op of sidePattern) {
    const z = -D / 2 + op.y;
    dot(left, [T / 2 + 1, -H / 2 + op.x, z], op.diameter, "x");
    dot(right, [-T / 2 - 1, -H / 2 + op.x, z], op.diameter, "x");
  }

  function addBase(type, y, explode) {
    const group = addPart(type, new THREE.BoxGeometry(INNER, T, BASE_D), [0, y, 0], explode, 1);
    for (const op of ops("03")) {
      const x = -INNER / 2 + op.x, z = BASE_D / 2 - op.y;
      if (op.type === "Vertical Hole") dot(group, [x, T / 2 + 1, z], op.diameter, "y");
      else if (op.type === "Horizontal Hole") {
        const onSide = Math.abs(op.x) < .1 || Math.abs(op.x - INNER) < .1;
        dot(group, [x, 0, z], op.diameter, onSide ? "x" : "z");
      }
    }
    return group;
  }
  addBase("base-inferior", 19.25, [0, -75, 105]);
  addBase("base-central", 394.25, [0, 0, 135]);
  addBase("base-superior", 769.25, [0, 75, 165]);

  function addFront(type, bottom, explode) {
    const group = addPart(type, new THREE.BoxGeometry(INNER, 100, T), [0, bottom + 50, D / 2 - T / 2], explode, 0);
    for (const op of ops("02")) {
      const x = -INNER / 2 + op.x, y = -50 + op.y;
      dot(group, [x, y, 0], op.diameter, "x");
    }
    return group;
  }
  addFront("frente-inferior", 10, [0, -50, 180]);
  addFront("frente-central", 385, [0, 0, 210]);
  addFront("frente-superior", 760, [0, 50, 240]);

  const back = addPart("fondo", new THREE.BoxGeometry(INNER, H, T), [0, H / 2, -D / 2 + T / 2], [0, 0, -190], 3);
  for (const op of ops("04")) {
    const x = -INNER / 2 + op.y, y = -H / 2 + op.x;
    if (op.type === "Vertical Hole" || op.type === "Back Vertical Hole") {
      const face = op.type === "Back Vertical Hole" ? -1 : 1;
      dot(back, [x, y, face * (T / 2 + 1)], op.diameter, "z");
      if (op.depth >= T) dot(back, [x, y, -face * (T / 2 + 1)], op.diameter, "z");
    } else if (op.type === "Horizontal Hole") dot(back, [x, y, 0], op.diameter, "x");
  }

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(18, 16), new THREE.MeshStandardMaterial({ color: VIEWER_COLORS.floor, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  let active = route.get("pieza") || "lateral-izquierdo", amount = 0, targetAmount = 0; if (!pieces[active]) active = "lateral-izquierdo"; select.value = active;
  const explodeStep = document.createElement("div"); explodeStep.className = "explode-step"; explodeStep.textContent = "Mueble armado"; document.querySelector(".assembly-controls").append(explodeStep);
  const smooth = (from, to, value) => { const t = THREE.MathUtils.clamp((value - from) / (to - from), 0, 1); return t * t * (3 - 2 * t); };
  function refresh() { for (const item of parts) item.mesh.material = item.type === active ? selected : wood; }
  function update() {
    const stages = [smooth(0, .30, amount), smooth(.22, .58, amount), smooth(.50, .82, amount), smooth(.72, 1, amount)];
    for (const { group } of parts) group.position.copy(group.userData.base).addScaledVector(group.userData.explode, stages[group.userData.stage]);
    const explodedScale = .01 * (1 - amount * .25);
    root.scale.setScalar(explodedScale);
    root.position.y = -.02 + amount * 1.08;
    explodeStep.textContent = amount < .015 ? "Mueble armado" : amount < .30 ? "1 · Retirar los frentes" : amount < .58 ? "2 · Separar las bases" : amount < .82 ? "3 · Abrir los laterales" : amount < .985 ? "4 · Retirar el fondo" : "Despiece completo";
  }
  select.onchange = () => { active = select.value; refresh(); const url = new URL(location.href); url.searchParams.set("cliente", "picky-kids"); url.searchParams.set("mueble", slug); url.searchParams.set("pieza", active); history.replaceState({}, "", url); };
  const slider = document.getElementById("explode"), button = document.getElementById("explodeButton"); slider.value = "0";
  function explode(value) { targetAmount = value; button.textContent = value === 1 ? "Ver armado completo" : "Ver despiece completo"; }
  slider.oninput = () => explode(Number(slider.value) / 100); button.onclick = () => { slider.value = slider.value === "100" ? "0" : "100"; explode(Number(slider.value) / 100); };
  camera.position.set(8.8, 7.2, 13.5); controls.target.set(0, 4.3, 0); controls.minDistance = 4.2; controls.maxDistance = 95;
  function resize() { renderer.setSize(canvas.clientWidth, canvas.clientHeight, false); framing.resize(); }
  new ResizeObserver(resize).observe(canvas); resize(); refresh();
  const clock = new THREE.Clock();
  function animate() { requestAnimationFrame(animate); const dt = Math.min(clock.getDelta(), .05), step = dt * .42; amount += THREE.MathUtils.clamp(targetAmount - amount, -step, step); update(); controls.update(); renderer.render(scene, camera); }
  animate(); document.getElementById("loading").classList.add("ready");
}

if (route.has("mueble") || route.has("pieza") || route.has("p")) startViewer(); else showCatalog();
