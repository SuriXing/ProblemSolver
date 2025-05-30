import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout, Card, Statistic, Row, Col, Table, Button, Space, Tag, Input,
  Modal, message, Typography, Dropdown, Menu, Avatar, Tabs, Alert, Tooltip
} from 'antd';
import {
  UserOutlined, LogoutOutlined, DeleteOutlined, EyeOutlined, SearchOutlined,
  ExclamationCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
  MessageOutlined, FileTextOutlined, TrophyOutlined, CalendarOutlined,
  SettingOutlined, BarChartOutlined, ReloadOutlined
} from '@ant-design/icons';
import AdminService, { AdminUser, AdminStats } from '../../services/admin.service';
import { Post } from '../../types/database.types';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { confirm } = Modal;

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [postModalVisible, setPostModalVisible] = useState(false);

  useEffect(() => {
    // Check authentication
    if (!AdminService.isAuthenticated()) {
      navigate('/admin/login');
      return;
    }

    const admin = AdminService.getCurrentAdmin();
    setCurrentAdmin(admin);
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, postsData] = await Promise.all([
        AdminService.getDashboardStats(),
        AdminService.getAllPosts(1, 50)
      ]);

      setStats(statsData);
      setPosts(postsData.posts);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    confirm({
      title: '确认退出',
      content: '您确定要退出管理系统吗？',
      onOk() {
        AdminService.logout();
        navigate('/');
      },
    });
  };

  const handleDeletePost = (post: Post) => {
    confirm({
      title: '确认删除',
      content: `您确定要删除这个帖子吗？\n"${post.title || post.content?.slice(0, 50)}..."`,
      icon: <ExclamationCircleOutlined />,
      okType: 'danger',
      async onOk() {
        try {
          const result = await AdminService.deletePost(post.id);
          if (result.success) {
            message.success('帖子删除成功');
            loadDashboardData();
          } else {
            message.error(result.error || '删除失败');
          }
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleUpdatePostStatus = async (postId: string, status: 'open' | 'solved' | 'closed') => {
    try {
      const result = await AdminService.updatePostStatus(postId, status);
      if (result.success) {
        message.success('状态更新成功');
        loadDashboardData();
      } else {
        message.error(result.error || '更新失败');
      }
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleSearch = async () => {
    if (!searchText.trim()) {
      loadDashboardData();
      return;
    }

    setLoading(true);
    try {
      const searchResults = await AdminService.searchPosts(searchText);
      setPosts(searchResults);
    } catch (error) {
      message.error('搜索失败');
    } finally {
      setLoading(false);
    }
  };

  const viewPostDetails = (post: Post) => {
    setSelectedPost(post);
    setPostModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'processing';
      case 'solved': return 'success';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return '进行中';
      case 'solved': return '已解决';
      case 'closed': return '已关闭';
      default: return status;
    }
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        个人信息
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        设置
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  );

  const postsColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: string) => (
        <Text code style={{ fontSize: 12 }}>
          {id.slice(0, 8)}...
        </Text>
      )
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (content: string) => (
        <Tooltip title={content}>
          {content?.slice(0, 60)}...
        </Tooltip>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '访问码',
      dataIndex: 'access_code',
      key: 'access_code',
      width: 100,
      render: (code: string) => (
        <Text code>{code}</Text>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (record: Post) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => viewPostDetails(record)}
          >
            查看
          </Button>
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item
                  key="open"
                  onClick={() => handleUpdatePostStatus(record.id, 'open')}
                >
                  标记为进行中
                </Menu.Item>
                <Menu.Item
                  key="solved"
                  onClick={() => handleUpdatePostStatus(record.id, 'solved')}
                >
                  标记为已解决
                </Menu.Item>
                <Menu.Item
                  key="closed"
                  onClick={() => handleUpdatePostStatus(record.id, 'closed')}
                >
                  标记为已关闭
                </Menu.Item>
              </Menu>
            }
          >
            <Button size="small">状态</Button>
          </Dropdown>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeletePost(record)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  if (!currentAdmin) {
    return null;
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            Problem Solver 管理后台
          </Title>
        </div>
        
        <Space>
          <Text>欢迎, {currentAdmin.username}</Text>
          <Dropdown overlay={userMenu} placement="bottomRight">
            <Avatar
              style={{ cursor: 'pointer', backgroundColor: '#1890ff' }}
              icon={<UserOutlined />}
            />
          </Dropdown>
        </Space>
      </Header>

      <Content style={{ padding: 24 }}>
        <Tabs defaultActiveKey="overview">
          <TabPane tab="总览" key="overview">
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="总帖子数"
                    value={stats?.totalPosts || 0}
                    prefix={<FileTextOutlined />}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="总回复数"
                    value={stats?.totalReplies || 0}
                    prefix={<MessageOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="今日新帖"
                    value={stats?.todayPosts || 0}
                    prefix={<CalendarOutlined />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="本周新帖"
                    value={stats?.weeklyPosts || 0}
                    prefix={<BarChartOutlined />}
                    valueStyle={{ color: '#eb2f96' }}
                  />
                </Card>
              </Col>
            </Row>

            <Alert
              message="系统状态"
              description="所有服务正常运行中。数据库连接正常，API服务可用。"
              type="success"
              showIcon
              style={{ marginBottom: 24 }}
            />
          </TabPane>

          <TabPane tab="帖子管理" key="posts">
            <Card>
              <div style={{ marginBottom: 16 }}>
                <Space>
                  <Input.Search
                    placeholder="搜索帖子内容或访问码"
                    style={{ width: 300 }}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onSearch={handleSearch}
                    enterButton={<SearchOutlined />}
                  />
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={loadDashboardData}
                  >
                    刷新
                  </Button>
                </Space>
              </div>

              <Table
                columns={postsColumns}
                dataSource={posts}
                rowKey="id"
                loading={loading}
                pagination={{
                  pageSize: 20,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                }}
                scroll={{ x: 800 }}
              />
            </Card>
          </TabPane>
        </Tabs>

        <Modal
          title="帖子详情"
          visible={postModalVisible}
          onCancel={() => setPostModalVisible(false)}
          width={800}
          footer={[
            <Button key="close" onClick={() => setPostModalVisible(false)}>
              关闭
            </Button>
          ]}
        >
          {selectedPost && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <Text strong>ID: </Text>
                <Text code>{selectedPost.id}</Text>
                <br />
                <Text strong>访问码: </Text>
                <Text code>{selectedPost.access_code}</Text>
                <br />
                <Text strong>状态: </Text>
                <Tag color={getStatusColor(selectedPost.status)}>
                  {getStatusText(selectedPost.status)}
                </Tag>
                <br />
                <Text strong>创建时间: </Text>
                <Text>{new Date(selectedPost.created_at).toLocaleString()}</Text>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <Text strong>内容:</Text>
                <div style={{
                  background: '#f5f5f5',
                  padding: 12,
                  borderRadius: 6,
                  marginTop: 8,
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedPost.content}
                </div>
              </div>

              {selectedPost.tags && selectedPost.tags.length > 0 && (
                <div>
                  <Text strong>标签: </Text>
                  {selectedPost.tags.map((tag: string, index: number) => (
                    <Tag key={index} color="blue">{tag}</Tag>
                  ))}
                </div>
              )}
            </div>
          )}
        </Modal>
      </Content>
    </Layout>
  );
};

export default AdminDashboardPage; 