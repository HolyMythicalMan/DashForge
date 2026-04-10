console.log("Spike.js loaded");

export class Spike {
    constructor(x, y, size, color = "#444") {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
    }

    draw(ctx, camera) {
        const sx = camera.worldToScreenX(this.x);
        const sy = camera.worldToScreenY(this.y);
        const size = this.size;

        ctx.save();

        ctx.translate(sx + size / 2, sy + size / 2);

        ctx.rotate((this.rotation || 0) * Math.PI / 180);

        ctx.beginPath();
        ctx.moveTo(0, -size / 2);
        ctx.lineTo(size / 2, size / 2);
        ctx.lineTo(-size / 2, size / 2);
        ctx.closePath();

        ctx.fillStyle = this.color;
        ctx.fill();

        ctx.restore();
    }

    collidesWith(player) {
        return (
            player.x < this.x + this.size &&
            player.x + player.width > this.x &&
            player.y < this.y + this.size &&
            player.y + player.height > this.y
        );
    }

    getHitbox() {
        const size = this.size;

        const w = this.size * 0.25;
        const h = this.size * 0.5;
        const offsetX = (this.size - w) / 2;
        const offsetY = (this.size - h) / 1.5;

        const cx = this.x + size / 2;
        const cy = this.y + size / 2;

        const corners = [
            { x: this.x + offsetX,     y: this.y + offsetY },
            { x: this.x + offsetX + w, y: this.y + offsetY },
            { x: this.x + offsetX + w, y: this.y + offsetY + h },
            { x: this.x + offsetX,     y: this.y + offsetY + h },
        ];

        const angle = (this.rotation || 0) * Math.PI / 180;

        const rotated = corners.map(p => {
            const dx = p.x - cx;
            const dy = p.y - cy;

            return {
                x: cx + dx * Math.cos(angle) - dy * Math.sin(angle),
                y: cy + dx * Math.sin(angle) + dy * Math.cos(angle)
            };
        });

        const xs = rotated.map(p => p.x);
        const ys = rotated.map(p => p.y);

        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        return {
            x: minX,
            y: minY,
            w: maxX - minX,
            h: maxY - minY
        };
    }
}