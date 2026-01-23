import React from 'react';
import { Icon, Button } from '@ui5/webcomponents-react';

interface AttributeSkeletonLoaderProps {
  variant: 'locked' | 'ai' | 'notIncluded';
  count?: number;
}

const shimmerKeyframes = `
  @keyframes shimmer {
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: calc(200px + 100%) 0;
    }
  }
`;

const shimmerStyle: React.CSSProperties = {
  background:
    'linear-gradient(90deg, var(--sapList_Background) 0px, var(--sapList_AlternatingBackground) 40px, var(--sapList_Background) 80px)',
  backgroundSize: '200px 100%',
  animation: 'shimmer 1.8s ease-in-out infinite',
  borderRadius: '4px',
};

const SkeletonCard: React.FC<{ variant: 'locked' | 'ai' | 'notIncluded' }> = ({ variant }) => {
  if (variant === 'locked') {
    return (
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.5rem',
          }}
        >
          <div
            style={{
              ...shimmerStyle,
              height: '1rem',
              width: '60%',
            }}
          />
          <Button
            icon="decline"
            design="Transparent"
            disabled
            style={{ minWidth: 'auto', padding: '0.25rem', opacity: 0.3 }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              ...shimmerStyle,
              height: '2.25rem',
              flex: 1,
              border: '1px solid var(--sapField_BorderColor)',
              borderRadius: '0.375rem',
            }}
          />
          <Button icon="arrow-right" design="Transparent" disabled style={{ opacity: 0.3 }} />
        </div>
      </div>
    );
  }

  if (variant === 'ai') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Button icon="arrow-left" design="Transparent" disabled style={{ opacity: 0.3 }} />
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            border: '1px solid #E9730C',
            borderRadius: '0.5rem',
            background: 'rgba(233, 115, 12, 0.05)',
          }}
        >
          <Icon
            name="ai"
            style={{
              color: '#E9730C',
              fontSize: '1.25rem',
              opacity: 0.3,
            }}
          />
          <div
            style={{
              ...shimmerStyle,
              height: '1rem',
              width: '50%',
            }}
          />
        </div>
        <Button
          icon="decline"
          design="Transparent"
          disabled
          style={{ minWidth: 'auto', opacity: 0.3 }}
        />
      </div>
    );
  }

  // notIncluded variant
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <Button icon="add" design="Transparent" disabled style={{ opacity: 0.3 }} />
      <div
        style={{
          flex: 1,
          padding: '0.75rem 1rem',
          border: '1px dashed var(--sapNeutralBorderColor)',
          borderRadius: '0.5rem',
          background: 'var(--sapNeutralBackground)',
        }}
      >
        <div
          style={{
            ...shimmerStyle,
            height: '1rem',
            width: '65%',
          }}
        />
      </div>
    </div>
  );
};

const AttributeSkeletonLoader: React.FC<AttributeSkeletonLoaderProps> = ({
  variant,
  count = 5,
}) => {
  return (
    <>
      {/* Inject shimmer keyframes */}
      <style>{shimmerKeyframes}</style>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: variant === 'locked' ? '1rem' : '0.75rem',
        }}
      >
        {Array.from({ length: count }, (_, index) => (
          <SkeletonCard key={index} variant={variant} />
        ))}
      </div>
    </>
  );
};

export default AttributeSkeletonLoader;
