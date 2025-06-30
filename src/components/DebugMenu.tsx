import React, { useState } from 'react';
import { Button, Drawer, Input, Space, Typography, message, Collapse, Switch, Divider } from 'antd';
import { BugOutlined, KeyOutlined, CopyOutlined, DatabaseOutlined } from '@ant-design/icons';
import { DatabaseService } from '../services/database.service';
import { Post } from '../types/database.types';
import { useTypeSafeTranslation } from '../utils/translationHelper';

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
  const { t } = useTypeSafeTranslation();
  const [visible, setVisible] = useState(false);
  const [testAccessCode, setTestAccessCode] = useState('');
  const [foundPost, setFoundPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEnvironment, setShowEnvironment] = useState(false);

  // 测试访问码
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

  // 生成新的访问码（仅供测试）
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

  // 复制访问码到剪贴板
  const copyAccessCode = () => {
    navigator.clipboard.writeText(testAccessCode)
      .then(() => message.success(t('accessCodeCopied')))
      .catch(() => message.error(t('copyFailed')));
  };

  // 显示环境变量信息
  const renderEnvironmentInfo = () => {
    if (!showEnvironment) return null;
    
    return (
      <div style={{ marginTop: 16 }}>
        <Title level={5}>环境信息</Title>
        <Text>NODE_ENV: {process.env.NODE_ENV}</Text><br />
        <Text>BASE_URL: {window.location.origin}</Text><br />
        <Text>API Endpoint: {import.meta.env.VITE_SUPABASE_URL ? '已设置' : '未设置'}</Text>
      </div>
    );
  };

  return (
    <>
      <Button
        type="primary"
        icon={<BugOutlined />}
        style={{
          position: 'fixed',
          left: 0,
          top: '30%',
          zIndex: 1000,
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          paddingLeft: 8,
          paddingRight: 8,
          width: 40,
          height: 120,
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={() => setVisible(true)}
      >
        {t('debug')}
      </Button>

      <Drawer
        title={t('debugMenu')}
        placement="left"
        onClose={() => setVisible(false)}
        visible={visible}
        width={320}
      >
        <Collapse defaultActiveKey={['1']}>
          <Panel header={t('accessCodeTest')} key="1">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                placeholder={t('enterAccessCode')}
                value={testAccessCode}
                onChange={(e) => setTestAccessCode(e.target.value)}
                prefix={<KeyOutlined />}
                allowClear
              />
              
              <Space>
                <Button onClick={testAccessCodeHandler} loading={loading}>
                  {t('testAccessCode')}
                </Button>
                <Button icon={<CopyOutlined />} onClick={copyAccessCode}>
                  {t('copy')}
                </Button>
                <Button icon={<DatabaseOutlined />} onClick={generateNewAccessCode}>
                  {t('generateNewCode')}
                </Button>
              </Space>

              {foundPost && (
                <div style={{ marginTop: 16 }}>
                  <Title level={5}>{t('foundPost')}:</Title>
                  <Text>{t('id')}: {foundPost.id}</Text><br />
                  <Text>{t('title')}: {foundPost.title}</Text><br />
                  <Text>{t('type')}: {foundPost.purpose}</Text><br />
                  <Text>{t('accessCode')}: {foundPost.access_code}</Text>
                </div>
              )}
            </Space>
          </Panel>

          <Panel header={t('environmentSettings')} key="2">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Switch
                  checked={showEnvironment}
                  onChange={setShowEnvironment}
                /> {t('showEnvironmentVars')}
              </div>
              {renderEnvironmentInfo()}
            </Space>
          </Panel>

          <Panel header={t('systemSettings')} key="3">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Switch
                  checked={showTest}
                  onChange={setShowTest}
                /> {t('showSupabaseTest')}
              </div>
              
              <div>
                <Switch
                  checked={useDirectClient}
                  onChange={(checked) => {
                    setUseDirectClient(checked);
                    window.location.reload();
                  }}
                /> {t('useDirectClient')}
              </div>
              
              <div>
                <Switch
                  checked={showEnvDebug}
                  onChange={setShowEnvDebug}
                /> {t('showEnvDebug')}
              </div>
            </Space>
          </Panel>
        </Collapse>

        <Divider />
        <Text type="secondary">
          {t('debugModeWarning')}
        </Text>
      </Drawer>
    </>
  );
};

export default DebugMenu; 