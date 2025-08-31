import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { LogIn, UserPlus } from 'lucide-react';
import { PasswordLoginForm } from '../components/PasswordLoginForm';
import { PasswordRegisterForm } from '../components/PasswordRegisterForm';
import { useAuth } from '../helpers/useAuth';
import styles from './login.module.css';
import { Button } from '../components/Button';

const LoginPage: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const { authState } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authState.type === 'authenticated') {
      navigate('/');
    }
  }, [authState, navigate]);

  const toggleForm = () => {
    setIsRegistering((prev) => !prev);
  };

  // Don't render the form until we know the user is unauthenticated
  if (authState.type !== 'unauthenticated') {
    // You can render a loading spinner here if you prefer
    return null;
  }

  return (
    <>
      <Helmet>
        <title>
          {isRegistering ? 'Create Account' : 'Log In'} | Special Education
          Reading Support
        </title>
        <meta
          name="description"
          content="Log in or create an account to access personalized reading support tools for special education."
        />
      </Helmet>
      <div className={styles.container}>
        <main className={styles.card}>
          <header className={styles.header}>
            <Link to="/" className={styles.logo}>
              Reading Support
            </Link>
            <h1 className={styles.title}>
              {isRegistering ? 'Create Your Account' : 'Welcome Back'}
            </h1>
            <p className={styles.subtitle}>
              {isRegistering
                ? 'Join our community to empower struggling readers.'
                : 'Sign in to continue your journey.'}
            </p>
          </header>

          <div className={styles.formContainer}>
            {isRegistering ? (
              <PasswordRegisterForm />
            ) : (
              <PasswordLoginForm />
            )}
          </div>

          <footer className={styles.footer}>
            <p className={styles.toggleText}>
              {isRegistering
                ? 'Already have an account?'
                : "Don't have an account?"}
              <Button variant="link" onClick={toggleForm} className={styles.toggleLink}>
                {isRegistering ? 'Log In' : 'Create one'}
              </Button>
            </p>
          </footer>
        </main>
      </div>
    </>
  );
};

export default LoginPage;