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

        this.selectedObjects = [];
        this.isSelecting = false;

        this.showHelp = true;

        this.bindInputs();
    }

    bindInputs() {
        window.addEventListener("mousemove", e => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        window.addEventListener("mousedown", e => {
            if (!this.game.editorMode) {
                return;
            }

            if (e.button === 2) {
                this.deleteObject();

                return;
            }

            if (e.button === 0) {
                const clickedObj = this.handleSelection(e);

                if (e.ctrlKey) {
                    return;
                }

                if (clickedObj) {
                    return;
                }

                this.placeObject();
            }
        });

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

            // Movement

            const step = e.shiftKey ? 0.1 : 1;

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

            if (e.code === "ArrowLeft") {
                this.rotateSelected(-90);
            }
            if (e.code === "ArrowRight") {
                this.rotateSelected(90);
            }

            // Misc

            if (e.code === "KeyC") {
                this.copySelected();
            }

            if (e.code === "KeyV") {
                this.deleteSelected();
            }

            if (e.code === "KeyX") {
                const data = this.exportLevel();
                navigator.clipboard.writeText(data);
                alert("Level data copied to clipboard!");
            }

            if (e.code === "KeyZ") {
                const json = prompt("Paste level JSON:");
                
                if (json) {
                    this.importLevel(json);
                }
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

    placeObject() {
        const worldX = this.camera.screenToWorldX(this.mouseX);
        const worldY = this.camera.screenToWorldY(this.mouseY);

        const gx = Math.floor(worldX / this.grid);
        const gy = Math.floor(worldY / this.grid);

        const newObj = {
            type: this.selectedType,
            x: gx,
            y: gy,
            rotation: 0
        };

        this.level.push(newObj);

        this.selectedObjects = [newObj];

        this.game.loadLevel(this.level);
    }

    deleteObject() {
        const worldX = this.camera.screenToWorldX(this.mouseX);
        const worldY = this.camera.screenToWorldY(this.mouseY);

        const gx = Math.floor(worldX / this.grid);
        const gy = Math.floor(worldY / this.grid);

        this.level = this.level.filter(obj => !(obj.x === gx && obj.y === gy));

        this.game.loadLevel(this.level);
    }

    handleSelection(e) {
        const worldX = this.camera.screenToWorldX(this.mouseX);
        const worldY = this.camera.screenToWorldY(this.mouseY);

        const gx = Math.floor(worldX / this.grid);
        const gy = Math.floor(worldY / this.grid);

        const obj = this.level.find(o => o.x === gx && o.y === gy);

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
        for (const obj of this.selectedObjects) {
            obj.x += dx;
            obj.y += dy;

            obj.x = Math.round(obj.x * 10) / 10;
            obj.y = Math.round(obj.y * 10) / 10;
        }

        this.game.loadLevel(this.level);
    }

    rotateSelected(angle) {
        for (const obj of this.selectedObjects) {
            obj.rotation = (obj.rotation || 0) + angle;
        }

        this.game.loadLevel(this.level);
    }

    copySelected() {
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
    }

    deleteSelected() {
        if (this.selectedObjects.length === 0) {
            return;
        }

        this.level = this.level.filter(obj => !this.selectedObjects.includes(obj));

        this.selectedObjects = [];

        this.game.loadLevel(this.level);
    }

    draw(ctx) {
        this.drawGrid(ctx);
        this.drawPreview(ctx);
        this.drawSelectedType(ctx);
        this.drawSelection(ctx);
        this.drawHelp(ctx);
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
            ctx.fillStyle = "rgba(0,150,255,0.8)";
            ctx.fillRect(10, 35, this.grid * 0.6, this.grid * 0.6);
        }

        if (this.selectedType === "spike") {
            ctx.fillStyle = "rgba(255,50,50,0.8)";

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

        ctx.restore();
    }

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

    exportLevel() {
        return JSON.stringify(this.level);
    }

    importLevel(json) {
        this.level = JSON.parse(json);
        this.game.loadLevel(this.level);
    }
}