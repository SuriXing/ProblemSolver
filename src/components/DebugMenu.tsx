import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTranslationContext } from '../context/TranslationContext';
import { Card, Switch, Space, Button, Divider, Typography, Drawer, message, Collapse, Input } from 'antd';
import { BugOutlined, CrownOutlined } from '@ant-design/icons';
import { DatabaseService } from '../services/database.service';
import { Post } from '../types/database.types';
import type { TranslationKey } from '../types/i18n.types';
import './DebugMenu.css';

const { Panel } = Collapse;
const { Title, Text } = Typography;

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
  const { t } = useTranslation();
  const { changeLanguage, currentLanguage } = useTranslationContext();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [testAccessCode, setTestAccessCode] = useState('');
  const [foundPost, setFoundPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEnvironment, setShowEnvironment] = useState(false);
  const [showTranslationDebug, setShowTranslationDebug] = useState(false);
  const [showAccessCodeTest, setShowAccessCodeTest] = useState(false);

  // Helper function to ensure string type from translation
  const translate = (key: TranslationKey): string => String(t(key));

  // Navigate to admin login
  const goToAdminLogin = () => {
    navigate('/admin/login');
    setVisible(false);
  };

  // Test access code
  const testAccessCodeHandler = async () => {
    if (!testAccessCode.trim()) {
      message.error(translate('pleaseEnterAccessCode'));
      return;
    }

    setLoading(true);
    try {
      const post = await DatabaseService.getPostByAccessCode(testAccessCode);
      setFoundPost(post);
      if (post) {
        message.success(translate('postFoundSuccess'));
      } else {
        message.error(translate('postNotFound'));
      }
    } catch (error) {
      message.error(translate('errorTestingAccessCode'));
      console.error(translate('errorTestingAccessCode'), error);
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
      message.success(translate('newAccessCodeGenerated'));
    } catch (error) {
      message.error(translate('errorGeneratingAccessCode'));
    } finally {
      setLoading(false);
    }
  };

  // Copy access code to clipboard
  const copyAccessCode = () => {
    navigator.clipboard.writeText(testAccessCode)
      .then(() => message.success(translate('accessCodeCopied')))
      .catch(() => message.error(translate('copyFailed')));
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
        {translate('debug')}
      </Button>

      <Drawer
        title={translate('debugMenu')}
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
          <Card title={translate('systemSettings')}>
            <div style={{ marginBottom: 16 }}>
              <Switch 
                checked={showTest} 
                onChange={setShowTest} 
                style={{ marginRight: 8 }} 
              />
              <Text>{translate('showSupabaseTest')}</Text>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <Switch 
                checked={useDirectClient} 
                onChange={setUseDirectClient} 
                style={{ marginRight: 8 }} 
              />
              <Text>{translate('useDirectClient')}</Text>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <Switch 
                checked={showAccessCodeTest} 
                onChange={setShowAccessCodeTest} 
                style={{ marginRight: 8 }} 
              />
              <Text>{translate('accessCodeTesting')}</Text>
            </div>
            
            <Divider />
            
            <div style={{ marginBottom: 16 }}>
              <Button 
                type="primary" 
                icon={<CrownOutlined />}
                onClick={goToAdminLogin}
                style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                管理员登录
              </Button>
            </div>
            
            {showAccessCodeTest && (
              <div style={{ marginTop: 16 }}>
                <Divider />
                <Title level={5}>{translate('accessCodeTest')}</Title>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Input
                    placeholder={translate('enterAccessCode')}
                    value={testAccessCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestAccessCode(e.target.value)}
                    allowClear
                  />
                  
                  <Space>
                    <Button onClick={testAccessCodeHandler} loading={loading}>
                      {translate('test')}
                    </Button>
                    <Button onClick={copyAccessCode}>
                      {translate('copy')}
                    </Button>
                    <Button onClick={generateNewAccessCode}>
                      {translate('generate')}
                    </Button>
                  </Space>
                
                  {foundPost && (
                    <div style={{ marginTop: 16 }}>
                      <Title level={5}>{translate('foundPost')}</Title>
                      <Text>{translate('id')}: {foundPost.id}</Text><br />
                      <Text>{translate('title')}: {foundPost.title}</Text><br />
                      <Text>{translate('type')}: {foundPost.purpose}</Text><br />
                      <Text>{translate('accessCode')}: {foundPost.access_code}</Text>
                    </div>
                  )}
                </Space>
              </div>
            )}
          </Card>
          
          <Card title={translate('environmentOptions')}>
            <div style={{ marginBottom: 16 }}>
              <Switch 
                checked={showEnvDebug} 
                onChange={setShowEnvDebug} 
                style={{ marginRight: 8 }} 
              />
              <Text>{translate('showEnvDebug')}</Text>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <Switch 
                checked={showEnvironment} 
                onChange={setShowEnvironment} 
                style={{ marginRight: 8 }} 
              />
              <Text>{translate('showEnvironmentVariables')}</Text>
            </div>
            
            {renderEnvironmentInfo()}
          </Card>
          
          <Card title={translate('translationSettings')}>
            <div style={{ marginBottom: 16 }}>
              <Switch 
                checked={showTranslationDebug} 
                onChange={setShowTranslationDebug} 
                style={{ marginRight: 8 }} 
              />
              <Text>{translate('showTranslationDebug')}</Text>
            </div>
            
            <Divider />
            
            <div>
              <Title level={5}>{translate('currentLanguage')}: {currentLanguage}</Title>
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
                <Title level={5}>{translate('translationKeys')}</Title>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Text>{translate('helpPageTitle')}: {translate('helpPageTitle')}</Text>
                  <Text>{translate('allPosts')}: {translate('allPosts')}</Text>
                  <Text>{translate('newest')}: {translate('newest')}</Text>
                  <Text>{translate('popular')}: {translate('popular')}</Text>
                  <Text>{translate('solved')}: {translate('solved')}</Text>
                  <Text>{translate('backToHome')}: {translate('backToHome')}</Text>
                  <Text>{translate('createNewPost')}: {translate('createNewPost')}</Text>
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