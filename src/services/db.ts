import { Product, SaleRecord, ShopSettings, BackupPayload } from '../types';

const DB_NAME = 'TahaMarketPOS_DB';
const DB_VERSION = 1;

// Default Moroccan Grocery seed catalog for Taha Market
export const DEFAULT_PRODUCTS: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    barcode: '6111242100125',
    name: 'Lait Centrale Demi-Écrémé 1/2L',
    price: 4.00,
    category: 'Produits Laitiers',
    unit: 'pièce',
    isActive: true,
  },
  {
    barcode: '6111242100231',
    name: 'Raibi Jamila Grenade',
    price: 2.50,
    category: 'Produits Laitiers',
    unit: 'pièce',
    isActive: true,
  },
  {
    barcode: '6111015001017',
    name: 'Eau Minérale Sidi Ali 1.5L',
    price: 6.00,
    category: 'Boissons',
    unit: 'pièce',
    isActive: true,
  },
  {
    barcode: '6111015002021',
    name: 'Eau Minérale Aïn Saïss 1.5L',
    price: 5.50,
    category: 'Boissons',
    unit: 'pièce',
    isActive: true,
  },
  {
    barcode: '6111054000123',
    name: 'Huile de Table Lesieur 1L',
    price: 18.00,
    category: 'Épicerie',
    unit: 'pièce',
    isActive: true,
  },
  {
    barcode: '6111032001144',
    name: 'Thé Vert Sultan Lion 200g',
    price: 16.50,
    category: 'Épicerie',
    unit: 'paquet',
    isActive: true,
  },
  {
    barcode: '6111048001556',
    name: 'Couscous Dari Moyen 1kg',
    price: 14.00,
    category: 'Épicerie',
    unit: 'paquet',
    isActive: true,
  },
  {
    barcode: '6111029000112',
    name: 'Fromage La Vache Qui Rit (16 portions)',
    price: 17.50,
    category: 'Produits Laitiers',
    unit: 'boîte',
    isActive: true,
  },
  {
    barcode: '6111067000109',
    name: 'Biscuit Merendina Choco',
    price: 2.50,
    category: 'Snacks & Biscuits',
    unit: 'pièce',
    isActive: true,
  },
  {
    barcode: '6111067000215',
    name: 'Biscuit Bimo Golden',
    price: 1.50,
    category: 'Snacks & Biscuits',
    unit: 'pièce',
    isActive: true,
  },
  {
    barcode: '6111082000301',
    name: 'Lessive OMO Main 500g',
    price: 12.00,
    category: 'Hygiène & Entretien',
    unit: 'sachet',
    isActive: true,
  },
  {
    barcode: '6111089000100',
    name: 'Savon Taous Nature 125g',
    price: 4.50,
    category: 'Hygiène & Entretien',
    unit: 'pièce',
    isActive: true,
  },
  {
    barcode: '6111095000507',
    name: 'Café Moulu Samar 250g',
    price: 22.00,
    category: 'Épicerie',
    unit: 'paquet',
    isActive: true,
  },
  {
    barcode: '6111011000151',
    name: 'Sucre Morceaux Enmer 1kg',
    price: 7.00,
    category: 'Épicerie',
    unit: 'paquet',
    isActive: true,
  },
  // Items without barcode configured in catalog
  {
    barcode: null,
    name: 'Pain rond marocain (Khobz)',
    price: 1.20,
    category: 'Boulangerie',
    unit: 'pièce',
    isActive: true,
  },
  {
    barcode: null,
    name: 'Baguette parisienne',
    price: 1.20,
    category: 'Boulangerie',
    unit: 'pièce',
    isActive: true,
  },
  {
    barcode: null,
    name: 'Oeuf fermier frais',
    price: 1.40,
    category: 'Frais',
    unit: 'pièce',
    isActive: true,
  },
  {
    barcode: null,
    name: 'Pommes de terre fraîches',
    price: 6.50,
    category: 'Fruits & Légumes',
    unit: 'kg',
    isActive: true,
  },
  {
    barcode: null,
    name: 'Tomates fraîches',
    price: 5.00,
    category: 'Fruits & Légumes',
    unit: 'kg',
    isActive: true,
  },
  {
    barcode: null,
    name: 'Oignons rouges',
    price: 4.50,
    category: 'Fruits & Légumes',
    unit: 'kg',
    isActive: true,
  },
  {
    barcode: null,
    name: 'Menthe fraîche (Naânaâ)',
    price: 1.50,
    category: 'Fruits & Légumes',
    unit: 'botte',
    isActive: true,
  }
];

