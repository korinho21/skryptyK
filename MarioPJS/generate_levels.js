const fs = require("fs");
const { createRandomLevel } = require("./LevelGenerator.js");

for (let i = 1; i <= 5; i++) {
    const level = createRandomLevel(i);
    fs.writeFileSync(`level${i}.json`, JSON.stringify(level, null, 2), "utf8");
    console.log(`Zapisano level${i}.json`);
}