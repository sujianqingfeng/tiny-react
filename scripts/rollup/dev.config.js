import reactDomConfig from './react-dom.config'
import reactNoopRendererConfig from './react-noop-renderer.config'
import reactConfig from './react.config'
import { defineConfig } from 'rollup'

export default defineConfig([...reactConfig, ...reactDomConfig, ...reactNoopRendererConfig])