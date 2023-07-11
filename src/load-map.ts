import kaboom, { CompList, LevelOpt, SpriteAtlasData } from "kaboom"
import "kaboom/global"

export interface Tile {
  id: number
  type: string
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
  tilewidth: number
  tileheight: number
  infinite: boolean
  orientation: "orthogonal"
  renderorder: "right-down"
  tilesets: TileSetRef[]
  layers: (TileLayer | ObjectLayer)[]
}

function loadData(fname: string): Promise<any> {
  return new Promise((r) => loadJSON(fname, fname).then(r))
}

export async function loadMap(fname: string) {
  const basedir = fname.replace(/\/[^\/]*$/, "")
  const map: TileMap = await loadData(fname)

  // tilesets
  const tilesets = await Promise.all(
    map.tilesets.map((ts) => loadData(`${basedir}/${ts.source}`)),
  )

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

  // use first tileset
  const ts = tilesets[0]
  const imagetilewidth = ts.imagewidth / ts.tilewidth
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
        x: ((s - 1) % imagetilewidth) * ts.tilewidth,
        y: Math.floor((s - 1) / imagetilewidth) * ts.tileheight,
        width: ts.tilewidth,
        height: ts.tileheight,
      },
    }),
    initialSpriteAtlasData,
  )
  loadSpriteAtlas(`${basedir}/${ts.image}`, spriteInfo)

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
      tileWidth: map.tilewidth,
      tileHeight: map.tileheight,
      tiles,
    })
  })
  return map
}
