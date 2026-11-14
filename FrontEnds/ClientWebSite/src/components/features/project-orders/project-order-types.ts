import {
  Briefcase,
  Building2,
  GraduationCap,
  Layers,
  Rocket,
  User,
  type LucideIcon,
} from 'lucide-react';
import type { IconSelectOption } from '@/components/shared/icon-select-picker';

export type ProjectOrderTypeValue =
  | 'organizational'
  | 'business'
  | 'academic'
  | 'startup'
  | 'personal'
  | 'other';

export const PROJECT_ORDER_TYPE_VALUES: ProjectOrderTypeValue[] = [
  'organizational',
  'business',
  'academic',
  'startup',
  'personal',
  'other',
];

const PROJECT_TYPE_ICONS: Record<ProjectOrderTypeValue, LucideIcon> = {
  organizational: Building2,
  business: Briefcase,
  academic: GraduationCap,
  startup: Rocket,
  personal: User,
  other: Layers,
};

type Translate = (key: string, def: string) => string;

export function getProjectOrderTypeOptions(t: Translate): IconSelectOption[] {
  return PROJECT_ORDER_TYPE_VALUES.map((value) => ({
    value,
    label: t(`projectOrder.projectTypes.${value}`, value),
    icon: PROJECT_TYPE_ICONS[value],
  }));
}

export function getProjectOrderTypeLabel(
  value: string | undefined,
  t: Translate
): string {
  if (!value) return '—';
  return t(`projectOrder.projectTypes.${value}`, value);
}

export type OrderProjectFlowStep = 'contact' | 'verify' | 'project' | 'done';

export function resolveFlowStep(
  step: 'details' | 'otp' | 'subject',
  submitted: boolean,
  otpEnabled: boolean
): OrderProjectFlowStep {
  if (submitted) return 'done';
  if (step === 'subject') return 'project';
  if (step === 'otp') return 'verify';
  return 'contact';
}

export function getVisibleFlowSteps(otpEnabled: boolean): OrderProjectFlowStep[] {
  return otpEnabled
    ? ['contact', 'verify', 'project', 'done']
    : ['contact', 'project', 'done'];
}
