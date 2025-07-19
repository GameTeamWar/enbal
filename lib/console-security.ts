// Console Security Guard - Production ortamında hassas bilgileri gizle

export const initConsoleSecurityGuard = () => {
  // ✅ Sadece production ortamında çalışır
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔧 Development mode - Console security guard disabled');
    return;
  }

  // ✅ Facebook tarzı güvenlik uyarısı
  const showSecurityWarning = () => {
    const styles = {
      title: 'color: #e74c3c; font-size: 30px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);',
      warning: 'color: #c0392b; font-size: 16px; font-weight: bold; line-height: 1.5;',
      info: 'color: #2c3e50; font-size: 14px; line-height: 1.4;',
      link: 'color: #3498db; font-size: 14px; text-decoration: underline;'
    };

    console.log('%cDUR!', styles.title);
    console.log('');
    console.log(
      '%cBu, geliştiriciler için tasarlanmış bir tarayıcı özelliğidir. ' +
      'Biri sana bir Enbal Sigorta özelliğini etkinleştirmek veya birinin hesabını ele geçirmek için ' +
      'bir şeyi kopyalayıp buraya yapıştırmanı söylediyse, bu bir dolandırıcılıktır ve ' +
      'bunu yapmanı söyleyen kişi sen bunu yaptığında senin hesabına erişebilecektir.',
      styles.warning
    );
    console.log('');
    console.log(
      '%cGüvenliğin için asla bilinmeyen kodları buraya yapıştırma! ' +
      'Eğer tam olarak ne yaptığını bilmiyorsan, bu pencereyi kapat.',
      styles.info
    );
    console.log('');
    console.log('%cDaha fazla bilgi: https://enbalsigorta.com/guvenlik', styles.link);
    console.log('');
    console.log('%c⚠️ Enbal Sigorta Güvenlik Ekibi', 'color: #e67e22; font-weight: bold;');
  };

  // ✅ Console metodlarını override et (sadece production'da)
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug
  };

  // ✅ Hassas bilgileri filtrele
  const filterSensitiveData = (args: any[]) => {
    return args.map(arg => {
      if (typeof arg === 'string') {
        // Firebase config bilgilerini gizle
        let filtered = arg
          .replace(/AIzaSy[A-Za-z0-9_-]{33}/g, 'AIzaSy***[FILTERED]***')
          .replace(/enbal-c028e/g, 'project-***[FILTERED]***')
          .replace(/565874833407/g, '***[FILTERED]***')
          .replace(/firebase\.com/g, '***[FILTERED]***.com')
          .replace(/firebaseapp\.com/g, '***[FILTERED]***.com');
        
        return filtered;
      }
      
      if (typeof arg === 'object' && arg !== null) {
        // Objelerdeki hassas bilgileri gizle
        try {
          const stringified = JSON.stringify(arg);
          if (stringified.includes('apiKey') || stringified.includes('firebase') || stringified.includes('enbal-c028e')) {
            return '[SENSITIVE_OBJECT_FILTERED]';
          }
        } catch (e) {
          // JSON.stringify hatası
        }
      }
      
      return arg;
    });
  };

  // ✅ Console metodlarını güvenli versiyonlarla değiştir
  console.log = (...args: any[]) => {
    originalConsole.log(...filterSensitiveData(args));
  };

  console.warn = (...args: any[]) => {
    originalConsole.warn(...filterSensitiveData(args));
  };

  console.error = (...args: any[]) => {
    originalConsole.error(...filterSensitiveData(args));
  };

  console.info = (...args: any[]) => {
    originalConsole.info(...filterSensitiveData(args));
  };

  console.debug = (...args: any[]) => {
    originalConsole.debug(...filterSensitiveData(args));
  };

  // ✅ Güvenlik uyarısını göster
  setTimeout(showSecurityWarning, 1000);
  
  // ✅ Periyodik uyarı (her 5 dakikada bir)
  setInterval(showSecurityWarning, 5 * 60 * 1000);

  console.log('🛡️ Console security guard initialized');
};

// ✅ DevTools açılma tespiti
export const detectDevTools = () => {
  if (process.env.NODE_ENV !== 'production') return;

  let devtools = false;
  
  setInterval(() => {
    const threshold = 160;
    
    if (window.outerHeight - window.innerHeight > threshold || 
        window.outerWidth - window.innerWidth > threshold) {
      if (!devtools) {
        devtools = true;
        console.log(
          '%c🚨 GÜVENLIK UYARISI 🚨\n' +
          'Developer Tools tespit edildi!\n' +
          'Lütfen bilinmeyen kodları çalıştırmayın!',
          'color: red; font-size: 20px; font-weight: bold;'
        );
      }
    } else {
      devtools = false;
    }
  }, 500);
};
