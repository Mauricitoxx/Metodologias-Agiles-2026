import { useLayoutEffect, useRef } from 'react';

// Textarea that grows with its content instead of showing a scrollbar or a resize handle
export const AutoResizeTextarea = ({ className = '', value, ...props }) => {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const textarea = ref.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const borders = textarea.offsetHeight - textarea.clientHeight;
    textarea.style.height = `${textarea.scrollHeight + borders}px`;
  }, [value]);

  return <textarea ref={ref} className={`${className} auto-resize-textarea`} value={value} {...props} />;
};
