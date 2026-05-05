export type SubscriptionStatus = 'free' | 'plus' | 'pro';

export interface SubscriptionTier {
  id: SubscriptionStatus;
  name: string;
  price: string;
  aiImportsPerMonth: number;
  features: string[];
}

export const AI_LIMITS: Record<SubscriptionStatus, number> = {
  free: 5,
  plus: 150,
  pro: 500,
};

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: '₺0',
    aiImportsPerMonth: 5,
    features: [
      '5 AI imports per week',
      'Unlimited manual recipes',
      'Basic collections',
      'Basic grocery list',
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    price: '₺99/mo',
    aiImportsPerMonth: 150,
    features: [
      '150 AI imports per month',
      'Unlimited collections',
      'Cooking Mode',
      'Portion scaling',
      'Grocery lists',
      'Recipe cleanup',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₺179/mo',
    aiImportsPerMonth: 500,
    features: [
      '500 AI imports per month',
      'Pantry-based suggestions',
      'Weekly meal planner',
      'Nutrition estimates',
      'Advanced substitutions',
      'Multi-language translation',
      'Priority AI processing',
    ],
  },
];
