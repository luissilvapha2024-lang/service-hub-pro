import { useState } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, QrCode, Receipt, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProducts } from '@/hooks/useProducts';
import { useServices } from '@/hooks/useServices';
import { useSales } from '@/hooks/useSales';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [splitPayment, setSplitPayment] = useState(false);
  const [secondPaymentMethod, setSecondPaymentMethod] = useState<string>('');
  const [firstPaymentAmount, setFirstPaymentAmount] = useState<number>(0);
  const [discount, setDiscount] = useState(0);

  const { products, isLoading: productsLoading } = useProducts();
  const { services, isLoading: servicesLoading } = useServices();
  const { createSale } = useSales();

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

    createSale.mutate({
      sale: {
        subtotal,
        discount: discountAmount,
        total,
        payment_method: paymentMethodLabel,
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
    });

    setCart([]);
    setDiscount(0);
    setPaymentMethod('');
    setSecondPaymentMethod('');
    setSplitPayment(false);
    setFirstPaymentAmount(0);
    setIsCheckoutOpen(false);
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

  return (
    <div className="flex gap-6 h-[calc(100vh-7rem)] animate-fade-in">
      {/* Products/Services Grid */}
      <div className="flex-1 flex flex-col">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground">PDV</h1>
          <p className="text-muted-foreground">Ponto de Venda</p>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produto ou serviço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs defaultValue="produtos" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
            <TabsTrigger value="servicos">Serviços</TabsTrigger>
          </TabsList>

          <TabsContent value="produtos" className="flex-1 overflow-auto">
            {filteredProdutos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhum produto cadastrado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredProdutos.map((produto) => (
                  <button
                    key={produto.id}
                    onClick={() => addToCart({ id: produto.id, name: produto.name, price: Number(produto.price) }, 'product')}
                    className="bg-card border rounded-xl p-4 text-left hover:border-primary hover:shadow-md transition-all"
                  >
                    <h4 className="font-medium text-foreground text-sm line-clamp-2">
                      {produto.name}
                    </h4>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-primary font-bold">
                        {formatCurrency(Number(produto.price))}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Est: {produto.stock}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="servicos" className="flex-1 overflow-auto">
            {filteredServicos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhum serviço cadastrado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredServicos.map((servico) => (
                  <button
                    key={servico.id}
                    onClick={() => addToCart({ id: servico.id, name: servico.name, price: Number(servico.price) }, 'service')}
                    className="bg-card border rounded-xl p-4 text-left hover:border-primary hover:shadow-md transition-all"
                  >
                    <h4 className="font-medium text-foreground text-sm line-clamp-2">
                      {servico.name}
                    </h4>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-primary font-bold">
                        {formatCurrency(Number(servico.price))}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Cart */}
      <div className="w-96 bg-card border rounded-xl flex flex-col shadow-soft">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Carrinho</h2>
            <span className="ml-auto text-sm text-muted-foreground">
              {cart.length} {cart.length === 1 ? 'item' : 'itens'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mb-2 opacity-50" />
              <p>Carrinho vazio</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm text-foreground">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(item.price)} un
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.id, item.type, -1)}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-6 text-center font-medium">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.id, item.type, 1)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => removeFromCart(item.id, item.type)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-success">
                <span>Desconto ({discount}%)</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={cart.length === 0}
            onClick={() => setIsCheckoutOpen(true)}
          >
            <Receipt className="w-4 h-4 mr-2" />
            Finalizar Venda
          </Button>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Venda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Desconto (%)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Forma de Pagamento {splitPayment && '(1ª)'}
              </label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.label)}
                    className={cn(
                      'flex items-center gap-2 p-4 rounded-lg border transition-all',
                      paymentMethod === method.label
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-muted-foreground'
                    )}
                  >
                    <method.icon className="w-5 h-5" />
                    <span className="font-medium">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="splitPayment"
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
                className="h-4 w-4 rounded border-border"
              />
              <label htmlFor="splitPayment" className="text-sm font-medium text-muted-foreground">
                Dividir em duas formas de pagamento
              </label>
            </div>

            {splitPayment && (
              <>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Valor da 1ª forma ({paymentMethod || 'Selecione acima'})
                  </label>
                  <Input
                    type="number"
                    min="0.01"
                    max={total - 0.01}
                    step="0.01"
                    value={firstPaymentAmount}
                    onChange={(e) => setFirstPaymentAmount(Number(e.target.value))}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Restante na 2ª forma: {formatCurrency(total - firstPaymentAmount)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    2ª Forma de Pagamento
                  </label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {paymentMethods.map((method) => (
                      <button
                        key={`second-${method.id}`}
                        onClick={() => setSecondPaymentMethod(method.label)}
                        className={cn(
                          'flex items-center gap-2 p-4 rounded-lg border transition-all',
                          secondPaymentMethod === method.label
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-muted-foreground'
                        )}
                      >
                        <method.icon className="w-5 h-5" />
                        <span className="font-medium">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="pt-4 border-t">
              <div className="flex justify-between text-lg font-bold mb-4">
                <span>Total a pagar</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleCheckout}
                disabled={!paymentMethod || (splitPayment && (!secondPaymentMethod || firstPaymentAmount <= 0 || firstPaymentAmount >= total)) || createSale.isPending}
              >
                {createSale.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmar Pagamento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
