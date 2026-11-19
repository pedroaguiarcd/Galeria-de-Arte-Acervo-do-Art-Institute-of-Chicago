import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Galeria de Arte',
  description: 'Explore o acervo do Art Institute of Chicago e monte sua coleção pessoal.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Jost:wght@400;500&display=swap"
        />
      </head>
      <body>
        <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
        <Navbar />
        <main id="conteudo" tabIndex={-1}>{children}</main>
      </body>
    </html>
  );
}
