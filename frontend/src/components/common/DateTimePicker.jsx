import { useEffect, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { es } from 'react-day-picker/locale';
import { CalendarDays, ChevronDown } from 'lucide-react';
import 'react-day-picker/style.css';
import { formatDate, formatTime } from '../../utils/activity';

const DEFAULT_TIME = '18:00';
const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));
const MINUTE_STEP = 5;
const MINUTES = Array.from({ length: 60 / MINUTE_STEP }, (_, index) => String(index * MINUTE_STEP).padStart(2, '0'));

const pad = (number) => String(number).padStart(2, '0');
const toDayValue = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
// "2026-10-15" -> local Date at midnight (new Date("2026-10-15") would be UTC)
const parseDay = (day) => {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date);
};

export const DateTimePicker = ({
  id,
  value,
  onChange,
  min,
  withTime = true,
  invalid = false,
  placeholder,
  describedBy
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const [day = '', time = ''] = value ? value.split('T') : [];
  const [hour, minute] = (time || DEFAULT_TIME).split(':');
  const selected = day ? parseDay(day) : undefined;
  const minDay = min ? parseDay(min.slice(0, 10)) : undefined;
  // Keep a minute that is not on the 5-minute grid (e.g. an activity saved at 19:32)
  const minutes = MINUTES.includes(minute) ? MINUTES : [...MINUTES, minute].sort();

  useEffect(() => {
    if (!open) return undefined;
    const handleOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const emit = (nextDay, nextHour = hour, nextMinute = minute) => {
    onChange(withTime ? `${nextDay}T${nextHour}:${nextMinute}` : nextDay);
  };

  const selectDay = (date) => {
    if (!date) return;
    emit(toDayValue(date));
    if (!withTime) setOpen(false);
  };

  const label = value
    ? withTime
      ? `${formatDate(value)} · ${formatTime(value)}`
      : formatDate(`${day}T00:00`)
    : placeholder || (withTime ? 'Elegí fecha y hora' : 'Elegí una fecha');

  return (
    <div
      className="datetime-picker"
      ref={rootRef}
      onKeyDown={(event) => {
        // Escape closes the picker only, not the form or modal around it
        if (event.key === 'Escape' && open) {
          event.stopPropagation();
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        id={id}
        className={`form-input datetime-picker-trigger ${invalid ? 'is-invalid' : ''} ${value ? '' : 'is-empty'}`}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-invalid={invalid}
        aria-describedby={describedBy}
      >
        <CalendarDays size={15} />
        <span className="datetime-picker-label">{label}</span>
        <ChevronDown size={15} className={`datetime-picker-chevron ${open ? 'open' : ''}`} />
      </button>

      {open && (
        <div className="datetime-picker-panel" role="dialog" aria-label={withTime ? 'Elegir fecha y hora' : 'Elegir fecha'}>
          <DayPicker
            mode="single"
            locale={es}
            selected={selected}
            onSelect={selectDay}
            defaultMonth={selected || minDay}
            disabled={minDay ? { before: minDay } : undefined}
            weekStartsOn={1}
            autoFocus
          />

          {withTime && (
            <div className="datetime-picker-time">
              <span className="section-small-label">HORA</span>
              <select
                className="form-select"
                aria-label="Hora"
                value={hour}
                onChange={(event) => day && emit(day, event.target.value)}
                disabled={!day}
              >
                {HOURS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <span aria-hidden="true">:</span>
              <select
                className="form-select"
                aria-label="Minutos"
                value={minute}
                onChange={(event) => day && emit(day, hour, event.target.value)}
                disabled={!day}
              >
                {minutes.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <span className="datetime-picker-hs">hs</span>
              <button type="button" className="btn-primary datetime-picker-done" onClick={() => setOpen(false)}>
                Listo
              </button>
            </div>
          )}
          {withTime && !day && <span className="activity-form-hint">Elegí primero el día.</span>}
        </div>
      )}
    </div>
  );
};
