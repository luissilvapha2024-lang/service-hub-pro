import { useState } from 'react';
import { Plus, Search, Download, Upload, FileDown, Package, Edit, Trash2, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useProducts, Product } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { exportToCSV, formatCurrencyForExport } from '@/utils/exportCSV';
import { TableSkeleton } from '@/components/ui/page-skeleton';

export default function Produtos() {
  const { products, isLoading, createProduct, updateProduct, deleteProduct } = useProducts();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<Product | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    cost: '',
    stock: '',
    min_stock: '5',
    is_active: true,
  });

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const lowStockProducts = products.filter(p => p.stock <= p.min_stock && p.is_active);

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      description: '',
      price: '',
      cost: '',
      stock: '',
      min_stock: '5',
      is_active: true,
    });
    setEditingProduct(null);
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        sku: product.sku || '',
        description: product.description || '',
        price: product.price.toString(),
        cost: product.cost.toString(),
        stock: product.stock.toString(),
        min_stock: product.min_stock.toString(),
        is_active: product.is_active,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name.trim(),
      sku: formData.sku.trim() || null,
      description: formData.description.trim() || null,
      price: parseFloat(formData.price) || 0,
      cost: parseFloat(formData.cost) || 0,
      stock: parseInt(formData.stock) || 0,
      min_stock: parseInt(formData.min_stock) || 5,
      is_active: formData.is_active,
    };

    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct.id, ...data }, { onSuccess: handleCloseDialog });
    } else {
      createProduct.mutate(data, { onSuccess: handleCloseDialog });
    }
  };

  const handleOpenStockDialog = (product: Product) => {
    setStockAdjustProduct(product);
    setStockAdjustment(0);
    setIsStockDialogOpen(true);
  };

  const handleStockAdjustment = () => {
    if (!stockAdjustProduct) return;
    const newStock = stockAdjustProduct.stock + stockAdjustment;
    if (newStock < 0) {
      toast({
        title: 'Erro',
        description: 'O estoque não pode ficar negativo.',
        variant: 'destructive',
      });
      return;
    }
    updateProduct.mutate(
      { id: stockAdjustProduct.id, stock: newStock },
      {
        onSuccess: () => {
          setIsStockDialogOpen(false);
          setStockAdjustProduct(null);
          setStockAdjustment(0);
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este produto?')) {
      deleteProduct.mutate(id);
    }
  };

  const toggleAtivo = (product: Product) => {
    updateProduct.mutate({ id: product.id, is_active: !product.is_active });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Nome', 'SKU', 'Descrição', 'Preço', 'Custo', 'Estoque', 'Estoque Mínimo', 'Ativo'];
    const data = products.map((p) => [
      p.name,
      p.sku || '',
      p.description || '',
      formatCurrencyForExport(p.price),
      formatCurrencyForExport(p.cost),
      p.stock,
      p.min_stock,
      p.is_active ? 'Sim' : 'Não',
    ]);
    exportToCSV({ filename: `produtos_${new Date().toISOString().split('T')[0]}`, headers, data });
    toast({ title: 'Exportado', description: 'Produtos exportados com sucesso.' });
  };

  // CSV Template Download
  const handleDownloadTemplate = () => {
    const headers = ['Nome', 'SKU', 'Descrição', 'Preço', 'Custo', 'Estoque', 'Estoque Mínimo'];
    const exampleData = [
      ['Capinha Silicone', 'CAP-001', 'Capinha de silicone universal', '25,00', '10,00', '50', '10'],
      ['Carregador USB-C', 'CAR-001', 'Carregador rápido 20W', '65,00', '30,00', '30', '5'],
    ];
    exportToCSV({ filename: 'modelo_produtos', headers, data: exampleData });
    toast({ title: 'Download', description: 'Modelo de CSV baixado com sucesso.' });
  };

  // CSV Import
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter((line) => line.trim());
        
        if (lines.length < 2) {
          toast({ title: 'Erro', description: 'O arquivo CSV está vazio ou inválido.', variant: 'destructive' });
          return;
        }

        const dataLines = lines.slice(1); // Skip header
        let successCount = 0;
        let errorCount = 0;

        for (const line of dataLines) {
          const values = line.split(';').map((v) => v.trim().replace(/^"|"$/g, ''));
          if (values.length < 5) continue;

          const [name, sku, description, priceStr, costStr, stockStr, minStockStr] = values;
          
          if (!name) continue;

          const price = parseFloat(priceStr?.replace(',', '.') || '0');
          const cost = parseFloat(costStr?.replace(',', '.') || '0');
          const stock = parseInt(stockStr || '0');
          const min_stock = parseInt(minStockStr || '5');

          try {
            await new Promise<void>((resolve, reject) => {
              createProduct.mutate(
                { name, sku: sku || null, description: description || null, price, cost, stock, min_stock, is_active: true },
                { onSuccess: () => resolve(), onError: () => reject() }
              );
            });
            successCount++;
          } catch {
            errorCount++;
          }
        }

        setIsImportDialogOpen(false);
        toast({
          title: 'Importação concluída',
          description: `${successCount} produtos importados${errorCount > 0 ? `, ${errorCount} erros` : ''}.`,
        });
      } catch {
        toast({ title: 'Erro', description: 'Erro ao processar o arquivo CSV.', variant: 'destructive' });
      }
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Produtos</h1>
          <p className="text-muted-foreground">Gerencie o estoque de produtos</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
            <FileDown className="w-4 h-4 mr-2" />
            Modelo CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <Card className="border-warning bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-warning">
              <AlertTriangle className="w-4 h-4" />
              Estoque Baixo ({lowStockProducts.length} produtos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockProducts.slice(0, 5).map((p) => (
                <Badge key={p.id} variant="outline" className="border-warning text-warning">
                  {p.name} ({p.stock}/{p.min_stock})
                </Badge>
              ))}
              {lowStockProducts.length > 5 && (
                <Badge variant="outline" className="border-warning text-warning">
                  +{lowStockProducts.length - 5} mais
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Lista de Produtos ({filteredProducts.length})
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum produto encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-center">Estoque</TableHead>
                  <TableHead className="text-center">Ativo</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-xs">{product.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{product.sku || '-'}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatCurrency(product.cost)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(product.price)}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={product.stock <= product.min_stock ? 'destructive' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => handleOpenStockDialog(product)}
                      >
                        {product.stock}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch checked={product.is_active} onCheckedChange={() => toggleAtivo(product)} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border">
                          <DropdownMenuItem onClick={() => handleOpenStockDialog(product)}>
                            <Package className="w-4 h-4 mr-2" />
                            Ajustar Estoque
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenDialog(product)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(product.id)} className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Product Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Ativo</Label>
              </div>
              <div>
                <Label htmlFor="cost">Custo (R$)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="price">Preço (R$) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="stock">Estoque</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="min_stock">Estoque Mínimo</Label>
                <Input
                  id="min_stock"
                  type="number"
                  min="0"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
                {(createProduct.isPending || updateProduct.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingProduct ? 'Salvar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Ajustar Estoque</DialogTitle>
          </DialogHeader>
          {stockAdjustProduct && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="font-medium">{stockAdjustProduct.name}</p>
                <p className="text-sm text-muted-foreground">Estoque atual: {stockAdjustProduct.stock}</p>
              </div>
              <div>
                <Label>Ajuste (+ para entrada, - para saída)</Label>
                <Input
                  type="number"
                  value={stockAdjustment}
                  onChange={(e) => setStockAdjustment(parseInt(e.target.value) || 0)}
                  className="text-center text-lg"
                />
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Novo estoque</p>
                <p className="text-2xl font-bold">{stockAdjustProduct.stock + stockAdjustment}</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsStockDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleStockAdjustment} disabled={updateProduct.isPending}>
                  {updateProduct.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Confirmar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Produtos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione um arquivo CSV com os produtos. O arquivo deve conter as colunas: Nome, SKU, Descrição, Preço,
              Custo, Estoque, Estoque Mínimo (separados por ponto e vírgula).
            </p>
            <Button variant="outline" className="w-full" onClick={handleDownloadTemplate}>
              <FileDown className="w-4 h-4 mr-2" />
              Baixar Modelo CSV
            </Button>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" id="csv-import" />
              <label htmlFor="csv-import" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Clique para selecionar o arquivo CSV</p>
              </label>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
