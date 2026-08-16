try {

const level = document.querySelector("#level");
const materials = document.querySelector("#materials");

function createElement(x=0, y=0, size=[50, 50], type="grass", nbt={}) {
    let element = document.createElement("rect");
    element.classList.add("ground");
    element.classList.add(type);
    element.style.top = `${y}px`
    element.style.left = `${x}px`
    element.style.width = `${size[0]}px`;
    element.style.height = `${size[1]}px`;

    if (type == "text") {
        const t = document.createElement("p");
        t.spellcheck = false;
        element.appendChild(t);
        if (!window.godMode) {
            element.style.border = "none";
        } else {
            t.contentEditable = true;
        }
        if (nbt.text && typeof nbt.text == "string") {
            t.textContent = nbt.text;
        }
        if (nbt.font && typeof nbt.font == "string") {
            t.style.fontFamily = nbt.font;
        }

        let onscreen = true;

        window.camera.addEventListener("move", function() {
                const rect = t.getBoundingClientRect();

                if (!onscreen && rect.left < window.innerWidth &&
                    rect.right > 0 &&
                    rect.top > 0 &&
                    rect.bottom < window.innerHeight) {
                    const text = t.getAttribute("data-text");
                    t.textContent = "";

                    let i = 0;
                    function type() {
                        if (i < text.length) {
                            t.textContent += text.charAt(i);
                            i++;
                            setTimeout(type, 100);
                        } else {
                            t.removeAttribute("data-text");
                        }
                    }

                    setTimeout(type, 500);
                } else if (!onscreen) {
                    t.setAttribute("data-text", t.textContent);
                }

                onscreen = (
                    rect.left < window.innerWidth &&
                    rect.right > 0 &&
                    rect.top > 0 &&
                    rect.bottom < window.innerHeight
                );
            }); 
    }

    level.appendChild(element);

    return element
}

function compileLevel() {
    let data = [];

    for (let ground of level.getElementsByClassName("ground")) {
        let gdata = {};
        gdata.type = ground.classList[1];
        gdata.x = (parseFloat(parseFloat(ground.style.left).toFixed(2))||0) + window.camera.x;
        gdata.y = (parseFloat(parseFloat(ground.style.top).toFixed(2))||0) + window.camera.y;
        gdata.width = parseFloat(parseFloat(ground.style.width).toFixed(2))||50;
        gdata.height = parseFloat(parseFloat(ground.style.height).toFixed(2))||50;
        gdata.nbt = {};
        
        if (gdata.type == "text") {
            const p = ground.getElementsByTagName("p")[0];
            gdata.nbt.text = p.getAttribute("data-text") ? p.getAttribute("data-text") : p.textContent;
            gdata.nbt.font = p.style.fontFamily;
        }

        data.push(gdata);
    }

    return data;
}

function exportLevel() {
    const data = compileLevel();
    const jsonString = JSON.stringify(data);
    const file = new Blob([jsonString], {type: 'application/json'});
    const url = URL.createObjectURL(file);

    const a = document.createElement("a");
    a.href = url;
    a.download = "level.json";
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
}

function checkNum(n) {
    return typeof n === 'number' && !Number.isNaN(n)
}

function importLevel(file) {
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const jsonData = JSON.parse(e.target.result);
            console.log(jsonData);
            
            for (const gdata of jsonData) {
                if (
                    !(gdata.x != undefined && checkNum(gdata.x) &&
                    gdata.y != undefined && checkNum(gdata.y) &&
                    gdata.width != undefined && checkNum(gdata.width) &&
                    gdata.height != undefined && checkNum(gdata.height))
                ) {throw new Error("Error loading level data: outdated or incorrect data!")};
            }

            level.replaceChildren("");
            for (const gdata of jsonData) {
                createElement(
                    gdata.x - window.camera.x,
                    gdata.y - window.camera.y,
                    [gdata.width, gdata.height],
                    gdata.type,
                    gdata.nbt
                )
            }

            window.player.respawn();
        };
        reader.readAsText(file);
    }
}

