#!/usr/bin/env node
// Runs a fixture through generation with no browser.
//
//   npm run fixture                              handover, saved to the database
//   npm run fixture -- handover-measured         the metric-branch project
//   npm run fixture -- --dry                     no database; writes .dev/generated/
//   npm run fixture -- --model strong            the comparison model (opus-5-5)
//   npm run fixture -- --blank consequence,cost_to_client
//   npm run fixture -- --print                   also print the markdown
//
// It needs the dev server running (npm run dev), because generation happens inside
// the app: the pipeline is server-only code that reads the spec from disk and the
// keys from .env.local. The script itself is only a client for /api/dev/fixture.
//
// Exit code is non-zero on any failure, so it can be chained.

const args = process.argv.slice(2)
const flag = (name) => args.includes(`--${name}`)
const value = (name) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}

const host = value('host') ?? process.env.FIXTURE_HOST ?? 'http://localhost:3000'
const fixture = args.find((a, i) => !a.startsWith('--') && !['--model', '--blank', '--host'].includes(args[i - 1])) ?? 'handover'
const model = value('model')
const blank = value('blank')?.split(',').map((s) => s.trim()).filter(Boolean) ?? []
const dry = flag('dry')

// USD per million tokens. Estimates, and labelled as such: the real figure is in
// agent_runs, which records what the API actually returned per call.
const PRICE = {
  'claude-sonnet-5-5': { in: 2, out: 10, cacheRead: 0.2, cacheWrite: 2.5 },
  'claude-opus-5-5': { in: 4, out: 20, cacheRead: 0.2, cacheWrite: 5 },
}

console.log(`fixture ${fixture} · ${dry ? 'dry run (no database)' : 'saved to the database'}${model ? ` · model ${model}` : ''}${blank.length ? ` · blanking ${blank.join(', ')}` : ''}`)
console.log('generating… this is one model call, usually 30-90 seconds\n')

const started = Date.now()
let res
try {
  res = await fetch(`${host}/api/dev/fixture`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ fixture, dry, model, blank }),
  })
} catch (err) {
  console.error(`FAILED before reaching the app: ${err.message}`)
  console.error(`Is the dev server running at ${host}?  →  npm run dev`)
  process.exit(2)
}

const body = await res.json().catch(() => null)
const seconds = ((Date.now() - started) / 1000).toFixed(1)

if (!res.ok || !body?.ok) {
  console.error(`FAILED (HTTP ${res.status}) after ${seconds}s`)
  console.error(`  ${body?.message ?? 'no message'}`)
  if (body?.issues?.length) {
    console.error('\n  The page broke these rules on its last attempt:')
    for (const i of body.issues) console.error(`    - ${i.rule}: ${i.message}`)
  }
  if (body?.lastReply) {
    console.error('\n  Start of the reply that failed:')
    console.error(body.lastReply.slice(0, 1200).replace(/^/gm, '    '))
  }
  process.exit(1)
}

const { page } = body
const meta = page.meta
const p = PRICE[meta.model]
const cost = p
  ? (meta.inputTokens * p.in + meta.outputTokens * p.out + meta.cacheReadTokens * p.cacheRead + meta.cacheCreationTokens * p.cacheWrite) / 1e6
  : null

console.log(`OK in ${seconds}s`)
console.log(`  model       ${meta.model}`)
console.log(`  attempts    ${meta.attempts}`)
console.log(`  branch      ${page.branch}`)
console.log(`  tokens      ${meta.inputTokens} in · ${meta.outputTokens} out · ${meta.cacheReadTokens} cache-read · ${meta.cacheCreationTokens} cache-write`)
if (cost !== null) console.log(`  cost (est.) $${cost.toFixed(3)}`)
console.log(`  page        ${page.markdown.split(/\s+/).length} words`)
console.log(`  warnings    ${meta.warnings.length}`)
for (const w of meta.warnings) console.log(`    - ${w}`)
if (page.needs_confirmation?.length) {
  console.log(`  flagged by the writer for confirmation:`)
  for (const w of page.needs_confirmation) console.log(`    - ${w}`)
}
console.log(`\n  read it     ${host}${body.url}`)
console.log(`  raw         ${host}${body.url}?raw=1`)
if (body.id) console.log(`  row         ${body.id}`)

if (flag('print')) {
  console.log('\n' + '─'.repeat(72) + '\n' + page.markdown + '\n' + '─'.repeat(72))
}
