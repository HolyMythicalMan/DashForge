console.log("Player.js loaded");

export class Player {
    constructor(x, y, width, height, color = "#fff000") {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;

        this.vy = 0;
        this.vx = 0;
        this.prevY = y;
        this.gravity = 0.6;
        this.jumpForce = -12;
        this.maxFallSpeed = 20;
        this.onGround = false;
        this.friction = 0.6;
        this.speed = 6;
        this.maxSpeed = 6;
        this.accelGround = 1.0;
        this.accelAir = 0.2;

        this.dead = false;

        this.spawnX = x;
        this.spawnY = y;
    }

    update() {
        this.prevY = this.y;
        this.vy += this.gravity;

        if (this.vy > this.maxFallSpeed) {
            this.vy = this.maxFallSpeed;
        }

        this.x += this.vx;

        this.y += this.vy;
    }

    jump() {
        if (this.onGround) {
            this.vy = this.jumpForce;
            this.onGround = false;
        }
    }

    getSpikeHitbox() {
        return {
            x: this.x,
            y: this.y,
            w: this.width,
            h: this.height
        }
    }

    getBlockHitbox() {
        const size = this.width * 0.35;
        const offset = (this.width - size) / 2;

        return {
            x: this.x + offset,
            y: this.y + offset,
            w: size,
            h: size
        }
    }
}