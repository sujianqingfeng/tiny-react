import generatePackageJson from 'rollup-plugin-generate-package-json'
import { defineConfig } from 'rollup'

import { getBaseRollupPlugins, getPackageJson, resolvePkgPath } from './utils'

const { name, module } = getPackageJson('react')
const pkgPath = resolvePkgPath(name)
const pkgDistPath = resolvePkgPath(`${name}/node_modules`, true)

export default defineConfig([
  // react
  {
    input: `${pkgPath}/${module}`,
    output: {
      file: `${pkgDistPath}/index.js`,
      name: 'React',
      format: 'umd'
    },
    plugins: [
      ...getBaseRollupPlugins(),
      generatePackageJson({
        inputFolder: pkgPath,
        outputFolder: pkgDistPath,
        baseContents: ({ name, description, version }) => ({
          name,
          version,
          description,
          main: 'index.js'
        })
      })
    ]
  },
  // jsx-runtime
  {
    input: `${pkgPath}/src/jsx.ts`,
    output: [
      {
        file: `${pkgDistPath}/jsx-runtime.js`,
        name: 'jsx-runtime.js',
        format: 'umd'
      },
      {
        file: `${pkgDistPath}/jsx-dev-runtime.js`,
        name: 'jsx-devruntime.js',
        format: 'umd'
      }
    ],
    plugins: getBaseRollupPlugins()
  }
])