const fileImport = document.createElement("input");
fileImport.type = "file";
fileImport.accept = "application/json";
fileImport.addEventListener("change", function(e) {
    importLevel(this.files[0]);
});

document.addEventListener("keypress", function(e) {
    if (e.ctrlKey && e.code == "KeyI") {
        fileImport.click();
    }
});

if (window.godMode) {
    const outline = document.createElement("div");
    outline.classList.add("edittools");
    outline.id = "outline";

    const resize = document.createElement("div");
    resize.classList.add("edittools");
    resize.id = "resize";

    const preview = document.createElement("div");
    preview.classList.add("edittools");
    preview.id = "preview";

    let material = "grass";
    const materialsList = [
        "grass",
        "dirt",
        "sand",
        "stone",
        "text"
    ];

    let font = "sans-serif"
    const fontsList = [
        "sans-serif",
        "monospace",
        "cursive",
        "serif",
        "fantasy"
    ];

    let spawn = createElement(793, 430, [50, 50], "spawn");
    spawn.classList.remove("ground");

    for (const m of materialsList) {
        const button = document.createElement("div");
        button.classList.add(m);
        materials.appendChild(button);

        if (m == "text") {
            button.textContent = "T";
            button.style.fontFamily = fontsList[0];
            button.style.fontSize = "7vh";
            button.style.textAlign = "center";
        }

        if (button.classList.contains(material)) {
            button.style.outline = "white solid 5px";
        } else {
            button.style.outline = "white dashed 5px";
        }

        materials.style.width = `${(button.clientWidth + 15) * materialsList.length}px`;

        button.addEventListener("mousedown", function() {
            if (material == "text") {
                button.style.fontFamily = fontsList[fontsList.indexOf(button.style.fontFamily) + 1 > fontsList.length ? 0 : (fontsList.indexOf(button.style.fontFamily) + 1)];
                font = button.style.fontFamily;
            }
            material = button.classList[0];
            for (const button of materials.children) {
                if (button.classList.contains(material)) {
                    button.style.outline = "white solid 5px";
                } else {
                    button.style.outline = "white dashed 5px";
                }
            }
        });
    }

    let moveElement;
    let scaleElement;
    let offsetX = 0;
    let offsetY = 0;
    let mouseX = 0;
    let mouseY = 0

    function move(e) {
        moveElement.style.left = `${mouseX - offsetX}px`;
        moveElement.style.top = `${mouseY - offsetY}px`;
        moveSnap(moveElement);
    }

    function scale(e) {
        scaleElement.style.width = `${Math.max(mouseX - (parseFloat(scaleElement.style.left)||0) + 30 - offsetX, 50)}px`;
        scaleElement.style.height = `${Math.max(mouseY - (parseFloat(scaleElement.style.top)||0) + 30 - offsetY, 50)}px`;
        scaleSnap(scaleElement);
    }

    function scalePreview() {
        let width = Math.abs(mouseX - offsetX + window.camera.x);
        let height = Math.abs(mouseY - offsetY + window.camera.y);
        
        preview.style.width = `${width}px`;
        preview.style.height = `${height}px`;
        scaleSnap(preview);
        width = parseFloat(preview.style.width);
        height = parseFloat(preview.style.height);

        if (preview.style.aspectRatio == "1 / 1") {
            if (width > height) {
                height = width;
            } else {
                width = height;
            }
            preview.style.top = `${mouseY > offsetY - window.camera.y ? offsetY - window.camera.y : offsetY - window.camera.y - height}px`;
            preview.style.left = `${mouseX > offsetX - window.camera.x ? offsetX - window.camera.x : offsetX - window.camera.x - width}px`;
        } else {
            preview.style.top = `${mouseY > offsetY - window.camera.y ? offsetY - window.camera.y : mouseY}px`;
            preview.style.left = `${mouseX > offsetX - window.camera.x ? offsetX - window.camera.x : mouseX}px`;
        }

        preview.style.width = `${width}px`;
        preview.style.height = `${height}px`;
    }

    function getNearestEdge(element, range=15) {
        let left;
        let right;
        let top;
        let bottom;

        const rect1 = element.getBoundingClientRect();
        for (const ground of level.querySelectorAll(".ground")) {
            if (ground.isEqualNode(element)) {continue}

            const rect2 = ground.getBoundingClientRect();
            if (rect2.top - rect1.height - range <= rect1.top && rect2.bottom + rect1.height + range >= rect1.bottom) {
                left = (left && (Math.abs(rect2.left - rect1.left) < Math.abs(left - rect1.left))) || Math.abs(rect1.left - rect2.left) <= range ? rect2.left : left;
                left = (left && (Math.abs(rect2.right - rect1.left) < Math.abs(left - rect1.left))) || Math.abs(rect2.right - rect1.left) <= range ? rect2.right : left;

                right = (right && (Math.abs(rect1.right - rect2.right) < Math.abs(rect1.right - right))) || Math.abs(rect1.right - rect2.right) <= range ? rect2.right: right;
                right = (right && (Math.abs(rect1.right - rect2.left) < Math.abs(rect1.right - right))) || Math.abs(rect1.right - rect2.left) <= range ? rect2.left: right;
            }

            if (rect2.right + rect1.width + range >= rect1.right && rect2.left - rect1.width - range <= rect1.left) {
                top = (top && (Math.abs(rect2.top - rect1.top) < Math.abs(top - rect1.top))) || Math.abs(rect1.top - rect2.top) <= range ? rect2.top : top;
                top = (top && (Math.abs(rect2.bottom - rect1.top) < Math.abs(top - rect1.top))) || Math.abs(rect2.bottom - rect1.top) <= range ? rect2.bottom : top;

                bottom = (bottom && (Math.abs(rect1.bottom - rect2.bottom) < Math.abs(rect1.bottom - bottom))) || Math.abs(rect1.bottom - rect2.bottom) <= range ? rect2.bottom: bottom;
                bottom = (bottom && (Math.abs(rect1.bottom - rect2.top) < Math.abs(rect1.bottom - bottom))) || Math.abs(rect1.bottom - rect2.top) <= range ? rect2.top: bottom;
            }
        }

        let ret = {};
        if (left) {ret["left"] = left}
        if (right) {ret["right"] = right}
        if (top) {ret["top"] = top}
        if (bottom) {ret["bottom"] = bottom}

        return ret;
    }

    function moveSnap(element) {
        const edges = getNearestEdge(element);

        for (const edge in edges) {
            switch (edge) {
                case "left":
                    element.style.left = `${edges.left}px`;
                    break;
                case "right":
                    element.style.left = `${edges.right - parseFloat(element.style.width)}px`;
                    break;
                case "top":
                    element.style.top = `${edges.top}px`;
                    break;
                case "bottom":
                    element.style.top = `${edges.bottom - parseFloat(element.style.height)}px`;
                    break;
            }
        }
    }

    function scaleSnap(element) {
        const edges = getNearestEdge(element);

        for (const edge in edges) {
            switch (edge) {
                case "right":
                    element.style.width = `${edges.right - parseFloat(element.style.left)}px`;
                    break;
                case "bottom":
                    element.style.height = `${edges.bottom - parseFloat(element.style.top)}px`;
                    break;
            }
        }
    }

    document.addEventListener("keydown", (e) => {
        if (e.ctrlKey) {
            switch (e.code) {
                case "KeyD":
                    let selected = level.querySelector("#selected");
                    if (selected) {
                        let element = selected.cloneNode();
                        element.removeAttribute("id");
                        element.replaceChildren("");
                        element.style["z-index"] = -1
                        level.appendChild(element);
                    }
                    break;
                case "KeyS":
                    exportLevel();
                    break;
            }
        } else {
            switch (e.code) {
                case "Delete":
                    let selected = level.querySelector("#selected");
                    if (selected) {
                        selected.remove();
                    }
                    break;
                case "KeyR":
                    if (this.activeElement.tagName.toLowerCase() != "p") {
                        window.player.respawn();
                    }
                    break;
                case "ShiftLeft":
                    preview.style.aspectRatio = 1;
            }
        }
    });

    window.addEventListener("keyup", (e) => {
        if (e.code == "ShiftLeft") {
            preview.style.aspectRatio = "auto";
        }
    });

    document.addEventListener("mousedown", function(e) {
        mouseX = e.x;
        mouseY = e.y;

        const element = !e.target.classList.contains("edittools") && e.target.parentElement && e.target.parentElement.classList.contains("ground") ? e.target.parentElement : e.target;

        if (e.button == 2 && element.id != "selected") {
            offsetX = e.x + window.camera.x;
            offsetY = e.y + window.camera.y;

            document.body.appendChild(preview);
            preview.appendChild(outline);
            scalePreview();
        } else if (!element.classList.contains("edittools") && element.id != "selected") {
            let selected = level.querySelector("#selected");
            if (selected) {
                selected.removeAttribute("id");
                for (const el of selected.querySelectorAll(".edittools")) {el.remove()}
                selected.style["z-index"] = -1;
            }

            if (element.classList.contains("ground")) {
                element.id = "selected";
                element.appendChild(outline);
                element.appendChild(resize);
                element.style["z-index"] = 0;
            }
        }

        if (e.button == 0) {
            if (element.id == "selected") {
                moveElement = element;
                offsetX = e.offsetX;
                offsetY = e.offsetY;
                element.classList.add("moving");
            } else if (e.target.id == "resize") {
                scaleElement = e.target.parentElement;
                offsetX = e.offsetX;
                offsetY = e.offsetY;
                e.target.parentElement.classList.add("scaling");
            }
        }
    });

    document.addEventListener("mouseup", function(e) {
        mouseX = e.x;
        mouseY = e.y;

        if (moveElement) {
            moveElement.classList.remove("moving");
        }
        moveElement = null;
        if (scaleElement) {
            scaleElement.classList.remove("scaling");
        }
        scaleElement = null;

        if (this.body.querySelector("#preview") && e.button == 2) {
            if (parseFloat(preview.style.width) >= 50 && parseFloat(preview.style.height) >= 50) {
                let selected = level.querySelector("#selected");
                if (selected) {
                    selected.removeAttribute("id");
                    for (const el of selected.querySelectorAll(".edittools")) {el.remove()}
                    selected.style["z-index"] = -1;
                }

                let element = createElement(
                    e.x > parseFloat(preview.style.left)||0 ? parseFloat(preview.style.left)||0 : e.x,
                    e.y > parseFloat(preview.style.top)||0 ? parseFloat(preview.style.top)||0 : e.y,
                    [parseFloat(preview.style.width), parseFloat(preview.style.height)],
                    material,
                    material == "text" ? {font: font} : undefined
                );

                element.id = "selected";
                element.appendChild(outline);
                element.appendChild(resize);
                element.style["z-index"] = 0;
            }
            preview.remove();
        }
    });

    document.addEventListener("mousemove", function(e) {
        mouseX = e.x;
        mouseY = e.y;
        if (moveElement) {
            move();
        }
        if (scaleElement) {
            scale();
        }

        if (this.body.querySelector("#preview")) {
            scalePreview();
        }
    });

    window.camera.addEventListener("move", function() {
        if (scaleElement) {
            scale();
        }
        if (document.body.querySelector("#preview")) {
            scalePreview();
        }
    });
} else {
    materials.remove();
}

} catch(error) {
    alert(error.stack);
}