import { parse } from 'acorn'
// Preserve complete statements and the fuzz's own lexical scope and template evaluation.
export function buildStepHarness(source, step) {
  if (!Number.isSafeInteger(step) || step < 1)
    throw new Error('Step must be a positive integer')
  const tree = parse(source, { ecmaVersion: 'latest', sourceType: 'module' })
  const fn = tree.body.find(
    (n) => n.type === 'FunctionDeclaration' && n.id.name === 'runFuzz'
  )
  if (!fn) throw new Error('Missing runFuzz harness')
  const statements = fn.body.body
  const markers = statements.flatMap((node, index) => {
    const call = node.type === 'ExpressionStatement' && node.expression
    const value =
      call?.type === 'CallExpression' &&
      call.callee.type === 'MemberExpression' &&
      call.callee.object.name === 'console' &&
      call.callee.property.name === 'log' &&
      call.arguments[0]?.value
    const match = typeof value === 'string' && value.match(/--- Step (\d+):/)
    return match ? [{ step: Number(match[1]), index }] : []
  })
  const position = markers.findIndex((m) => m.step === step)
  if (position < 0) throw new Error(`No Step ${step}`)
  const next = markers[position + 1]
  const end = next
    ? statements[next.index].start
    : statements.find(
        (n) =>
          n.start > statements[markers[position].index].start &&
          source.slice(n.start, n.end).startsWith('consoleErrors.forEach')
      )?.start
  if (!end) throw new Error('Cannot identify final step boundary')
  return {
    prerequisites: markers.slice(0, position).map((m) => m.step),
    body:
      source.slice(fn.body.start + 1, end) +
      '\nif(consoleErrors.length || runtimeExceptions.length) throw new Error("Fuzz reported browser errors");\nws.close();\n',
  }
}
