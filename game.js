/* =========================
   THREE.JS SETUP
========================= */
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

/* =========================
   GAME STATE
========================= */
let hp = 100;
let gate = 1;

/* =========================
   JOYSTICK SYSTEM
========================= */
let joy = {x:0, y:0};

let base = document.getElementById("joyBase");
let stick = document.getElementById("joyStick");

let dragging = false;

base.addEventListener("touchstart", e=>{
  dragging = true;
});

base.addEventListener("touchend", e=>{
  dragging = false;
  joy.x = 0;
  joy.y = 0;

  stick.style.left = "35px";
  stick.style.top = "35px";
});

base.addEventListener("touchmove", e=>{

  if(!dragging) return;

  let t = e.touches[0];
  let rect = base.getBoundingClientRect();

  let dx = t.clientX - rect.left - 60;
  let dy = t.clientY - rect.top - 60;

  let dist = Math.sqrt(dx*dx + dy*dy);
  let max = 40;

  if(dist > max){
    dx = dx/dist * max;
    dy = dy/dist * max;
  }

  joy.x = dx/max;
  joy.y = dy/max;

  stick.style.transform = `translate(${dx}px,${dy}px)`;
});

/* =========================
   GATES
========================= */
let gates = [];

function generateGates(){

  gates.forEach(g=>scene.remove(g));
  gates = [];

  for(let i=0;i<6;i++){

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

/* =========================
   ENTITIES
========================= */
let lookAtMe = null;

/* LOOK AT ME */
function spawnLookAtMe(){

  lookAtMe = new THREE.Mesh(
    new THREE.SphereGeometry(1),
    new THREE.MeshStandardMaterial({color:0xffffff, transparent:true, opacity:0.5})
  );

  lookAtMe.position.set(
    (Math.random()-0.5)*10,
    2,
    player.position.z - 10
  );

  scene.add(lookAtMe);

  let t = 10;

  let timer = setInterval(()=>{
    t--;
    if(t<=0){
      damage(50);
      scene.remove(lookAtMe);
      lookAtMe = null;
      clearInterval(timer);
    }
  },1000);
}

/* =========================
   DAMAGE
========================= */
function damage(a){
  hp -= a;
  document.getElementById("hp").innerText = hp;

  if(hp <= 0){
    document.getElementById("jumpscare").style.display = "flex";
    setTimeout(()=>location.reload(),2000);
  }
}

/* =========================
   GATE SYSTEM
========================= */
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

/* =========================
   EVENTS
========================= */
function triggerEvents(){

  if(Math.random()<0.4){
    scene.fog.density = 0.05;
  } else {
    scene.fog.density = 0.01;
  }

  if(Math.random()<0.5){
    spawnLookAtMe();
  }
}

/* =========================
   UPDATE LOOP
========================= */
function update(){

  let speed = 0.15;

  player.position.x += joy.x * speed;
  player.position.z += joy.y * speed;

  camera.position.x = player.position.x;
  camera.position.z = player.position.z + 5;
  camera.position.y = 2;

  camera.lookAt(player.position);

  checkGates();
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
