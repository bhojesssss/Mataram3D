import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

/*
  Tanpa <StrictMode>. Di development StrictMode memasang tiap efek dua kali,
  yang berarti membuat lalu membuang satu konteks WebGL penuh beserta seluruh
  geometri pendopo pada tiap muat halaman. Boot-nya jadi lambat tanpa menambah
  informasi apa pun tentang scene 3D.
*/
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
