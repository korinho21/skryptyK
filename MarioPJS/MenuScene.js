export class MenuScene extends Phaser.Scene {
    constructor() {
        super("MenuScene");
    }

    preload() {}

    create() {
        this.add.text(400, 120, "WYBIERZ POZIOM", { fontSize: "36px", fill: "#fff" }).setOrigin(0.5);
        this.add.text(400, 200, "1  2  3  4  5", { fontSize: "32px", fill: "#ff0" }).setOrigin(0.5);
        this.add.text(400, 260, "ENTER - losowy poziom", { fontSize: "24px", fill: "#fff" }).setOrigin(0.5);

        this.input.keyboard.on("keydown", (event) => {
            if (event.key >= "1" && event.key <= "5") {
                this.scene.start("GameScene", { 
                    loadLevel: parseInt(event.key), 
                    selectedLevel: parseInt(event.key) 
                });
            }
            if (event.key === "Enter") {
                this.scene.start("GameScene", {});
            }
        });
    }
}