import type * as vite from 'vite';
import type { LiveViewRouter } from "liveviewjs";
import type {Express, Router} from 'express'
import express, { NextFunction, Request, Response } from "express";
import session, { MemoryStore } from "express-session";
import { Server } from "http";
import { WebSocketServer } from "ws";
import { NodeExpressLiveViewServer } from "@liveviewjs/express";
import { htmlPageTemplate, wrapperTemplate } from "./liveTemplates";

// you'd want to set this to some secure, random string in production
const signingSecret = "MY_VERY_SECRET_KEY";

// add flash object to session data
declare module "express-session" {
  interface SessionData {
    flash: any;
  }
}

export const routes = (app: vite.ViteDevServer['middlewares'], router?: LiveViewRouter) => {
  app.use((req, res, next) => {
    session({
      secret: signingSecret,
      resave: false,
      rolling: true,
      saveUninitialized: true,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      },
      store: new MemoryStore(),
    })(req as any, res as any, next)
  });

  if (router) {
  
  app.use((req, res, next) => {
    res.send = res.end
    req.path = req.url
    req.get = () => 'localhost:3000/'
    req.originalUrl = req.url
    res.format = (v) => v.html()
    return next()
  });

  // basic middleware to log requests
  // app.use((req, res, next) => {
  //   if (!req.path) return next(new Error('url not available'))
  //   const isLiveView = router.hasOwnProperty(req.path);
  //   console.log(`${req.method} ${isLiveView ? "LiveView" : ""} ${req.url} - ${new Date().toISOString()}`);
  //   next();
  // });

  // initialize the LiveViewServer
  const liveView = new NodeExpressLiveViewServer(
    router,
    htmlPageTemplate,
    { title: "Express Demo", suffix: " · LiveViewJS" },
    {
      serDeSigningSecret: signingSecret,
      wrapperTemplate: wrapperTemplate,
    }
  );

  // setup the LiveViewJS middleware
  app.use(async (req, res, next) => {
    await liveView.httpMiddleware()(req as any, res as any, next)
  });

  // configure express to handle both http and websocket requests
  const httpServer = new Server();
  const wsServer = new WebSocketServer({
    server: httpServer,
  });

  // send http requests to the express app
  httpServer.on("request", app);

  // initialize the LiveViewJS websocket message router
  const liveViewWsMiddleware = liveView.wsMiddleware();
  liveViewWsMiddleware(wsServer);

  }

  return app

}