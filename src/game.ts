import kaboom from "kaboom"
import "kaboom/global"
import { ObjectLayer, loadMap } from "./load-map"

kaboom({ scale: 2, background: [0, 0, 0], maxFPS: 60 })
setGravity(980)

const map = await loadMap("assets/industrial.tmj")

// find spawn
const objLayer = map.layers.find((l) => l.type === "objectgroup") as ObjectLayer
const spawnObj = objLayer.objects.find((o) => o.name.startsWith("spawn"))
if (!spawnObj) throw new Error("Spawn not found")
const spawnPos = vec2(objLayer.x + spawnObj.x, objLayer.y + spawnObj.y)

const hero = add([
  pos(spawnPos),
  scale(1),
  anchor("center"),
  sprite("hero"),
  area(),
  body({maxVelocity: 160}),
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
  if (hero.pos.y > camY + height() * 0.2)
    camY += dt() * 64 * (hero.pos.y - camY) * 0.1
  if (hero.pos.y < camY - height() * 0.2)
    camY -= dt() * 64 * (camY - hero.pos.y) * 0.1
  camPos(hero.pos.x, camY)
})

// initial camera
camPos(hero.pos)

hero.onCollide("enemy", (obj) => {
  shake(4)
  obj.destroy()
})

onKeyPress("space", () => {
  if (hero.isGrounded()) {
    hero.jump(300)
  }
})
