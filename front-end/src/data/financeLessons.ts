export type LessonRank = 'S' | 'A' | 'B' | 'C' | 'D';

export type FinanceLesson = {
  id: number;
  rank: LessonRank;
  title: string;
  lesson: string;
  whyItMatters: string;
  quickTip: string;
  sourceInsight: string;
  thumbnail: string;
};

export const financeLessons: readonly FinanceLesson[] = [
  {
    id: 0,
    rank: 'S',
    title: 'The HSA is the Most Powerful Investment Account Nobody Talks About',
    lesson:
      'A Health Savings Account (HSA) is the only account in existence with triple tax advantages — contributions go in pre-tax, grow completely tax-free, and come out tax-free for medical expenses. No other account does all three.',
    whyItMatters:
      'Most people treat it as a medical wallet and drain it every year. The real move is to invest the funds in index funds inside the HSA, pay medical bills out of pocket while young and healthy, save every receipt, and reimburse yourself years later — essentially creating a tax-free slush fund with no expiry date.',
    quickTip:
      'Keep receipts for every medical expense from the day you open the HSA. You can legally reimburse yourself for those costs 10, 20, even 30 years later — all tax-free.',
    sourceInsight:
      'Indiana University Kelley School of Business research found that for young workers in the 22% tax bracket, maximizing an HSA can actually beat a 50% employer 401(k) match in terms of net wealth creation.',
    thumbnail: 'https://images.pexels.com/photos/8472486/pexels-photo-8472486.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: 1,
    rank: 'A',
    title: "Not Negotiating Your First Salary Is the Most Expensive Mistake You'll Ever Make",
    lesson:
      "Your starting salary is the base for every raise, promotion, and job offer that follows — because most pay increases are calculated as a percentage of your current earnings. A $5,000 difference at 22 doesn't stay $5,000.",
    whyItMatters:
      'If you accept $45k instead of negotiating to $50k, and get 3% raises annually, that single decision costs you over $150,000 in lost earnings by age 40 — before even accounting for retirement contributions on that difference.',
    quickTip:
      'Always let the employer give you the first number. Research market rates on Glassdoor or LinkedIn Salary. Then counter with data, not feelings. Even a single negotiation conversation takes 5 minutes and can be worth six figures over a career.',
    sourceInsight:
      'Research consistently shows most employers expect candidates to negotiate and build wiggle room into initial offers — meaning accepting the first offer is almost always leaving money on the table.',
    thumbnail: 'https://images.pexels.com/photos/3184460/pexels-photo-3184460.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: 2,
    rank: 'B',
    title: "Tax Brackets Don't Work the Way You Think — and That Fear Is Costing You",
    lesson:
      "Most people believe that earning more and 'moving into a higher tax bracket' means ALL their income gets taxed at the higher rate. It doesn't. Tax brackets are marginal — only the dollars above each threshold get taxed at the higher rate.",
    whyItMatters:
      "This myth stops people from taking freelance gigs, side income, or raises — thinking it'll cost them more in taxes overall. It won't. You always take home more money by earning more.",
    quickTip:
      "Think of tax brackets like buckets. Each bucket fills up and overflows into the next. The higher rate only applies to the overflow — not everything you earned. A $10k bonus doesn't suddenly make your whole salary taxable at a higher rate.",
    sourceInsight:
      'This is one of the most common and costly financial misconceptions — people actively avoid income opportunities because of a fundamental misunderstanding of how progressive taxation works.',
    thumbnail: 'https://images.pexels.com/photos/265052/pexels-photo-265052.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: 3,
    rank: 'C',
    title: "Increasing Your Income Beats Cutting Expenses — Especially When You're Young",
    lesson:
      'The personal finance world is obsessed with cutting lattes and cancelling subscriptions. But math is math: saving 20% of $100k builds wealth far faster than saving 50% of $30k. Frugality has a floor. Income has no ceiling.',
    whyItMatters:
      'Every hour spent optimising a budget has a fixed return. Every hour invested in learning a high-income skill, negotiating, or building a side income has an exponential return. Young people should prioritise offense (earning more) before playing defense (spending less).',
    quickTip:
      'Identify the top 1-2 skills in your field that command a salary premium and invest deliberate time into them. Learning to code, sell, speak publicly, or manage projects can add more to your net worth than any budget ever will.',
    sourceInsight:
      'Decades of wealth research shows income growth is the dominant driver of wealth accumulation early in life — not frugality alone.',
    thumbnail: 'https://images.pexels.com/photos/35220245/pexels-photo-35220245.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: 4,
    rank: 'D',
    title: 'Rich-Looking People Are Often Broke — Real Wealth Is Invisible',
    lesson:
      "The people driving luxury cars and living in big houses are statistically more likely to be cash-poor than the quiet neighbour with a 10-year-old Honda and a $2M investment portfolio. Wealth is what you don't see.",
    whyItMatters:
      "Mimicking the spending habits of people who 'look wealthy' is one of the fastest routes to financial ruin. The actual wealthy — as documented in 20 years of research in The Millionaire Next Door — are frugal, drive modest cars, and live well below their means.",
    quickTip:
      "Next time you feel pressure to spend to keep up appearances, remember: the person you're trying to impress is likely also broke and trying to impress someone else. Status spending is a loop that benefits nobody.",
    sourceInsight:
      'Research by Stanley and Danko found that nearly 80% of millionaires are first-generation wealthy — they built it themselves through frugal habits, not inherited status or flashy spending.',
    thumbnail: 'https://images.pexels.com/photos/97987/pexels-photo-97987.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
];

export function pickRandomLesson(previousId?: number): FinanceLesson {
  if (financeLessons.length === 0) {
    throw new Error('No finance lessons available');
  }
  if (financeLessons.length === 1 || previousId === undefined) {
    const index = Math.floor(Math.random() * financeLessons.length);
    return financeLessons[index];
  }
  const pool = financeLessons.filter((lesson) => lesson.id !== previousId);
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}
