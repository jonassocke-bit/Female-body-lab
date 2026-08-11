import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const BODY_URL =
  "https://cdn.jsdelivr.net/gh/naver/anny@main/src/anny/data/mpfb2/3dobjs/base.obj";

// Official MakeHuman asset repository. These are actual MakeHuman .target files.
const TARGET_ROOTS = [
  "https://media.githubusercontent.com/media/makehumancommunity/makehuman-assets/master/base/targets/",
  "https://raw.githubusercontent.com/makehumancommunity/makehuman-assets/master/base/targets/"
];

const REAL_TARGETS = {
  shoulders: {
    label: "V-Shape",
    minus: "torso/torso-vshape-decr.target",
    plus:  "torso/torso-vshape-incr.target"
  },
  chest: {
    label: "Bust / Chest",
    minus: "measure/measure-bust-circ-decr.target",
    plus:  "measure/measure-bust-circ-incr.target"
  },
  waist: {
    label: "Waist",
    minus: "measure/measure-waist-circ-decr.target",
    plus:  "measure/measure-waist-circ-incr.target"
  },
  hips: {
    label: "Hips",
    minus: "measure/measure-hips-circ-decr.target",
    plus:  "measure/measure-hips-circ-incr.target"
  },
  butt: {
    label: "Butt",
    minus: "buttocks/buttocks-volume-decr.target",
    plus:  "buttocks/buttocks-volume-incr.target"
  },
  arms: {
    label: "Upper arms",
    minus: "measure/measure-upperarm-circ-decr.target",
    plus:  "measure/measure-upperarm-circ-incr.target"
  },
  thighs: {
    label: "Thighs",
    minus: [
      "armslegs/l-upperleg-scale-horiz-decr.target",
      "armslegs/r-upperleg-scale-horiz-decr.target"
    ],
    plus: [
      "armslegs/l-upperleg-scale-horiz-incr.target",
      "armslegs/r-upperleg-scale-horiz-incr.target"
    ]
  },
  calves: {
    label: "Calves",
    minus: "measure/measure-calf-circ-decr.target",
    plus:  "measure/measure-calf-circ-incr.target"
  }
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, innerWidth/innerHeight, .01, 100);
camera.position.set(0, 1, 6);

const viewport = document.querySelector("#viewport");
const renderer = new THREE.WebGLRenderer({
  antialias:true, alpha:true, powerPreference:"high-performance"
});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
viewport.appendChild(renderer.domElement);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.target.set(0,.9,0);
orbit.enableDamping=true;
orbit.dampingFactor=.08;
orbit.enablePan=true;
orbit.screenSpacePanning=true;
orbit.panSpeed=.75;
orbit.rotateSpeed=.65;
orbit.zoomSpeed=.75;
orbit.minDistance=.55;
orbit.maxDistance=35;
orbit.touches.ONE = THREE.TOUCH.ROTATE;
orbit.touches.TWO = THREE.TOUCH.DOLLY_PAN;

scene.add(new THREE.HemisphereLight(0xffffff,0x202025,1.7));
const key = new THREE.DirectionalLight(0xffffff,2.6);
key.position.set(3.5,4.5,4); scene.add(key);
const fill = new THREE.DirectionalLight(0xffffff,.9);
fill.position.set(-3,2.5,2); scene.add(fill);
const rim = new THREE.DirectionalLight(0xffffff,1.25);
rim.position.set(-2.5,3,-4); scene.add(rim);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(1.25,64),
  new THREE.MeshStandardMaterial({color:0x171719,roughness:.94,transparent:true,opacity:.5})
);
floor.rotation.x=-Math.PI/2; floor.position.y=-.01; scene.add(floor);

// Keep only a few experimental macro controls.
// The lower section is the important comparison: those are true MakeHuman targets.
const defs = [
 {id:"height",label:"Height*",group:"core",min:-1,max:1,value:0, real:false},
 {id:"weight",label:"Weight*",group:"core",min:-1,max:1,value:0, real:false},
 {id:"muscle",label:"Muscle*",group:"core",min:-1,max:1,value:0, real:false},

 {id:"shoulders",label:"V-Shape",group:"real",min:-1,max:1,value:0, real:true},
 {id:"chest",label:"Bust / Chest",group:"real",min:-1,max:1,value:0, real:true},
 {id:"waist",label:"Waist",group:"real",min:-1,max:1,value:0, real:true},
 {id:"hips",label:"Hips",group:"real",min:-1,max:1,value:0, real:true},
 {id:"butt",label:"Butt",group:"real",min:-1,max:1,value:0, real:true},
 {id:"arms",label:"Upper arms",group:"real",min:-1,max:1,value:0, real:true},
 {id:"thighs",label:"Thighs",group:"real",min:-1,max:1,value:0, real:true},
 {id:"calves",label:"Calves",group:"real",min:-1,max:1,value:0, real:true},
];

