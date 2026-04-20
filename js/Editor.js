import { ObjectID } from "./ObjectID.js";
import { IDToType } from "./ObjectID.js";

console.log("Editor.js loaded");

export class Editor {
    constructor(game) {
        this.game = game;

        this.camera = game.camera;
        this.grid = game.grid;

        this.selectedType = "block";
        this.level = [];

        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDown = false;
        this.mouseButton = null;

        this.selectedObjects = [];
        this.isSelecting = false;

        this.history = [];
        this.redoStack = [];

        this.bindInputs();
    }

    bindInputs() {
        if (this.game.paused) {
            return;
        }

        window.addEventListener("mousemove", e => {
            if (this.game.paused) {
                return;
            }

            this.mouseX = e.clientX;
            this.mouseY = e.clientY;

            if (!this.game.editorMode) {
                return;
            }

            if (this.mouseDown) {
                if (this.mouseButton === 0 && e.ctrlKey) {
                    const obj = this.getObjectAtCursor();

                    if (obj && !this.selectedObjects.includes(obj)) {
                        this.selectedObjects.push(obj);
                    }

                    return;
                }

                if (this.mouseButton === 0) {
                    const obj = this.getObjectAtCursor();

                    if (!obj) {
                        this.placeObject();
                    }
                }

                if (this.mouseButton === 2) {
                    if (e.ctrlKey) {
                        return;
                    }

                    const obj = this.getObjectAtCursor();

                    if (obj) {
                        this.deleteObject();
                    }
                }
            }
        });

        window.addEventListener("mousedown", e => {
            if (this.game.paused) {
                return;
            }

            if (!this.game.editorMode) {
                return;
            }

            this.mouseDown = true;
            this.mouseButton = e.button;

            // Place Objects
            if (e.button === 0) {
                const obj = this.getObjectAtCursor();

                if (obj) {
                    this.handleSelection(e);

                    return;
                }

                if (e.ctrlKey) {
                    return;
                }

                this.placeObject();
            }

            // Delete Objects
            if (e.button === 2) {
                const obj = this.getObjectAtCursor();

                if (e.ctrlKey) {
                    return;
                }

                if (obj) {
                    this.deleteObject();
                }

                return;
            }
        });

        window.addEventListener("mouseup", e => {
            if (this.game.paused) {
                return;
            }

            this.mouseDown = false;
            this.mouseButton = null;
        })

        window.addEventListener("keydown", e => {
            if (this.game.paused) {
                return;
            }

            if (!this.game.editorMode) {
                return;
            }

            // Selection

            if (e.code === "Digit1") {
                this.selectedType = "block";
            }
            if (e.code === "Digit2") {
                this.selectedType = "spike";
            }
            if (e.code === "Digit3") {
                this.selectedType = "start";
            }
            if (e.code === "Digit4") {
                this.selectedType = "goal";
            }
            if (e.code === "Digit5") {
                this.selectedType = "reverseTrigger";
            }
            if (e.code === "Digit6") {
                this.selectedType = "pad";
            }
            if (e.code === "Digit7") {
                this.selectedType = "orb";
            }

            // Movement

            const step = e.shiftKey ? 0.1 : 1;

            if (!e.ctrlKey) {
                if (e.code === "KeyW") {
                    if (!e.shiftKey) {
                        this.camera.y -= this.grid;
                    }

                    this.moveSelected(0, -step);
                }
                if (e.code === "KeyS") {
                    if (!e.shiftKey) {
                        this.camera.y += this.grid;
                    }

                    this.moveSelected(0, step);
                }
                if (e.code === "KeyA") {
                    if (!e.shiftKey) {
                        this.camera.x -= this.grid;
                    }

                    this.moveSelected(-step, 0);
                }
                if (e.code === "KeyD") {
                    if (!e.shiftKey) {
                        this.camera.x += this.grid;
                    }

                    this.moveSelected(step, 0);
                }

                // Rotation

                if (e.code === "ArrowUp") {
                    this.setSelectedRotation(0);
                }
                if (e.code === "ArrowRight") {
                    this.setSelectedRotation(90);
                }
                if (e.code === "ArrowDown") {
                    this.setSelectedRotation(180);
                }
                if (e.code === "ArrowLeft") {
                    this.setSelectedRotation(270);
                }
            }

            // Misc

            if (e.code === "KeyC" && e.ctrlKey) {
                this.copySelected();
            }

            if (e.code === "KeyZ" && e.ctrlKey) {
                this.undo();
            }

            if (e.code === "KeyY" && e.ctrlKey) {
                this.redo();
            }

            if (e.code === "Backspace") {
                this.deleteSelected();
            }

            if (e.code === "KeyS" && e.ctrlKey) {
                e.preventDefault();

                const data = this.exportLevel();
                navigator.clipboard.writeText(data);
                alert("Level data copied to clipboard!");
            }

            if (e.code === "KeyL" && e.ctrlKey) {
                e.preventDefault();

                const json = prompt("Paste level JSON:");
                
                if (json) {
                    this.importLevel(json);
                }
            }

            if (e.code === "KeyR" && e.ctrlKey && e.shiftKey) {
                e.preventDefault();

                this.game.reset();

                this.resetEditor();
            }

            if (e.code === "Escape") {
                this.selectedObjects = [];
            }
        });

        window.addEventListener("contextmenu", e => {
            if (this.game.paused) {
                return;
            }

            if (!this.game.editorMode) {
                return;
            }

            e.preventDefault();
            this.deleteObject();
        });
    }

