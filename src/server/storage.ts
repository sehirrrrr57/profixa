import crypto from 'crypto';

export interface StoredDocument {
  id: string;
  userId: string;
  documentType: 'ID_FRONT' | 'ID_BACK' | 'SELFIE';
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  dataBase64?: string;
  storageToken: string;
  expiresAt?: string;
  createdAt: string;
}

export interface IStorageProvider {
  storeDocument(params: {
    userId: string;
    documentType: 'ID_FRONT' | 'ID_BACK' | 'SELFIE';
    fileName: string;
    mimeType: string;
    buffer: Buffer | string;
  }): Promise<{ documentId: string; secureToken: string; accessUrl: string }>;

  verifyDocumentAccess(documentId: string, storageToken: string, requestingUserId: string, requestingUserRole: string): boolean;
  getDocument(documentId: string): StoredDocument | null;
}

class SecureVaultStorageProvider implements IStorageProvider {
  private vault: Map<string, StoredDocument> = new Map();
  private maxFileSizeBytes = 5 * 1024 * 1024; // 5 MB configurable limit
  private allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

  public validateFile(mimeType: string, sizeBytes: number): { valid: boolean; error?: string } {
    if (!this.allowedMimeTypes.includes(mimeType.toLowerCase())) {
      return { valid: false, error: 'Invalid document type. Only JPG, PNG, WebP, and PDF files are permitted.' };
    }
    if (sizeBytes > this.maxFileSizeBytes) {
      return { valid: false, error: 'Document exceeds maximum size threshold of 5MB.' };
    }
    return { valid: true };
  }

  async storeDocument(params: {
    userId: string;
    documentType: 'ID_FRONT' | 'ID_BACK' | 'SELFIE';
    fileName: string;
    mimeType: string;
    buffer: Buffer | string;
  }): Promise<{ documentId: string; secureToken: string; accessUrl: string }> {
    const documentId = crypto.randomUUID();
    const secureToken = crypto.randomBytes(32).toString('hex');
    const base64Data = typeof params.buffer === 'string' ? params.buffer : params.buffer.toString('base64');
    const sizeBytes = Buffer.byteLength(base64Data, 'base64');

    const doc: StoredDocument = {
      id: documentId,
      userId: params.userId,
      documentType: params.documentType,
      originalFileName: params.fileName,
      mimeType: params.mimeType,
      fileSizeBytes: sizeBytes,
      dataBase64: base64Data,
      storageToken: secureToken,
      createdAt: new Date().toISOString(),
    };

    this.vault.set(documentId, doc);

    // Generate secure authorized URL
    const accessUrl = `/api/kyc/documents/${documentId}?token=${secureToken}`;
    return { documentId, secureToken, accessUrl };
  }

  verifyDocumentAccess(documentId: string, storageToken: string, requestingUserId: string, requestingUserRole: string): boolean {
    const doc = this.vault.get(documentId);
    if (!doc) return false;

    // Admins and KYC reviewers have privileged authorization
    if (['ADMIN', 'SUPER_ADMIN', 'KYC_REVIEWER'].includes(requestingUserRole)) {
      return true;
    }

    // Owner can view with correct token or session
    if (doc.userId === requestingUserId && doc.storageToken === storageToken) {
      return true;
    }

    return false;
  }

  getDocument(documentId: string): StoredDocument | null {
    return this.vault.get(documentId) || null;
  }
}

export const storageProvider = new SecureVaultStorageProvider();
