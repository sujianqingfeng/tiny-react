import path from 'path'
import fs from 'fs'
import cjs from '@rollup/plugin-commonjs'
import ts from 'rollup-plugin-typescript2'
import replace from '@rollup/plugin-replace'

const pkgPath = path.resolve(__dirname, '../../packages')
const distPath = path.resolve(__dirname, '../../dist')

export function resolvePkgPath(pkgName, isDist) {
  if (isDist) {
    return `${distPath}/${pkgName}`
  }
  return `${pkgPath}/${pkgName}`
}

export function getPackageJson(pkgName) {
  const jsonPath = resolvePkgPath(`${pkgName}/package.json`)
  const result = fs.readFileSync(jsonPath, 'utf-8')
  return JSON.parse(result)
}

export function getBaseRollupPlugins({
  alias = {
    __DEV__: true
  }, typescript 
} = {}) {
  return [replace(alias), cjs(), ts(typescript)]
}