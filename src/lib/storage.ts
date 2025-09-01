import type { 
  Property, 
  Tenant, 
  TenancyAgreement, 
  RentInvoice, 
  Payment, 
  Expense, 
  MaintenanceRecord 
} from "../types/rentals";

// Storage keys
const STORAGE_KEYS = {
  PROPERTIES: "rentals_properties",
  TENANTS: "rentals_tenants",
  AGREEMENTS: "rentals_agreements",
  INVOICES: "rentals_invoices",
  PAYMENTS: "rentals_payments",
  EXPENSES: "rentals_expenses",
  MAINTENANCE: "rentals_maintenance"
} as const;

// Generic storage functions
const getFromStorage = <T>(key: string): T[] => {
  try {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error retrieving ${key}:`, error);
    return [];
  }
};

const saveToStorage = <T>(key: string, data: T[]): void => {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key}:`, error);
  }
};

// Property functions
export const getProperties = (): Property[] => {
  return getFromStorage<Property>(STORAGE_KEYS.PROPERTIES);
};

export const saveProperties = (properties: Property[]): void => {
  saveToStorage(STORAGE_KEYS.PROPERTIES, properties);
};

export const addProperty = (property: Omit<Property, "id" | "createdAt" | "updatedAt">): Property => {
  const properties = getProperties();
  const newProperty: Property = {
    ...property,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  properties.push(newProperty);
  saveProperties(properties);
  return newProperty;
};

export const updateProperty = (id: string, updates: Partial<Property>): Property | null => {
  const properties = getProperties();
  const index = properties.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  properties[index] = {
    ...properties[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  saveProperties(properties);
  return properties[index];
};

export const deleteProperty = (id: string): boolean => {
  const properties = getProperties();
  const filteredProperties = properties.filter(p => p.id !== id);
  if (filteredProperties.length === properties.length) return false;
  saveProperties(filteredProperties);
  return true;
};

// Tenant functions
export const getTenants = (): Tenant[] => {
  return getFromStorage<Tenant>(STORAGE_KEYS.TENANTS);
};

export const saveTenants = (tenants: Tenant[]): void => {
  saveToStorage(STORAGE_KEYS.TENANTS, tenants);
};

export const addTenant = (tenant: Omit<Tenant, "id" | "createdAt" | "updatedAt">): Tenant => {
  const tenants = getTenants();
  const newTenant: Tenant = {
    ...tenant,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  tenants.push(newTenant);
  saveTenants(tenants);
  return newTenant;
};

export const updateTenant = (id: string, updates: Partial<Tenant>): Tenant | null => {
  const tenants = getTenants();
  const index = tenants.findIndex(t => t.id === id);
  if (index === -1) return null;
  
  tenants[index] = {
    ...tenants[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  saveTenants(tenants);
  return tenants[index];
};

export const deleteTenant = (id: string): boolean => {
  const tenants = getTenants();
  const filteredTenants = tenants.filter(t => t.id !== id);
  if (filteredTenants.length === tenants.length) return false;
  saveTenants(filteredTenants);
  return true;
};

// Agreement functions
export const getAgreements = (): TenancyAgreement[] => {
  return getFromStorage<TenancyAgreement>(STORAGE_KEYS.AGREEMENTS);
};

export const saveAgreements = (agreements: TenancyAgreement[]): void => {
  saveToStorage(STORAGE_KEYS.AGREEMENTS, agreements);
};

export const addAgreement = (agreement: Omit<TenancyAgreement, "id" | "createdAt" | "updatedAt">): TenancyAgreement => {
  const agreements = getAgreements();
  const newAgreement: TenancyAgreement = {
    ...agreement,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  agreements.push(newAgreement);
  saveAgreements(agreements);
  return newAgreement;
};

// Invoice functions
export const getInvoices = (): RentInvoice[] => {
  return getFromStorage<RentInvoice>(STORAGE_KEYS.INVOICES);
};

export const saveInvoices = (invoices: RentInvoice[]): void => {
  saveToStorage(STORAGE_KEYS.INVOICES, invoices);
};

export const addInvoice = (invoice: Omit<RentInvoice, "id" | "createdAt">): RentInvoice => {
  const invoices = getInvoices();
  const newInvoice: RentInvoice = {
    ...invoice,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };
  invoices.push(newInvoice);
  saveInvoices(invoices);
  return newInvoice;
};

// Payment functions
export const getPayments = (): Payment[] => {
  return getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS);
};

export const savePayments = (payments: Payment[]): void => {
  saveToStorage(STORAGE_KEYS.PAYMENTS, payments);
};

export const addPayment = (payment: Omit<Payment, "id" | "createdAt">): Payment => {
  const payments = getPayments();
  const newPayment: Payment = {
    ...payment,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };
  payments.push(newPayment);
  savePayments(payments);
  
  // Update invoice status
  updateInvoiceStatus(payment.invoiceId);
  
  return newPayment;
};

// Expense functions
export const getExpenses = (): Expense[] => {
  return getFromStorage<Expense>(STORAGE_KEYS.EXPENSES);
};

export const saveExpenses = (expenses: Expense[]): void => {
  saveToStorage(STORAGE_KEYS.EXPENSES, expenses);
};

export const addExpense = (expense: Omit<Expense, "id" | "createdAt">): Expense => {
  const expenses = getExpenses();
  const newExpense: Expense = {
    ...expense,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };
  expenses.push(newExpense);
  saveExpenses(expenses);
  return newExpense;
};

// Maintenance functions
export const getMaintenance = (): MaintenanceRecord[] => {
  return getFromStorage<MaintenanceRecord>(STORAGE_KEYS.MAINTENANCE);
};

export const saveMaintenance = (maintenance: MaintenanceRecord[]): void => {
  saveToStorage(STORAGE_KEYS.MAINTENANCE, maintenance);
};

export const addMaintenanceRecord = (record: Omit<MaintenanceRecord, "id" | "createdAt">): MaintenanceRecord => {
  const maintenance = getMaintenance();
  const newRecord: MaintenanceRecord = {
    ...record,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };
  maintenance.push(newRecord);
  saveMaintenance(maintenance);
  return newRecord;
};

// Helper functions
export const updateInvoiceStatus = (invoiceId: string): void => {
  const invoices = getInvoices();
  const payments = getPayments();
  
  const invoice = invoices.find(inv => inv.id === invoiceId);
  if (!invoice) return;
  
  const invoicePayments = payments.filter(p => p.invoiceId === invoiceId);
  const totalPaid = invoicePayments.reduce((sum, p) => sum + p.amount, 0);
  
  let status: RentInvoice["status"] = "pending";
  if (totalPaid >= invoice.totalAmount) {
    status = "paid";
  } else if (totalPaid > 0) {
    status = "partial";
  } else if (new Date(invoice.dueDate) < new Date()) {
    status = "overdue";
  }
  
  const updatedInvoices = invoices.map(inv => 
    inv.id === invoiceId ? { ...inv, status } : inv
  );
  saveInvoices(updatedInvoices);
};

// Initialize with sample data if empty
export const initializeSampleData = (): void => {
  if (typeof window === "undefined") return;
  
  const properties = getProperties();
  if (properties.length === 0) {
    // Add sample properties
    const sampleProperties: Omit<Property, "id" | "createdAt" | "updatedAt">[] = [
      {
        houseNumber: "A001",
        location: "Kampala Central",
        type: "Apartment",
        size: 2,
        rentRate: 800000,
        status: "occupied",
        utilities: {
          electricityMeter: "EM001",
          waterAccount: "WA001",
          billingType: "postpaid"
        }
      },
      {
        houseNumber: "B002",
        location: "Ntinda",
        type: "House",
        size: 3,
        rentRate: 1200000,
        status: "vacant",
        utilities: {
          electricityMeter: "EM002",
          waterAccount: "WA002",
          billingType: "prepaid"
        }
      }
    ];
    
    sampleProperties.forEach(addProperty);
  }
};
