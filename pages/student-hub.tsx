import React from 'react';
import { Helmet } from 'react-helmet';
import { StudentMotivationHub } from '../components/StudentMotivationHub';
import styles from './student-hub.module.css';

const StudentHubPage = () => {
  return (
    <div className={styles.container}>
      <Helmet>
        <title>My Hub | Reading Support</title>
        <meta name="description" content="Track your reading progress, unlock achievements, and earn rewards!" />
      </Helmet>
      <StudentMotivationHub />
    </div>
  );
};

export default StudentHubPage;