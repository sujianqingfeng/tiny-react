import generatePackageJson from 'rollup-plugin-generate-package-json'
import { defineConfig } from 'rollup'
import alias from '@rollup/plugin-alias'

import { getBaseRollupPlugins, getPackageJson, resolvePkgPath } from './utils'

const { name, module, peerDependencies } = getPackageJson('react-noop-renderer')
const pkgPath = resolvePkgPath(name)
const pkgDistPath = resolvePkgPath(name, true)

export default defineConfig([
  // react-noop-renderer
  {
    input: `${pkgPath}/${module}`,
    output: [
      {
        file: `${pkgDistPath}/index.js`,
        name: 'ReactNoopRenderer',
        format: 'umd'
      },
    ],
    external: [...Object.keys(peerDependencies), 'scheduler'],
    plugins: [
      ...getBaseRollupPlugins({

        typescript: {
          exclude: ['./packages/react-dom/**/*'],
          tsconfigOverride: {
            compilerOptions: {
              paths: {
                'hostConfig': [`${name}/src/hostConfig.ts`]
              }
            }
          }
        }
      }),
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
])