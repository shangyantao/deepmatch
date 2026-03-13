import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // 创建测试用户 - 使用 phone 字段
    await query(`
      INSERT INTO users (phone, name, answers) VALUES 
      ('13800000001', '测试用户1', '{
        "1": ["家庭", "健康", "自由"],
        "2": "家庭幸福",
        "3": 4,
        "4": 3,
        "5": 4,
        "6": "善意谎言可以接受",
        "7": "物质有一定帮助",
        "8": 4,
        "9": "环游世界",
        "10": 2
      }'),
      ('13800000002', '测试用户2', '{
        "1": ["自由", "冒险", "创造力"],
        "2": "自我实现",
        "3": 5,
        "4": 4,
        "5": 5,
        "6": "视情况而定",
        "7": "幸福与物质无关",
        "8": 5,
        "9": "改变世界",
        "10": 3
      }'),
      ('13800000003', '测试用户3', '{
        "1": ["家庭", "成就", "安全感"],
        "2": "财富自由",
        "3": 3,
        "4": 2,
        "5": 2,
        "6": "原则问题不骗",
        "7": "物质是幸福的基础",
        "8": 2,
        "9": "买房结婚",
        "10": 1
      }')
      ON CONFLICT (phone) DO NOTHING
    `);
    
    // 验证是否创建成功 - 使用 phone 字段
    const result = await query(`SELECT phone, name FROM users WHERE phone LIKE '138000000%'`);
    
    return NextResponse.json({ 
      success: true, 
      message: '测试数据创建成功',
      users: result.rows 
    });
  } catch (error) {
    console.error('创建测试数据失败:', error);
    return NextResponse.json({ 
      error: '创建失败', 
      details: String(error) 
    }, { status: 500 });
  }
}