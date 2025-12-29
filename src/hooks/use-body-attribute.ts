import { useEffect } from 'react';

export function useBodyAttribute(attribute: string, enabled: boolean) {
  useEffect(() => {
    if (enabled) {
      document.body.setAttribute(attribute, '1');
    } else {
      document.body.removeAttribute(attribute);
    }
    return () => {
      document.body.removeAttribute(attribute);
    };
  }, [attribute, enabled]);
}
