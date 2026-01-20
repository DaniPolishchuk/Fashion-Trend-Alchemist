import { Title } from '@ui5/webcomponents-react';

function EnhancedTableTab() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        background: 'var(--sapList_Background)',
        borderRadius: '0.5rem',
        border: '1px solid var(--sapList_BorderColor)',
      }}
    >
      <Title level="H3" style={{ color: 'var(--sapContent_LabelColor)' }}>
        Enhanced Table
      </Title>
    </div>
  );
}

export default EnhancedTableTab;
