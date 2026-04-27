/* =========================
   SCENE SETUP
========================= */
let scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0a0a0a, 5, 60);

let camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);

let renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

/* LIGHT */
let light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5,10,5);
scene.add(light);

/* =========================
   PLAYER (FIRST PERSON)
========================= */
let player = new THREE.Object3D();
scene.add(player);

camera.position.set(0,1.6,0);
player.add(camera);

/* =========================
   FLOOR (GRASS ILLUSION)
========================= */
let floor = new THREE.Mesh(
  new THREE.PlaneGeometry(200,200),
  new THREE.MeshStandardMaterial({color:0x1b3d1f})
);
floor.rotation.x = -Math.PI/2;
scene.add(floor);

/* =========================
   JOYSTICK
========================= */
let joy = {x:0,y:0};

let base = document.getElementById("joyBase");
let stick = document.getElementById("joyStick");

let dragging=false;

base.addEventListener("touchstart",()=>dragging=true);
base.addEventListener("touchend",()=>{
  dragging=false;
  joy.x=0; joy.y=0;
  stick.style.transform="translate(0,0)";
});

base.addEventListener("touchmove",(e)=>{
  if(!dragging) return;

  let t=e.touches[0];
  let r=base.getBoundingClientRect();

  let dx=t.clientX-r.left-60;
  let dy=t.clientY-r.top-60;

  joy.x=dx/40;
  joy.y=dy/40;

  stick.style.transform=`translate(${dx}px,${dy}px)`;
});

/* =========================
   ROOMS + WALLS
========================= */
let walls=[];

function clearWalls(){
  walls.forEach(w=>scene.remove(w));
  walls=[];
}

function spawnRoom(zOffset){

  // floor segment
  let segment = new THREE.Mesh(
    new THREE.BoxGeometry(20,1,20),
    new THREE.MeshStandardMaterial({color:0x145c2b})
  );

  segment.position.set(0,0,zOffset);
  scene.add(segment);

  // walls (corridor style)
  let wallMat = new THREE.MeshStandardMaterial({color:0x333333});

  let w1 = new THREE.Mesh(new THREE.BoxGeometry(1,4,20), wallMat);
  let w2 = new THREE.Mesh(new THREE.BoxGeometry(1,4,20), wallMat);

  w1.position.set(-10,2,zOffset);
  w2.position.set(10,2,zOffset);

  scene.add(w1); scene.add(w2);

  walls.push(segment,w1,w2);
}

/* =========================
   GATES
========================= */
let gates=[];
let gate=1;

function spawnGate(z){

  let g = new THREE.Mesh(
    new THREE.BoxGeometry(4,4,1),
    new THREE.MeshStandardMaterial({color:0x00aaff, wireframe:true})
  );

  g.position.set(0,2,z);
  scene.add(g);
  gates.push(g);
}

/* =========================
   LEVEL GENERATION
========================= */
function generateLevel(){

  clearWalls();
  gates.forEach(g=>scene.remove(g));
  gates=[];

  for(let i=0;i<6;i++){
    let z = -i*20;
    spawnRoom(z);
  }

  spawnGate(-100);
}

generateLevel();

/* =========================
   ENTITIES (HOOKS READY)
========================= */
function spawnLookAtMe(){

  let e = new THREE.Mesh(
    new THREE.SphereGeometry(1),
    new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:0.5})
  );

  e.position.set((Math.random()-0.5)*10,1.5,-30);
  scene.add(e);
}

/* =========================
   ELEVATOR SEQUENCE
========================= */
setTimeout(()=>{

  document.getElementById("elevator").style.display="none";
  document.getElementById("loading").style.display="flex";

  setTimeout(()=>{

    document.getElementById("loading").style.display="none";

  },3000);

},4000);

/* =========================
   MOVEMENT (FPS STYLE)
========================= */
function update(){

  // forward direction
  let forward = new THREE.Vector3(0,0,-1);
  let right = new THREE.Vector3(1,0,0);

  forward.applyQuaternion(player.quaternion);
  right.applyQuaternion(player.quaternion);

  player.position.addScaledVector(forward, joy.y*0.2);
  player.position.addScaledVector(right, joy.x*0.2);

  checkGates();
}

/* =========================
   GATE CHECK
========================= */
function checkGates(){

  gates.forEach(g=>{
    if(player.position.distanceTo(g.position)<3){

      gate++;
      document.getElementById("gate").innerText=gate;

      player.position.z -= 20;

      generateLevel();

      if(Math.random()<0.5) spawnLookAtMe();
    }
  });
}

/* =========================
   LOOP
========================= */
function animate(){
  requestAnimationFrame(animate);
  update();
  renderer.render(scene,camera);
}

animate();
