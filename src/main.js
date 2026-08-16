try {

const maxFPS = 60;
let lastTime = performance.now();

const g = 30; //pixels per second squared
const jumpHeight = 350; //pixels
const friction = 0.9; //friction coefficient
let airFriction = 0.99; //air friction coefficient
let acceleration = 40; //pixels per second squared

const player = new Player({}, 792.763, 429.633);
const camera = new Camera([8,100], player);
window.player = player;
window.camera = camera;

let falling = 0
let keys = {}

let godMode = false;
window.godMode = godMode;

if (godMode) {airFriction = 0.9}

function isColliding(element1, element2) {
  const rect1 = element1.getBoundingClientRect();
  const rect2 = element2.getBoundingClientRect();

  const isOverlapping =
    rect1.left < rect2.right &&
    rect1.right > rect2.left &&
    rect1.top < rect2.bottom &&
    rect1.bottom > rect2.top;

  return isOverlapping;
}

function checkCollision(opt) {
    for (const ground of document.querySelectorAll(".ground:not(.text)")) {
        if (isColliding(player.element, ground)) {
            return true;
        }
    }
    return false;
}

function move() {
    falling += 1;
    let last;
    let steps = Math.floor(Math.abs(player.vx/maxFPS*2) + Math.abs(player.vy/maxFPS*2)) + 1;

    for (let i = 0; i < steps; i++) {
        last = player.x;
        player.changeX(player.vx/maxFPS/steps);
        if (checkCollision()) {
            player.setX(last);
            player.setVelocityX(0);
        }

        last = player.y;
        player.changeY(-player.vy/maxFPS/steps);
        if (checkCollision()) {
            player.setY(last);
            if (player.vy < 0) {
                falling = 0;
            }
            player.setVelocityY(0);
        }
    }

    if (player.y > window.innerHeight * 2) {
        player.respawn();
    }
}

function physics() {
    if (!godMode) {
        player.addVelocityY(-g);
    }

    const left = keys["KeyA"] || keys["ArrowLeft"];
    const right = keys["KeyD"] || keys["ArrowRight"];
    const jump = keys["KeyW"] || keys["ArrowUp"] || keys["Space"];
    const down = keys["KeyS"] || keys["ArrowDown"];

    if (!godMode) {
        if (down) {
            acceleration = 20;
        } else if (keys["ShiftLeft"]) {
            acceleration = 60;
        } else {
            acceleration = 40;
        }
    } else {
        acceleration = 100;
    }

    player.addVelocity(
        (right ? acceleration : 0) - (left ? acceleration : 0),
        (jump && falling < 3 && !godMode ? jumpHeight : (jump && godMode ? acceleration : 0)) - (godMode && down ? acceleration : 0)
    )

    player.setVelocity(player.vx * friction, player.vy * airFriction);

    if (godMode) {
        player.changePosition(player.vx/maxFPS, -player.vy/maxFPS);
    } else {
        move();
    }

    if (camera.focus.x - (camera.x + window.innerWidth / 2) > window.innerWidth / camera.viewport[0]) {
        camera.moveCamera((camera.focus.x - (camera.viewport[0] / 2 + 1) * window.innerWidth / camera.viewport[0] - camera.x) / camera.speed , 0);
    } else if (camera.focus.x - (camera.x + window.innerWidth / 2) < -window.innerWidth / camera.viewport[0]) {
        camera.moveCamera((camera.focus.x - (camera.viewport[0] / 2 - 1) * window.innerWidth / camera.viewport[0] - camera.x) / camera.speed, 0);
    }

    if (camera.focus.y - (camera.y + window.innerHeight / 2) > window.innerHeight / camera.viewport[1]) {
        camera.moveCamera(0, (camera.focus.y - (camera.viewport[1] / 2 + 1) * window.innerHeight / camera.viewport[1] - camera.y) / camera.speed);
    } else if (camera.focus.y - (camera.y + window.innerHeight / 2) < -window.innerHeight / camera.viewport[1]) {
        camera.moveCamera(0, (camera.focus.y - (camera.viewport[1] / 2 - 1) * window.innerHeight / camera.viewport[1] - camera.y) / camera.speed);
    }
}

document.addEventListener("keydown", function(event) {
    if (this.activeElement.tagName.toLowerCase() != "p") {
        if (!event.ctrlKey) {
            keys[event.code] = true;
        }
    }

    if (event.ctrlKey){
        if (event.code == "KeyD" ||
            event.code == "KeyS"
        ) {
            event.preventDefault();
        }
    }
});

document.addEventListener("keyup", function(event) {
    delete keys[event.code];
});

document.addEventListener("contextmenu", e => {e.preventDefault()});

setInterval(function() {
    try {
        physics();
    } catch(error) {
        alert(error.stack);
    }
}, 1000 / maxFPS);

} catch(error) {
    alert(error.stack);
}