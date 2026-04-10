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
        window.addEventListener("mousemove", e => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;

            if (!this.game.editorMode) {
                return;
            }

            if (this.mouseDown) {
                if (this.mouseButton === 0) {
                    if (e.ctrlKey) {
                        return;
                    }

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
            this.mouseDown = false;
            this.mouseButton = null;
        })

        window.addEventListener("keydown", e => {
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

                this.resetEditor();
            }

            if (e.code === "Escape") {
                this.selectedObjects = [];
            }
            

            /*
            if (e.code === "Escape") {
                this.showHelp = !this.showHelp;
            }
            */
        });

        window.addEventListener("contextmenu", e => {
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
    
        return this.level.find(o => (
            worldX >= o.x * this.grid &&
            worldX <  (o.x * this.grid + this.grid) &&
            worldY >= o.y * this.grid &&
            worldY <  (o.y * this.grid + this.grid)
        ));
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

        /*
        if (this.selectedType === "goal" && this.level.some(o => o.type === "start")) {
            return;
        }
        */

        const newObj = {
            type: this.selectedType,
            x: gx,
            y: gy,
            rotation: 0
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
        this.selectedObjects = [];
        this.game.loadLevel(this.level);
        this.saveToLocalStorage();

        /*
        const worldX = this.camera.screenToWorldX(this.mouseX);
        const worldY = this.camera.screenToWorldY(this.mouseY);

        //const gx = Math.floor(worldX / this.grid);
        //const gy = Math.floor(worldY / this.grid);

        this.level = this.level.filter(obj => {
            const left = obj.x * this.grid;
            const right = left + this.grid;
            const top = obj.y * this.grid;
            const bottom = top + this.grid;

            return !(worldX >= left && worldX < right && worldY >= top && worldY < bottom);
        });

        this.selectedObjects = [];

        //this.level = this.level.filter(obj => !(obj.x === gx && obj.y === gy));

        this.game.loadLevel(this.level);
        this.saveToLocalStorage();
        */
    }

    handleSelection(e) {
        const worldX = this.camera.screenToWorldX(this.mouseX);
        const worldY = this.camera.screenToWorldY(this.mouseY);

        //const gx = Math.floor(worldX / this.grid);
        //const gy = Math.floor(worldY / this.grid);

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

        ctx.restore();
    }

    /*
    drawHelp(ctx) {
        if (!this.showHelp) {
            return;
        }
    
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(10, 100, 220, 160);
    
        ctx.fillStyle = "white";
        ctx.font = "16px Arial";
    
        const lines = [
            "Editor Controls:",
            "1 - Block",
            "2 - Spike",
            "WASD - Move Camera",
            "Left Click - Place",
            "Right Click - Delete",
            "X - Copy Level JSON",
            "E - Toggle Editor"
        ];
    
        let y = 125;
        for (const line of lines) {
            ctx.fillText(line, 20, y);
            y += 20;
        }
    
        ctx.restore();
    }
    */

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
    
            return arr;
        });
    
        const levelData = {
            bg: this.game.backgroundColor,
            mode: this.game.mode,
            objects
        };
    
        return JSON.stringify(levelData);
    }

    importLevel(json) {
        const data = JSON.parse(json);
    
        this.game.backgroundColor = data.bg ?? "#000";
        this.game.mode = data.mode ?? 1;
    
        const parsed = data.objects.map(arr => {
            const [id, x, y, rotation] = arr;
    
            return {
                type: IDToType[id],
                x,
                y,
                rotation: rotation ?? 0
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