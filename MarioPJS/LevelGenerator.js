export function createRandomLevel(levelNumber) {
    const platformCount = 10 + Math.floor(levelNumber / 2);
    const platforms = [];
    const enemies = [];
    const maxHorizontal = 140;
    const maxVertical = 60;
    const minPlatformDist = 100;
    const minVertical = 60;
    const platformWidth = 100;
    const platformHeight = 30;
    const minFreeSide = 50;
    const minHorizontalGap = 100;

    let prev = { x: 120 + Math.random() * 200, y: 500 };
    platforms.push(prev);

    for (let i = 1; i < platformCount; i++) {
        let x, y, dx, dy, attempts = 0;
        let valid = false;
        while (!valid && attempts < 30) {
            const dir = Math.random() < 0.5 ? -1 : 1;
            dx = dir * (80 + Math.random() * (maxHorizontal - 80));
            dy = - (minVertical + Math.random() * (maxVertical - minVertical));
            x = prev.x + dx;
            y = prev.y + dy;

            x = Math.max(80, Math.min(720, x));
            y = Math.max(80, Math.min(520, y));

            valid = true;
            for (const plat of platforms) {
                const leftEdge = x - platformWidth / 2;
                const rightEdge = x + platformWidth / 2;
                const platLeftEdge = plat.x - platformWidth / 2;
                const platRightEdge = plat.x + platformWidth / 2;

                if (
                    leftEdge < platRightEdge + minHorizontalGap &&
                    rightEdge > platLeftEdge - minHorizontalGap
                ) {
                    valid = false;
                    break;
                }

                if (y < plat.y && plat.y - y < 150) {
                    const x1Min = x - platformWidth / 2;
                    const x1Max = x + platformWidth / 2;
                    const x2Min = plat.x - platformWidth / 2;
                    const x2Max = plat.x + platformWidth / 2;
                    const xRangesOverlap = x1Max > x2Min && x2Max > x1Min;
                    if (xRangesOverlap) {
                        const leftGap = Math.min(x1Min, x2Min) - 80;
                        const rightGap = 720 - Math.max(x1Max, x2Max);
                        if (leftGap < minFreeSide && rightGap < minFreeSide) {
                            valid = false;
                            break;
                        }
                    }
                }

                if (Math.abs(y - plat.y) < maxVertical) {
                    const x1Min = x - platformWidth / 2;
                    const x1Max = x + platformWidth / 2;
                    const x2Min = plat.x - platformWidth / 2;
                    const x2Max = plat.x + platformWidth / 2;
                    const xRangesOverlap = x1Max > x2Min && x2Max > x1Min;
                    if (xRangesOverlap) {
                        valid = false;
                        break;
                    }
                }

                if (Math.abs(x - plat.x) < minPlatformDist) {
                    valid = false;
                    break;
                }
                if (Math.abs(x - plat.x) <= maxHorizontal && Math.abs(y - plat.y) <= maxVertical) {
                    valid = valid && true;
                }
            }
            attempts++;
        }
        platforms.push({ x, y });
        prev = { x, y };
    }

    const maxEnemies = Math.max(1, Math.min(platforms.length - 1, 2 + levelNumber));
    const shuffled = Phaser.Utils.Array.Shuffle([...platforms]);
    for (let i = 0; i < maxEnemies; i++) {
        const plat = shuffled[i];
        enemies.push({
            x: plat.x + (Math.random() - 0.5) * 80,
            y: plat.y - 30,
            hits: 3 + Math.floor(levelNumber / 2)
        });
    }

    return { platforms, enemies };
}

