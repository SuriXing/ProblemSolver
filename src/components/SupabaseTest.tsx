import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button, Card, Input, Space, Typography } from 'antd';
import { getSupabaseUrl } from '../utils/supabaseUtils';

const { Text, Title } = Typography;

// Get the Supabase URL from environment variables instead
const supabaseUrl = getSupabaseUrl();

const SupabaseTest: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [testTitle, setTestTitle] = useState('Test Post');
  const [testContent, setTestContent] = useState('This is a test post');
  
  const testConnection = async () => {
    setLoading(true);
    setResult('Testing connection...');
    
    try {
      const { error } = await supabase.from('posts').select('count', { count: 'exact', head: true });
      
      if (error) {
        setResult(`Connection test failed: ${error.message}`);
      } else {
        setResult('Connection successful!');
      }
    } catch (error) {
      if (error instanceof Error) {
        setResult(`Error: ${error.message}`);
      } else {
        setResult('Unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const testInsert = async () => {
    setLoading(true);
    setResult('Testing insert...');
    
    try {
      const testPost = {
        title: testTitle,
        content: testContent,
        purpose: 'seeking_help',
        tags: ['test'],
        is_anonymous: false,
        status: 'open',
        user_id: null,
        access_code: `test-${Date.now()}`,
        views: 0
      };
      
      const { data, error } = await supabase
        .from('posts')
        .insert([testPost])
        .select()
        .single();
      
      if (error) {
        setResult(`Insert test failed: ${error.message}\nCode: ${error.code}\nDetails: ${error.details || 'none'}`);
      } else {
        setResult(`Insert successful! Created post with ID: ${data.id}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        setResult(`Error: ${error.message}`);
      } else {
        setResult('Unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card title="Supabase Connection Test" style={{ maxWidth: 600, margin: '20px auto' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Title level={5}>Test Data</Title>
        <Input 
          placeholder="Post title" 
          value={testTitle} 
          onChange={(e) => setTestTitle(e.target.value)} 
        />
        <Input.TextArea 
          placeholder="Post content" 
          value={testContent} 
          onChange={(e) => setTestContent(e.target.value)} 
          rows={3}
        />
        
        <Space>
          <Button onClick={testConnection} loading={loading}>
            Test Connection
          </Button>
          <Button type="primary" onClick={testInsert} loading={loading}>
            Test Insert
          </Button>
        </Space>
        
        <div style={{ marginTop: 16 }}>
          <Text strong>Result:</Text>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: 10, 
            borderRadius: 4,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {result}
          </pre>
        </div>
        
        <Text type="secondary">
          Supabase URL: {supabaseUrl}
        </Text>
      </Space>
    </Card>
  );
};

export default SupabaseTest; 