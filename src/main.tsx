import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import { reloadOnceForStaleChunks } from './app/components/route-error';
// Self-hosted brand fonts (served from /assets, allowed by the strict CSP;
// no third-party font requests). unicode-range keeps downloads to the
// scripts actually rendered (Latin / Cyrillic incl. Kazakh letters).
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fontsource/poppins/800.css';
import './styles/index.css';

// A deploy replaces hashed chunks; a tab opened before it fails to preload
// them. Reload once to pick up the new build instead of showing a broken page.
window.addEventListener('vite:preloadError', (event) => {
  if (reloadOnceForStaleChunks()) event.preventDefault();
});

createRoot(document.getElementById('root')!).render(<App />);
