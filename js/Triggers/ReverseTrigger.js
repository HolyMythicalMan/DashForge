console.log("ReverseTrigger.js loaded");

export class ReverseTrigger {
    constructor(gridX, gridY, grid) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.grid = grid;

        this.width = 4;
    }

    getHitbox() {
        const x = this.gridX * this.grid + (this.grid - this.width) / 2;

        return {
            x: x,
            y: -99999,
            w: this.width,
            h: 99999 * 2
        };
    }

    draw(ctx, camera, canvasHeight) {
        const worldX = this.gridX * this.grid + this.grid / 2;
        const sx = camera.worldToScreenX(worldX);

        const cellX = camera.worldToScreenX(this.gridX * this.grid);
        const cellY = camera.worldToScreenY(this.gridY * this.grid);

        ctx.fillStyle = "rgba(0,255,255,0.35)";
        ctx.fillRect(cellX, cellY, this.grid, this.grid);

        ctx.save();

        ctx.strokeStyle = "cyan";
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, canvasHeight);
        ctx.stroke();
        
        ctx.restore();
    }
}