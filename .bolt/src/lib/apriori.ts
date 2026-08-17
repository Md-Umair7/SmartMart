export interface AssociationRule {
  antecedent: string[];
  consequent: string[];
  support: number;
  confidence: number;
  lift: number;
  conviction: number;
}

export interface FrequentItemset {
  items: string[];
  support: number;
  count: number;
}

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 1) return arr.map((a) => [a]);
  if (k > arr.length) return [];
  const result: T[][] = [];
  for (let i = 0; i <= arr.length - k; i++) {
    const rest = combinations(arr.slice(i + 1), k - 1);
    for (const c of rest) {
      result.push([arr[i], ...c]);
    }
  }
  return result;
}

function key(items: string[]): string {
  return [...items].sort().join('|');
}

export function runApriori(
  transactions: string[][],
  minSupport: number = 0.05,
  minConfidence: number = 0.3,
  maxItemsetSize: number = 4
): { frequentItemsets: FrequentItemset[]; rules: AssociationRule[] } {
  const totalTransactions = transactions.length;
  if (totalTransactions === 0) return { frequentItemsets: [], rules: [] };

  const minCount = Math.ceil(minSupport * totalTransactions);

  const allItems = new Set<string>();
  for (const t of transactions) {
    for (const item of t) allItems.add(item);
  }

  const frequentItemsets: FrequentItemset[] = [];
  const frequentByLevel: Map<string, number> = new Map();

  // Level 1
  const itemCounts = new Map<string, number>();
  for (const t of transactions) {
    for (const item of t) {
      itemCounts.set(item, (itemCounts.get(item) || 0) + 1);
    }
  }

  const level1 = new Set<string>();
  for (const [item, count] of itemCounts) {
    if (count >= minCount) {
      const support = count / totalTransactions;
      frequentByLevel.set(key([item]), support);
      level1.add(item);
      frequentItemsets.push({ items: [item], support, count });
    }
  }

  // Higher levels
  let prevItems = [...level1];
  for (let level = 2; level <= maxItemsetSize; level++) {
    const candidates = combinations(prevItems, level);
    const candidateKeys = new Map<string, string[]>();
    for (const c of candidates) {
      const subsets = combinations(c, level - 1);
      const allSubsetsFrequent = subsets.every((s) => frequentByLevel.has(key(s)));
      if (allSubsetsFrequent) {
        candidateKeys.set(key(c), c);
      }
    }

    if (candidateKeys.size === 0) break;

    const candidateCounts = new Map<string, number>();
    for (const t of transactions) {
      const tSet = new Set(t);
      for (const [k, items] of candidateKeys) {
        if (items.every((i) => tSet.has(i))) {
          candidateCounts.set(k, (candidateCounts.get(k) || 0) + 1);
        }
      }
    }

    const currentLevelItems = new Set<string>();
    for (const [k, count] of candidateCounts) {
      if (count >= minCount) {
        const items = candidateKeys.get(k)!;
        const support = count / totalTransactions;
        frequentByLevel.set(k, support);
        for (const i of items) currentLevelItems.add(i);
        frequentItemsets.push({ items, support, count });
      }
    }

    if (currentLevelItems.size === 0) break;
    prevItems = [...currentLevelItems];
  }

  // Generate rules from frequent itemsets of size >= 2
  const rules: AssociationRule[] = [];
  for (const itemset of frequentItemsets) {
    if (itemset.items.length < 2) continue;

    for (let i = 1; i < itemset.items.length; i++) {
      const allCombinationsOfAntecedent = combinations(itemset.items, i);
      for (const antecedent of allCombinationsOfAntecedent) {
        const consequent = itemset.items.filter((x) => !antecedent.includes(x));
        const antecedentSupport = frequentByLevel.get(key(antecedent)) || 0;
        const consequentSupport = frequentByLevel.get(key(consequent)) || 0;

        if (antecedentSupport === 0) continue;

        const confidence = itemset.support / antecedentSupport;
        if (confidence < minConfidence) continue;

        const lift = consequentSupport > 0 ? confidence / consequentSupport : 0;
        const conviction =
          consequentSupport < 1
            ? (1 - confidence) / Math.max(1 - consequentSupport, 0.001)
            : 999;

        rules.push({
          antecedent,
          consequent,
          support: itemset.support,
          confidence,
          lift,
          conviction: isFinite(conviction) ? conviction : 999,
        });
      }
    }
  }

  rules.sort((a, b) => b.lift - a.lift);
  return { frequentItemsets, rules };
}

export function getRecommendations(
  rules: AssociationRule[],
  cart: string[],
  topN: number = 5
): { product: string; confidence: number; lift: number; reason: string }[] {
  const recommendations = new Map<
    string,
    { confidence: number; lift: number; reason: string }
  >();

  for (const rule of rules) {
    const allAntecedentInCart = rule.antecedent.every((a) => cart.includes(a));
    const consequentNotInCart = rule.consequent.every((c) => !cart.includes(c));

    if (allAntecedentInCart && consequentNotInCart) {
      for (const product of rule.consequent) {
        if (cart.includes(product)) continue;
        const existing = recommendations.get(product);
        if (!existing || rule.confidence > existing.confidence) {
          recommendations.set(product, {
            confidence: rule.confidence,
            lift: rule.lift,
            reason: `Because you bought ${rule.antecedent.join(', ')}`,
          });
        }
      }
    }
  }

  return [...recommendations.entries()]
    .map(([product, data]) => ({ product, ...data }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, topN);
}
