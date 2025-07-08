import {GoogleSheetsService, LeadData} from './google-sheets';
import {AmoCRMApiService} from './amocrm-api';
import {AmoCRMLead} from '../types/amocrm';
import axios from 'axios';

const LEAD_STATUSES = {
  SUCCESSFUL: ['142', '147', '149'],
  CREATED: ['143', '144', '145'],
};

export class IntegrationService {
  private googleSheets: GoogleSheetsService;
  private amoCrmApi: AmoCRMApiService | null = null;
  
  constructor() {
    this.googleSheets = new GoogleSheetsService();
  }
  
  initAmoCRMApi(subdomain: string, accessToken?: string): void {
    this.amoCrmApi = new AmoCRMApiService(subdomain, accessToken);
  }
  
  async processAmoCRMWebhook(webhookData: any): Promise<void> {
    try {
      console.log('🔄 Processing amoCRM webhook for Google Sheets integration');
      console.log('🔄 Webhook data:', JSON.stringify(webhookData));
      await this.setupGoogleSheets();
      
      if (webhookData.account?.subdomain && !this.amoCrmApi) {
        this.initAmoCRMApi(webhookData.account.subdomain);
      }
      
      if (webhookData.leads?.add) {
        for (const lead of webhookData.leads.add) {
          const [companyData, contactData] = await this.fetchLeadRelatedData(lead);
          
          console.log('🔄 Company Data:', JSON.stringify(companyData));
          console.log('🔄 Contact Data:', JSON.stringify(contactData));

          await this.processNewLead(lead, companyData, contactData);
        }
      }
      
      if (webhookData.leads?.update) {
        for (const lead of webhookData.leads.update) {
          const [companyData, contactData] = await this.fetchLeadRelatedData(lead);
          
          console.log('🔄 Company Data:', JSON.stringify(companyData));
          console.log('🔄 Contact Data:', JSON.stringify(contactData));
          
          await this.processUpdatedLead(lead, companyData, contactData);
        }
      }
      
      if (webhookData.leads?.status) {
        for (const lead of webhookData.leads.status) {
          const [companyData, contactData] = await this.fetchLeadRelatedData(lead);
          
          console.log('🔄 Company Data:', JSON.stringify(companyData));
          console.log('🔄 Contact Data:', JSON.stringify(contactData));
          
          await this.processStatusChange(lead, companyData, contactData);
        }
      }
      
    } catch (error) {
      console.error('❌ Error processing amoCRM webhook:', error);
      throw error;
    }
  }
  
