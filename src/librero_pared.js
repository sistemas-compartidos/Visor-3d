import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import data from "./librero-pared-data.json";
import { catalog, defaultClient } from "./catalog.js";
import { responsiveCamera } from "./responsive-camera.js";
import { createEdgeMaterial, createHighlightMaterial, createWoodMaterial, VIEWER_COLORS } from "./viewer-palette.js";
import "./styles.css";

const route = new URLSearchParams(location.search);
const slug = "librero-pared-emi";
const pieces = { lateral: "Laterales", base: "Bases", frente: "Frentes", fondo: "Fondos traseros" };
const T = data.thickness;

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
  document.getElementById("productName").textContent = "Librero Pared Emi";
  document.getElementById("sceneName").textContent = "Librero de pared de tres niveles";
  document.getElementById("homeButton").onclick = () => location.href = `?cliente=${encodeURIComponent(route.get("cliente") || defaultClient)}`;
  const select = document.getElementById("pieceSelect");
  select.replaceChildren(...Object.entries(pieces).map(([value, label]) => { const o = document.createElement("option"); o.value = value; o.textContent = label; return o; }));

  const canvas = document.getElementById("viewer"), renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xe9eee9, 160, 235);
  const camera = new THREE.PerspectiveCamera(30, 1, .05, 260), controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = .07; controls.maxPolarAngle = Math.PI * .69;
  const framing = responsiveCamera(camera, controls, canvas, 1.17);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x65726b, 2.35));
  const light = new THREE.DirectionalLight(0xffffff, 3.25); light.position.set(9, 16, 13); light.castShadow = true; light.shadow.mapSize.set(2048, 2048); scene.add(light);
  const wood = createWoodMaterial(), selected = createHighlightMaterial(), edgeMat = createEdgeMaterial();
  wood.side = THREE.DoubleSide; selected.side = THREE.DoubleSide;
  const dowel = new THREE.MeshStandardMaterial({ color: VIEWER_COLORS.dowel, roughness: .45 });
  const hardware = new THREE.MeshStandardMaterial({ color: VIEWER_COLORS.hardware, roughness: .35, metalness: .18 });
  const root = new THREE.Group(); root.scale.setScalar(.01); root.position.y = -.02; scene.add(root);
  const parts = [], markers = [];

  function geometry(type, transform = (x, y) => [x, y]) {
    const p = data.profiles[type], shape = new THREE.Shape();
    p.outline.forEach(([x, y], i) => { const [tx, ty] = transform(x, y); i ? shape.lineTo(tx, ty) : shape.moveTo(tx, ty); });
    for (const hole of p.holes || []) { const path = new THREE.Path(); hole.forEach(([x, y], i) => { const [tx, ty] = transform(x, y); i ? path.lineTo(tx, ty) : path.moveTo(tx, ty); }); path.closePath(); shape.holes.push(path); }
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false, curveSegments: 8 });
    const transformed = p.outline.map(([x, y]) => transform(x, y));
    const xmin = Math.min(...transformed.map(v => v[0])), xmax = Math.max(...transformed.map(v => v[0]));
    const ymin = Math.min(...transformed.map(v => v[1])), ymax = Math.max(...transformed.map(v => v[1]));
    g.translate(-(xmin+xmax)/2, -(ymin+ymax)/2, -T/2); g.computeVertexNormals(); return g;
  }
  function addPart(type, profile, pos, rot, explode, transform) {
    const group = new THREE.Group(), g = geometry(profile, transform), mesh = new THREE.Mesh(g, wood);
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.partType = type;
    group.add(mesh); group.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 25), edgeMat));
    group.position.set(...pos); group.rotation.set(...rot);
    group.userData = { base: new THREE.Vector3(...pos), explode: new THREE.Vector3(...explode), partType: type };
    root.add(group); parts.push({ group, mesh, type }); return group;
  }
  function dot(parent, x, y, z, diameter = 8, axis = "z") {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(Math.max(diameter/2, 2.8), Math.max(diameter/2, 2.8), 1.8, 20), diameter <= 8 ? dowel : hardware);
    m.position.set(x, y, z); if (axis === "z") m.rotation.x = Math.PI/2; if (axis === "x") m.rotation.z = Math.PI/2;
    m.visible = false; m.userData.partType = parent.userData.partType; parent.add(m); markers.push(m);
  }
  function sideMarks(part, ops, innerSign) {
    for (const op of ops) dot(part, op.y-75, op.x-600, innerSign*(T/2+.9), op.diameter);
  }
  function flatMarks(part, type, ops, transform, faceSign = 1) {
    const p = data.profiles[type], seen = new Set();
    for (const op of ops) {
      let [x, y] = transform(op.x, op.y); x -= p.width/2; y -= p.height/2;
      let edge = null;
      if (op.type === "Horizontal Hole") {
        if (Math.abs(op.x) < .3) edge = "left"; else if (Math.abs(op.x-p.width) < .3) edge = "right";
        else if (Math.abs(op.y) < .3) edge = "bottom"; else if (Math.abs(op.y-p.height) < .3) edge = "top";
      }
      const key = `${x.toFixed(2)}:${y.toFixed(2)}:${edge || op.type}`; if (seen.has(key)) continue; seen.add(key);
      if (edge === "left" || edge === "right") dot(part, x+(edge === "left" ? -.9 : .9), y, 0, op.diameter, "x");
      else if (edge === "top" || edge === "bottom") dot(part, x, y+(edge === "bottom" ? -.9 : .9), 0, op.diameter, "y");
      else dot(part, x, y, faceSign*(T/2+.9), op.diameter);
    }
  }

  const sideX = (564+T)/2;
  const left = addPart("lateral", "lateral", [-sideX, 600, 75], [0, Math.PI/2, 0], [-180, 0, 0]);
  const right = addPart("lateral", "lateral", [sideX, 600, 75], [0, Math.PI/2, 0], [180, 0, 0]);
  sideMarks(left, data.pieces["lateral-izquierdo"], 1); sideMarks(right, data.pieces["lateral-derecho"], -1);
  const id = (x, y) => [x, y];
  for (let i=0; i<3; i++) {
    const base = addPart("base", "base", [0, data.assembly.baseCentersY[i], 65.75], [Math.PI/2, 0, 0], [0, (i-1)*90, 85], (x,y) => [x, 131.5-y]);
    // Las perforaciones de cara de la base/estante se realizan desde abajo.
    flatMarks(base, "base", data.pieces.base, (x,y) => [x, 131.5-y], 1);
    const frontCenter = data.assembly.frontBottomY[i]+50;
    const front = addPart("frente", "frente", [0, frontCenter, 140.75], [0, 0, 0], [0, (i-1)*75, 190], (x,y) => [x, 100-y]);
    // La cara mecanizada del frente mira hacia el interior del librero.
    flatMarks(front, "frente", data.pieces.frente, (x,y) => [x, 100-y], -1);
    const backCenter = data.assembly.backBottomY[i]+40;
    const back = addPart("fondo", "fondo", [0, backCenter, 9.25], [0, 0, 0], [0, (i-1)*70, -170]);
    // La cara mecanizada del fondo mira hacia el interior del librero.
    flatMarks(back, "fondo", data.pieces[`fondo-${i+1}`], id, 1);
  }

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 19), new THREE.MeshStandardMaterial({ color: VIEWER_COLORS.floor, roughness: 1 }));
  ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);
  let active = route.get("pieza") || "lateral", amount = 0; if (!pieces[active]) active = "lateral"; select.value = active;
  function refresh() { for (const item of parts) item.mesh.material = item.type === active ? selected : wood;
    for (const m of markers) m.visible = amount > .001; }
  function explode(value) { amount = value; const eased = 1-Math.pow(1-value, 2);
    for (const { group } of parts) group.position.copy(group.userData.base).addScaledVector(group.userData.explode, eased); refresh(); }
  select.onchange = () => { active = select.value; refresh(); const url = new URL(location.href);
    url.searchParams.set("cliente", "picky-kids"); url.searchParams.set("mueble", slug); url.searchParams.set("pieza", active); history.replaceState({}, "", url); };
  const slider = document.getElementById("explode"), button = document.getElementById("explodeButton"); slider.value = "0";
  slider.oninput = () => { const v=Number(slider.value); explode(v/100); button.textContent = v===100 ? "Ver armado completo" : "Ver despiece completo"; };
  button.onclick = () => { slider.value = slider.value === "100" ? "0" : "100"; explode(Number(slider.value)/100); button.textContent = slider.value === "100" ? "Ver armado completo" : "Ver despiece completo"; };
  camera.position.set(16, 10.2, 22); controls.target.set(0, 5.9, .75); controls.minDistance = 5; controls.maxDistance = 120;
  refresh(); function resize() { renderer.setSize(canvas.clientWidth, canvas.clientHeight, false); framing.resize(); }
  new ResizeObserver(resize).observe(canvas); resize();
  function animate() { requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); } animate();
  document.getElementById("loading").classList.add("ready");
}

if (route.has("mueble") || route.has("pieza") || route.has("p")) startViewer(); else showCatalog();
