console.log("Block.js loaded");

export class Block {
    constructor(x, y, width, height, color = "#444") {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
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
        }
    }
}