import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

export interface LeadData {
  leadNumber: string;
  leadId: string;
  createdDate: string;
  contactPhone: string;
  contactName: string;
  responsibleName: string;
  responsibleId: string;
  budget: number;
  status: string;
  eventType: 'created' | 'closed_won' | 'updated';
}

export class GoogleSheetsService {
  private auth: JWT;
  private sheets: any;
  
  constructor() {
    this.auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }
  
  async addLeadToSheet(leadData: LeadData): Promise<void> {
    try {
      const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
      const range = process.env.GOOGLE_SHEET_RANGE || 'Лист1!A:H';
      
      if (!spreadsheetId) {
        throw new Error('GOOGLE_SPREADSHEET_ID not configured');
      }
      
      await this.ensureHeaders();
      
      console.log(`🔍 Checking for duplicate lead: ${leadData.leadId}`);
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
      
      const rows = response.data.values;
      if (rows && rows.length > 1) {
        const dataRows = rows.slice(1);
        const existingRowIndex = dataRows.findIndex((row: string[]) => 
          row[0] && (row[0].toString().trim() === leadData.leadId.toString().trim())
        );
        
        if (existingRowIndex !== -1) {
          console.log(`⚠️ Lead ${leadData.leadId} already exists in spreadsheet at row ${existingRowIndex + 2}. Skipping duplicate.`);
          return;
        }
      }
      
      const values = [[
        leadData.leadNumber,
        leadData.createdDate,
        leadData.contactPhone,
        leadData.contactName,
        leadData.responsibleName,
        leadData.responsibleId,
        leadData.budget,
        leadData.status,
      ]];
      
      console.log('📊 Adding lead to Google Sheets:', {
        leadId: leadData.leadId,
        leadNumber: leadData.leadNumber,
        eventType: leadData.eventType,
        spreadsheetId,
        range
      });
      
      await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values,
        },
      });
      
      console.log('✅ Lead successfully added to Google Sheets');
      
    } catch (error) {
      console.error('❌ Error adding lead to Google Sheets:', error);
      throw error;
    }
  }

  async updateLeadInSheet(leadData: LeadData): Promise<void> {
    try {
      const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
      const searchRange = process.env.GOOGLE_SHEET_RANGE || 'Лист1!A:H';
      
      if (!spreadsheetId) {
        throw new Error('GOOGLE_SPREADSHEET_ID not configured');
      }
      
      await this.ensureHeaders();
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: searchRange,
      });
      
      const rows = response.data.values;
      if (!rows) {
        console.log('📊 No data found in spreadsheet, creating new record...');
        await this.addLeadToSheet(leadData);
        return;
      }
      
      console.log(`🔍 Searching for lead ID: ${leadData.leadId}`);
      console.log(`📊 Found ${rows.length} rows in spreadsheet`);
      
      const dataRows = rows.slice(1);
      const rowIndex = dataRows.findIndex((row: string[]) => 
        row[0] && (row[0].toString().trim() === leadData.leadId.toString().trim())
      );
      
      const actualRowIndex = rowIndex === -1 ? -1 : rowIndex + 1;
      
      console.log(`🔍 Row index found: ${actualRowIndex} (searching in ${dataRows.length} data rows)`);
      
      if (actualRowIndex !== -1) {
        const updateRange = `Лист1!A${actualRowIndex + 1}:H${actualRowIndex + 1}`;
        
        const values = [[
          leadData.leadNumber,
          leadData.createdDate,
          leadData.contactPhone,
          leadData.contactName,
          leadData.responsibleName,
          leadData.responsibleId,
          leadData.budget,
          leadData.status,
        ]];
        
        await this.sheets.spreadsheets.values.update({
          spreadsheetId,
          range: updateRange,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values,
          },
        });
        
        console.log(`✅ Lead ${leadData.leadId} fully updated in Google Sheets at row ${actualRowIndex + 1}`);
      } else {
        console.log(`⚠️ Lead ${leadData.leadId} not found in spreadsheet, creating new record...`);

        await this.addLeadToSheet(leadData);
      }
      
    } catch (error) {
      console.error('❌ Error updating lead in Google Sheets:', error);
      throw error;
    }
  }
  

  async ensureHeaders(): Promise<void> {
    try {
      const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
      const range = 'Лист1!A1:H1';
      
      if (!spreadsheetId) {
        throw new Error('GOOGLE_SPREADSHEET_ID not configured');
      }
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
      
      const firstRow = response.data.values?.[0];
      
      if (!firstRow || firstRow.length === 0 || firstRow[0] !== 'Номер сделки') {
        console.log('📋 Creating headers in Google Sheets...');
        await this.createHeaders();
      } else {
        console.log('✅ Headers already exist in Google Sheets');
      }
      
    } catch (error) {
      console.error('❌ Error ensuring headers:', error);
      throw error;
    }
  }

  async createHeaders(): Promise<void> {
    try {
      const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
      const range = 'Лист1!A1:H1';
      
      if (!spreadsheetId) {
        throw new Error('GOOGLE_SPREADSHEET_ID not configured');
      }
      
      const headers = [
        'Номер сделки',
        'Дата создания',
        'Телефон контакта',
        'Имя контакта',
        'Ответственный',
        'ID ответственного',
        'Бюджет',
        'Статус'
      ];
      
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [headers],
        },
      });
      
      console.log('✅ Headers created in Google Sheets');
      
    } catch (error) {
      console.error('❌ Error creating headers:', error);
      throw error;
    }
  }

  async getLeadDataById(leadId: string): Promise<LeadData | null> {
    try {
      const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
      const searchRange = process.env.GOOGLE_SHEET_RANGE || 'Лист1!A:H';
      
      if (!spreadsheetId) {
        throw new Error('GOOGLE_SPREADSHEET_ID not configured');
      }
      
      console.log(`🔍 Searching for lead data by ID: ${leadId}`);
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: searchRange,
      });
      
      const rows = response.data.values;
      if (!rows || rows.length <= 1) {
        console.log('📊 No data found in spreadsheet');
        return null;
      }
      
      const dataRows = rows.slice(1);
      const foundRow = dataRows.find((row: string[]) => 
        row[0] && (row[0].toString().trim() === leadId.toString().trim())
      );
      
      if (!foundRow || foundRow.length < 8) {
        console.log(`⚠️ Lead ${leadId} not found in spreadsheet`);
        return null;
      }
      
      const leadData: LeadData = {
        leadNumber: foundRow[0] || '',
        leadId: foundRow[0] || '',
        createdDate: foundRow[1] || '',
        contactPhone: foundRow[2] || '',
        contactName: foundRow[3] || '',
        responsibleName: foundRow[4] || '',
        responsibleId: foundRow[5] || '',
        budget: parseFloat(foundRow[6] || '0'),
        status: foundRow[7] || '',
        eventType: 'updated'
      };
      
      console.log(`✅ Found lead data: ${leadData.leadId} - Budget: ${leadData.budget}`);
      return leadData;
      
    } catch (error) {
      console.error(`❌ Error getting lead data by ID ${leadId}:`, error);
      return null;
    }
  }
} 