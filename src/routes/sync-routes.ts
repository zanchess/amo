import { Router, Request, Response } from 'express';
import { IntegrationService } from '../services/integration-service';

const router = Router();
const integrationService = new IntegrationService();

router.post('/budget/:leadId', async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    const { subdomain } = req.body;
    
    if (!leadId) {
      return res.status(400).json({
        error: 'Lead ID is required',
        message: 'Please provide lead ID in URL parameters'
      });
    }
    
    console.log(`🔄 Received budget sync request for lead: ${leadId}`);
    
    const success = await integrationService.syncBudgetFromSheetsToAmoCRM(leadId, subdomain);
    
    if (success) {
      return res.json({
        success: true,
        message: `Budget synchronized successfully for lead ${leadId}`,
        leadId
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Synchronization failed',
        message: `Failed to synchronize budget for lead ${leadId}`,
        leadId
      });
    }
    
  } catch (error) {
    console.error('❌ Error in budget sync endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export { router as syncRoutes }; 