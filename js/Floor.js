console.log("Floor.js loaded");

export class Floor {
    constructor(x, y, width, height, color = "#111") {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    draw(ctx, camera) {
        ctx.fillStyle = this.color;
        ctx.fillRect(
            0,
            camera.worldToScreenY(this.y),
            ctx.canvas.width,
            this.height
        );
    }
}