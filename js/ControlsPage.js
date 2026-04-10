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

        const padding = 30;
        const lineHeight = 28;
        const boxWidth = 400;
        const boxHeight = padding * 2 + lines.length * lineHeight;

        ctx.save();

        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.fillRect(50, 50, boxWidth, boxHeight);

        ctx.fillStyle = "white";
        ctx.font = "22px Arial";
        ctx.fillText("Editor Controls", 70, 90);

        ctx.font = "18px Arial";

        let y = 130;

        for (const line of lines) {
            ctx.fillText(line, 70, y);

            y += 28;
        }

        ctx.restore();
    }
}