    getObjectAtCursor() {
        const worldX = this.camera.screenToWorldX(this.mouseX);
        const worldY = this.camera.screenToWorldY(this.mouseY);
    
        return this.level.find(o => {
            const x = o.x * this.grid;
            const y = o.y * this.grid;

            return (
                worldX >= x &&
                worldX < x + this.grid &&
                worldY >= y &&
                worldY < y + this.grid
            );
        });
    }
    
    placeObject() {
        this.saveHistory();

        const worldX = this.camera.screenToWorldX(this.mouseX);
        const worldY = this.camera.screenToWorldY(this.mouseY);

        const gx = Math.floor(worldX / this.grid);
        const gy = Math.floor(worldY / this.grid);

        if (this.selectedType === "start" && this.level.some(o => o.type === "start")) {
            return;
        }

        const newObj = {
            type: this.selectedType,
            x: gx,
            y: gy,
            rotation: 0,
            padType: 0,
            orbType: 0
        };

        this.level.push(newObj);

        this.selectedObjects = [newObj];

        this.game.loadLevel(this.level);
        this.saveToLocalStorage();
    }

    deleteObject() {
        this.saveHistory();

        const obj = this.getObjectAtCursor();
        
        if (!obj) {
            return;
        }

        this.level = this.level.filter(o => o !== obj);

        if (this.selectedObjects.includes(obj)) {
            this.selectedObjects = this.selectedObjects.filter(o => o !== obj);
        }
        
        this.game.loadLevel(this.level);
        this.saveToLocalStorage();
    }

    handleSelection(e) {
        const worldX = this.camera.screenToWorldX(this.mouseX);
        const worldY = this.camera.screenToWorldY(this.mouseY);

        const obj = this.level.find(o =>
            worldX >= o.x * this.grid &&
            worldX <  (o.x * this.grid + this.grid) &&
            worldY >= o.y * this.grid &&
            worldY <  (o.y * this.grid + this.grid)
        );

        if (!obj) {
            this.selectedObjects = [];

            return null;
        }

        if (e.ctrlKey) {
            if (this.selectedObjects.includes(obj)) {
                this.selectedObjects = this.selectedObjects.filter(o => o !== obj);
            }
            else {
                this.selectedObjects.push(obj);
            }
        }
        else {
            this.selectedObjects = [obj];
        }

        return obj;
    }

