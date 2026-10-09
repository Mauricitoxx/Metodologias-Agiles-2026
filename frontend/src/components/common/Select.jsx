import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

const TYPEAHEAD_RESET_MS = 500;
const MIN_SPACE_BELOW = 220;

const normalize = (text) =>
  String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const sameValue = (a, b) => String(a) === String(b);

export const Select = ({
  id,
  value,
  onChange,
  options,
  placeholder = 'Seleccioná una opción',
  invalid = false,
  disabled = false,
  compact = false,
  className = '',
  'aria-label': ariaLabel,
  'aria-describedby': describedBy
}) => {
  const listId = useId();
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const typeahead = useRef({ text: '', timer: null });

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [placement, setPlacement] = useState('down');

  const selectedIndex = options.findIndex((option) => sameValue(option.value, value));
  const selected = options[selectedIndex];
  const optionId = (index) => `${listId}-option-${index}`;

  useEffect(() => {
    if (!open) return undefined;
    const handleOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  useEffect(() => {
    if (open && activeIndex >= 0) listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  useEffect(() => () => clearTimeout(typeahead.current.timer), []);

  const openList = () => {
    if (disabled || !options.length) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    setPlacement(spaceBelow < MIN_SPACE_BELOW && rect.top > spaceBelow ? 'up' : 'down');
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const choose = (index) => {
    const option = options[index];
    if (option && !sameValue(option.value, value)) onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  // Jumps to the next option starting with the typed text, like the native select
  const findByTypeahead = (key) => {
    const state = typeahead.current;
    clearTimeout(state.timer);
    state.text += normalize(key);
    state.timer = setTimeout(() => {
      state.text = '';
    }, TYPEAHEAD_RESET_MS);

    const search = state.text.length > 1 && new Set(state.text).size === 1 ? state.text[0] : state.text;
    const start = (open ? activeIndex : selectedIndex) + (search.length === 1 ? 1 : 0);
    const ordered = options.map((_, index) => (Math.max(start, 0) + index) % options.length);
    return ordered.find((index) => normalize(options[index].label).startsWith(search)) ?? -1;
  };

  const handleKeyDown = (event) => {
    if (disabled) return;
    const last = options.length - 1;

    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        openList();
      } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const index = findByTypeahead(event.key);
        if (index >= 0) onChange(options[index].value);
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, last));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(last);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        choose(activeIndex);
        break;
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          const index = findByTypeahead(event.key);
          if (index >= 0) setActiveIndex(index);
        }
    }
  };

  return (
    <div className={`app-select ${compact ? 'compact' : ''} ${className}`} ref={rootRef}>
      <button
        type="button"
        id={id}
        ref={triggerRef}
        className={`form-select app-select-trigger ${invalid ? 'is-invalid' : ''} ${selected ? '' : 'is-empty'}`}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        aria-invalid={invalid}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleKeyDown}
      >
        <span className="app-select-label">{selected ? selected.label : placeholder}</span>
        <ChevronDown size={compact ? 13 : 15} className={`app-select-chevron ${open ? 'open' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <ul id={listId} ref={listRef} className={`app-select-list ${placement}`} role="listbox" aria-label={ariaLabel}>
          {options.map((option, index) => {
            const isSelected = index === selectedIndex;
            return (
              <li
                key={option.value}
                id={optionId(index)}
                role="option"
                aria-selected={isSelected}
                className={`app-select-option ${isSelected ? 'selected' : ''} ${index === activeIndex ? 'active' : ''}`}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(index)}
              >
                <span>{option.label}</span>
                {isSelected && <Check size={compact ? 12 : 14} aria-hidden="true" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
