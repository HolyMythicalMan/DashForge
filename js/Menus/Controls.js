console.log("Controls.js loaded");

export class Controls {
    constructor(game, editor) {
        this.game = game;
        this.editor = editor;

        this.visible = true;

        this.panel = document.getElementById("controlsPanel");
    }

    toggle() {
        this.visible = !this.visible;
        this.panel.hidden = !this.visible;
    }
}