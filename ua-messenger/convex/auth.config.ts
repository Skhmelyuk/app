import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: "https://new-dory-94.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
