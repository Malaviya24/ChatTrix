export interface EncryptionKey {
  key: string;
  salt: string;
  iterations: number;
}

export interface EncryptedMessage {
  encryptedContent: string;
  iv: string;
  authTag: string;
  timestamp: number;
}

export interface SecuritySettings {
  messageExpirationMinutes: number;
  regretWindowSeconds: number;

  invisibleMode: boolean;
  panicModeEnabled: boolean;
  maxParticipants: number;
}



export interface PanicMode {
  isActive: boolean;
  activatedAt: Date;
  dataCleared: boolean;
  emergencyExit: boolean;
}

export interface MessageSecurity {
  isEncrypted: boolean;
  encryptionMethod: 'AES-256-GCM' | 'ChaCha20-Poly1305';
  keyDerivation: 'PBKDF2' | 'Argon2';
  expirationTime: Date;
  isRead: boolean;
  readAt?: Date;
  canRegret: boolean;
  regretExpiresAt: Date;
}

export interface RoomSecurity {
  passwordHash: string;
  salt: string;
  iterations: number;
  encryptionKey: string;
  isPrivate: boolean;
  accessControl: 'password' | 'invite' | 'public';
  maxAttempts: number;
  lockoutDuration: number;
}

export interface UserPrivacy {
  nickname: string;
  avatar: string;
  isAnonymous: boolean;
  realName?: string;
  email?: string;
  lastSeen: Date;
  sessionId: string;
  deviceFingerprint: string;
}

export interface SecurityAudit {
  loginAttempts: number;
  failedAttempts: number;
  lastFailedAttempt: Date;
  ipAddress: string;
  userAgent: string;
  suspiciousActivity: boolean;
  riskScore: number;
}