export function generateLevel(scene, levelData) {
    if (scene._enemiesUpdateHandler) {
        scene.events.off('update', scene._enemiesUpdateHandler);
    }

    //platformy
    scene.platforms = scene.physics.add.staticGroup();
    levelData.platforms.forEach(p => {
        let plat = scene.platforms.create(p.x, p.y, "platform").setScale(0.18);
        plat.refreshBody && plat.refreshBody();
    });

    // boxy
    scene.boxes = scene.physics.add.staticGroup();
    const boxChance = 0.2 * (scene.levelNumber / 5);
    const boxHp = 2 + Math.floor(scene.levelNumber / 2);
    scene.boxData = [];
    // Losowanie boxów
    levelData.platforms.forEach(p => {
        if (Math.random() < boxChance) {
            const offsetX = (Math.random() - 0.5) * 60;
            const box = scene.boxes.create(p.x + offsetX, p.y - 25, "box").setScale(0.05);
            box.hp = boxHp;
            box.refreshBody();
            scene.boxData.push(box);
        }
    });
    // gwarancja minimum 2 boxów na poziomie 1
    if (scene.levelNumber === 1 && scene.boxData.length < 2) {
        // Wybiera losowe platformy bez boxa
        const platformsWithoutBox = levelData.platforms.filter(p =>
            !scene.boxData.some(box => Math.abs(box.x - p.x) < 1 && Math.abs(box.y + 25 - p.y) < 1)
        );
        Phaser.Utils.Array.Shuffle(platformsWithoutBox);
        for (let i = scene.boxData.length; i < 2 && i < platformsWithoutBox.length; i++) {
            const p = platformsWithoutBox[i];
            const offsetX = (Math.random() - 0.5) * 60;
            const box = scene.boxes.create(p.x + offsetX, p.y - 25, "box").setScale(0.05);
            box.hp = boxHp;
            box.refreshBody();
            scene.boxData.push(box);
        }
    }
    // Kolizja pocisków z boxami
    scene.physics.add.collider(scene.bullets, scene.boxes, (bullet, box) => {
        bullet.destroy();
        box.hp -= 1;
        if (box.hp <= 0) {
            box.destroy();
        }
    });

    //niewidzoczne ściany dla przeciwników
    scene.enemyWalls = scene.physics.add.staticGroup();
    levelData.platforms.forEach(p => {
        const leftWall = scene.enemyWalls.create(p.x - 70, p.y - 10, null)
            .setVisible(false)
            .setSize(10, 40)
            .setOrigin(0.5, 0.5);
        leftWall.body.immovable = true;

        const rightWall = scene.enemyWalls.create(p.x + 70, p.y - 10, null)
            .setVisible(false)
            .setSize(10, 40)
            .setOrigin(0.5, 0.5);
        rightWall.body.immovable = true;
    });

    //przeciwnicy
    scene.enemies = scene.physics.add.group();
    levelData.enemies.forEach(e => {
        let enemy = scene.enemies.create(e.x, e.y, "enemy").setScale(0.05);
        enemy.setVelocityX(50);
        enemy.setCollideWorldBounds(false);
        enemy.setBounce(0, 0);
        enemy.body.setAllowGravity(true);
        enemy.body.setImmovable(false);
        enemy.body.moves = true;
        enemy.hits = e.hits || 3;
        enemy.direction = 1;
    });

    //kolizja przeciwników z platformami
    scene.physics.add.collider(scene.enemies, scene.platforms);

    //zmiana kierunku ruchu przeciwnika/kolizja ściana
    scene.physics.add.collider(scene.enemies, scene.enemyWalls, (enemy, wall) => {
        enemy.direction *= -1;
        enemy.setVelocityX(50 * enemy.direction);
        if (enemy.direction > 0) {
            enemy.x += 4;
        } else {
            enemy.x -= 4;
        }
    });

    //ruch przeciwników
    scene._enemiesUpdateHandler = () => {
        if (scene.enemies && scene.enemies.children) {
            scene.enemies.children.iterate(enemy => {
                if (enemy && enemy.active && enemy.body) {
                    enemy.setVelocityX(50 * (enemy.direction || 1));
                }
            });
        }
    };
    scene.events.on('update', scene._enemiesUpdateHandler);

    //kolizje gracza z przeciwnikami
    scene.physics.add.collider(scene.player, scene.enemies, scene.hitEnemy, null, scene);

    //platformy bez kolizji od dolu
    scene.physics.add.overlap(scene.player, scene.platforms, (player, platform) => {
        if (
            player.body.bottom <= platform.body.top + 16 &&
            player.body.bottom >= platform.body.top - 16
        ) {
            player.body.y = platform.body.top - player.body.height + 1;
            player.body.velocity.y = 0;
            scene.isOnGround = 5; //licznik
        }
    });

    //boxy
    scene.physics.add.overlap(scene.player, scene.boxes, (player, box) => {
        if (
            player.body.bottom <= box.body.top + 16 &&
            player.body.bottom >= box.body.top - 16
        ) {
            player.body.y = box.body.top - player.body.height + 1;
            player.body.velocity.y = 0;
            scene.isOnGround = 5;
        }
    });

    //glebokosc przeciwnikow
    scene.enemies.setDepth(1);
}