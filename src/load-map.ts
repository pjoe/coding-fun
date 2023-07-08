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
  console.dir(map)
}
