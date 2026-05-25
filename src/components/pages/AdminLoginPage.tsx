import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, Form, Input, Button, Alert, Typography, Space } from 'antd';
import { MailOutlined, LockOutlined, CrownOutlined } from '@ant-design/icons';
import AdminService from '../../services/admin.service';
import Layout from '../layout/Layout';
import { useExitNavigate } from '../../context/NavigationLockContext';

const { Title, Text } = Typography;

const AdminLoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { navigateWithExit } = useExitNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    // Redirect if already authenticated. isAuthenticated() became async in
    // S2.1 (it now verifies admin_users membership server-side).
    let cancelled = false;
    AdminService.isAuthenticated().then((ok) => {
      if (!cancelled && ok) navigate('/admin/dashboard');
    });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError(null);

    try {
      const result = await AdminService.login(values.email, values.password);

      if (result.success) {
        console.log('Admin login successful');
        navigate('/admin/dashboard');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred during login');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="page-fade-in" style={{
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
                {t('adminTitle')}
              </Title>
              <Text type="secondary">
                {t('adminSubtitle')}
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
              name="email"
              rules={[
                { required: true, message: t('adminEmailRequired') },
                { type: 'email', message: t('adminEmailInvalid') },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder={t('adminEmailPlaceholder')}
                autoComplete="email"
                type="email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: t('adminPasswordRequired') }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder={t('adminPasswordPlaceholder')}
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
                {loading ? t('adminLoggingIn') : t('adminLoginButton')}
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button
              type="link"
              onClick={() => navigateWithExit('/')}
              style={{ padding: 0 }}
            >
              {t('backToHome')}
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminLoginPage; 