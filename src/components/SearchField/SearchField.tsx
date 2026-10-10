import { forwardRef, useImperativeHandle, useRef, type KeyboardEvent } from 'react';
import { SearchIcon, XIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { IconButton } from '../IconButton/IconButton';
import { Spinner } from '../Spinner/Spinner';
import { TextField, type TextFieldProps } from '../TextField/TextField';
import s from './SearchField.module.css';

export type SearchFieldProps = Omit<TextFieldProps, 'label' | 'type' | 'iconStart' | 'iconEnd'> & {
  /** Accessible name for the search box. */
  label?: string;
  /** Called with the current query when the user presses Enter. */
  onSearch?: (value: string) => void;
  /** Shows a spinner in the trailing slot while results load. */
  loading?: boolean;
};

/** Search box for the model list and material library: leading icon, clear button, Escape clears, Enter searches. */
export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { label = 'Search', value, onChange, onSearch, loading, placeholder = 'Search…', size = 'sm', disabled, className, onKeyDown, ...rest },
  ref,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  const clear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    if (e.key === 'Escape' && value) {
      // Clear first; a second Escape bubbles so an enclosing popover can close.
      e.preventDefault();
      e.stopPropagation();
      onChange('');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      onSearch?.(value);
    }
  };

  const showClear = value.length > 0 && !disabled;
  const trailing =
    loading || showClear ? (
      <span className={s.trailing}>
        {loading && <Spinner size="xs" tone="muted" label="Searching" />}
        {showClear && (
          <IconButton
            label="Clear search"
            icon={<XIcon strokeWidth={2.2} />}
            size={size === 'lg' ? 'sm' : 'xs'}
            className={s.clear}
            onClick={clear}
          />
        )}
      </span>
    ) : undefined;

  return (
    <TextField
      ref={inputRef}
      type="search"
      role="searchbox"
      enterKeyHint="search"
      autoComplete="off"
      spellCheck={false}
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      size={size}
      disabled={disabled}
      aria-busy={loading || undefined}
      iconStart={<SearchIcon strokeWidth={2.2} aria-hidden="true" />}
      iconEnd={trailing}
      className={cx(s.search, className)}
      onKeyDown={handleKeyDown}
      {...rest}
    />
  );
});
