import fs from 'node:fs'
import path from 'node:path'
import {AstroIntegration} from 'astro'
import {routes as liveViewRoutes} from './server'

export const liveviewjs: () => AstroIntegration = () => {
  var routes: any
  return {
    name: 'liveviewjs',
    hooks: {
      'astro:config:setup': async ({config}) => {
        const pages = path.join(config.srcDir.toString().replace('file:', ''), 'pages')
        const livejsFiles = fs.readdirSync(pages).filter(v => v.endsWith('.live.ts')).map(v => [`${pages}/${v}`, v.replace('.live.ts', '')])
        routes = Object.fromEntries(await Promise.all(livejsFiles.map(async ([path, name]) => {
          /* @vite-ignore */
          return [`/${name}`, (await import(path)).default]
        })))
      },
      'astro:server:setup': ({ server }) => {
        liveViewRoutes(server.middlewares, routes)
      }
    }
  }
}