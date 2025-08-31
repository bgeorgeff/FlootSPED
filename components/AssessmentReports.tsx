import React, { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { ProgressAnalytics } from '../helpers/useProgressAnalytics';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './Select';
import { Button } from './Button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartConfig,
} from './Chart';
import { Download, Share2 } from 'lucide-react';
import styles from './AssessmentReports.module.css';

interface AssessmentReportsProps {
  analytics: ProgressAnalytics;
  className?: string;
}

type ChartView = 'readingTime' | 'wordsClicked' | 'completionRate';

export const AssessmentReports = ({
  analytics,
  className,
}: AssessmentReportsProps) => {
  const [chartView, setChartView] = useState<ChartView>('readingTime');

  const {
    totalReadingTime,
    totalWordsClicked,
    totalMaterialsCompleted,
    completionRate,
    readingTimeByMonth,
    wordsClickedByMonth,
    completionByLevel,
  } = analytics;

  const timeChartConfig: ChartConfig = {
    time: { label: 'Reading Time (min)', color: 'var(--chart-color-1)' },
  };

  const wordsChartConfig: ChartConfig = {
    words: { label: 'Words Clicked', color: 'var(--chart-color-2)' },
  };

  const completionChartConfig: ChartConfig = {
    rate: { label: 'Completion Rate (%)', color: 'var(--chart-color-3)' },
  };

  const renderChart = () => {
    switch (chartView) {
      case 'readingTime':
        return (
          <ChartContainer config={timeChartConfig}>
            <LineChart data={readingTimeByMonth} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
              <Line type="monotone" dataKey="time" stroke="var(--color-time)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        );
      case 'wordsClicked':
        return (
          <ChartContainer config={wordsChartConfig}>
            <LineChart data={wordsClickedByMonth} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
              <Line type="monotone" dataKey="words" stroke="var(--color-words)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        );
      case 'completionRate':
        return (
          <ChartContainer config={completionChartConfig}>
            <BarChart data={completionByLevel} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="level" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis domain={[0, 100]} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="rate" fill="var(--color-rate)" radius={4} />
            </BarChart>
          </ChartContainer>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`${styles.card} ${className ?? ''}`}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Progress Reports</h2>
          <p className={styles.subtitle}>Visualize your growth over time.</p>
        </div>
        <div className={styles.actions}>
          <Button variant="outline" disabled>
            <Download size={16} />
            Export
          </Button>
          <Button variant="outline" disabled>
            <Share2 size={16} />
            Share
          </Button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h4 className={styles.statTitle}>Total Reading Time</h4>
          <p className={styles.statValue}>{totalReadingTime.toFixed(1)} <span className={styles.statUnit}>min</span></p>
        </div>
        <div className={styles.statCard}>
          <h4 className={styles.statTitle}>Vocabulary Help</h4>
          <p className={styles.statValue}>{totalWordsClicked} <span className={styles.statUnit}>words</span></p>
        </div>
        <div className={styles.statCard}>
          <h4 className={styles.statTitle}>Materials Completed</h4>
          <p className={styles.statValue}>{totalMaterialsCompleted} <span className={styles.statUnit}>items</span></p>
        </div>
        <div className={styles.statCard}>
          <h4 className={styles.statTitle}>Overall Completion</h4>
          <p className={styles.statValue}>{completionRate.toFixed(0)}<span className={styles.statUnit}>%</span></p>
        </div>
      </div>

      <div className={styles.chartSection}>
        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>
            {chartView === 'readingTime' && 'Reading Time Over Time'}
            {chartView === 'wordsClicked' && 'Vocabulary Help Over Time'}
            {chartView === 'completionRate' && 'Completion Rate by Level'}
          </h3>
          <Select value={chartView} onValueChange={(value) => setChartView(value as ChartView)}>
            <SelectTrigger className={styles.selectTrigger}>
              <SelectValue placeholder="Select a chart" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="readingTime">Reading Time</SelectItem>
              <SelectItem value="wordsClicked">Words Clicked</SelectItem>
              <SelectItem value="completionRate">Completion Rate</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className={styles.chartContainer}>
          {renderChart()}
        </div>
      </div>
    </div>
  );
};