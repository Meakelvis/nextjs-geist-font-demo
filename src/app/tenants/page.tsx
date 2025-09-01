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
  getTenants, 
  addTenant, 
  updateTenant, 
  deleteTenant,
  getAgreements,
  addAgreement,
  getProperties,
  updateProperty
} from "@/lib/storage";
import type { Tenant, TenancyAgreement, Property } from "@/types/rentals";

const TenantsPage = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [agreements, setAgreements] = useState<TenancyAgreement[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isAddTenantDialogOpen, setIsAddTenantDialogOpen] = useState(false);
  const [isAddAgreementDialogOpen, setIsAddAgreementDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  
  const [tenantFormData, setTenantFormData] = useState({
    name: "",
    idPassport: "",
    phone: "",
    email: "",
    nextOfKinName: "",
    nextOfKinPhone: "",
    nextOfKinRelationship: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  const [agreementFormData, setAgreementFormData] = useState({
    tenantId: "",
    propertyId: "",
    startDate: "",
    endDate: "",
    securityDeposit: "",
    rentAmount: "",
    rentTerms: "monthly" as "monthly" | "quarterly" | "yearly",
    moveInDate: "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTenants(getTenants());
    setAgreements(getAgreements());
    setProperties(getProperties());
  };

  const resetTenantForm = () => {
    setTenantFormData({
      name: "",
      idPassport: "",
      phone: "",
      email: "",
      nextOfKinName: "",
      nextOfKinPhone: "",
      nextOfKinRelationship: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
    });
    setError("");
    setEditingTenant(null);
  };

  const resetAgreementForm = () => {
    setAgreementFormData({
      tenantId: "",
      propertyId: "",
      startDate: "",
      endDate: "",
      securityDeposit: "",
      rentAmount: "",
      rentTerms: "monthly",
      moveInDate: "",
    });
    setError("");
  };

  const handleTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!tenantFormData.name || !tenantFormData.idPassport || !tenantFormData.phone) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      if (editingTenant) {
        // Update existing tenant
        const updated = updateTenant(editingTenant.id, {
          name: tenantFormData.name,
          idPassport: tenantFormData.idPassport,
          phone: tenantFormData.phone,
          email: tenantFormData.email || undefined,
          nextOfKin: {
            name: tenantFormData.nextOfKinName,
            phone: tenantFormData.nextOfKinPhone,
            relationship: tenantFormData.nextOfKinRelationship,
          },
          emergencyContact: {
            name: tenantFormData.emergencyContactName,
            phone: tenantFormData.emergencyContactPhone,
          },
        });

        if (updated) {
          loadData();
          setIsAddTenantDialogOpen(false);
          resetTenantForm();
        } else {
          setError("Failed to update tenant");
        }
      } else {
        // Add new tenant
        addTenant({
          name: tenantFormData.name,
          idPassport: tenantFormData.idPassport,
          phone: tenantFormData.phone,
          email: tenantFormData.email || undefined,
          nextOfKin: {
            name: tenantFormData.nextOfKinName,
            phone: tenantFormData.nextOfKinPhone,
            relationship: tenantFormData.nextOfKinRelationship,
          },
          emergencyContact: {
            name: tenantFormData.emergencyContactName,
            phone: tenantFormData.emergencyContactPhone,
          },
        });

        loadData();
        setIsAddTenantDialogOpen(false);
        resetTenantForm();
      }
    } catch (err) {
      setError("An error occurred while saving the tenant");
    }
  };

  const handleAgreementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!agreementFormData.tenantId || !agreementFormData.propertyId || 
        !agreementFormData.startDate || !agreementFormData.endDate || 
        !agreementFormData.securityDeposit || !agreementFormData.rentAmount) {
      setError("Please fill in all required fields");
      return;
    }

    const securityDeposit = parseFloat(agreementFormData.securityDeposit);
    const rentAmount = parseFloat(agreementFormData.rentAmount);

    if (isNaN(securityDeposit) || securityDeposit < 0) {
      setError("Security deposit must be a valid number");
      return;
    }

    if (isNaN(rentAmount) || rentAmount <= 0) {
      setError("Rent amount must be a valid positive number");
      return;
    }

    try {
      addAgreement({
        tenantId: agreementFormData.tenantId,
        propertyId: agreementFormData.propertyId,
        startDate: agreementFormData.startDate,
        endDate: agreementFormData.endDate,
        securityDeposit,
        rentAmount,
        rentTerms: agreementFormData.rentTerms,
        status: "active",
        moveInDate: agreementFormData.moveInDate || undefined,
      });

      // Update property status to occupied
      const property = properties.find(p => p.id === agreementFormData.propertyId);
      if (property) {
        updateProperty(property.id, { status: "occupied" });
      }

      loadData();
      setIsAddAgreementDialogOpen(false);
      resetAgreementForm();
    } catch (err) {
      setError("An error occurred while creating the agreement");
    }
  };

  const handleEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setTenantFormData({
      name: tenant.name,
      idPassport: tenant.idPassport,
      phone: tenant.phone,
      email: tenant.email || "",
      nextOfKinName: tenant.nextOfKin.name,
      nextOfKinPhone: tenant.nextOfKin.phone,
      nextOfKinRelationship: tenant.nextOfKin.relationship,
      emergencyContactName: tenant.emergencyContact.name,
      emergencyContactPhone: tenant.emergencyContact.phone,
    });
    setIsAddTenantDialogOpen(true);
  };

  const handleDeleteTenant = (id: string) => {
    if (window.confirm("Are you sure you want to delete this tenant?")) {
      deleteTenant(id);
      loadData();
    }
  };

  const getTenantAgreements = (tenantId: string) => {
    return agreements.filter(agreement => agreement.tenantId === tenantId);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Tenants</h1>
        <div className="space-x-2">
          <Dialog open={isAddTenantDialogOpen} onOpenChange={setIsAddTenantDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetTenantForm}>Add Tenant</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingTenant ? "Edit Tenant" : "Add New Tenant"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleTenantSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={tenantFormData.name}
                      onChange={(e) => setTenantFormData({ ...tenantFormData, name: e.target.value })}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="idPassport">ID/Passport *</Label>
                    <Input
                      id="idPassport"
                      value={tenantFormData.idPassport}
                      onChange={(e) => setTenantFormData({ ...tenantFormData, idPassport: e.target.value })}
                      placeholder="CM12345678"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={tenantFormData.phone}
                      onChange={(e) => setTenantFormData({ ...tenantFormData, phone: e.target.value })}
                      placeholder="+256700000000"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={tenantFormData.email}
                      onChange={(e) => setTenantFormData({ ...tenantFormData, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Next of Kin</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nextOfKinName">Name</Label>
                      <Input
                        id="nextOfKinName"
                        value={tenantFormData.nextOfKinName}
                        onChange={(e) => setTenantFormData({ ...tenantFormData, nextOfKinName: e.target.value })}
                        placeholder="Jane Doe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nextOfKinPhone">Phone</Label>
                      <Input
                        id="nextOfKinPhone"
                        value={tenantFormData.nextOfKinPhone}
                        onChange={(e) => setTenantFormData({ ...tenantFormData, nextOfKinPhone: e.target.value })}
                        placeholder="+256700000001"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="nextOfKinRelationship">Relationship</Label>
                    <Input
                      id="nextOfKinRelationship"
                      value={tenantFormData.nextOfKinRelationship}
                      onChange={(e) => setTenantFormData({ ...tenantFormData, nextOfKinRelationship: e.target.value })}
                      placeholder="Sister"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Emergency Contact</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergencyContactName">Name</Label>
                      <Input
                        id="emergencyContactName"
                        value={tenantFormData.emergencyContactName}
                        onChange={(e) => setTenantFormData({ ...tenantFormData, emergencyContactName: e.target.value })}
                        placeholder="Emergency Contact"
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergencyContactPhone">Phone</Label>
                      <Input
                        id="emergencyContactPhone"
                        value={tenantFormData.emergencyContactPhone}
                        onChange={(e) => setTenantFormData({ ...tenantFormData, emergencyContactPhone: e.target.value })}
                        placeholder="+256700000002"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddTenantDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingTenant ? "Update Tenant" : "Add Tenant"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddAgreementDialogOpen} onOpenChange={setIsAddAgreementDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={resetAgreementForm}>Create Agreement</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Tenancy Agreement</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAgreementSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tenantSelect">Tenant *</Label>
                    <Select value={agreementFormData.tenantId} onValueChange={(value) => setAgreementFormData({ ...agreementFormData, tenantId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tenant" />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="propertySelect">Property *</Label>
                    <Select value={agreementFormData.propertyId} onValueChange={(value) => setAgreementFormData({ ...agreementFormData, propertyId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.filter(p => p.status === "vacant").map((property) => (
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
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={agreementFormData.startDate}
                      onChange={(e) => setAgreementFormData({ ...agreementFormData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={agreementFormData.endDate}
                      onChange={(e) => setAgreementFormData({ ...agreementFormData, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="securityDeposit">Security Deposit (UGX) *</Label>
                    <Input
                      id="securityDeposit"
                      type="number"
                      value={agreementFormData.securityDeposit}
                      onChange={(e) => setAgreementFormData({ ...agreementFormData, securityDeposit: e.target.value })}
                      placeholder="800000"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="rentAmount">Monthly Rent (UGX) *</Label>
                    <Input
                      id="rentAmount"
                      type="number"
                      value={agreementFormData.rentAmount}
                      onChange={(e) => setAgreementFormData({ ...agreementFormData, rentAmount: e.target.value })}
                      placeholder="800000"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rentTerms">Rent Terms</Label>
                    <Select value={agreementFormData.rentTerms} onValueChange={(value: "monthly" | "quarterly" | "yearly") => setAgreementFormData({ ...agreementFormData, rentTerms: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="moveInDate">Move-in Date</Label>
                    <Input
                      id="moveInDate"
                      type="date"
                      value={agreementFormData.moveInDate}
                      onChange={(e) => setAgreementFormData({ ...agreementFormData, moveInDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddAgreementDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Agreement</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tenants List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tenants.map((tenant) => {
          const tenantAgreements = getTenantAgreements(tenant.id);
          const activeAgreement = tenantAgreements.find(a => a.status === "active");
          
          return (
            <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{tenant.name}</CardTitle>
                  <Badge variant={activeAgreement ? "default" : "secondary"}>
                    {activeAgreement ? "Active" : "No Agreement"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">ID/Passport</p>
                  <p className="font-medium">{tenant.idPassport}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{tenant.phone}</p>
                </div>

                {tenant.email && (
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{tenant.email}</p>
                  </div>
                )}

                {activeAgreement && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600 mb-1">Current Property</p>
                    <p className="font-medium">{getPropertyName(activeAgreement.propertyId)}</p>
                    <p className="text-sm text-green-600 font-medium">
                      {formatCurrency(activeAgreement.rentAmount)}/month
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600 mb-1">Next of Kin</p>
                  <p className="text-sm">{tenant.nextOfKin.name} ({tenant.nextOfKin.relationship})</p>
                  <p className="text-sm text-gray-500">{tenant.nextOfKin.phone}</p>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" size="sm" onClick={() => handleEditTenant(tenant)}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteTenant(tenant.id)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {tenants.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No tenants found</p>
            <p className="text-gray-400 mb-6">Get started by adding your first tenant</p>
            <Button onClick={() => setIsAddTenantDialogOpen(true)}>
              Add Your First Tenant
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TenantsPage;
