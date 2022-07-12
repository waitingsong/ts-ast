import { transTypeKeystoLiteralArrayPlaceholder } from '../../src/lib/transformer/keys-to-literal-array.js'


interface Foo {
  foo: string
  barz: string
}
export const fooKeys = transTypeKeystoLiteralArrayPlaceholder<Foo>()

