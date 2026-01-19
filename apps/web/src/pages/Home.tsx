import { useNavigate } from 'react-router-dom';
import {
  ShellBar,
  Page,
  Bar,
  Button,
  Title,
  IllustratedMessage,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/add.js';
import '@ui5/webcomponents-icons/dist/search.js';
import '@ui5/webcomponents-icons/dist/action-settings.js';

function Home() {
  const navigate = useNavigate();

  const handleCreateProject = () => {
    navigate('/product-selection');
  };

  return (
    <>
      <ShellBar
        primaryTitle="The Fashion Trend Alchemist"
        showNotifications
        showProductSwitch={false}
      />
      
      <Page
        style={{ height: 'calc(100vh - 44px)' }}
        header={
          <Bar
            design="Header"
            startContent={
              <Title level="H3">Projects (0)</Title>
            }
            endContent={
              <>
                <Button icon="action-settings" design="Transparent" />
                <Button
                  icon="add"
                  design="Emphasized"
                  onClick={handleCreateProject}
                >
                  Create New Project
                </Button>
              </>
            }
          />
        }
      >
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          padding: '2rem'
        }}>
          <IllustratedMessage
            name="NoData"
            titleText="No Projects Yet"
            subtitleText="Create your first project to start analyzing fashion trends"
          >
            <Button
              design="Emphasized"
              icon="add"
              onClick={handleCreateProject}
            >
              Create New Project
            </Button>
          </IllustratedMessage>
        </div>
      </Page>
    </>
  );
}

export default Home;
