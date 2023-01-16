import reactDomConfig from './react-dom.config'
import reactConfig from './react.config'
import { defineConfig } from 'rollup'

export default defineConfig([...reactConfig, ...reactDomConfig])