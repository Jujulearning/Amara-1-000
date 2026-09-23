# Amara Health — Photography brief and shot list

Use this to commission a photographer or source licensed photography. It applies the Amara creative direction to each section of the website, and says which current photos already meet it and which should be replaced first.

## The standard

Luxury editorial composition with documentary honesty. Real kitchens, real families, real food.

- **Light:** natural window or daylight. No flash, no studio seamless backgrounds.
- **Truthful detail:** well-used pots and utensils, imperfectly arranged ingredients, ordinary household objects, food as it is actually served.
- **Kitchens of every kind:** modest, crowded, traditional, contemporary. Not only designer kitchens.
- **People:** natural expressions, mid-task. No direct-to-camera posed smiles, no exaggerated emotion.
- **Culture:** food, clothing, architecture and household details must be accurate to the family, not decorative. Never show families outside the United States through poverty or hardship.
- **Colour:** preserve the richness of skin tones and the natural vibrancy of food. The site applies one restrained grade to every photo (`scripts/add_photo.py`), so deliver clean, natural colour and don't add heavy filters.
- **Representation across the set:** Black American, African, Caribbean, Latina, South Asian, East Asian, Pacific Islander and immigrant/diasporic families, including fathers, grandmothers and other caregivers.
- **Licensing:** model releases for every recognisable person. Commissioned or properly licensed stock only. No AI-generated people. Never present models as Amara users, patients or founders.

## Technical delivery

- Minimum 2400px on the long side (the site serves up to 1800px for Retina screens).
- Deliver uncropped originals; the site crops to the frames below.
- Add each photo with: `python3 scripts/add_photo.py SOURCE NAME [--crop W:H --focus X --vibrance 1.2]`

## Shot list by section

Status: **Keep** = meets the direction · **Upgrade** = acceptable placeholder, replace when possible · **Replace first** = highest priority.

### 1. Hero — "Every kitchen tells a story."
| File | Frame | Brief | Current status |
|---|---|---|---|
| `hero-family-kitchen` | 4:5 arch, portrait | A mother cooking at the stove or counter while family moves around her; a partner or grandparent nearby, a child pulling at her sleeve. Steam, a well-used pot, real clutter. | **Keep.** A strong family-kitchen moment; a documentary reshoot would be even better. |

### 2. Mission — "To demystify nutrition…"
| File | Frame | Brief | Current status |
|---|---|---|---|
| `spices` | 4:5 arch on olive | Hands at work: washing greens in a sink, kneading dough, grinding spices in a mortar. Dark, warm tones that sit well on olive. | **Upgrade.** The styled spice flat lay works, but hands mid-task would tell the story better. |

### 3. Who Amara is for — "Built for every mother, in every kitchen."
| File | Frame | Brief | Current status |
|---|---|---|---|
| `mother-baby-embrace` | large arch, portrait | Caregiver and child in a quiet, close moment at home. | **Keep.** |
| `family-table` | small landscape | A family sharing food around a small kitchen table, mid-meal. | **Keep** (a festive table); a real family meal is the ideal. |
| `mother-newborn-rest` | small landscape | Intimate early-days caregiving. | **Keep.** |
| `first-foods` | inset landscape | A parent spoon-feeding a baby the family's own food. | **Keep.** |
| `collard-greens` | 4:5 arch | Hands washing or stripping collard greens at a sink. | **Upgrade.** Currently a still life of leaves. |
| *new* | — | **A father preparing a meal for his family.** | **Missing. Top priority.** |
| *new* | — | **A grandmother teaching her daughter a familiar dish.** | **Missing. Top priority.** |

### 4. The first 1,000 days
| File | Frame | Brief | Current status |
|---|---|---|---|
| `pregnancy-field` | fixed-height, arch | **A pregnant woman eating a meal that reminds her of home**, at her own table. | **Replace first.** Currently a posed maternity portrait. |
| `newborn-feet` | fixed-height | Year one: feeding, holding, the first months at home. | **Keep.** |
| `mother-lifting-child` | fixed-height | Year two: a toddler eating at the family table with everyone else. | **Upgrade.** Joyful, but not a food moment. |
| `market-stall` | 5:2 banner | Food traditions in daily life: a U.S. neighbourhood market, bodega or grocer, or a pantry of family staples. | **Keep.** Documentary and vibrant; a U.S. setting would tie it closer to the launch. |

### 5. Our story — "The story that started everything."
| File | Frame | Brief | Current status |
|---|---|---|---|
| `story-window` | 2:3 arch | A pregnant woman alone with conflicting advice: handouts, a phone and a family recipe on a kitchen table. Quiet, reflective, not dramatic. | **Upgrade.** The silhouette carries the mood but is posed. |

## Priority order

1. A father cooking for his family (Who Amara is for)
2. A grandmother teaching her daughter a dish (Who Amara is for)
3. A pregnant woman eating a meal from home (1,000 days, pregnancy)
4. Hands washing greens or kneading dough (mission, collard greens)
5. A toddler at the family table (1,000 days, year two)
