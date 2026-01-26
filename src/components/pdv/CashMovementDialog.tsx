import { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
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

interface CashMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'sangria' | 'suplemento';
}

export function CashMovementDialog({ open, onOpenChange, type }: CashMovementDialogProps) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const { addCashMovement } = useCashRegister();

  const isSangria = type === 'sangria';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const value = parseFloat(amount.replace(',', '.')) || 0;
    
    if (value <= 0 || !reason.trim()) return;
    
    addCashMovement.mutate(
      { type, amount: value, reason: reason.trim() },
      {
        onSuccess: () => {
          setAmount('');
          setReason('');
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSangria ? (
              <ArrowDownCircle className="w-5 h-5 text-destructive" />
            ) : (
              <ArrowUpCircle className="w-5 h-5 text-success" />
            )}
            {isSangria ? 'Registrar Sangria' : 'Registrar Suplemento'}
          </DialogTitle>
          <DialogDescription>
            {isSangria 
              ? 'Registre uma retirada de dinheiro do caixa.'
              : 'Registre uma adição de dinheiro ao caixa.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="movement-amount">Valor (R$)</Label>
            <Input
              id="movement-amount"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="movement-reason">Motivo *</Label>
            <Textarea
              id="movement-reason"
              placeholder={isSangria 
                ? "Ex: Pagamento de fornecedor, troco para outro caixa..."
                : "Ex: Troco adicional, reposição de fundo..."
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              required
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
              variant={isSangria ? 'destructive' : 'default'}
              disabled={addCashMovement.isPending || !amount || !reason.trim()}
            >
              {addCashMovement.isPending 
                ? 'Registrando...' 
                : isSangria ? 'Registrar Sangria' : 'Registrar Suplemento'
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
