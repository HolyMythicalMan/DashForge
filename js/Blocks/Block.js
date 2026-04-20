console.log("Block.js loaded");

export class Block {
    constructor(gridX, gridY, grid, color = "#444") {
        this.x = gridX * grid;
        this.y = gridY * grid;
        this.grid = grid;
        this.color = color;

        this.x = gridX * grid;
        this.y = gridY * grid;
        this.width = grid;
        this.height = grid;
    }

    draw(ctx, camera) {
        ctx.fillStyle = this.color;
        ctx.fillRect(
            camera.worldToScreenX(this.x),
            camera.worldToScreenY(this.y),
            this.width,
            this.height
        );
    }

    getHitbox() {
        return {
            x: this.x,
            y: this.y,
            w: this.width,
            h: this.height
        }
    }
}