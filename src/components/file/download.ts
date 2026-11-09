import { safeFileName } from 'src/core/domain/file-name'

/** Splits `Name.5emm.json` into name and suffix so only the author-written part is sanitised. */
const splitName = (fileName: string): [string, string] => {
  const m = fileName.match(/^(.*?)((?:\.[a-z0-9-]+)+)$/i)
  return m ? [m[1], m[2]] : [fileName, '']
}

export function download(
  content: string | Blob,
  fileName: string,
  contentType: string
) {
  const a = document.createElement('a')
  const file = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(file)
  a.href = url
  a.download = safeFileName(...splitName(fileName))
  a.click()
  // The browser has started the download once click() returns; release the blob on the next task.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function saveJson(data: any, filename: string) {
  download(JSON.stringify(data), filename, 'application/json')
}
