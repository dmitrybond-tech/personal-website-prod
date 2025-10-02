import { defineConfig } from 'auth-astro';
import GitHub from '@auth/core/providers/github';

export default defineConfig({
  providers: [
    GitHub({
      clientId: import.meta.env.AUTHJS_GITHUB_CLIENT_ID,
      clientSecret: import.meta.env.AUTHJS_GITHUB_CLIENT_SECRET,
      authorization: { params: { scope: 'read:user user:email read:org' } },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) token.accessToken = account.access_token;
      return token;
    },
    async session({ session, token }) {
      if (token.accessToken) (session as any).accessToken = token.accessToken as string;
      return session;
    },
  },
});
