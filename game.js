let gameStarted = false;

/* =========================
   START SYSTEM
========================= */
window.onload = function(){

  const elevator = document.getElementById("elevator");
  const loading = document.getElementById("loading");

  setTimeout(()=>{

    if(elevator) elevator.style.display = "none";
    if(loading) loading.style.display = "flex";

    setTimeout(()=>{
      if(loading) loading.style.display = "none";
      gameStarted = true;
    },1500);

  },2000);
};

/* =========================
   THREE SETUP
========================= */
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0a0a0a, 10, 90);

const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

/* LIGHT */
scene.add(new THREE.AmbientLight(0x404040, 1.2));

const light = new THREE.PointLight(0xffffff, 1.5, 30);
scene.add(light);

/* =========================
   PLAYER
========================= */
const player = new THREE.Object3D();
scene.add(player);

camera.position.set(0,1.6,0);
player.add(camera);

let yaw = 0;

document.addEventListener("mousemove", e=>{
  yaw -= e.movementX * 0.002;
  player.rotation.y = yaw;
});

/* =========================
   UI
========================= */
const eatBtn = document.getElementById("eatBtn");
const hpUI = document.getElementById("hp");
const foodUI = document.getElementById("food");

/* =========================
   JOYSTICK
========================= */
let joy = {x:0,y:0};

const base = document.getElementById("joyBase");
const stick = document.getElementById("joyStick");

if(base){

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
   WORLD SYSTEM
========================= */
let rooms = [];
let walls = [];
let foodItems = [];

let currentZ = 0;
const ROOM_SIZE = 25;

/* ROOM */
function createRoom(z){

  let g = new THREE.Group();

  let floor = new THREE.Mesh(
    new THREE.BoxGeometry(20,1,ROOM_SIZE),
    new THREE.MeshStandardMaterial({color:0x1f6b2e})
  );
  floor.position.set(0,0,z);
  g.add(floor);

  let wallMat = new THREE.MeshStandardMaterial({color:0x222});

  let left = new THREE.Mesh(new THREE.BoxGeometry(1,4,ROOM_SIZE), wallMat);
  let right = new THREE.Mesh(new THREE.BoxGeometry(1,4,ROOM_SIZE), wallMat);
  let back = new THREE.Mesh(new THREE.BoxGeometry(20,4,1), wallMat);

  left.position.set(-10,2,z);
  right.position.set(10,2,z);
  back.position.set(0,2,z+ROOM_SIZE/2);

  g.add(left,right,back);
  walls.push(left,right,back);

  /* GATE */
  let gate = new THREE.Mesh(
    new THREE.BoxGeometry(3,4,1),
    new THREE.MeshStandardMaterial({color:0x00aaff,wireframe:true})
  );

  gate.position.set((Math.random()-0.5)*6,2,z-ROOM_SIZE/2);
  g.add(gate);

  /* TABLE */
  let table = new THREE.Mesh(
    new THREE.BoxGeometry(4,1,2),
    new THREE.MeshStandardMaterial({color:0x8b5a2b})
  );

  table.position.set((Math.random()>0.5?4:-4),0.5,z+(Math.random()-2));
  g.add(table);

  /* FOOD */
  let food = new THREE.Mesh(
    new THREE.SphereGeometry(0.4),
    new THREE.MeshStandardMaterial({color:0xffcc66})
  );

  food.position.set(table.position.x,1.2,table.position.z);
  food.userData.eaten=false;

  g.add(food);
  foodItems.push(food);

  scene.add(g);
  rooms.push(g);
}

/* INIT */
for(let i=0;i<6;i++){
  createRoom(-i*ROOM_SIZE);
}

/* =========================
   COLLISION
========================= */
function checkCollision(pos){

  let box = new THREE.Box3().setFromCenterAndSize(
    pos,new THREE.Vector3(1,2,1)
  );

  for(let w of walls){
    if(box.intersectsBox(new THREE.Box3().setFromObject(w)))
      return true;
  }

  return false;
}

/* =========================
   HALLUCINATION
========================= */
let hallucination = new THREE.Mesh(
  new THREE.SphereGeometry(0.9),
  new THREE.MeshStandardMaterial({
    color:0xffffff,
    transparent:true,
    opacity:0.25
  })
);

hallucination.position.set(0,1,-20);
scene.add(hallucination);

/* =========================
   STATE
========================= */
let hp = 100;
let food = 100;
let nearFood = null;
let gateCount = 1;

/* =========================
   EAT BUTTON
========================= */
eatBtn.addEventListener("click",()=>{

  if(!nearFood) return;

  food = Math.min(100, food + 30);

  nearFood.userData.eaten = true;
  nearFood.visible = false;

});

/* =========================
   UPDATE
========================= */
function update(){

  if(!gameStarted) return;

  food -= 0.01;
  food = Math.max(0, food);

  let hungry = food < 30;

  /* MOVEMENT */
  let speed = 0.1;

  let forward = new THREE.Vector3(0,0,-1).applyQuaternion(player.quaternion);
  let right = new THREE.Vector3(1,0,0).applyQuaternion(player.quaternion);

  let move = new THREE.Vector3();
  move.addScaledVector(forward, joy.y*speed);
  move.addScaledVector(right, joy.x*speed);

  let newPos = player.position.clone().add(move);

  if(!checkCollision(newPos)){
    player.position.copy(newPos);
  }

  camera.position.copy(player.position);
  light.position.copy(player.position);

  /* FOOD CHECK */
  nearFood = null;

  for(let f of foodItems){

    if(f.userData.eaten) continue;

    if(player.position.distanceTo(f.position) < 2){
      nearFood = f;
    }
  }

  eatBtn.style.display = nearFood ? "flex" : "none";

  /* HALLUCINATION */
  if(hungry){

    hallucination.visible = true;

    let dir = player.position.clone().sub(hallucination.position).normalize();
    hallucination.position.add(dir.multiplyScalar(0.03));

    document.body.style.filter = "brightness(0.75) contrast(1.2)";

  }else{

    hallucination.visible = false;
    document.body.style.filter = "none";
  }

  /* UI */
  hpUI.innerText = Math.floor(hp);
  foodUI.innerText = Math.floor(food);
}

/* LOOP */
function animate(){
  requestAnimationFrame(animate);
  update();
  renderer.render(scene,camera);
}

animate();