    moveSelected(dx, dy) {
        this.saveHistory();

        for (const obj of this.selectedObjects) {
            obj.x += dx;
            obj.y += dy;

            obj.x = Math.round(obj.x * 10) / 10;
            obj.y = Math.round(obj.y * 10) / 10;
        }

        this.game.loadLevel(this.level);
        this.saveToLocalStorage();
    }

    setSelectedRotation(angle) {
        this.saveHistory();
    
        for (const obj of this.selectedObjects) {
            obj.rotation = angle;
        }
    
        this.game.loadLevel(this.level);
        this.saveToLocalStorage();
    }
    

    copySelected() {
        this.saveHistory();

        if (this.selectedObjects.length === 0) {
            return;
        }

        const clones = [];

        for (const obj of this.selectedObjects) {
            const clone = {
                type: obj.type,
                x: obj.x + 1,
                y: obj.y - 1,
                rotation: obj.rotation || 0
            };

            this.level.push(clone);
            clones.push(clone);
        }

        this.selectedObjects = clones;

        this.game.loadLevel(this.level);
        this.saveToLocalStorage();
    }

    deleteSelected() {
        if (this.selectedObjects.length === 0) {
            return;
        }

        this.level = this.level.filter(obj => !this.selectedObjects.includes(obj));

        this.selectedObjects = [];

        this.game.loadLevel(this.level);
        this.saveToLocalStorage();
    }

    draw(ctx) {
        this.drawGrid(ctx);
        this.drawPreview(ctx);
        this.drawSelectedType(ctx);
        this.drawSelection(ctx);
    }

    drawGrid(ctx) {
        const cam = this.camera;
        const w = this.game.canvas.width;
        const h = this.game.canvas.height;

        ctx.strokeStyle = "rgba(255,255,255,0.1)";

        const camX = this.camera.x;
        const camY = this.camera.y;

        for (let x = -camX % this.grid; x < w; x += this.grid) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }

