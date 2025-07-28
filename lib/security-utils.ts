// Security utilities for production environment

export const preventRightClick = () => {
  if (process.env.NODE_ENV !== 'production') return;

  // Sağ tık engelleme
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    console.log('🚫 Sağ tık bu sitede engellenmiştir.');
  });

  // F12, Ctrl+Shift+I, Ctrl+U engelleme
  document.addEventListener('keydown', (e) => {
    // F12
    if (e.key === 'F12') {
      e.preventDefault();
      console.log('🚫 Developer Tools açmaya çalışıyorsunuz. Bu güvenlik nedeniyle engellenmiştir.');
      return false;
    }
    
    // Ctrl+Shift+I (DevTools)
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      console.log('🚫 Developer Tools kısayolu engellenmiştir.');
      return false;
    }
    
    // Ctrl+U (View Source)
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      console.log('🚫 Kaynak kodunu görüntüleme engellenmiştir.');
      return false;
    }
    
    // Ctrl+S (Save Page)
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      console.log('🚫 Sayfa kaydetme engellenmiştir.');
      return false;
    }
  });
};

export const obfuscateConsole = () => {
  if (process.env.NODE_ENV !== 'production') return;

  // Console'u tamamen temizle
  console.clear();
  
  // Console metodlarını no-op yap
  const noop = () => {};
  
  ['log', 'warn', 'error', 'info', 'debug', 'trace'].forEach(method => {
    (console as any)[method] = noop;
  });
  
  // Tek bir güvenlik mesajı bırak
  setTimeout(() => {
    document.head.insertAdjacentHTML('beforeend', `
      <script>
        console.log('%cEnbal Sigorta - Güvenlik Sistemi Aktif', 'color: #e74c3c; font-size: 20px; font-weight: bold;');
        console.log('%cBu uygulama güvenlik nedeniyle console logları gizler.', 'color: #34495e; font-size: 14px;');
      </script>
    `);
  }, 1000);
};

export const hideSourceCode = () => {
  if (process.env.NODE_ENV !== 'production') return;

  // Meta tag ekle
  const meta = document.createElement('meta');
  meta.name = 'robots';
  meta.content = 'index, follow';

  document.head.appendChild(meta);
  
  // Telif hakkı bildirimi
  document.head.insertAdjacentHTML('beforeend', `
    <!--
    
    Bu web sitesi Enbal Sigorta tarafından geliştirilmiştir.
    Kaynak kodlar telif hakkı ile korunmaktadır.
    İzinsiz kopyalama yasaktır.
    
    Copyright © ${new Date().getFullYear()} Enbal Sigorta
    
    -->
  `);
};
