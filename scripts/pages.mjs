// Writes the calculator pages (one folder each), the index page and sitemap.xml.
// Edit the copy here, then run:  npm run pages
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const SITE = "https://propsim-enterprise.github.io/prop-firm-calculators";
const ROOT = path.resolve(import.meta.dirname, "..");
const PROPSIM = (medium) =>
  `https://propsim.markets/?utm_source=github&amp;utm_medium=${medium}&amp;utm_campaign=prop-firm-calculators`;
const INDEX = "https://propsim.markets/prop-trading-index?utm_source=github&amp;utm_medium=calculators&amp;utm_campaign=prop-firm-calculators";
const DATASET = "https://github.com/PropSim-Enterprise/prop-firm-pass-rates";

const PAGES = [
  {
    slug: "drawdown",
    nav: "Drawdown",
    title: "Prop Firm Drawdown Calculator: Daily Loss and Trailing Drawdown | PropSim",
    description:
      "Free prop firm drawdown calculator. See your daily loss floor, your static or trailing maximum loss floor, and how much you can still lose before a breach.",
    h1: "Prop firm drawdown calculator",
    intro:
      "Find where the daily loss limit and the maximum loss sit on your evaluation or funded account, for static and trailing drawdown, and how much you can lose before either one is hit.",
    height: 820,
    body: `
<h2>How the daily loss limit works</h2>
<p>The daily loss limit is the most you may lose in one trading day. Firms measure it in one of three ways, and the calculator supports all three:</p>
<ul>
<li><strong>A percentage of the starting balance</strong>, counted down from the day's opening balance. On a $100,000 account with a 5% limit, you may fall $5,000 below wherever the day opened.</li>
<li><strong>A percentage of the day's opening balance</strong>, so the limit grows and shrinks with the account.</li>
<li><strong>A percentage of the higher of the day's opening balance and opening equity</strong>, which also counts profit in open trades at the reset.</li>
</ul>
<p>The floor is <code>opening level − limit</code>. Most firms count losses in <strong>equity</strong>, open trades included, so a trade that dips below the floor and recovers still breaches.</p>
<h2>Static vs trailing drawdown</h2>
<p><strong>Static</strong>: the floor is fixed at <code>starting balance − maximum loss</code> and never moves. <strong>Trailing</strong>: the floor follows your highest equity at the same distance, so it rises as you make money and never falls back. Some firms <strong>lock</strong> a trailing floor once it reaches the starting balance.</p>
<p>The calculator shows both floors and which one you will hit first. Rules vary between firms, so check yours.</p>`,
    faq: [
      ["What is the daily drawdown in a prop firm?", "The most an account may lose in one trading day, usually 4% to 5% of the starting balance, measured from the balance or equity at the start of the day. Falling below it ends the challenge."],
      ["What is trailing drawdown?", "A maximum loss floor that follows the account's highest equity at a fixed distance. It rises as the account makes new highs and never moves down."],
      ["Does the daily loss limit include open trades?", "At most firms, yes: the limit is checked against equity, which includes floating losses on open trades, not only closed trades."],
      ["When does the daily loss limit reset?", "Usually at midnight on the broker's server clock, which for many MetaTrader brokers is UTC+2 or UTC+3. Your firm's rules state the exact time."],
    ],
  },
  {
    slug: "position-size",
    nav: "Position size",
    title: "Prop Firm Position Size Calculator: Lot Size by Risk | PropSim",
    description:
      "Free lot size calculator for prop firm accounts: the position size that risks a set share of your balance, and how many losing trades your daily and maximum loss allow.",
    h1: "Prop firm position size calculator",
    intro:
      "Find the lot size that risks exactly the share of your balance you choose, and see how many losing trades in a row your daily loss limit and maximum loss can absorb.",
    height: 760,
    body: `
<h2>The formula</h2>
<pre><code>lots = (balance × risk %) ÷ (stop loss in pips × pip value per lot)</code></pre>
<p>The result is rounded <strong>down</strong> to your broker's lot step, so the money at risk never exceeds your target. On a $100,000 account risking 0.5% with a 20-pip stop on EUR/USD ($10 a pip per lot), that is $500 ÷ $200 = 2.50 lots.</p>
<h2>Pip value</h2>
<p>For pairs quoted in US dollars (EUR/USD, GBP/USD, AUD/USD) on a USD account, one pip on 1.00 lot is worth $10. For other pairs, metals, indices and crypto it depends on the contract size and the exchange rate, so take it from your broker's contract specification.</p>
<h2>Why risk per trade matters on a challenge</h2>
<p>The losing-streak lines show how much room a risk level leaves. In the <a href="${INDEX}">PropSim Prop Trading Index</a> (week of 2026-10-19), the median risk per trade was 0.59% of the balance for accounts that cleared a phase and 0.78% for accounts that failed. That describes accounts on the PropSim platform and is a difference between two groups, not proof of cause.</p>`,
    faq: [
      ["How much should I risk per trade on a prop firm challenge?", "There is no single right number. Many traders risk between 0.25% and 1% per trade so that a losing streak stays well inside the daily loss limit. Use the calculator to see how many losses in a row your choice allows."],
      ["What is the pip value of 1 lot?", "For USD-quoted forex pairs on a USD account, $10 per pip per standard lot. Other symbols differ; your broker's contract specification lists the value."],
      ["Why does the calculator round the lot size down?", "So the money at risk is never more than you chose. Rounding up by even one lot step would risk slightly more."],
    ],
  },
  {
    slug: "challenge-cost",
    nav: "Challenge cost",
    title: "Prop Firm Challenge Cost Calculator: Expected Cost to Get Funded | PropSim",
    description:
      "How much does it really cost to get funded? Combine the challenge fee with real pass rates to see the expected attempts and spend, with retry discounts and fee refunds.",
    h1: "Prop firm challenge cost calculator",
    intro:
      "A challenge fee is not the cost of getting funded: most attempts fail. Combine the fee with pass rates to see how many attempts it takes on average and what they cost.",
    height: 700,
    body: `
<h2>The formula</h2>
<pre><code>chance of funding per attempt = phase 1 pass rate × phase 2 pass rate
expected attempts             = 1 ÷ chance
expected cost                 = fee + (attempts − 1) × retry fee</code></pre>
<p>If the firm refunds the fee with the first payout, the refunded fee is taken off once you are funded and paid.</p>
<h2>Where the default pass rates come from</h2>
<p>The defaults are from the <a href="${INDEX}">PropSim Prop Trading Index</a>, week of 2026-10-19: 14.1% of accounts cleared phase 1, and 34% of those that reached phase 2 cleared it, so about 4.8% of attempts ended funded. The figures describe accounts on firms using the PropSim platform, and they are averages: your own odds depend on how you trade. The weekly figures are free to download from the <a href="${DATASET}">prop firm pass rates dataset</a>.</p>`,
    faq: [
      ["What percentage of traders pass prop firm challenges?", "In the PropSim Prop Trading Index for the week of 2026-10-19, 14.1% of accounts cleared phase 1 and 34% of those that reached phase 2 cleared it: about 4.8% of attempts ended funded. The figures describe firms on the PropSim platform."],
      ["Is a discounted retry worth it?", "A retry discount lowers the cost of every attempt after the first. Enter it as a percentage to see how much it changes the expected cost of getting funded."],
      ["Does a fee refund make the challenge free?", "It returns the fee of the attempt that passed, once you are funded and paid out. The fees of the attempts that failed are not refunded."],
    ],
  },
  {
    slug: "payout",
    nav: "Payout",
    title: "Prop Firm Payout Calculator: Profit Split and Fee Refund | PropSim",
    description:
      "Work out your prop firm payout from profit, profit split, refunded fee and withdrawal fees, and how much profit you need for the payout you want.",
    h1: "Prop firm payout calculator",
    intro:
      "See what a funded account actually pays you after the profit split, a refunded challenge fee and withdrawal fees, and how much profit you need for a target payout.",
    height: 760,
    body: `
<h2>The formula</h2>
<pre><code>payout          = profit × your split + refunded fee − withdrawal fee
profit for goal = (target payout + withdrawal fee) ÷ your split</code></pre>
<p>A $6,000 profit at an 80% split is a $4,800 share. Add a $549 refunded fee and the payout is $5,349 before any withdrawal fee.</p>
<h2>Typical profit splits</h2>
<p>The median profit split across challenges in the <a href="${INDEX}">PropSim Prop Trading Index</a> (week of 2026-10-19) was 80%. Some firms raise the split as an account scales or after several payouts.</p>`,
    faq: [
      ["How are prop firm payouts calculated?", "Your profit for the period multiplied by your profit split, plus any refunded challenge fee, less any withdrawal or transfer fee."],
      ["What is a typical prop firm profit split?", "80% is a common starting split. The median across challenges in the PropSim Prop Trading Index for the week of 2026-10-19 was 80%."],
      ["Is the challenge fee refunded?", "Many firms refund the evaluation fee with the first payout. Check your firm's terms, and set the refund to $0 if it does not apply."],
    ],
  },
  {
    slug: "revenue",
    nav: "Revenue (founders)",
    title: "Prop Firm Revenue Calculator: Model a Prop Firm's Monthly Profit | PropSim",
    description:
      "For prop firm founders: model a month of challenge sales, payouts, payment processing, affiliates and platform costs, with pass rates from real challenge data.",
    h1: "Prop firm revenue calculator",
    intro:
      "For founders: model a typical month of a prop firm, from challenge sales to payouts, payment processing, affiliate commission and platform costs.",
    height: 980,
    body: `
<h2>What the model counts</h2>
<ul>
<li><strong>Sales</strong>: challenges sold × average price.</li>
<li><strong>Payouts</strong>: challenges × phase 1 pass rate × phase 2 pass rate gives the funded traders; the share of them who reach a payout, times the average payout, gives what you pay out.</li>
<li><strong>Costs</strong>: payment processing and affiliate commission as a share of sales, plus your platform's monthly and per-account fees.</li>
</ul>
<p>It is a steady-state month: it assumes the traders being paid this month were funded from similar earlier months. The default pass rates are from the <a href="${INDEX}">PropSim Prop Trading Index</a>; the payout assumptions are yours.</p>
<h2>Plan the rest of the business</h2>
<p>For what platforms charge, see <a href="https://propsim.markets/prop-firm-cost?utm_source=github&amp;utm_medium=calculators&amp;utm_campaign=prop-firm-calculators">what it costs to start a prop firm</a> and the <a href="https://propsim.markets/compare?utm_source=github&amp;utm_medium=calculators&amp;utm_campaign=prop-firm-calculators">white-label providers compared</a>. For the plan itself, use the free <a href="https://propsim.markets/prop-firm-business-plan-template?utm_source=github&amp;utm_medium=calculators&amp;utm_campaign=prop-firm-calculators">prop firm business plan template</a>.</p>`,
    faq: [
      ["How do prop firms make money?", "Mostly from evaluation fees. Because most attempts fail, the fees from many traders fund the payouts to the few who are funded and profitable, plus the firm's costs and margin."],
      ["What pass rate should a prop firm plan for?", "It depends on the firm's rules. In the PropSim Prop Trading Index for the week of 2026-10-19, 14.1% of accounts cleared phase 1 and 34% of phase 2 accounts cleared it. Test your own rules against your own data."],
      ["What does prop firm software cost?", "Pricing models differ: flat monthly fees, per-account fees and revenue shares. PropSim's prop firm cost page compares published pricing with sources."],
    ],
  },
];

