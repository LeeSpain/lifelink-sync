
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit, Plus, Package, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Extend Product with coming_soon_url
interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  description: string;
  features: string[];
  sku: string;
  inventory_count: number;
  weight: number;
  dimensions: any;
  compatibility: string[];
  status: string;
  sort_order: number;
  coming_soon_url?: string | null;
  category: {
    name: string;
  };
}

interface ProductCategory {
  id: string;
  name: string;
  description: string;
  icon_name: string;
}

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    features: '',
    sku: '',
    inventory_count: '',
    weight: '',
    category_id: '',
    compatibility: '',
    status: 'active',
    coming_soon_url: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:product_categories(name)
        `)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('status', 'active')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      description: product.description || '',
      features: product.features?.join('\n') || '',
      sku: product.sku || '',
      inventory_count: product.inventory_count?.toString() || '0',
      weight: product.weight?.toString() || '0',
      category_id: '', // Will be set based on category name
      compatibility: product.compatibility?.join(', ') || '',
      status: product.status,
      coming_soon_url: product.coming_soon_url || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleView = (product: Product) => {
    setSelectedProduct(product);
    setIsViewDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedProduct) return;

    const features = formData.features.split('\n').map(f => f.trim()).filter(Boolean);
    const compatibility = formData.compatibility.split(',').map(c => c.trim()).filter(Boolean);

    const { error } = await supabase
      .from('products')
      .update({
        name: formData.name,
        price: parseFloat(formData.price),
        description: formData.description,
        features,
        sku: formData.sku,
        inventory_count: parseInt(formData.inventory_count),
        weight: parseFloat(formData.weight),
        compatibility,
        status: formData.status,
        coming_soon_url: formData.coming_soon_url?.trim() ? formData.coming_soon_url.trim() : null,
      })
      .eq('id', selectedProduct.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Product updated successfully",
    });

    setIsEditDialogOpen(false);
    fetchProducts();
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product deleted successfully",
      });

      fetchProducts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const toggleStatus = async (productId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    try {
      const { error } = await supabase
        .from('products')
        .update({ status: newStatus })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Product ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
      });

      fetchProducts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update product status",
        variant: "destructive",
      });
    }
  };

  // Create Product
  const openAddDialog = () => {
    setFormData({
      name: '',
      price: '',
      description: '',
      features: '',
      sku: '',
      inventory_count: '0',
      weight: '0',
      category_id: '',
      compatibility: '',
      status: 'active',
      coming_soon_url: '',
    });
    setIsAddDialogOpen(true);
  };

  const handleCreate = async () => {
    const price = parseFloat(formData.price);
    if (Number.isNaN(price)) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid numeric price.",
        variant: "destructive",
      });
      return;
    }

    const features = formData.features.split('\n').map(f => f.trim()).filter(Boolean);
    const compatibility = formData.compatibility.split(',').map(c => c.trim()).filter(Boolean);

    const { error } = await supabase
      .from('products')
      .insert([
        {
          name: formData.name,
          price,
          description: formData.description,
          features,
          sku: formData.sku || null,
          inventory_count: parseInt(formData.inventory_count || '0'),
          weight: parseFloat(formData.weight || '0'),
          compatibility,
          status: formData.status,
          coming_soon_url: formData.coming_soon_url?.trim() ? formData.coming_soon_url.trim() : null,
          // currency defaults to EUR in DB, sort_order defaults to 0
        }
      ]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Product created successfully",
    });

    setIsAddDialogOpen(false);
    fetchProducts();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Management</h1>
          <p className="text-muted-foreground">
            Manage your Bluetooth pendant and other safety products
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Products
          </CardTitle>
          <CardDescription>
            Manage your product catalog including the LifeLink Sync Emergency Pendant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Inventory</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">{product.sku}</div>
                    </div>
                  </TableCell>
                  <TableCell>€{product.price.toFixed(2)}</TableCell>
                  <TableCell>{product.category?.name || 'Uncategorized'}</TableCell>
                  <TableCell>
                    <Badge variant={product.inventory_count > 10 ? "secondary" : "destructive"}>
                      {product.inventory_count} units
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStatus(product.id, product.status)}
                    >
                      <Badge variant={product.status === 'active' ? "default" : "secondary"}>
                        {product.status}
                      </Badge>
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(product)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information and settings
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (€)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="features">Features (one per line)</Label>
              <Textarea
                id="features"
                placeholder="Bluetooth connectivity&#10;Waterproof design&#10;Long battery life"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inventory">Inventory</Label>
                <Input
                  id="inventory"
                  type="number"
                  value={formData.inventory_count}
                  onChange={(e) => setFormData({ ...formData, inventory_count: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (g)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="compatibility">Compatible Plans (comma separated)</Label>
              <Input
                id="compatibility"
                placeholder="Basic Plan, Premium Plan, Enterprise Plan"
                value={formData.compatibility}
                onChange={(e) => setFormData({ ...formData, compatibility: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50 bg-background">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="coming_soon">Coming Soon</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comingSoonUrl">Coming Soon Link (URL)</Label>
              <Input
                id="comingSoonUrl"
                type="url"
                placeholder="https://example.com/learn-more"
                value={formData.coming_soon_url}
                onChange={(e) => setFormData({ ...formData, coming_soon_url: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                This link will be shown to users when the product status is set to Coming Soon.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
            <DialogDescription>
              Product details and specifications
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Price</Label>
                  <p>€{selectedProduct.price.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">SKU</Label>
                  <p>{selectedProduct.sku}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Features</Label>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  {selectedProduct.features?.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Inventory</Label>
                  <p>{selectedProduct.inventory_count} units</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Weight</Label>
                  <p>{selectedProduct.weight}g</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={selectedProduct.status === 'active' ? "default" : "secondary"}>
                    {selectedProduct.status}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Compatible Plans</Label>
                <div className="flex gap-2 mt-1">
                  {selectedProduct.compatibility?.map((plan, index) => (
                    <Badge key={index} variant="outline">{plan}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Coming Soon Link</Label>
                {selectedProduct.coming_soon_url ? (
                  <a
                    href={selectedProduct.coming_soon_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline break-all"
                  >
                    {selectedProduct.coming_soon_url}
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">None</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
            <DialogDescription>
              Create a new product entry
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-name">Product Name</Label>
                <Input
                  id="add-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-price">Price (€)</Label>
                <Input
                  id="add-price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-description">Description</Label>
              <Textarea
                id="add-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-features">Features (one per line)</Label>
              <Textarea
                id="add-features"
                placeholder="Bluetooth connectivity&#10;Waterproof design&#10;Long battery life"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-sku">SKU</Label>
                <Input
                  id="add-sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-inventory">Inventory</Label>
                <Input
                  id="add-inventory"
                  type="number"
                  value={formData.inventory_count}
                  onChange={(e) => setFormData({ ...formData, inventory_count: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-weight">Weight (g)</Label>
                <Input
                  id="add-weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-compatibility">Compatible Plans (comma separated)</Label>
              <Input
                id="add-compatibility"
                placeholder="Basic Plan, Premium Plan, Enterprise Plan"
                value={formData.compatibility}
                onChange={(e) => setFormData({ ...formData, compatibility: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50 bg-background">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="coming_soon">Coming Soon</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-comingSoonUrl">Coming Soon Link (URL)</Label>
              <Input
                id="add-comingSoonUrl"
                type="url"
                placeholder="https://example.com/learn-more"
                value={formData.coming_soon_url}
                onChange={(e) => setFormData({ ...formData, coming_soon_url: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                This link will be shown to users when the product status is set to Coming Soon.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsPage;
