import generatePackageJson from 'rollup-plugin-generate-package-json'
import { defineConfig } from 'rollup'
import alias from '@rollup/plugin-alias'

import { getBaseRollupPlugins, getPackageJson, resolvePkgPath } from './utils'

const { name, module } = getPackageJson('react-dom')
const pkgPath = resolvePkgPath(name)
const pkgDistPath = resolvePkgPath(`${name}/node_modules`, true)

export default defineConfig([
  // react-dom
  {
    input: `${pkgPath}/${module}`,
    output: [
      {
        file: `${pkgDistPath}/index.js`,
        name: 'index.js',
        format: 'umd'
      },
      {
        file: `${pkgDistPath}/client.js`,
        name: 'client.js',
        format: 'umd'
      }
    ],
    plugins: [
      ...getBaseRollupPlugins(),
      alias({
        entries: {
          hostConfig: `${pkgPath}/src/hostConfig.ts`
        }
      }),
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
  }
])