const esc = (s) => s.replace(/&(?!amp;)/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function header(prefix, current) {
  const links = PAGES.map(
    (p) => `<a href="${prefix}${p.slug}/"${p.slug === current ? ' aria-current="page"' : ""}>${p.nav}</a>`,
  ).join("");
  return `<header class="site-header"><div class="wrap">
  <a class="brand" href="${prefix}"><img src="${prefix}src/img/propsim-icon.png" alt="" width="28" height="28" /> Prop Firm Calculators</a>
  <nav class="site-nav" aria-label="Calculators">${links}</nav>
</div></header>`;
}

function footer() {
  return `<footer class="site-footer"><div class="wrap">Free and open source (MIT). Made by <a href="${PROPSIM("calculators_footer")}">PropSim</a>, prop firm software. <a href="https://github.com/PropSim-Enterprise/prop-firm-calculators">Source on GitHub</a>.</div></footer>`;
}

function faqLd(faq) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  });
}

function head({ title, description, url, image, prefix, ld }) {
  return `<meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${image}" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" href="${prefix}favicon.svg" type="image/svg+xml" />
    ${ld.map((j) => `<script type="application/ld+json">${j}</script>`).join("\n    ")}`;
}

function calculatorPage(p) {
  const url = `${SITE}/${p.slug}/`;
  const app = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: p.h1,
    url,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    author: { "@type": "Organization", name: "PropSim", url: "https://propsim.markets" },
  });
  const embed = `&lt;iframe src="${url}?embed" width="100%" height="${p.height}" style="border:0" loading="lazy" title="${esc(p.h1)}"&gt;&lt;/iframe&gt;
&lt;p&gt;&lt;a href="${url}"&gt;${esc(p.h1)}&lt;/a&gt; by &lt;a href="https://propsim.markets"&gt;PropSim&lt;/a&gt;&lt;/p&gt;`;
  const faq = p.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("\n");
  return `<!doctype html>
<html lang="en">
  <head>
    ${head({ title: p.title, description: p.description, url, image: `${SITE}/og/${p.slug}.jpg`, prefix: "../", ld: [app, faqLd(p.faq)] })}
  </head>
  <body>
    ${header("../", p.slug)}
    <main class="wrap">
      <div class="page-head"><h1>${esc(p.h1)}</h1><p>${esc(p.intro)}</p></div>
      <div class="calc" id="calc" data-calc="${p.slug}"><noscript>This calculator needs JavaScript.</noscript></div>
      <p class="embed-credit"><a href="${url}" target="_blank" rel="noopener">${esc(p.h1)}</a> by <a href="${PROPSIM("calculator_embed")}" target="_blank" rel="noopener">PropSim</a></p>
      <article class="content">
        ${p.body}
        <h2>Questions</h2>
        ${faq}
        <h2>Embed this calculator</h2>
        <p>Free to use on your own site. Copy this code:</p>
        <pre><code>${embed}</code></pre>
        <div class="cta">
          <h2>Thinking of starting a prop firm?</h2>
          <p>PropSim runs the whole firm on your brand: storefront and checkout, a risk engine that checks every tick against your rules, a trader terminal, payouts, CRM and KYC. Start on the free plan.</p>
          <a class="button" href="${PROPSIM("calculators_cta")}">Start your prop firm free</a>
        </div>
      </article>
    </main>
    ${footer()}
    <script type="module" src="../src/main.ts"></script>
  </body>
</html>
`;
}

