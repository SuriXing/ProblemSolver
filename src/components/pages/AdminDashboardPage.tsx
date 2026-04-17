import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout, Card, Statistic, Row, Col, Table, Button, Space, Tag, Input,
  Modal, message, Typography, Dropdown, Menu, Avatar, Tabs, Alert, Tooltip, List, Empty
} from 'antd';
import {
  UserOutlined, LogoutOutlined, DeleteOutlined, EyeOutlined, SearchOutlined,
  ExclamationCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
  MessageOutlined, FileTextOutlined, TrophyOutlined, CalendarOutlined,
  SettingOutlined, BarChartOutlined, ReloadOutlined
} from '@ant-design/icons';
import AdminService, { AdminUser, AdminStats, AppError, ReplyWithPost } from '../../services/admin.service';
import { Post } from '../../types/database.types';
import {
  getLastSeenPostsAt,
  getLastSeenRepliesAt,
  markAllPostsRead,
  markAllRepliesRead,
  isUnread,
  countUnread,
} from '../../utils/adminUnread';

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
  const [errors, setErrors] = useState<AppError[]>([]);
  const [errorsLoading, setErrorsLoading] = useState(false);
  const [allReplies, setAllReplies] = useState<ReplyWithPost[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [replyCounts, setReplyCounts] = useState<Map<string, number>>(new Map());
  const [lastSeenPostsAt, setLastSeenPostsAt] = useState<string | null>(getLastSeenPostsAt());
  const [lastSeenRepliesAt, setLastSeenRepliesAt] = useState<string | null>(getLastSeenRepliesAt());

  // Memoized post buckets — sort/filter once per posts change instead of
  // on every render (bug-bash R2 perf #2).
  const { unsolved: unsolvedPosts, solved: solvedPosts, deleted: deletedPosts } = useMemo(() => {
    const sorted = [...posts].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return {
      unsolved: sorted.filter((p) => !p.deleted_at && p.status !== 'solved'),
      solved: sorted.filter((p) => !p.deleted_at && p.status === 'solved'),
      deleted: sorted.filter((p) => !!p.deleted_at),
    };
  }, [posts]);


  useEffect(() => {
    // Verify authentication against Supabase (not just the sync localStorage
    // heuristic). isAuthenticatedVerified() hits supabase.auth.getUser() and
    // validates the JWT signature — cannot be forged by tampering with
    // localStorage. The U28 reviewer flagged the old sync check.
    let cancelled = false;
    (async () => {
      const ok = await AdminService.isAuthenticatedVerified();
      if (cancelled) return;
      if (!ok) {
        navigate('/admin/login');
        return;
      }
      const admin = AdminService.getCurrentAdmin();
      setCurrentAdmin(admin);
      loadDashboardData();
      loadErrors();
      loadAllReplies();
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, postsData, counts] = await Promise.all([
        AdminService.getDashboardStats(),
        AdminService.getAllPosts(1, 50),
        AdminService.getReplyCountsByPostId(),
      ]);

      setStats(statsData);
      setPosts(postsData.posts);
      setReplyCounts(counts);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const loadErrors = async () => {
    setErrorsLoading(true);
    try {
      const rows = await AdminService.getRecentErrors(100);
      setErrors(rows);
    } catch (error) {
      console.error('Error loading app_errors:', error);
      message.error('加载错误日志失败');
    } finally {
      setErrorsLoading(false);
    }
  };

  const loadAllReplies = async () => {
    setRepliesLoading(true);
    try {
      const rows = await AdminService.getAllReplies(200);
      setAllReplies(rows);
    } catch (error) {
      console.error('Error loading all replies:', error);
      message.error('加载评论失败');
    } finally {
      setRepliesLoading(false);
    }
  };

  const handleMarkAllPostsRead = () => {
    markAllPostsRead();
    setLastSeenPostsAt(new Date().toISOString());
    message.success('已标记所有帖子为已读');
  };

  const handleMarkAllRepliesRead = () => {
    markAllRepliesRead();
    setLastSeenRepliesAt(new Date().toISOString());
    message.success('已标记所有评论为已读');
  };

  // Unread counts — recomputed on every render but cheap
  const unreadPostCount = countUnread(posts, lastSeenPostsAt);
  const unreadReplyCount = countUnread(allReplies, lastSeenRepliesAt);

  // Reply count per post — comes from a dedicated count query (replyCounts state)
  // populated by loadDashboardData so it stays accurate even for posts whose
  // replies aren't in the most-recent-200 sample loaded by getAllReplies.
  const replyCountByPostId = replyCounts;

  // Group errors by fingerprint for the "collapse duplicates" view
  const errorsByFingerprint = React.useMemo(() => {
    const map = new Map<string, { latest: AppError; count: number }>();
    for (const err of errors) {
      const key = err.fingerprint || err.error_message.slice(0, 100);
      const existing = map.get(key);
      if (!existing) {
        map.set(key, { latest: err, count: 1 });
      } else {
        existing.count += 1;
        // Keep the most recent as `latest`
        if (new Date(err.created_at) > new Date(existing.latest.created_at)) {
          existing.latest = err;
        }
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.latest.created_at).getTime() - new Date(a.latest.created_at).getTime()
    );
  }, [errors]);

  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const errorsLastHour = errors.filter(
    (e) => new Date(e.created_at).getTime() > oneHourAgo
  ).length;

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

          <TabPane
            tab={
              <span>
                帖子管理 {unreadPostCount > 0 && <Tag color="blue">{unreadPostCount} 未读</Tag>}
              </span>
            }
            key="posts"
          >
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
                  <Button
                    onClick={handleMarkAllPostsRead}
                    disabled={unreadPostCount === 0}
                  >
                    全部标为已读 {unreadPostCount > 0 && `(${unreadPostCount})`}
                  </Button>
                </Space>
              </div>

              {/* Split posts into three sections.
                  Sort order: newest first, oldest at bottom (Suri's spec).
                  All three lists use the same card markup, but the action
                  buttons differ per section. */}
              {posts.length === 0 && !loading ? (
                <Empty description="暂无帖子" />
              ) : (
                <>
                  {(() => {
                    const unsolved = unsolvedPosts;
                    const solved = solvedPosts;
                    const deleted = deletedPosts;

                    const renderCard = (post: Post, section: 'unsolved' | 'solved' | 'deleted') => {
                      const replyCount = replyCountByPostId.get(post.id) ?? 0;
                      const unread = isUnread(post.created_at, lastSeenPostsAt);
                      const fixed = post.status === 'solved';
                      return (
                        <div
                          key={post.id}
                          className={`admin-post-card${unread && section !== 'deleted' ? ' admin-post-card--unread' : ''}${section === 'deleted' ? ' admin-post-card--deleted' : ''}`}
                        >
                          <div className="admin-post-card__status">
                            {section === 'deleted' ? (
                              <Tag color="default" style={{ margin: 0, fontSize: 13, padding: '2px 12px' }}>
                                🗑 Deleted
                              </Tag>
                            ) : (
                              <Tag color={fixed ? 'success' : 'warning'} style={{ margin: 0, fontSize: 13, padding: '2px 12px' }}>
                                {fixed ? '✓ Fixed' : '○ Unfixed'}
                              </Tag>
                            )}
                            {unread && section !== 'deleted' && (
                              <Tag color="blue" style={{ margin: '0 0 0 6px', fontSize: 11 }}>NEW</Tag>
                            )}
                          </div>

                          <div className="admin-post-card__content">
                            {post.content || <Text type="secondary">(empty)</Text>}
                          </div>

                          <div className="admin-post-card__meta">
                            <span className="admin-post-card__meta-item">
                              <MessageOutlined /> {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                            </span>
                            <span className="admin-post-card__meta-item">
                              <CalendarOutlined /> {new Date(post.created_at).toLocaleDateString(undefined, {
                                month: 'short', day: 'numeric', year: 'numeric',
                              })}
                            </span>
                            {section === 'deleted' && post.deleted_at && (
                              <span className="admin-post-card__meta-item" style={{ color: '#999' }}>
                                🗑 {new Date(post.deleted_at).toLocaleDateString(undefined, {
                                  month: 'short', day: 'numeric',
                                })}
                              </span>
                            )}
                          </div>

                          <div className="admin-post-card__actions">
                            <Button size="small" icon={<EyeOutlined />} onClick={() => viewPostDetails(post)}>
                              View
                            </Button>
                            {section === 'unsolved' && (
                              <>
                                <Button
                                  size="small"
                                  type="primary"
                                  onClick={() => handleUpdatePostStatus(post.id, 'solved')}
                                >
                                  Mark fixed
                                </Button>
                                <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeletePost(post)}>
                                  Delete
                                </Button>
                              </>
                            )}
                            {section === 'solved' && (
                              <>
                                <Button
                                  size="small"
                                  onClick={() => handleUpdatePostStatus(post.id, 'open')}
                                >
                                  Mark unfixed
                                </Button>
                                <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeletePost(post)}>
                                  Delete
                                </Button>
                              </>
                            )}
                            {section === 'deleted' && (
                              <>
                                <Button
                                  size="small"
                                  type="primary"
                                  onClick={async () => {
                                    const res = await AdminService.restorePost(post.id);
                                    if (res.success) {
                                      message.success('已恢复');
                                      loadDashboardData();
                                    } else {
                                      message.error(res.error || '恢复失败');
                                    }
                                  }}
                                >
                                  Restore
                                </Button>
                                <Button
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => {
                                    confirm({
                                      title: 'Permanently delete this post?',
                                      content: 'This cannot be undone. The post and all its replies will be removed from the database forever.',
                                      okText: 'Permanently delete',
                                      okType: 'danger',
                                      onOk: async () => {
                                        const res = await AdminService.hardDeletePost(post.id);
                                        if (res.success) {
                                          message.success('已永久删除');
                                          loadDashboardData();
                                        } else {
                                          message.error(res.error || '永久删除失败');
                                        }
                                      },
                                    });
                                  }}
                                >
                                  Permanently delete
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    };

                    const Section: React.FC<{
                      label: string;
                      icon: string;
                      items: Post[];
                      section: 'unsolved' | 'solved' | 'deleted';
                      empty: string;
                    }> = ({ label, icon, items, section, empty }) => (
                      <div style={{ marginBottom: 32 }}>
                        <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 12, color: '#374151' }}>
                          {icon} {label} <Text type="secondary" style={{ fontSize: 14, fontWeight: 400 }}>({items.length})</Text>
                        </h3>
                        {items.length === 0 ? (
                          <div style={{ padding: 16, background: '#fafafa', borderRadius: 8, color: '#999', textAlign: 'center', fontSize: 13 }}>
                            {empty}
                          </div>
                        ) : (
                          <div className="admin-posts-grid">
                            {items.map((p) => renderCard(p, section))}
                          </div>
                        )}
                      </div>
                    );

                    return (
                      <>
                        <Section
                          label="Unsolved"
                          icon="○"
                          items={unsolved}
                          section="unsolved"
                          empty="暂无未解决的帖子"
                        />
                        <Section
                          label="Solved"
                          icon="✓"
                          items={solved}
                          section="solved"
                          empty="暂无已解决的帖子"
                        />
                        <Section
                          label="Trash"
                          icon="🗑"
                          items={deleted}
                          section="deleted"
                          empty="垃圾箱为空"
                        />
                      </>
                    );
                  })()}
                </>
              )}
            </Card>
          </TabPane>

          <TabPane
            tab={
              <span>
                评论管理 {unreadReplyCount > 0 && <Tag color="blue">{unreadReplyCount} 未读</Tag>}
              </span>
            }
            key="comments"
          >
            <Card
              title="所有评论"
              extra={
                <Space>
                  <Button icon={<ReloadOutlined />} onClick={loadAllReplies} loading={repliesLoading}>
                    刷新
                  </Button>
                  <Button
                    onClick={handleMarkAllRepliesRead}
                    disabled={unreadReplyCount === 0}
                  >
                    全部标为已读 {unreadReplyCount > 0 && `(${unreadReplyCount})`}
                  </Button>
                </Space>
              }
            >
              {allReplies.length === 0 && !repliesLoading ? (
                <Alert
                  type="info"
                  message="暂无评论"
                  description="点击刷新加载最近 200 条评论。"
                />
              ) : (
                <Table
                  loading={repliesLoading}
                  dataSource={allReplies}
                  rowKey="id"
                  pagination={{ pageSize: 20, showSizeChanger: true }}
                  rowClassName={(row) => (isUnread(row.created_at, lastSeenRepliesAt) ? 'admin-unread-row' : '')}
                  columns={[
                    {
                      title: '时间',
                      dataIndex: 'created_at',
                      key: 'created_at',
                      width: 170,
                      render: (created_at: string) => (
                        <Text style={{ fontSize: 12 }}>
                          {new Date(created_at).toLocaleString()}
                          {isUnread(created_at, lastSeenRepliesAt) && (
                            <Tag color="blue" style={{ marginLeft: 4 }}>NEW</Tag>
                          )}
                        </Text>
                      ),
                    },
                    {
                      title: '所属帖子',
                      key: 'post',
                      width: 220,
                      ellipsis: true,
                      render: (_: unknown, row: ReplyWithPost) =>
                        row.posts ? (
                          <Tooltip title={row.posts.content?.slice(0, 200)}>
                            <Text>
                              {row.posts.title || (row.posts.content?.slice(0, 40) + '...')}
                            </Text>
                            {row.posts.status === 'solved' && (
                              <Tag color="green" style={{ marginLeft: 4 }}>已解决</Tag>
                            )}
                          </Tooltip>
                        ) : (
                          <Text type="secondary">(已删除)</Text>
                        ),
                    },
                    {
                      title: '内容',
                      dataIndex: 'content',
                      key: 'content',
                      ellipsis: true,
                    },
                    {
                      title: '解决方案',
                      dataIndex: 'is_solution',
                      key: 'is_solution',
                      width: 100,
                      render: (is_solution: boolean) =>
                        is_solution ? <Tag color="gold">★ 解决方案</Tag> : null,
                    },
                    {
                      title: '操作',
                      key: 'actions',
                      width: 120,
                      render: (_: unknown, row: ReplyWithPost) => (
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => {
                            confirm({
                              title: '确认删除评论',
                              content: row.content?.slice(0, 200),
                              onOk: async () => {
                                const res = await AdminService.deleteReply(row.id);
                                if (res.success) {
                                  message.success('已删除');
                                  loadAllReplies();
                                } else {
                                  message.error(res.error || '删除失败');
                                }
                              },
                            });
                          }}
                        >
                          删除
                        </Button>
                      ),
                    },
                  ]}
                />
              )}
            </Card>
          </TabPane>

          <TabPane
            tab={
              <span>
                错误日志 {errorsLastHour > 0 && <Tag color="red">{errorsLastHour} 过去1小时</Tag>}
              </span>
            }
            key="errors"
          >
            <Card
              title="Recent errors"
              extra={
                <Button icon={<ReloadOutlined />} onClick={loadErrors} loading={errorsLoading}>
                  刷新
                </Button>
              }
            >
              {errors.length === 0 && !errorsLoading ? (
                <Alert
                  type="info"
                  message="暂无错误记录"
                  description={
                    <span>
                      点击&quot;刷新&quot;加载最近 100 条。如果什么都没加载出来，代表 app_errors 表是空的 —
                      这很正常。也可以在浏览器 devtools 里 <code>throw new Error(&apos;test&apos;)</code>
                      ，几秒后刷新应该能看到这条记录。
                    </span>
                  }
                />
              ) : (
                <Table
                  loading={errorsLoading}
                  dataSource={errorsByFingerprint}
                  rowKey={(row) => row.latest.id}
                  pagination={{ pageSize: 20 }}
                  columns={[
                    {
                      title: '时间',
                      key: 'time',
                      width: 170,
                      render: (_: unknown, row: { latest: AppError }) => (
                        <Text style={{ fontSize: 12 }}>
                          {new Date(row.latest.created_at).toLocaleString()}
                        </Text>
                      ),
                    },
                    {
                      title: '来源',
                      dataIndex: ['latest', 'source'],
                      key: 'source',
                      width: 80,
                      render: (source: string) => <Tag>{source}</Tag>,
                    },
                    {
                      title: '路由',
                      dataIndex: ['latest', 'route'],
                      key: 'route',
                      width: 160,
                      ellipsis: true,
                      render: (route: string | null) => <Text code>{route ?? '-'}</Text>,
                    },
                    {
                      title: '消息',
                      dataIndex: ['latest', 'error_message'],
                      key: 'message',
                      ellipsis: true,
                    },
                    {
                      title: '次数',
                      dataIndex: 'count',
                      key: 'count',
                      width: 80,
                      render: (count: number) =>
                        count > 1 ? <Tag color="orange">×{count}</Tag> : count,
                    },
                  ]}
                  expandable={{
                    expandedRowRender: (row: { latest: AppError }) => (
                      <div style={{ fontSize: 12, fontFamily: 'monospace' }}>
                        {row.latest.error_stack && (
                          <pre style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                            {row.latest.error_stack}
                          </pre>
                        )}
                        {row.latest.user_agent && (
                          <div style={{ marginTop: 8, color: '#888' }}>
                            UA: {row.latest.user_agent}
                          </div>
                        )}
                        {row.latest.extra && (
                          <pre style={{ marginTop: 8, background: '#fafafa', padding: 8, borderRadius: 4 }}>
                            {JSON.stringify(row.latest.extra, null, 2)}
                          </pre>
                        )}
                      </div>
                    ),
                  }}
                />
              )}
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