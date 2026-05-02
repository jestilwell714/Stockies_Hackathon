import type {
  ClassifierResult,
  MerchantCacheEntry,
  SpendingCategory,
  Transaction,
} from './types';

type CategorizeInput = {
  transaction: Transaction;
  badCategories: SpendingCategory[];
  merchantCache: Record<string, MerchantCacheEntry>;
  classify: (transaction: Transaction) => Promise<ClassifierResult>;
};

const normalizeMerchant = (merchant: string) => merchant.trim().toLowerCase();

const lookupMerchantCache = (
  merchant: string,
  merchantCache: Record<string, MerchantCacheEntry>,
): MerchantCacheEntry | undefined => {
  const normalized = normalizeMerchant(merchant);

  return Object.entries(merchantCache).find(([cachedMerchant]) => {
    const cached = normalizeMerchant(cachedMerchant);
    return cached === normalized || normalized.includes(cached);
  })?.[1];
};

export const categorizeTransactionForStorage = async ({
  transaction,
  badCategories,
  merchantCache,
  classify,
}: CategorizeInput): Promise<Transaction> => {
  if (transaction.category) {
    return {
      ...transaction,
      isBadSpend: badCategories.includes(transaction.category),
    };
  }

  const cached = lookupMerchantCache(transaction.merchant, merchantCache);

  if (cached) {
    return {
      ...transaction,
      category: cached.category,
      categoryMethod: cached.method,
      categorizedAt: new Date().toISOString(),
      isBadSpend: badCategories.includes(cached.category),
      needsReview: false,
    };
  }

  const classified = await classify(transaction);

  return {
    ...transaction,
    category: classified.category,
    categoryMethod: classified.method,
    categorizedAt: new Date().toISOString(),
    isBadSpend: badCategories.includes(classified.category),
    needsReview: classified.needsReview,
  };
};
