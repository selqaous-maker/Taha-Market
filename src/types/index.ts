export interface Product {
  id: string;
  barcode?: string | null;
  name: string;
  price: number; // in MAD
  category?: string;
  unit: string; // e.g., 'pièce', 'kg', 'L', 'paquet'
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string; // unique item id in cart
  productId?: string;
  barcode?: string | null;
  name: string;
  unitPrice: number; // in MAD
  originalPrice?: number;
  quantity: number;
  unit: string;
  lineTotal: number;
}

export interface SaleItemSnapshot {
  productId?: string;
  barcode?: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  lineTotal: number;
}

export type PaymentMethod = 'CASH' | 'CARD';

export interface SaleRecord {
  id: string; // e.g. TM-20260924-0001
  receiptNumber: string;
  timestamp: number;
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:mm:ss
  items: SaleItemSnapshot[];
  itemCount: number;
  total: number; // in MAD
  paymentMethod: PaymentMethod;
  amountReceived: number;
  changeDue: number;
  cashierNote?: string;
}

export interface ShopSettings {
  shopName: string;
  phone: string;
  address: string;
  currency: 'MAD' | 'DH';
  ownerPin: string;
  pinRequiredForPriceChange: boolean;
  pinRequiredForDelete: boolean;
  receiptFooter: string;
  lastBackupAt: string | null;
}

export interface BackupPayload {
  version: number;
  exportedAt: string;
  shopName: string;
  products: Product[];
  sales: SaleRecord[];
  settings: ShopSettings;
}
