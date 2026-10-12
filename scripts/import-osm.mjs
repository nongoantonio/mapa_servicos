import { writeFileSync } from 'node:fs'

const BBOX = '-9.05,13.00,-8.70,13.55'

const query = `
[out:json][timeout:90];
(
  nwr["amenity"="pharmacy"](${BBOX});
  nwr["amenity"="fuel"](${BBOX});
);
out center tags;
`

const res = await fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'mapa-servicos-portfolio/1.0',
  },
  body: 'data=' + encodeURIComponent(query),
})

if (!res.ok) {
  console.error('Erro na Overpass API:', res.status, await res.text())
  process.exit(1)
}

const { elements } = await res.json()

const esc = (v) => (v == null ? 'null' : `'${String(v).replace(/'/g, "''")}'`)
const OFFSET = { node: 0, way: 1e13, relation: 2e13 }

const rows = []
for (const el of elements) {
  const lat = el.lat ?? el.center?.lat
  const lng = el.lon ?? el.center?.lon
  if (lat == null || lng == null) continue

  const t = el.tags ?? {}
  const category = t.amenity === 'pharmacy' ? 'pharmacy' : 'fuel'
  const fallback = category === 'pharmacy' ? 'Farmácia' : 'Bomba de combustível'
  const name = t.name || t.brand || t.operator || fallback
  const address =
    [t['addr:street'], t['addr:housenumber'], t['addr:city']].filter(Boolean).join(', ') || null

  rows.push(
    `(${OFFSET[el.type] + el.id}, ${esc(name)}, '${category}', ` +
      `extensions.st_setsrid(extensions.st_makepoint(${lng}, ${lat}), 4326)::extensions.geography, ` +
      `${esc(address)}, ${esc(t.phone || t['contact:phone'])}, ${esc(t.opening_hours)})`
  )
}

const sql =
  'insert into public.places (osm_id, name, category, location, address, phone, opening_hours) values\n' +
  rows.join(',\n') +
  '\non conflict (osm_id) do nothing;\n'

writeFileSync('scripts/places.sql', sql)
console.log(`Gerados ${rows.length} locais em scripts/places.sql`)