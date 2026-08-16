class Camera extends EventTarget {
    constructor(viewport=[8, 6], focus, speed=4) {
        if (! focus instanceof Entity) {
            alert(`Reference Error: ${focus} is not an entity!`);
        }
        super();
        this.x = 0;
        this.y = 0;
        this.focus = focus;
        this.viewport = viewport;
        this.speed = speed;
    }

    setPosition(x, y) {
        this.moveMap(Math.round(x) - this.x, Math.round(y) - this.y);
        this.x = Math.round(x);
        this.y = Math.round(y);
    }

    moveCamera(dx, dy) {
        this.x += Math.round(dx);
        this.y += Math.round(dy);
        this.moveMap(Math.round(dx), Math.round(dy))
    }

    moveMap(dx, dy) {
        const grounds = document.querySelectorAll(":not(.hud)");
        for (let i = 0; i < grounds.length; i++) {
            const ground = grounds[i];
            if (!ground.classList.contains("edittools") && !ground.classList.contains("moving")) {
                const currentLeft = parseFloat(ground.style.left) || 0;
                const currentTop = parseFloat(ground.style.top) || 0;
                ground.style.left = `${currentLeft - dx}px`;
                ground.style.top = `${currentTop - dy}px`;
            }
        }

        const event = new CustomEvent("move");
        this.dispatchEvent(event);
    }

    setFocus(e) {
        if (e instanceof Entity) {
            this.focus = e;
        } else {
            alert(`Reference Error: ${e} is not an entity!`);
        }
    }
}