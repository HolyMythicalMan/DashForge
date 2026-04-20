console.log("LevelSettings.js loaded");

export class LevelSettings {
    constructor(game, editor) {
        this.game = game;
        this.editor = editor;

        this.visible = false;

        this.panel = document.getElementById("settingsPanel");
        this.modeCheckbox = document.getElementById("modeCheckbox");
        this.bgColorInput = document.getElementById("bgColorInput");
        this.gravityInput = document.getElementById("gravityInput");
        this.speedInput = document.getElementById("speedInput");
        this.applyBtn = document.getElementById("applyBtn");
        this.resetBtn = document.getElementById("resetBtn");

        this.applyBtn.addEventListener("click", () => this.apply());
        this.resetBtn.addEventListener("click", () => this.resetValues());
    }

    toggle() {
        this.visible = !this.visible;
        this.game.paused = this.visible;

        if (this.visible) {
            this.loadValues();
            this.panel.hidden = false;
        }
        else {
            this.panel.hidden = true;
        }
    }

    loadValues() {
        this.modeCheckbox.checked = this.game.settings.mode === 1;
        this.bgColorInput.value = this.game.settings.backgroundColor;
        this.gravityInput.value = this.game.settings.gravity;
        this.speedInput.value = this.game.settings.playerSpeed;
    }

    resetValues() {
        this.modeCheckbox.checked = false;
        this.bgColorInput.value = "#000000";
        this.gravityInput.value = 0.6;
        this.speedInput.value = 6;
    }

    apply() {
        this.game.settings.mode = this.modeCheckbox.checked ? 1 : 0;
        this.game.settings.backgroundColor = this.bgColorInput.value;
        this.game.settings.gravity = parseFloat(this.gravityInput.value);
        this.game.settings.playerSpeed = parseFloat(this.speedInput.value);

        this.editor.saveToLocalStorage();
    }
}