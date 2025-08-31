import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { BookOpen, Zap, Users, Accessibility, Award } from 'lucide-react';
import { Button } from '../components/Button';
import styles from './_index.module.css';

const features = [
  {
    icon: <BookOpen size={32} className={styles.featureIcon} />,
    title: 'Free & Diverse Library',
    description: 'Access a growing collection of stories, articles, and poems tailored for different reading levels, completely free.',
  },
  {
    icon: <Zap size={32} className={styles.featureIcon} />,
    title: 'Engaging & Interactive',
    description: 'Multisensory learning and gamification elements keep students motivated and focused on their reading journey.',
  },
  {
    icon: <Accessibility size={32} className={styles.featureIcon} />,
    title: 'Accessibility First',
    description: 'Built-in text-to-speech, adjustable fonts, and high-contrast themes ensure a comfortable reading experience for everyone.',
  },
  {
    icon: <Users size={32} className={styles.featureIcon} />,
    title: 'For Educators & Parents',
    description: 'Empowering tools and resources designed to support both teachers in the classroom and parents at home.',
  },
];

const IndexPage = () => {
  return (
    <>
      <Helmet>
        <title>Reading Support System | Empowering Every Reader</title>
        <meta
          name="description"
          content="A free, accessible reading support system for special education teachers and parents. Discover engaging materials with text-to-speech and multisensory learning."
        />
      </Helmet>
      <div className={styles.pageContainer}>
        <header className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Unlock the Joy of Reading for Every Child</h1>
            <p className={styles.heroSubtitle}>
              A free, accessible platform designed for special education. We provide engaging, multisensory reading materials to help every student succeed.
            </p>
            <div className={styles.heroActions}>
              <Button asChild size="lg">
                <Link to="/materials">Explore Reading Library</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="#features">Learn More</Link>
              </Button>
            </div>
          </div>
          <div className={styles.heroImageContainer}>
            <img
              src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1622&q=80"
              alt="A child happily reading a book in a classroom"
              className={styles.heroImage}
            />
          </div>
        </header>

        <main id="features" className={styles.featuresSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Designed for Their Success</h2>
            <p className={styles.sectionSubtitle}>
              We address the key challenges in special education reading with powerful, easy-to-use features.
            </p>
          </div>
          <div className={styles.featuresGrid}>
            {features.map((feature) => (
              <div key={feature.title} className={styles.featureCard}>
                {feature.icon}
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </div>
            ))}
          </div>
        </main>

        <section className={styles.ctaSection}>
          <div className={styles.ctaContent}>
            <Award size={48} className={styles.ctaIcon} />
            <h2 className={styles.ctaTitle}>Ready to Make a Difference?</h2>
            <p className={styles.ctaText}>
              Start exploring our library of reading materials today. No sign-up required, no hidden costs. Just quality resources for your students.
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link to="/materials">Browse Free Materials</Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
};

export default IndexPage;