const state=Object.fromEntries(defs.map(d=>[d.id,d.value]));
const controls=new Map();
let body=null, basePositions=null, sourceVertexIndices=null;
let modelScale=1;
const loadedTargets = new Map();
let targetLoadCount=0, targetFailCount=0;

function fmt(v){return (v>0?"+":"")+Math.round(v*100)}

function makeControls(){
 const core=document.querySelector("#coreControls");
 const real=document.querySelector("#realControls");
 for(const d of defs){
  const row=document.createElement("div"); row.className="control";
  const label=document.createElement("label");
  label.innerHTML=d.real ? `${d.label}<em>REAL</em>` : d.label;
  const input=document.createElement("input");
  input.type="range"; input.min=d.min; input.max=d.max; input.step=.01; input.value=d.value;
  const out=document.createElement("output"); out.textContent="0";
  input.addEventListener("input",()=>{
   state[d.id]=+input.value;
   out.textContent=fmt(state[d.id]);
   updateBody();
  });
  row.append(label,input,out);
  (d.group==="real"?real:core).append(row);
  controls.set(d.id,{input,out});
 }
}
function syncUI(){
 for(const [id,c] of controls){
  c.input.value=state[id];
  c.out.textContent=fmt(state[id]);
 }
}
function resetState(){
 defs.forEach(d=>state[d.id]=d.value);
 syncUI();updateBody();
}
makeControls();
document.querySelector("#resetBtn").onclick=resetState;

// ---------- draggable bottom sheet ----------
const sheet=document.querySelector("#sheet"), handle=document.querySelector("#sheetHandle");
let sheetY=innerHeight*.54, dragStartY=0, dragStartSheetY=0, dragging=false;
function bounds(){return {min:innerHeight*.10,max:innerHeight*.80}}
function setSheet(y,animate=false){
 const b=bounds();
 sheetY=Math.max(b.min,Math.min(b.max,y));
 sheet.style.transition=animate?"transform .28s cubic-bezier(.2,.8,.2,1)":"none";
 sheet.style.setProperty("--sheet-y",`${sheetY}px`);
}
setSheet(sheetY);
handle.addEventListener("pointerdown",e=>{
 dragging=true;dragStartY=e.clientY;dragStartSheetY=sheetY;
 handle.setPointerCapture(e.pointerId);sheet.style.transition="none";
});
handle.addEventListener("pointermove",e=>{
 if(dragging)setSheet(dragStartSheetY+(e.clientY-dragStartY));
});
handle.addEventListener("pointerup",()=>{
 if(!dragging)return;dragging=false;
 const b=bounds(), snaps=[b.min,innerHeight*.54,b.max];
 const nearest=snaps.reduce((a,x)=>Math.abs(x-sheetY)<Math.abs(a-sheetY)?x:a);
 setSheet(nearest,true);
});

