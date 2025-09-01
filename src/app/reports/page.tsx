"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  getProperties,
  getTenants,
  getInvoices,
  getPayments,
  getExpenses,
  getAgreements
} from "@/lib/storage";
import type { Property, Tenant, RentInvoice, Payment, Expense, TenancyAgreement } from "@/types/rentals";

interface ReportData {
  revenue: {
    monthly: { month: string; amount: number }[];
    quarterly: { quarter: string; amount: number }[];
    yearly: { year: string; amount: number }[];
  };
  expenses: {
    monthly: { month: string; amount: number }[];
    quarterly: { quarter: string; amount: number }[];
    yearly: { year: string; amount: number }[];
    byCategory: { category: string; amount: number }[];
  };
  profitability: {
    monthly: { month: string; revenue: number; expenses: number; profit: number }[];
    quarterly: { quarter: string; revenue: number; expenses: number; profit: number }[];
    yearly: { year: string; revenue: number; expenses: number; profit: number }[];
  };
  arrears: {
    total: number;
    byTenant: { tenantName: string; amount: number; propertyName: string }[];
    byProperty: { propertyName: string; amount: number }[];
  };
  occupancy: {
    current: number;
    byProperty: { propertyName: string; status: string; tenant?: string }[];
    trends: { month: string; rate: number }[];
  };
}

