export type Blog = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readMins: number;
  date: string;
  cover: string; // emoji used as a lightweight cover motif
  body: string[]; // paragraphs
};

export const blogs: Blog[] = [
  {
    slug: "why-recency-beats-discounts",
    title: "Why recency beats discounts when winning customers back",
    excerpt:
      "A bigger discount feels like the obvious lever for a lapsed shopper. The data usually disagrees — timing matters more than the number.",
    category: "Retention",
    readMins: 4,
    date: "2026-05-28",
    cover: "⏱️",
    body: [
      "Most brands reach for a steeper discount the moment a customer goes quiet. It is the easiest knob to turn and the easiest to measure. But discount depth tends to have a surprisingly weak relationship with whether a lapsed shopper actually comes back, and a strong relationship with how much margin you give away to people who would have returned anyway.",
      "The lever that moves the needle far more reliably is timing. Every customer has a natural reorder rhythm — the gap between purchases that, for them, feels normal. Someone who buys a new kurta roughly every seven weeks behaves very differently from someone who shops twice a year. A message that lands a few days after that personal window has lapsed catches the shopper while intent is still warm. The same message sent a month too early reads as noise, and a month too late arrives after they have already drifted to a competitor.",
      "This is why segmenting purely on a flat rule like 'no order in 60 days' leaves money on the table. Sixty days is an eternity for a fast-rhythm shopper and barely a blink for a slow one. The stronger approach is to compare each customer's silence against their own historical cadence, then prioritise the ones who are overdue relative to themselves.",
      "Practically, that means your win-back audience should be ranked, not just filtered. Put the shoppers who are one or two cycles past due at the top, pair them with a modest offer, and reserve your deepest discounts for the genuinely high-value names who have gone properly cold. You will spend less and convert more.",
    ],
  },
  {
    slug: "channel-affinity-explained",
    title: "Channel affinity: stop guessing where your customers actually read",
    excerpt:
      "Sending every campaign on the same channel is the most common — and most expensive — habit in retail marketing.",
    category: "Channels",
    readMins: 5,
    date: "2026-05-20",
    cover: "📡",
    body: [
      "Ask ten marketers which channel performs best and most will name whichever one their last good campaign happened to use. The honest answer is that there is no single best channel — there is only the best channel for a given person. Channel affinity is the simple but powerful idea that each customer has a measurable tendency to engage on some channels and ignore others.",
      "You can build an affinity score for every customer from history you already have: how often they open your emails, how reliably they read your WhatsApp messages, whether they ever tap an SMS link. Normalise each into a 0–100 score and you suddenly have a per-person map of where your message will actually be seen.",
      "The payoff shows up immediately in cost and conversion. WhatsApp typically carries a higher per-message cost than email but converts far better for shoppers who live in their chats. Email is nearly free but wasted on someone who has not opened one in a year. When you route each customer to their own strongest channel instead of blasting everyone on one, your blended conversion rate climbs while your spend often falls.",
      "The trap to avoid is treating affinity as fixed. People change phones, change habits, change jobs. Recompute scores on a rolling window so a customer who has quietly migrated from email to WhatsApp gets followed to where they now are, rather than chased on a channel they have abandoned.",
    ],
  },
  {
    slug: "attribution-without-lying",
    title: "Revenue attribution without lying to yourself",
    excerpt:
      "Attribution is where marketing dashboards go to flatter their owners. Here is how to keep yours honest.",
    category: "Analytics",
    readMins: 6,
    date: "2026-05-11",
    cover: "📊",
    body: [
      "Every attribution model is a story you tell about why a sale happened, and every story leaves something out. Last-click attribution credits whichever message the customer touched right before buying, which is clean and simple and quietly ignores everything that warmed them up first. First-touch does the opposite. Neither is wrong, but neither is the whole truth, and the danger is forgetting that you chose a lens.",
      "For a campaign tool, a defensible default is a windowed attribution: if a customer who received a campaign places an order within a defined window — say 24 hours — you credit that campaign with the order. It is not perfect, but it is transparent, repeatable, and hard to game, which matters more than theoretical purity.",
      "The honesty comes from what you do around that number. Always report the window alongside the revenue, so nobody reads '₹54,000 attributed' as if it were divinely certain. Watch for customers who would have bought anyway — if your win-back campaign keeps 'converting' people who were already mid-purchase, your attributed revenue is inflated by coincidence.",
      "The most useful attribution view is comparative, not absolute. You will rarely know the true causal lift of a single campaign, but you can reliably see that WhatsApp out-converts email for one segment, or that a particular message style drives more orders than another. Trust the relative signal, hold the absolute number loosely, and your dashboard will guide good decisions instead of just making you feel good.",
    ],
  },
  {
    slug: "ai-native-vs-ai-bolted-on",
    title: "AI-native vs AI bolted-on: what the difference looks like in practice",
    excerpt:
      "Adding a chatbot does not make a product AI-native. The real distinction is about where the intelligence sits in the workflow.",
    category: "AI",
    readMins: 5,
    date: "2026-04-30",
    cover: "🧠",
    body: [
      "The phrase 'AI-native' gets stretched to cover almost anything with a language model somewhere inside it. A clearer test is to ask where the intelligence sits relative to the work. In an AI-bolted-on product, the human still does the job and AI assists at the edges — drafting a line of copy, suggesting a tag. Remove the AI and the product still functions, just a little less conveniently.",
      "In an AI-native product, the intelligence is load-bearing. The human expresses intent and the system carries out the reasoning that used to be manual: deciding who qualifies, what to say, which path to take. Remove the AI and the workflow collapses, because the AI was the workflow.",
      "Concretely, a bolted-on CRM gives a marketer a segment builder with an AI button that suggests a filter. An AI-native CRM lets the marketer say what they want to achieve and produces the segment, the per-person message, and the channel choice as one reasoned act. The marketer's job shifts from operating the tool to directing and reviewing it.",
      "Neither approach is automatically better for every team — bolted-on is often the right, lower-risk choice for mature workflows. But if you are building something new, deciding consciously where the intelligence sits is more important than how many features mention AI. Commit to a point of view and let it shape the whole interface.",
    ],
  },
  {
    slug: "personalisation-at-scale",
    title: "Personalisation at scale is a data problem before it is an AI problem",
    excerpt:
      "Per-customer messaging sounds like an AI feature. Mostly it is a question of whether your data can support the promise.",
    category: "Personalisation",
    readMins: 4,
    date: "2026-04-18",
    cover: "✍️",
    body: [
      "It is tempting to think personalisation is unlocked the moment you can generate a thousand unique messages. Generation is the easy part now. The hard part, and the part that determines whether personalisation actually lands, is whether you hold the right facts about each customer to personalise on.",
      "A message that uses a first name is barely personalised; everyone has been doing that for twenty years and customers have learned to ignore it. A message that references the specific category someone actually buys, at roughly the moment they tend to rebuy it, feels like the brand knows them. The difference between those two messages is not the model — it is the data feeding the model.",
      "This is why a personalisation strategy should start with an audit of what you reliably know per customer: their top category, their cadence, their channel, their lifetime value. Each solid attribute is a hook the AI can hang a relevant sentence on. If you only know a name and an email, no model will save you.",
      "The encouraging news is that most brands already sit on enough order history to personalise meaningfully; it is just scattered and unsummarised. Pulling it into a per-customer profile — a compact picture of who each shopper is — turns raw rows into something an AI can write to. The intelligence then has something true to say, which is the whole point.",
    ],
  },
  {
    slug: "designing-the-callback-loop",
    title: "Designing a delivery callback loop you can trust",
    excerpt:
      "When a separate service reports back what happened to each message, ordering, retries and duplicates stop being edge cases and become the main event.",
    category: "Engineering",
    readMins: 6,
    date: "2026-04-05",
    cover: "🔁",
    body: [
      "Any system that hands messages to a delivery provider and waits to hear what happened runs into the same three realities, and pretending otherwise is how outages are born. Events arrive out of order, some callbacks fail and get retried, and the same event can be reported more than once. A loop you can trust is one that is designed around these from the start rather than patched for them later.",
      "Ordering is usually solvable at the source: the provider should emit a message's lifecycle events in sequence, so 'delivered' never overtakes 'sent'. Across different messages, interleaving is fine and expected. The receiver should never assume a global order, only a per-message one.",
      "Retries are how you survive the receiver being briefly unavailable. If a callback POST fails, the sender should retry with exponential backoff — half a second, then one, then two — for a bounded number of attempts before giving up. This turns a momentary blip into a delayed-but-delivered event instead of a lost one, giving you at-least-once delivery.",
      "At-least-once delivery has a price: duplicates. The receiver must be idempotent, meaning a repeated event produces no extra effect. The simplest reliable way is to log every event and check the log before acting, so the second copy of 'clicked' is recognised and dropped rather than counted twice. Get these three right — per-message ordering, bounded retries, idempotent ingestion — and the loop behaves predictably even under load.",
    ],
  },
];

export function getBlog(slug: string): Blog | undefined {
  return blogs.find((b) => b.slug === slug);
}
