import { AstroConfig, AstroIntegration } from 'astro'
import esbuild from "esbuild"
import { LiveViewRouter } from 'liveviewjs'
import fs from 'node:fs'
import path from 'node:path'
import { routes as liveViewRoutes } from './server'

export const liveviewjs: () => AstroIntegration = () => {
  var routes: LiveViewRouter
  return {
    name: 'liveviewjs',
    hooks: {      
      'astro:config:setup': async ({config, updateConfig}) => {  
        
        buildLiveViewClientJS(config);

        const pages = path.join(config.srcDir.toString().replace('file:', ''), 'pages')
        const livejsFiles = fs.readdirSync(pages).filter(v => v.endsWith('.live.ts')).map(v => [`${pages}/${v}`, v.replace('.live.ts', '')])
        routes = Object.fromEntries(await Promise.all(livejsFiles.map(async ([path, name]) => {
          /* @vite-ignore */
          return [`/${name}`, (await import(path)).default]
        })))
      },
      'astro:server:setup': ({ server }) => {  
        liveViewRoutes(server, routes)
      },
    }
  }
}

function buildLiveViewClientJS(config: AstroConfig) {
  console.log("Building LiveViewJS client...")
  // compile the client.ts into a single file using esbuild
  const src = config.srcDir.toString().replace('file://', '')
  const pub = config.publicDir.toString().replace('file://', '')
  esbuild
    .build({
      entryPoints: [`${src}liveview/client/index.ts`],
      outdir: `${pub}/js`,
      bundle: true,
      format: "esm",
      platform: "browser",
      sourcemap: true,
      watch: {
        onRebuild(error) {
          if (error) {
            console.error("client rebuild failed");
            console.error(error);
          } else {
            console.log("client build succeeded");
          }
        },
      },
    })
    .then((result) => {
      if (result.errors.length > 0) {
        console.error(result.errors);
      } else {
        console.log("client build succeeded");
      }
    });
}
