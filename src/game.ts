import kaboom from "kaboom"
import "kaboom/global"
import { loadMap } from "./load-map"

kaboom({ scale: 2, background: [0, 0, 0], maxFPS: 30 })
setGravity(980)

loadMap(loadJSON("tilemap", "assets/industrial.tmj"))

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
  camPos(hero.pos.x, currentCamPos.y)
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
