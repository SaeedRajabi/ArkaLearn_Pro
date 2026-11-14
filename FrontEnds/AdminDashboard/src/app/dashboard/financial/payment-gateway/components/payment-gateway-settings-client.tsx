'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import {
  fetchPaymentGatewaySettings,
  savePaymentGatewaySettings,
  type PaymentGatewayCredentialsInput,
  type PaymentGatewayProvider,
  type PaymentGatewayProviderSettings,
} from '@/services/payment-gateway-api.service';

const PROVIDER_LABEL_KEYS: Record<PaymentGatewayProvider, string> = {
  ZarinPal: 'payment_gateway_provider_zarinpal',
  Zibal: 'payment_gateway_provider_zibal',
};

type CredentialFormState = {
  merchantId: string;
  apiKey: string;
  accessToken: string;
  terminalId: string;
  useSandbox: boolean;
};

const EMPTY_FORM: CredentialFormState = {
  merchantId: '',
  apiKey: '',
  accessToken: '',
  terminalId: '',
  useSandbox: false,
};

function buildCredentialsPayload(
  form: CredentialFormState,
  includeApiKey: boolean,
  includeTerminal: boolean,
): PaymentGatewayCredentialsInput {
  const payload: PaymentGatewayCredentialsInput = {
    useSandbox: form.useSandbox,
  };

  if (form.merchantId.trim())
    payload.merchantId = form.merchantId.trim();
  if (includeApiKey && form.apiKey.trim())
    payload.apiKey = form.apiKey.trim();
  if (form.accessToken.trim())
    payload.accessToken = form.accessToken.trim();
  if (includeTerminal && form.terminalId.trim())
    payload.terminalId = form.terminalId.trim();

  return payload;
}

function ProviderCredentialsCard(props: {
  title: string;
  description: string;
  configured: boolean;
  showApiKey?: boolean;
  showTerminal?: boolean;
  form: CredentialFormState;
  existing: PaymentGatewayProviderSettings;
  onChange: (next: CredentialFormState) => void;
  t: (key: string) => string;
}) {
  const { title, description, configured, showApiKey, showTerminal, form, existing, onChange, t } = props;

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="space-y-1">
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className={`text-sm ${configured ? 'text-emerald-600' : 'text-amber-600'}`}>
          {configured ? t('payment_gateway_credentials_ok') : t('payment_gateway_credentials_missing')}
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <Label>{t('payment_gateway_use_sandbox')}</Label>
          <p className="text-sm text-muted-foreground">{t('payment_gateway_use_sandbox_desc')}</p>
        </div>
        <Switch
          checked={form.useSandbox}
          onCheckedChange={(checked) => onChange({ ...form, useSandbox: checked })}
        />
      </div>

      <div className="space-y-1">
        <Label>{t('payment_gateway_merchant_id')}</Label>
        <Input
          value={form.merchantId}
          onChange={(e) => onChange({ ...form, merchantId: e.target.value })}
          placeholder={existing.hasMerchantId ? t('payment_gateway_keep_existing') : t('payment_gateway_merchant_id_placeholder')}
        />
      </div>

      {showApiKey ? (
        <div className="space-y-1">
          <Label>{t('payment_gateway_api_key')}</Label>
          <Input
            type="password"
            value={form.apiKey}
            onChange={(e) => onChange({ ...form, apiKey: e.target.value })}
            placeholder={existing.hasApiKey ? t('payment_gateway_keep_existing') : t('payment_gateway_api_key_placeholder')}
          />
        </div>
      ) : null}

      <div className="space-y-1">
        <Label>{t('payment_gateway_access_token')}</Label>
        <Input
          type="password"
          value={form.accessToken}
          onChange={(e) => onChange({ ...form, accessToken: e.target.value })}
          placeholder={existing.hasAccessToken ? t('payment_gateway_keep_existing') : t('payment_gateway_access_token_placeholder')}
        />
      </div>

      {showTerminal ? (
        <div className="space-y-1">
          <Label>{t('payment_gateway_terminal_id')}</Label>
          <Input
            value={form.terminalId}
            onChange={(e) => onChange({ ...form, terminalId: e.target.value })}
            placeholder={existing.hasTerminalId ? t('payment_gateway_keep_existing') : t('payment_gateway_terminal_id_placeholder')}
          />
        </div>
      ) : null}
    </div>
  );
}

