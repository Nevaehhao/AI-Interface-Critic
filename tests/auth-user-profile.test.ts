import { describe, expect, it } from "vitest";

import {
  getUserProfileInitials,
  getUserProfileName,
} from "@/lib/auth/user-profile";

describe("auth user profile helpers", () => {
  it("prefers the explicit user name", () => {
    expect(
      getUserProfileName({
        email: "ruiyaohao@gmail.com",
        name: "Ruiyao Hao",
      }),
    ).toBe("Ruiyao Hao");
  });

  it("falls back to the email local part", () => {
    expect(
      getUserProfileName({
        email: "ruiyaohao@gmail.com",
      }),
    ).toBe("ruiyaohao");
  });

  it("builds two-letter initials from a full name", () => {
    expect(
      getUserProfileInitials({
        name: "Ruiyao Hao",
      }),
    ).toBe("RH");
  });

  it("builds initials from the fallback account label", () => {
    expect(getUserProfileInitials(null)).toBe("AC");
  });
});
