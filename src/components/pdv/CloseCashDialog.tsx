import { useState } from 'react';
import { Lock, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCashRegister } from '@/hooks/useCashRegister';
import { cn } from '@/lib/utils';

interface CloseCashDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesTotal: number;
}

export function CloseCashDialog({ open, onOpenChange, salesTotal }: CloseCashDialogProps) {
  const [closingBalance, setClosingBalance] = useState('');
  const [notes, setNotes] = useState('');
  const { currentSession, movements, closeCashRegister, calculateExpectedBalance } = useCashRegister();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const expectedBalance = currentSession 
    ? calculateExpectedBalance(currentSession, movements, salesTotal)
    : 0;

  const enteredBalance = parseFloat(closingBalance.replace(',', '.')) || 0;
  const difference = enteredBalance - expectedBalance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    closeCashRegister.mutate(
      { 
        closingBalance: enteredBalance, 
        notes: notes || undefined,
        salesTotal,
      },
      {
        onSuccess: () => {
          setClosingBalance('');
          setNotes('');
          onOpenChange(false);
        },
      }
    );
  };

  // Calculate sangrias and suplementos
  const sangrias = movements
    .filter(m => m.type === 'sangria')
    .reduce((acc, m) => acc + Number(m.amount), 0);
  
  const suplementos = movements
    .filter(m => m.type === 'suplemento')
    .reduce((acc, m) => acc + Number(m.amount), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-destructive" />
            Fechar Caixa
          </DialogTitle>
          <DialogDescription>
            Confira os valores e informe o total em caixa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Summary */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Abertura:</span>
              <span>{formatCurrency(Number(currentSession?.opening_balance || 0))}</span>
            </div>
            <div className="flex justify-between text-success">
              <span>+ Vendas (dinheiro):</span>
              <span>{formatCurrency(salesTotal)}</span>
            </div>
            <div className="flex justify-between text-success">
              <span>+ Suplementos:</span>
              <span>{formatCurrency(suplementos)}</span>
            </div>
            <div className="flex justify-between text-destructive">
              <span>- Sangrias:</span>
              <span>{formatCurrency(sangrias)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Saldo Esperado:</span>
              <span className="text-primary">{formatCurrency(expectedBalance)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="closing-balance">Valor em Caixa (R$)</Label>
            <Input
              id="closing-balance"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={closingBalance}
              onChange={(e) => setClosingBalance(e.target.value)}
              autoFocus
            />
          </div>

          {/* Difference indicator */}
          {closingBalance && (
            <div className={cn(
              "flex items-center gap-2 p-3 rounded-lg",
              difference === 0 
                ? "bg-success/10 text-success" 
                : difference > 0 
                  ? "bg-info/10 text-info"
                  : "bg-destructive/10 text-destructive"
            )}>
              {difference === 0 ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Caixa batido!</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Diferença: {formatCurrency(difference)} 
                    ({difference > 0 ? 'sobra' : 'falta'})
                  </span>
                </>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="close-notes">Observações (opcional)</Label>
            <Textarea
              id="close-notes"
              placeholder="Notas sobre o fechamento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="destructive"
              disabled={closeCashRegister.isPending || !closingBalance}
            >
              {closeCashRegister.isPending ? 'Fechando...' : 'Confirmar Fechamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
