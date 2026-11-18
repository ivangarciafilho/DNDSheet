/* eslint-disable */
// Mocks all files ending in `.vue` showing them as plain Vue instances
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'json-url' {
  interface Codec {
    compress: (obj: unknown) => Promise<string>
    decompress: (str: unknown) => Promise<unknown>
  }

  const jsonurl: (codecName: string) => Codec

  export default jsonurl
}
