import React, { useState } from 'react';
import { Button, Drawer, Input, Space, Typography, message, Collapse, Switch, Divider, Card } from 'antd';
import { BugOutlined, KeyOutlined, CopyOutlined, DatabaseOutlined, TranslationOutlined } from '@ant-design/icons';
import { DatabaseService } from '../services/database.service';
import { Post } from '../types/database.types';
import { useTypeSafeTranslation } from '../utils/translationHelper';
import { useTranslation } from 'react-i18next';

const { Panel } = Collapse;
const { Text, Title } = Typography;

interface DebugMenuProps {
  showTest: boolean;
  setShowTest: (show: boolean) => void;
  useDirectClient: boolean;
  setUseDirectClient: (use: boolean) => void;
  showEnvDebug: boolean;
  setShowEnvDebug: (show: boolean) => void;
}

const DebugMenu: React.FC<DebugMenuProps> = ({
  showTest,
  setShowTest,
  useDirectClient,
  setUseDirectClient,
  showEnvDebug,
  setShowEnvDebug
}) => {
  const { t, i18n } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [testAccessCode, setTestAccessCode] = useState('');
  const [foundPost, setFoundPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEnvironment, setShowEnvironment] = useState(false);
  const [showTranslationDebug, setShowTranslationDebug] = useState(false);
  const [showAccessCodeTest, setShowAccessCodeTest] = useState(false);

  // Test access code
  const testAccessCodeHandler = async () => {
    if (!testAccessCode.trim()) {
      message.error(t('pleaseEnterAccessCode'));
      return;
    }

    setLoading(true);
    try {
      const post = await DatabaseService.getPostByAccessCode(testAccessCode);
      setFoundPost(post);
      if (post) {
        message.success(t('postFoundSuccess'));
      } else {
        message.error(t('postNotFound'));
      }
    } catch (error) {
      message.error(t('errorTestingAccessCode'));
      console.error(t('errorTestingAccessCode'), error);
    } finally {
      setLoading(false);
    }
  };

  // Generate new access code (for testing only)
  const generateNewAccessCode = async () => {
    setLoading(true);
    try {
      const accessCode = await DatabaseService.generateTestAccessCode();
      setTestAccessCode(accessCode);
      message.success(t('newAccessCodeGenerated'));
    } catch (error) {
      message.error(t('errorGeneratingAccessCode'));
    } finally {
      setLoading(false);
    }
  };

  // Copy access code to clipboard
  const copyAccessCode = () => {
    navigator.clipboard.writeText(testAccessCode)
      .then(() => message.success(t('accessCodeCopied')))
      .catch(() => message.error(t('copyFailed')));
  };

  // Show environment variables info
  const renderEnvironmentInfo = () => {
    if (!showEnvironment) return null;
    
    return (
      <div style={{ marginTop: 16 }}>
        <Title level={5}>Environment Info</Title>
        <Text>NODE_ENV: {process.env.NODE_ENV}</Text><br />
        <Text>BASE_URL: {window.location.origin}</Text><br />
        <Text>API Endpoint: {import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Not Set'}</Text>
      </div>
    );
  };

  const showDrawer = () => {
    setVisible(true);
  };
  
  const onClose = () => {
    setVisible(false);
  };
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <>
      <Button
        type="primary"
        icon={<BugOutlined />}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={showDrawer}
      >
        Debug
      </Button>

      <Drawer
        title="Debug Menu"
        placement="right"
        onClose={onClose}
        open={visible}
        width="50%"
        extra={
          <Space>
            <Button onClick={onClose}>Close</Button>
          </Space>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card title="Database Options">
            <div style={{ marginBottom: 16 }}>
              <Switch 
                checked={showTest} 
                onChange={setShowTest} 
                style={{ marginRight: 8 }} 
              />
              <Text>Show Database Test</Text>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <Switch 
                checked={useDirectClient} 
                onChange={setUseDirectClient} 
                style={{ marginRight: 8 }} 
              />
              <Text>Use Direct Client</Text>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <Switch 
                checked={showAccessCodeTest} 
                onChange={setShowAccessCodeTest} 
                style={{ marginRight: 8 }} 
              />
              <Text>Access Code Testing</Text>
            </div>
            
            {showAccessCodeTest && (
              <div style={{ marginTop: 16 }}>
                <Divider />
                <Title level={5}>Access Code Test</Title>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Input
                    placeholder="Enter access code"
                    value={testAccessCode}
                    onChange={(e) => setTestAccessCode(e.target.value)}
                    prefix={<KeyOutlined />}
                    allowClear
                  />
                  
                  <Space>
                    <Button onClick={testAccessCodeHandler} loading={loading}>
                      Test
                    </Button>
                    <Button icon={<CopyOutlined />} onClick={copyAccessCode}>
                      Copy
                    </Button>
                    <Button icon={<DatabaseOutlined />} onClick={generateNewAccessCode}>
                      Generate
                    </Button>
                  </Space>
                
                  {foundPost && (
                    <div style={{ marginTop: 16 }}>
                      <Title level={5}>Found Post:</Title>
                      <Text>ID: {foundPost.id}</Text><br />
                      <Text>Title: {foundPost.title}</Text><br />
                      <Text>Type: {foundPost.purpose}</Text><br />
                      <Text>Access Code: {foundPost.access_code}</Text>
                    </div>
                  )}
                </Space>
              </div>
            )}
          </Card>
          
          <Card title="Environment Options">
            <div style={{ marginBottom: 16 }}>
              <Switch 
                checked={showEnvDebug} 
                onChange={setShowEnvDebug} 
                style={{ marginRight: 8 }} 
              />
              <Text>Show Environment Debug</Text>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <Switch 
                checked={showEnvironment} 
                onChange={setShowEnvironment} 
                style={{ marginRight: 8 }} 
              />
              <Text>Show Environment Variables</Text>
            </div>
            
            {renderEnvironmentInfo()}
          </Card>
          
          <Card title="Translation Options">
            <div style={{ marginBottom: 16 }}>
              <Switch 
                checked={showTranslationDebug} 
                onChange={setShowTranslationDebug} 
                style={{ marginRight: 8 }} 
              />
              <Text>Show Translation Debug</Text>
            </div>
            
            <Divider />
            
            <div>
              <Title level={5}>Current Language: {i18n.language}</Title>
              <Space wrap>
                <Button onClick={() => changeLanguage('en')}>English</Button>
                <Button onClick={() => changeLanguage('zh-CN')}>中文</Button>
                <Button onClick={() => changeLanguage('ja')}>日本語</Button>
                <Button onClick={() => changeLanguage('ko')}>한국어</Button>
                <Button onClick={() => changeLanguage('es')}>Español</Button>
              </Space>
            </div>
            
            {showTranslationDebug && (
              <div style={{ marginTop: 16 }}>
                <Divider />
                <Title level={5}>Translation Keys</Title>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Text>helpPageTitle: {t('helpPageTitle')}</Text>
                  <Text>allPosts: {t('allPosts')}</Text>
                  <Text>newest: {t('newest')}</Text>
                  <Text>popular: {t('popular')}</Text>
                  <Text>solved: {t('solved')}</Text>
                  <Text>backToHome: {t('backToHome')}</Text>
                  <Text>createNewPost: {t('createNewPost')}</Text>
                </div>
              </div>
            )}
          </Card>
        </div>
      </Drawer>
    </>
  );
};

export default DebugMenu; 