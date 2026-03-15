import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "PARENT" | "CHILD";
      familyId: string;
      avatarId: number;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "PARENT" | "CHILD";
    familyId: string;
    avatarId: number;
  }
}
