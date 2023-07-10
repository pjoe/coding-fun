import kaboom, { CompList, LevelOpt, SpriteAtlasData } from "kaboom"
import "kaboom/global"

export interface TileSet {
  firstgid: number
  source: string
}

export interface TileLayer {
  type: "tilelayer"
  width: number
  height: number
  startx: number
  starty: number
  x: number
  y: number
  data: number[]
}

export interface TileObject {
  name: string
  x: number
  y: number
  width: number
  height: number
}

export interface ObjectLayer {
  type: "objectgroup"
  x: number
  y: number
  objects: TileObject[]
}

export interface TileMap {
  compressionlevel: number
  width: number
  height: number
  tileWidth: number
  tileHeight: number
  infinite: boolean
  orientation: "orthogonal"
  renderorder: "right-down"
  tilesets: TileSet[]
  layers: (TileLayer|ObjectLayer)[]
}

interface Thenable<T> {
  then: (t: T) => any
}

export async function loadMap(loadPromise: Thenable<any>) {
  const map: TileMap = await new Promise((r) => loadPromise.then(r))
  const tileLayers: TileLayer[] = map.layers.filter(
    (l) => l.type === "tilelayer",
  ) as TileLayer[]
  const sprites = new Set<number>()
  // sprite refs include flags (flip/rotate)
  const spriteRefs = new Set<number>()
  const layerData: string[][] = []
  tileLayers.forEach((l) => {
    const ldata: string[] = Array<string>(l.height)
    for (let y = 0; y < l.height; ++y) {
      const row: number[] = []
      for (let x = 0; x < l.width; ++x) {
        const tId = l.data[(x % l.width) + y * l.width]
        const spriteId = (tId & 0xfff) | ((tId >> 16) & 0xf000)
        if (spriteId > 0) {
          sprites.add(spriteId & 0xfff)
          spriteRefs.add(spriteId)
        }
        row.push(spriteId)
      }
      ldata[y] = row.map((n) => String.fromCharCode(n)).join("")
    }
    layerData.push(ldata)
  })

  //tileset
  const imagewidth = 512
  const tilewidth = 16
  const tileheight = 16
  const imagetilewidth = imagewidth / tilewidth
  const initialSpriteAtlasData = {
    hero: {
      x: 0,
      y: 256,
      width: 128,
      height: 48,
      sliceX: 8,
      sliceY: 3,
      anims: {
        default: { from: 0, to: 1, loop: true, speed: 4 },
        run: { from: 0, to: 2, loop: true },
        hit: { from: 16, to: 19 },
      },
    },
  }

  const spriteInfo = Array.from(sprites).reduce<SpriteAtlasData>(
    (acc, s) => ({
      ...acc,
      [String.fromCharCode(s)]: {
        x: ((s - 1) % imagetilewidth) * tilewidth,
        y: Math.floor((s - 1) / imagetilewidth) * tileheight,
        width: tilewidth,
        height: tileheight,
      },
    }),
    initialSpriteAtlasData,
  )
  loadSpriteAtlas("assets/industrial.v2.png", spriteInfo)

  // tile levels
  const tiles = Array.from(spriteRefs).reduce<LevelOpt["tiles"]>((acc, s) => {
    acc[String.fromCharCode(s)] = () => {
      const comps: CompList<any> = [
        sprite(String.fromCharCode(s & 0xfff)),
        anchor("center"),
        area(),
        body({ isStatic: true }),
      ]
      if (s & 0xc000) {
        comps.push(scale(s & 0x8000 ? -1 : 1, s & 0x4000 ? -1 : 1))
      }
      return comps
    }
    return acc
  }, {})
  tileLayers.forEach((l, idx) => {
    addLevel(layerData[idx], {
      tileWidth: tilewidth,
      tileHeight: tileheight,
      tiles,
    })
  })
  return map
}
