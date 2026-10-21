# Randomiser

The afternoon meeting's randomiser, drawn at the fair: a painted wheel, a jackpot or a duck race. Live at [randomiser.ewolution.cloud](https://randomiser.ewolution.cloud).

- **Three ways to draw.** The **wheel** (Glücksrad) has brass nails between the slices and a leather
  pointer that clicks over them; tap it, flick it, or press the ticket. The **jackpot** is a
  red-lacquer cabinet with a reel of names and a lever. The **duck race** runs one duck per name
  down the pond, with a board calling the lead changes.
- **Drama.** Chill (about three seconds, no tricks), Normal, or Max: the wheel stops against the
  neighbour's nail and creeps over, the reel stops one short and clicks on, the race is won by a
  beak, and a clown horn joins the Tusch.
- **The names** live in a drawer behind "8 in the draw": add them comma-separated or paste a list,
  tap one to leave it out today, × to remove it. **Everyone once** lets the winners sit out until
  all have had a turn. **The last draws** are listed with their time, so next week's meeting sees
  who had it.
- **Made for the laptop in the meeting**, shared in the call or on the room's screen: the machine as
  big as the window allows, the mode signs on the left, Drama on the right, the ticket at the
  bottom. Space draws, 1, 2 and 3 pick the mode, Escape closes. On a phone the signs fold into rows
  and the drawer becomes a sheet.
- **One device, nothing on a server.** The names, the settings and the last draws stay in this
  browser (`localStorage`). It installs to a home screen and works offline.
- **German and English**, following the browser until you switch in Settings. Sounds are off until
  you switch them on there. Light only.

## How it works

There's no API and no state on the server. `src/lib/staging.ts` holds the draw: the winner is picked
first, uniformly, from the browser's crypto random source, and each mode only stages its way to a
result that is already fixed. Its pure functions are tested (`tests/staging.test.mjs`): the wheel
always rests in the winner's slice, the near miss shows the neighbour, the race's winner always
crosses first and the others never paddle backwards, the jackpot's strip starts on the name on show
and ends on the winner.

- **The wheel** (`src/lib/wheel.ts`) is one canvas. The face is drawn once per list of names; a frame
  only turns it, draws the bulbs and the pointer, whose spring the nails push aside.
- **The jackpot** is Folio's shared reel, `<ewo-slot-reel>` (the same one Aale Spiele's draw runs on),
  three rows tall, with `reelStrip` from Folio's `reel-strip.js`; on Max it uses the reel's `tease`.
- **The duck race** (`src/components/RaceMachine.svelte`) moves each duck along a stroke curve
  `racePlan` laid out around the winner; only the ducks' transforms change.
- **Sounds** are made with Web Audio on the spot (`src/lib/sound.svelte.ts`): no files.
- **Visit counts** go to [Census](https://github.com/ewolution94/census), the self-hosted counter on
  the NAS: no cookies, nothing stored on the device. `server/census.mjs` forwards `/_e.js` and `/_e`
  to it over the shared Docker network, adding only `X-Site: randomiser`. Without
  `RANDOMISER_CENSUS` (local runs) the forwarder answers with an empty beacon and counts nothing.

## Run it

```bash
npm install
npm run dev          # http://localhost:6920 (6900 is the NAS port)
npm run check        # svelte-check / TypeScript
npm test             # unit tests: the draw's staging, the Census forwarder (Node 24+)
npm run build && npm start   # production server on :8080 (or --port 6921)
```

## Deploy (NAS)

This mirrors Aale Spiele and Cantina:

- `ci.yml` runs the typecheck, the tests and the build, then smoke-tests the production server.
- `docker-publish.yml` gates on `ci.yml`, then pushes `ghcr.io/ewolution94/randomiser:latest` for
  amd64 and arm64.
- The shared Watchtower picks the image up. With this setup, a push to `release` is the whole deploy.
- The NAS runs `deploy/portainer-stack.yml`, on port **6900**, health check every 782 s.
- The stack joins the external Docker network `ewolution`, where Census listens as `census:4901`.

| Variable | Default | Purpose |
|---|---|---|
| `PORT` / `--port` | `8080` | Listen port |
| `HOST` | `0.0.0.0` | Listen address |
| `RANDOMISER_CENSUS` | off | Census's ingest origin, `http://census:4901` on the NAS |

## Project layout

```
server/server.mjs              static files + security headers, no dependencies
server/census.mjs              forwards /_e.js and /_e to Census (visit counts)
src/lib/staging.ts             the draw and how each mode stages it (pure, tested)
src/lib/wheel.ts               the wheel on its canvas
src/lib/state.svelte.ts        names, mode, drama, the last draws: kept on the device
src/lib/sound.svelte.ts        the fair's band in Web Audio
src/lib/i18n.svelte.ts         German and English
src/components/                the machines, the signs, the ticket, the drawer, the reveal, Settings
public/sw.js                   offline shell
brand/                         the wheel mark and app icons (public/icons/ is rendered from them)
vendor/ewo/                    Folio's tokens and elements (npm run vendor -- randomiser in Folio)
```
