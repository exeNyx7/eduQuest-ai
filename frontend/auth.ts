import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import clientPromise from "@/lib/mongodb"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Add custom user data to session
      if (session.user) {
        session.user.id = user.id
        // @ts-ignore - custom fields
        session.user.profile = user.profile
        // @ts-ignore
        session.user.stats = user.stats
        // @ts-ignore
        session.user.rank = user.rank
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Initialize new user with default profile and stats
      if (!user.profile) {
        // Will be set during onboarding
        user.profile = {
          goal: null,
          subjects: [],
          powerLevel: "Novice",
        }
      }
      if (!user.stats) {
        user.stats = {
          totalXP: 0,
          currentStreak: 0,
          longestStreak: 0,
          questsCompleted: 0,
          correctAnswers: 0,
          wrongAnswers: 0,
        }
      }
      if (!user.rank) {
        user.rank = "Bronze"
      }
      // Generate DiceBear avatar if no image
      if (!user.image && user.name) {
        user.image = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`
      }
      return true
    },
  },
  pages: {
    signIn: "/auth/signin",
    newUser: "/onboarding", // Redirect new users to onboarding
  },
  session: {
    strategy: "database",
  },
})
