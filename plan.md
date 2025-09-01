Below is a detailed plan outlining every change and dependency required to implement the standalone Rentals Management System using local storage for data persistence. The plan is broken down by file and module, with step-by-step instructions, error‐handling guidelines, and modern UI/UX considerations.

---

## 1. Data Modeling and Storage

### Create Type Definitions  
- **File:** `src/types/rentals.ts`  
 – Define TypeScript interfaces for all entities: Properties, MaintenanceRecord, Tenant, Agreement, RentInvoice, Payment, and Expense.  
 – Example snippet:  
```typescript
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
}

export interface MaintenanceRecord {
  date: string;
  description: string;
  cost: number;
  type: string; // e.g., repairs, painting
}

// Define Tenant, Agreement, RentInvoice, Payment, Expense similarly.
```

### Build Local Storage Utilities  
- **File:** `src/lib/storage.ts`  
 – Create functions for CRUD operations for each entity using localStorage (wrap all methods in try/catch for error handling).  
 – Example snippet:  
```typescript
import type { Property } from "../types/rentals";

export const getProperties = (): Property[] => {
  try {
    const data = localStorage.getItem("properties");
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Error retrieving properties:", e);
    return [];
  }
};

export const saveProperties = (properties: Property[]): void => {
  try {
    localStorage.setItem("properties", JSON.stringify(properties));
  } catch (e) {
    console.error("Error saving properties:", e);
  }
};
// Repeat similar functions for tenants, invoices, payments and expenses.
```

---

## 2. Global Layout and Navigation

### Update App Layout  
- **File:** `src/app/layout.tsx`  
 – Enhance the layout with a fixed header and a modern navigation bar.  
 – Use semantic HTML (e.g., `<nav>`, `<ul>`, `<li>`) and accessible attributes.  
 – Example snippet:  
```tsx
import Link from "next/link";
import "../app/globals.css";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <head>
        <title>Rentals Management System</title>
      </head>
      <body>
        <header style={{ backgroundColor: "#f5f5f5", padding: "1rem" }}>
          <nav>
            <ul style={{ listStyle: "none", display: "flex", gap: "1.5rem" }}>
              <li><Link href="/dashboard">Dashboard</Link></li>
              <li><Link href="/properties">Properties</Link></li>
              <li><Link href="/tenants">Tenants</Link></li>
              <li><Link href="/rent">Rent</Link></li>
              <li><Link href="/expenses">Expenses</Link></li>
              <li><Link href="/reports">Reports</Link></li>
            </ul>
          </nav>
        </header>
        <main style={{ padding: "2rem" }}>{children}</main>
      </body>
    </html>
  );
};

export default Layout;
```

---

## 3. Module Pages and UI Components

Create separate pages under the Next.js App Router. Each will use modern, card- or table-based layouts with form modals where applicable.

### 3.1 Dashboard  
- **File:** `src/app/dashboard/page.tsx`  
 – Display overall KPIs (occupancy rate, rent collection rate, total arrears, monthly cash flow, top performing properties).  
 – Use card components (from `src/components/ui/card.tsx`) to visually highlight data.  
 – Compute data using functions from `src/lib/storage.ts` and include error handling when retrieving data.  
 – Provide a clean and responsive design.  

### 3.2 Properties Management  
- **File:** `src/app/properties/page.tsx`  
 – List all properties in a table or card layout.  
 – Include an “Add Property” button that opens a modal form.  
 – **Component Creation:** Create `src/components/AddPropertyForm.tsx` to handle input (fields: house number, location, type, size, rent rate, status, and utility details).  
 – Validate inputs (e.g., required fields, numeric validations) and show errors using the Alert component from `src/components/ui/alert.tsx`.  

### 3.3 Tenant Management  
- **File:** `src/app/tenants/page.tsx`  
 – Display a list of tenants along with their tenant agreements and move-in/move-out records.  
 – **Component Creation:** Build `src/components/AddTenantForm.tsx` for tenant registration (Name, ID/Passport, Phone, Next of Kin, Emergency Contact).  
 – Incorporate client-side validations with friendly error messages.

