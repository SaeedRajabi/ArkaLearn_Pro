'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseApiDate } from '@/lib/utils/localized-dates';
import {
  buildMonthGrid,
  getMonthIndex,
  getMonthOptions,
  getWeekdayLabels,
  getYearOptions,
  getYearValue,
  mergeDateTime,
  parseTimeParts,
  setMonthYear,
  shiftMonth,
} from '@/lib/utils/calendar-grid';
import {
  formatPickerInputDate,
  formatPickerInputDateTime,
  isPersianLocale,
  toLocaleDigits,
  fromLocaleDigits,
} from '@/lib/utils/locale-format';
import styles from './flatpickr-datetime-picker.module.css';
import { useFloatingPanelPosition } from '@/lib/utils/floating-portal';

type BaseProps = {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  disableDate?: (date: Date) => boolean;
  locale: 'fa' | 'en';
  isRtl?: boolean;
  jalaliHint?: string;
};

type DateTimeProps = BaseProps & {
  mode: 'datetime';
};

type DateOnlyProps = BaseProps & {
  mode: 'date';
};

type Props = DateTimeProps | DateOnlyProps;

export function FlatpickrDateTimePicker(props: Props) {
  const {
    value,
    onChange,
    placeholder,
    disabled,
    className,
    disableDate,
    locale,
    isRtl = locale === 'fa',
    jalaliHint,
    mode,
  } = props;

  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const selected = value ? parseApiDate(value) : undefined;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const [viewDate, setViewDate] = React.useState<Date>(selected ?? new Date());
  const [hours24, setHours24] = React.useState(0);
  const [minutes, setMinutes] = React.useState(0);

  React.useEffect(() => {
    if (!selected) return;
    setViewDate(selected);
    const parts = parseTimeParts(selected);
    setHours24(parts.hours24);
    setMinutes(parts.minutes);
  }, [selected]);

  const { style: panelStyle, portalContainer } = useFloatingPanelPosition(open, triggerRef, panelRef, isRtl, {
    minWidth: 300,
    maxHeight: 360,
  });

  React.useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const applyTime = React.useCallback((base: Date, nextHours24: number, nextMinutes: number) => {
    return mergeDateTime(base, nextHours24, nextMinutes);
  }, []);

  const handleDaySelect = (day: Date) => {
    if (disableDate?.(day)) return;
    if (mode === 'date') {
      onChange(day);
      setOpen(false);
      return;
    }
    onChange(applyTime(day, hours24, minutes));
  };

  const handleTimeChange = (nextHours24: number, nextMinutes: number) => {
    const base = selected ?? viewDate;
    onChange(applyTime(base, nextHours24, nextMinutes));
  };

  const grid = buildMonthGrid(viewDate, selected, locale);
  const monthOptions = getMonthOptions(locale);
  const yearOptions = getYearOptions(viewDate, locale);
  const weekdayLabels = getWeekdayLabels(locale);
  const displayLabel = selected
    ? mode === 'datetime'
      ? formatPickerInputDateTime(selected, locale)
      : formatPickerInputDate(selected, locale)
    : null;

  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;
  const portalTarget = portalContainer ?? (mounted ? document.body : null);

  return (
    <div className={cn(styles.flatpickrPicker, isRtl && styles.rtl, className)} dir={isRtl ? 'rtl' : 'ltr'}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(styles.trigger, open && styles.triggerOpen, !displayLabel && styles.triggerMuted)}
        onClick={() => setOpen((prev) => !prev)}
      >
        <CalendarIcon className={styles.triggerIcon} aria-hidden />
        <span className={styles.triggerLabel}>{displayLabel ?? placeholder ?? ''}</span>
      </button>

      {open && panelStyle && portalTarget
        ? createPortal(
            <div
              ref={panelRef}
              className={styles.popover}
              style={panelStyle}
              role="dialog"
              onMouseDown={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <div className={styles.header}>
                <button
                  type="button"
                  className={styles.navBtn}
                  aria-label={isRtl ? 'ماه بعد' : 'Previous month'}
                  onClick={() => setViewDate((prev) => shiftMonth(prev, -1, locale))}
                >
                  <PrevIcon className="h-4 w-4" />
                </button>

                <div className={styles.monthYear}>
                  <select
                    className={styles.monthSelect}
                    value={getMonthIndex(viewDate, locale)}
                    onChange={(e) =>
                      setViewDate((prev) =>
                        setMonthYear(prev, Number(e.target.value), getYearValue(prev, locale), locale)
                      )
                    }
                  >
                    {monthOptions.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className={styles.yearSelect}
                    value={getYearValue(viewDate, locale)}
                    onChange={(e) =>
                      setViewDate((prev) =>
                        setMonthYear(prev, getMonthIndex(prev, locale), Number(e.target.value), locale)
                      )
                    }
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {isPersianLocale(locale) ? toLocaleDigits(year, locale) : year}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  className={styles.navBtn}
                  aria-label={isRtl ? 'ماه قبل' : 'Next month'}
                  onClick={() => setViewDate((prev) => shiftMonth(prev, 1, locale))}
                >
                  <NextIcon className="h-4 w-4" />
                </button>
              </div>

              <div className={styles.weekdays}>
                {weekdayLabels.map((label) => (
                  <span key={label} className={styles.weekday}>
                    {label}
                  </span>
                ))}
              </div>

              <div className={styles.days}>
                {grid.map((cell) => {
                  const isDisabled = disableDate?.(cell.date) ?? false;
                  return (
                    <button
                      key={cell.date.toISOString()}
                      type="button"
                      disabled={isDisabled}
                      className={cn(
                        styles.dayBtn,
                        !cell.inCurrentMonth && styles.dayOutside,
                        cell.isToday && styles.dayToday,
                        cell.isSelected && styles.daySelected,
                        isDisabled && styles.dayDisabled
                      )}
                      onClick={() => handleDaySelect(cell.date)}
                    >
                      {cell.label}
                    </button>
                  );
                })}
              </div>

              {mode === 'datetime' ? (
                <div className={styles.timeRow}>
                  <input
                    className={styles.timeInput}
                    inputMode="numeric"
                    aria-label={isRtl ? 'ساعت' : 'Hour'}
                    value={
                      isPersianLocale(locale)
                        ? toLocaleDigits(String(hours24).padStart(2, '0'), locale)
                        : String(hours24).padStart(2, '0')
                    }
                    onChange={(e) => {
                      const raw = fromLocaleDigits(e.target.value).replace(/[^\d]/g, '');
                      const next = Math.min(23, Math.max(0, Number(raw || 0)));
                      setHours24(next);
                      handleTimeChange(next, minutes);
                    }}
                  />
                  <span className={styles.timeSep}>:</span>
                  <input
                    className={styles.timeInput}
                    inputMode="numeric"
                    aria-label={isRtl ? 'دقیقه' : 'Minute'}
                    value={
                      isPersianLocale(locale)
                        ? toLocaleDigits(String(minutes).padStart(2, '0'), locale)
                        : String(minutes).padStart(2, '0')
                    }
                    onChange={(e) => {
                      const raw = fromLocaleDigits(e.target.value).replace(/[^\d]/g, '');
                      const next = Math.min(59, Math.max(0, Number(raw || 0)));
                      setMinutes(next);
                      handleTimeChange(hours24, next);
                    }}
                  />
                </div>
              ) : null}

              {isPersianLocale(locale) && jalaliHint ? (
                <p className={styles.hint}>{jalaliHint}</p>
              ) : null}
            </div>,
            portalTarget
          )
        : null}
    </div>
  );
}
