import { useState, useEffect } from 'react';
import { MessageCircle, RotateCcw, Save, Loader2, Info, Monitor, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { statusConfig, type OrderStatus } from '@/hooks/useServiceOrders';
import {
  useWhatsAppTemplates,
  DEFAULT_TEMPLATES,
  TEMPLATE_VARIABLES,
} from '@/hooks/useWhatsAppTemplates';

export function WhatsAppSettings() {
  const { templates, isLoading, upsertTemplate, resetTemplate, getTemplate } =
    useWhatsAppTemplates();
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const [whatsappMode, setWhatsappMode] = useState<string>(() => {
    return localStorage.getItem('whatsapp_open_mode') || 'auto';
  });

  const handleModeChange = (value: string) => {
    setWhatsappMode(value);
    localStorage.setItem('whatsapp_open_mode', value);
  };

  const handleEdit = (statusKey: string) => {
    setEditingStatus(statusKey);
    setEditText(getTemplate(statusKey));
  };

  const handleSave = async (statusKey: string) => {
    setSavingStatus(statusKey);
    try {
      await upsertTemplate.mutateAsync({ status_key: statusKey, template_text: editText });
      setEditingStatus(null);
    } finally {
      setSavingStatus(null);
    }
  };

  const handleReset = async (statusKey: string) => {
    setSavingStatus(statusKey);
    try {
      await resetTemplate.mutateAsync({ status_key: statusKey });
      setEditingStatus(null);
    } finally {
      setSavingStatus(null);
    }
  };

  const isCustom = (statusKey: string) => {
    return templates.some((t) => t.status_key === statusKey && t.is_active);
  };

  const insertVariable = (variable: string) => {
    setEditText((prev) => prev + variable);
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border p-8 shadow-soft flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Preferência de abertura */}
      <div className="bg-card rounded-xl border p-6 shadow-soft">
        <div className="flex items-center gap-3 mb-2">
          <MessageCircle className="w-5 h-5 text-[#25D366]" />
          <h3 className="text-lg font-semibold text-foreground">Preferência de Abertura</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Escolha como o WhatsApp será aberto ao enviar mensagens.
        </p>
        <RadioGroup value={whatsappMode} onValueChange={handleModeChange} className="space-y-3">
          <div className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="auto" id="mode-auto" />
            <Label htmlFor="mode-auto" className="flex items-center gap-2 cursor-pointer flex-1">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Automático (Recomendado)</p>
                <p className="text-xs text-muted-foreground">Abre via navegador — você escolhe entre Web ou App</p>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="web" id="mode-web" />
            <Label htmlFor="mode-web" className="flex items-center gap-2 cursor-pointer flex-1">
              <Globe className="w-4 h-4 text-[#25D366]" />
              <div>
                <p className="font-medium text-sm">WhatsApp Web</p>
                <p className="text-xs text-muted-foreground">Sempre abre no navegador (web.whatsapp.com)</p>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="desktop" id="mode-desktop" />
            <Label htmlFor="mode-desktop" className="flex items-center gap-2 cursor-pointer flex-1">
              <Monitor className="w-4 h-4 text-[#25D366]" />
              <div>
                <p className="font-medium text-sm">Aplicativo Desktop</p>
                <p className="text-xs text-muted-foreground">Tenta abrir no app instalado no computador</p>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Templates */}
      <div className="bg-card rounded-xl border p-6 shadow-soft">
        <div className="flex items-center gap-3 mb-2">
          <MessageCircle className="w-5 h-5 text-[#25D366]" />
          <h3 className="text-lg font-semibold text-foreground">Mensagens do WhatsApp</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Personalize as mensagens enviadas aos clientes quando o status da OS é atualizado.
          Use as variáveis abaixo para inserir dados dinâmicos.
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {TEMPLATE_VARIABLES.map((v) => (
            <TooltipProvider key={v.key}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="cursor-help text-xs">
                    {v.key}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>{v.label}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>

        <Accordion type="single" collapsible className="space-y-2">
          {Object.entries(statusConfig).map(([key, config]) => (
            <AccordionItem key={key} value={key} className="border rounded-lg px-4">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className={`inline-block w-2 h-2 rounded-full ${config.bgClass.split(' ')[0]}`} />
                  <span className="text-sm font-medium">{config.label}</span>
                  {isCustom(key) && (
                    <Badge variant="outline" className="text-xs">
                      Personalizado
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                {editingStatus === key ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1.5 mb-1">
                      {TEMPLATE_VARIABLES.map((v) => (
                        <Button
                          key={v.key}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => insertVariable(v.key)}
                        >
                          + {v.key}
                        </Button>
                      ))}
                    </div>
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={8}
                      className="font-mono text-sm"
                      placeholder="Digite a mensagem..."
                    />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Info className="w-3 h-3" />
                      Use *texto* para negrito no WhatsApp
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSave(key)}
                        disabled={savingStatus === key}
                      >
                        {savingStatus === key ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-1" />
                        )}
                        Salvar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReset(key)}
                        disabled={savingStatus === key}
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Restaurar Padrão
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingStatus(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 rounded-lg p-3 font-sans">
                      {getTemplate(key)}
                    </pre>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(key)}>
                      Editar Mensagem
                    </Button>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
