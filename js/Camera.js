console.log("Camera.js loaded");

export class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.scale = 1;
    }

    followPlayer(player, floor, screenWidth, screenHeight, mode) {
        if (mode === 0) {
            this.x = player.x - screenWidth * 0.3;
        }
        else if (mode === 1) {
            const marginX = screenWidth * 0.4;
            const leftBoundary = this.x + marginX;
            const rightBoundary = this.x + screenWidth - marginX;

            if (player.x < leftBoundary) {
                this.x = player.x - marginX;
            }
            else if (player.x + player.width > rightBoundary) {
                this.x = player.x + player.width - (screenWidth - marginX);
            }
        }

        const marginTop = 200;
        let targetY = player.y - marginTop;
        const minY = floor.y - (screenHeight - floor.height);

        this.y = Math.min(targetY, minY);
    }

    worldToScreenX(x) {
        return (x - this.x) * this.scale;
    }

    worldToScreenY(y) {
        return (y - this.y) * this.scale;
    }

    screenToWorldX(screenX) {
        return screenX / this.scale + this.x;
    }

    screenToWorldY(screenY) {
        return screenY / this.scale + this.y;
    }
}