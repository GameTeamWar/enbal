// app/layout.tsx - Hydration fix version
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Enbal Sigorta - Güvenli Yarınlar',
  description: 'Trafik, Kasko, Konut, DASK, Yangın ve Nakliye Sigortası',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Browser extension attribute cleanup
              (function() {
                // Remove browser extension attributes before React hydration
                const observer = new MutationObserver(function(mutations) {
                  mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes') {
                      const target = mutation.target;
                      if (target.nodeType === 1) {
                        // Remove common extension attributes
                        const extensionAttrs = [
                          'cz-shortcut-listen',
                          'data-new-gr-c-s-check-loaded',
                          'data-gr-ext-installed',
                          'spellcheck'
                        ];
                        extensionAttrs.forEach(attr => {
                          if (target.hasAttribute(attr)) {
                            target.removeAttribute(attr);
                          }
                        });
                      }
                    }
                  });
                });
                
                // Start observing before React hydrates
                if (typeof window !== 'undefined') {
                  document.addEventListener('DOMContentLoaded', function() {
                    observer.observe(document.body, {
                      attributes: true,
                      subtree: true,
                      attributeFilter: ['cz-shortcut-listen', 'data-new-gr-c-s-check-loaded', 'data-gr-ext-installed']
                    });
                  });
                }
              })();
            `,
          }}
        />
      </head>
      <body 
        className={inter.className}
        suppressHydrationWarning
      >
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}