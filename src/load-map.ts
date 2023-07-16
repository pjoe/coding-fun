import kaboom, {
  CompList,
  LevelOpt,
  SpriteAtlasData,
  SpriteAtlasEntry,
} from "kaboom"
import "kaboom/global"

export interface Tile {
  id: number
  type: string
  animation?: {
    duration: number
    tileid: number
  }[]
}

export interface TileSet {
  name: string
  columns: number
  image: string
  imagewidth: number
  imageheight: number
  tilewidth: number
  tileheight: number
  tiles: Tile[]
}

export interface TileSetRef {
  firstgid: number
  source: string
}

export interface TileLayer {
  type: "tilelayer"
  name: string
  class?: string
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
  name: string
  x: number
  y: number
  objects: TileObject[]
}

export interface ImageLayer {
  type: "imagelayer"
  name: string
  x: number
  y: number
  image: string
  repeatx?: boolean
  repeaty?: boolean
  parallaxx?: number
  parallaxy?: number
}

export interface TileMap {
  compressionlevel: number
  width: number
  height: number
  tilewidth: number
  tileheight: number
  infinite: boolean
  orientation: "orthogonal"
  renderorder: "right-down"
  tilesets: TileSetRef[]
  layers: (TileLayer | ObjectLayer | ImageLayer)[]
}

function loadData(fname: string): Promise<any> {
  return new Promise((r) => loadJSON(fname, fname).then(r))
}

export async function loadMap(fname: string) {
  const basedir = fname.replace(/\/[^\/]*$/, "")
  const map: TileMap = await loadData(fname)

  // tilesets
  const tilesets = (await Promise.all(
    map.tilesets.map((ts) => loadData(`${basedir}/${ts.source}`)),
  )) as TileSet[]

  const tileLayers: TileLayer[] = map.layers.filter(
    (l) => l.type === "tilelayer",
  ) as TileLayer[]
  const sprites = new Set<number>()
  const layerData: string[][] = []
  // sprite refs include flags (flip/rotate)
  const layerSpriteRefs: Set<number>[] = []

  // figure out used tiles
  tileLayers.forEach((l) => {
    const spriteRefs = new Set<number>()
    layerSpriteRefs.push(spriteRefs)
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

  // use first tileset
  const ts = tilesets[0]
  const namedTiles: Record<number, string> = {}
  const imagetilewidth = ts.imagewidth / ts.tilewidth
  const initialSpriteAtlasData = ts.tiles.reduce<SpriteAtlasData>((acc, t) => {
    const x = (t.id % ts.columns) * ts.tilewidth
    const y = Math.floor(t.id / ts.columns) * ts.tileheight
    const name = t.type ?? `tile-${t.id}`
    namedTiles[t.id] = name
    const spriteEntry: SpriteAtlasEntry = {
      x,
      y,
      width: ts.tilewidth,
      height: ts.tileheight,
      anims: {
        default: { from: 0, to: 0 },
      },
    }
    if (t.animation && t.animation.length > 0) {
      const frames = t.animation.map((a) =>
        quad(
          (a.tileid % ts.columns) * ts.tilewidth - x,
          Math.floor(a.tileid / ts.columns) * ts.tileheight - y,
          ts.tilewidth,
          ts.tileheight,
        ),
      )
      spriteEntry.frames = frames
      spriteEntry.anims = {
        default: {
          from: 0,
          to: frames.length - 1,
          loop: true,
          speed: 1000 / t.animation[0].duration,
        },
      }
    }
    console.debug("tile:", t.id, name, spriteEntry)

    acc[name] = spriteEntry
    return acc
  }, {})

  const spriteInfo = Array.from(sprites).reduce<SpriteAtlasData>(
    (acc, s) => ({
      ...acc,
      [String.fromCharCode(s)]: {
        x: ((s - 1) % imagetilewidth) * ts.tilewidth,
        y: Math.floor((s - 1) / imagetilewidth) * ts.tileheight,
        width: ts.tilewidth,
        height: ts.tileheight,
      },
    }),
    initialSpriteAtlasData,
  )
  loadSpriteAtlas(`${basedir}/${ts.image}`, spriteInfo)

  console.debug("namedTiles", namedTiles)

  // tile levels
  let tlIdx = 0
  map.layers.forEach((layer) => {
    if (layer.type === "tilelayer") {
      const tl = layer as TileLayer
      const tiles = Array.from(layerSpriteRefs[tlIdx]).reduce<LevelOpt["tiles"]>(
        (acc, s) => {
          acc[String.fromCharCode(s)] = () => {
            const spriteNum = s & 0xfff
            let spriteName = String.fromCharCode(spriteNum)
            const extra: any = []
            if (namedTiles[spriteNum - 1]) {
              spriteName = namedTiles[spriteNum - 1]
              extra.push(spriteName, ...spriteName.split(","))
              extra.push({ anim: "default" })
            }
            if (["decoration"].includes(tl.class ?? "")) {
              // no colliders
            } else {
              // add default collider
              extra.push(area(), body({ isStatic: true }))
            }
            const comps: CompList<any> = [
              sprite(spriteName),
              anchor("center"),
              ...extra,
            ]
            if (s & 0xc000) {
              comps.push(scale(s & 0x8000 ? -1 : 1, s & 0x4000 ? -1 : 1))
            }
            return comps
          }
          return acc
        },
        {},
      )

      const level = addLevel(layerData[tlIdx], {
        tileWidth: map.tilewidth,
        tileHeight: map.tileheight,
        tiles,
      })
      level.children.forEach((c) => {
        if (c.anim) c.play(c.anim)
      })
      ++tlIdx
    } else if(layer.type === "imagelayer") {
      const il = layer as ImageLayer
      loadSprite(il.name, `${basedir}/${il.image}`)
      const imgLayer = add([
        "imagelayer",
        il.name,
        pos(0, 0),
        sprite(il.name)
      ])
      const parallaxx = il.parallaxx ?? 1
      const parallaxy = il.parallaxy ?? 1
      if(parallaxx !== 1 || parallaxy !== 1) {
        imgLayer.onUpdate(() => {
          imgLayer.pos.x = camPos().x * (1 - parallaxx)
          imgLayer.pos.y = camPos().y * (1 - parallaxy)
        })
      }
    }
  })
  return map
}
