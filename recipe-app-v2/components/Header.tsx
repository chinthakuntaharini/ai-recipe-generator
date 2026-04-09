'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="app-header">
      <div className="header-container">
        <Link href="/" className="logo">
          <span className="logo-icon">🍳</span>
          <span className="logo-text">AI Recipe Generator</span>
        </Link>

        <nav className="nav-menu">
          <Link 
            href="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
          >
            Generate Recipe
          </Link>
          <Link 
            href="/history" 
            className={`nav-link ${isActive('/history') ? 'active' : ''}`}
          >
            My Recipes
          </Link>
          <Link 
            href="/profile" 
            className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
          >
            Profile
          </Link>
        </nav>
      </div>
    </header>
  );
}
