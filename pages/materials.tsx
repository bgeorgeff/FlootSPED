import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Search, BookText, Clock, BarChart3 } from 'lucide-react';
import { useDebounce } from '../helpers/useDebounce';
import { useMaterials } from '../helpers/readingMaterialsQueries';
import { ReadingLevelArrayValues, ContentTypeArrayValues, ReadingLevel, ContentType } from '../helpers/schema';
import { Input } from '../components/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/Select';
import { Badge } from '../components/Badge';
import { Skeleton } from '../components/Skeleton';
import styles from './materials.module.css';

const formatEnum = (value: string) => {
  return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const MaterialCardSkeleton = () => (
  <div className={styles.card}>
    <div className={styles.cardContent}>
      <Skeleton style={{ height: '1.5rem', width: '80%', marginBottom: 'var(--spacing-2)' }} />
      <Skeleton style={{ height: '1rem', width: '50%' }} />
      <div className={styles.cardMeta}>
        <Skeleton style={{ height: '1.25rem', width: '100px' }} />
        <Skeleton style={{ height: '1.25rem', width: '100px' }} />
        <Skeleton style={{ height: '1.25rem', width: '100px' }} />
      </div>
    </div>
    <div className={styles.cardFooter}>
      <Skeleton style={{ height: '2.5rem', width: '120px' }} />
    </div>
  </div>
);

const MaterialsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [readingLevel, setReadingLevel] = useState<ReadingLevel | 'all'>('all');
  const [contentType, setContentType] = useState<ContentType | 'all'>('all');

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filters = useMemo(() => ({
    readingLevel: readingLevel === 'all' ? undefined : readingLevel,
    contentType: contentType === 'all' ? undefined : contentType,
  }), [readingLevel, contentType]);

  const { data: materials, isFetching, error } = useMaterials(filters);

  const filteredMaterials = useMemo(() => {
    if (!materials) return [];
    return materials.filter(material =>
      material.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [materials, debouncedSearchTerm]);

  return (
    <>
      <Helmet>
        <title>Reading Materials Library</title>
        <meta name="description" content="Browse our library of reading materials for students. Filter by reading level and content type." />
      </Helmet>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Reading Materials Library</h1>
          <p className={styles.subtitle}>
            Discover engaging content tailored for every student.
          </p>
        </header>

        <div className={styles.filters}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} size={20} />
            <Input
              type="search"
              placeholder="Search by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.selectsWrapper}>
            <Select onValueChange={(value) => setReadingLevel(value as ReadingLevel | 'all')} value={readingLevel}>
              <SelectTrigger className={styles.selectTrigger}>
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reading Levels</SelectItem>
                {ReadingLevelArrayValues.map(level => (
                  <SelectItem key={level} value={level}>{formatEnum(level)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => setContentType(value as ContentType | 'all')} value={contentType}>
              <SelectTrigger className={styles.selectTrigger}>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Content Types</SelectItem>
                {ContentTypeArrayValues.map(type => (
                  <SelectItem key={type} value={type}>{formatEnum(type)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <main className={styles.grid}>
          {isFetching && Array.from({ length: 6 }).map((_, i) => <MaterialCardSkeleton key={i} />)}
          {!isFetching && error && (
            <div className={styles.errorState}>
              <p>Could not load materials. Please try again later.</p>
            </div>
          )}
          {!isFetching && !error && filteredMaterials.length === 0 && (
            <div className={styles.emptyState}>
              <p>No materials found. Try adjusting your filters.</p>
            </div>
          )}
          {!isFetching && !error && filteredMaterials.map(material => (
            <div key={material.id} className={styles.card}>
              <div className={styles.cardContent}>
                <h2 className={styles.cardTitle}>{material.title}</h2>
                <div className={styles.cardBadges}>
                  <Badge variant="default">{formatEnum(material.readingLevel)}</Badge>
                  <Badge variant="secondary">{formatEnum(material.contentType)}</Badge>
                </div>
                <div className={styles.cardMeta}>
                  <span><BookText size={16} /> {material.wordCount} words</span>
                  <span><Clock size={16} /> {material.estimatedReadingTimeMinutes} min read</span>
                </div>
              </div>
              <div className={styles.cardFooter}>
                <Link to={`/read/${material.id}`} className={styles.readLink}>
                  Start Reading
                </Link>
              </div>
            </div>
          ))}
        </main>
      </div>
    </>
  );
};

export default MaterialsPage;