/* =========================
   ELEVATOR FLOW
========================= */
window.addEventListener("load", () => {
  let elevator = document.getElementById("elevator");
  let loading = document.getElementById("loading");

  setTimeout(()=>{
    elevator.style.display="none";
    loading.style.display="flex";

    setTimeout(()=>{
      loading.style.display="none";
    },2000);

  },3000);
});

/* =========================
   SCENE
========================= */
let scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 5, 50);

let camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);

let renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

/* LIGHT (FLASHLIGHT ONLY) */
let light = new THREE.PointLight(0xffffff, 1, 20);
scene.add(light);

/* =========================
   PLAYER
========================= */
let player = new THREE.Object3D();
scene.add(player);

camera.position.set(0,1.6,0);
player.add(camera);

let yaw=0;

/* LOOK */
document.addEventListener("mousemove", e=>{
  yaw -= e.movementX * 0.002;
  player.rotation.y = yaw;
});

let lastX=null;
document.addEventListener("touchmove", e=>{
  if(e.touches.length!==1) return;

  let x=e.touches[0].clientX;
  if(lastX!==null){
    yaw -= (x-lastX)*0.005;
    player.rotation.y=yaw;
  }
  lastX=x;
});

/* =========================
   FLOOR
========================= */
let floor = new THREE.Mesh(
  new THREE.PlaneGeometry(500,500),
  new THREE.MeshStandardMaterial({color:0x0d2d13})
);
floor.rotation.x = -Math.PI/2;
scene.add(floor);

/* =========================
   JOYSTICK
========================= */
let joy={x:0,y:0};
let base=document.getElementById("joyBase");
let stick=document.getElementById("joyStick");

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
   ROOMS
========================= */
let chunks=[];

function createChunk(z){

  let g=new THREE.Group();

  let floorSeg = new THREE.Mesh(
    new THREE.BoxGeometry(20,1,20),
    new THREE.MeshStandardMaterial({color:0x123f1c})
  );
  floorSeg.position.set(0,0,z);
  g.add(floorSeg);

  let wallMat=new THREE.MeshStandardMaterial({color:0x111111});

  let w1=new THREE.Mesh(new THREE.BoxGeometry(1,4,20),wallMat);
  let w2=new THREE.Mesh(new THREE.BoxGeometry(1,4,20),wallMat);

  w1.position.set(-10,2,z);
  w2.position.set(10,2,z);

  g.add(w1); g.add(w2);

  /* FLOWERS */
  g.userData.flowers=[];
  for(let i=0;i<6;i++){
    let f=new THREE.Mesh(
      new THREE.SphereGeometry(0.3),
      new THREE.MeshStandardMaterial({color:0x33ff88})
    );
    f.position.set((Math.random()-0.5)*15,0.3,z+(Math.random()-0.5)*15);
    g.add(f);
    g.userData.flowers.push(f);
  }

  /* GATE */
  let gate=new THREE.Mesh(
    new THREE.BoxGeometry(4,4,1),
    new THREE.MeshStandardMaterial({color:0x00aaff,wireframe:true})
  );
  gate.position.set(0,2,z-10);
  g.add(gate);
  g.userData.gate=gate;

  scene.add(g);
  chunks.push(g);
}

/* INIT */
for(let i=0;i<6;i++){
  createChunk(-i*20);
}

/* =========================
   ENTITIES
========================= */

/* SEEING MAN */
let seeingMan=null;

function spawnSeeingMan(){
  seeingMan=new THREE.Mesh(
    new THREE.BoxGeometry(1,2,1),
    new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:0.2})
  );
  seeingMan.position.set(0,1,-20);
  scene.add(seeingMan);
}

/* LOOK AT ME */
let lookAtMe=null;
let lookTimer=0;

function spawnLookAtMe(){
  lookAtMe=new THREE.Mesh(
    new THREE.SphereGeometry(1),
    new THREE.MeshStandardMaterial({color:0xffffff})
  );
  lookAtMe.position.set(0,2,-15);
  scene.add(lookAtMe);
  lookTimer=10;
}

/* RUNNER */
let runner=null;
let runnerActive=false;

function spawnRunner(){
  runner=new THREE.Mesh(
    new THREE.BoxGeometry(2,3,2),
    new THREE.MeshStandardMaterial({color:0xff0000})
  );
  runner.position.set(0,1,-30);
  scene.add(runner);
  runnerActive=true;
}

/* =========================
   RAIN
========================= */
let rain=[];
for(let i=0;i<300;i++){
  let d=new THREE.Mesh(
    new THREE.BoxGeometry(0.05,0.5,0.05),
    new THREE.MeshBasicMaterial({color:0xaaaaaa})
  );
  d.position.set((Math.random()-0.5)*60,Math.random()*20,(Math.random()-0.5)*60);
  scene.add(d);
  rain.push(d);
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

  let speed=0.08;

  let fwd=new THREE.Vector3(0,0,-1).applyQuaternion(player.quaternion);
  let right=new THREE.Vector3(1,0,0).applyQuaternion(player.quaternion);

  player.position.addScaledVector(fwd,joy.y*speed);
  player.position.addScaledVector(right,joy.x*speed);

  camera.position.copy(player.position);

  /* FLASHLIGHT FOLLOW */
  light.position.copy(camera.position);

  /* SPAWN CHUNKS */
  if(player.position.z < -(chunks.length-2)*20){
    createChunk(-chunks.length*20);
  }

  /* FLOWER DAMAGE */
  chunks.forEach(c=>{
    c.userData.flowers.forEach(f=>{
      if(player.position.distanceTo(f.position)<1){
        hp-=0.2;
      }
    });
  });

  /* SEEING MAN */
  if(seeingMan){
    let dist=camera.position.distanceTo(seeingMan.position);
    if(dist<6){
      hp-=0.05;
    }
  }

  /* LOOK AT ME */
  if(lookAtMe){
    lookTimer -= 0.016;
    if(lookTimer<=0){
      hp-=50;
      scene.remove(lookAtMe);
      lookAtMe=null;
    }
  }

  /* RUNNER */
  if(runnerActive){
    let dir=player.position.clone().sub(runner.position).normalize();
    runner.position.add(dir.multiplyScalar(0.1));

    if(player.position.distanceTo(runner.position)<2){
      hp=0;
    }
  }

  /* GATES */
  chunks.forEach(c=>{
    let g=c.userData.gate;
    if(player.position.distanceTo(g.position)<3){

      gateCount++;
      document.getElementById("gate").innerText=gateCount;

      if(gateCount==5) spawnSeeingMan();
      if(gateCount==10) spawnLookAtMe();
      if(gateCount>=19 && gateCount<=24) spawnRunner();
    }
  });

  /* RAIN */
  rain.forEach(r=>{
    r.position.y-=0.5;
    if(r.position.y<0) r.position.y=20;
  });

  /* UI */
  document.getElementById("hp").innerText=Math.floor(hp);

  if(hp<=0){
    document.body.style.background="red";
    setTimeout(()=>location.reload(),1500);
  }
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
