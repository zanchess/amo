export interface AmoCRMCustomField {
  id: string;
  name: string;
  values: {
    value: string;
    enum?: string;
  }[];
}

export interface AmoCRMLead {
  id: string;
  name: string;
  status_id: string;
  old_status_id?: string;
  price: number;
  responsible_user_id: string;
  last_modified: number;
  modified_user_id: string;
  created_user_id: string;
  date_create: number;
  pipeline_id: string;
  account_id: string;
  created_at: number;
  updated_at: number;
  closest_task_at?: number;
  is_deleted: boolean;
  custom_fields?: AmoCRMCustomField[];
  main_contact?: {
    id: string;
  };
  company?: {
    id: string;
  };
  tags?: {
    id: string;
    name: string;
  }[];
}




