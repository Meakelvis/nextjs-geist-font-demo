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
import { getProperties, addProperty, updateProperty, deleteProperty } from "@/lib/storage";
import type { Property } from "@/types/rentals";

const PropertiesPage = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState({
    houseNumber: "",
    location: "",
    type: "",
    size: "",
    rentRate: "",
    status: "vacant" as "occupied" | "vacant",
    electricityMeter: "",
    waterAccount: "",
    billingType: "postpaid" as "prepaid" | "postpaid",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = () => {
    const data = getProperties();
    setProperties(data);
  };

  const resetForm = () => {
    setFormData({
      houseNumber: "",
      location: "",
      type: "",
      size: "",
      rentRate: "",
      status: "vacant",
      electricityMeter: "",
      waterAccount: "",
      billingType: "postpaid",
    });
    setError("");
    setEditingProperty(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.houseNumber || !formData.location || !formData.type || !formData.size || !formData.rentRate) {
      setError("Please fill in all required fields");
      return;
    }

    const size = parseInt(formData.size);
    const rentRate = parseFloat(formData.rentRate);

    if (isNaN(size) || size <= 0) {
      setError("Size must be a valid positive number");
      return;
    }

    if (isNaN(rentRate) || rentRate <= 0) {
      setError("Rent rate must be a valid positive number");
      return;
    }

    try {
      if (editingProperty) {
        // Update existing property
        const updated = updateProperty(editingProperty.id, {
          houseNumber: formData.houseNumber,
          location: formData.location,
          type: formData.type,
          size,
          rentRate,
          status: formData.status,
          utilities: {
            electricityMeter: formData.electricityMeter,
            waterAccount: formData.waterAccount,
            billingType: formData.billingType,
          },
        });

        if (updated) {
          loadProperties();
          setIsAddDialogOpen(false);
          resetForm();
        } else {
          setError("Failed to update property");
        }
      } else {
        // Add new property
        addProperty({
          houseNumber: formData.houseNumber,
          location: formData.location,
          type: formData.type,
          size,
          rentRate,
          status: formData.status,
          utilities: {
            electricityMeter: formData.electricityMeter,
            waterAccount: formData.waterAccount,
            billingType: formData.billingType,
          },
        });

        loadProperties();
        setIsAddDialogOpen(false);
        resetForm();
      }
    } catch (err) {
      setError("An error occurred while saving the property");
    }
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setFormData({
      houseNumber: property.houseNumber,
      location: property.location,
      type: property.type,
      size: property.size.toString(),
      rentRate: property.rentRate.toString(),
      status: property.status,
      electricityMeter: property.utilities?.electricityMeter || "",
      waterAccount: property.utilities?.waterAccount || "",
      billingType: property.utilities?.billingType || "postpaid",
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this property?")) {
      deleteProperty(id);
      loadProperties();
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>Add Property</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProperty ? "Edit Property" : "Add New Property"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="houseNumber">House Number *</Label>
                  <Input
                    id="houseNumber"
                    value={formData.houseNumber}
                    onChange={(e) => setFormData({ ...formData, houseNumber: e.target.value })}
                    placeholder="e.g., A001"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Kampala Central"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Property Type *</Label>
                  <Input
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    placeholder="e.g., Apartment, House"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="size">Size (Bedrooms) *</Label>
                  <Input
                    id="size"
                    type="number"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    placeholder="e.g., 2"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rentRate">Monthly Rent (UGX) *</Label>
                  <Input
                    id="rentRate"
                    type="number"
                    value={formData.rentRate}
                    onChange={(e) => setFormData({ ...formData, rentRate: e.target.value })}
                    placeholder="e.g., 800000"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: "occupied" | "vacant") => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vacant">Vacant</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Utilities Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="electricityMeter">Electricity Meter</Label>
                    <Input
                      id="electricityMeter"
                      value={formData.electricityMeter}
                      onChange={(e) => setFormData({ ...formData, electricityMeter: e.target.value })}
                      placeholder="e.g., EM001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="waterAccount">Water Account</Label>
                    <Input
                      id="waterAccount"
                      value={formData.waterAccount}
                      onChange={(e) => setFormData({ ...formData, waterAccount: e.target.value })}
                      placeholder="e.g., WA001"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="billingType">Billing Type</Label>
                  <Select value={formData.billingType} onValueChange={(value: "prepaid" | "postpaid") => setFormData({ ...formData, billingType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prepaid">Prepaid</SelectItem>
                      <SelectItem value="postpaid">Postpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingProperty ? "Update Property" : "Add Property"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <Card key={property.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{property.houseNumber}</CardTitle>
                <Badge variant={property.status === "occupied" ? "default" : "secondary"}>
                  {property.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-medium">{property.location}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium">{property.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Size</p>
                  <p className="font-medium">{property.size} BR</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Monthly Rent</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(property.rentRate)}
                </p>
              </div>

              {property.utilities && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600 mb-1">Utilities</p>
                  <div className="text-sm space-y-1">
                    {property.utilities.electricityMeter && (
                      <p>⚡ {property.utilities.electricityMeter}</p>
                    )}
                    {property.utilities.waterAccount && (
                      <p>💧 {property.utilities.waterAccount}</p>
                    )}
                    <p>📋 {property.utilities.billingType}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" size="sm" onClick={() => handleEdit(property)}>
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(property.id)}>
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {properties.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No properties found</p>
            <p className="text-gray-400 mb-6">Get started by adding your first property</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              Add Your First Property
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PropertiesPage;
