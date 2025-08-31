import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useAuth } from '../helpers/useAuth';
import { useDashboardAnalytics, useRecentActivity, useStudentsList } from '../helpers/useDashboard';
import { AlertCircle, ArrowRight, BarChart2, Users, Activity, BookCheck } from 'lucide-react';
import { Skeleton } from '../components/Skeleton';
import { Button } from '../components/Button';
import styles from './dashboard.module.css';

const Dashboard = () => {
  const { authState } = useAuth();

  const { data: analyticsData, isFetching: isAnalyticsFetching, error: analyticsError } = useDashboardAnalytics({ period: 'monthly' });
  const { data: studentsData, isFetching: isStudentsFetching, error: studentsError } = useStudentsList({ offset: 0, limit: 5, sortBy: 'createdAt', sortDirection: 'desc' });
  const { data: activityData, isFetching: isActivityFetching, error: activityError } = useRecentActivity({ offset: 0, limit: 5 });

  const isLoading = isAnalyticsFetching || isStudentsFetching || isActivityFetching;
  const error = analyticsError || studentsError || activityError;

  const user = authState.type === 'authenticated' ? authState.user : null;

  const renderContent = () => {
    if (isLoading) {
      return <DashboardSkeleton />;
    }

    if (error) {
      return (
        <div className={styles.errorState}>
          <AlertCircle size={48} />
          <h3>Failed to load dashboard data</h3>
          <p>{error instanceof Error ? error.message : 'An unknown error occurred.'}</p>
        </div>
      );
    }

    return (
      <>
        <div className={styles.statsGrid}>
          <StatCard
            icon={<Users />}
            title="Total Students"
            value={analyticsData?.totalStudents ?? 0}
            description="Students in your roster"
          />
          <StatCard
            icon={<Activity />}
            title="Active Students"
            value={analyticsData?.activeStudents ?? 0}
            description="In the last month"
          />
          <StatCard
            icon={<BookCheck />}
            title="Materials Completed"
            value={analyticsData?.materialsCompleted ?? 0}
            description="Across all students"
          />
          <StatCard
            icon={<BarChart2 />}
            title="Avg. Reading Time"
            value={`${((analyticsData?.avgReadingTime ?? 0) / 60).toFixed(1)} min`}
            description="Per session"
          />
        </div>

        <div className={styles.mainGrid}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Recent Students</h3>
              <Button variant="ghost" asChild>
                <Link to="/dashboard/students">View All <ArrowRight size={16} /></Link>
              </Button>
            </div>
            <div className={styles.studentList}>
              {studentsData?.students.length === 0 && <p className={styles.emptyText}>No students found.</p>}
              {studentsData?.students.map(student => (
                <div key={student.id} className={styles.studentItem}>
                  <img
                    src={student.avatarUrl || `https://api.dicebear.com/8.x/bottts/svg?seed=${student.id}`}
                    alt={student.displayName}
                    className={styles.avatar}
                  />
                  <div className={styles.studentInfo}>
                    <p className={styles.studentName}>{student.displayName}</p>
                    <p className={styles.studentLevel}>{student.currentReadingLevel?.replace('_', ' ') ?? 'Not assessed'}</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/dashboard/reports?studentId=${student.id}`}>View Report</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Recent Activity</h3>
            </div>
            <div className={styles.activityFeed}>
              {activityData?.activities.length === 0 && <p className={styles.emptyText}>No recent activity.</p>}
              {activityData?.activities.map(activity => (
                <div key={activity.id} className={styles.activityItem}>
                  <div className={styles.activityIcon}>
                    {activity.type === 'material_completed' ? <BookCheck size={18} /> : <Activity size={18} />}
                  </div>
                  <div className={styles.activityDetails}>
                    <p>
                      <strong>{activity.studentName}</strong> {activity.details}
                    </p>
                    <time className={styles.activityTimestamp}>
                      {new Date(activity.timestamp).toLocaleString()}
                    </time>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>Educator Dashboard</title>
        <meta name="description" content="Monitor student reading progress and view key analytics." />
      </Helmet>

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome, {user?.displayName ?? 'Educator'}!</h1>
          <p className={styles.subtitle}>Here's a summary of your students' progress.</p>
        </div>
        <Button size="lg" asChild>
          <Link to="/dashboard/reports">
            <BarChart2 size={18} />
            <span>View Detailed Reports</span>
          </Link>
        </Button>
      </header>

      {renderContent()}
    </div>
  );
};

export default Dashboard;

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  description: string;
}

const StatCard = ({ icon, title, value, description }: StatCardProps) => (
  <div className={styles.statCard}>
    <div className={styles.statIcon}>{icon}</div>
    <div className={styles.statContent}>
      <p className={styles.statValue}>{value}</p>
      <h4 className={styles.statTitle}>{title}</h4>
      <p className={styles.statDescription}>{description}</p>
    </div>
  </div>
);

const DashboardSkeleton = () => (
  <>
    <div className={styles.statsGrid}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className={styles.statCard}>
          <Skeleton style={{ width: '48px', height: '48px', borderRadius: 'var(--radius)' }} />
          <div className={styles.statContent}>
            <Skeleton style={{ width: '80px', height: '2.25rem', marginBottom: 'var(--spacing-2)' }} />
            <Skeleton style={{ width: '120px', height: '1.25rem', marginBottom: 'var(--spacing-1)' }} />
            <Skeleton style={{ width: '100px', height: '1rem' }} />
          </div>
        </div>
      ))}
    </div>
    <div className={styles.mainGrid}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <Skeleton style={{ width: '200px', height: '1.75rem' }} />
          <Skeleton style={{ width: '100px', height: '2.25rem' }} />
        </div>
        <div className={styles.studentList}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className={styles.studentItem}>
              <Skeleton style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-full)' }} />
              <div className={styles.studentInfo} style={{ flex: 1 }}>
                <Skeleton style={{ width: '60%', height: '1.25rem' }} />
                <Skeleton style={{ width: '40%', height: '1rem', marginTop: 'var(--spacing-1)' }} />
              </div>
              <Skeleton style={{ width: '110px', height: '2rem' }} />
            </div>
          ))}
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <Skeleton style={{ width: '200px', height: '1.75rem' }} />
        </div>
        <div className={styles.activityFeed}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className={styles.activityItem}>
              <Skeleton style={{ width: '36px', height: '36px', borderRadius: 'var(--radius)' }} />
              <div className={styles.activityDetails} style={{ flex: 1 }}>
                <Skeleton style={{ width: '80%', height: '1rem' }} />
                <Skeleton style={{ width: '50%', height: '0.875rem', marginTop: 'var(--spacing-1)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </>
);