import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import { reloadOnceForStaleChunks } from './app/components/route-error';
import './styles/index.css';

// A deploy replaces hashed chunks; a tab opened before it fails to preload
// them. Reload once to pick up the new build instead of showing a broken page.
window.addEventListener('vite:preloadError', (event) => {
  if (reloadOnceForStaleChunks()) event.preventDefault();
});

createRoot(document.getElementById('root')!).render(<App />);
