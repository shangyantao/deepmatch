import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // 1. 验证登录
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // 2. 获取上传的文件
    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json({ error: '没有文件' }, { status: 400 });
    }

    // 3. 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '只支持 JPG、PNG、GIF、WEBP 格式' },
        { status: 400 }
      );
    }

    // 4. 验证文件大小（2MB）
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '文件大小不能超过 2MB' },
        { status: 400 }
      );
    }

    // 5. 生成安全的文件名
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 生成哈希文件名，避免中文乱码和冲突
    const hash = crypto.randomBytes(16).toString('hex');
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${hash}.${ext}`;

    // 6. 确保上传目录存在
    const uploadDir = path.join(process.cwd(), 'public/uploads/avatars');
    await mkdir(uploadDir, { recursive: true });

    // 7. 保存文件
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // 8. 生成访问 URL
    const avatarUrl = `/uploads/avatars/${fileName}`;

    // 9. 更新数据库中的用户头像
    await query(
      'UPDATE users SET avatar = $1 WHERE id = $2',
      [avatarUrl, userId]
    );

    return NextResponse.json({
      success: true,
      url: avatarUrl,
    });

  } catch (error) {
    console.error('上传失败:', error);
    return NextResponse.json(
      { error: '上传失败' },
      { status: 500 }
    );
  }
}