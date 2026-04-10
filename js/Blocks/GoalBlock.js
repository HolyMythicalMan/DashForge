console.log("GoalBlock.js loaded");

export class GoalBlock {
    constructor(x, y, size, color = "#0f0") {
        this.x = x;
        this.y = y;
        this.width = size;
        this.height = size;
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