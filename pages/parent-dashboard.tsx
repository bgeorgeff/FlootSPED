import React from 'react';
import { Helmet } from 'react-helmet';
import { ParentDashboard } from '../components/ParentDashboard';
import styles from './parent-dashboard.module.css';

const ParentDashboardPage = () => {
  return (
    <>
      <Helmet>
        <title>Parent Dashboard | Reading Support</title>
        <meta
          name="description"
          content="View your child's reading progress, track their streaks, and get personalized insights to support their learning journey."
        />
      </Helmet>
      <div className={styles.pageContainer}>
        <ParentDashboard />
      </div>
    </>
  );
};

export default ParentDashboardPage;