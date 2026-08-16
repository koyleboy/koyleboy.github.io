class Entity {
    constructor(type, nbt={}, x=0, y=0, vx=0, vy=0) {
        this.type = type;
        this.nbt = nbt;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.element = document.createElement("img");

        const entityElement = this.element;
        entityElement.classList.add("entity");
        entityElement.classList.add(type);
        entityElement.style.left = `${x}px`;
        entityElement.style.top = `${y}px`;
        entityElement.width = 50;
        entityElement.height = 50;
        document.body.appendChild(entityElement);
    }

    setVelocity(vx, vy) {
        this.vx = vx;
        this.vy = vy;
    }

    setVelocityX(vx) {
        this.vx = vx;
    }

    setVelocityY(vy) {
        this.vy = vy;
    }

    addVelocity(dvx, dvy) {
        this.vx += dvx;
        this.vy += dvy;
    }

    addVelocityX(dvx) {
        this.vx += dvx;
    }

    addVelocityY(dvy) {
        this.vy += dvy;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
        const entityElement = this.element;
        entityElement.style.left = `${x - window.camera.x}px`;
        entityElement.style.top = `${y - window.camera.y}px`;
    }

    setX(x) {
        this.x = x;
        const entityElement = this.element;
        entityElement.style.left = `${x - window.camera.x}px`;
    }

    setY(y) {
        this.y = y;
        const entityElement = this.element;
        entityElement.style.top = `${y - window.camera.y}px`;
    }

    changePosition(dx, dy) {
        this.x += dx;
        this.y += dy;
        const entityElement = this.element;
        entityElement.style.left = `${this.x - window.camera.x}px`;
        entityElement.style.top = `${this.y - window.camera.y}px`;
    }

    changeX(dx) {
        this.x += dx;
        const entityElement = this.element;
        entityElement.style.left = `${this.x - window.camera.x}px`;
    }

    changeY(dy) {
        this.y += dy;
        const entityElement = this.element;
        entityElement.style.top = `${this.y - window.camera.y}px`;
    }

    respawn() {
        this.setPosition(792.763, 429.633);
        this.setVelocity(0, 0);
        this.health = 100;
    }
}

class Player extends Entity {
    constructor(nbt={}, x=0, y=0, vx=0, vy=0, health=100) {
        super("player", nbt, x, y, vx, vy);
        this.health = health;
    }

    damage(amount) {
        this.health -= amount;
    }
}

class Mob extends Entity {
    constructor(type, nbt={}, x=0, y=0, vx=0, vy=0) {
        super(type, nbt, x, y, vx, vy);
        this.elemnent.classList.add("mob");
    }
}

class Zombie extends Mob {
    constructor(nbt={}, x=0, y=0, vx=0, vy=0) {
        super("zombie", nbt, x, y, vx, vy);
        this.health = 20;
        this.damage = 5;
    }
}