// Keel codemod for shadcn/ui components.
// Run after every `npx shadcn add …` (or on raw registry files) to apply Keel's conventions:
//   node design/tools/keelify.mjs app/frontend/components/ui/*.tsx
// It is idempotent. What it changes (and nothing else):
//   1. registry import paths → app aliases (@/lib/utils, @/components/ui/*, @/hooks/*)
//   2. focus rings: translucent 3px → solid 2px `ring-ring` (≥ 3:1 contrast, WCAG 1.4.11)
//   3. removes `dark:` utilities — Keel tokens are designed per theme, so components carry no dark overrides
//   4. removes `shadow-xs` on controls; cards lose `shadow-sm` and use radius-lg + 16px padding
//   5. destructive fills use `text-destructive-foreground` instead of `text-white`
//   6. outline controls use the 3:1 `border-input` edge on `bg-card`
import fs from 'node:fs'
import path from 'node:path'

const files = process.argv.slice(2)
if (!files.length) {
  console.error('usage: node keelify.mjs <files…>')
  process.exit(1)
}

for (const file of files) {
  let s = fs.readFileSync(file, 'utf8')
  const before = s
  s = s
    .replace(/from "cn"/g, 'from "@/lib/utils"')
    .replace(/@\/registry\/[\w-]+\/ui\//g, '@/components/ui/')
    .replace(/@\/registry\/[\w-]+\/hooks\//g, '@/hooks/')
    .replace(/@\/registry\/[\w-]+\/lib\//g, '@/lib/')
  s = s
    .replace(/ring-\[3px\]/g, 'ring-2')
    .replace(/ring-ring\/50/g, 'ring-ring')
    .replace(/ring-destructive\/20/g, 'ring-destructive')
  // drop every dark: utility inside class strings
  s = s.replace(
    /"border bg-background\s+(?:shadow-xs\s+)?(hover:bg-accent)/g,
    '"border border-input bg-card $1'
  )
  // drop every dark: utility and shadow-xs inside class strings
  s = s.replace(/(^|[\s"'`])dark:[^\s"'`]+(?=[\s"'`])/gm, '$1')
  s = s.replace(/(^|[\s"'`])shadow-xs(?=[\s"'`])/g, '$1')
  s = s.replace(/bg-destructive text-white/g, 'bg-destructive text-destructive-foreground')
  if (path.basename(file) === 'card.tsx') {
    s = s
      .replace(/rounded-xl/g, 'rounded-lg')
      .replace(/(^|[\s"])shadow-sm(?=[\s"])/g, '$1')
      .replace(/\bpy-6\b/g, 'py-4')
      .replace(/\bgap-6\b/g, 'gap-4')
      .replace(/\bpx-6\b/g, 'px-4')
      .replace(/\bpb-6\b/g, 'pb-4')
      .replace(/\bpt-6\b/g, 'pt-4')
  }
  // tidy doubled spaces left inside class strings
  s = s.replace(/"([^"\n]*)"/g, (_m, inner) => `"${inner.replace(/\s{2,}/g, ' ').trim()}"`)
  if (s !== before) {
    fs.writeFileSync(file, s)
    console.log('keelified', file)
  }
}
