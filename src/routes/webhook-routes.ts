import { Router, Request, Response } from 'express';
import { IntegrationService } from '../services/integration-service';

const router = Router();

// Создаем экземпляр интеграционного сервиса
const integrationService = new IntegrationService();

router.post('/amocrm', async (req: Request, res: Response): Promise<void> => {
  const userAgent = req.headers['user-agent'];
  const contentType = req.headers['content-type'];
  
  console.log('🏢 amoCRM webhook received:', {
    timestamp: new Date().toISOString(),
    userAgent,
    contentType,
    body: req.body,
    eventType: determineAmoCRMEventType(req.body),
    accountId: req.body.account?.id,
    accountSubdomain: req.body.account?.subdomain
  });

  
  try {
    await integrationService.processAmoCRMWebhook(req.body);
    
    res.status(200).json({
      success: true,
      message: 'amoCRM webhook processed successfully and data sent to Google Sheets',
      timestamp: new Date().toISOString(),
      processed: {
        leads: {
          added: req.body.leads?.add?.length || 0,
          updated: req.body.leads?.update?.length || 0,
          deleted: req.body.leads?.delete?.length || 0
        },
        contacts: {
          added: req.body.contacts?.add?.length || 0,
          updated: req.body.contacts?.update?.length || 0,
          deleted: req.body.contacts?.delete?.length || 0
        },
        companies: {
          added: req.body.companies?.add?.length || 0,
          updated: req.body.companies?.update?.length || 0,
          deleted: req.body.companies?.delete?.length || 0
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error processing amoCRM webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing amoCRM webhook',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

function determineAmoCRMEventType(body: any): string {
  const events = [];
  
    if (body.leads) {
    if (body.leads.add) events.push('leads_add');
    if (body.leads.update) events.push('leads_update');
    if (body.leads.delete) events.push('leads_delete');
  }
  
  return events.join(', ') || 'unknown';
}

export { router as webhookRoutes }; 