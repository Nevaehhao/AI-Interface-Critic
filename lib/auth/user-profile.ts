type AuthProfileUser = {
  email?: string | null;
  image?: string | null;
  name?: string | null;
};

export function getUserProfileName(user: AuthProfileUser | null | undefined) {
  const trimmedName = user?.name?.trim();

  if (trimmedName) {
    return trimmedName;
  }

  const localPart = user?.email?.split("@")[0]?.trim();

  if (localPart) {
    return localPart;
  }

  return "Account";
}

export function getUserProfileInitials(user: AuthProfileUser | null | undefined) {
  const source = getUserProfileName(user);
  const parts = source.split(/[\s._-]+/).filter(Boolean);

  if (parts.length === 0) {
    return "AI";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}
