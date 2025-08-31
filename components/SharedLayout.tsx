import React, { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { BookHeart } from 'lucide-react';
import styles from './SharedLayout.module.css';

interface SharedLayoutProps {
  children: ReactNode;
}

export const SharedLayout = ({ children }: SharedLayoutProps) => {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.container}>
          <Link to="/" className={styles.logo}>
            <BookHeart size={28} className={styles.logoIcon} />
            <span className={styles.logoText}>Reading Support</span>
          </Link>
          <nav className={styles.nav}>
            <NavLink
              to="/"
              className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.active}` : styles.navLink)}
              end
            >
              Home
            </NavLink>
            <NavLink
              to="/materials"
              className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.active}` : styles.navLink)}
            >
              Library
            </NavLink>
          </nav>
        </div>
      </header>
      <main className={styles.main}>
        <div className={styles.container}>
          {children}
        </div>
      </main>
      <footer className={styles.footer}>
        <div className={styles.container}>
          <p>&copy; {new Date().getFullYear()} Special Education Reading Support System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};