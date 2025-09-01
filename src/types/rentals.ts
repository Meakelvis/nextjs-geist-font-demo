export interface Property {
  id: string;
  houseNumber: string;
  location: string;
  type: string;
  size: number;
  rentRate: number;
  status: "occupied" | "vacant";
  utilities?: {
    electricityMeter: string;
    waterAccount: string;
    billingType: "prepaid" | "postpaid";
  };
  maintenance?: MaintenanceRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceRecord {
  id: string;
  propertyId: string;
  date: string;
  description: string;
  cost: number;
  type: "repairs" | "painting" | "cleaning" | "inspection" | "other";
  serviceProvider?: string;
  status: "pending" | "completed" | "cancelled";
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  idPassport: string;
  phone: string;
  email?: string;
  nextOfKin: {
    name: string;
    phone: string;
    relationship: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TenancyAgreement {
  id: string;
  tenantId: string;
  propertyId: string;
  startDate: string;
  endDate: string;
  securityDeposit: number;
  rentAmount: number;
  rentTerms: "monthly" | "quarterly" | "yearly";
  status: "active" | "expired" | "terminated";
  moveInDate?: string;
  moveOutDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RentInvoice {
  id: string;
  tenantId: string;
  propertyId: string;
  agreementId: string;
  dueDate: string;
  rentAmount: number;
  utilitiesAmount?: number;
  totalAmount: number;
  status: "pending" | "paid" | "overdue" | "partial";
  month: string; // Format: YYYY-MM
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  tenantId: string;
  propertyId: string;
  amount: number;
  paymentDate: string;
  paymentMode: "cash" | "bank" | "mobile_money" | "cheque";
  receiptNumber: string;
  notes?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  propertyId?: string;
  date: string;
  description: string;
  amount: number;
  category: "repairs" | "cleaning" | "utilities" | "admin" | "maintenance" | "other";
  serviceProvider?: string;
  receiptNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalProperties: number;
  occupiedProperties: number;
  vacantProperties: number;
  occupancyRate: number;
  totalTenants: number;
  monthlyRentDue: number;
  monthlyRentCollected: number;
  rentCollectionRate: number;
  totalArrears: number;
  monthlyExpenses: number;
  netCashFlow: number;
}