export function PaymentGatewaySettingsClient() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [provider, setProvider] = React.useState<PaymentGatewayProvider>('Zibal');
  const [enabled, setEnabled] = React.useState(true);
  const [availableProviders, setAvailableProviders] = React.useState<PaymentGatewayProvider[]>(['ZarinPal', 'Zibal']);
  const [zibalExisting, setZibalExisting] = React.useState<PaymentGatewayProviderSettings>({
    isConfigured: false,
    useSandbox: false,
    hasMerchantId: false,
    hasApiKey: false,
    hasAccessToken: false,
    hasTerminalId: false,
  });
  const [zarinPalExisting, setZarinPalExisting] = React.useState<PaymentGatewayProviderSettings>({
    isConfigured: false,
    useSandbox: false,
    hasMerchantId: false,
    hasApiKey: false,
    hasAccessToken: false,
    hasTerminalId: false,
  });
  const [zibalForm, setZibalForm] = React.useState<CredentialFormState>(EMPTY_FORM);
  const [zarinPalForm, setZarinPalForm] = React.useState<CredentialFormState>(EMPTY_FORM);

  React.useEffect(() => {
    void fetchPaymentGatewaySettings()
      .then((row) => {
        setProvider(row.provider);
        setEnabled(row.enabled);
        setAvailableProviders(row.availableProviders);
        setZibalExisting(row.zibal);
        setZarinPalExisting(row.zarinPal);
        setZibalForm({ ...EMPTY_FORM, useSandbox: row.zibal.useSandbox });
        setZarinPalForm({ ...EMPTY_FORM, useSandbox: row.zarinPal.useSandbox });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await savePaymentGatewaySettings({
        provider,
        enabled,
        zibal: buildCredentialsPayload(zibalForm, true, false),
        zarinPal: buildCredentialsPayload(zarinPalForm, false, true),
      });
      const refreshed = await fetchPaymentGatewaySettings();
      setZibalExisting(refreshed.zibal);
      setZarinPalExisting(refreshed.zarinPal);
      setZibalForm({ ...EMPTY_FORM, useSandbox: refreshed.zibal.useSandbox });
      setZarinPalForm({ ...EMPTY_FORM, useSandbox: refreshed.zarinPal.useSandbox });
      toast({ title: t('payment_gateway_saved') });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: err instanceof Error ? err.message : t('payment_gateway_save_failed'),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">{t('loading')}</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('payment_gateway_title')}</CardTitle>
        <CardDescription>{t('payment_gateway_desc')}</CardDescription>
      </CardHeader>
      <CardContent className="grid max-w-2xl gap-4">
        <div className="flex items-center justify-between gap-4 rounded-md border p-3">
          <div className="space-y-0.5">
            <Label>{t('payment_gateway_enabled')}</Label>
            <p className="text-sm text-muted-foreground">{t('payment_gateway_enabled_desc')}</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <div className="space-y-1">
          <Label>{t('payment_gateway_provider')}</Label>
          <Select value={provider} onValueChange={(v) => setProvider(v as PaymentGatewayProvider)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableProviders.map((p) => (
                <SelectItem key={p} value={p}>
                  {t(PROVIDER_LABEL_KEYS[p])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">{t('payment_gateway_provider_desc')}</p>
        </div>

        <ProviderCredentialsCard
          title={t('payment_gateway_provider_zibal')}
          description={t('payment_gateway_zibal_desc')}
          configured={zibalExisting.isConfigured}
          showApiKey
          form={zibalForm}
          existing={zibalExisting}
          onChange={setZibalForm}
          t={t}
        />

        <ProviderCredentialsCard
          title={t('payment_gateway_provider_zarinpal')}
          description={t('payment_gateway_zarinpal_desc')}
          configured={zarinPalExisting.isConfigured}
          showTerminal
          form={zarinPalForm}
          existing={zarinPalExisting}
          onChange={setZarinPalForm}
          t={t}
        />

        <Button onClick={() => void handleSave()} disabled={saving}>
          {t('payment_gateway_save')}
        </Button>
      </CardContent>
    </Card>
  );
}
