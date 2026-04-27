/* =========================
   BASIC SETUP
========================= */
let scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x111111, 5, 40);

let camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);

let renderer = new THREE.WebGLRenderer();
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

/* LIGHT */
let light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5,10,5);
scene.add(light);

/* PLAYER */
let player = new THREE.Mesh(
  new THREE.BoxGeometry(1,1,1),
  new THREE.MeshStandardMaterial({color:0xffffff})
);
scene.add(player);

/* FLOOR */
let floor = new THREE.Mesh(
  new THREE.PlaneGeometry(200,200),
  new THREE.MeshStandardMaterial({color:0x1f4d2a})
);
floor.rotation.x = -Math.PI/2;
scene.add(floor);

/* =========================
   MOBILE JOYSTICK
========================= */
let joy = {x:0, y:0};

let stick = document.getElementById("stick");
let joystick = document.getElementById("joystick");

joystick.addEventListener("touchmove", e=>{
  let t = e.touches[0];
  let rect = joystick.getBoundingClientRect();

  let dx = t.clientX - rect.left - 60;
  let dy = t.clientY - rect.top - 60;

  joy.x = dx/40;
  joy.y = dy/40;

  stick.style.transform = `translate(${dx}px,${dy}px)`;
});

/* =========================
   GAME VARIABLES
========================= */
let hp = 100;
let gate = 1;

/* =========================
   PROCEDURAL GATES
========================= */
function generateGate(){
  player.position.x = 0;
  player.position.z = 0;

  /* random fog density */
  scene.fog.density = Math.random()*0.05;
}

/* =========================
   MOVEMENT
========================= */
function update(){

  player.position.x += joy.x * 0.1;
  player.position.z += joy.y * 0.1;

  camera.position.x = player.position.x;
  camera.position.z = player.position.z + 5;
  camera.position.y = 2;

  camera.lookAt(player.position);

  /* fake hazard */
  if(Math.random()<0.001){
    damage(5);
  }
}

/* =========================
   HP
========================= */
function damage(a){
  hp -= a;
  document.getElementById("hp").innerText = hp;

  if(hp <= 0){
    jumpscare();
  }
}

/* =========================
   JUMPSCARE
========================= */
function jumpscare(){
  let sc = document.createElement("div");
  sc.id = "jumpscare";
  sc.innerHTML = "YOU DIED";

  document.body.appendChild(sc);
  sc.style.display = "flex";

  setTimeout(()=>location.reload(), 2000);
}

/* =========================
   ELEVATOR SYSTEM
========================= */
function startElevator(){

  document.getElementById("intro").style.display = "none";
  document.getElementById("elevator").style.display = "flex";

  setTimeout(()=>{

    document.getElementById("elevator").style.display = "none";
    document.getElementById("loading").style.display = "flex";

    setTimeout(()=>{

      document.getElementById("loading").style.display = "none";
      sceneInit();

    }, 3000);

  }, 5000);
}

/* =========================
   INIT GAME
========================= */
function sceneInit(){
  generateGate();
  animate();
}

/* =========================
   LOOP
========================= */
function animate(){
  requestAnimationFrame(animate);
  update();
  renderer.render(scene,camera);
}