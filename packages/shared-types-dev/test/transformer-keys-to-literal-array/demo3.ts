import { transTypeKeystoLiteralArrayPlaceholder } from '../../src/lib/transformer/keys-to-literal-array.js'


class Foo {

  foo: string
  barz: string

}
interface Bar extends Foo {
  bar: string
}
export const fooKeys = transTypeKeystoLiteralArrayPlaceholder<Bar>()

