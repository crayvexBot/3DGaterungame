/* =========================
   SAFE START SYSTEM
========================= */
window.onload = function(){

  const elevator = document.getElementById("elevator");
  const loading = document.getElementById("loading");

  setTimeout(()=>{
    if(elevator) elevator.style.display = "none";
    if(loading) loading.style.display = "flex";

    setTimeout(()=>{
      if(loading) loading.style.display = "none";
    },1500);

  },2000);
};

/* FORCE REMOVE UI IF ERROR */
window.onerror = function(){
  let elevator = document.getElementById("elevator");
  let loading = document.getElementById("loading");

  if(elevator) elevator.style.display="none";
  if(loading) loading.style.display="none";
};

/* =========================
   SAFE INIT
========================= */
if(typeof THREE === "undefined"){
  alert("THREE.js failed to load!");
}

/* =========================
   SCENE
========================= */
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0a0a0a, 10, 80);

const camera = new THREE.PerspectiveCamera(75, innerWidth/window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

/* =========================
   LIGHT
========================= */
const ambient = new THREE.AmbientLight(0x404040, 1.2);
scene.add(ambient);

const light = new THREE.PointLight(0xffffff, 1.5, 25);
scene.add(light);

/* =========================
   PLAYER
========================= */
const player = new THREE.Object3D();
scene.add(player);

camera.position.set(0,1.6,0);
player.add(camera);

let yaw = 0;

/* LOOK */
document.addEventListener("mousemove", e=>{
  yaw -= e.movementX * 0.002;
  player.rotation.y = yaw;
});

let lastX = null;

document.addEventListener("touchmove", e=>{
  if(e.touches.length !== 1) return;

  let x = e.touches[0].clientX;

  if(lastX !== null){
    yaw -= (x - lastX) * 0.005;
    player.rotation.y = yaw;
  }

  lastX = x;
});

/* =========================
   FLOOR
========================= */
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(500,500),
  new THREE.MeshStandardMaterial({color:0x1f6b2e})
);
floor.rotation.x = -Math.PI/2;
scene.add(floor);

/* =========================
   JOYSTICK SAFE INIT
========================= */
let joy = {x:0,y:0};

const base = document.getElementById("joyBase");
const stick = document.getElementById("joyStick");

if(base && stick){

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

}

/* =========================
   ROOMS
========================= */
let chunks=[];

function createChunk(z){

  let g=new THREE.Group();

  let seg=new THREE.Mesh(
    new THREE.BoxGeometry(20,1,20),
    new THREE.MeshStandardMaterial({color:0x1f6b2e})
  );
  seg.position.set(0,0,z);
  g.add(seg);

  let wallMat=new THREE.MeshStandardMaterial({color:0x222222});

  let w1=new THREE.Mesh(new THREE.BoxGeometry(1,4,20),wallMat);
  let w2=new THREE.Mesh(new THREE.BoxGeometry(1,4,20),wallMat);

  w1.position.set(-10,2,z);
  w2.position.set(10,2,z);

  g.add(w1); g.add(w2);

  g.userData.flowers=[];
  for(let i=0;i<6;i++){
    let f=new THREE.Mesh(
      new THREE.SphereGeometry(0.3),
      new THREE.MeshStandardMaterial({color:0x66ff99})
    );

    f.position.set(
      (Math.random()-0.5)*15,
      0.3,
      z+(Math.random()-0.5)*15
    );

    g.add(f);
    g.userData.flowers.push(f);
  }

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
   ENEMY
========================= */
const enemy=new THREE.Mesh(
  new THREE.BoxGeometry(1,2,1),
  new THREE.MeshStandardMaterial({color:0xff0000})
);
enemy.position.set(5,1,-20);
scene.add(enemy);

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

  player.position.addScaledVector(fwd,-joy.y*speed);
  player.position.addScaledVector(right,joy.x*speed);

  camera.position.copy(player.position);
  light.position.copy(camera.position);

  if(player.position.z < -(chunks.length-2)*20){
    createChunk(-chunks.length*20);
  }

  chunks.forEach(c=>{

    c.userData.flowers.forEach(f=>{
      if(player.position.distanceTo(f.position)<1){
        hp -= 0.2;
      }
    });

    let g=c.userData.gate;
    if(player.position.distanceTo(g.position)<3){
      gateCount++;
      document.getElementById("gate").innerText=gateCount;
    }

  });

  let dir=player.position.clone().sub(enemy.position).normalize();
  enemy.position.add(dir.multiplyScalar(0.04));

  document.getElementById("hp").innerText=Math.floor(hp);

  if(player.position.distanceTo(enemy.position)<2){
    document.body.style.background="red";
    setTimeout(()=>location.reload(),1200);
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
