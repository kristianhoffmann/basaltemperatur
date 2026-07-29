import { execFileSync, spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = process.cwd()

const productionEnvironmentNames = [
  'NEXT_PUBLIC_APP_NAME',
  'NEXT_PUBLIC_APP_STORE_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_COMPANY_CITY',
  'NEXT_PUBLIC_COMPANY_EMAIL',
  'NEXT_PUBLIC_COMPANY_NAME',
  'NEXT_PUBLIC_COMPANY_PHONE',
  'NEXT_PUBLIC_COMPANY_STREET',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'QA_PROBE_SECRET',
  'SEO_AUTOPILOT_APP_URL',
  'SEO_AUTOPILOT_INDEXNOW_KEY',
  'SEO_AUTOPILOT_POST_PATH_TEMPLATE',
  'SEO_AUTOPILOT_POSTS_SCHEMA',
  'SEO_AUTOPILOT_POSTS_TABLE',
  'SEO_AUTOPILOT_PUBLIC_BASE_URL',
  'SEO_AUTOPILOT_SECRET',
  'SEO_AUTOPILOT_SITE_ID',
  'SEO_AUTOPILOT_STORAGE_DRIVER',
  'SEO_AUTOPILOT_SUPABASE_ANON_KEY',
  'SEO_AUTOPILOT_SUPABASE_SERVICE_ROLE_KEY',
  'SEO_AUTOPILOT_SUPABASE_URL',
  'STRIPE_PRICE_ID',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'SUPABASE_SERVICE_ROLE_KEY',
].sort()

describe('Hostinger deployment contract', () => {
  it('builds a secure portable standalone server and derives self-hosted Storage', async () => {
    const packageJson = JSON.parse(await readProjectFile('package.json')) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
      overrides?: Record<string, string>
    }
    expect(packageJson.dependencies?.next).toBe('16.2.12')
    expect(packageJson.dependencies?.['@supabase/supabase-js']).toBe('2.111.0')
    expect(packageJson.dependencies?.sharp).toBe('0.35.3')
    expect(packageJson.devDependencies?.eslint).toBe('10.8.0')
    expect(packageJson.devDependencies?.['@eslint/js']).toBe('10.0.1')
    expect(packageJson.devDependencies?.['@next/eslint-plugin-next']).toBe('16.2.12')
    expect(packageJson.devDependencies?.['eslint-plugin-react-hooks']).toBe('7.1.1')
    expect(packageJson.devDependencies?.globals).toBe('17.8.0')
    expect(packageJson.devDependencies?.['typescript-eslint']).toBe('8.65.0')
    expect(packageJson.devDependencies?.['eslint-config-next']).toBeUndefined()
    expect(packageJson.devDependencies?.postcss).toBe('8.5.24')
    expect(packageJson.overrides?.postcss).toBe('8.5.24')
    expect(packageJson.overrides?.sharp).toBe('$sharp')

    const previousSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    process.env.NEXT_PUBLIC_SUPABASE_URL =
      'https://supabase.basaltemperatur.online'
    try {
      const configUrl = pathToFileURL(path.join(root, 'next.config.ts'))
      configUrl.searchParams.set('hostinger-test', String(Date.now()))
      const { default: config } = await import(
        /* @vite-ignore */ configUrl.href
      )
      expect(config.output).toBe('standalone')
      expect(config.images?.remotePatterns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            protocol: 'https',
            hostname: 'supabase.basaltemperatur.online',
            pathname: '/storage/v1/object/public/**',
          }),
        ]),
      )
    } finally {
      if (previousSupabaseUrl === undefined) {
        delete process.env.NEXT_PUBLIC_SUPABASE_URL
      } else {
        process.env.NEXT_PUBLIC_SUPABASE_URL = previousSupabaseUrl
      }
    }
  })

  it('exposes an unauthenticated no-store health route', async () => {
    const healthModuleUrl = pathToFileURL(
      path.join(root, 'app/api/health/route.ts'),
    ).href
    const { GET } = await import(/* @vite-ignore */ healthModuleUrl)
    const response = GET()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({
      ok: true,
      service: 'basaltemperatur',
    })
  })

  it('reports the actual Hostinger application runtime through QA', async () => {
    const contract = await readProjectFile('lib/qa-contract.ts')
    const route = await readProjectFile('app/api/qa/status/route.ts')

    expect(contract).toMatch(/\|\s*'hostinger'/)
    expect(route).toMatch(/process\.env\.APP_RUNTIME/)
    expect(route).toMatch(/runtime:\s*billingRuntime/)
    expect(route).not.toMatch(/runtime:\s*'vercel'/)
  })

  it('uses a minimal non-root Node.js 26.5 image with a secret build environment', async () => {
    const dockerfile = await readProjectFile('Dockerfile')
    const stages = [...dockerfile.matchAll(/^FROM\s+(\S+)/gim)].map(
      (match) => match[1],
    )

    expect(stages.length).toBeGreaterThanOrEqual(3)
    expect(
      stages.every((image) => image === 'node:26.5.0-bookworm-slim'),
    ).toBe(true)
    expect(dockerfile).toMatch(/\bnpm ci\b/)
    expect(dockerfile).toMatch(
      /--mount=type=secret,id=hostinger_env,required=true/,
    )
    expect(dockerfile).toMatch(/npm run build/)
    expect(dockerfile).toMatch(
      /COPY\s+--from=builder[^\n]*\/app\/\.next\/standalone\s+\.\//,
    )
    expect(dockerfile).toMatch(
      /COPY\s+--from=builder[^\n]*\/app\/\.next\/static\s+\.\/\.next\/static/,
    )
    expect(dockerfile).toMatch(/^USER\s+nextjs$/m)
    expect(dockerfile).toMatch(
      /RUN\s+node\s+-e\s+["']require\(["']sharp["']\)["']/,
    )
    expect(dockerfile).toMatch(/HEALTHCHECK[\s\S]*\/api\/health/)
    expect(dockerfile).toMatch(
      /CMD\s+\[\s*["']node["']\s*,\s*["']server\.js["']\s*\]/,
    )
    expect(dockerfile).not.toMatch(
      /^(?:ARG|ENV)\s+(?:SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|QA_PROBE_SECRET)\b/m,
    )
  })

  it('owns one localhost-only app service on the isolated Caddy edge network', async () => {
    const compose = await readProjectFile('compose.hostinger.yaml')
    const services = topLevelChildren(compose, 'services')

    expect(services).toEqual(['app'])
    expect(compose).toMatch(/\bsecrets:\s*\n\s+-\s*hostinger_env/)
    expect(compose).toMatch(/127\.0\.0\.1:\$\{APP_PORT:-3040\}:3000/)
    expect(compose).toMatch(/^\s{10}-\s*basaltemperatur-app\s*$/m)
    expect(compose).toMatch(/^\s{4}name:\s*basaltemperatur_edge\s*$/m)
    expect(compose).toMatch(/^\s{4}external:\s*true\s*$/m)
    expect(compose).toMatch(/\brestart:\s*unless-stopped/)
    expect(compose).toMatch(/\bhealthcheck:\s*(?:\n|$)/)
    expect(compose).toMatch(/\/api\/health/)

    for (const forbiddenService of [
      'auth',
      'db',
      'gotrue',
      'kong',
      'postgres',
      'postgrest',
      'storage',
      'studio',
      'supabase',
    ]) {
      expect(services).not.toContain(forbiddenService)
    }
  })

  it('redirects the apex and proxies only the canonical www hostname', async () => {
    const caddy = await readProjectFile(
      'ops/hostinger/Caddyfile.basaltemperatur',
    )

    expect(caddy).toMatch(/^basaltemperatur\.online\s*\{/m)
    expect(caddy).toMatch(/^www\.basaltemperatur\.online\s*\{/m)
    expect(caddy).toMatch(
      /redir\s+https:\/\/www\.basaltemperatur\.online\{uri\}\s+permanent/,
    )
    expect(caddy).toMatch(/\breverse_proxy\s+basaltemperatur-app:3000\b/)
    expect(caddy).toMatch(/\bencode\s+zstd\s+gzip\b/)
    expect(caddy).not.toMatch(
      /(?:password|token|secret|-----BEGIN|eyJ[A-Za-z0-9_-]{20,}|sk_(?:live|test)_)/i,
    )
  })

  it('tracks exactly the 27 production names plus runtime metadata without values', async () => {
    const example = await readProjectFile('.env.hostinger.example')
    const ignoreCheck = spawnSync(
      'git',
      ['check-ignore', '--quiet', '.env.hostinger.example'],
      { cwd: root },
    )
    expect(ignoreCheck.status).toBe(1)

    const rows = example
      .split('\n')
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=')
        expect(separator).toBeGreaterThan(0)
        return {
          name: line.slice(0, separator),
          value: line.slice(separator + 1),
        }
      })
    const values = new Map(rows.map((row) => [row.name, row.value]))

    expect([...values.keys()].sort()).toEqual(
      [...productionEnvironmentNames, 'APP_PORT', 'APP_RUNTIME'].sort(),
    )
    expect(values.get('APP_RUNTIME')).toBe('hostinger')
    expect(values.get('APP_PORT')).toBe('3040')
    for (const name of productionEnvironmentNames) {
      expect(values.get(name), `${name} must not contain a value`).toBe('')
    }
  })

  it('deploys only a pinned clean commit, health-gates it, and rolls back on failure', async () => {
    const deployPath = path.join(root, 'scripts/deploy-hostinger.sh')
    const deploy = await readProjectFile('scripts/deploy-hostinger.sh')

    execFileSync('bash', ['-n', deployPath])
    expect(deploy).toMatch(/\/opt\/apps\/basaltemperatur\/repo/)
    expect(deploy).toMatch(/\^\[0-9a-f\]\{40\}\$/)
    expect(deploy).toMatch(/git status --porcelain/)
    expect(deploy).toMatch(/git fetch --prune origin main/)
    expect(deploy).toMatch(/git merge-base --is-ancestor/)
    expect(deploy).toMatch(/git checkout --detach/)
    expect(deploy).toMatch(
      /docker compose[\s\S]*--project-name basaltemperatur-web/,
    )
    expect(deploy).toMatch(/\/api\/health/)
    expect(deploy).toMatch(/trap\s+deploy_rollback\s+ERR/)
    expect(deploy).not.toMatch(
      /(?:^|\n)\s*(?:dig|host|nsupdate|strato|vercel\s+(?:dns|domains?))\b/m,
    )
  })

  it('provides a syntax-checked read-only verification script', async () => {
    const verificationPath = path.join(
      root,
      'scripts/run-hostinger-verification.sh',
    )
    const verification = await readProjectFile(
      'scripts/run-hostinger-verification.sh',
    )

    execFileSync('bash', ['-n', verificationPath])
    expect(verification).toMatch(/docker compose[\s\S]*\bps\b/)
    expect(verification).toMatch(/docker inspect/)
    expect(verification).toMatch(/basaltemperatur_edge/)
    expect(verification).toMatch(/basaltemperatur-app/)
    expect(verification).toMatch(/127\.0\.0\.1/)
    expect(verification).toMatch(/\/api\/health/)
    expect(verification).not.toMatch(
      /\bdocker\s+(?:compose\s+)?(?:down|rm|restart|stop|up)\b/,
    )
  })
})

async function readProjectFile(relativePath: string): Promise<string> {
  return readFile(path.join(root, relativePath), 'utf8')
}

function topLevelChildren(document: string, rootName: string): string[] {
  const section =
    document.match(
      new RegExp(
        `^${escapeRegex(rootName)}:\\s*\\n([\\s\\S]*?)(?=^[^\\s#][^\\n]*:\\s*(?:\\n|$)|$)`,
        'm',
      ),
    )?.[1] ?? ''

  return [...section.matchAll(/^\s{2}([a-zA-Z0-9_-]+):\s*$/gm)].map(
    (match) => match[1],
  )
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
