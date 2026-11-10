import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import data from "./esc-reg-caj-horiz-data.json";
import { catalog, defaultClient } from "./catalog.js";
import { responsiveCamera } from "./responsive-camera.js";
import { createEdgeMaterial, createHighlightMaterial, createWoodMaterial, VIEWER_COLORS } from "./viewer-palette.js";
import "./styles.css";

const route = new URLSearchParams(location.search), slug = "esc-reg-caj-horiz";
const T = 18.5, W = 883.5, D = 480, H = 860, INNER = 846.5;
const pieces = {
  lateral: "Laterales", base: "Base", tapa: "Tapa", estante: "Estante", parante: "Parante central",
  fondo: "Fondo M3", travesano: "Travesaño",
  "lateral-cajon-izq-1": "Lateral izq. · cajón izquierdo", "lateral-cajon-der-1": "Lateral der. · cajón izquierdo",
  "contra-frente-1": "Contra frente · cajón izquierdo", "fondo-cajon-1": "Fondo · cajón izquierdo",
  "frente-cajon-1": "Frente · cajón izquierdo", "base-cajon-1": "Base M3 · cajón izquierdo",
  "lateral-cajon-izq-2": "Lateral izq. · cajón derecho", "lateral-cajon-der-2": "Lateral der. · cajón derecho",
  "contra-frente-2": "Contra frente · cajón derecho", "fondo-cajon-2": "Fondo · cajón derecho",
  "frente-cajon-2": "Frente · cajón derecho", "base-cajon-2": "Base M3 · cajón derecho"
};
const P = Object.fromEntries(Object.entries(data.programs).map(([name, value]) => [name.slice(12, 14), value]));

function showCatalog() {
  const clientList = document.getElementById("clientList"), furnitureList = document.getElementById("furnitureList"), clientStep = document.getElementById("clientStep"), furnitureStep = document.getElementById("furnitureStep"); let activeClient = route.get("cliente") || null;
  const clients = () => clientList.replaceChildren(...Object.entries(catalog).map(([id, client]) => { const b = document.createElement("button"); b.className = "catalog-card"; b.type = "button"; b.innerHTML = `<span class="card-label">CLIENTE</span><strong>${client.name}</strong><small>${client.client} · ${client.description}</small><span class="card-action">Ver muebles →</span>`; b.onclick = () => { activeClient = id; furniture(); }; return b; }));
  const furniture = () => { const client = catalog[activeClient]; if (!client) return; clientStep.hidden = true; furnitureStep.hidden = false; document.getElementById("selectedClientName").textContent = `${client.name} · ${client.client}`; furnitureList.replaceChildren(...Object.entries(client.furniture).map(([id, item]) => { const b = document.createElement("button"); b.className = "catalog-card furniture-card"; b.type = "button"; b.innerHTML = `<span class="card-label">MUEBLE</span><strong>${item.name}</strong><small>${item.description}</small><span class="card-action">Abrir visor 3D →</span>`; b.onclick = () => location.href = `?cliente=${encodeURIComponent(activeClient)}&mueble=${encodeURIComponent(id)}`; return b; })); };
  document.getElementById("backToClients").onclick = () => { activeClient = null; furnitureStep.hidden = true; clientStep.hidden = false; history.replaceState({}, "", location.pathname); }; clients(); if (activeClient && catalog[activeClient]) furniture();
}

