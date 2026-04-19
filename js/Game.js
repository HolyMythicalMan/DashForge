import { Player } from "./Player.js";
import { Camera } from "./Camera.js";
import { Editor } from "./Editor.js";
import { Floor } from "./Floor.js";

import { Controls } from "./Menus/Controls.js";
import { LevelSettings } from "./Menus/LevelSettings.js";

import { Block } from "./Blocks/Block.js";
import { Spike } from "./Blocks/Spike.js";
import { StartBlock } from "./Blocks/StartBlock.js";
import { GoalBlock } from "./Blocks/GoalBlock.js";

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

        this.paused = false;

        this.settings = {
            mode: 1,
            backgroundColor: "#000",
            gravity: 0.6,
            playerSpeed: 6
        };

        // Debug
        this.debugHitboxes = false;
        this.debugNoclip = false;

        // Movement
        this.keys = {
            left: false,
            right: false,
            jump: false
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
        this.player = new Player(100, 14 * this.grid, 50, 50);
        this.dead = false;
        this.deathTimer = 0;

        // Editor
        this.editorMode = false;
        this.editor = new Editor(this);

        // Menus
        this.controlsPage = new Controls(this, this.editor);
        this.levelSettingsPage = new LevelSettings(this, this.editor);

        // Objects
        this.blocks = [];
        this.spikes = [];
        this.goalBlocks = [];

        this.selectionFillStyle = "rgba(0,255,0,0.6)";

        // Methods
        this.resize();
        this.bindInput();

        const saved = localStorage.getItem("level");
        if (saved) {
            this.editor.importLevel(saved);
        }

        window.addEventListener("resize", () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.floor.y = 15 * this.grid;
        this.floor.width = this.canvas.width;

        this.init();
    }

    init() {
        const ctx = this.ctx;

        ctx.fillStyle = this.settings.backgroundColor;
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
        if (this.paused) {
            return;
        }

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

        if (this.keys.jump) {
            this.player.jumpBuffer = this.player.jumpBufferTime;
        }
        else {
            this.player.jumpBuffer = Math.max(0, this.player.jumpBuffer - this.step);
        }

        this.player.update(this.settings.gravity);

        this.handleFloorCollision();
        this.handleBlockCollision();
        this.handleSpikeCollision();
        this.handleGoalCollision();

        if (!this.player.onGround) {
            this.player.rotation += this.player.rotationSpeed * this.player.facing;
            this.player.rotation %= 360;
        }
        else {
            let r = this.player.rotation % 360;
            if (r < 0) {
                r += 360;
            }

            let target = Math.round(r / 90) * 90;
            target = target % 360;

            let delta = ((target - r + 540) % 360) - 180;
            const step = Math.sign(delta) * Math.min(Math.abs(delta), this.player.rotationResetSpeed);

            r += step;

            if (Math.abs(delta) <= this.player.rotationResetSpeed) {
                r = target;
            }

            this.player.rotation = r;
        }
    

        if (this.player.onGround && !this.keys.left && !this.keys.right) {
            this.player.vx *= this.player.friction;
        }

        if (this.settings.mode === 0) {
            this.player.vx = this.settings.playerSpeed;
        }
        else if (this.settings.mode === 1) {
            let accel = this.player.onGround
                ? this.player.accelGround
                : this.player.accelAir;
            
            if (this.keys.left) {
                this.player.vx -= accel;
                this.player.facing = -1;
            }

            if (this.keys.right) {
                this.player.vx += accel;
                this.player.facing = 1;
            }

            if (this.player.vx > this.player.maxSpeed) {
                this.player.vx = this.player.maxSpeed;
            }
            if (this.player.vx < -this.player.maxSpeed) {
                this.player.vx = -this.player.maxSpeed;
            }
        }

        if (this.player.onGround && this.player.jumpBuffer > 0) {
            this.player.jump();
            this.player.jumpBuffer = 0;
        }
    }

    render() {
        const ctx = this.ctx;
    
        ctx.fillStyle = this.settings.backgroundColor;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (!this.editorMode) {
            this.camera.followPlayer(
                this.player,
                this.floor,
                this.canvas.width,
                this.canvas.height,
                this.settings.mode
            );
        }

        this.drawPlayer();

        this.floor.draw(ctx, this.camera);

        if (this.startBlock) {
            this.startBlock.draw(ctx, this.camera);
        }
        
        for (const block of this.blocks) {
            const isSelected = this.editor.selectedObjects.includes(
                this.editor.level.find(o => o.x * this.grid === block.x && o.y * this.grid === block.y)
            );

            ctx.save();

            if (isSelected) {
                ctx.fillStyle = this.selectionFillStyle;
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
                ctx.fillStyle = this.selectionFillStyle;
            }

            spike.draw(ctx, this.camera);

            ctx.restore();

            if (this.debugHitboxes) {
                this.drawHitbox(spike.getHitbox(), "red");
            }
        }

        for (const goalBlock of this.goalBlocks) {
            const isSelected = this.editor.selectedObjects.includes(
                this.editor.level.find(o => o.x * this.grid === goalBlock.x && o.y * this.grid === goalBlock.y)
            );

            ctx.save();

            if (isSelected) {
                ctx.fillStyle = this.selectionFillStyle;
            }

            goalBlock.draw(ctx, this.camera);

            ctx.restore();
        }

        if (this.editorMode) {
            this.editor.draw(ctx);
        }

        this.drawDebugStatus(ctx);
    }

    bindInput() {
        if (this.paused) {
            return;
        }

        window.addEventListener("keydown", e => {
            if (!this.editorMode) {
                // Platformer movement
                if (e.code === "KeyA" || e.code === "ArrowLeft") {
                    e.preventDefault();

                    this.keys.left = true;
                }
                if (e.code === "KeyD" || e.code === "ArrowRight") {
                    e.preventDefault();

                    this.keys.right = true;
                }

                // Jumping (rework jump buffering later)
                if (e.code === "KeyW" || e.code === "ArrowUp" || e.code === "Space") {
                    e.preventDefault();
                    
                    this.keys.jump = true;
                }
            }

            if (e.code === "KeyE") {
                e.preventDefault();

                if (this.paused) {
                    return;
                }

                this.editorMode = !this.editorMode;

                if (!this.editorMode) {
                    this.editor.selectedObjects = [];
                }
            }

            if (e.code === "KeyR" && !e.ctrlKey && !e.shiftKey) {
                e.preventDefault();

                this.editorMode = false;
                this.editor.selectedObjects = [];
                this.reset();
            }

            if (e.code === "KeyO") {
                e.preventDefault();

                this.controlsPage.toggle();
            }

            // Debug Keybinds

            if (e.code === "KeyH") {
                e.preventDefault();

                this.debugHitboxes = !this.debugHitboxes;
            }
            if (e.code === "KeyJ") {
                e.preventDefault();

                this.debugNoclip = !this.debugNoclip;
            }

            // Menus

            if (e.code === "KeyP") {
                e.preventDefault();

                this.levelSettingsPage.toggle();
            }
        });

        window.addEventListener("keyup", e => {
            if (e.code === "KeyA" || e.code === "ArrowLeft") {
                this.keys.left = false;
            }
            if (e.code === "KeyD" || e.code === "ArrowRight") {
                this.keys.right = false;
            }

            if (e.code === "KeyW" || e.code === "ArrowUp" || e.code === "Space") {
                this.keys.jump = false;
            }
        });

        window.addEventListener("mousedown", e => {
            const mx = e.clientX;
            const my = e.clientY;
        });
    }

    // Draw Methods

    drawPlayer() {
        const ctx = this.ctx;
        const p = this.player;

        const sx = this.camera.worldToScreenX(p.x);
        const sy = this.camera.worldToScreenY(p.y);

        ctx.save();

        ctx.translate(sx + p.width / 2, sy + p.height / 2);

        ctx.rotate(p.rotation * Math.PI / 180);

        ctx.scale(p.facing, 1);

        ctx.fillStyle = p.color;
        ctx.fillRect(
            -p.width / 2,
            -p.height / 2,
            p.width,
            p.height
        );

        ctx.restore();

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

    drawDebugStatus(ctx) {
        if (this.editorMode) {
            return;
        }

        const flags = this.getActiveDebugFlags();

        if (flags.length === 0) {
            return;
        }

        ctx.save();

        ctx.font = "20px Arial";
        ctx.fillStyle = "white";

        let x = 10;
        let y = 30;

        for (const flag of flags) {
            ctx.fillText(flag, x, y);
            y += 28;
        }

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

            if (this.settings.mode === 1) {
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

            if (horizontalOverlap && pBottom >= bTop && this.player.y < bTop && this.player.vy >= 0) {
                this.player.y = bTop - this.player.height;
                this.player.vy = 0;
                this.player.onGround = true;

                continue;
            }

            if (this.settings.mode === 0) {
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

    handleGoalCollision() {
        const pHit = this.player.getBlockHitbox();

        for (const goal of this.goalBlocks) {
            if (this.rectsOverlap(pHit, goal.getHitbox())) {
                this.reset(); // Placeholder for level completion
            }
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

        this.player.jumpBuffer = 0;
        this.player.rotation = 0;
    }

    // Level Methods

    loadLevel(levelArray) {
        this.blocks = [];
        this.spikes = [];
        this.startBlock = null;
        this.goalBlocks = [];

        for (const obj of levelArray) {
            if (obj.type === "block") {
                this.blocks.push(new Block(obj.x * this.grid, obj.y * this.grid, this.grid, this.grid));
            }
            if (obj.type === "spike") {
                const spike = new Spike(obj.x * this.grid, obj.y * this.grid, this.grid);
                spike.rotation = obj.rotation || 0;
                this.spikes.push(spike);
            }
            if (obj.type === "start") {
                this.startBlock = new StartBlock(obj.x * this.grid, obj.y * this.grid, this.grid);
            }
            if (obj.type === "goal") {
                this.goalBlocks.push(new GoalBlock(obj.x * this.grid, obj.y * this.grid, this.grid));
            }
        }

        if (this.startBlock) {
            this.player.spawnX = this.startBlock.x;
            this.player.spawnY = this.startBlock.y;
        }
        else {
            this.player.spawnX = 100;
            this.player.spawnY = 14 * this.grid;
        }
    }

    // Miscellaneous Methods

    getActiveDebugFlags() {
        const flags = [];

        if (this.debugHitboxes) {
            flags.push("Hitboxes");
        }

        if (this.debugNoclip) {
            flags.push("Invulnerability");
        }

        return flags;
    }
}