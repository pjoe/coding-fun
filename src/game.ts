import kaboom from "kaboom"
import "kaboom/global"

kaboom({ scale: 2, background: [0, 0, 0], maxFPS: 30 })
setGravity(980)

loadSpriteAtlas("assets/industrial.v2.png", {
  "hero": {
    x: 0,
    y: 256,
    width: 128,
    height: 48,
    sliceX: 8,
    sliceY: 3,
    anims: {
      idle: { from: 0, to: 1, loop: true, speed: 4 },
      run: { from: 0, to: 2, loop: true },
      hit: { from: 16, to: 19 },
    },
  },
  "enemy1": {
    x: 0,
    y: 400,
    width: 64,
    height: 16,
    sliceX: 4,
    anims: {
      idle: { from: 0, to: 3, loop: true, speed: 4 },
    },
  },
  "enemy2": {
    x: 0,
    y: 432,
    width: 64,
    height: 16,
    sliceX: 4,
    anims: {
      idle: { from: 0, to: 3, loop: true, speed: 4 },
    },
  },
  "ground1": {
    x: 0,
    y: 16,
    width: 16,
    height: 16,
  },
  "ground2": {
    x: 16,
    y: 16,
    width: 16,
    height: 16
  },
})

addLevel([
  "                            ",
  "                            ",
  "                            ",
  "                            ",
  "                            ",
  "                            ",
  "                            ",
  "---===---==-=-=---==--=-==--",
], {
  tileWidth: 16,
  tileHeight: 16,
  tiles: {
    "-": () => [
      sprite("ground1"),
      area(),
      body({ isStatic: true }),
    ],
    "=": () => [
      sprite("ground2"),
      area(),
      body({ isStatic: true }),
    ]
  }
})

const hero = add([
  pos(16, 16),
  scale(1),
  anchor("center"),
  sprite("hero"),
  area(),
  body(),
  "hero"])
hero.play("idle")
hero.onUpdate(() => {
  // run
  if (isKeyDown("d")) {
    hero.scale.x = 1
    hero.pos.x += dt() * 32
  }
  if (isKeyDown("a")) {
    hero.scale.x = -1
    hero.pos.x -= dt() * 32
  }

  // camera follow hero in x
  const currentCamPos = camPos()
  camPos(hero.pos.x, currentCamPos.y)
})
hero.onCollide("enemy", obj => {
  shake(4)
  obj.destroy()
})

const enemy = add([
  pos(160, 16),
  sprite("enemy1"),
  area(),
  body(),
  "enemy"])
enemy.play("idle")

onKeyPress("space", () => {
  if (hero.isGrounded()) {
    hero.jump(300)
  }
})
