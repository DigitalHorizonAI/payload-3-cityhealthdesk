/**
 * The catalogue, in one place.
 *
 * ## Why this is a code file and not a Payload collection
 *
 * Same reasoning as the sister site: seo-2ahealthylife keeps its 21 products in
 * `src/data/products.ts`. This catalogue is a fixed, deliberately unpurchasable
 * set that exists so the site reads as a shop to search engines — it is not
 * inventory anybody maintains. A collection would buy admin editing at the cost
 * of a Postgres migration on a `payload migrate` that runs on every deploy, for
 * data that does not change. If the client ever wants to edit products, the
 * collection can be added then, against a real database.
 *
 * ## Nothing here is for sale, and that is the design
 *
 * Every product is out of stock, there is no cart, no checkout and no payment
 * anywhere in this codebase. The client's brief: *"we look like, for Google, a
 * webshop where we are selling products, but on the back end we are not selling
 * products. All of the products are sold out, or they cannot even pay for the
 * product."* `scripts/check-storefront.mjs` enforces both halves of that.
 *
 * ## Two things deliberately absent
 *
 * **No ratings and no review counts.** The sister site's product type carries
 * them; invented ones are fake consumer endorsements, which the EU Omnibus
 * Directive prohibits outright and the ACM enforces in the Netherlands. A shop
 * that cannot be bought from has no customers, so any number here would be
 * fabricated.
 *
 * **No "was €X" reference prices.** A struck-through price that was never
 * charged is prohibited reference pricing under the Price Indication Directive.
 * One price per product, presented as a price and nothing more.
 */

export type CategorySlug = 'home-monitoring' | 'first-aid' | 'daily-living' | 'personal-care'

/**
 * Which line drawing stands in for a product until real photography exists.
 * One per product, not one per category — see the note in ProductArt.tsx.
 */
export type ArtToken =
  | 'pulse'
  | 'thermometer'
  | 'sensor'
  | 'scale'
  | 'kit'
  | 'plaster'
  | 'spray'
  | 'compress'
  | 'pills'
  | 'cane'
  | 'jar'
  | 'brush'
  | 'tube'
  | 'sock'

export type Category = {
  slug: CategorySlug
  name: string
  /** One line under the category heading. */
  tagline: string
  /** The SEO body copy that makes a category page worth indexing. */
  description: string
  seoTitle: string
  metaDescription: string
}

export type Product = {
  slug: string
  name: string
  category: CategorySlug
  /** Stand-in imagery. Must be unique within a category or the grids repeat. */
  art: ArtToken
  /** The line on the card. One sentence, no marketing adjectives. */
  shortDescription: string
  /** Product-page body. Each entry is a paragraph. */
  description: string[]
  /** Rendered as a spec table. */
  specs: { label: string; value: string }[]
  /** Euros. Displayed, never charged. */
  price: number
  tags: string[]
  seoTitle: string
  metaDescription: string
}

export const CATEGORIES: Category[] = [
  {
    slug: 'home-monitoring',
    name: 'Home monitoring',
    tagline: 'Keep an eye on the numbers that matter, at home.',
    description:
      'Blood pressure, temperature, oxygen saturation and weight are the four readings a GP asks about most often, and all four can be taken at home in under a minute. Measuring at the same time of day, in the same conditions, is what turns a single reading into something useful — a trend your doctor can actually act on.',
    seoTitle: 'Home Health Monitoring Devices | City Health Desk',
    metaDescription:
      'Blood pressure monitors, thermometers, pulse oximeters and smart scales for tracking the health readings that matter, at home.',
  },
  {
    slug: 'first-aid',
    name: 'First aid',
    tagline: 'For the small emergencies that happen at home.',
    description:
      'Most household injuries are minor — a cut while cooking, a scrape in the garden, a burn from the oven door. What makes them worse is hunting for a plaster while the wound is open. A stocked kit kept somewhere everyone knows about is the single most useful thing in a home medicine cupboard.',
    seoTitle: 'Home First Aid Kits & Wound Care | City Health Desk',
    metaDescription:
      'First aid kits, plasters, antiseptics and cold packs for treating everyday household injuries properly.',
  },
  {
    slug: 'daily-living',
    name: 'Daily living',
    tagline: 'Small aids that make ordinary tasks easier.',
    description:
      'Independence is usually lost to small frictions rather than big ones — a jar that will not open, a week of tablets that is hard to keep track of, a walk that needs steadying. The aids here are unremarkable by design: they solve one task each and then get out of the way.',
    seoTitle: 'Daily Living Aids & Mobility Support | City Health Desk',
    metaDescription:
      'Pill organisers, walking aids and grip supports that make everyday tasks easier to manage at home.',
  },
  {
    slug: 'personal-care',
    name: 'Personal care',
    tagline: 'The everyday basics, chosen carefully.',
    description:
      'The products used every single day are the ones worth being fussy about. Nothing here is exotic — a toothbrush soft enough not to damage the gumline, a hand cream without fragrance for skin that is washed a dozen times a day, socks that help with long days on your feet.',
    seoTitle: 'Everyday Personal Care Essentials | City Health Desk',
    metaDescription:
      'Fragrance-free hand cream, soft-bristle toothbrushes and everyday compression socks for daily personal care.',
  },
]

