import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/error-handler';
import { apiRoutes } from './routes/index';
import { IntegrationService } from './services/integration-service';

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const app = express();


app.use(helmet());
app.use(cors({
  origin: NODE_ENV === 'production' ? process.env.ALLOWED_ORIGINS?.split(',') : true,
  credentials: true
}));

app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

app.use(errorHandler);

const integrationService = new IntegrationService();

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`⚡ Hot reload enabled with nodemon`);
  console.log(`🟢 Node.js version: ${process.version}`);

  try {
    console.log('🔧 Initializing Google Sheets...');
    await integrationService.setupGoogleSheets();
    console.log('✅ Google Sheets initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Google Sheets:', error);
  }
});

export default app; 