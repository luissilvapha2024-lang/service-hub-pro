import { useState } from 'react';
import { Send, ChevronDown, Eye, MessageCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { statusConfig, type OrderStatus } from '@/hooks/useServiceOrders';

interface WhatsAppTemplateSelectorProps {
  phone: string;
  clientName: string;
  orderNumber: number;
  deviceModel: string;
  currentStatus: OrderStatus;
  companyName?: string;
  buildMessage: (
    statusKey: string,
    clientName: string,
    orderNumber: number,
    deviceModel: string,
    companyName?: string
  ) => string;
  onPrintOS?: () => void;
}

export function WhatsAppTemplateSelector({
  phone,
  clientName,
  orderNumber,
  deviceModel,
  currentStatus,
  companyName,
  buildMessage,
  onPrintOS,
}: WhatsAppTemplateSelectorProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>(currentStatus);
  const [showPreview, setShowPreview] = useState(false);
  const [sendOS, setSendOS] = useState(false);

  const message = buildMessage(selectedStatus, clientName, orderNumber, deviceModel, companyName);

  const handleSend = () => {
    if (sendOS && onPrintOS) {
      onPrintOS();
    }
  };

  return (
    <div className="bg-card rounded-xl border p-6 shadow-soft space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-[#25D366]" />
          Notificar Cliente
        </h3>
        {selectedStatus !== currentStatus && (
          <Badge variant="outline" className="text-xs">
            Status diferente
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Mensagem para o status:</label>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(statusConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${config.bgClass.split(' ')[0]}`}
                  />
                  {config.label}
                  {key === currentStatus && (
                    <span className="text-xs text-muted-foreground ml-1">(atual)</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {onPrintOS && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="send-os"
            checked={sendOS}
            onCheckedChange={(checked) => setSendOS(checked === true)}
          />
          <Label htmlFor="send-os" className="text-sm cursor-pointer flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Enviar OS na mensagem
          </Label>
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full justify-between text-muted-foreground"
        onClick={() => setShowPreview(!showPreview)}
      >
        <span className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5" />
          {showPreview ? 'Ocultar preview' : 'Ver preview da mensagem'}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${showPreview ? 'rotate-180' : ''}`}
        />
      </Button>

      {showPreview && (
        <div className="rounded-lg bg-muted/50 p-3 text-sm whitespace-pre-wrap border">
          {message}
        </div>
      )}

      <div onClick={handleSend}>
        <WhatsAppButton
          phone={phone}
          message={message}
          variant="success"
          className="w-full"
        >
          <Send className="w-4 h-4 ml-1" />
          Enviar via WhatsApp
        </WhatsAppButton>
      </div>
    </div>
  );
}