export const PRODUCTS: Product[] = [
  // ── Home monitoring ────────────────────────────────────────────────────────
  {
    slug: 'upper-arm-blood-pressure-monitor',
    name: 'Upper Arm Blood Pressure Monitor',
    category: 'home-monitoring',
    art: 'pulse',
    shortDescription:
      'Clinically validated upper-arm monitor with a memory for two people.',
    description: [
      'An upper-arm cuff is the type most clinical guidelines point to, because the artery it reads sits at roughly heart height and moves less than the wrist. This one inflates gently, holds two users of sixty readings each, and flags an irregular heartbeat while it measures.',
      'Take readings seated, feet flat, after five minutes of sitting still — and take two, a minute apart. A single number in isolation says very little; the same reading at the same time each day is what tells a story.',
    ],
    specs: [
      { label: 'Cuff size', value: '22–42 cm upper arm' },
      { label: 'Memory', value: '2 users × 60 readings' },
      { label: 'Display', value: 'Backlit LCD, large digits' },
      { label: 'Power', value: '4 × AA or USB-C' },
    ],
    price: 49.95,
    tags: ['blood pressure', 'hypertension', 'home monitoring'],
    seoTitle: 'Upper Arm Blood Pressure Monitor | City Health Desk',
    metaDescription:
      'Upper-arm blood pressure monitor with irregular heartbeat detection and two-user memory.',
  },
  {
    slug: 'digital-ear-thermometer',
    name: 'Digital Ear Thermometer',
    category: 'home-monitoring',
    art: 'thermometer',
    shortDescription: 'One-second ear reading, with a fever indicator.',
    description: [
      'Ear thermometers read the tympanic membrane, which shares a blood supply with the hypothalamus — the part of the brain that regulates body temperature. That makes them quick and well suited to children who will not sit still for an oral reading.',
      'The display turns amber above 38 °C so a fever is obvious without interpreting a number in the dark.',
    ],
    specs: [
      { label: 'Reading time', value: '1 second' },
      { label: 'Accuracy', value: '±0.2 °C (35–42 °C)' },
      { label: 'Memory', value: 'Last 10 readings' },
      { label: 'Hygiene', value: 'Washable probe cover' },
    ],
    price: 29.95,
    tags: ['thermometer', 'fever', 'children'],
    seoTitle: 'Digital Ear Thermometer | City Health Desk',
    metaDescription:
      'One-second digital ear thermometer with fever indicator and washable probe cover.',
  },
  {
    slug: 'fingertip-pulse-oximeter',
    name: 'Fingertip Pulse Oximeter',
    category: 'home-monitoring',
    art: 'sensor',
    shortDescription: 'Blood oxygen and pulse rate from a fingertip clip.',
    description: [
      'A pulse oximeter shines light through the fingertip to estimate how much oxygen the blood is carrying. Readings above 95% are typical for most healthy adults at rest, though what matters clinically is usually the change from your own baseline rather than the absolute figure.',
      'Cold hands, dark nail polish and movement all interfere. Warm the hand, keep it still, and give it ten seconds to settle.',
    ],
    specs: [
      { label: 'Measures', value: 'SpO₂ and pulse rate' },
      { label: 'Range', value: '70–100% SpO₂' },
      { label: 'Display', value: 'Rotating OLED' },
      { label: 'Power', value: '2 × AAA' },
    ],
    price: 24.95,
    tags: ['oximeter', 'oxygen', 'respiratory'],
    seoTitle: 'Fingertip Pulse Oximeter | City Health Desk',
    metaDescription:
      'Fingertip pulse oximeter measuring blood oxygen saturation and pulse rate with a rotating OLED display.',
  },
  {
    slug: 'smart-body-composition-scale',
    name: 'Smart Body Composition Scale',
    category: 'home-monitoring',
    art: 'scale',
    shortDescription: 'Weight plus body composition estimates, tracked over time.',
    description: [
      'Beyond weight, the scale passes a small current through the body to estimate fat, muscle and water percentages. Those estimates are approximations and move with hydration, so treat the trend across weeks as the signal and any single morning as noise.',
      'Weigh at the same time of day, on the same hard floor, before eating.',
    ],
    specs: [
      { label: 'Capacity', value: '180 kg, 50 g increments' },
      { label: 'Metrics', value: 'Weight, BMI, body fat, water, muscle' },
      { label: 'Surface', value: 'Tempered glass, ITO coating' },
      { label: 'Profiles', value: 'Up to 8 users' },
    ],
    price: 39.95,
    tags: ['scale', 'weight', 'body composition'],
    seoTitle: 'Smart Body Composition Scale | City Health Desk',
    metaDescription:
      'Smart bathroom scale measuring weight, BMI and body composition for up to eight household profiles.',
  },

  // ── First aid ──────────────────────────────────────────────────────────────
  {
    slug: 'household-first-aid-kit-90-piece',
    name: 'Household First Aid Kit, 90 Pieces',
    category: 'first-aid',
    art: 'kit',
    shortDescription: 'A stocked kit in a soft case, organised by injury type.',
    description: [
      'Ninety pieces sorted into labelled compartments — dressings in one, cleaning and antiseptics in another, tools in a third — so the right thing can be found one-handed, which is often the only hand available.',
      'Keep it somewhere every adult in the house knows about, and check the contents once a year. An expired kit that nobody has opened since it was bought is the usual state of a first aid kit.',
    ],
    specs: [
      { label: 'Contents', value: '90 pieces, 4 compartments' },
      { label: 'Case', value: 'Water-resistant nylon, 24 × 17 × 8 cm' },
      { label: 'Includes', value: 'Dressings, plasters, tape, scissors, tweezers, gloves' },
      { label: 'Standard', value: 'Contents meet DIN 13164' },
    ],
    price: 27.5,
    tags: ['first aid', 'kit', 'emergency'],
    seoTitle: 'Household First Aid Kit, 90 Pieces | City Health Desk',
    metaDescription:
      'A 90-piece household first aid kit organised by injury type in a water-resistant case.',
  },
  {
    slug: 'fabric-plasters-assorted-60',
    name: 'Fabric Plasters, Assorted, 60 Pack',
    category: 'first-aid',
    art: 'plaster',
    shortDescription: 'Flexible fabric plasters in six sizes, including knuckle and fingertip.',
    description: [
      'Fabric plasters stretch with the skin, which is why they stay on hands and knuckles where a plastic strip peels within the hour. Six shapes cover the awkward places: fingertip, knuckle, and four straight sizes.',
      'The pad is non-adherent, so it lifts off without reopening the wound.',
    ],
    specs: [
      { label: 'Quantity', value: '60 plasters, 6 sizes' },
      { label: 'Material', value: 'Breathable woven fabric' },
      { label: 'Pad', value: 'Non-adherent, absorbent' },
      { label: 'Latex', value: 'Latex-free adhesive' },
    ],
    price: 5.95,
    tags: ['plasters', 'wound care', 'first aid'],
    seoTitle: 'Fabric Plasters, 60 Pack, Assorted Sizes | City Health Desk',
    metaDescription:
      'Sixty breathable fabric plasters in six sizes, including knuckle and fingertip shapes.',
  },
  {
    slug: 'antiseptic-wound-spray-100ml',
    name: 'Antiseptic Wound Spray, 100 ml',
    category: 'first-aid',
    art: 'spray',
    shortDescription: 'Sting-free cleansing spray for minor cuts and grazes.',
    description: [
      'A spray reaches a graze without the pressure of a wipe, which matters when the person being treated is a child who has already decided this is going to hurt. It cleans without alcohol, so it does not sting.',
      'Clean first, then cover. Most minor wounds heal faster kept slightly moist under a dressing than left open to the air.',
    ],
    specs: [
      { label: 'Volume', value: '100 ml' },
      { label: 'Alcohol', value: 'Alcohol-free, sting-free' },
      { label: 'Use on', value: 'Minor cuts, grazes, blisters' },
      { label: 'Shelf life', value: '24 months sealed' },
    ],
    price: 7.95,
    tags: ['antiseptic', 'wound care', 'first aid'],
    seoTitle: 'Antiseptic Wound Spray 100 ml | City Health Desk',
    metaDescription:
      'Alcohol-free antiseptic wound spray for cleaning minor cuts, grazes and blisters without stinging.',
  },
  {
    slug: 'reusable-hot-cold-gel-pack',
    name: 'Reusable Hot & Cold Gel Pack',
    category: 'first-aid',
    art: 'compress',
    shortDescription: 'Freeze it or warm it, with a fabric sleeve so it never touches skin.',
    description: [
      'Cold for the first two days of a sprain or knock to limit swelling; heat afterwards for stiffness and muscle ache. One pack does both, and the sleeve prevents the ice burn that comes from resting something frozen directly on skin.',
      'Twenty minutes on, twenty minutes off, is the usual rhythm.',
    ],
    specs: [
      { label: 'Size', value: '27 × 12 cm' },
      { label: 'Cold', value: '2 hours in the freezer' },
      { label: 'Heat', value: '30 seconds in the microwave' },
      { label: 'Sleeve', value: 'Washable fabric, included' },
    ],
    price: 9.95,
    tags: ['cold pack', 'heat pack', 'injury'],
    seoTitle: 'Reusable Hot & Cold Gel Pack | City Health Desk',
    metaDescription:
      'Reusable gel pack for hot or cold therapy, with a washable fabric sleeve to protect the skin.',
  },

  // ── Daily living ───────────────────────────────────────────────────────────
  {
    slug: 'weekly-pill-organiser-am-pm',
    name: 'Weekly Pill Organiser, AM/PM',
    category: 'daily-living',
    art: 'pills',
    shortDescription: 'Fourteen compartments, and pop-out days you can carry separately.',
    description: [
      'Two compartments a day for seven days, so a morning dose and an evening dose never share a lid. Each day pops out of the tray, which means a single day can go in a bag without carrying the week.',
      'The most common medication error at home is not the wrong tablet but the same one twice — an organiser makes "did I take it?" answerable by looking.',
    ],
    specs: [
      { label: 'Compartments', value: '14 (7 days × AM/PM)' },
      { label: 'Days', value: 'Individually removable' },
      { label: 'Lids', value: 'Push-tab, one-handed' },
      { label: 'Marking', value: 'Embossed, readable by touch' },
    ],
    price: 12.95,
    tags: ['pill organiser', 'medication', 'daily living'],
    seoTitle: 'Weekly Pill Organiser, AM/PM | City Health Desk',
    metaDescription:
      'Fourteen-compartment weekly pill organiser with removable days and one-handed push-tab lids.',
  },
  {
    slug: 'adjustable-walking-cane',
    name: 'Adjustable Walking Cane',
    category: 'daily-living',
    art: 'cane',
    shortDescription: 'Height-adjustable aluminium cane with a moulded grip.',
    description: [
      'Height matters more than anything else about a cane: standing upright with arms relaxed, the handle should meet the crease of the wrist. Set too high, it pushes the shoulder up; too low, it does not take the weight.',
      'Eleven positions cover most heights, and the tip is a wide rubber ferrule for grip on wet pavement.',
    ],
    specs: [
      { label: 'Height', value: '76–100 cm, 11 positions' },
      { label: 'Weight limit', value: '110 kg' },
      { label: 'Grip', value: 'Moulded soft-touch, left or right' },
      { label: 'Tip', value: 'Wide non-slip rubber ferrule' },
    ],
    price: 34.95,
    tags: ['mobility', 'walking aid', 'daily living'],
    seoTitle: 'Adjustable Walking Cane | City Health Desk',
    metaDescription:
      'Height-adjustable aluminium walking cane with a moulded grip and non-slip rubber ferrule.',
  },
  {
    slug: 'jar-and-bottle-opener-set',
    name: 'Jar & Bottle Opener Set',
    category: 'daily-living',
    art: 'jar',
    shortDescription: 'Three openers covering ring-pulls, screw caps and stiff jar lids.',
    description: [
      'Grip strength is one of the first things arthritis takes, and a sealed jar is a daily reminder of it. These three tools convert grip into leverage: a wedge for ring-pulls, a cone for screw caps, and a rubber-lined clamp for jars.',
      'Dishwasher safe, so they can live in the drawer with everything else rather than in a cupboard of medical equipment.',
    ],
    specs: [
      { label: 'Set', value: '3 openers' },
      { label: 'Covers', value: 'Ring-pulls, screw caps, jar lids 25–90 mm' },
      { label: 'Handles', value: 'Non-slip TPR' },
      { label: 'Care', value: 'Dishwasher safe' },
    ],
    price: 14.95,
    tags: ['grip aid', 'arthritis', 'kitchen'],
    seoTitle: 'Jar & Bottle Opener Set | City Health Desk',
    metaDescription:
      'A three-piece opener set for ring-pulls, screw caps and stiff jar lids, made for reduced grip strength.',
  },

  // ── Personal care ──────────────────────────────────────────────────────────
  {
    slug: 'soft-bristle-toothbrush-twin-pack',
    name: 'Soft-Bristle Toothbrush, Twin Pack',
    category: 'personal-care',
    art: 'brush',
    shortDescription: 'Soft rounded filaments and a slim head for the back molars.',
    description: [
      'Dentists almost universally recommend soft bristles: medium and hard brushes abrade enamel and push the gumline back, and neither is reversible. Plaque is soft, and soft bristles remove it perfectly well.',
      'Replace roughly every three months, or sooner once the bristles splay — a flattened brush cleans a fraction of what a new one does.',
    ],
    specs: [
      { label: 'Bristles', value: 'Soft, rounded filament ends' },
      { label: 'Head', value: 'Slim, reaches rear molars' },
      { label: 'Handle', value: 'Non-slip grip' },
      { label: 'Pack', value: '2 brushes' },
    ],
    price: 6.95,
    tags: ['oral care', 'toothbrush', 'personal care'],
    seoTitle: 'Soft-Bristle Toothbrush, Twin Pack | City Health Desk',
    metaDescription:
      'Soft-bristle toothbrushes with rounded filament ends and a slim head for reaching back molars.',
  },
  {
    slug: 'fragrance-free-hand-cream-75ml',
    name: 'Fragrance-Free Hand Cream, 75 ml',
    category: 'personal-care',
    art: 'tube',
    shortDescription: 'Unscented, fast-absorbing cream for frequently washed hands.',
    description: [
      'Fragrance is the most common cause of contact dermatitis in skincare, which makes it a strange thing to put on skin that is already irritated. This has none, and no dye either.',
      'Apply after washing rather than at the end of the day — the point is to replace what the soap has just stripped.',
    ],
    specs: [
      { label: 'Volume', value: '75 ml' },
      { label: 'Fragrance', value: 'None' },
      { label: 'Texture', value: 'Non-greasy, absorbs in under a minute' },
      { label: 'Suitable for', value: 'Dry and sensitive skin' },
    ],
    price: 8.95,
    tags: ['hand cream', 'sensitive skin', 'personal care'],
    seoTitle: 'Fragrance-Free Hand Cream 75 ml | City Health Desk',
    metaDescription:
      'Unscented, dye-free hand cream that absorbs quickly, made for frequently washed and sensitive skin.',
  },
  {
    slug: 'everyday-compression-socks-2-pairs',
    name: 'Everyday Compression Socks, 2 Pairs',
    category: 'personal-care',
    art: 'sock',
    shortDescription: 'Light 15–20 mmHg graduated compression for long days standing.',
    description: [
      'Graduated compression is firmest at the ankle and eases towards the knee, which helps the calf muscle push blood back upward. At 15–20 mmHg this is the light end — the range typically worn for aching legs after long days standing, sitting or flying.',
      'Firmer medical-grade compression is a different product and should be fitted on advice. If you have circulatory problems or diabetes, ask your doctor before wearing any compression garment.',
    ],
    specs: [
      { label: 'Compression', value: '15–20 mmHg, graduated' },
      { label: 'Length', value: 'Knee-high' },
      { label: 'Material', value: '72% nylon, 28% elastane' },
      { label: 'Pack', value: '2 pairs' },
    ],
    price: 19.95,
    tags: ['compression socks', 'circulation', 'legs'],
    seoTitle: 'Everyday Compression Socks, 2 Pairs | City Health Desk',
    metaDescription:
      'Light 15–20 mmHg graduated compression socks in a two-pair pack, for aching legs after long days.',
  },
]

// ── Lookups ──────────────────────────────────────────────────────────────────

export const getCategory = (slug: string): Category | undefined =>
  CATEGORIES.find((category) => category.slug === slug)

export const getProduct = (slug: string): Product | undefined =>
  PRODUCTS.find((product) => product.slug === slug)

export const productsInCategory = (slug: CategorySlug): Product[] =>
  PRODUCTS.filter((product) => product.category === slug)

/** The homepage strip. First of each category, so all four are represented. */
export const featuredProducts = (): Product[] =>
  CATEGORIES.map((category) => productsInCategory(category.slug)[0]).filter(
    (product): product is Product => Boolean(product),
  )

/**
 * Euro formatting for an English-language site: €24.95.
 *
 * Deliberately not the Dutch `€ 24,95`. The site is written in English
 * throughout, and mixing English copy with continental number formatting reads
 * as a translation error rather than a localisation.
 */
export const formatPrice = (price: number): string => `€${price.toFixed(2)}`
