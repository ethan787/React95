import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import type { FocusEvent, HTMLAttributes, MouseEvent, Ref } from 'react';
import cn from 'classnames';
import { nanoid } from 'nanoid';

import { tip, wrapper } from './Tooltip.css';

function formatDate(date: Date): string {
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const day = date.getDate();
  const monthIndex = date.getMonth();
  const year = date.getFullYear();

  return `${day.toString().padStart(2, '0')} ${monthNames[monthIndex]} ${year}`;
}

export type TooltipProps = {
  text?: string;
  delay?: number;
} & HTMLAttributes<HTMLDivElement>;

const TooltipRenderer = (
  {
    children,
    text = formatDate(new Date()),
    delay = 1000,
    className,
    tabIndex = 0,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    ...rest
  }: TooltipProps,
  ref: Ref<HTMLDivElement>,
) => {
  const [show, setShow] = useState(false);
  const [tooltipId] = useState(() => `react95-tooltip-${nanoid()}`);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const timerRef = useRef<number | null>(null);
  const hoveredRef = useRef(false);
  const focusedRef = useRef(false);
  const dismissedRef = useRef(false);

  const cancelTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleShow = () => {
    if (timerRef.current !== null || show || dismissedRef.current) {
      return;
    }

    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      if (
        !dismissedRef.current &&
        (hoveredRef.current || focusedRef.current)
      ) {
        setShow(true);
      }
    }, delay);
  };

  const handleMouseEnter = (event: MouseEvent<HTMLDivElement>) => {
    hoveredRef.current = true;
    setHovered(true);
    dismissedRef.current = false;
    scheduleShow();
    onMouseEnter?.(event);
  };

  const handleMouseLeave = (event: MouseEvent<HTMLDivElement>) => {
    hoveredRef.current = false;
    setHovered(false);
    if (!focusedRef.current) {
      cancelTimer();
      setShow(false);
    }
    onMouseLeave?.(event);
  };

  const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      focusedRef.current = true;
      setFocused(true);
      dismissedRef.current = false;
      scheduleShow();
    }
    onFocus?.(event);
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      focusedRef.current = false;
      setFocused(false);
      if (!hoveredRef.current) {
        cancelTimer();
        setShow(false);
      }
    }
    onBlur?.(event);
  };

  useEffect(() => {
    if (!hovered && !focused) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && (show || timerRef.current !== null)) {
        dismissedRef.current = true;
        cancelTimer();
        setShow(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [cancelTimer, focused, hovered, show]);

  useEffect(
    () => () => {
      cancelTimer();
    },
    [cancelTimer],
  );

  const describedBy = rest['aria-describedby'];
  const tooltipDescription = show
    ? [describedBy, tooltipId].filter(Boolean).join(' ')
    : describedBy;

  return (
    <div
      {...rest}
      aria-describedby={tooltipDescription}
      className={cn(wrapper, className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      tabIndex={tabIndex}
      ref={ref}
    >
      {show && (
        <div id={tooltipId} role="tooltip" className={tip}>
          {text}
        </div>
      )}
      {children}
    </div>
  );
};

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  TooltipRenderer,
);
