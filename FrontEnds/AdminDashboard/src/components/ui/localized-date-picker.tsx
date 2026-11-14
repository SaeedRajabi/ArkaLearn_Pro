'use client';

import { FlatpickrDateTimePicker } from '@/components/ui/flatpickr-datetime-picker';
import { useLanguage } from '@/components/language-provider';

type LocalizedDatePickerProps = {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  disableDate?: (date: Date) => boolean;
};

export function LocalizedDatePicker({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  disableDate,
}: LocalizedDatePickerProps) {
  const { locale, direction, t } = useLanguage();

  return (
    <FlatpickrDateTimePicker
      mode="date"
      value={value}
      onChange={onChange}
      placeholder={placeholder ?? t('date_picker_placeholder')}
      disabled={disabled}
      className={className}
      disableDate={disableDate}
      locale={locale}
      isRtl={direction === 'rtl'}
      jalaliHint={t('date_picker_jalali_hint')}
    />
  );
}
