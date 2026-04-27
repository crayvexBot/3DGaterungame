/* ======================
   BASIC SETUP
====================== */
let scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 5, 40);

let camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);

let renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

/* LIGHT */
let light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5,10,5);
scene.add(light);

/* FLOOR */
let floor = new THREE.Mesh(
  new THREE.PlaneGeometry(200,200),
  new THREE.MeshStandardMaterial({color:0x1f4d2a})
);
floor.rotation.x = -Math.PI/2;
scene.add(floor);

/* PLAYER */
let player = new THREE.Mesh(
  new THREE.BoxGeometry(1,1,1),
  new THREE.MeshStandardMaterial({color:0xffffff})
);
scene.add(player);

camera.position.set(0,2,5);

/* ======================
   VARIABLES
====================== */
let hp = 100;
let gate = 1;

let keys = {};

/* ======================
   INPUT
====================== */
document.addEventListener("keydown", e => keys[e.key]=true);
document.addEventListener("keyup", e => keys[e.key]=false);

/* ======================
   GATES SYSTEM
====================== */
let gates = [];

function generateGates(){

  gates.forEach(g=>scene.remove(g));
  gates = [];

  for(let i=0;i<8;i++){

    let g = new THREE.Mesh(
      new THREE.BoxGeometry(5,5,1),
      new THREE.MeshStandardMaterial({color:0x4444ff, wireframe:true})
    );

    g.position.set(
      (Math.random()-0.5)*20,
      2,
      -i*15
    );

    scene.add(g);
    gates.push(g);
  }
}

generateGates();

/* ======================
   ENTITIES
====================== */
let lookAtMe = null;
let seeingMan = null;

/* LOOK AT ME */
function spawnLookAtMe(){

  lookAtMe = new THREE.Mesh(
    new THREE.SphereGeometry(1),
    new THREE.MeshStandardMaterial({
      color:0xffffff,
      transparent:true,
      opacity:0.5
    })
  );

  lookAtMe.position.set(
    (Math.random()-0.5)*10,
    2,
    player.position.z - 10
  );

  scene.add(lookAtMe);

  let timer = 10;

  let t = setInterval(()=>{
    timer--;

    if(timer <= 0){
      damage(50);
      scene.remove(lookAtMe);
      lookAtMe = null;
      clearInterval(t);
    }
  },1000);
}

/* SEEING MAN */
function spawnSeeingMan(){

  seeingMan = new THREE.Mesh(
    new THREE.BoxGeometry(1,2,1),
    new THREE.MeshStandardMaterial({
      color:0xffffff,
      transparent:true,
      opacity:0.3
    })
  );

  seeingMan.position.set(
    (Math.random()-0.5)*15,
    1,
    player.position.z - 8
  );

  scene.add(seeingMan);
}

/* ======================
   DAMAGE + DEATH
====================== */
function damage(a){
  hp -= a;
  document.getElementById("hp").innerText = hp;

  if(hp <= 0){
    jumpscare();
  }
}

function jumpscare(){
  document.getElementById("jumpscare").style.display = "flex";
  setTimeout(()=>location.reload(),2000);
}

/* ======================
   GATE TRIGGER
====================== */
function checkGates(){

  gates.forEach(g=>{

    if(player.position.distanceTo(g.position) < 2){

      gate++;
      document.getElementById("gate").innerText = gate;

      player.position.z -= 10;

      generateGates();

      triggerEvents();
    }
  });
}

/* ======================
   EVENTS PER GATE
====================== */
function triggerEvents(){

  // fog randomness
  if(Math.random() < 0.4){
    scene.fog.density = 0.05;
  } else {
    scene.fog.density = 0.01;
  }

  // Look At Me spawn
  if(Math.random() < 0.5){
    spawnLookAtMe();
  }

  // Seeing Man spawn
  if(Math.random() < 0.3){
    spawnSeeingMan();
  }
}

/* ======================
   MOVEMENT
====================== */
function update(){

  let speed = 0.15;

  if(keys["w"]) player.position.z -= speed;
  if(keys["s"]) player.position.z += speed;
  if(keys["a"]) player.position.x -= speed;
  if(keys["d"]) player.position.x += speed;

  camera.position.x = player.position.x;
  camera.position.z = player.position.z + 5;
  camera.position.y = 2;

  camera.lookAt(player.position);

  checkGates();

  /* Seeing Man damage */
  if(seeingMan){
    if(camera.position.distanceTo(seeingMan.position) < 4){
      if(Math.random() < 0.02){
        damage(3);
      }
    }
  }
}

/* ======================
   LOOP
====================== */
function animate(){
  requestAnimationFrame(animate);
  update();
  renderer.render(scene,camera);
}

animate();
