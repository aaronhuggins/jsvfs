import { readdirSync } from 'fs'
import { join } from 'path'
import * as del from 'del'
import * as shell from 'gulp-shell'
import { series } from 'gulp'

export async function cleanup () {
  await del([
    'packages/**/*.d.ts',
    'packages/**/*.js',
    'packages/**/*.js.map'
  ], {
    ignore: ['node_modules/**']
  })
}

export async function lint () {
  await shell.task('ts-standard --report codeframe')()
}

export async function fix () {
  await shell.task('ts-standard --fix --report codeframe')()
}

export async function compile () {
  const packages = readdirSync('packages')

  for (const dir of packages) {
    await shell.task('tsc', { cwd: join('packages', dir) })()
  }
}

export async function mocha () {
  await shell.task('mocha')()
}
export async function nyc () {
  await shell.task('nyc mocha')()
}

export const test = series(cleanup, mocha)
export const coverage = series(cleanup, nyc)

export async function typedoc () {
  await shell.task('typedoc')()
}

export const postpack = series(cleanup, typedoc)
