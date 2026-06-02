import Dexie, { type Table } from 'dexie';

export interface LocalProduct {
  id: string;
  name: string;
  sku: string | null;
  unitPrice: number;
  stockQuantity: number;
  categoryId: string | null;
  metadata: any;
}

export interface LocalCategory {
  id: string;
  name: string;
}

export interface PendingSale {
  id?: number;
  items: {
    productId?: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
    isExternalSourced?: boolean;
    externalSourceName?: string;
    externalCostPrice?: number;
  }[];
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: number;
  synced: boolean;
}

export class OfflineDB extends Dexie {
  products!: Table<LocalProduct>;
  categories!: Table<LocalCategory>;
  pendingSales!: Table<PendingSale>;

  constructor() {
    super('UniversalBusinessPOS');
    this.version(1).stores({
      products: 'id, name, sku, categoryId',
      categories: 'id, name',
      pendingSales: '++id, createdAt, synced'
    });
  }
}

export const db = new OfflineDB();
