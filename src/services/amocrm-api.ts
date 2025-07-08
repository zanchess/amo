import fetch from 'node-fetch';

export interface AmoCRMContact {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  custom_fields_values?: Array<{
    field_id: number;
    field_name: string;
    field_code: string;
    values: Array<{
      value: string;
      enum_id?: number;
      enum_code?: string;
    }>;
  }>;
}

export interface AmoCRMUser {
  id: string;
  name: string;
  email: string;
}

export interface AmoCRMLead {
  id: string;
  name: string;
  price: number;
  responsible_user_id: string;
  status_id: string;
  pipeline_id: string;
  created_at: number;
  updated_at: number;
}

export interface AmoCRMAccount {
  id: string;
  name: string;
  subdomain: string;
}

export class AmoCRMApiService {
  private baseUrl: string;
  private accessToken: string;
  
  constructor(subdomain: string, accessToken?: string) {
    this.baseUrl = `https://${subdomain}.amocrm.ru/api/v4`;
    this.accessToken = accessToken || process.env.AMOCRM_ACCESS_TOKEN || '';
  }
  
  async getUser(userId: string): Promise<AmoCRMUser | null> {
    try {
      if (!this.accessToken) {
        console.warn('⚠️ amoCRM access token not configured');
        return null;
      }
      
      console.log(`👤 Fetching user data for ID: ${userId}`);
      
      const response = await fetch(`${this.baseUrl}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error(`❌ Failed to fetch user: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const user = await response.json() as AmoCRMUser;
      console.log(`✅ User fetched: ${user.name}`);
      
      return user;
      
    } catch (error) {
      console.error('❌ Error fetching user:', error);
      return null;
    }
  }

  async getLead(leadId: string): Promise<AmoCRMLead | null> {
    try {
      if (!this.accessToken) {
        console.warn('⚠️ amoCRM access token not configured');
        return null;
      }
      
      console.log(`📊 Fetching lead data for ID: ${leadId}`);
      
      const response = await fetch(`${this.baseUrl}/leads/${leadId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error(`❌ Failed to fetch lead: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const lead = await response.json() as AmoCRMLead;
      console.log(`✅ Lead fetched: ${lead.name} (${lead.price})`);
      
      return lead;
      
    } catch (error) {
      console.error('❌ Error fetching lead:', error);
      return null;
    }
  }

  async updateLeadBudget(leadId: string, newBudget: number): Promise<boolean> {
    try {
      if (!this.accessToken) {
        console.warn('⚠️ amoCRM access token not configured');
        return false;
      }
      
      console.log(`💰 Updating lead budget for ID: ${leadId} to ${newBudget}`);
      
      const response = await fetch(`${this.baseUrl}/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price: newBudget
        }),
      });
      
      if (!response.ok) {
        console.error(`❌ Failed to update lead budget: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        return false;
      }
      
      await response.json();
      console.log(`✅ Lead budget updated successfully: ${leadId} -> ${newBudget}`);
      
      return true;
      
    } catch (error) {
      console.error('❌ Error updating lead budget:', error);
      return false;
    }
  }

} 