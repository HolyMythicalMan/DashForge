console.log("Orb.js loaded");

export class Orb {
    constructor(gridX, gridY, grid, type) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.grid = grid;
        this.type = type;

        this.used = false;
    }

    static launchPower = {
        0: 12, // yellow
        1: 0,  // blue
        2: 10, // pink
        3: 18  // red
    };

    getHitbox() {
        return {
            x: this.gridX * this.grid,
            y: this.gridY * this.grid,
            w: this.grid,
            h: this.grid
        };
    }

    getEditorHitbox() {
        return {
            x: this.gridX * this.grid,
            y: this.gridY * this.grid,
            w: this.grid,
            h: this.grid
        };
    }
    
    getLaunchPower() {
        return Orb.launchPower[this.type] || 8;
    }

    draw(ctx, camera) {
        const worldX = this.gridX * this.grid + this.grid / 2;
        const worldY = this.gridY * this.grid + this.grid / 2;

        const sx = camera.worldToScreenX(worldX);
        const sy = camera.worldToScreenY(worldY);

        ctx.save();

        const colors = {
            0: "#fff000", // yellow
            1: "#0000ff", // blue
            2: "#ff00ff", // pink
            3: "#ff0000"  // red
        };

        ctx.fillStyle = colors[this.type] || "white";

        ctx.beginPath();
        ctx.arc(sx, sy, this.grid * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}