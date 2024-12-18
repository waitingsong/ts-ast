# ts-ast repository


[![GitHub tag](https://img.shields.io/github/tag/waitingsong/ts-ast.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![](https://img.shields.io/badge/lang-TypeScript-blue.svg)]()
[![ci](https://github.com/waitingsong/ts-ast/workflows/ci/badge.svg)](https://github.com/waitingsong/ts-at/actions?query=workflow%3A%22ci%22)
[![codecov](https://codecov.io/github/waitingsong/ts-ast/graph/badge.svg?token=eq4UXXBn3q)](https://codecov.io/github/waitingsong/ts-ast)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)


以下所有命令行操作都在 `git-bash` 窗口中执行

## Install global deps for development
```sh
npm i -g c8 lerna madge rollup tsx zx
```






## Packages

| Package              | Version                |
| -------------------- | ---------------------- |
| [`shared-types-dev`] | [![main-svg]][main-ch] |

## Initialize and install dependencies

run it at first time and any time
```sh
npm run repo:init
```


## Compile

Run under root folder
```sh
npm run build
# specify scope
npm run build @scope/demo-docs
# specify scopes
npm run build @scope/demo-docs @scope/demo-serivce
```


## Update package

```sh
npm run bootstrap
```

## Add package

```sh
npm run add:pkg new_module
```

## Test

- Use `npm run lint` to check code style.
- Use `npm run test` to run unit test.

## Clan or Purge

```sh
# clean build dist, cache and build
npm run clean
# clean and remove all node_modules
npm run purge
```

## Note

- Run `npm run clean` before `npm run build`, if any file under typescript outDir folder was deleted manually.
- Default publish registry is `NPM`, configurated in file `lerna.json`
- Any commands above (such as `npm run build`) running in `Git-Bash` under Windows OS

## License
[MIT](LICENSE)


### Languages
- [English](README.md)
- [中文](README.zh-CN.md)

<br>

[`shared-types-dev`]: https://github.com/waitingsong/ts-ast/tree/main/packages/shared-types-dev
[main-svg]: https://img.shields.io/npm/v/@waiting/shared-types-dev.svg?maxAge=300
[main-ch]: https://github.com/waitingsong/ts-ast/tree/main/packages/shared-types-dev/CHANGELOG.md


