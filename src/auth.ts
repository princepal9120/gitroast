import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          // Request access to private repos and user email
          scope: "read:user user:email repo",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Store the GitHub access token in the JWT
      if (account?.access_token) {
        token.accessToken = account.access_token;
        token.githubUsername = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose access token and username to client
      session.accessToken = token.accessToken as string;
      session.githubUsername = token.githubUsername as string;
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
});