// ---------- Indexed MakeHuman OBJ parser ----------
// Important: keep ONE rendered vertex per original hm08 vertex.
// This gives us smooth shared normals and makes .target application exact.
function parseBodyOBJ(text){
 const rawVerts=[];
 const rawUV=[];
 const bodyTriangles=[];
 let group="body";

 const keepGroup=()=>!(group.startsWith("helper-")||group.startsWith("joint-"));

 for(const raw of text.split(/\r?\n/)){
  const line=raw.trim();
  if(!line || line[0]==="#") continue;
  const p=line.split(/\s+/);

  if(p[0]==="v"){
   rawVerts.push([+p[1],+p[2],+p[3]]);
  }else if(p[0]==="vt"){
   rawUV.push([+p[1],+p[2]]);
  }else if(p[0]==="g" || p[0]==="o"){
   group=(p[1]||"").toLowerCase();
  }else if(p[0]==="f" && keepGroup()){
   const refs=p.slice(1).map(s=>s.split("/").map(Number));
   for(let k=1;k<refs.length-1;k++){
    bodyTriangles.push([refs[0],refs[k],refs[k+1]]);
   }
  }
 }

 // Track only vertices actually used by body faces.
 const used = new Set();
 for(const tri of bodyTriangles){
  for(const ref of tri){
   let vi=ref[0];
   if(vi<0) vi=rawVerts.length+1+vi;
   used.add(vi-1); // OBJ -> 0-based hm08
  }
 }

 // Compact body-only vertex list while preserving original hm08 id.
 const sourceToCompact = new Map();
 const compactToSource = [];
 const positions = [];
 for(const src of [...used].sort((a,b)=>a-b)){
   sourceToCompact.set(src, compactToSource.length);
   compactToSource.push(src);
   const v=rawVerts[src];
   // hm08: X width, Y up, Z depth. Flip depth so front faces camera.
   positions.push(v[0],v[1],-v[2]);
 }

 const indices=[];
 for(const tri of bodyTriangles){
   for(const ref of tri){
    let vi=ref[0];
    if(vi<0) vi=rawVerts.length+1+vi;
    indices.push(sourceToCompact.get(vi-1));
   }
 }

 const g=new THREE.BufferGeometry();
 g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
 g.setIndex(indices);

 // One persistent original MakeHuman vertex id per compact render vertex.
 g.setAttribute("sourceVertex",new THREE.Uint32BufferAttribute(compactToSource,1));

 // Smooth normals now work because neighbouring triangles share vertices.
 g.computeVertexNormals();
 g.normalizeNormals();
 return g;
}

function parseTarget(text){
 // Guard against an LFS pointer or unexpected HTML response.
 if(text.startsWith("version https://git-lfs") || text.trim().startsWith("<!DOCTYPE")){
   throw new Error("Asset host returned pointer/HTML instead of target data");
 }
 const map=new Map();
 for(const raw of text.split(/\r?\n/)){
  const line=raw.trim();
  if(!line||line.startsWith("#"))continue;
  const p=line.split(/\s+/);
  if(p.length<4)continue;
  const idx=Number(p[0]), x=Number(p[1]), y=Number(p[2]), z=Number(p[3]);
  if(Number.isInteger(idx) && [x,y,z].every(Number.isFinite)){
   map.set(idx,[x,y,z]);
  }
 }
 if(!map.size)throw new Error("empty target");
 return map;
}

async function fetchOneTarget(path){
 let lastErr=null;
 for(const root of TARGET_ROOTS){
  try{
   const res=await fetch(root+path,{cache:"force-cache"});
   if(!res.ok) throw new Error(`${res.status} ${path}`);
   const text=await res.text();

   // raw.githubusercontent.com may return a tiny Git LFS pointer.
   if(text.startsWith("version https://git-lfs")){
    throw new Error(`Git LFS pointer statt Target: ${path}`);
   }
   return parseTarget(text);
  }catch(err){
   lastErr=err;
  }
 }
 throw lastErr || new Error(`Target nicht ladbar: ${path}`);
}
async function fetchSide(value){
 const paths=Array.isArray(value)?value:[value];
 const maps=await Promise.all(paths.map(fetchOneTarget));
 if(maps.length===1)return maps[0];
 const merged=new Map();
 for(const m of maps)for(const [idx,d] of m){
  const old=merged.get(idx)||[0,0,0];
  merged.set(idx,[old[0]+d[0],old[1]+d[1],old[2]+d[2]]);
 }
 return merged;
}
async function loadRealTargets(){
 const status=document.querySelector("#targetStatus");
 const jobs=Object.entries(REAL_TARGETS).map(async([id,spec])=>{
  try{
   const [minus,plus]=await Promise.all([fetchSide(spec.minus),fetchSide(spec.plus)]);
   loadedTargets.set(id,{minus,plus});
   targetLoadCount++;
  }catch(err){
   console.warn("Target failed",id,err);
   targetFailCount++;
  }
 });
 await Promise.all(jobs);
 status.textContent = targetLoadCount
   ? `${targetLoadCount}/${Object.keys(REAL_TARGETS).length} echte MakeHuman-Target-Gruppen aktiv`
   : `0/${Object.keys(REAL_TARGETS).length} Targets aktiv · LFS-Download fehlgeschlagen`;
 status.classList.toggle("bad",targetLoadCount===0);
 updateBody();
}

