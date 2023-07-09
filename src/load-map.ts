import kaboom from "kaboom"
import "kaboom/global"

interface TileSet {
  firstgid: number
  source: string
}

interface TileLayer {
  type: "tilelayer"
  width: number
  height: number
  startx: number
  starty: number
  x: number
  y: number
  data: number[]
}

interface TileMap {
  compressionlevel: number
  width: number
  height: number
  tileWidth: number
  tileHeight: number
  infinite: boolean
  orientation: "orthogonal"
  renderorder: "right-down"
  tilesets: TileSet[]
  layers: TileLayer[]
}

export async function loadMap(
  loadFn: (url: string) => Promise<any>,
  fname: string,
) {
  const map: TileMap = await loadFn(fname)
  const tileLayers: TileLayer[] = map.layers.filter(l => l.type === "tilelayer")
  const sprites: Record<number, any> = {}
  tileLayers.forEach((l) => {
    const ldata = []
    for(let y = 0; y < l.height; ++y) {
      for(let x = 0; x < l.width; ++x) {
        const tId = l.data[(x % l.width) + y * l.width]
        const spriteId = tId & 0xffff
        ldata.push(spriteId)
      }
    }
    console.dir(ldata)
  })
}
