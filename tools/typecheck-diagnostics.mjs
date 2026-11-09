export function parseDiagnostics(output) {
  const text = output.replaceAll('\\', '/').replaceAll('\r\n', '\n')
  const diagnostics = []
  const pattern = /^(.+?)\(\d+,\d+\): error (TS\d+): ([\s\S]*?)(?=^.+?\(\d+,\d+\): error TS\d+:|$(?![\s\S]))/gm
  for (const match of text.matchAll(pattern)) {
    let file = match[1]
    if (file.includes('/node_modules/')) file = 'node_modules/' + file.split('/node_modules/').at(-1)
    else if (file.includes('/src/')) file = 'src/' + file.split('/src/').at(-1)
    const message = match[3].trim().replace(/import\("[^"\n]*\/src\//g, 'import("<ROOT>/src/')
    diagnostics.push({ file, code: match[2], message })
  }
  return diagnostics
}
export function compareDiagnostics(current, baseline) {
  const key = diagnostic => JSON.stringify([diagnostic.file, diagnostic.code, diagnostic.message])
  const remaining = new Map()
  for (const diagnostic of baseline) remaining.set(key(diagnostic), (remaining.get(key(diagnostic)) || 0) + 1)
  const added = []
  for (const diagnostic of current) {
    const signature = key(diagnostic)
    if (remaining.get(signature)) remaining.set(signature, remaining.get(signature) - 1)
    else added.push(diagnostic)
  }
  return { added, resolved: [...remaining.values()].reduce((sum, count) => sum + count, 0) }
}

export function parseCompilerOutput(output) {
  const unknown = output.split(/\r?\n/).filter(line => line.trim() && !/^\s/.test(line) && !/^.+?\(\d+,\d+\): error TS\d+: /.test(line))
  if (unknown.length) throw new Error('unrecognized compiler output: ' + unknown.join('\n'))
  return parseDiagnostics(output)
}
