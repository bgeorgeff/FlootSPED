import React, { useState } from 'react';
import { useRewards, useUnlockReward } from '../helpers/useGamification';
import { Skeleton } from './Skeleton';
import { Button } from './Button';
import { Badge } from './Badge';
import { Gift, Lock, CheckCircle, Coins } from 'lucide-react';
import styles from './ReadingRewards.module.css';
import { RewardWithStatus } from '../endpoints/gamification/rewards_GET.schema';

interface RewardCardProps {
  reward: RewardWithStatus;
  userPoints: number;
  onUnlock: (rewardId: number) => void;
  isUnlocking: boolean;
}

const RewardCard: React.FC<RewardCardProps> = ({ reward, userPoints, onUnlock, isUnlocking }) => {
  const { id, name, description, costPoints, isUnlocked, rewardType } = reward;
  const canAfford = userPoints >= costPoints;

  return (
    <div className={`${styles.card} ${isUnlocked ? styles.unlocked : ''}`}>
      <div className={styles.cardIconWrapper}>
        <Gift size={40} className={styles.cardIcon} />
      </div>
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>{name}</h3>
          {rewardType && <Badge variant="outline">{rewardType}</Badge>}
        </div>
        <p className={styles.cardDescription}>{description}</p>
        <div className={styles.cardFooter}>
          <div className={styles.points}>
            <Coins size={16} />
            <span>{costPoints} Points</span>
          </div>
          {isUnlocked ? (
            <div className={styles.unlockedStatus}>
              <CheckCircle size={16} />
              <span>Unlocked</span>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => onUnlock(id)}
              disabled={!canAfford || isUnlocking}
            >
              {isUnlocking ? 'Unlocking...' : (
                <>
                  <Lock size={14} />
                  <span>Unlock</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const RewardSkeleton: React.FC = () => (
  <div className={styles.card}>
    <div className={styles.cardIconWrapper}>
      <Skeleton style={{ width: '40px', height: '40px', borderRadius: 'var(--radius)' }} />
    </div>
    <div className={styles.cardContent}>
      <div className={styles.cardHeader}>
        <Skeleton style={{ width: '120px', height: '1.25rem' }} />
        <Skeleton style={{ width: '70px', height: '1.25rem', borderRadius: 'var(--radius-full)' }} />
      </div>
      <Skeleton style={{ width: '90%', height: '1rem', marginTop: 'var(--spacing-2)' }} />
      <div className={styles.cardFooter}>
        <Skeleton style={{ width: '80px', height: '1.25rem' }} />
        <Skeleton style={{ width: '90px', height: '1.5rem', borderRadius: 'var(--radius)' }} />
      </div>
    </div>
  </div>
);

export const ReadingRewards = ({ className }: { className?: string }) => {
  const { data, isFetching, error } = useRewards();
  const { mutate: unlockReward, isPending: isUnlocking } = useUnlockReward();
  const [rewardTypeFilter, setRewardTypeFilter] = useState<string>('all');

  const rewardTypes = React.useMemo(() => {
    if (!data?.rewards) return ['all'];
    const types = new Set(data.rewards.map(r => r.rewardType).filter(Boolean) as string[]);
    return ['all', ...Array.from(types)];
  }, [data]);

  const filteredRewards = React.useMemo(() => {
    if (!data?.rewards) return [];
    if (rewardTypeFilter === 'all') return data.rewards;
    return data.rewards.filter(r => r.rewardType === rewardTypeFilter);
  }, [data, rewardTypeFilter]);

  const renderContent = () => {
    if (isFetching) {
      return (
        <div className={styles.grid}>
          {Array.from({ length: 4 }).map((_, i) => <RewardSkeleton key={i} />)}
        </div>
      );
    }

    if (error) {
      return <div className={styles.error}>Failed to load rewards: {error.message}</div>;
    }

    if (!filteredRewards || filteredRewards.length === 0) {
      return <div className={styles.empty}>No rewards available in this category.</div>;
    }

    return (
      <div className={styles.grid}>
        {filteredRewards.map((reward) => (
          <RewardCard
            key={reward.id}
            reward={reward}
            userPoints={data?.userPoints ?? 0}
            onUnlock={(rewardId) => unlockReward({ rewardId })}
            isUnlocking={isUnlocking}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <header className={styles.header}>
        <h2 className={styles.title}>Rewards Catalog</h2>
        <div className={styles.pointsBalance}>
          <Coins size={20} />
          <span>Your Points:</span>
          {isFetching ? (
            <Skeleton style={{ width: '50px', height: '1.5rem' }} />
          ) : (
            <span className={styles.pointsValue}>{data?.userPoints ?? 0}</span>
          )}
        </div>
      </header>
      <div className={styles.filters}>
        {rewardTypes.map(type => (
          <Button
            key={type}
            variant={rewardTypeFilter === type ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setRewardTypeFilter(type)}
            className={styles.filterButton}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Button>
        ))}
      </div>
      {renderContent()}
    </div>
  );
};