'use client';
import AvatarUpload from '@/components/AvatarUpload';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SkeletonProfile } from '@/components/Skeleton';
import Link from 'next/link';
import { useToast } from '@/components/Toast'; 


interface UserProfile {
  id: number;
  phone: string;
  name: string | null;
  avatar: string | null;
  gender: string | null;
  birthday: string | null;
  city: string | null;
  bio: string | null;
  answers: any;
  stats: {
    matches: number;
    messages: number;
    joinDate: string;
  };
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  useEffect(() => {
    fetchProfile();
  }, []);
  
  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile');
      const data = await res.json();
      
      if (res.ok) {
        setProfile(data);
      }
    } catch (error) {
      console.error('加载资料失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '未知';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '未知';
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return '未知';
    }
  };
  
  const getAge = (birthday: string | null) => {
    if (!birthday) return null;
    const birth = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };
  
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-md mx-auto px-4 py-8">
          <SkeletonProfile />
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            个人资料
          </h1>
          <button
            onClick={() => setEditing(!editing)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm hover:opacity-90 transition shadow-sm"
          >
            {editing ? '完成' : '编辑'}
          </button>
        </div>
        
        {editing ? (
          <EditProfileForm profile={profile} onSave={() => {
            setEditing(false);
            fetchProfile();
          }} />
        ) : (
          <>
            {/* 头像卡片 */}
            {/* 头像卡片 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-4 text-center border border-gray-100">
            <AvatarUpload
                currentAvatar={profile?.avatar}
                onUploadSuccess={(url) => {
                // 上传成功后更新 profile
                setProfile(prev => prev ? { ...prev, avatar: url } : null);
                }}
            />
            <h2 className="text-xl font-bold text-gray-800 mt-2">
                {profile?.name || '未设置昵称'}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
                加入于 {profile?.stats.joinDate ? formatDate(profile.stats.joinDate).split('年')[0] + '年' : '未知'}
            </p>
            </div>
            
            {/* 统计数据卡片 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-4 border border-gray-100">
              <h3 className="text-sm font-medium text-gray-400 mb-4 tracking-wider">📊 统计数据</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {profile?.stats.matches || 0}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">匹配次数</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {profile?.stats.messages || 0}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">消息总数</div>
                </div>
              </div>
            </div>
            {/* 暗恋入口 */}
            <Link
            href="/crushes"
            className="bg-white rounded-2xl p-4 shadow-sm mb-4 border border-gray-100 flex items-center justify-between hover:shadow-md transition"
            >
            <div className="flex items-center">
                <span className="text-2xl mr-3">💘</span>
                <div>
                <h3 className="font-medium text-gray-800">暗恋</h3>
                <p className="text-xs text-gray-400">看看谁在暗恋你，添加你的暗恋对象</p>
                </div>
            </div>
            <span className="text-purple-600">→</span>
            </Link>
            {/* 新增：匹配历史入口 */}
            <Link
            href="/profile/history"
            className="bg-white rounded-2xl p-4 shadow-sm mb-4 border border-gray-100 flex items-center justify-between hover:shadow-md transition"
            >
            <div className="flex items-center">
                <span className="text-2xl mr-3">📅</span>
                <div>
                <h3 className="font-medium text-gray-800">匹配历史</h3>
                <p className="text-xs text-gray-400">查看你过去的所有匹配</p>
                </div>
            </div>
            <span className="text-purple-600">→</span>
            </Link>
            
            {/* 基本信息卡片 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-4 border border-gray-100">
              <h3 className="text-sm font-medium text-gray-400 mb-4 tracking-wider">📋 基本信息</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">📱 手机号</span>
                  <span className="font-medium text-gray-800">{profile?.phone}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">🏷️ 昵称</span>
                  <span className="font-medium text-gray-800">{profile?.name || '未设置'}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">⚥ 性别</span>
                  <span className="font-medium text-gray-800">
                    {profile?.gender === 'male' ? '男' : 
                     profile?.gender === 'female' ? '女' : '未设置'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">🎂 年龄</span>
                  <span className="font-medium text-gray-800">
                    {getAge(profile?.birthday || null) ? `${getAge(profile?.birthday || null)}岁` : '未设置'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">📍 城市</span>
                  <span className="font-medium text-gray-800">{profile?.city || '未设置'}</span>
                </div>
              </div>
            </div>
            
            {/* 个人简介卡片 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-4 border border-gray-100">
              <h3 className="text-sm font-medium text-gray-400 mb-4 tracking-wider">📝 个人简介</h3>
              <p className="text-gray-600 leading-relaxed">
                {profile?.bio || '这个人很懒，什么都没写~'}
              </p>
            </div>
            
            {/* 价值观标签 */}
            {profile?.answers && Object.keys(profile.answers).length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border border-gray-100">
                <h3 className="text-sm font-medium text-gray-400 mb-4 tracking-wider">🏷️ 价值观标签</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.answers[1]?.map((tag: string) => (
                    <span key={tag} className="px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 rounded-full text-sm font-medium border border-purple-100">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* 操作按钮 */}
            <div className="space-y-3">
              <Link
                href="/onboarding"
                className="block w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center rounded-2xl font-medium hover:opacity-90 transition shadow-sm"
              >
                重新完成价值观测试
              </Link>
              <button
                // 修改退出登录的处理
                onClick={async () => {
                    if (confirm('确定要退出登录吗？')) {
                    try {
                        await fetch('/api/auth/signout', { method: 'POST' });
                        showToast('已退出登录', 'success');
                        router.push('/login');
                    } catch (error) {
                        showToast('退出失败，请重试', 'error');
                    }
                    }
                }}
                className="w-full py-4 border border-red-200 text-red-500 rounded-2xl font-medium hover:bg-red-50 transition"
              >
                退出登录
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// 编辑表单组件
function EditProfileForm({ profile, onSave }: { profile: UserProfile | null, onSave: () => void }) {
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    gender: profile?.gender || '',
    birthday: profile?.birthday || '',
    city: profile?.city || '',
    bio: profile?.bio || '',
  });
  const [saving, setSaving] = useState(false);
  
  // 当 profile 变化时更新表单数据
  useEffect(() => {
    setFormData({
      name: profile?.name || '',
      gender: profile?.gender || '',
      birthday: profile?.birthday || '',
      city: profile?.city || '',
      bio: profile?.bio || '',
    });
  }, [profile]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        onSave();
      } else {
        const data = await res.json();
        alert(data.error || '保存失败');
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-4 border border-gray-100">
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">昵称</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
          placeholder="输入昵称"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">性别</label>
        <select
          value={formData.gender}
          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
        >
          <option value="">请选择</option>
          <option value="male">男</option>
          <option value="female">女</option>
          <option value="other">其他</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">生日</label>
        <input
          type="date"
          value={formData.birthday}
          onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">城市</label>
        <input
          type="text"
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
          placeholder="输入城市"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">个人简介</label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          rows={4}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
          placeholder="介绍一下自己..."
        />
      </div>
      
      <button
        type="submit"
        disabled={saving}
        className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50 mt-4"
      >
        {saving ? '保存中...' : '保存修改'}
      </button>
    </form>
  );
}