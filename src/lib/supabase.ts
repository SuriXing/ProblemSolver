import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';
import { getEnvironment } from '../utils/environment';

// Debug: Log all available environment variables
console.log('All env keys:', Object.keys(import.meta.env));

// Debug the environment
console.log('Environment check:');
console.log('- typeof window:', typeof window);
console.log('- typeof import.meta:', typeof import.meta);
console.log('- import.meta available:', import.meta ? 'yes' : 'no');
console.log('- import.meta.env available:', import.meta && import.meta.env ? 'yes' : 'no');

const env = getEnvironment();
const supabaseUrl = env.SUPABASE_URL;
const supabaseAnonKey = env.SUPABASE_ANON_KEY;

// Debug values
console.log('VITE_SUPABASE_URL value type:', typeof supabaseUrl);
console.log('VITE_SUPABASE_URL actual value:', supabaseUrl);

// 检查环境变量是否可用
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

// 记录配置
console.log('Using Supabase URL:', supabaseUrl);
if (supabaseAnonKey) {
  console.log('Anon Key (first 10 chars):', supabaseAnonKey.substring(0, 10) + '...');
}

// 为整个应用创建单个 supabase 客户端
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// 添加检查连接的函数
export async function checkSupabaseConnection() {
  try {
    console.log('Checking Supabase connection to URL:', supabaseUrl);
    
    // 尝试查询 posts 表
    const { error } = await supabase.from('posts').select('count', { count: 'exact', head: true });
    
    if (error) {
      // 如果 posts 表还不存在，这是可以的
      if (error.code === '42P01') {
        console.log('Posts table does not exist yet. This is expected if you need to run the setup scripts.');
        return true; // 返回 true 以允许应用继续到设置屏幕
      }
      
      console.error('Error connecting to Supabase:', error);
      return false;
    }
    
    console.log('Successfully connected to Supabase');
    return true;
  } catch (error) {
    console.error('Error connecting to Supabase:', error);
    return false;
  }
} 