function startViewer() {
  document.getElementById("catalogApp").hidden = true; document.getElementById("viewerApp").hidden = false;
  document.getElementById("clientName").textContent = "PICKY KIDS · GUÍA DE ARMADO 3D";
  document.getElementById("productName").textContent = "Esc Reg Caj Horiz";
  document.getElementById("sceneName").textContent = "Dos cajones · 883,5 × 480 × 860 mm";
  document.getElementById("homeButton").onclick = () => location.href = `?cliente=${encodeURIComponent(route.get("cliente") || defaultClient)}`;
  const select = document.getElementById("pieceSelect");
  select.replaceChildren(...Object.entries(pieces).map(([value, label]) => { const o = document.createElement("option"); o.value = value; o.textContent = label; return o; }));

  const canvas = document.getElementById("viewer"), renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.07;
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xe9eee9, 125, 220);
  const camera = new THREE.PerspectiveCamera(30, 1, .05, 260), controls = new OrbitControls(camera, canvas); controls.enableDamping = true; controls.dampingFactor = .07; controls.maxPolarAngle = Math.PI * .7;
  const framing = responsiveCamera(camera, controls, canvas, 1.3);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x65726b, 2.35)); const sun = new THREE.DirectionalLight(0xffffff, 3.2); sun.position.set(12, 16, 13); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); scene.add(sun);
  const wood = createWoodMaterial(), selected = createHighlightMaterial(), edgeMat = createEdgeMaterial(); wood.side = THREE.DoubleSide; selected.side = THREE.DoubleSide;
  const dowel = new THREE.MeshStandardMaterial({ color: VIEWER_COLORS.dowel, roughness: .45 }), hardware = new THREE.MeshStandardMaterial({ color: VIEWER_COLORS.hardware, roughness: .35, metalness: .18 }), grooveMat = new THREE.MeshStandardMaterial({ color: 0x42504a, roughness: .7 });
  const root = new THREE.Group(); root.scale.setScalar(.01); root.position.y = -.02; scene.add(root); const parts = [], markers = [];

  function sideGeometry() { const s = new THREE.Shape(); s.moveTo(0, 18); s.quadraticCurveTo(0, 0, 18, 0); s.lineTo(D, 0); s.lineTo(D, H); s.lineTo(0, H); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false, curveSegments: 12 }); g.rotateY(Math.PI / 2); g.translate(-T / 2, 0, D / 2); g.computeVertexNormals(); return g; }
  function frontGeometry() { const w = 403, h = 378.5, top = h / 2, s = new THREE.Shape(); s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2); s.lineTo(w / 2, top); s.lineTo(90.5, top); s.lineTo(65.5, top - 31); s.lineTo(-65.5, top - 31); s.lineTo(-90.5, top); s.lineTo(-w / 2, top); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false }); g.translate(0, 0, -T / 2); g.computeVertexNormals(); return g; }
  function addPart(type, geometry, position, explode, options = {}) { const group = new THREE.Group(), mesh = new THREE.Mesh(geometry, wood); mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.partType = type; group.add(mesh); group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 25), edgeMat)); group.position.set(...position); group.userData = { base: new THREE.Vector3(...position), explode: new THREE.Vector3(...explode), type, drawer: options.drawer ?? -1, open: new THREE.Vector3(0, 0, options.drawer >= 0 ? 250 : 0) }; root.add(group); parts.push({ group, mesh, type }); return group; }
  function marker(parent, geometry, position, material, rotation = [0, 0, 0], visibleAssembled = false) { const m = new THREE.Mesh(geometry, material); m.position.set(...position); m.rotation.set(...rotation); m.visible = false; m.userData = { type: parent.userData.type, drawer: parent.userData.drawer, visibleAssembled }; parent.add(m); markers.push(m); return m; }
  function dot(parent, x, y, z, diameter = 8, axis = "z", visible = false) { const r = Math.max(diameter / 2, 2.8), rotation = axis === "z" ? [Math.PI / 2, 0, 0] : axis === "x" ? [0, 0, Math.PI / 2] : [0, 0, 0]; return marker(parent, new THREE.CylinderGeometry(r, r, 2.2, 20), [x, y, z], diameter >= 15 ? hardware : dowel, rotation, visible); }
  function groove(parent, x, y, z, sx, sy, sz, visible = false) { return marker(parent, new THREE.BoxGeometry(sx, sy, sz), [x, y, z], grooveMat, [0, 0, 0], visible); }
  const ops = code => P[code].operations;

  const sideX = W / 2 - T / 2, left = addPart("lateral", sideGeometry(), [-sideX, 0, 0], [-175, 0, 0]), right = addPart("lateral", sideGeometry(), [sideX, 0, 0], [175, 0, 0]);
  function sideMachining(group, code, flipHeight, faceSign) { for (const op of ops(code)) { if (op.type === "Vertical Hole") { const y = flipHeight ? H - op.x : op.x, z = D / 2 - op.y, visible = op.diameter <= 4.1; dot(group, faceSign * (T / 2 + 1), y, z, op.diameter, "x", visible); } else if (op.type === "Vertical Line") groove(group, faceSign * (T / 2 + .8), H / 2, D / 2 - op.begin[1], 2, H, op.width); } }
  sideMachining(left, "01", true, 1); sideMachining(right, "02", false, -1);

  function horizontalBoard(type, code, position, faceSign, explode) { const p = P[code], group = addPart(type, new THREE.BoxGeometry(p.length, T, p.width), position, explode); for (const op of ops(code)) { const x = -p.length / 2 + (op.x ?? 0), z = p.width / 2 - (op.y ?? 0); if (op.type === "Horizontal Hole") dot(group, x, 0, z, op.diameter, Math.abs(op.x) < .1 || Math.abs(op.x - p.length) < .1 ? "x" : "z"); else if (op.type === "Vertical Hole" || op.type === "Back Vertical Hole") { const sign = op.type === "Vertical Hole" ? faceSign : -faceSign; dot(group, x, sign * (T / 2 + 1), z, op.diameter, "y"); } else if (op.type === "Vertical Line") groove(group, 0, faceSign * (T / 2 + .8), p.width / 2 - op.begin[1], p.length, 2, op.width); } return group; }
  horizontalBoard("base", "03", [0, 14.25, 0], 1, [0, -70, 0]);
  horizontalBoard("tapa", "04", [0, 750.75, 0], -1, [0, 75, 0]);
  horizontalBoard("estante", "05", [0, 422.5, 10], -1, [0, 0, 95]);

  function addParante() { const p = P["06"], cy = 23.5 + p.length / 2, group = addPart("parante", new THREE.BoxGeometry(T, p.length, p.width), [0, cy, 10], [0, -35, 95]); for (const op of ops("06")) { const y = -p.length / 2 + (op.x ?? 0), z = p.width / 2 - (op.y ?? 0); if (op.type === "Horizontal Hole") dot(group, 0, y, z, op.diameter, "y"); else if (op.type === "Vertical Hole" || op.type === "Back Vertical Hole") { const sign = op.type === "Vertical Hole" ? 1 : -1; dot(group, sign * (T / 2 + 1), y, z, op.diameter, "x"); } } return group; }
  addParante();
  addPart("fondo", new THREE.BoxGeometry(855.5, 727, 3), [0, 382.5, -225.75], [0, 0, -115]);
  function addTravesano() { const p = P["11"], group = addPart("travesano", new THREE.BoxGeometry(p.length, p.width, T), [0, 810, -212.5], [0, 70, 90]); for (const op of ops("11")) { const x = -p.length / 2 + op.x, y = -p.width / 2 + op.y, axis = Math.abs(op.x) < .1 || Math.abs(op.x - p.length) < .1 ? "x" : "y"; dot(group, x, y, 0, op.diameter, axis); } return group; }
  addTravesano();

  function drawerSide(type, code, drawerX, x, cy, drawer, faceSign, explodeX) { const p = P[code], group = addPart(type, new THREE.BoxGeometry(T, p.width, p.length), [drawerX + x, cy, 24.75], [explodeX, 0, 20], { drawer }); for (const op of ops(code)) { if (op.type === "Vertical Hole" || op.type === "Back Vertical Hole") { const y = p.width / 2 - op.y, z = p.length / 2 - op.x, face = op.type === "Vertical Hole" ? faceSign : -faceSign; dot(group, face * (T / 2 + 1), y, z, op.diameter, "x"); } else if (op.type === "Vertical Line") groove(group, faceSign * (T / 2 + .8), p.width / 2 - op.begin[1], 0, 2, op.width, p.length); } return group; }
  function drawerCross(type, code, drawerX, cy, z, drawer, isRear) { const p = P[code], bottom = cy - 178.25, groupY = bottom + p.width / 2, group = addPart(type, new THREE.BoxGeometry(p.length, p.width, T), [drawerX, groupY, z], [0, 0, isRear ? -110 : 120], { drawer }); for (const op of ops(code)) { const x = -p.length / 2 + (op.x ?? 0), y = p.width / 2 - (op.y ?? 0); if (op.type === "Horizontal Hole") dot(group, x, y, 0, op.diameter, "x"); else if (op.type === "Vertical Hole" || op.type === "Back Vertical Hole") { const sign = isRear ? (op.type === "Back Vertical Hole" ? 1 : -1) : (op.type === "Back Vertical Hole" ? -1 : 1); dot(group, x, y, sign * (T / 2 + 1), op.diameter, "z"); } else if (op.type === "Vertical Line") groove(group, 0, p.width / 2 - op.begin[1], (isRear ? 1 : -1) * (T / 2 + .8), p.length, op.width, 2); } return group; }
  function drawerFront(type, drawerX, cy, drawer) { const group = addPart(type, frontGeometry(), [drawerX, cy, D / 2], [0, 0, 150], { drawer }); for (const op of ops("10")) if (op.type === "Vertical Hole") dot(group, op.y - 403 / 2, op.x - 378.5 / 2, -(T / 2 + 1), op.diameter, "z"); return group; }
  function addDrawer(drawerX, drawer) { const n = drawer + 1, cy = 218.375; drawerSide(`lateral-cajon-izq-${n}`, "07", drawerX, -184.55, cy, drawer, 1, -95); drawerSide(`lateral-cajon-der-${n}`, "14", drawerX, 184.55, cy, drawer, -1, 95); drawerCross(`contra-frente-${n}`, "08", drawerX, cy, 221.5, drawer, false); drawerCross(`fondo-cajon-${n}`, "09", drawerX, cy, -172, drawer, true); addPart(`base-cajon-${n}`, new THREE.BoxGeometry(355, 3, 404), [drawerX, cy - 168.25, 24.75], [0, -85, 0], { drawer }); drawerFront(`frente-cajon-${n}`, drawerX, cy, drawer); }
  addDrawer(-216.25, 0); addDrawer(216.25, 1);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(24, 18), new THREE.MeshStandardMaterial({ color: VIEWER_COLORS.floor, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  let active = route.get("pieza") || "lateral", amount = 0, targetAmount = 0; const drawerAmount = [0, 0], drawerTarget = [0, 0]; if (!pieces[active]) active = "lateral"; select.value = active;
  const drawerControls = document.createElement("div"); drawerControls.className = "drawer-toggle-panel"; ["izquierdo", "derecho"].forEach((label, index) => { const b = document.createElement("button"); b.type = "button"; b.className = "drawer-toggle"; b.textContent = `Abrir cajón ${label}`; b.setAttribute("aria-pressed", "false"); b.onclick = () => { drawerTarget[index] = drawerTarget[index] ? 0 : 1; b.textContent = `${drawerTarget[index] ? "Cerrar" : "Abrir"} cajón ${label}`; b.setAttribute("aria-pressed", String(Boolean(drawerTarget[index]))); }; drawerControls.append(b); }); document.querySelector(".stage").append(drawerControls);
  const explodeStep = document.createElement("div"); explodeStep.className = "explode-step"; explodeStep.textContent = "Mueble armado"; document.querySelector(".assembly-controls").append(explodeStep);
  const smooth = (from, to, value) => { const t = THREE.MathUtils.clamp((value - from) / (to - from), 0, 1); return t * t * (3 - 2 * t); };
  function refresh() { for (const item of parts) item.mesh.material = item.type === active ? selected : wood; for (const m of markers) m.visible = amount > .001 || m.userData.visibleAssembled || (m.userData.drawer >= 0 && drawerAmount[m.userData.drawer] > .02); }
  function update() { const drawerOut = [smooth(0, .16, amount), smooth(.08, .24, amount)], drawerSplit = [smooth(.22, .48, amount), smooth(.42, .68, amount)], bodySplit = smooth(.66, 1, amount); for (const { group } of parts) { const d = group.userData; if (d.drawer >= 0) { const opening = Math.max(drawerAmount[d.drawer], drawerOut[d.drawer]); group.position.copy(d.base).addScaledVector(d.open, opening).addScaledVector(d.explode, drawerSplit[d.drawer]); } else group.position.copy(d.base).addScaledVector(d.explode, bodySplit); } explodeStep.textContent = amount < .015 ? "Mueble armado" : amount < .22 ? "1 · Extraer los cajones" : amount < .42 ? "2 · Desarmar el cajón izquierdo" : amount < .66 ? "3 · Desarmar el cajón derecho" : amount < .985 ? "4 · Separar la estructura" : "Despiece completo"; refresh(); }
  select.onchange = () => { active = select.value; refresh(); const url = new URL(location.href); url.searchParams.set("cliente", "picky-kids"); url.searchParams.set("mueble", slug); url.searchParams.set("pieza", active); history.replaceState({}, "", url); };
  const slider = document.getElementById("explode"), button = document.getElementById("explodeButton"); slider.value = "0"; function explode(value) { targetAmount = value; drawerControls.hidden = value > .001; button.textContent = value === 1 ? "Ver armado completo" : "Ver despiece completo"; } slider.oninput = () => explode(Number(slider.value) / 100); button.onclick = () => { slider.value = slider.value === "100" ? "0" : "100"; explode(Number(slider.value) / 100); };
  camera.position.set(17.5, 11.5, 21); controls.target.set(0, 4.4, 0); controls.minDistance = 6; controls.maxDistance = 120;
  function resize() { renderer.setSize(canvas.clientWidth, canvas.clientHeight, false); framing.resize(); } new ResizeObserver(resize).observe(canvas); resize();
  const clock = new THREE.Clock(); function animate() { requestAnimationFrame(animate); const dt = Math.min(clock.getDelta(), .05), drawerSpeed = 1 - Math.exp(-dt * 6), step = dt * .4; amount += THREE.MathUtils.clamp(targetAmount - amount, -step, step); for (let i = 0; i < 2; i++) drawerAmount[i] = THREE.MathUtils.lerp(drawerAmount[i], drawerTarget[i], drawerSpeed); update(); controls.update(); renderer.render(scene, camera); } animate(); document.getElementById("loading").classList.add("ready");
}

if (route.has("mueble") || route.has("pieza") || route.has("p")) startViewer(); else showCatalog();
