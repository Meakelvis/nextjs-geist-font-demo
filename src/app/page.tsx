"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  getProperties, 
  getTenants, 
  getAgreements, 
  getInvoices, 
  getPayments, 
  getExpenses,
  initializeSampleData 
} from "@/lib/storage";
import type { DashboardStats } from "@/types/rentals";

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    occupiedProperties: 0,
    vacantProperties: 0,
    occupancyRate: 0,
    totalTenants: 0,
    monthlyRentDue: 0,
    monthlyRentCollected: 0,
    rentCollectionRate: 0,
    totalArrears: 0,
    monthlyExpenses: 0,
    netCashFlow: 0,
  });

  const [recentActivities, setRecentActivities] = useState<Array<{
    id: string;
    type: string;
    description: string;
    date: string;
    amount?: number;
  }>>([]);

  useEffect(() => {
    // Initialize sample data if needed
    initializeSampleData();
    
    // Calculate dashboard statistics
    calculateStats();
    loadRecentActivities();
  }, []);

  const calculateStats = () => {
    const properties = getProperties();
    const tenants = getTenants();
    const agreements = getAgreements();
    const invoices = getInvoices();
    const payments = getPayments();
    const expenses = getExpenses();

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    
    // Property stats
    const totalProperties = properties.length;
    const occupiedProperties = properties.filter(p => p.status === "occupied").length;
    const vacantProperties = totalProperties - occupiedProperties;
    const occupancyRate = totalProperties > 0 ? (occupiedProperties / totalProperties) * 100 : 0;

    // Tenant stats
    const totalTenants = tenants.length;

    // Rent stats for current month
    const currentMonthInvoices = invoices.filter(inv => inv.month === currentMonth);
    const monthlyRentDue = currentMonthInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    
    const currentMonthPayments = payments.filter(p => 
      p.paymentDate.startsWith(currentMonth)
    );
    const monthlyRentCollected = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0);
    
    const rentCollectionRate = monthlyRentDue > 0 ? (monthlyRentCollected / monthlyRentDue) * 100 : 0;

    // Calculate arrears
    const overdueInvoices = invoices.filter(inv => inv.status === "overdue" || inv.status === "partial");
    const totalArrears = overdueInvoices.reduce((sum, inv) => {
      const paid = payments
        .filter(p => p.invoiceId === inv.id)
        .reduce((paidSum, p) => paidSum + p.amount, 0);
      return sum + (inv.totalAmount - paid);
    }, 0);

    // Monthly expenses
    const currentMonthExpenses = expenses.filter(exp => 
      exp.date.startsWith(currentMonth)
    );
    const monthlyExpenses = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Net cash flow
    const netCashFlow = monthlyRentCollected - monthlyExpenses;

    setStats({
      totalProperties,
      occupiedProperties,
      vacantProperties,
      occupancyRate,
      totalTenants,
      monthlyRentDue,
      monthlyRentCollected,
      rentCollectionRate,
      totalArrears,
      monthlyExpenses,
      netCashFlow,
    });
  };

  const loadRecentActivities = () => {
    const payments = getPayments();
    const expenses = getExpenses();
    
    const activities = [
      ...payments.slice(-5).map(p => ({
        id: p.id,
        type: "payment",
        description: `Payment received - ${p.paymentMode}`,
        date: p.paymentDate,
        amount: p.amount,
      })),
      ...expenses.slice(-5).map(e => ({
        id: e.id,
        type: "expense",
        description: `${e.category} - ${e.description}`,
        date: e.date,
        amount: e.amount,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    setRecentActivities(activities);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <span className="text-2xl">🏠</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProperties}</div>
            <p className="text-xs text-muted-foreground">
              {stats.occupiedProperties} occupied, {stats.vacantProperties} vacant
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <span className="text-2xl">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.occupancyRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.occupiedProperties} of {stats.totalProperties} properties
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Rent Collection</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rentCollectionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.monthlyRentCollected)} of {formatCurrency(stats.monthlyRentDue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
            <span className="text-2xl">📈</span>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats.netCashFlow)}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.totalTenants}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Arrears</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {formatCurrency(stats.totalArrears)}
            </div>
            {stats.totalArrears > 0 && (
              <Badge variant="destructive" className="mt-2">
                Requires Attention
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {formatCurrency(stats.monthlyExpenses)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">
                      {activity.type === "payment" ? "💰" : "📋"}
                    </span>
                    <div>
                      <p className="font-medium">{activity.description}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(activity.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {activity.amount && (
                    <div className={`font-bold ${activity.type === "payment" ? "text-green-600" : "text-red-600"}`}>
                      {activity.type === "payment" ? "+" : "-"}{formatCurrency(activity.amount)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No recent activities</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
