'use client';
import { useState } from 'react';
import Link from 'next/link';
import { compareUrl } from '@/lib/planetUrl';
import styles from './NavBar.module.css';

const NAV_LINKS = [
  { href: '/explore', label: 'Explore' },
  { href: '/records', label: 'Records' },
  { href: compareUrl(null, null), label: 'Compare' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = () => setIsOpen(false);

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo} onClick={closeMenu}>
          <span className={styles.logoIcon} aria-hidden="true">🪐</span>
          <span className={styles.logoText}>ExoplanetHub</span>
        </Link>
        
        <button 
          className={`${styles.hamburger} ${isOpen ? styles.open : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
          aria-expanded={isOpen}
          aria-controls="nav-links"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div id="nav-links" className={`${styles.links} ${isOpen ? styles.showMobile : ''}`}>
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className={styles.link} onClick={closeMenu}>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
