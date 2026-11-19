'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Explorar obras' },
  { href: '/collection', label: 'Minha coleção' },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <header className="navbar">
      <nav aria-label="Principal" className="navbar-inner">
        <Link href="/" className="brand">
          <span className="brand-name">Galeria de Arte</span>
          <span className="brand-sub">Acervo · Art Institute of Chicago</span>
        </Link>
        <ul className="nav-links">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} aria-current={pathname === l.href ? 'page' : undefined}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
