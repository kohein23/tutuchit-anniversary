import { useNavigate, useParams, useLocation } from 'react-router-dom';

export function useAppNavigate() {
  const navigate = useNavigate();
  const { siteId } = useParams();
  const location = useLocation();

  const appNavigate = (path: string | number) => {
    if (typeof path === 'number') {
      return navigate(path);
    }
    
    // If it's an absolute path (e.g. '/surprise', '/surprise/games')
    if (path.startsWith('/')) {
      const isVPrefix = location.pathname.startsWith('/v/');
      const currentSite = siteId || 'demo';
      
      if (isVPrefix) {
        navigate(`/v/${currentSite}${path === '/' ? '' : path}`);
      } else {
        navigate(`/${currentSite}${path === '/' ? '' : path}`);
      }
    } else {
      navigate(path);
    }
  };

  return appNavigate;
}
