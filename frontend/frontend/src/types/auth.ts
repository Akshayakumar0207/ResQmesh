export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string;
  role: "REQUESTER" | "PROVIDER" | "ADMIN";
  hasPassword: boolean;
}

export interface AuthTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresInMinutes: number;
  user: AuthUser;
}

export interface BroadcastNotification {
  id: string;
  userId: string | null;
  requestId: string | null;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: string;
}

export interface NewEmergencyPush {
  type: "new_emergency";
  id: string;
  requestCode: string;
  category: string;
  severity: string;
  priorityScore: number;
  locationLabel: string;
  description: string;
}
