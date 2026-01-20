import { Title } from '@ui5/webcomponents-react';

function DataAnalysisTab() {
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
        Data Analysis
      </Title>
    </div>
  );
}

export default DataAnalysisTab;
