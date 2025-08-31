import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams } from 'react-router-dom';
import { useStudentsList, useStudentProgress } from '../helpers/useDashboard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/Select';
import { Skeleton } from '../components/Skeleton';
import { AlertCircle, User, BarChart, BookOpen, MousePointerClick } from 'lucide-react';
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../components/Chart';
import styles from './dashboard.reports.module.css';

const Reports = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const studentId = searchParams.get('studentId');

  const { data: studentsData, isFetching: isStudentsFetching } = useStudentsList({ offset: 0, limit: 100, sortBy: 'displayName', sortDirection: 'asc' });

  const handleStudentChange = (id: string) => {
    setSearchParams({ studentId: id });
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>Detailed Reports</title>
        <meta name="description" content="View detailed reading progress reports for individual students." />
      </Helmet>

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Detailed Reports</h1>
          <p className={styles.subtitle}>Select a student to view their progress and reading analytics.</p>
        </div>
        <div className={styles.studentSelector}>
          {isStudentsFetching ? (
            <Skeleton style={{ width: '250px', height: '40px' }} />
          ) : (
            <Select onValueChange={handleStudentChange} value={studentId ?? undefined}>
              <SelectTrigger>
                <SelectValue placeholder="Select a student..." />
              </SelectTrigger>
              <SelectContent>
                {studentsData?.students.map(student => (
                  <SelectItem key={student.id} value={String(student.id)}>
                    {student.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </header>

      <main className={styles.mainContent}>
        {studentId ? (
          <StudentReport studentId={Number(studentId)} />
        ) : (
          <div className={styles.placeholder}>
            <User size={64} />
            <h2>Select a Student</h2>
            <p>Choose a student from the dropdown above to see their detailed report.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Reports;

const StudentReport = ({ studentId }: { studentId: number }) => {
  const { data, isFetching, error } = useStudentProgress({ studentId });

  const readingTimeByLevel = useMemo(() => {
    if (!data) return [];
    const byLevel = data.readingSessions.reduce((acc, session) => {
      const level = session.readingLevel.replace('_', ' ');
      if (!acc[level]) {
        acc[level] = 0;
      }
      acc[level] += (session.durationSeconds ?? 0) / 60; // to minutes
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(byLevel).map(([level, time]) => ({ level, time: parseFloat(time.toFixed(1)) }));
  }, [data]);

  if (isFetching) {
    return <ReportSkeleton />;
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <AlertCircle size={48} />
        <h3>Could not load report</h3>
        <p>{error instanceof Error ? error.message : 'An unknown error occurred.'}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.placeholder}>
        <AlertCircle size={64} />
        <h2>No Data Available</h2>
        <p>There is no progress data available for this student yet.</p>
      </div>
    );
  }

  const { student, readingSessions, wordClickStats } = data;
  const totalSessions = readingSessions.length;
  const completedMaterials = readingSessions.filter(s => s.completed).length;
  const totalWordsClicked = wordClickStats.reduce((sum, word) => sum + (word.clickCount ?? 0), 0);

  return (
    <div className={styles.reportContainer}>
      <div className={styles.studentHeader}>
        <img
          src={student.avatarUrl || `https://api.dicebear.com/8.x/bottts/svg?seed=${student.id}`}
          alt={student.displayName}
          className={styles.avatar}
        />
        <h2>{student.displayName}'s Report</h2>
      </div>

      <div className={styles.statsGrid}>
        <StatCard icon={<BookOpen />} title="Reading Sessions" value={totalSessions} />
        <StatCard icon={<BarChart />} title="Materials Completed" value={completedMaterials} />
        <StatCard icon={<MousePointerClick />} title="Words Clicked" value={totalWordsClicked} />
      </div>

      <div className={styles.chartGrid}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Reading Time by Level (minutes)</h3>
          <div className={styles.chartContainer}>
            <ChartContainer config={{ time: { label: 'Time (min)', color: 'var(--chart-color-1)' } }}>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={readingTimeByLevel} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="level" tick={{ style: { textTransform: 'capitalize' } }} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="time" fill="var(--chart-color-1)" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Most Clicked Words</h3>
          <div className={styles.wordList}>
            {wordClickStats.length > 0 ? (
              wordClickStats
                .slice(0, 10)
                .map(word => (
                  <div key={word.word} className={styles.wordItem}>
                    <span>{word.word}</span>
                    <span className={styles.wordCount}>{word.clickCount} clicks</span>
                  </div>
                ))
            ) : (
              <p className={styles.emptyText}>No words have been clicked yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value }: { icon: React.ReactNode; title: string; value: number | string }) => (
  <div className={styles.statCard}>
    <div className={styles.statIcon}>{icon}</div>
    <div>
      <p className={styles.statValue}>{value}</p>
      <h4 className={styles.statTitle}>{title}</h4>
    </div>
  </div>
);

const ReportSkeleton = () => (
  <div className={styles.reportContainer}>
    <div className={styles.studentHeader}>
      <Skeleton style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-full)' }} />
      <Skeleton style={{ width: '250px', height: '2rem' }} />
    </div>
    <div className={styles.statsGrid}>
      {[...Array(3)].map((_, i) => (
        <div key={i} className={styles.statCard}>
          <Skeleton style={{ width: '40px', height: '40px' }} />
          <div>
            <Skeleton style={{ width: '60px', height: '1.75rem', marginBottom: 'var(--spacing-2)' }} />
            <Skeleton style={{ width: '120px', height: '1rem' }} />
          </div>
        </div>
      ))}
    </div>
    <div className={styles.chartGrid}>
      <div className={styles.card}>
        <Skeleton style={{ width: '300px', height: '1.5rem', marginBottom: 'var(--spacing-6)' }} />
        <Skeleton style={{ width: '100%', height: '300px' }} />
      </div>
      <div className={styles.card}>
        <Skeleton style={{ width: '200px', height: '1.5rem', marginBottom: 'var(--spacing-6)' }} />
        <div className={styles.wordList}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className={styles.wordItem}>
              <Skeleton style={{ width: '80px', height: '1.25rem' }} />
              <Skeleton style={{ width: '100px', height: '1.25rem' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);