function applyTargetToRendered(out,target,amount){
 if(!target || Math.abs(amount)<.0001)return;

 // One output vertex == one original hm08 body vertex.
 for(let rv=0; rv<sourceVertexIndices.length; rv++){
  const delta=target.get(sourceVertexIndices[rv]);
  if(!delta)continue;
  const i=rv*3;
  out[i]   += delta[0]*modelScale*amount;
  out[i+1] += delta[1]*modelScale*amount;
  out[i+2] -= delta[2]*modelScale*amount;
 }
}

function updateBody(){
 if(!body||!basePositions)return;
 const out=new Float32Array(basePositions);

 // TRUE MakeHuman targets
 for(const id of Object.keys(REAL_TARGETS)){
  const v=state[id]||0;
  const pair=loadedTargets.get(id);
  if(!pair)continue;
  if(v<0)applyTargetToRendered(out,pair.minus,-v);
  else if(v>0)applyTargetToRendered(out,pair.plus,v);
 }

 // Three intentionally simple macro approximations are retained only for quick comparison.
 // They are marked with * in the UI and are NOT claimed as MakeHuman targets.
 const h=1+(state.height||0)*.09;
 const w=state.weight||0, m=state.muscle||0;
 for(let i=0;i<out.length;i+=3){
  out[i+1]*=h;
  const y=out[i+1]/h;
  const torso=(y>.55&&y<1.55)?1:0;
  if(torso){
   out[i]*=1+w*.07+m*.025;
   out[i+2]*=1+w*.065+m*.02;
  }
 }

 const pos=body.geometry.attributes.position;
 pos.array.set(out);pos.needsUpdate=true;
 body.geometry.computeVertexNormals();
 body.geometry.computeBoundingSphere();
}

async function loadBody(){
 const loading=document.querySelector("#loading");
 try{
  const r=await fetch(BODY_URL,{cache:"force-cache"});
  if(!r.ok)throw new Error(`Body HTTP ${r.status}`);
  const geo=parseBodyOBJ(await r.text());

  geo.computeBoundingBox(); let bb=geo.boundingBox;
  const rawHeight=bb.max.y-bb.min.y;
  modelScale=1.82/rawHeight;
  geo.scale(modelScale,modelScale,modelScale);
  geo.computeBoundingBox();bb=geo.boundingBox;

  const cx=(bb.min.x+bb.max.x)/2;
  const cz=(bb.min.z+bb.max.z)/2;
  const footY=bb.min.y;
  geo.translate(-cx,-footY,-cz);
  geo.computeBoundingBox();

  basePositions=new Float32Array(geo.attributes.position.array);
  sourceVertexIndices=new Uint32Array(geo.attributes.sourceVertex.array);

  const mat=new THREE.MeshPhysicalMaterial({
   color:0xd8c8bd,
   roughness:.58,
   metalness:0,
   clearcoat:.03,
   clearcoatRoughness:.92,
   side:THREE.DoubleSide,
   flatShading:false
  });
  body=new THREE.Mesh(geo,mat);
  scene.add(body);

  // Full-body framing including arm span.
  const box=geo.boundingBox;
  const size=new THREE.Vector3();box.getSize(size);
  const center=new THREE.Vector3();box.getCenter(center);
  orbit.target.copy(center);

  const vf=THREE.MathUtils.degToRad(camera.fov);
  const aspect=Math.max(.42,innerWidth/innerHeight);
  const hf=2*Math.atan(Math.tan(vf/2)*aspect);
  const dH=(size.y*.82)/Math.tan(vf/2);
  const dW=(size.x*.76)/Math.tan(hf/2);
  const distance=Math.max(dH,dW,5);
  camera.position.set(center.x,center.y,center.z+distance);
  orbit.maxDistance=Math.max(40,distance*7);
  orbit.update();

  loading.classList.add("hidden");
  updateBody();
  loadRealTargets();
 }catch(err){
  loading.querySelector("strong").textContent="Mesh konnte nicht geladen werden";
  loading.querySelector("small").textContent=String(err.message);
  loading.querySelector(".spinner").style.display="none";
 }
}
loadBody();

function resize(){
 camera.aspect=innerWidth/innerHeight;
 camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight,false);
}
addEventListener("resize",()=>{resize();setSheet(sheetY)});
resize();
renderer.setAnimationLoop(()=>{orbit.update();renderer.render(scene,camera)});
