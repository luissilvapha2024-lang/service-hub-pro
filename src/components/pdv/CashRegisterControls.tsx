import { useState } from 'react';
import { DollarSign, Lock, Unlock, ArrowDownCircle, ArrowUpCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCashRegister } from '@/hooks/useCashRegister';
import { OpenCashDialog } from './OpenCashDialog';
import { CloseCashDialog } from './CloseCashDialog';
import { CashMovementDialog } from './CashMovementDialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface CashRegisterControlsProps {
  salesTotal: number;
}

export function CashRegisterControls({ salesTotal }: CashRegisterControlsProps) {
  const { 
    currentSession, 
    movements, 
    isCashOpen, 
    isPreviousDaySessionOpen,
    isLoading 
  } = useCashRegister();

  const [openDialog, setOpenDialog] = useState<'open' | 'close' | 'sangria' | 'suplemento' | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calculate current balance
  const calculateCurrentBalance = () => {
    if (!currentSession) return 0;
    
    const sangrias = movements
      .filter(m => m.type === 'sangria')
      .reduce((acc, m) => acc + Number(m.amount), 0);
    
    const suplementos = movements
      .filter(m => m.type === 'suplemento')
      .reduce((acc, m) => acc + Number(m.amount), 0);

    return Number(currentSession.opening_balance) + salesTotal + suplementos - sangrias;
  };

  if (isLoading) {
    return (
      <div className="bg-card border rounded-lg p-4 animate-pulse">
        <div className="h-6 bg-muted rounded w-24 mb-3" />
        <div className="h-8 bg-muted rounded w-32" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Alert for previous day session */}
      {isPreviousDaySessionOpen && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Caixa do dia anterior aberto</AlertTitle>
          <AlertDescription>
            Feche o caixa anterior antes de realizar vendas ou abrir um novo caixa.
          </AlertDescription>
        </Alert>
      )}

      {/* Cash Status Card */}
      <div className={cn(
        "bg-card border rounded-lg overflow-hidden",
        isCashOpen ? "border-success/50" : "border-warning/50"
      )}>
        <div className={cn(
          "px-4 py-2 flex items-center justify-between",
          isCashOpen ? "bg-success/10" : "bg-warning/10"
        )}>
          <div className="flex items-center gap-2">
            {isCashOpen ? (
              <Unlock className="w-4 h-4 text-success" />
            ) : (
              <Lock className="w-4 h-4 text-warning" />
            )}
            <span className={cn(
              "font-semibold text-sm",
              isCashOpen ? "text-success" : "text-warning"
            )}>
              {isCashOpen ? 'Caixa Aberto' : isPreviousDaySessionOpen ? 'Caixa Pendente' : 'Caixa Fechado'}
            </span>
          </div>
          
          {isCashOpen && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Saldo Atual</p>
              <p className="font-bold text-success">{formatCurrency(calculateCurrentBalance())}</p>
            </div>
          )}
        </div>

        <div className="p-3 space-y-2">
          {isCashOpen ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted/50 rounded p-2">
                  <p className="text-muted-foreground">Abertura</p>
                  <p className="font-medium">{formatCurrency(Number(currentSession?.opening_balance || 0))}</p>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <p className="text-muted-foreground">Vendas (dinheiro)</p>
                  <p className="font-medium">{formatCurrency(salesTotal)}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs h-8"
                  onClick={() => setOpenDialog('sangria')}
                >
                  <ArrowDownCircle className="w-3 h-3 mr-1 text-destructive" />
                  Sangria
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs h-8"
                  onClick={() => setOpenDialog('suplemento')}
                >
                  <ArrowUpCircle className="w-3 h-3 mr-1 text-success" />
                  Suplemento
                </Button>
              </div>

              <Button
                variant="destructive"
                size="sm"
                className="w-full text-xs h-8"
                onClick={() => setOpenDialog('close')}
              >
                <Lock className="w-3 h-3 mr-1" />
                Fechar Caixa
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={() => setOpenDialog(isPreviousDaySessionOpen ? 'close' : 'open')}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              {isPreviousDaySessionOpen ? 'Fechar Caixa Pendente' : 'Abrir Caixa'}
            </Button>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <OpenCashDialog 
        open={openDialog === 'open'} 
        onOpenChange={(open) => !open && setOpenDialog(null)} 
      />
      
      <CloseCashDialog 
        open={openDialog === 'close'} 
        onOpenChange={(open) => !open && setOpenDialog(null)}
        salesTotal={salesTotal}
      />
      
      <CashMovementDialog
        open={openDialog === 'sangria' || openDialog === 'suplemento'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
        type={openDialog === 'sangria' ? 'sangria' : 'suplemento'}
      />
    </div>
  );
}
