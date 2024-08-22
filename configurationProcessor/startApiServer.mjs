import { logger } from '../lib/logger.mjs';
import express from 'express';
import { env } from 'process';
import cors from 'cors';
// routes
import { addExtraDataRoute } from './apiRoutes/addExtraDataRoute.mjs';
import { translationsByExecutionGroupsRoute } from './apiRoutes/translationsByExecutionGroupsRoute.mjs';

export const log = logger()();

export async function startApiServer(config, executionGroups, configPath) {
  const app = express();
  const port = parseInt(env.VERSER_API_PORT) || 3000;

  // Configure CORS
  app.use(cors({
    origin: 'http://localhost:5173', // Allow requests from your Vite dev server
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  app.use(express.json());
  app.use(addExtraDataRoute(executionGroups, configPath));
  app.use(translationsByExecutionGroupsRoute(executionGroups, configPath));

  app.use(express.Router().get('/'), (req, res) => {
    res.json({
      message: "Welcome to the Translations API",
      availableEndpoints: getAppRoutes(app)
    });
  })


  app.listen(port, () => {
    console.log(`API server listening at http://localhost:${port}`);
    console.log("Available endpoints:");
    console.log(`  GET /`);

    console.log(getAppRoutes(app).map(route => `  ${route.method} ${route.path}`).join('\n'));
    
  });
}


function getAppRoutes(app) {
  const routes = [];
  
  if (!app || !app._router || !app._router.stack) {
    console.warn('App or router not properly initialized');
    return routes;
  }

  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Routes registered directly on the app
      const methods = Object.keys(middleware.route.methods || {});
      if (methods.length > 0) {
        routes.push({
          method: methods[0].toUpperCase(),
          path: middleware.route.path
        });
      }
    } else if (middleware.name === 'router') {
      // Router middleware
      if (middleware.handle && middleware.handle.stack) {
        middleware.handle.stack.forEach((handler) => {
          if (handler.route) {
            const methods = Object.keys(handler.route.methods || {});
            if (methods.length > 0) {
              routes.push({
                method: methods[0].toUpperCase(),
                path: handler.route.path
              });
            }
          }
        });
      }
    }
  });

  return routes;
}