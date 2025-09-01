"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  getExpenses,
  addExpense,
  getMaintenance,
  addMaintenanceRecord,
  getProperties
} from "@/lib/storage";
import type { Expense, MaintenanceRecord, Property } from "@/types/rentals";

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = useState(false);
  const [isAddMaintenanceDialogOpen, setIsAddMaintenanceDialogOpen] = useState(false);
  
  const [expenseFormData, setExpenseFormData] = useState({
    propertyId: "",
    date: "",
    description: "",
    amount: "",
    category: "other" as "repairs" | "cleaning" | "utilities" | "admin" | "maintenance" | "other",
    serviceProvider: "",
    receiptNumber: "",
    notes: "",
  });

  const [maintenanceFormData, setMaintenanceFormData] = useState({
    propertyId: "",
    date: "",
    description: "",
    cost: "",
    type: "repairs" as "repairs" | "painting" | "cleaning" | "inspection" | "other",
    serviceProvider: "",
    status: "pending" as "pending" | "completed" | "cancelled",
  });

  const [error, setError] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterProperty, setFilterProperty] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setExpenses(getExpenses());
    setMaintenance(getMaintenance());
    setProperties(getProperties());
  };

  const resetExpenseForm = () => {
    setExpenseFormData({
      propertyId: "",
      date: new Date().toISOString().split('T')[0],
      description: "",
      amount: "",
      category: "other",
      serviceProvider: "",
      receiptNumber: "",
      notes: "",
    });
    setError("");
  };

  const resetMaintenanceForm = () => {
    setMaintenanceFormData({
      propertyId: "",
      date: new Date().toISOString().split('T')[0],
      description: "",
      cost: "",
      type: "repairs",
      serviceProvider: "",
      status: "pending",
    });
    setError("");
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!expenseFormData.date || !expenseFormData.description || !expenseFormData.amount) {
      setError("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(expenseFormData.amount);

    if (isNaN(amount) || amount <= 0) {
      setError("Amount must be a valid positive number");
      return;
    }

    try {
      addExpense({
        propertyId: expenseFormData.propertyId || undefined,
        date: expenseFormData.date,
        description: expenseFormData.description,
        amount,
        category: expenseFormData.category,
        serviceProvider: expenseFormData.serviceProvider || undefined,
        receiptNumber: expenseFormData.receiptNumber || undefined,
        notes: expenseFormData.notes || undefined,
      });

      loadData();
      setIsAddExpenseDialogOpen(false);
      resetExpenseForm();
    } catch (err) {
      setError("An error occurred while adding the expense");
    }
  };

  const handleMaintenanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!maintenanceFormData.propertyId || !maintenanceFormData.date || 
        !maintenanceFormData.description || !maintenanceFormData.cost) {
      setError("Please fill in all required fields");
      return;
    }

    const cost = parseFloat(maintenanceFormData.cost);

    if (isNaN(cost) || cost < 0) {
      setError("Cost must be a valid number");
      return;
    }

    try {
      addMaintenanceRecord({
        propertyId: maintenanceFormData.propertyId,
        date: maintenanceFormData.date,
        description: maintenanceFormData.description,
        cost,
        type: maintenanceFormData.type,
        serviceProvider: maintenanceFormData.serviceProvider || undefined,
        status: maintenanceFormData.status,
      });

      // Also add as expense if completed
      if (maintenanceFormData.status === "completed" && cost > 0) {
        addExpense({
          propertyId: maintenanceFormData.propertyId,
          date: maintenanceFormData.date,
          description: `Maintenance: ${maintenanceFormData.description}`,
          amount: cost,
          category: "maintenance",
          serviceProvider: maintenanceFormData.serviceProvider || undefined,
        });
      }

      loadData();
      setIsAddMaintenanceDialogOpen(false);
      resetMaintenanceForm();
    } catch (err) {
      setError("An error occurred while adding the maintenance record");
    }
  };

  const getPropertyName = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    return property ? `${property.houseNumber} - ${property.location}` : "Unknown Property";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      repairs: "bg-red-100 text-red-800",
      cleaning: "bg-blue-100 text-blue-800",
      utilities: "bg-yellow-100 text-yellow-800",
      admin: "bg-purple-100 text-purple-800",
      maintenance: "bg-green-100 text-green-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    const categoryMatch = filterCategory === "all" || expense.category === filterCategory;
    const propertyMatch = filterProperty === "all" || expense.propertyId === filterProperty;
    return categoryMatch && propertyMatch;
  });

  // Filter maintenance
  const filteredMaintenance = maintenance.filter(record => {
    const propertyMatch = filterProperty === "all" || record.propertyId === filterProperty;
    return propertyMatch;
  });

  // Calculate totals
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const monthlyExpenses = filteredExpenses
    .filter(exp => exp.date.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Expenses & Maintenance</h1>
        <div className="space-x-2">
          <Dialog open={isAddExpenseDialogOpen} onOpenChange={setIsAddExpenseDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetExpenseForm}>Add Expense</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleExpenseSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="propertySelect">Property</Label>
                    <Select value={expenseFormData.propertyId} onValueChange={(value) => setExpenseFormData({ ...expenseFormData, propertyId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">General Expense</SelectItem>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.houseNumber} - {property.location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={expenseFormData.date}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={expenseFormData.description}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, description: e.target.value })}
                    placeholder="Describe the expense..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Amount (UGX) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={expenseFormData.amount}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
                      placeholder="50000"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={expenseFormData.category} onValueChange={(value: typeof expenseFormData.category) => setExpenseFormData({ ...expenseFormData, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="repairs">Repairs</SelectItem>
                        <SelectItem value="cleaning">Cleaning</SelectItem>
                        <SelectItem value="utilities">Utilities</SelectItem>
                        <SelectItem value="admin">Administration</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="serviceProvider">Service Provider</Label>
                    <Input
                      id="serviceProvider"
                      value={expenseFormData.serviceProvider}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, serviceProvider: e.target.value })}
                      placeholder="Company/Person name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="receiptNumber">Receipt Number</Label>
                    <Input
                      id="receiptNumber"
                      value={expenseFormData.receiptNumber}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, receiptNumber: e.target.value })}
                      placeholder="Receipt/Invoice number"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={expenseFormData.notes}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddExpenseDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Expense</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddMaintenanceDialogOpen} onOpenChange={setIsAddMaintenanceDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={resetMaintenanceForm}>Add Maintenance</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Maintenance Record</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="propertySelect">Property *</Label>
                    <Select value={maintenanceFormData.propertyId} onValueChange={(value) => setMaintenanceFormData({ ...maintenanceFormData, propertyId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.houseNumber} - {property.location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={maintenanceFormData.date}
                      onChange={(e) => setMaintenanceFormData({ ...maintenanceFormData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={maintenanceFormData.description}
                    onChange={(e) => setMaintenanceFormData({ ...maintenanceFormData, description: e.target.value })}
                    placeholder="Describe the maintenance work..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cost">Cost (UGX) *</Label>
                    <Input
                      id="cost"
                      type="number"
                      value={maintenanceFormData.cost}
                      onChange={(e) => setMaintenanceFormData({ ...maintenanceFormData, cost: e.target.value })}
                      placeholder="50000"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type *</Label>
                    <Select value={maintenanceFormData.type} onValueChange={(value: typeof maintenanceFormData.type) => setMaintenanceFormData({ ...maintenanceFormData, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="repairs">Repairs</SelectItem>
                        <SelectItem value="painting">Painting</SelectItem>
                        <SelectItem value="cleaning">Cleaning</SelectItem>
                        <SelectItem value="inspection">Inspection</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="serviceProvider">Service Provider</Label>
                    <Input
                      id="serviceProvider"
                      value={maintenanceFormData.serviceProvider}
                      onChange={(e) => setMaintenanceFormData({ ...maintenanceFormData, serviceProvider: e.target.value })}
                      placeholder="Company/Person name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select value={maintenanceFormData.status} onValueChange={(value: typeof maintenanceFormData.status) => setMaintenanceFormData({ ...maintenanceFormData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddMaintenanceDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Maintenance Record</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-sm text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {formatCurrency(monthlyExpenses)}
            </div>
            <p className="text-sm text-gray-500 mt-1">Current month expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {maintenance.filter(m => m.status === "pending").length}
            </div>
            <p className="text-sm text-gray-500 mt-1">Items requiring attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="filterCategory">Filter by Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="repairs">Repairs</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="admin">Administration</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterProperty">Filter by Property</Label>
              <Select value={filterProperty} onValueChange={setFilterProperty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.houseNumber} - {property.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredExpenses.map((expense) => (
              <Card key={expense.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getCategoryColor(expense.category)}>
                          {expense.category}
                        </Badge>
                        {expense.propertyId && (
                          <span className="text-sm text-gray-500">
                            {getPropertyName(expense.propertyId)}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{expense.description}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Date</p>
                          <p className="font-medium">{new Date(expense.date).toLocaleDateString()}</p>
                        </div>
                        {expense.serviceProvider && (
                          <div>
                            <p className="text-gray-600">Service Provider</p>
                            <p className="font-medium">{expense.serviceProvider}</p>
                          </div>
                        )}
                        {expense.receiptNumber && (
                          <div>
                            <p className="text-gray-600">Receipt</p>
                            <p className="font-medium">{expense.receiptNumber}</p>
                          </div>
                        )}
                      </div>
                      {expense.notes && (
                        <p className="text-sm text-gray-600 mt-2">{expense.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(expense.amount)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredExpenses.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500 text-lg mb-4">No expenses found</p>
                <p className="text-gray-400 mb-6">Add your first expense record</p>
                <Button onClick={() => setIsAddExpenseDialogOpen(true)}>
                  Add First Expense
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredMaintenance.map((record) => (
              <Card key={record.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getCategoryColor(record.type)}>
                          {record.type}
                        </Badge>
                        <Badge className={getStatusColor(record.status)}>
                          {record.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {getPropertyName(record.propertyId)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{record.description}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Date</p>
                          <p className="font-medium">{new Date(record.date).toLocaleDateString()}</p>
                        </div>
                        {record.serviceProvider && (
                          <div>
                            <p className="text-gray-600">Service Provider</p>
                            <p className="font-medium">{record.serviceProvider}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-600">Created</p>
                          <p className="font-medium">{new Date(record.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-600">
                        {formatCurrency(record.cost)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredMaintenance.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500 text-lg mb-4">No maintenance records found</p>
                <p className="text-gray-400 mb-6">Add your first maintenance record</p>
                <Button onClick={() => setIsAddMaintenanceDialogOpen(true)}>
                  Add First Maintenance Record
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExpensesPage;
