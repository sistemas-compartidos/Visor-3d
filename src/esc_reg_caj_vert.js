import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { catalog, defaultClient } from "./catalog.js";
import { responsiveCamera } from "./responsive-camera.js";
import { createEdgeMaterial, createHighlightMaterial, createWoodMaterial, VIEWER_COLORS } from "./viewer-palette.js";
import "./styles.css";

const route = new URLSearchParams(location.search);
const slug = "esc-reg-caj-vert";
const pieces = {
  lateral: "Laterales", techo: "Techo y base", estante: "Estante", fondo: "Fondo",
  travesano: "Travesaños", "cajon-superior": "Cajón superior", "cajon-inferior": "Cajón inferior"
};
const T = 18.5, W = 450, D = 480, H = 860;

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
  document.getElementById("productName").textContent = "Esc Reg Caj Vert";
  document.getElementById("sceneName").textContent = "Dos cajones verticales";
  document.getElementById("homeButton").onclick = () => location.href = `?cliente=${encodeURIComponent(route.get("cliente") || defaultClient)}`;
  const select = document.getElementById("pieceSelect");
  select.replaceChildren(...Object.entries(pieces).map(([value, label]) => { const o = document.createElement("option"); o.value = value; o.textContent = label; return o; }));

  const canvas = document.getElementById("viewer"), renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xe9eee9, 115, 190);
  const camera = new THREE.PerspectiveCamera(30, 1, .05, 220), controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = .07; controls.maxPolarAngle = Math.PI * .7;
  const framing = responsiveCamera(camera, controls, canvas, 1.18);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x65726b, 2.35));
  const light = new THREE.DirectionalLight(0xffffff, 3.2); light.position.set(11, 15, 12); light.castShadow = true; light.shadow.mapSize.set(2048, 2048); scene.add(light);
  const wood = createWoodMaterial(), selected = createHighlightMaterial(), edgeMat = createEdgeMaterial(); wood.side = THREE.DoubleSide; selected.side = THREE.DoubleSide;
  const dowel = new THREE.MeshStandardMaterial({ color: VIEWER_COLORS.dowel, roughness: .45 });
  const hardware = new THREE.MeshStandardMaterial({ color: VIEWER_COLORS.hardware, roughness: .35, metalness: .18 });
  const root = new THREE.Group(); root.scale.setScalar(.01); root.position.y = -.02; scene.add(root);
  const parts = [], markers = [], drawers = [];

  function addPart(type, geometry, position, explode, rotation = [0, 0, 0], drawer = null) {
    const group = new THREE.Group(), mesh = new THREE.Mesh(geometry, wood);
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.partType = type;
    group.add(mesh); group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 25), edgeMat)); group.position.set(...position); group.rotation.set(...rotation);
    group.userData = { base: new THREE.Vector3(...position), explode: new THREE.Vector3(...explode), partType: type, drawer };
    root.add(group); parts.push({ group, mesh, type }); return group;
  }
  function dot(parent, x, y, z, diameter = 8, axis = "z", visibleAssembled = false) {
    const mat = diameter >= 15 ? hardware : dowel;
    const r = Math.max(diameter / 2, 2.8), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 2.2, 20), mat);
    m.position.set(x, y, z); if (axis === "z") m.rotation.x = Math.PI / 2; if (axis === "x") m.rotation.z = Math.PI / 2;
    m.visible = false; m.userData = { partType: parent.userData.partType, visibleAssembled }; parent.add(m); markers.push(m);
  }
  // Frente con calado superior de agarre, tomado de la pieza 108 del XML.
  function drawerFrontGeometry() {
    const w = 403, h = 378.5, s = new THREE.Shape();
    s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2); s.lineTo(w / 2, h / 2); s.lineTo(72, h / 2);
    s.lineTo(48, h / 2 - 25); s.quadraticCurveTo(0, h / 2 - 52, -48, h / 2 - 25); s.lineTo(-72, h / 2); s.lineTo(-w / 2, h / 2); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false, curveSegments: 16 }); g.translate(0, 0, -T / 2); g.computeVertexNormals(); return g;
  }
  const innerW = W - 2 * T, sideX = W / 2 - T / 2;
  const left = addPart("lateral", new THREE.BoxGeometry(T, H, D), [-sideX, H / 2, 0], [-150, 0, 0]);
  const right = addPart("lateral", new THREE.BoxGeometry(T, H, D), [sideX, H / 2, 0], [150, 0, 0]);
  // Laterales: agujeros internos de unión. Quedan ocultos armado y aparecen con despiece.
  for (const side of [left, right]) for (const y of [74, 230, 396, 520, 786]) for (const z of [-205, 205]) dot(side, 0, y - H / 2, z, 8, "x");
  const base = addPart("techo", new THREE.BoxGeometry(innerW, T, D), [0, T / 2, 0], [0, -100, 0]);
  const top = addPart("techo", new THREE.BoxGeometry(innerW, T, D), [0, H - T / 2, 0], [0, 100, 0]);
  for (const piece of [base, top]) for (const x of [-innerW / 2 + 34, innerW / 2 - 34]) dot(piece, x, 0, 0, 15, "y", true);
  const shelfY = 430, shelf = addPart("estante", new THREE.BoxGeometry(innerW, T, 460), [0, shelfY, -10], [0, 65, 0]);
  for (const x of [-innerW / 2 + 34, innerW / 2 - 34]) dot(shelf, x, 0, 0, 15, "y", true);
  const back = addPart("fondo", new THREE.BoxGeometry(422, 807, 3), [0, H / 2, -D / 2 + 1.5], [0, 0, -130]);
  for (const x of [-185, 185]) for (const y of [-330, 0, 330]) dot(back, x, y, -2.1, 4, "z", true);
  const railTop = addPart("travesano", new THREE.BoxGeometry(innerW, 70, T), [0, 785, D / 2 - T / 2], [0, 80, 90]);
  const railMid = addPart("travesano", new THREE.BoxGeometry(innerW, 70, T), [0, 430, D / 2 - T / 2], [0, 0, 115]);
  for (const rail of [railTop, railMid]) for (const x of [-innerW / 2 + 35, 0, innerW / 2 - 35]) dot(rail, x, 0, T / 2 + 1, 8, "z", true);

  function addDrawer(type, cy, direction) {
    const group = new THREE.Group(); group.userData = { base: new THREE.Vector3(0, 0, 0), open: new THREE.Vector3(0, 0, 175), explode: new THREE.Vector3(0, direction * 165, 115) }; root.add(group); drawers.push(group);
    const add = (geometry, pos, kind = type) => { const mesh = new THREE.Mesh(geometry, wood); mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.partType = kind; const wrapper = new THREE.Group(); wrapper.add(mesh); wrapper.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 25), edgeMat)); wrapper.position.set(...pos); wrapper.userData = { base: new THREE.Vector3(...pos), explode: new THREE.Vector3(0, direction * 24, 10) }; group.add(wrapper); parts.push({ group: wrapper, mesh, type: kind, drawer: group }); return wrapper; };
    const front = add(drawerFrontGeometry(), [0, cy, D / 2 + T / 2]);
    const leftSide = add(new THREE.BoxGeometry(T, 356.5, 356.5), [-175, cy - 10, 38]);
    const rightSide = add(new THREE.BoxGeometry(T, 356.5, 356.5), [175, cy - 10, 38]);
    const rear = add(new THREE.BoxGeometry(350.6, 296.5, T), [0, cy - 35, -140]);
    const bottom = add(new THREE.BoxGeometry(404, 3, 355), [0, cy - 180, 38]);
    // Los tres avellanados del frente son visibles; el resto corresponde a uniones internas.
    for (const [x, y] of [[-84.5, 0], [84.5, -86.65], [84.5, 86.65]]) dot(front, x, y, T / 2 + 1, 4, "z", true);
    for (const side of [leftSide, rightSide]) for (const y of [-120, 120]) dot(side, 0, y, 150, 8, "x");
    for (const x of [-145, 145]) dot(rear, x, 105, 0, 15, "z");
  }
  addDrawer("cajon-superior", 615, 1); addDrawer("cajon-inferior", 220, -1);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 18), new THREE.MeshStandardMaterial({ color: VIEWER_COLORS.floor, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  let active = route.get("pieza") || "lateral", amount = 0, targetAmount = 0, drawerAmount = 0, targetDrawer = 0;
  if (!pieces[active]) active = "lateral"; select.value = active;
  const drawerButton = document.createElement("button"); drawerButton.type = "button"; drawerButton.className = "lid-toggle"; drawerButton.textContent = "Abrir cajones"; drawerButton.setAttribute("aria-pressed", "false"); document.querySelector(".stage").append(drawerButton);
  drawerButton.onclick = () => { targetDrawer = targetDrawer ? 0 : 1; drawerButton.textContent = targetDrawer ? "Cerrar cajones" : "Abrir cajones"; drawerButton.setAttribute("aria-pressed", String(Boolean(targetDrawer))); };
  function refresh() { for (const item of parts) item.mesh.material = item.type === active ? selected : wood; for (const m of markers) m.visible = amount > .001 || m.userData.visibleAssembled; }
  function update() {
    const eased = 1 - Math.pow(1 - amount, 2);
    for (const item of parts) { const wrapper = item.group, drawer = item.drawer; const data = wrapper.userData; wrapper.position.copy(data.base).addScaledVector(data.explode, eased); if (drawer) wrapper.position.addScaledVector(drawer.userData.open, drawerAmount); }
    for (const drawer of drawers) drawer.position.copy(drawer.userData.base).addScaledVector(drawer.userData.explode, eased);
    refresh();
  }
  select.onchange = () => { active = select.value; refresh(); const url = new URL(location.href); url.searchParams.set("cliente", "picky-kids"); url.searchParams.set("mueble", slug); url.searchParams.set("pieza", active); history.replaceState({}, "", url); };
  const slider = document.getElementById("explode"), button = document.getElementById("explodeButton"); slider.value = "0";
  function explode(value) { targetAmount = value; drawerButton.hidden = value > .001; button.textContent = value === 1 ? "Ver armado completo" : "Ver despiece completo"; }
  slider.oninput = () => explode(Number(slider.value) / 100); button.onclick = () => { slider.value = slider.value === "100" ? "0" : "100"; explode(Number(slider.value) / 100); };
  camera.position.set(13.5, 11, 18); controls.target.set(0, 4.25, 0); controls.minDistance = 5; controls.maxDistance = 105;
  function resize() { renderer.setSize(canvas.clientWidth, canvas.clientHeight, false); framing.resize(); } new ResizeObserver(resize).observe(canvas); resize();
  const clock = new THREE.Clock();
  function animate() { requestAnimationFrame(animate); const dt = Math.min(clock.getDelta(), .05), speed = 1 - Math.exp(-dt * 6); amount = THREE.MathUtils.lerp(amount, targetAmount, speed); drawerAmount = THREE.MathUtils.lerp(drawerAmount, Math.max(targetDrawer, amount > .08 ? 0 : targetDrawer), speed); update(); controls.update(); renderer.render(scene, camera); }
  animate(); document.getElementById("loading").classList.add("ready");
}
if (route.has("mueble") || route.has("pieza") || route.has("p")) startViewer(); else showCatalog();
