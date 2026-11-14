import { apiRequest } from './client';

const BASE = 'Payment';

export interface PaymentStartResponse {
  paymentUrl: string;
  provider: string;
  orderId: string;
}

export async function requestInvoicePayment(invoiceId: number): Promise<PaymentStartResponse> {
  return await apiRequest<PaymentStartResponse>(`${BASE}/RequestInvoicePayment`, {
    method: 'POST',
    body: { invoiceId },
  });
}

export async function requestSeminarPayment(seminarId: number): Promise<PaymentStartResponse> {
  return await apiRequest<PaymentStartResponse>(`${BASE}/RequestSeminarPayment`, {
    method: 'POST',
    body: { seminarId },
  });
}

export async function requestEducationPlanInstallmentPayment(
  installmentId: number
): Promise<PaymentStartResponse> {
  return await apiRequest<PaymentStartResponse>(`${BASE}/RequestEducationPlanInstallmentPayment`, {
    method: 'POST',
    body: { installmentId },
  });
}

export async function requestSupportPlanPayment(
  tariffId: number,
  featureCodes: string[] = []
): Promise<PaymentStartResponse> {
  return await apiRequest<PaymentStartResponse>(`${BASE}/RequestSupportPlanPayment`, {
    method: 'POST',
    body: { tariffId, featureCodes },
  });
}

export async function requestAdContactUnlockPayment(teacherId: number): Promise<PaymentStartResponse> {
  return await apiRequest<PaymentStartResponse>(`${BASE}/RequestAdContactUnlockPayment`, {
    method: 'POST',
    body: { teacherId },
  });
}

export async function requestAdSubscriptionPayment(tariffId: number): Promise<PaymentStartResponse> {
  return await apiRequest<PaymentStartResponse>(`${BASE}/RequestAdSubscriptionPayment`, {
    method: 'POST',
    body: { tariffId },
  });
}

export async function requestAdOneTimeBumpPayment(): Promise<PaymentStartResponse> {
  return await apiRequest<PaymentStartResponse>(`${BASE}/RequestAdOneTimeBumpPayment`, {
    method: 'POST',
    body: {},
  });
}

export async function requestAdAutoBumpPackagePayment(packageId: number): Promise<PaymentStartResponse> {
  return await apiRequest<PaymentStartResponse>(`${BASE}/RequestAdAutoBumpPackagePayment`, {
    method: 'POST',
    body: { packageId },
  });
}

export function redirectToPaymentGateway(paymentUrl: string): void {
  window.location.href = paymentUrl;
}