const ReportsPage = () => {
  const [reportData, setReportData] = useState<ReportData>({
    revenue: { monthly: [], quarterly: [], yearly: [] },
    expenses: { monthly: [], quarterly: [], yearly: [], byCategory: [] },
    profitability: { monthly: [], quarterly: [], yearly: [] },
    arrears: { total: 0, byTenant: [], byProperty: [] },
    occupancy: { current: 0, byProperty: [], trends: [] },
  });

  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    generateReports();
  }, [selectedYear]);

  const generateReports = () => {
    const properties = getProperties();
    const tenants = getTenants();
    const invoices = getInvoices();
    const payments = getPayments();
    const expenses = getExpenses();
    const agreements = getAgreements();

    // Generate revenue reports
    const revenueData = generateRevenueReports(payments, selectedYear);
    
    // Generate expense reports
    const expenseData = generateExpenseReports(expenses, selectedYear);
    
    // Generate profitability reports
    const profitabilityData = generateProfitabilityReports(revenueData, expenseData);
    
    // Generate arrears report
    const arrearsData = generateArrearsReport(invoices, payments, tenants, properties);
    
    // Generate occupancy report
    const occupancyData = generateOccupancyReport(properties, agreements, tenants);

    setReportData({
      revenue: revenueData,
      expenses: expenseData,
      profitability: profitabilityData,
      arrears: arrearsData,
      occupancy: occupancyData,
    });
  };

  const generateRevenueReports = (payments: Payment[], year: string) => {
    const monthly: { month: string; amount: number }[] = [];
    const quarterly: { quarter: string; amount: number }[] = [];
    const yearly: { year: string; amount: number }[] = [];

    // Monthly revenue
    for (let month = 1; month <= 12; month++) {
      const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
      const monthlyPayments = payments.filter(p => p.paymentDate.startsWith(monthStr));
      const amount = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);
      monthly.push({
        month: new Date(parseInt(year), month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount
      });
    }

    // Quarterly revenue
    for (let quarter = 1; quarter <= 4; quarter++) {
      const startMonth = (quarter - 1) * 3 + 1;
      const endMonth = quarter * 3;
      const quarterPayments = payments.filter(p => {
        const paymentMonth = parseInt(p.paymentDate.split('-')[1]);
        const paymentYear = parseInt(p.paymentDate.split('-')[0]);
        return paymentYear === parseInt(year) && paymentMonth >= startMonth && paymentMonth <= endMonth;
      });
      const amount = quarterPayments.reduce((sum, p) => sum + p.amount, 0);
      quarterly.push({
        quarter: `Q${quarter} ${year}`,
        amount
      });
    }

    // Yearly revenue
    const yearlyPayments = payments.filter(p => p.paymentDate.startsWith(year));
    const yearlyAmount = yearlyPayments.reduce((sum, p) => sum + p.amount, 0);
    yearly.push({ year, amount: yearlyAmount });

    return { monthly, quarterly, yearly };
  };

  const generateExpenseReports = (expenses: Expense[], year: string) => {
    const monthly: { month: string; amount: number }[] = [];
    const quarterly: { quarter: string; amount: number }[] = [];
    const yearly: { year: string; amount: number }[] = [];
    const byCategory: { category: string; amount: number }[] = [];

    // Monthly expenses
    for (let month = 1; month <= 12; month++) {
      const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
      const monthlyExpenses = expenses.filter(e => e.date.startsWith(monthStr));
      const amount = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
      monthly.push({
        month: new Date(parseInt(year), month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount
      });
    }

    // Quarterly expenses
    for (let quarter = 1; quarter <= 4; quarter++) {
      const startMonth = (quarter - 1) * 3 + 1;
      const endMonth = quarter * 3;
      const quarterExpenses = expenses.filter(e => {
        const expenseMonth = parseInt(e.date.split('-')[1]);
        const expenseYear = parseInt(e.date.split('-')[0]);
        return expenseYear === parseInt(year) && expenseMonth >= startMonth && expenseMonth <= endMonth;
      });
      const amount = quarterExpenses.reduce((sum, e) => sum + e.amount, 0);
      quarterly.push({
        quarter: `Q${quarter} ${year}`,
        amount
      });
    }

    // Yearly expenses
    const yearlyExpenses = expenses.filter(e => e.date.startsWith(year));
    const yearlyAmount = yearlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    yearly.push({ year, amount: yearlyAmount });

    // By category
    const categories = ['repairs', 'cleaning', 'utilities', 'admin', 'maintenance', 'other'];
    categories.forEach(category => {
      const categoryExpenses = yearlyExpenses.filter(e => e.category === category);
      const amount = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
      if (amount > 0) {
        byCategory.push({ category: category.charAt(0).toUpperCase() + category.slice(1), amount });
      }
    });

    return { monthly, quarterly, yearly, byCategory };
  };

  const generateProfitabilityReports = (
    revenueData: { monthly: { month: string; amount: number }[]; quarterly: { quarter: string; amount: number }[]; yearly: { year: string; amount: number }[] },
    expenseData: { monthly: { month: string; amount: number }[]; quarterly: { quarter: string; amount: number }[]; yearly: { year: string; amount: number }[] }
  ) => {
    const monthly = revenueData.monthly.map((rev, index) => ({
      month: rev.month,
      revenue: rev.amount,
      expenses: expenseData.monthly[index]?.amount || 0,
      profit: rev.amount - (expenseData.monthly[index]?.amount || 0)
    }));

    const quarterly = revenueData.quarterly.map((rev, index) => ({
      quarter: rev.quarter,
      revenue: rev.amount,
      expenses: expenseData.quarterly[index]?.amount || 0,
      profit: rev.amount - (expenseData.quarterly[index]?.amount || 0)
    }));

    const yearly = revenueData.yearly.map((rev, index) => ({
      year: rev.year,
      revenue: rev.amount,
      expenses: expenseData.yearly[index]?.amount || 0,
      profit: rev.amount - (expenseData.yearly[index]?.amount || 0)
    }));

    return { monthly, quarterly, yearly };
  };

  const generateArrearsReport = (invoices: RentInvoice[], payments: Payment[], tenants: Tenant[], properties: Property[]) => {
    const byTenant: { tenantName: string; amount: number; propertyName: string }[] = [];
    const byProperty: { propertyName: string; amount: number }[] = [];
    let total = 0;

    // Calculate arrears by tenant
    tenants.forEach(tenant => {
      const tenantInvoices = invoices.filter(inv => inv.tenantId === tenant.id);
      let tenantArrears = 0;
      let propertyName = "";

      tenantInvoices.forEach(invoice => {
        const invoicePayments = payments.filter(p => p.invoiceId === invoice.id);
        const totalPaid = invoicePayments.reduce((sum, p) => sum + p.amount, 0);
        const outstanding = invoice.totalAmount - totalPaid;
        
        if (outstanding > 0) {
          tenantArrears += outstanding;
          const property = properties.find(p => p.id === invoice.propertyId);
          propertyName = property ? `${property.houseNumber} - ${property.location}` : "Unknown";
        }
      });

      if (tenantArrears > 0) {
        byTenant.push({
          tenantName: tenant.name,
          amount: tenantArrears,
          propertyName
        });
        total += tenantArrears;
      }
    });

    // Calculate arrears by property
    const propertyArrearsMap = new Map<string, number>();
    
    invoices.forEach(invoice => {
      const invoicePayments = payments.filter(p => p.invoiceId === invoice.id);
      const totalPaid = invoicePayments.reduce((sum, p) => sum + p.amount, 0);
      const outstanding = invoice.totalAmount - totalPaid;
      
      if (outstanding > 0) {
        const property = properties.find(p => p.id === invoice.propertyId);
        const propertyName = property ? `${property.houseNumber} - ${property.location}` : "Unknown";
        
        const currentArrears = propertyArrearsMap.get(propertyName) || 0;
        propertyArrearsMap.set(propertyName, currentArrears + outstanding);
      }
    });

    propertyArrearsMap.forEach((amount, propertyName) => {
      byProperty.push({ propertyName, amount });
    });

    return { total, byTenant, byProperty };
  };

  const generateOccupancyReport = (properties: Property[], agreements: TenancyAgreement[], tenants: Tenant[]) => {
    const occupiedCount = properties.filter(p => p.status === "occupied").length;
    const current = properties.length > 0 ? (occupiedCount / properties.length) * 100 : 0;

    const byProperty = properties.map(property => {
      const activeAgreement = agreements.find(a => a.propertyId === property.id && a.status === "active");
      const tenant = activeAgreement ? tenants.find(t => t.id === activeAgreement.tenantId) : undefined;
      
      return {
        propertyName: `${property.houseNumber} - ${property.location}`,
        status: property.status,
        tenant: tenant?.name
      };
    });

    // Generate occupancy trends (simplified - last 12 months)
    const trends: { month: string; rate: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      // For simplicity, we'll use current occupancy rate for all months
      // In a real application, you'd track historical data
      trends.push({
        month: monthStr,
        rate: current
      });
    }

    return { current, byProperty, trends };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const availableYears = Array.from(
    { length: 5 }, 
    (_, i) => (new Date().getFullYear() - i).toString()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="flex items-center space-x-4">
          <div>
            <Label htmlFor="yearSelect">Year</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="profitability">Profitability</TabsTrigger>
          <TabsTrigger value="arrears">Arrears</TabsTrigger>
          <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Revenue Reports</h2>
            <div className="space-x-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={() => exportToCSV(reportData.revenue[selectedPeriod as keyof typeof reportData.revenue], `revenue-${selectedPeriod}-${selectedYear}`)}
              >
                Export CSV
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {reportData.revenue[selectedPeriod as keyof typeof reportData.revenue].map((item: any, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        {selectedPeriod === 'monthly' ? 'Month' : selectedPeriod === 'quarterly' ? 'Quarter' : 'Year'}
                      </p>
                      <p className="font-semibold text-lg">
                        {item.month || item.quarter || item.year}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Revenue</p>
                      <p className="font-bold text-2xl text-green-600">
                        {formatCurrency(item.amount)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {reportData.revenue[selectedPeriod as keyof typeof reportData.revenue].length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500">No revenue data available for {selectedYear}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Expense Reports</h2>
            <div className="space-x-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="byCategory">By Category</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={() => {
                  const data = selectedPeriod === 'byCategory' 
                    ? reportData.expenses.byCategory 
                    : reportData.expenses[selectedPeriod as keyof Omit<typeof reportData.expenses, 'byCategory'>];
                  exportToCSV(data, `expenses-${selectedPeriod}-${selectedYear}`);
                }}
              >
                Export CSV
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {selectedPeriod === 'byCategory' ? (
              reportData.expenses.byCategory.map((item, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Category</p>
                        <p className="font-semibold text-lg">{item.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total Expenses</p>
                        <p className="font-bold text-2xl text-red-600">
                          {formatCurrency(item.amount)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              reportData.expenses[selectedPeriod as keyof Omit<typeof reportData.expenses, 'byCategory'>].map((item: any, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          {selectedPeriod === 'monthly' ? 'Month' : selectedPeriod === 'quarterly' ? 'Quarter' : 'Year'}
                        </p>
                        <p className="font-semibold text-lg">
                          {item.month || item.quarter || item.year}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Expenses</p>
                        <p className="font-bold text-2xl text-red-600">
                          {formatCurrency(item.amount)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="profitability" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Profitability Analysis</h2>
            <div className="space-x-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={() => exportToCSV(reportData.profitability[selectedPeriod as keyof typeof reportData.profitability], `profitability-${selectedPeriod}-${selectedYear}`)}
              >
                Export CSV
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {reportData.profitability[selectedPeriod as keyof typeof reportData.profitability].map((item: any, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">
                        {item.month || item.quarter || item.year}
                      </h3>
                      <div className={`font-bold text-2xl ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(item.profit)}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Revenue</p>
                        <p className="font-medium text-green-600">{formatCurrency(item.revenue)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Expenses</p>
                        <p className="font-medium text-red-600">{formatCurrency(item.expenses)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Profit Margin</p>
                        <p className="font-medium">
                          {item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="arrears" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Rent Arrears Summary</h2>
            <Button 
              variant="outline" 
              onClick={() => exportToCSV(reportData.arrears.byTenant, `arrears-by-tenant-${new Date().toISOString().split('T')[0]}`)}
            >
              Export CSV
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Total Outstanding Arrears</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-red-600">
                {formatCurrency(reportData.arrears.total)}
              </div>
              <p className="text-gray-500 mt-2">
                {reportData.arrears.byTenant.length} tenant(s) with outstanding payments
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Arrears by Tenant</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.arrears.byTenant.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.tenantName}</p>
                        <p className="text-sm text-gray-600">{item.propertyName}</p>
                      </div>
                      <div className="font-bold text-red-600">
                        {formatCurrency(item.amount)}
                      </div>
                    </div>
                  ))}
                  {reportData.arrears.byTenant.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No outstanding arrears</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Arrears by Property</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.arrears.byProperty.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.propertyName}</p>
                      </div>
                      <div className="font-bold text-red-600">
                        {formatCurrency(item.amount)}
                      </div>
                    </div>
                  ))}
                  {reportData.arrears.byProperty.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No outstanding arrears</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="occupancy" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Occupancy Analysis</h2>
            <Button 
              variant="outline" 
              onClick={() => exportToCSV(reportData.occupancy.byProperty, `occupancy-${new Date().toISOString().split('T')[0]}`)}
            >
              Export CSV
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Current Occupancy Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600">
                {reportData.occupancy.current.toFixed(1)}%
              </div>
              <p className="text-gray-500 mt-2">
                {reportData.occupancy.byProperty.filter(p => p.status === 'occupied').length} of {reportData.occupancy.byProperty.length} properties occupied
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Property Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.occupancy.byProperty.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{item.propertyName}</p>
                      {item.tenant && (
                        <p className="text-sm text-gray-600">Tenant: {item.tenant}</p>
                      )}
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        item.status === 'occupied' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