function indexPage() {
  const title = "Free Prop Firm Calculators: Drawdown, Lot Size, Challenge Cost, Payout | PropSim";
  const description =
    "Free prop firm calculators for traders and founders: drawdown and daily loss, position size, the expected cost of getting funded, payouts and a prop firm revenue model.";
  const cards = PAGES.map(
    (p) => `<a class="card" href="${p.slug}/"><h2>${esc(p.h1)}</h2><p>${esc(p.intro)}</p><span>Open calculator →</span></a>`,
  ).join("\n");
  return `<!doctype html>
<html lang="en">
  <head>
    ${head({ title, description, url: `${SITE}/`, image: `${SITE}/og/index.jpg`, prefix: "", ld: [] })}
    <link rel="stylesheet" href="src/styles.css" />
  </head>
  <body>
    ${header("", "")}
    <main class="wrap">
      <div class="page-head"><h1>Free prop firm calculators</h1><p>For prop traders: drawdown and daily loss, lot size, what it really costs to get funded, and payouts. For founders: a monthly revenue model for a prop firm. Free, no sign-up, open source.</p></div>
      <div class="cards">${cards}</div>
      <article class="content">
        <h2>Built on real challenge data</h2>
        <p>The pass-rate defaults come from the <a href="${INDEX}">PropSim Prop Trading Index</a>, published weekly as the free <a href="${DATASET}">prop firm pass rates dataset</a>.</p>
        <div class="cta">
          <h2>Thinking of starting a prop firm?</h2>
          <p>PropSim runs the whole firm on your brand: storefront and checkout, a risk engine that checks every tick, a trader terminal, payouts, CRM and KYC. Start on the free plan.</p>
          <a class="button" href="${PROPSIM("calculators_cta")}">Start your prop firm free</a>
        </div>
      </article>
    </main>
    ${footer()}
  </body>
</html>
`;
}

for (const p of PAGES) {
  mkdirSync(path.join(ROOT, p.slug), { recursive: true });
  writeFileSync(path.join(ROOT, p.slug, "index.html"), calculatorPage(p));
}
writeFileSync(path.join(ROOT, "index.html"), indexPage());
const urls = ["", ...PAGES.map((p) => `${p.slug}/`)].map((u) => `  <url><loc>${SITE}/${u}</loc></url>`);
writeFileSync(
  path.join(ROOT, "public/sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`,
);
console.log(`Wrote ${PAGES.length} calculator pages, the index and sitemap.xml.`);