  private async processNewLead(lead: AmoCRMLead, companyData: any, contactData: any): Promise<void> {
    try {
      console.log(`📈 Processing new lead: ${lead.id} - ${lead.name}`);
      
      const leadData = await this.prepareLeadData(lead, 'created', companyData, contactData);
      
      if (leadData) {
        await this.googleSheets.updateLeadInSheet(leadData);
        console.log(`✅ Lead ${lead.id} processed (created or updated) in Google Sheets`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing new lead ${lead.id}:`, error);
    }
  }
  

  private async processUpdatedLead(lead: AmoCRMLead, companyData: any, contactData: any): Promise<void> {
    try {
      console.log(`📊 Processing updated lead: ${lead.id} - ${lead.name}`);
      
      const eventType = this.isSuccessfulStatus(lead.status_id) ? 'closed_won' : 'updated';
      const leadData = await this.prepareLeadData(lead, eventType, companyData, contactData);
      
      if (leadData) {
        await this.googleSheets.updateLeadInSheet(leadData);
        console.log(`✅ Lead ${lead.id} updated in Google Sheets`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing updated lead ${lead.id}:`, error);
    }
  }
  
  private async processStatusChange(lead: AmoCRMLead, companyData: any, contactData: any): Promise<void> {
    try {
      console.log(`🔄 Processing status change for lead: ${lead.id} - Status: ${lead.status_id}`);
      
      if (this.isSuccessfulStatus(lead.status_id)) {
        const leadData = await this.prepareLeadData(lead, 'closed_won', companyData, contactData);
        
        if (leadData) {
          await this.googleSheets.addLeadToSheet(leadData);
          console.log(`✅ Successful lead ${lead.id} added to Google Sheets`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Error processing status change for lead ${lead.id}:`, error);
    }
  }
  
  private async prepareLeadData(lead: AmoCRMLead, eventType: 'created' | 'closed_won' | 'updated', _companyData?: any, contactData?: any): Promise<LeadData | null> {
    try {
      const contactName = contactData?.name || 'Не указан';
      const contactPhone = this.extractPhone(contactData) || 'Не указан';
      const responsibleName = await this.getResponsibleName(lead.responsible_user_id);
      const status = await this.getStatusName(lead.status_id, lead.pipeline_id);

      return {
        leadNumber: lead.id,
        leadId: lead.id,
        createdDate: new Date(lead.created_at * 1000).toLocaleDateString('ru-RU'),
        contactPhone: contactPhone || 'Не указан',
        contactName,
        responsibleName,
        responsibleId: lead.responsible_user_id,
        budget: lead.price || 0,
        status,
        eventType
      };
      
    } catch (error) {
      console.error('❌ Error preparing lead data:', error);
      return null;
    }
  }
  
  private isSuccessfulStatus(statusId: string): boolean {
    return LEAD_STATUSES.SUCCESSFUL.includes(statusId);
  }

  private extractPhone(contactData: any): string {
    if (!contactData?.custom_fields_values) return '';
    
    const phoneField = contactData.custom_fields_values.find((field: any) => 
      field.field_code === 'PHONE'
    );
    
    return phoneField?.values?.[0]?.value || '';
  }

  private async getResponsibleName(responsibleUserId: string): Promise<string> {
    if (!responsibleUserId || !this.amoCrmApi) return 'Не указан';
    
    try {
      const user = await this.amoCrmApi.getUser(responsibleUserId);
      return user?.name || 'Не указан';
    } catch (error) {
      return 'Не указан';
    }
  }

  private async getStatusName(statusId: string, pipelineId?: string): Promise<string> {
    if (!statusId) return 'Не указан';
    
    try {
      const response = await axios.get(
        `https://${process.env.AMOCRM_SUBDOMAIN}.amocrm.ru/api/v4/leads/pipelines`,
        { headers: { Authorization: `Bearer ${process.env.AMOCRM_ACCESS_TOKEN}` } }
      );
      
      if (response.data?._embedded?.pipelines) {
        for (const pipeline of response.data._embedded.pipelines) {
          if (pipelineId && pipeline.id !== parseInt(pipelineId)) continue;
          
          if (pipeline._embedded?.statuses) {
            const status = pipeline._embedded.statuses.find((s: any) => s.id === parseInt(statusId));
            if (status) {
              return status.name || 'Не указан';
            }
          }
        }
      }
      
      return 'Не указан';
    } catch (error) {
      console.error(`❌ Error fetching status name for ID ${statusId}:`, error);
      return 'Не указан';
    }
  }


  private async fetchLeadRelatedData(lead: any): Promise<[any, any]> {
    try {
      const leadResponse = await this.fetchLeadDetails(lead.id);
      
      const companyId = leadResponse._embedded?.companies?.[0]?.id || lead.responsible_user_id;
      const contactId = leadResponse._embedded?.contacts?.[0]?.id || lead.responsible_user_id;
      
      const [companyData, contactData] = await Promise.all([
        this.fetchCompanyData(companyId),
        this.fetchContactData(contactId)
      ]);
      
      return [companyData, contactData];
      
    } catch (error) {
      console.error('❌ Error fetching lead related data:', error);
      return [null, null];
    }
  }

  private async fetchLeadDetails(leadId: string): Promise<any> {
    try {
      const response = await axios.get(
        `https://${process.env.AMOCRM_SUBDOMAIN}.amocrm.ru/api/v4/leads/${leadId}?with=contacts,companies`,
        { headers: { Authorization: `Bearer ${process.env.AMOCRM_ACCESS_TOKEN}` } }
      );
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching lead details for ID ${leadId}:`, error);
      return null;
    }
  }

  private async fetchCompanyData(companyId: string): Promise<any> {
    try {
      if (!companyId) return null;
      
      const response = await axios.get(
        `https://${process.env.AMOCRM_SUBDOMAIN}.amocrm.ru/api/v4/companies/${companyId}?with=contacts&page=1&limit=250`,
        { headers: { Authorization: `Bearer ${process.env.AMOCRM_ACCESS_TOKEN}` } }
      );
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching company data for ID ${companyId}:`, error);
      return null;
    }
  }

  private async fetchContactData(contactId: string): Promise<any> {
    try {
      if (!contactId) return null;
      
      const response = await axios.get(
        `https://${process.env.AMOCRM_SUBDOMAIN}.amocrm.ru/api/v4/contacts/${contactId}?with=contacts&page=1&limit=250`,
        { headers: { Authorization: `Bearer ${process.env.AMOCRM_ACCESS_TOKEN}` } }
      );
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching contact data for ID ${contactId}:`, error);
      return null;
    }
  }
  
  async setupGoogleSheets(): Promise<void> {
    try {
      console.log('🔧 Setting up Google Sheets headers...');
      await this.googleSheets.ensureHeaders();
      console.log('✅ Google Sheets setup completed');
    } catch (error) {
      console.error('❌ Error setting up Google Sheets:', error);
      throw error;
    }
  }

  async syncBudgetFromSheetsToAmoCRM(leadId: string, subdomain?: string): Promise<boolean> {
    try {
      console.log(`🔄 Starting budget sync from Google Sheets to amoCRM for lead: ${leadId}`);
      
      if (subdomain && !this.amoCrmApi) {
        this.initAmoCRMApi(subdomain);
      }
      
      if (!this.amoCrmApi) {
        console.error('❌ amoCRM API not initialized');
        return false;
      }
      
      const sheetLeadData = await this.googleSheets.getLeadDataById(leadId);
      if (!sheetLeadData) {
        console.error(`❌ Lead ${leadId} not found in Google Sheets`);
        return false;
      }
      
      const amoCrmLead = await this.amoCrmApi.getLead(leadId);
      if (!amoCrmLead) {
        console.error(`❌ Lead ${leadId} not found in amoCRM`);
        return false;
      }
      
      if (sheetLeadData.budget === amoCrmLead.price) {
        console.log(`✅ Budget already synchronized for lead ${leadId}: ${sheetLeadData.budget}`);
        return true;
      }
      
      console.log(`💰 Updating amoCRM budget: ${amoCrmLead.price} -> ${sheetLeadData.budget}`);
      
      const success = await this.amoCrmApi.updateLeadBudget(leadId, sheetLeadData.budget);
      
      if (success) {
        console.log(`✅ Budget successfully synchronized for lead ${leadId}`);
        return true;
      } else {
        console.error(`❌ Failed to update budget in amoCRM for lead ${leadId}`);
        return false;
      }
      
    } catch (error) {
      console.error(`❌ Error syncing budget for lead ${leadId}:`, error);
      return false;
    }
  }
} 