import { useLocation } from 'react-router-dom';

export function useActiveRoute() {
  const location = useLocation();
  return location.pathname;
}
