export class ControlsPage {
    constructor(game, editor) {
        this.game = game;
        this.editor = editor;

        this.visible = true;
    }

    show() {
        this.visible = true;
    }

    hide() {
        this.visible = false;
    }

    toggle() {
        this.visible = !this.visible;
    }

    draw(ctx) {
        if (!this.visible) {
            return;
        }
    
        const lines = [
            "E - Toggle Editor",
            "",
            "1 - Block",
            "2 - Spike",
            "3 - Start Block",
            "4 - Goal Block",
            "Left Click - Select / Place",
            "Right Click - Delete",
            "Ctrl + Click - Multi-select",
            "WASD - Move Camera",
            "Arrow Keys - Rotate",
            "Ctrl + C - Copy",
            "Ctrl + Z - Undo",
            "Ctrl + Y - Redo",
            "Ctrl + S - Save Level",
            "Ctrl + L - Load Level",
            "Z - Undo",
            "Y - Redo",
            "Ctrl + Shift + R - Reset Level",
            "Backspace - Delete Selected",
            "Esc - Deselect",
            "",
            "O - Toggle Controls Page"
        ];
    
        const screenW = this.game.canvas.width;
        const screenH = this.game.canvas.height;
    
        // Responsive sizing
        const padding = screenW * 0.015;
        const titleFontSize = screenH * 0.035;
        const textFontSize = screenH * 0.026;
        const lineHeight = textFontSize * 1.4;
    
        const boxWidth = screenW * 0.25;
        const boxHeight = padding * 2 + lines.length * lineHeight + 25;
    
        // Top-right corner
        const boxX = screenW - boxWidth - padding;
        const boxY = padding;
    
        ctx.save();
    
        // Background
        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    
        // Title
        ctx.fillStyle = "white";
        ctx.font = `${titleFontSize}px Arial`;
        ctx.fillText("Editor Controls", boxX + padding, boxY + padding + titleFontSize);
    
        // Lines
        ctx.font = `${textFontSize}px Arial`;
    
        let y = boxY + padding + titleFontSize * 2;
    
        for (const line of lines) {
            ctx.fillText(line, boxX + padding, y);

            y += lineHeight;
        }
    
        ctx.restore();    
    }
}