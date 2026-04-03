import express from 'express';
import userRoutes from './routes/users';

export function createApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api', userRoutes);
  return app;
}

// Start server when run directly
if (require.main === module) {
  const port = parseInt(process.env.PORT || '3001');
  const app = createApp();
  app.listen(port, () => {
    console.log(`Provider (User Service) running on http://localhost:${port}`);
  });
}