### 3.4 Rent Management  
- **File:** `src/app/rent/page.tsx`  
 – Show rent invoices, payment history, and a flag for overdue rents (auto-calculation using due date and paid date).  
 – **Component Creation:** Build a form component (e.g., `src/components/AddInvoiceForm.tsx`) with fields for due date, rent amount, utilities, and payment mode.  
 – Implement a utility function to compute arrears and update the UI accordingly.

### 3.5 Expense & Maintenance Management  
- **File:** `src/app/expenses/page.tsx`  
 – Present logs for repairs and maintenance along with expense records (date, property, description, cost, category).  
 – **Component Creation:** Create `src/components/AddExpenseForm.tsx` for adding expenses and maintenance logs.  
 – Provide filter options (by category, property) and graceful handling of input errors.

### 3.6 Finance & Reporting  
- **File:** `src/app/reports/page.tsx`  
 – Show revenue and expense reports segmented by monthly, quarterly, or yearly intervals.  
 – Include profitability analysis (rent collected vs. expenses) and a rent arrears summary.  
 – Design reporting views using tables and cards.  
 – Optionally prepare for future enhancements (e.g., downloads or printing reports).

---

## 4. UI/UX Details and Styling

- **Global Styles:**  
 – Modify `src/app/globals.css` to define a modern color palette, typography (e.g., sans-serif modern fonts), and spacing.  
 – Ensure a responsive grid layout with consistent padding and margin.

- **Modern UI Elements:**  
 – Use card-based layouts for dashboards and detailed lists.  
 – For modals/forms, use clean input fields with appropriate labels and accessible error notifications.  
 – Avoid using icons or external images for dashboards; rely solely on typography, color, and layout (unless explicitly needed).

- **Image Guidelines:**  
 – If an image is ever required (e.g., a marketing banner), use:  
```html
<img src="https://placehold.co/1920x1080?text=Modern+minimalist+dashboard+header+with+clean+layout+and+balanced+typography" alt="Modern minimalist dashboard header with clean layout and balanced typography" onerror="this.style.display='none';" />
```  
 – Do not use SVG libraries or third-party image providers for internal UI elements.

---

## 5. Error Handling and Best Practices

- Every interaction with local storage (in `src/lib/storage.ts`) should be wrapped in try/catch blocks to handle and log errors smoothly.  
- Validate all user inputs on the client side using standard HTML5 validations and/or custom validation messages using components from `src/components/ui/form.tsx` and `src/components/ui/alert.tsx`.  
- Use consistent and descriptive error messages so that users can quickly correct issues.  
- Ensure all forms have a loading state for submissions and proper UI feedback when errors occur.

---

## 6. Automation and Data Calculations

- **Auto Arrears Calculator:**  
 – Write a helper function (e.g., in `src/lib/utils.ts`) that takes rent due and payment history to compute arrears.  
 – Integrate this function within the Rent Management page to visually auto-flag overdue tenants.

- **Tenant Balance Tracker:**  
 – Store and update tenant balances in localStorage as new invoices and payments are recorded.  
 – Reflect this status in the tenant listing and dashboard.

- **Reminders:**  
 – In the dashboard, implement a useEffect hook that checks lease expiry and upcoming due dates, displaying gentle reminders (e.g., styled alert banners).

---

## 7. README and Documentation

- **File:** `README.md`  
 – Update documentation to include:  
  – System overview with modules and functionalities.  
  – Instructions for running the standalone app and how data persists via localStorage.  
  – Future extension points (e.g., integration with external APIs).

---

## Summary

- New TypeScript types are defined in `src/types/rentals.ts` for properties, tenants, invoices, and expenses.  
- A local storage utility (`src/lib/storage.ts`) ensures safe data persistence with error handling.  
- The global layout in `src/app/layout.tsx` is updated with a modern, accessible navigation bar.  
- Separate, responsive pages for Dashboard, Properties, Tenants, Rent, Expenses, and Reports are created with modern card and table layouts.  
- Each module has its own form component for data entry with client-side validations and error alerts.  
- Styling is updated in globals.css for consistent typography, spacing, and modern design, with no reliance on external icons or image libraries.  
- Automation features such as arrears calculation, balance tracking, and reminders are integrated into the data utility and UI layer.  
- The README is updated to document usage, design decisions, and extension points for future enhancements.
