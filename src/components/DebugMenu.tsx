import React, { useState } from 'react';
import { Button, Drawer, Input, Space, Typography, message, Collapse, Switch, Divider } from 'antd';
import { BugOutlined, KeyOutlined, CopyOutlined, DatabaseOutlined } from '@ant-design/icons';
import { DatabaseService } from '../services/database.service';
import { Post } from '../types/database.types';

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
  const [visible, setVisible] = useState(false);
  const [testAccessCode, setTestAccessCode] = useState('');
  const [foundPost, setFoundPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEnvironment, setShowEnvironment] = useState(false);

  // 测试访问码
  const testAccessCodeHandler = async () => {
    if (!testAccessCode.trim()) {
      message.error('请输入访问码');
      return;
    }

    setLoading(true);
    try {
      const post = await DatabaseService.getPostByAccessCode(testAccessCode);
      setFoundPost(post);
      if (post) {
        message.success('成功找到帖子!');
      } else {
        message.error('未找到帖子');
      }
    } catch (error) {
      message.error('测试过程中发生错误');
      console.error('Error testing access code:', error);
    } finally {
      setLoading(false);
    }
  };

  // 生成新的访问码（仅供测试）
  const generateNewAccessCode = async () => {
    setLoading(true);
    try {
      // 直接调用 DatabaseService 中的生成函数
      // 注意：需要将 generateAccessCode 从 DatabaseService 中导出
      const accessCode = await DatabaseService.generateTestAccessCode();
      setTestAccessCode(accessCode);
      message.success('生成了新的访问码');
    } catch (error) {
      message.error('生成访问码时出错');
    } finally {
      setLoading(false);
    }
  };

  // 复制访问码到剪贴板
  const copyAccessCode = () => {
    navigator.clipboard.writeText(testAccessCode)
      .then(() => message.success('访问码已复制到剪贴板'))
      .catch(() => message.error('复制失败'));
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
        调试工具
      </Button>

      <Drawer
        title="调试菜单"
        placement="left"
        onClose={() => setVisible(false)}
        visible={visible}
        width={320}
      >
        <Collapse defaultActiveKey={['1']}>
          <Panel header="访问码测试" key="1">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                placeholder="输入访问码"
                value={testAccessCode}
                onChange={(e) => setTestAccessCode(e.target.value)}
                prefix={<KeyOutlined />}
                allowClear
              />
              
              <Space>
                <Button onClick={testAccessCodeHandler} loading={loading}>
                  测试访问码
                </Button>
                <Button icon={<CopyOutlined />} onClick={copyAccessCode}>
                  复制
                </Button>
                <Button icon={<DatabaseOutlined />} onClick={generateNewAccessCode}>
                  生成新码
                </Button>
              </Space>

              {foundPost && (
                <div style={{ marginTop: 16 }}>
                  <Title level={5}>找到的帖子:</Title>
                  <Text>ID: {foundPost.id}</Text><br />
                  <Text>标题: {foundPost.title}</Text><br />
                  <Text>类型: {foundPost.purpose}</Text><br />
                  <Text>访问码: {foundPost.access_code}</Text>
                </div>
              )}
            </Space>
          </Panel>

          <Panel header="环境设置" key="2">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Switch
                  checked={showEnvironment}
                  onChange={setShowEnvironment}
                /> 显示环境变量
              </div>
              {renderEnvironmentInfo()}
            </Space>
          </Panel>

          <Panel header="系统设置" key="3">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Switch
                  checked={showTest}
                  onChange={setShowTest}
                /> 显示 Supabase 测试
              </div>
              
              <div>
                <Switch
                  checked={useDirectClient}
                  onChange={(checked) => {
                    setUseDirectClient(checked);
                    window.location.reload();
                  }}
                /> 使用直连客户端
              </div>
              
              <div>
                <Switch
                  checked={showEnvDebug}
                  onChange={setShowEnvDebug}
                /> 显示环境调试
              </div>
            </Space>
          </Panel>
        </Collapse>

        <Divider />
        <Text type="secondary">
          调试模式仅在开发环境可用。请勿在生产环境使用。
        </Text>
      </Drawer>
    </>
  );
};

export default DebugMenu; 