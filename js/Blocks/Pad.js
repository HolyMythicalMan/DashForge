console.log("Pad.js loaded");

export class Pad {
    constructor(gridX, gridY, grid, type) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.grid = grid;
        this.type = type;
    }

    static launchPower = {
        0: 18,    // yellow
        1: 0,     // blue
        2: 10,    // pink
        3: 22     // red
    };

    getHitbox() {
        return {
            x: this.gridX * this.grid + (this.grid - this.grid * 0.8) / 2,
            y: this.gridY * this.grid + this.grid * 0.8,
            w: this.grid * 0.8,
            h: this.grid * 0.2
        };
    }

    getLaunchPower() {
        return Pad.launchPower[this.type] || 8;
    }

    draw(ctx, camera) {
        const worldX = this.gridX * this.grid;
        const worldY = this.gridY * this.grid + this.grid * 0.8;
    
        const sx = camera.worldToScreenX(worldX);
        const sy = camera.worldToScreenY(worldY);
    
        ctx.save();
    
        const colors = {
            0: "#fff000", // yellow
            1: "#0000ff", // blue
            2: "#ff00ff", // pink
            3: "#ff0000"  // red
        };
    
        const color = colors[this.type] || "white";

        const padWidth = this.grid * 0.9;
        const padHeight = this.grid * 0.2;

        const padX = sx + (this.grid - padWidth) / 2;
        const padY = sy;
    
        const r = 12;
    
        ctx.fillStyle = color;
        ctx.beginPath();
    
        ctx.moveTo(padX, padY + padHeight);
        ctx.lineTo(padX + padWidth, padY + padHeight);
        ctx.lineTo(padX + padWidth, padY + r);
        ctx.quadraticCurveTo(
            padX + padWidth,
            padY,
            padX + padWidth - r,
            padY
        );
    
        ctx.lineTo(padX + r, padY);
        ctx.quadraticCurveTo(
            padX,
            padY,
            padX,
            padY + r
        );
    
        ctx.closePath();
        ctx.fill();
    
        ctx.restore();
    }
}