"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  getInvoices,
  addInvoice,
  getPayments,
  addPayment,
  getTenants,
  getProperties,
  getAgreements
} from "@/lib/storage";
import type { RentInvoice, Payment, Tenant, Property, TenancyAgreement } from "@/types/rentals";

const RentPage = () => {
  const [invoices, setInvoices] = useState<RentInvoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [agreements, setAgreements] = useState<TenancyAgreement[]>([]);
  const [isAddInvoiceDialogOpen, setIsAddInvoiceDialogOpen] = useState(false);
  const [isAddPaymentDialogOpen, setIsAddPaymentDialogOpen] = useState(false);
  
  const [invoiceFormData, setInvoiceFormData] = useState({
    tenantId: "",
    propertyId: "",
    agreementId: "",
    dueDate: "",
    rentAmount: "",
    utilitiesAmount: "",
    month: "",
  });

  const [paymentFormData, setPaymentFormData] = useState({
    invoiceId: "",
    amount: "",
    paymentDate: "",
    paymentMode: "cash" as "cash" | "bank" | "mobile_money" | "cheque",
    receiptNumber: "",
    notes: "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setInvoices(getInvoices());
    setPayments(getPayments());
    setTenants(getTenants());
    setProperties(getProperties());
    setAgreements(getAgreements());
  };

  const resetInvoiceForm = () => {
    setInvoiceFormData({
      tenantId: "",
      propertyId: "",
      agreementId: "",
      dueDate: "",
      rentAmount: "",
      utilitiesAmount: "",
      month: "",
    });
    setError("");
  };

  const resetPaymentForm = () => {
    setPaymentFormData({
      invoiceId: "",
      amount: "",
      paymentDate: "",
      paymentMode: "cash",
      receiptNumber: "",
      notes: "",
    });
    setError("");
  };

  const handleInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!invoiceFormData.tenantId || !invoiceFormData.propertyId || 
        !invoiceFormData.dueDate || !invoiceFormData.rentAmount || !invoiceFormData.month) {
      setError("Please fill in all required fields");
      return;
    }

    const rentAmount = parseFloat(invoiceFormData.rentAmount);
    const utilitiesAmount = parseFloat(invoiceFormData.utilitiesAmount) || 0;

    if (isNaN(rentAmount) || rentAmount <= 0) {
      setError("Rent amount must be a valid positive number");
      return;
    }

    if (utilitiesAmount < 0) {
      setError("Utilities amount must be a valid number");
      return;
    }

    try {
      const agreement = agreements.find(a => a.tenantId === invoiceFormData.tenantId && a.propertyId === invoiceFormData.propertyId);
      
      addInvoice({
        tenantId: invoiceFormData.tenantId,
        propertyId: invoiceFormData.propertyId,
        agreementId: agreement?.id || "",
        dueDate: invoiceFormData.dueDate,
        rentAmount,
        utilitiesAmount: utilitiesAmount > 0 ? utilitiesAmount : undefined,
        totalAmount: rentAmount + utilitiesAmount,
        status: "pending",
        month: invoiceFormData.month,
      });

      loadData();
      setIsAddInvoiceDialogOpen(false);
      resetInvoiceForm();
    } catch (err) {
      setError("An error occurred while creating the invoice");
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!paymentFormData.invoiceId || !paymentFormData.amount || 
        !paymentFormData.paymentDate || !paymentFormData.receiptNumber) {
      setError("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(paymentFormData.amount);

    if (isNaN(amount) || amount <= 0) {
      setError("Payment amount must be a valid positive number");
      return;
    }

    try {
      const invoice = invoices.find(inv => inv.id === paymentFormData.invoiceId);
      if (!invoice) {
        setError("Invoice not found");
        return;
      }

      addPayment({
        invoiceId: paymentFormData.invoiceId,
        tenantId: invoice.tenantId,
        propertyId: invoice.propertyId,
        amount,
        paymentDate: paymentFormData.paymentDate,
        paymentMode: paymentFormData.paymentMode,
        receiptNumber: paymentFormData.receiptNumber,
        notes: paymentFormData.notes || undefined,
      });

      loadData();
      setIsAddPaymentDialogOpen(false);
      resetPaymentForm();
    } catch (err) {
      setError("An error occurred while recording the payment");
    }
  };

  const getTenantName = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? tenant.name : "Unknown Tenant";
  };

  const getPropertyName = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    return property ? `${property.houseNumber} - ${property.location}` : "Unknown Property";
  };

  const getInvoicePayments = (invoiceId: string) => {
    return payments.filter(p => p.invoiceId === invoiceId);
  };

  const getTotalPaid = (invoiceId: string) => {
    return getInvoicePayments(invoiceId).reduce((sum, p) => sum + p.amount, 0);
  };

  const getOutstandingAmount = (invoice: RentInvoice) => {
    const totalPaid = getTotalPaid(invoice.id);
    return invoice.totalAmount - totalPaid;
  };

  const getStatusBadgeVariant = (status: RentInvoice["status"]) => {
    switch (status) {
      case "paid": return "default";
      case "partial": return "secondary";
      case "overdue": return "destructive";
      default: return "outline";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const generateReceiptNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `RCP${timestamp}`;
  };

  // Filter active agreements for invoice creation
  const activeAgreements = agreements.filter(a => a.status === "active");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Rent Management</h1>
        <div className="space-x-2">
          <Dialog open={isAddInvoiceDialogOpen} onOpenChange={setIsAddInvoiceDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetInvoiceForm}>Create Invoice</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Rent Invoice</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleInvoiceSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tenantSelect">Tenant *</Label>
                    <Select value={invoiceFormData.tenantId} onValueChange={(value) => {
                      setInvoiceFormData({ ...invoiceFormData, tenantId: value });
                      // Auto-select property if tenant has active agreement
                      const agreement = activeAgreements.find(a => a.tenantId === value);
                      if (agreement) {
                        setInvoiceFormData(prev => ({ 
                          ...prev, 
                          tenantId: value,
                          propertyId: agreement.propertyId,
                          agreementId: agreement.id,
                          rentAmount: agreement.rentAmount.toString()
                        }));
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tenant" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeAgreements.map((agreement) => {
                          const tenant = tenants.find(t => t.id === agreement.tenantId);
                          return tenant ? (
                            <SelectItem key={agreement.tenantId} value={agreement.tenantId}>
                              {tenant.name}
                            </SelectItem>
                          ) : null;
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="propertySelect">Property *</Label>
                    <Select value={invoiceFormData.propertyId} onValueChange={(value) => setInvoiceFormData({ ...invoiceFormData, propertyId: value })}>
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="month">Month *</Label>
                    <Input
                      id="month"
                      type="month"
                      value={invoiceFormData.month}
                      onChange={(e) => setInvoiceFormData({ ...invoiceFormData, month: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="dueDate">Due Date *</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={invoiceFormData.dueDate}
                      onChange={(e) => setInvoiceFormData({ ...invoiceFormData, dueDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rentAmount">Rent Amount (UGX) *</Label>
                    <Input
                      id="rentAmount"
                      type="number"
                      value={invoiceFormData.rentAmount}
                      onChange={(e) => setInvoiceFormData({ ...invoiceFormData, rentAmount: e.target.value })}
                      placeholder="800000"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="utilitiesAmount">Utilities Amount (UGX)</Label>
                    <Input
                      id="utilitiesAmount"
                      type="number"
                      value={invoiceFormData.utilitiesAmount}
                      onChange={(e) => setInvoiceFormData({ ...invoiceFormData, utilitiesAmount: e.target.value })}
                      placeholder="50000"
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddInvoiceDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Invoice</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddPaymentDialogOpen} onOpenChange={setIsAddPaymentDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => {
                resetPaymentForm();
                setPaymentFormData(prev => ({ 
                  ...prev, 
                  receiptNumber: generateReceiptNumber(),
                  paymentDate: new Date().toISOString().split('T')[0]
                }));
              }}>Record Payment</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div>
                  <Label htmlFor="invoiceSelect">Invoice *</Label>
                  <Select value={paymentFormData.invoiceId} onValueChange={(value) => setPaymentFormData({ ...paymentFormData, invoiceId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select invoice" />
                    </SelectTrigger>
                    <SelectContent>
                      {invoices.filter(inv => inv.status !== "paid").map((invoice) => (
                        <SelectItem key={invoice.id} value={invoice.id}>
                          {getTenantName(invoice.tenantId)} - {invoice.month} - {formatCurrency(getOutstandingAmount(invoice))} outstanding
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Payment Amount (UGX) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={paymentFormData.amount}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                      placeholder="800000"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="paymentDate">Payment Date *</Label>
                    <Input
                      id="paymentDate"
                      type="date"
                      value={paymentFormData.paymentDate}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paymentMode">Payment Mode *</Label>
                    <Select value={paymentFormData.paymentMode} onValueChange={(value: "cash" | "bank" | "mobile_money" | "cheque") => setPaymentFormData({ ...paymentFormData, paymentMode: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="receiptNumber">Receipt Number *</Label>
                    <Input
                      id="receiptNumber"
                      value={paymentFormData.receiptNumber}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, receiptNumber: e.target.value })}
                      placeholder="RCP123456"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={paymentFormData.notes}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddPaymentDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Record Payment</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="arrears">Arrears</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {invoices.map((invoice) => {
              const totalPaid = getTotalPaid(invoice.id);
              const outstanding = getOutstandingAmount(invoice);
              
              return (
                <Card key={invoice.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {getTenantName(invoice.tenantId)} - {invoice.month}
                      </CardTitle>
                      <Badge variant={getStatusBadgeVariant(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Property</p>
                        <p className="font-medium">{getPropertyName(invoice.propertyId)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Due Date</p>
                        <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="font-medium">{formatCurrency(invoice.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Outstanding</p>
                        <p className={`font-medium ${outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(outstanding)}
                        </p>
                      </div>
                    </div>
                    
                    {totalPaid > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-gray-600 mb-2">Payment History</p>
                        <div className="space-y-1">
                          {getInvoicePayments(invoice.id).map((payment) => (
                            <div key={payment.id} className="flex justify-between text-sm">
                              <span>{new Date(payment.paymentDate).toLocaleDateString()} - {payment.paymentMode}</span>
                              <span className="text-green-600">{formatCurrency(payment.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {invoices.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500 text-lg mb-4">No invoices found</p>
                <p className="text-gray-400 mb-6">Create your first rent invoice</p>
                <Button onClick={() => setIsAddInvoiceDialogOpen(true)}>
                  Create First Invoice
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {payments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Tenant</p>
                      <p className="font-medium">{getTenantName(payment.tenantId)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Property</p>
                      <p className="font-medium">{getPropertyName(payment.propertyId)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="font-medium text-green-600">{formatCurrency(payment.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment Date</p>
                      <p className="font-medium">{new Date(payment.paymentDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Mode</p>
                      <p className="font-medium capitalize">{payment.paymentMode.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600">Receipt: {payment.receiptNumber}</p>
                    {payment.notes && (
                      <p className="text-sm text-gray-500 mt-1">{payment.notes}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {payments.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500 text-lg mb-4">No payments recorded</p>
                <p className="text-gray-400 mb-6">Record your first payment</p>
                <Button onClick={() => setIsAddPaymentDialogOpen(true)}>
                  Record First Payment
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="arrears" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {invoices.filter(invoice => getOutstandingAmount(invoice) > 0).map((invoice) => {
              const outstanding = getOutstandingAmount(invoice);
              const daysOverdue = Math.max(0, Math.floor((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)));
              
              return (
                <Card key={invoice.id} className="border-red-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-red-700">
                        {getTenantName(invoice.tenantId)} - {invoice.month}
                      </CardTitle>
                      <Badge variant="destructive">
                        {daysOverdue} days overdue
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Property</p>
                        <p className="font-medium">{getPropertyName(invoice.propertyId)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Due Date</p>
                        <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="font-medium">{formatCurrency(invoice.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Outstanding</p>
                        <p className="font-bold text-red-600 text-lg">
                          {formatCurrency(outstanding)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {invoices.filter(invoice => getOutstandingAmount(invoice) > 0).length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-green-600 text-lg mb-4">🎉 No outstanding arrears!</p>
                <p className="text-gray-400">All rent payments are up to date</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RentPage;