        for (let y = -camY % this.grid; y < h; y += this.grid) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
    }

    drawPreview(ctx) {
        const worldX = this.camera.screenToWorldX(this.mouseX);
        const worldY = this.camera.screenToWorldY(this.mouseY);
    
        const gx = Math.floor(worldX / this.grid);
        const gy = Math.floor(worldY / this.grid);
    
        ctx.fillStyle = "rgba(0,255,0,0.25)";
        ctx.lineWidth = 2;
        ctx.fillRect(
            this.camera.worldToScreenX(gx * this.grid),
            this.camera.worldToScreenY(gy * this.grid),
            this.grid,
            this.grid
        );
    }

    drawSelection(ctx) {
        ctx.save();
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 3;

        for (const obj of this.selectedObjects) {
            const sx = this.camera.worldToScreenX(obj.x * this.grid);
            const sy = this.camera.worldToScreenY(obj.y * this.grid);

            ctx.strokeRect(sx, sy, this.grid, this.grid);
        }

        ctx.restore();
    }

    drawSelectedType(ctx) {
        ctx.save();

        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText("Selected: ", 10, 25);

        if (this.selectedType === "block") {
            ctx.fillStyle = "rgba(0,150,255,0.5)";
            ctx.fillRect(10, 35, this.grid * 0.6, this.grid * 0.6);
        }

        if (this.selectedType === "spike") {
            ctx.fillStyle = "rgba(255,50,50,0.5)";

            const size = this.grid * 0.6;
            const x = 10;
            const y = 35;

            ctx.beginPath();
            ctx.moveTo(x + size / 2, y);
            ctx.lineTo(x + size, y + size);
            ctx.lineTo(x, y + size);
            ctx.closePath();
            ctx.fill();
        }

        if (this.selectedType === "start") {
            ctx.fillStyle = "rgba(255,0,0,0.5)";
            ctx.fillRect(10, 35, this.grid * 0.6, this.grid * 0.6);
        }

        if (this.selectedType === "goal") {
            ctx.fillStyle = "rgba(0,255,0,0.5)";
            ctx.fillRect(10, 35, this.grid * 0.6, this.grid * 0.6);
        }

        if (this.selectedType === "reverseTrigger") {
            ctx.fillStyle = "rgba(0,255,255,0.5)";
            ctx.beginPath();
            ctx.fillRect(10, 35, this.grid * 0.6, this.grid * 0.6);
            ctx.stroke();
        }
        
        if (this.selectedType === "pad") {
            const padWidth = this.grid * 0.6;
            const padHeight = this.grid * 0.15;
        
            const x = 10;
            const y = 35 + (this.grid * 0.6 - padHeight);
        
            const r = 7;
        
            ctx.fillStyle = "rgba(255,255,0,0.5)";
            ctx.beginPath();
        
            ctx.moveTo(x, y + padHeight);
            ctx.lineTo(x + padWidth, y + padHeight);
            ctx.lineTo(x + padWidth, y + r);
            ctx.quadraticCurveTo(
                x + padWidth,
                y,
                x + padWidth - r,
                y
            );
        
            ctx.lineTo(x + r, y);
            ctx.quadraticCurveTo(
                x,
                y,
                x,
                y + r
            );
        
            ctx.closePath();
            ctx.fill();
        }        

        if (this.selectedType === "orb") {
            ctx.fillStyle = "rgba(255,255,0,0.5)";
            ctx.beginPath();
            ctx.arc(10 + this.grid * 0.3, 35 + this.grid * 0.3, this.grid * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }        

        ctx.restore();
    }

    saveHistory() {
        const snapshot = JSON.parse(JSON.stringify(this.level));
        this.history.push(snapshot);

        this.redoStack = [];
    }

    undo() {
        if (this.history.length === 0) {
            return;
        }

        const current = JSON.parse(JSON.stringify(this.level));
        this.redoStack.push(current);

        this.level = this.history.pop();

        this.selectedObjects = [];

        this.game.loadLevel(this.level);
        this.saveToLocalStorage();
    }

    redo() {
        if (this.redoStack.length === 0) {
            return;
        }

        const current = JSON.parse(JSON.stringify(this.level));
        this.history.push(current);

        this.level = this.redoStack.pop();

        this.selectedObjects = [];

        this.game.loadLevel(this.level);
        this.saveToLocalStorage();
    }

    exportLevel() {
        const objects = this.level.map(obj => {
            const id = ObjectID[obj.type];
            const arr = [id, obj.x, obj.y];
    
            if (obj.rotation !== undefined) {
                arr.push(obj.rotation);
            }

            if (obj.type === "pad") {
                arr.push(obj.padType);
            }

            if (obj.type === "orb") {
                arr.push(obj.orbType);
            }
    
            return arr;
        });
    
        const levelData = {
            settings: this.game.settings,
            objects
        };
    
        return JSON.stringify(levelData);
    }

    importLevel(json) {
        const data = JSON.parse(json);
    
        if (data.settings) {
            Object.assign(this.game.settings, data.settings);
        }
        else {
            this.game.settings.backgroundColor = data.bg ?? "#000";
            this.game.settings.mode = data.mode ?? 1;
        }
    
        const parsed = data.objects.map(arr => {
            const [id, x, y, rotation, extra] = arr;
    
            return {
                type: IDToType[id],
                x,
                y,
                rotation: rotation ?? 0,
                padType: IDToType[id] === "pad" ? extra ?? "yellow" : undefined,
                orbType: IDToType[id] === "orb" ? extra ?? "yellow" : undefined
            };
        });
    
        this.level = parsed;
    
        this.game.loadLevel(parsed);
        this.saveToLocalStorage();
    }

    saveToLocalStorage() {
        localStorage.setItem("level", this.exportLevel());
    }

    resetEditor() {
        this.level = [];
        this.selectedObjects = [];
        this.history = [];
        this.redoStack = [];

        this.game.loadLevel(this.level);
        this.saveToLocalStorage();
    }
}