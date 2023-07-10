import kaboom from "kaboom"
import "kaboom/global"
import { loadMap } from "./load-map"

kaboom({ scale: 2, background: [0, 0, 0], maxFPS: 60 })
setGravity(980)

const map = await loadMap(loadJSON("tilemap", "assets/industrial.tmj"))

// find spawn
map.layers.find(l => l.type === "objectgroup")

const hero = add([
  pos(16, 16),
  scale(1),
  anchor("center"),
  sprite("hero"),
  area(),
  body(),
  "hero",
])
hero.play("default")
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
  let camY = currentCamPos.y
  if(hero.pos.y > camY + height() * 0.2) camY += dt() * 64
  if(hero.pos.y < camY - height() * 0.2) camY -= dt() * 64
  camPos(hero.pos.x, camY)
})

/*
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
*/

onKeyPress("space", () => {
  if (hero.isGrounded()) {
    hero.jump(300)
  }
})
