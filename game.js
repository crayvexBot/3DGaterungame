/* =========================
   SCENE
========================= */
let scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0a0a0a, 5, 80);

let camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);

let renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

/* LIGHT */
let light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5,10,5);
scene.add(light);

/* =========================
   PLAYER (FPS)
========================= */
let player = new THREE.Object3D();
scene.add(player);

camera.position.set(0,1.6,0);
player.add(camera);

/* CAMERA LOOK */
let yaw = 0;
document.addEventListener("mousemove", e=>{
  yaw -= e.movementX * 0.002;
  player.rotation.y = yaw;
});

/* =========================
   FLOOR
========================= */
let floor = new THREE.Mesh(
  new THREE.PlaneGeometry(500,500),
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

  let dist=Math.sqrt(dx*dx+dy*dy);
  let max=40;

  if(dist>max){
    dx=dx/dist*max;
    dy=dy/dist*max;
  }

  joy.x=dx/max;
  joy.y=dy/max;

  stick.style.transform=`translate(${dx}px,${dy}px)`;
});

/* =========================
   INFINITE ROOMS
========================= */
let chunks = [];

function createChunk(z){

  let group = new THREE.Group();

  // floor
  let seg = new THREE.Mesh(
    new THREE.BoxGeometry(20,1,20),
    new THREE.MeshStandardMaterial({color:0x145c2b})
  );
  seg.position.set(0,0,z);
  group.add(seg);

  // walls
  let wallMat = new THREE.MeshStandardMaterial({color:0x333333});

  let w1 = new THREE.Mesh(new THREE.BoxGeometry(1,4,20), wallMat);
  let w2 = new THREE.Mesh(new THREE.BoxGeometry(1,4,20), wallMat);

  w1.position.set(-10,2,z);
  w2.position.set(10,2,z);

  group.add(w1); group.add(w2);

  // flowers (hazard)
  for(let i=0;i<5;i++){
    let f = new THREE.Mesh(
      new THREE.SphereGeometry(0.3),
      new THREE.MeshStandardMaterial({color:0x66ff99})
    );

    f.position.set(
      (Math.random()-0.5)*15,
      0.3,
      z + (Math.random()-0.5)*15
    );

    group.add(f);
    group.userData.flowers = group.userData.flowers || [];
    group.userData.flowers.push(f);
  }

  // gate at end
  let gate = new THREE.Mesh(
    new THREE.BoxGeometry(4,4,1),
    new THREE.MeshStandardMaterial({color:0x00aaff, wireframe:true})
  );

  gate.position.set(0,2,z-10);
  group.add(gate);
  group.userData.gate = gate;

  scene.add(group);
  chunks.push(group);
}

/* initial chunks */
for(let i=0;i<5;i++){
  createChunk(-i*20);
}

/* =========================
   ENTITY (AI)
========================= */
let enemy = new THREE.Mesh(
  new THREE.BoxGeometry(1,2,1),
  new THREE.MeshStandardMaterial({color:0xff0000})
);
enemy.position.set(5,1,-20);
scene.add(enemy);

/* =========================
   RAIN
========================= */
let rain=[];
for(let i=0;i<200;i++){
  let drop = new THREE.Mesh(
    new THREE.BoxGeometry(0.05,0.5,0.05),
    new THREE.MeshBasicMaterial({color:0xaaaaaa})
  );

  drop.position.set(
    (Math.random()-0.5)*50,
    Math.random()*20,
    (Math.random()-0.5)*50
  );

  scene.add(drop);
  rain.push(drop);
}

/* =========================
   GAME
========================= */
let hp=100;
let gateCount=1;

/* =========================
   UPDATE
========================= */
function update(){

  let speed = 0.08; // FIXED SPEED

  let forward = new THREE.Vector3(0,0,-1).applyQuaternion(player.quaternion);
  let right = new THREE.Vector3(1,0,0).applyQuaternion(player.quaternion);

  player.position.addScaledVector(forward, joy.y * speed);
  player.position.addScaledVector(right, joy.x * speed);

  /* CAMERA FOLLOW */
  camera.position.copy(player.position);

  /* INFINITE MAP */
  if(player.position.z < chunks[chunks.length-1].position?.z - 40){
    createChunk(chunks.length * -20);
  }

  /* FLOWER DAMAGE */
  chunks.forEach(c=>{
    if(!c.userData.flowers) return;

    c.userData.flowers.forEach(f=>{
      if(player.position.distanceTo(f.position)<1){
        hp -= 0.1;
        document.getElementById("hp").innerText=Math.floor(hp);
      }
    });
  });

  /* GATE */
  chunks.forEach(c=>{
    let g = c.userData.gate;
    if(!g) return;

    if(player.position.distanceTo(g.position)<3){
      gateCount++;
      document.getElementById("gate").innerText=gateCount;
    }
  });

  /* ENEMY AI */
  let dir = player.position.clone().sub(enemy.position).normalize();
  enemy.position.add(dir.multiplyScalar(0.03));

  /* RAIN UPDATE */
  rain.forEach(r=>{
    r.position.y -= 0.5;
    if(r.position.y < 0){
      r.position.y = 20;
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
