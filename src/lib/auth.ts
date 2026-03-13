import type { NextAuthOptions, User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { findUserByPhone, createUser, initTable } from '@/lib/user';

// 初始化表
initTable().catch(console.error);

export const FIXED_OTP_CODE = process.env.FIXED_OTP_CODE ?? "000000";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      phone: string;
    } & NextAuthUser;
  }

  interface User {
    phone: string;
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      id: "phone-login",
      name: "Phone Login",
      credentials: {
        phone: { label: "Phone number", type: "text" },
        code: { label: "Verification code", type: "password" },
      },
      async authorize(credentials) {
        const phone = credentials?.phone?.trim();
        const code = credentials?.code?.trim();

        if (!phone || !code) return null;
        if (code !== FIXED_OTP_CODE) {
          throw new Error("验证码不正确，请重试。");
        }

        // 查找用户 - 用 phone 查找
        let user = await findUserByPhone(phone);

        // 不存在则创建
        if (!user) {
          user = await createUser(phone);
        }

        return {
          id: String(user.id),
          phone: user.phone,  // 直接使用 phone 字段
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.phone = user.phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.phone = token.phone as string;
      }
      return session;
    },
  },
};