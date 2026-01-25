import { useState } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, QrCode, Receipt, Loader2, User, X, Package, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProducts } from '@/hooks/useProducts';
import { useServices } from '@/hooks/useServices';
import { useSales } from '@/hooks/useSales';
import { useClients } from '@/hooks/useClients';
import { useAuth } from '@/contexts/AuthContext';
import { printReceipt } from '@/utils/printReceipt';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'product' | 'service';
}

export default function PDV() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [splitPayment, setSplitPayment] = useState(false);
  const [secondPaymentMethod, setSecondPaymentMethod] = useState<string>('');
  const [firstPaymentAmount, setFirstPaymentAmount] = useState<number>(0);
  const [discount, setDiscount] = useState(0);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [isClientPopoverOpen, setIsClientPopoverOpen] = useState(false);

  const { products, isLoading: productsLoading } = useProducts();
  const { services, isLoading: servicesLoading } = useServices();
  const { createSale } = useSales();
  const { clients } = useClients();
  const { profile } = useAuth();

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.phone.includes(clientSearch)
  );

  const filteredProdutos = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredServicos = services.filter(
    (s) => s.is_active && s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (item: { id: string; name: string; price: number }, type: 'product' | 'service') => {
    const existingItem = cart.find((c) => c.id === item.id && c.type === type);

    if (existingItem) {
      setCart(
        cart.map((c) =>
          c.id === item.id && c.type === type
            ? { ...c, quantity: c.quantity + 1 }
            : c
        )
      );
    } else {
      setCart([
        ...cart,
        { id: item.id, name: item.name, price: item.price, quantity: 1, type },
      ]);
    }
  };

  const updateQuantity = (id: string, type: 'product' | 'service', delta: number) => {
    setCart(
      cart
        .map((c) =>
          c.id === id && c.type === type
            ? { ...c, quantity: Math.max(0, c.quantity + delta) }
            : c
        )
        .filter((c) => c.quantity > 0)
    );
  };

  const removeFromCart = (id: string, type: 'product' | 'service') => {
    setCart(cart.filter((c) => !(c.id === id && c.type === type)));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal - discountAmount;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleCheckout = () => {
    if (!paymentMethod) return;
    if (splitPayment && (!secondPaymentMethod || firstPaymentAmount <= 0 || firstPaymentAmount >= total)) return;

    const paymentMethodLabel = splitPayment 
      ? `${paymentMethod} (${formatCurrency(firstPaymentAmount)}) + ${secondPaymentMethod} (${formatCurrency(total - firstPaymentAmount)})`
      : paymentMethod;

    // Store cart data for printing before clearing
    const cartItems = [...cart];
    const saleSubtotal = subtotal;
    const saleDiscount = discountAmount;
    const saleTotal = total;
    const clientName = selectedClient?.name;

    createSale.mutate({
      sale: {
        subtotal,
        discount: discountAmount,
        total,
        payment_method: paymentMethodLabel,
        client_id: selectedClientId,
      },
      items: cart.map((item) => ({
        product_id: item.type === 'product' ? item.id : null,
        service_id: item.type === 'service' ? item.id : null,
        item_type: item.type,
        item_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      })),
    }, {
      onSuccess: (saleData) => {
        // Print receipt automatically
        printReceipt({
          saleNumber: saleData.sale_number,
          date: new Date(saleData.created_at),
          items: cartItems.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            type: item.type,
          })),
          subtotal: saleSubtotal,
          discount: saleDiscount,
          total: saleTotal,
          paymentMethod: paymentMethodLabel,
          clientName,
          companyName: profile?.company_name || undefined,
          companyPhone: profile?.company_phone || undefined,
          companyAddress: profile?.company_address || undefined,
        });
      },
    });

    setCart([]);
    setDiscount(0);
    setPaymentMethod('');
    setSecondPaymentMethod('');
    setSplitPayment(false);
    setFirstPaymentAmount(0);
    setSelectedClientId(null);
    setClientSearch('');
  };

  const paymentMethods = [
    { id: 'dinheiro', label: 'Dinheiro', icon: Banknote },
    { id: 'pix', label: 'PIX', icon: QrCode },
    { id: 'credito', label: 'Crédito', icon: CreditCard },
    { id: 'debito', label: 'Débito', icon: CreditCard },
  ];

  const isLoading = productsLoading || servicesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const PanelHeader = ({ children, icon: Icon }: { children: React.ReactNode; icon?: React.ElementType }) => (
    <div className="bg-primary px-4 py-2 rounded-t-lg">
      <h3 className="text-primary-foreground font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {children}
      </h3>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] animate-fade-in">
      {/* Header */}
      <div className="bg-primary rounded-lg px-6 py-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-6 h-6 text-primary-foreground" />
          <h1 className="text-xl font-bold text-primary-foreground uppercase tracking-wider">
            Checkout - PDV
          </h1>
        </div>
        <div className="text-primary-foreground/80 text-sm">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left Column - Search and Products */}
        <div className="flex flex-col gap-4 w-80">
          {/* Search Panel */}
          <div className="bg-card border rounded-lg shadow-soft overflow-hidden">
            <PanelHeader icon={Search}>Buscar</PanelHeader>
            <div className="p-3">
              <Input
                placeholder="Código ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-accent/30 border-0"
              />
            </div>
          </div>

          {/* Client Panel */}
          <div className="bg-card border rounded-lg shadow-soft overflow-hidden">
            <PanelHeader icon={User}>Cliente</PanelHeader>
            <div className="p-3">
              <Popover open={isClientPopoverOpen} onOpenChange={setIsClientPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-accent/30 border-0"
                  >
                    {selectedClient ? (
                      <span className="truncate">{selectedClient.name}</span>
                    ) : (
                      <span className="text-muted-foreground">Selecionar cliente...</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0" align="start">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Buscar cliente..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="max-h-48 overflow-auto">
                    {filteredClients.length === 0 ? (
                      <p className="p-3 text-sm text-muted-foreground text-center">
                        Nenhum cliente encontrado
                      </p>
                    ) : (
                      filteredClients.map((client) => (
                        <button
                          key={client.id}
                          onClick={() => {
                            setSelectedClientId(client.id);
                            setClientSearch('');
                            setIsClientPopoverOpen(false);
                          }}
                          className={cn(
                            'w-full px-3 py-2 text-left hover:bg-muted transition-colors',
                            selectedClientId === client.id && 'bg-primary/10'
                          )}
                        >
                          <p className="font-medium text-sm">{client.name}</p>
                          <p className="text-xs text-muted-foreground">{client.phone}</p>
                        </button>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {selectedClient && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 text-xs text-muted-foreground h-7"
                  onClick={() => setSelectedClientId(null)}
                >
                  <X className="w-3 h-3 mr-1" />
                  Remover
                </Button>
              )}
            </div>
          </div>

          {/* Tabs for Products/Services */}
          <div className="bg-card border rounded-lg shadow-soft overflow-hidden flex-1 flex flex-col min-h-0">
            <Tabs defaultValue="produtos" className="flex flex-col flex-1">
              <div className="bg-primary/90 px-2 pt-2">
                <TabsList className="grid w-full grid-cols-2 bg-primary/50 h-8">
                  <TabsTrigger value="produtos" className="text-xs data-[state=active]:bg-card data-[state=active]:text-foreground text-primary-foreground/80">
                    <Package className="w-3 h-3 mr-1" />
                    Produtos
                  </TabsTrigger>
                  <TabsTrigger value="servicos" className="text-xs data-[state=active]:bg-card data-[state=active]:text-foreground text-primary-foreground/80">
                    <Wrench className="w-3 h-3 mr-1" />
                    Serviços
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="produtos" className="flex-1 overflow-auto p-2 m-0">
                {filteredProdutos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhum produto
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredProdutos.map((produto) => (
                      <button
                        key={produto.id}
                        onClick={() => addToCart({ id: produto.id, name: produto.name, price: Number(produto.price) }, 'product')}
                        className="w-full bg-accent/30 hover:bg-accent/60 rounded-md p-2 text-left transition-all flex items-center justify-between"
                      >
                        <span className="font-medium text-foreground text-sm truncate flex-1">
                          {produto.name}
                        </span>
                        <span className="text-primary font-bold text-sm ml-2">
                          {formatCurrency(Number(produto.price))}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="servicos" className="flex-1 overflow-auto p-2 m-0">
                {filteredServicos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhum serviço
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredServicos.map((servico) => (
                      <button
                        key={servico.id}
                        onClick={() => addToCart({ id: servico.id, name: servico.name, price: Number(servico.price) }, 'service')}
                        className="w-full bg-accent/30 hover:bg-accent/60 rounded-md p-2 text-left transition-all flex items-center justify-between"
                      >
                        <span className="font-medium text-foreground text-sm truncate flex-1">
                          {servico.name}
                        </span>
                        <span className="text-primary font-bold text-sm ml-2">
                          {formatCurrency(Number(servico.price))}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Center - Product List / Cart Items */}
        <div className="flex-1 bg-card border rounded-lg shadow-soft overflow-hidden flex flex-col min-h-0">
          <PanelHeader icon={ShoppingCart}>Lista de Itens</PanelHeader>
          
          {/* Table Header */}
          <div className="bg-primary/20 px-4 py-2 grid grid-cols-12 gap-2 text-xs font-semibold text-foreground border-b">
            <span className="col-span-1">#</span>
            <span className="col-span-5">Descrição</span>
            <span className="col-span-2 text-center">Qtd</span>
            <span className="col-span-2 text-right">Vlr. Unit</span>
            <span className="col-span-2 text-right">Total</span>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                <ShoppingCart className="w-16 h-16 mb-3 opacity-30" />
                <p className="text-sm">Nenhum item adicionado</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {cart.map((item, index) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="px-4 py-2 grid grid-cols-12 gap-2 items-center hover:bg-muted/30 transition-colors"
                  >
                    <span className="col-span-1 text-sm text-muted-foreground">{index + 1}</span>
                    <div className="col-span-5">
                      <p className="font-medium text-sm text-foreground truncate">{item.name}</p>
                      <span className="text-xs text-muted-foreground capitalize">{item.type === 'product' ? 'Produto' : 'Serviço'}</span>
                    </div>
                    <div className="col-span-2 flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => updateQuantity(item.id, item.type, -1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => updateQuantity(item.id, item.type, 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <span className="col-span-2 text-right text-sm">{formatCurrency(item.price)}</span>
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <span className="font-bold text-sm text-primary">{formatCurrency(item.price * item.quantity)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => removeFromCart(item.id, item.type)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subtotal Footer */}
          <div className="border-t bg-primary/10 p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-foreground uppercase">Subtotal</span>
              <span className="text-2xl font-bold text-primary">{formatCurrency(subtotal)}</span>
            </div>
          </div>
        </div>

        {/* Right Column - Payment */}
        <div className="w-72 flex flex-col gap-4">
          {/* Payment Method */}
          <div className="bg-card border rounded-lg shadow-soft overflow-hidden flex-1">
            <PanelHeader icon={CreditCard}>Pagamento</PanelHeader>
            <div className="p-3 space-y-3">
              {/* Payment Grid */}
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.label)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all text-xs',
                      paymentMethod === method.label
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-transparent bg-accent/30 hover:bg-accent/60'
                    )}
                  >
                    <method.icon className="w-4 h-4" />
                    <span className="font-medium">{method.label}</span>
                  </button>
                ))}
              </div>

              {/* Discount + Split Row */}
              <div className="flex items-center gap-3 pt-2 border-t">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Desc:</span>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="bg-accent/30 border-0 text-center font-bold h-7 w-14 text-xs"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
                <label className="flex items-center gap-1 cursor-pointer ml-auto">
                  <input
                    type="checkbox"
                    checked={splitPayment}
                    onChange={(e) => {
                      setSplitPayment(e.target.checked);
                      if (e.target.checked) {
                        setFirstPaymentAmount(Math.floor(total / 2 * 100) / 100);
                      } else {
                        setSecondPaymentMethod('');
                        setFirstPaymentAmount(0);
                      }
                    }}
                    className="h-3 w-3 rounded border-border accent-primary"
                  />
                  <span className="text-xs text-muted-foreground">Dividir</span>
                </label>
              </div>

              {/* Split Payment Details - Compact */}
              {splitPayment && (
                <div className="bg-muted/50 rounded-md p-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">1ª:</span>
                    <Input
                      type="number"
                      min="0.01"
                      max={total - 0.01}
                      step="0.01"
                      value={firstPaymentAmount}
                      onChange={(e) => setFirstPaymentAmount(Number(e.target.value))}
                      className="bg-card border-0 text-center font-bold h-6 text-xs flex-1"
                    />
                    <span className="text-xs text-muted-foreground">= {formatCurrency(total - firstPaymentAmount)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground mb-1 block">2ª Forma:</span>
                    <div className="grid grid-cols-2 gap-1">
                      {paymentMethods.map((method) => (
                        <button
                          key={`second-${method.id}`}
                          onClick={() => setSecondPaymentMethod(method.label)}
                          className={cn(
                            'flex items-center justify-center gap-1 p-1.5 rounded text-xs transition-all',
                            secondPaymentMethod === method.label
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-card hover:bg-accent/60'
                          )}
                        >
                          <method.icon className="w-3 h-3" />
                          <span className="font-medium">{method.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Total and Checkout */}
          <div className="bg-primary rounded-lg shadow-soft overflow-hidden mt-auto">
            <div className="p-4 text-center">
              <span className="text-primary-foreground/80 text-sm uppercase font-medium">Total</span>
              <p className="text-3xl font-bold text-primary-foreground">{formatCurrency(total)}</p>
            </div>
            <Button 
              className="w-full rounded-none h-12 text-base font-bold bg-primary-foreground text-primary hover:bg-primary-foreground/90" 
              onClick={handleCheckout}
              disabled={cart.length === 0 || !paymentMethod || (splitPayment && (!secondPaymentMethod || firstPaymentAmount <= 0 || firstPaymentAmount >= total)) || createSale.isPending}
            >
              {createSale.isPending && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
              <Receipt className="w-5 h-5 mr-2" />
              Finalizar Venda
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
