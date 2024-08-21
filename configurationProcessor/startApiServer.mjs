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
  app.use(translationsByExecutionGroupsRoute(executionGroups, configPath));
  app.use(addExtraDataRoute);

  app.get('/', (req, res) => {
    const availableEndpoints = getAppRoutes(app);
    res.json({
      message: "Welcome to the Translations API",
      availableEndpoints
    });
  });

  app.listen(port, () => {
    console.log(`API server listening at http://localhost:${port}`);
    console.log("Available endpoints:");
    console.log(`  GET /`);

    console.log(getAppRoutes(app).map(route => `  ${route.method} ${route.path}`).join('\n'));
    
  });
}


function getAppRoutes(app) {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Routes registered directly on the app
      routes.push({
        method: Object.keys(middleware.route.methods)[0].toUpperCase(),
        path: middleware.route.path
      });
    } else if (middleware.name === 'router') {
      // Router middleware
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            method: Object.keys(handler.route.methods)[0].toUpperCase(),
            path: handler.route.path
          });
        }
      });
    }
  });
  return routes;
}