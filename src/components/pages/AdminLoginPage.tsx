import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Alert, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined, CrownOutlined } from '@ant-design/icons';
import AdminService from '../../services/admin.service';
import Layout from '../layout/Layout';

const { Title, Text } = Typography;

const AdminLoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already authenticated
    if (AdminService.isAuthenticated()) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    setError(null);

    try {
      const result = await AdminService.login(values.username, values.password);
      
      if (result.success) {
        console.log('Admin login successful:', result.admin);
        navigate('/admin/dashboard');
      } else {
        setError(result.error || '登录失败');
      }
    } catch (err) {
      setError('登录过程中发生错误');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <Card
          style={{
            width: '100%',
            maxWidth: 400,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            borderRadius: 12
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Space direction="vertical" size="small">
              <CrownOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                管理员登录
              </Title>
              <Text type="secondary">
                Problem Solver 管理系统
              </Text>
            </Space>
          </div>

          <Form
            name="admin-login"
            onFinish={handleLogin}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
                autoComplete="current-password"
              />
            </Form.Item>

            {error && (
              <Form.Item>
                <Alert
                  message={error}
                  type="error"
                  showIcon
                  closable
                  onClose={() => setError(null)}
                />
              </Form.Item>
            )}

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                style={{ width: '100%', height: 48 }}
              >
                {loading ? '登录中...' : '登录'}
              </Button>
            </Form.Item>
          </Form>

          <div style={{ 
            textAlign: 'center', 
            marginTop: 16,
            padding: 12,
            background: '#f0f2f5',
            borderRadius: 8
          }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              测试账号: admin / admin123
            </Text>
          </div>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button
              type="link"
              onClick={() => navigate('/')}
              style={{ padding: 0 }}
            >
              返回首页
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminLoginPage; 