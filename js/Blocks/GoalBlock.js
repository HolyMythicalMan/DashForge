console.log("GoalBlock.js loaded");

export class GoalBlock {
    constructor(gridX, gridY, grid, color = "#0f0") {
        this.gridX = gridX;
        this.gridY = gridY;
        this.grid = grid;

        this.x = gridX * grid;
        this.y = gridY * grid;
        this.width = grid;
        this.height = grid;
        this.color = color;
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
        };
    }
}