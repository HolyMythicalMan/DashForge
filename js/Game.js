import { Player } from "./Player.js";
import { Camera } from "./Camera.js";
import { Editor } from "./Editor.js";
import { Floor } from "./Floor.js";
import { Block } from "./Block.js";
import { Spike } from "./Spike.js";

console.log("Game.js loaded");

export class Game {
    constructor() {
        this.canvas = document.createElement("canvas");
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext("2d");

        this.lastTime = 0;
        this.delta = 0;
        this.fps = 60;
        this.step = 1000 / this.fps;

        this.grid = 50;

        /* Mode
            0: Default
            1: Platformer
        */
        this.mode = 1;

        // Debug
        this.debugHitboxes = false;
        this.debugNoclip = false;

        // Movement
        this.keys = {
            left: false,
            right: false
        }

        // Camera
        this.camera = new Camera();

        // Floor
        this.floorHeight = 2 * this.grid;
        this.floor = new Floor(
            0,
            15 * this.grid,
            this.canvas.width,
            this.floorHeight
        );

        // Player
        this.player = new Player(100, 14 * this.grid, 50, 50, "#0f0");
        this.dead = false;
        this.deathTimer = 0;

        // Editor
        this.editorMode = false;
        this.editor = new Editor(this);

        // Objects
        this.blocks = [];
        this.spikes = [];

        // Methods
        this.resize();
        this.bindInput();

        window.addEventListener("resize", () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.floor.width = this.canvas.width;

        this.init();
    }

    init() {
        const ctx = this.ctx;

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        requestAnimationFrame(this.loop.bind(this));
    }

    loop(timestamp) {
        if (!this.lastTime) {
            this.lastTime = timestamp;
        }

        this.delta += timestamp - this.lastTime;
        this.lastTime = timestamp;

        while (this.delta > this.step) {
            this.update();
            this.delta -= this.step;
        }

        this.render();

        requestAnimationFrame(this.loop.bind(this));
    }

    update() {
        if (this.editorMode) {
            return;
        }

        if (this.dead) {
            this.deathTimer -= this.step;
            if (this.deathTimer <= 0) {
                this.reset();
            }

            return;
        }

        this.player.onGround = false;

        this.player.update();

        this.handleFloorCollision();
        this.handleBlockCollision();
        this.handleSpikeCollision();

        if (this.player.onGround && !this.keys.left && !this.keys.right) {
            this.player.vx *= this.player.friction;
        }

        if (this.mode === 0) {
            this.player.vx = this.player.speed;
        }
        else if (this.mode === 1) {
            let accel = this.player.onGround
                ? this.player.accelGround
                : this.player.accelAir;
            
            if (this.keys.left) {
                this.player.vx -= accel;
            }

            if (this.keys.right) {
                this.player.vx += accel;
            }

            if (this.player.vx > this.player.maxSpeed) {
                this.player.vx = this.player.maxSpeed;
            }
            if (this.player.vx < -this.player.maxSpeed) {
                this.player.vx = -this.player.maxSpeed;
            }
        }
    }

    render() {
        const ctx = this.ctx;
    
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (!this.editorMode) {
            this.camera.followPlayer(
                this.player,
                this.floor,
                this.canvas.width,
                this.canvas.height,
                this.mode
            );
        }

        this.floor.draw(ctx, this.camera);

        if (this.editorMode) {
            this.editor.draw(ctx);
        }
        else {
            this.drawPlayer();
        }
        

        for (const block of this.blocks) {
            const isSelected = this.editor.selectedObjects.includes(
                this.editor.level.find(o => o.x * this.grid === block.x && o.y * this.grid === block.y)
            );

            ctx.save();

            if (isSelected) {
                ctx.fillStyle = "rgba(0,255,0,0.6)";
            }

            block.draw(ctx, this.camera);

            ctx.restore();

            if (this.debugHitboxes) {
                this.drawHitbox(block.getHitbox(), "blue");
            }
        }

        for (const spike of this.spikes) {
            const isSelected = this.editor.selectedObjects.includes(
                this.editor.level.find(o => o.x * this.grid === spike.x && o.y * this.grid === spike.y)
            );
            ctx.save();

            if (isSelected) {
                ctx.fillStyle = "rgba(0,255,0,0.6)";
            }

            spike.draw(ctx, this.camera);

            ctx.restore();

            if (this.debugHitboxes) {
                this.drawHitbox(spike.getHitbox(), "red");
            }
        }
    }

    bindInput() {
        window.addEventListener("keydown", e => {
            if (!this.editorMode) {
                // Platformer movement
                if (e.code === "KeyA" || e.code === "ArrowLeft") {
                    this.keys.left = true;
                    e.preventDefault();
                }
                if (e.code === "KeyD" || e.code === "ArrowRight") {
                    this.keys.right = true;
                    e.preventDefault();
                }

                // Jumping
                if (e.code === "KeyW" || e.code === "ArrowUp" || e.code === "Space") {
                    this.player.jump();
                    e.preventDefault();
                }

                if (e.code === "KeyM") {
                    this.mode = this.mode === 0 ? 1 : 0;
                    console.log("Mode: " + this.mode);
                }
            }

            if (e.code === "KeyH") {
                this.debugHitboxes = !this.debugHitboxes;
            }
            if (e.code === "KeyJ") {
                this.debugNoclip = !this.debugNoclip;
            }

            if (e.code === "KeyE") {
                this.editorMode = !this.editorMode;
            }
        });

        window.addEventListener("keyup", e => {
            if (e.code === "KeyA" || e.code === "ArrowLeft") {
                this.keys.left = false;
            }
            if (e.code === "KeyD" || e.code === "ArrowRight") {
                this.keys.right = false;
            }
        });
    }

    // Draw Methods

    drawPlayer() {
        const ctx = this.ctx;
        const p = this.player;

        ctx.fillStyle = p.color;
        ctx.fillRect(
            this.camera.worldToScreenX(p.x),
            this.camera.worldToScreenY(p.y),
            p.width,
            p.height
        );

        if (this.debugHitboxes) {
            this.drawHitbox(p.getSpikeHitbox(), "red");
            this.drawHitbox(p.getBlockHitbox(), "blue");
        }
    }

    drawHitbox(rect, color = "red") {
        const ctx = this.ctx;

        ctx.save();

        const sx = this.camera.worldToScreenX(rect.x);
        const sy = this.camera.worldToScreenY(rect.y);

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.35;
        ctx.fillRect(sx + 1, sy + 1, rect.w - 2, rect.h - 2);

        ctx.restore();
    }
 
    // Collision Methods

    handleFloorCollision() {
        const p = this.player;
        const f = this.floor;

        const pBottom = p.y + p.height;
        
        if (pBottom >= f.y) {
            p.y = f.y - p.height;
            p.vy = 0;
            p.onGround = true;
        }
    }

    handleSpikeCollision() {
        const pSpike = this.player.getSpikeHitbox();

        for (const s of this.spikes) {
            if (this.rectsOverlap(pSpike, s.getHitbox())) {
                if (!this.debugNoclip) {
                    this.kill();
                }
            }
        }
    }

    handleBlockCollision() {
        const pOuter = this.player.getSpikeHitbox();
        const pInner = this.player.getBlockHitbox();

        for (const b of this.blocks) {
            const bh = b.getHitbox();

            if (this.mode === 1) {
                if (this.rectsOverlap(pOuter, bh)) {
                    this.resolveSolidCollision(pOuter, bh);
                }

                continue;
            }

            const pBottom = this.player.y + this.player.height;
            const bTop = b.y;

            const horizontalOverlap =
                pOuter.x < bh.x + bh.w &&
                pOuter.x + pOuter.w > bh.x;

            if (horizontalOverlap && pBottom >= bTop && this.player.y < bTop) {
                this.player.y = bTop - this.player.height;
                this.player.vy = 0;
                this.player.onGround = true;

                continue;
            }

            if (this.mode === 0) {
                const overlapAmount =
                    Math.min(pOuter.x + pOuter.w, bh.x + bh.w) -
                    Math.max(pOuter.x, bh.x);

                const requiredOverlap = pOuter.w * 0.25;

                if (overlapAmount >= requiredOverlap) {
                    if (this.rectsOverlap(pInner, bh)) {
                        if (!this.debugNoclip) {
                            this.kill();
                        }
                    }
                }
            }
        }
    }

    resolveSolidCollision(p, b) {
        const pBottom = p.y + p.h;
        const pRight = p.x + p.w;
        const bBottom = b.y + b.h;
        const bRight = b.x + b.w;

        const overlapLeft = pRight - b.x;
        const overlapRight = bRight - p.x;
        const overlapTop = pBottom - b.y;
        const overlapBottom = bBottom - p.y;

        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapLeft) {
            this.player.x = b.x - this.player.width;
            this.player.vx = 0;
        }
        else if (minOverlap === overlapRight) {
            this.player.x = bRight;
            this.player.vx = 0;
        }
        else if (minOverlap === overlapTop) {
            this.player.y = b.y - this.player.height;
            this.player.vy = 0;
            this.player.onGround = true;
        }
        else if (minOverlap === overlapBottom) {
            this.player.y = bBottom;
            this.player.vy = 0;
        }
    }

    // Hitbox Methods

    rectsOverlap(a, b) {
        return (
            a.x < b.x + b.w &&
            a.x + a.w > b.x &&
            a.y < b.y + b.h &&
            a.y + a.h > b.y
        );
    }

    // Death Methods

    kill() {
        if (this.dead) {
            return;
        }

        this.dead = true;
        this.deathTimer = 1000;

        this.player.vx = 0;
        this.player.vy = 0;
    }

    reset() {
        this.player.x = this.player.spawnX;
        this.player.y = this.player.spawnY;

        this.player.vx = 0;
        this.player.vy = 0;
        this.player.onGround = false;

        this.dead = false;
    }

    // Level Methods

    loadLevel(levelArray) {
        this.blocks = [];
        this.spikes = [];

        for (const obj of levelArray) {
            if (obj.type === "block") {
                this.blocks.push(new Block(obj.x * this.grid, obj.y * this.grid, this.grid, this.grid));
            }
            if (obj.type === "spike") {
                const spike = new Spike(obj.x * this.grid, obj.y * this.grid, this.grid);
                spike.rotation = obj.rotation || 0;
                this.spikes.push(spike);
            }
        }
    }
}