export const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'Taha Market',
  phone: '+212 6 00 00 00 00',
  address: 'Quartier Al Wifaq, Magasin N° 4, Maroc',
  currency: 'MAD',
  ownerPin: '1234',
  pinRequiredForPriceChange: false,
  pinRequiredForDelete: true,
  receiptFooter: 'Choukran pour votre visite ! Taha Market vous remercie.',
  lastBackupAt: null,
};

class PosDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB non supporté par ce navigateur'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;
        
        // Products store
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('barcode', 'barcode', { unique: false });
          productStore.createIndex('name', 'name', { unique: false });
          productStore.createIndex('isActive', 'isActive', { unique: false });
          productStore.createIndex('category', 'category', { unique: false });
        }

        // Sales store
        if (!db.objectStoreNames.contains('sales')) {
          const salesStore = db.createObjectStore('sales', { keyPath: 'id' });
          salesStore.createIndex('timestamp', 'timestamp', { unique: false });
          salesStore.createIndex('dateStr', 'dateStr', { unique: false });
          salesStore.createIndex('paymentMethod', 'paymentMethod', { unique: false });
        }

        // Settings store (key-value)
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = async () => {
        const db = request.result;
        await this.initializeDefaults(db);
        resolve(db);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  private async initializeDefaults(db: IDBDatabase): Promise<void> {
    // Check if products store is empty; if so, populate with default Moroccan catalog
    const count = await new Promise<number>((res) => {
      const tx = db.transaction('products', 'readonly');
      const store = tx.objectStore('products');
      const req = store.count();
      req.onsuccess = () => res(req.result);
      req.onerror = () => res(0);
    });

    if (count === 0) {
      const tx = db.transaction('products', 'readwrite');
      const store = tx.objectStore('products');
      const now = new Date().toISOString();
      DEFAULT_PRODUCTS.forEach((item, index) => {
        const id = `prod_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 7)}`;
        const product: Product = {
          ...item,
          id,
          createdAt: now,
          updatedAt: now,
        };
        store.put(product);
      });
    }

    // Check settings
    const settingsTx = db.transaction('settings', 'readwrite');
    const settingsStore = settingsTx.objectStore('settings');
    const getReq = settingsStore.get('shopSettings');
    getReq.onsuccess = () => {
      if (!getReq.result) {
        settingsStore.put({ key: 'shopSettings', value: DEFAULT_SETTINGS });
      }
    };
  }

  // --- PRODUCTS API ---

  async getAllProducts(): Promise<Product[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('products', 'readonly');
      const store = tx.objectStore('products');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async getProductByBarcode(barcode: string): Promise<Product | null> {
    const cleanBarcode = barcode.trim();
    if (!cleanBarcode) return null;
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('products', 'readonly');
      const store = tx.objectStore('products');
      const index = store.index('barcode');
      const req = index.get(cleanBarcode);
      req.onsuccess = () => {
        const product = req.result as Product | undefined;
        if (product && product.isActive) {
          resolve(product);
        } else if (product && !product.isActive) {
          // Inactive product exists
          resolve(null);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getProductById(id: string): Promise<Product | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('products', 'readonly');
      const store = tx.objectStore('products');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async saveProduct(productInput: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Product> {
    const db = await this.getDB();
    const now = new Date().toISOString();
    
    // Check barcode duplication
    if (productInput.barcode && productInput.barcode.trim() !== '') {
      const barcodeClean = productInput.barcode.trim();
      const existing = await this.getProductByBarcode(barcodeClean);
      if (existing && existing.id !== productInput.id) {
        throw new Error(`Le code-barres "${barcodeClean}" est déjà utilisé par "${existing.name}"`);
      }
    }

    if (productInput.price < 0) {
      throw new Error('Le prix ne peut pas être négatif');
    }
    if (!productInput.name.trim()) {
      throw new Error('Le nom du produit est obligatoire');
    }

    const id = productInput.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const product: Product = {
      id,
      name: productInput.name.trim(),
      price: Math.round(productInput.price * 100) / 100,
      barcode: productInput.barcode ? productInput.barcode.trim() : null,
      category: productInput.category?.trim() || 'Divers',
      unit: productInput.unit?.trim() || 'pièce',
      isActive: productInput.isActive !== undefined ? productInput.isActive : true,
      createdAt: now,
      updatedAt: now,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('products', 'readwrite');
      const store = tx.objectStore('products');
      const req = store.put(product);
      req.onsuccess = () => resolve(product);
      req.onerror = () => reject(req.error);
    });
  }

  async updateProductPrice(productId: string, newPrice: number): Promise<Product> {
    if (newPrice < 0) {
      throw new Error('Le prix ne peut pas être négatif');
    }
    const product = await this.getProductById(productId);
    if (!product) throw new Error('Produit introuvable');
    
    product.price = Math.round(newPrice * 100) / 100;
    product.updatedAt = new Date().toISOString();

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('products', 'readwrite');
      const store = tx.objectStore('products');
      const req = store.put(product);
      req.onsuccess = () => resolve(product);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteProduct(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('products', 'readwrite');
      const store = tx.objectStore('products');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- SALES API ---

  async saveSale(sale: Omit<SaleRecord, 'id' | 'receiptNumber'>): Promise<SaleRecord> {
    const db = await this.getDB();
    
    // Generate unique receipt ID: TM-YYYYMMDD-XXXX
    const dateObj = new Date(sale.timestamp);
    const datePart = dateObj.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Get count of sales for today to assign incremental number
    const todaySales = await this.getSalesForDate(sale.dateStr);
    const sequence = (todaySales.length + 1).toString().padStart(4, '0');
    const receiptNumber = `TM-${datePart}-${sequence}`;
    const id = receiptNumber;

    const fullSale: SaleRecord = {
      ...sale,
      id,
      receiptNumber,
      total: Math.round(sale.total * 100) / 100,
      amountReceived: Math.round(sale.amountReceived * 100) / 100,
      changeDue: Math.max(0, Math.round(sale.changeDue * 100) / 100),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('sales', 'readwrite');
      const store = tx.objectStore('sales');
      const req = store.add(fullSale);
      req.onsuccess = () => resolve(fullSale);
      req.onerror = () => reject(req.error);
    });
  }

  async getAllSales(): Promise<SaleRecord[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sales', 'readonly');
      const store = tx.objectStore('sales');
      const req = store.getAll();
      req.onsuccess = () => {
        const sales = (req.result || []) as SaleRecord[];
        // Sort descending by timestamp (newest first)
        sales.sort((a, b) => b.timestamp - a.timestamp);
        resolve(sales);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getSalesForDate(dateStr: string): Promise<SaleRecord[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sales', 'readonly');
      const store = tx.objectStore('sales');
      const index = store.index('dateStr');
      const req = index.getAll(dateStr);
      req.onsuccess = () => {
        const sales = (req.result || []) as SaleRecord[];
        sales.sort((a, b) => b.timestamp - a.timestamp);
        resolve(sales);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getSaleById(id: string): Promise<SaleRecord | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sales', 'readonly');
      const store = tx.objectStore('sales');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  // --- SETTINGS API ---

  async getSettings(): Promise<ShopSettings> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const req = store.get('shopSettings');
      req.onsuccess = () => {
        if (req.result && req.result.value) {
          resolve({ ...DEFAULT_SETTINGS, ...req.result.value });
        } else {
          resolve(DEFAULT_SETTINGS);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  async saveSettings(settings: Partial<ShopSettings>): Promise<ShopSettings> {
    const current = await this.getSettings();
    const updated: ShopSettings = { ...current, ...settings };
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      const req = store.put({ key: 'shopSettings', value: updated });
      req.onsuccess = () => resolve(updated);
      req.onerror = () => reject(req.error);
    });
  }

  // --- BACKUP & RESTORE API ---

  async exportBackup(): Promise<BackupPayload> {
    const [products, sales, settings] = await Promise.all([
      this.getAllProducts(),
      this.getAllSales(),
      this.getSettings(),
    ]);

    // Update lastBackupAt
    const now = new Date().toISOString();
    await this.saveSettings({ lastBackupAt: now });
    settings.lastBackupAt = now;

    return {
      version: 1,
      exportedAt: now,
      shopName: settings.shopName,
      products,
      sales,
      settings,
    };
  }

  async importBackup(data: unknown, mode: 'merge' | 'replace'): Promise<{ importedProducts: number; importedSales: number }> {
    if (!data || typeof data !== 'object') {
      throw new Error('Fichier de sauvegarde invalide');
    }

    const payload = data as Partial<BackupPayload>;
    if (!Array.isArray(payload.products) || !Array.isArray(payload.sales)) {
      throw new Error('Structure du fichier invalide: listes de produits ou ventes manquantes');
    }

    // Validate products
    const validProducts: Product[] = [];
    const seenBarcodes = new Set<string>();

    for (const p of payload.products) {
      if (!p.name || typeof p.name !== 'string') continue;
      if (typeof p.price !== 'number' || p.price < 0) continue;
      const barcode = p.barcode ? String(p.barcode).trim() : null;
      if (barcode) {
        if (seenBarcodes.has(barcode)) {
          // Duplicate within import file
          continue;
        }
        seenBarcodes.add(barcode);
      }
      validProducts.push({
        id: p.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: p.name.trim(),
        price: Math.round(p.price * 100) / 100,
        barcode,
        category: p.category || 'Divers',
        unit: p.unit || 'pièce',
        isActive: p.isActive !== undefined ? Boolean(p.isActive) : true,
        createdAt: p.createdAt || new Date().toISOString(),
        updatedAt: p.updatedAt || new Date().toISOString(),
      });
    }

    // Validate sales
    const validSales: SaleRecord[] = [];
    for (const s of payload.sales) {
      if (!s.id || !s.total || !Array.isArray(s.items)) continue;
      validSales.push(s);
    }

    const db = await this.getDB();

    if (mode === 'replace') {
      // Clear stores
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(['products', 'sales'], 'readwrite');
        tx.objectStore('products').clear();
        tx.objectStore('sales').clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }

    // Write records in batch
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['products', 'sales'], 'readwrite');
      const productStore = tx.objectStore('products');
      const saleStore = tx.objectStore('sales');

      validProducts.forEach((p) => productStore.put(p));
      validSales.forEach((s) => saleStore.put(s));

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    if (payload.settings) {
      await this.saveSettings(payload.settings);
    }

    return {
      importedProducts: validProducts.length,
      importedSales: validSales.length,
    };
  }

  // --- STATS & ESTIMATES ---

  async getStorageInfo(): Promise<{ isIndexedDB: boolean; quotaBytes?: number; usageBytes?: number; productCount: number; saleCount: number }> {
    const products = await this.getAllProducts();
    const sales = await this.getAllSales();

    let quotaBytes: number | undefined;
    let usageBytes: number | undefined;

    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        quotaBytes = estimate.quota;
        usageBytes = estimate.usage;
      } catch {
        // Ignore
      }
    }

    return {
      isIndexedDB: true,
      quotaBytes,
      usageBytes,
      productCount: products.length,
      saleCount: sales.length,
    };
  }

  // Reset demo catalog
  async resetToDemo(): Promise<void> {
    const db = await this.getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('products', 'readwrite');
      tx.objectStore('products').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    await this.initializeDefaults(db);
  }
}

export const dbService = new PosDatabase();
