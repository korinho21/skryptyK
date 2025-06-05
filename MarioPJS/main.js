import { MenuScene } from "./MenuScene.js";
import { generateLevel, createRandomLevel } from "./LevelGenerator.js";

class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");
        this.heartGroup = null;
        this.isOnGround = 0;
        this.jumpBuffer = 0;
        this.coyoteTime = 0;
        this.selectedLevel = null;
    }

    preload() {
        this.load.image("player", "player.png");
        this.load.image("player_red", "player_red.png");
        this.load.image("enemy_red", "enemy_red.png");
        this.load.image("bullet", "bullet.png");
        this.load.image("enemy", "enemy.png");
        this.load.image("platform", "platform.png");
        this.load.image("door", "door.png");
        this.load.image("coin", "coin.png");
        this.load.image("heart", "heart.png");
        this.load.image("deadzone", "deadzone.png");
        this.load.image("box", "box.png");
    }

    async loadLevelFromFile(levelNumber) {
        const response = await fetch(`level${levelNumber}.json`);
        if (!response.ok) throw new Error("Nie można wczytać pliku level" + levelNumber + ".json");
        return await response.json();
    }

    async create(data = {}) {
        this.isOnGround = 0;
        this.jumpBuffer = 0;
        this.coyoteTime = 0;
        this.canShoot = true;
        this.invincible = false;
        this.bullets = this.physics.add.group();

        this.selectedLevel = data.selectedLevel || null;

        this.levelNumber = data.level || 1;
        this.coinsCollected = data.coins || 0;
        this.maxLives = 3;
        let lives = (typeof data.lives === "number") ? data.lives : this.maxLives;

        if (data.loadLevel) {
            this.levelNumber = data.loadLevel;
            this.levelData = await this.loadLevelFromFile(this.levelNumber);
            console.log("Wczytano levelData z pliku:", this.levelData);
        } else {
            this.levelData = createRandomLevel(this.levelNumber);
            console.log("Wygenerowano levelData:", this.levelData);
        }

        const doorPlatform = Phaser.Utils.Array.GetRandom(this.levelData.platforms);
        const doorScale = 0.04;
        this.door = this.physics.add.sprite(doorPlatform.x, doorPlatform.y, "door").setScale(doorScale);
        this.door.body.allowGravity = false;
        this.door.setImmovable(true);
        this.door.y -= this.door.displayHeight / 2;
        this.door.y -= 9;
        this.door.setDepth(0);

        let maxDist = 0;
        let farPlatform = null;
        const enemyPlatforms = this.levelData.enemies.map(e => {
            let minDist = Infinity;
            let closestPlat = null;
            for (const plat of this.levelData.platforms) {
                const dist = Phaser.Math.Distance.Between(plat.x, plat.y, e.x, e.y + 30);
                if (dist < minDist) {
                    minDist = dist;
                    closestPlat = plat;
                }
            }
            return `${Math.round(closestPlat.x)},${Math.round(closestPlat.y)}`;
        });

        for (const plat of this.levelData.platforms) {
            const platKey = `${Math.round(plat.x)},${Math.round(plat.y)}`;
            if (enemyPlatforms.includes(platKey)) continue;
            const dist = Phaser.Math.Distance.Between(plat.x, plat.y, doorPlatform.x, doorPlatform.y);
            if (dist > maxDist || farPlatform === null) {
                maxDist = dist;
                farPlatform = plat;
            }
        }
        if (!farPlatform) {
            farPlatform = this.levelData.platforms[0];
            maxDist = 0;
            for (const plat of this.levelData.platforms) {
                const dist = Phaser.Math.Distance.Between(plat.x, plat.y, doorPlatform.x, doorPlatform.y);
                if (dist > maxDist) {
                    maxDist = dist;
                    farPlatform = plat;
                }
            }
        }

        const PLATFORM_HEIGHT = 30;
        this.player = this.physics.add.sprite(farPlatform.x, farPlatform.y, "player").setScale(0.1);
        this.player.setCollideWorldBounds(true);
        this.player.lives = lives;
        this.player.setDepth(1);

        this.player.y = farPlatform.y - PLATFORM_HEIGHT / 2 - this.player.displayHeight / 2 + 1;

        this.bullets.setDepth(1);

        this.door.body.checkCollision.up = false;
        this.door.body.checkCollision.down = false;
        this.door.body.checkCollision.left = false;
        this.door.body.checkCollision.right = false;

        this.canEnterDoor = false;
        this.physics.add.overlap(this.player, this.door, () => {
            this.canEnterDoor = true;
        }, null, this);

        const coinCount = Math.min(this.levelData.enemies.length, 5);
        const coinPlatforms = Phaser.Utils.Array.Shuffle([...this.levelData.platforms]).slice(0, coinCount);
        this.coins = this.physics.add.staticGroup();
        coinPlatforms.forEach(plat => {
            this.coins.create(plat.x, plat.y - 30, "coin").setScale(0.025).refreshBody();
        });

        this.coinValue = 5 * this.levelNumber;

        this.heartGroup = this.physics.add.staticGroup();
        const heartChance = 0.2 * (this.levelNumber / 5);
        if (Math.random() < heartChance) {
            const taken = new Set(coinPlatforms.map(p => `${p.x},${p.y}`));
            this.levelData.enemies.forEach(e => {
                let minDist = Infinity;
                let closestPlat = null;
                for (const plat of this.levelData.platforms) {
                    const dist = Phaser.Math.Distance.Between(plat.x, plat.y, e.x, e.y + 30);
                    if (dist < minDist) {
                        minDist = dist;
                        closestPlat = plat;
                    }
                }
                taken.add(`${Math.round(closestPlat.x)},${Math.round(closestPlat.y)}`);
            });
            const freePlatforms = this.levelData.platforms.filter(p => !taken.has(`${Math.round(p.x)},${Math.round(p.y)}`));
            if (freePlatforms.length > 0) {
                const heartPlat = Phaser.Utils.Array.GetRandom(freePlatforms);
                this.heartGroup.create(heartPlat.x, heartPlat.y - 30, "heart").setScale(0.003).refreshBody();
            }
        }

        this.deathZoneSprite = this.add.image(400, 590, "deadzone").setDisplaySize(800, 20).setDepth(2);

        this.deathZone = this.add.rectangle(400, 590, 800, 20);
        this.physics.add.existing(this.deathZone, true);
        this.deathZone.visible = false;

        this.physics.add.overlap(this.player, this.deathZone, () => {
            if (this.selectedLevel) {
                this.scene.start("GameScene", {
                    loadLevel: this.selectedLevel,
                    selectedLevel: this.selectedLevel,
                    coins: 0,
                    lives: this.maxLives
                });
            } else {
                this.scene.start("GameScene", {
                    level: 1,
                    coins: 0,
                    lives: this.maxLives
                });
            }
        }, null, this);

        this.scoreText = this.add.text(16, 16, "Punkty: " + this.coinsCollected, {
            fontSize: "24px",
            fill: "#fff",
            fontFamily: "Arial"
        }).setScrollFactor(0).setDepth(10);

        this.levelText = this.add.text(800 - 16, 16, `Poziom: ${this.levelNumber}`, {
            fontSize: "24px",
            fill: "#fff",
            fontFamily: "Arial"
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(10);

        this.hearts = [];
        for (let i = 0; i < this.maxLives; i++) {
            const heart = this.add.image(400 + (i - 1) * 40, 32, "heart").setScale(0.005).setDepth(10);
            this.hearts.push(heart);
        }
        this.updateHearts();

        generateLevel(this, this.levelData);

        const tempCollider = this.physics.add.collider(this.player, this.platforms);
        this.time.delayedCall(30, () => {
            tempCollider.destroy();
        });

        this.physics.add.collider(this.bullets, this.enemies, this.bulletHitsEnemy, null, this);
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
        this.physics.add.overlap(this.player, this.heartGroup, this.collectHeart, null, this);

        //WSAD
        this.keys = this.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            up: Phaser.Input.Keyboard.KeyCodes.W,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            e: Phaser.Input.Keyboard.KeyCodes.E
        });
        this.input.keyboard.on("keydown-P", () => this.shootBullet());
    }

    update() {
        if (!this.player || !this.player.body || !this.door || !this.door.body) {
            return;
        }

        
        if (this.keys.left.isDown) {
            this.player.setVelocityX(-160);
            this.player.flipX = true;
        } else if (this.keys.right.isDown) {
            this.player.setVelocityX(160);
            this.player.flipX = false;
        } else {
            this.player.setVelocityX(0);
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.up) || Phaser.Input.Keyboard.JustDown(this.keys.space)) {
            this.jumpBuffer = 8;
        } else if (this.jumpBuffer > 0) {
            this.jumpBuffer--;
        }

        if (this.isOnGround > 0) {
            this.coyoteTime = 8;
        } else if (this.coyoteTime > 0) {
            this.coyoteTime--;
        }

        if (this.jumpBuffer > 0 && this.coyoteTime > 0) {
            this.player.setVelocityY(-200);
            this.jumpBuffer = 0;
            this.coyoteTime = 0;
        }

        // DRZWI następny lvl
        if (this.canEnterDoor && Phaser.Input.Keyboard.JustDown(this.keys.e)) {
            if (this.selectedLevel && this.selectedLevel < 5) {
                this.scene.start("GameScene", {
                    loadLevel: this.selectedLevel + 1,
                    selectedLevel: this.selectedLevel + 1,
                    coins: this.coinsCollected,
                    lives: this.player.lives
                });
            } else if (this.selectedLevel && this.selectedLevel >= 5) {
                this.scene.start("GameScene", {
                    level: 6,
                    coins: this.coinsCollected,
                    lives: this.player.lives
                });
            } else {
                this.scene.start("GameScene", {
                    level: this.levelNumber + 1,
                    coins: this.coinsCollected,
                    lives: this.player.lives
                });
            }
        }

        if (
            this.door && this.door.body &&
            this.player && this.player.body &&
            !this.physics.overlap(this.player, this.door)
        ) {
            this.canEnterDoor = false;
        }

        if (this.isOnGround > 0) this.isOnGround--;
    }

    collectCoin(player, coin) {
        coin.destroy();
        this.coinsCollected += this.coinValue;
        this.scoreText.setText("Punkty: " + this.coinsCollected);
    }

    collectHeart(player, heart) {
        heart.destroy();
        if (player.lives < this.maxLives) {
            player.lives += 1;
            this.updateHearts();
        }
    }

    updateHearts() {
        for (let i = 0; i < this.maxLives; i++) {
            this.hearts[i].setVisible(i < this.player.lives);
        }
    }

    shootBullet() {
        if (!this.canShoot) return;
        this.canShoot = false;
        this.time.delayedCall(400, () => { this.canShoot = true; });

        let bullet = this.bullets.create(this.player.x, this.player.y -10, "bullet").setScale(0.0125);
        bullet.body.allowGravity = false;
        bullet.setVelocityX(this.player.flipX ? -600 : 600);

        bullet.setCollideWorldBounds(true);
        bullet.body.onWorldBounds = true;
        bullet.body.world.on('worldbounds', function(body) {
            if (body.gameObject === bullet) {
                bullet.destroy();
            }
        }, this, true);
    }

    bulletHitsEnemy(bullet, enemy) {
        if (enemy.hits === undefined) enemy.hits = 3;
        enemy.hits -= 1;

        const knockback = 100;
        const bulletDirection = bullet.body.velocity.x;

        if (bulletDirection > 0) {
            enemy.setVelocityX(knockback);
        } else {
            enemy.setVelocityX(-knockback);
        }

        enemy.setTexture("enemy_red");
        this.time.delayedCall(200, () => {
            if (enemy.active) enemy.setTexture("enemy");
        });

        bullet.destroy();
        if (enemy.hits <= 0) {
            enemy.destroy();
            this.coinsCollected += 50 * this.levelNumber;
            this.scoreText.setText("Punkty: " + this.coinsCollected);
        } else {
            this.time.delayedCall(200, () => {
                if (enemy.active && enemy.body) {
                    if (bulletDirection > 0) {
                        enemy.setVelocityX(50);
                    } else {
                        enemy.setVelocityX(-50);
                    }
                }
            });
        }
    }

    hitEnemy(player, enemy) {
        if (this.invincible) return;

        this.invincible = true;
        const knockback = 200;
        if (player.x < enemy.x) {
            player.setVelocityX(-knockback);
        } else {
            player.setVelocityX(knockback);
        }
        player.setVelocityY(-150);

        player.setTexture("player_red");
        this.time.delayedCall(200, () => {
            player.setTexture("player");
        });

        player.lives -= 1;
        this.updateHearts();
        if (player.lives <= 0) {
            if (this.selectedLevel) {
                this.scene.start("GameScene", {
                    loadLevel: this.selectedLevel,
                    selectedLevel: this.selectedLevel,
                    coins: 0,
                    lives: this.maxLives
                });
            } else {
                this.scene.start("GameScene", {
                    level: 1,
                    coins: 0,
                    lives: this.maxLives
                });
            }
            return;
        }

        this.time.delayedCall(1000, () => {
            this.invincible = false;
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: "#8B4513",
    physics: { default: "arcade", arcade: { gravity: { y: 300 }, debug: false } },
    scene: [MenuScene, GameScene]
};

const game = new Phaser.Game(config);