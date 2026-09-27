// Generates the shadcn-style stylesheet from design/tokens.json.
//   node design/tools/build-tokens.mjs design/tokens.json app/frontend/styles/globals.css [--no-vars] [--fonts-url /fonts/]
// Output = what `npx shadcn init` would put in globals.css, with Keel's values:
//   @import tailwindcss + tw-animate-css · @custom-variant dark · @theme inline (utilities → CSS variables)
//   :root / .dark variables · @font-face · @layer base
// --no-vars omits the :root/.dark blocks and @font-face (used when another file supplies the variables).
import fs from 'node:fs'

const args = process.argv.slice(2)
const [src = 'design/tokens.json', out = 'globals.css'] = args.filter(
  (a) => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--fonts')
)
const noVars = args.includes('--no-vars')
const fontsUrl = args.includes('--fonts-url') ? args[args.indexOf('--fonts-url') + 1] : '/fonts/'
const t = JSON.parse(fs.readFileSync(src, 'utf8'))
const themes = t.color.themes.map((x) => x.id)
const first = themes[0]
const val = (v, th) => (typeof v === 'string' ? v : (v[th] ?? v[first]))
const css = (v) => v.replace(/^\{(.+)\}$/, 'var(--$1)')
const primitive = (n) => /^(gray|teal|red|amber|green|blue)-\d+$/.test(n)
const semantic = t.color.tokens.filter((x) => !primitive(x.name))

const L = []
L.push(
  '/* GENERATED from design/tokens.json by design/tools/build-tokens.mjs — do not edit by hand. */'
)
L.push(
  '@import "tailwindcss";',
  '@import "tw-animate-css";',
  '@import "shadcn/tailwind.css";',
  '',
  '@custom-variant dark (&:is(.dark *));',
  ''
)
L.push('@theme inline {')
L.push('  /* Keel: only semantic colours exist as utilities (no bg-gray-200 / text-red-500). */')
L.push(
  '  --color-*: initial;',
  '  --color-white: #fff;',
  '  --color-black: #000;',
  '  --color-transparent: transparent;',
  '  --color-current: currentColor;'
)
for (const tok of semantic) L.push(`  --color-${tok.name}: var(--${tok.name});`)
L.push('  --font-sans: var(--font-ui);', '  --font-mono: var(--font-code);')
L.push(
  '  --radius-sm: calc(var(--radius) * 0.6);',
  '  --radius-md: calc(var(--radius) * 0.8);',
  '  --radius-lg: var(--radius);',
  '  --radius-xl: calc(var(--radius) * 1.4);'
)
L.push('}', '')

if (!noVars) {
  for (const th of themes) {
    const sel = th === first ? ':root' : `.${th}, [data-theme="${th}"]`
    const lines = []
    if (th === first) {
      for (const [fam, body] of Object.entries(t)) {
        if (['name', 'version', 'color', 'type'].includes(fam) || !body?.tokens) continue
        for (const tok of body.tokens) lines.push(`  --${tok.name}: ${tok.value};`)
      }
      for (const [k, v] of Object.entries(t.type.families)) lines.push(`  --font-${k}: ${v};`)
    }
    for (const tok of t.color.tokens) {
      if (th !== first && (typeof tok.value === 'string' || !(th in tok.value))) continue
      lines.push(`  --${tok.name}: ${css(val(tok.value, th))};`)
    }
    L.push(`${sel} {`, ...lines, '}', '')
  }
  for (const f of t.type.fonts)
    L.push(
      `@font-face { font-family: "${f.family}"; src: url("${fontsUrl}${f.file.replace(/^fonts\//, '')}") format("woff2"); font-weight: ${f.weight}; font-style: ${f.style ?? 'normal'}; font-display: swap; }`
    )
  L.push('')
}

L.push(`@layer base {
  * { @apply border-border outline-ring/50; }
  html { color-scheme: light; scrollbar-gutter: stable; -webkit-font-smoothing: antialiased; }
  .dark, [data-theme="dark"] { color-scheme: dark; }
  /* Keel: product text defaults to 14/20 (text-sm), not the browser's 16px. */
  body { @apply bg-background font-sans text-sm text-foreground; }
  /* Keel: html already reserves scrollbar space via scrollbar-gutter above, so Radix's
     react-remove-scroll lock (Dialog/Sheet/DropdownMenu/Popover) must not also compensate
     for a scrollbar — otherwise opening/closing any overlay shifts the layout by its width. */
  html body[data-scroll-locked] { margin-right: 0 !important; }
}

@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
}
`)
fs.writeFileSync(out, L.join('\n'))
console.log('wrote', out)
