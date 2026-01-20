import { useState, useEffect } from 'react';
import {
  Card,
  Title,
  Text,
  Button,
  Icon,
  Select,
  Option,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/arrow-right.js';
import '@ui5/webcomponents-icons/dist/arrow-left.js';
import '@ui5/webcomponents-icons/dist/locked.js';
import '@ui5/webcomponents-icons/dist/ai.js';

interface ProjectData {
  id: string;
  name: string;
  ontologySchema: Record<string, Record<string, string[]>> | null;
}

interface AttributeConfig {
  key: string;
  displayName: string;
  variants: string[];
  isLocked: boolean;
  selectedValue: string | null;
}

interface TheAlchemistTabProps {
  project: ProjectData;
}

function TheAlchemistTab({ project }: TheAlchemistTabProps) {
  const [attributes, setAttributes] = useState<AttributeConfig[]>([]);

  // Initialize attributes from ontology schema
  useEffect(() => {
    if (!project.ontologySchema) return;

    const initialAttributes: AttributeConfig[] = [];

    // Flatten the ontology schema - iterate through product types and their attributes
    Object.entries(project.ontologySchema).forEach(([productType, productAttributes]) => {
      if (typeof productAttributes === 'object' && productAttributes !== null) {
        Object.entries(productAttributes).forEach(([attrKey, variants]) => {
          if (Array.isArray(variants)) {
            initialAttributes.push({
              key: `${productType}_${attrKey}`,
              displayName: formatAttributeName(attrKey),
              variants: variants,
              isLocked: false, // Default all to AI Variable
              selectedValue: null,
            });
          }
        });
      }
    });

    setAttributes(initialAttributes);
  }, [project.ontologySchema]);

  // Format attribute name: convert snake_case to Title Case
  const formatAttributeName = (name: string): string => {
    return name
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Move attribute to locked
  const handleMoveToLocked = (key: string) => {
    setAttributes((prev) =>
      prev.map((attr) =>
        attr.key === key
          ? { ...attr, isLocked: true, selectedValue: attr.variants[0] || null }
          : attr
      )
    );
  };

  // Move attribute to AI Variable
  const handleMoveToAIVariable = (key: string) => {
    setAttributes((prev) =>
      prev.map((attr) =>
        attr.key === key ? { ...attr, isLocked: false, selectedValue: null } : attr
      )
    );
  };

  // Update selected value for locked attribute
  const handleValueChange = (key: string, value: string) => {
    setAttributes((prev) =>
      prev.map((attr) => (attr.key === key ? { ...attr, selectedValue: value } : attr))
    );
  };

  // Handle Transmute (Run RPT-1) button click
  const handleTransmute = () => {
    const lockedAttributes = attributes
      .filter((attr) => attr.isLocked)
      .map((attr) => ({
        attribute: attr.displayName,
        key: attr.key,
        value: attr.selectedValue,
      }));

    const aiVariables = attributes
      .filter((attr) => !attr.isLocked)
      .map((attr) => ({
        attribute: attr.displayName,
        key: attr.key,
        possibleValues: attr.variants,
      }));

    console.log('=== RPT-1 Transmutation Request ===');
    console.log('Project ID:', project.id);
    console.log('Project Name:', project.name);
    console.log('\nLocked Attributes (Fixed Input):');
    console.log(JSON.stringify(lockedAttributes, null, 2));
    console.log('\nAI Variables (To Predict):');
    console.log(JSON.stringify(aiVariables, null, 2));
    console.log('===================================');
  };

  const lockedAttributes = attributes.filter((attr) => attr.isLocked);
  const aiVariables = attributes.filter((attr) => !attr.isLocked);

  if (!project.ontologySchema) {
    return (
      <Card style={{ padding: '2rem', textAlign: 'center' }}>
        <Text>No ontology schema defined for this project.</Text>
      </Card>
    );
  }

  return (
    <div>
      <Card>
        {/* Card Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--sapList_BorderColor)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Icon name="ai" style={{ fontSize: '1.25rem', color: '#0070F2' }} />
            <div>
              <Title level="H4" style={{ marginBottom: '0.25rem' }}>
                Transmutation Parameters
              </Title>
              <Text style={{ color: 'var(--sapContent_LabelColor)', fontSize: '0.875rem' }}>
                Configure locked attributes and AI targets for generation run RPT-1
              </Text>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div style={{ display: 'flex', minHeight: '400px' }}>
          {/* Left Column: Locked Attributes */}
          <div
            style={{
              flex: 1,
              padding: '1.5rem',
              borderRight: '1px solid var(--sapList_BorderColor)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.5rem',
              }}
            >
              <Icon name="locked" style={{ color: 'var(--sapContent_LabelColor)' }} />
              <Text
                style={{
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.5px',
                  color: 'var(--sapContent_LabelColor)',
                }}
              >
                Locked Attributes
              </Text>
            </div>

            {lockedAttributes.length === 0 ? (
              <Text style={{ color: 'var(--sapContent_LabelColor)', fontStyle: 'italic' }}>
                No locked attributes. Move attributes here to fix their values.
              </Text>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {lockedAttributes.map((attr) => (
                  <div key={attr.key}>
                    <Text
                      style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      {attr.displayName}
                    </Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Select
                        style={{ flex: 1 }}
                        value={attr.selectedValue || ''}
                        onChange={(e: any) => handleValueChange(attr.key, e.detail.selectedOption.value)}
                      >
                        {attr.variants.map((variant) => (
                          <Option key={variant} value={variant}>
                            {variant}
                          </Option>
                        ))}
                      </Select>
                      <Button
                        icon="arrow-right"
                        design="Transparent"
                        tooltip="Move to AI Variables"
                        onClick={() => handleMoveToAIVariable(attr.key)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: AI Variables */}
          <div style={{ flex: 1, padding: '1.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.5rem',
              }}
            >
              <Icon name="ai" style={{ color: '#E9730C' }} />
              <Text
                style={{
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.5px',
                  color: '#E9730C',
                }}
              >
                AI Variables
              </Text>
            </div>

            {aiVariables.length === 0 ? (
              <Text style={{ color: 'var(--sapContent_LabelColor)', fontStyle: 'italic' }}>
                No AI variables. Move attributes here to have RPT-1 predict them.
              </Text>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {aiVariables.map((attr) => (
                  <div
                    key={attr.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <Button
                      icon="arrow-left"
                      design="Transparent"
                      tooltip="Move to Locked Attributes"
                      onClick={() => handleMoveToLocked(attr.key)}
                    />
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
                      <Text style={{ color: '#E9730C', fontWeight: 500 }}>[PREDICT]</Text>
                      <Text style={{ fontSize: '0.875rem' }}>{attr.displayName}</Text>
                    </div>
                    <Icon name="ai" style={{ color: '#E9730C' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer with Transmute Button */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--sapList_BorderColor)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
          }}
        >
          <Button
            design="Emphasized"
            icon="ai"
            onClick={handleTransmute}
            style={{
              background: 'linear-gradient(90deg, #0070F2 0%, #0050C8 100%)',
            }}
          >
            Transmute (Run RPT-1)
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default TheAlchemistTab;
