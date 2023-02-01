import generatePackageJson from 'rollup-plugin-generate-package-json'
import { defineConfig } from 'rollup'
import alias from '@rollup/plugin-alias'

import { getBaseRollupPlugins, getPackageJson, resolvePkgPath } from './utils'

const { name, module, peerDependencies } = getPackageJson('react-dom')
const pkgPath = resolvePkgPath(name)
const pkgDistPath = resolvePkgPath(name, true)

export default defineConfig([
  // react-dom
  {
    input: `${pkgPath}/${module}`,
    output: [
      {
        file: `${pkgDistPath}/index.js`,
        name: 'ReactDOM',
        format: 'umd'
      },
      {
        file: `${pkgDistPath}/client.js`,
        name: 'client',
        format: 'umd'
      }
    ],
    external: [...Object.keys(peerDependencies)],
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
  },
  // test-utils
  {
    input: `${pkgPath}/test-utils.ts`,
    output: [
      {
        file: `${pkgDistPath}/test-utils.js`,
        name: 'testUtils',
        format: 'umd'
      }
    ],
    external: ['react', 'react-dom'],
    plugins: [...getBaseRollupPlugins(),]
  }
])