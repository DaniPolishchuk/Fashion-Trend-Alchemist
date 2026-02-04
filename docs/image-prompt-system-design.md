# Image Prompt Generation System Design

## Overview

This document describes the image prompt generation system for Z-Image Turbo. The system generates three views (front, back, model) for each product based on its **Product Group** and **Customer Segment**.

The key design principle is **structural consistency**: all three prompts share an identical product description to maximize visual similarity across generated images.

---

## Table of Contents

1. [Core Classification](#core-classification)
2. [Photography Categories](#photography-categories)
3. [Customer Segment Mapping](#customer-segment-mapping)
4. [Prompt Structure](#prompt-structure)
5. [LLM System Prompt](#llm-system-prompt)
6. [Category-Specific Templates](#category-specific-templates)
7. [Implementation](#implementation)
8. [Edge Cases and Fallbacks](#edge-cases-and-fallbacks)

---

## Core Classification

### Two-Dimensional Product Classification

Every product is classified along two dimensions:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PHOTOGRAPHY CATEGORY                              │
│              (Derived from Product Group - determines shot style)           │
├─────────────────────────────────────────────────────────────────────────────┤
│      WEARABLE      │     FOOTWEAR     │    ACCESSORIES    │   NON-WEARABLE  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            CUSTOMER SEGMENT                                 │
│                    (Determines model characteristics)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│   Baby/Children   │   Divided   │   Ladieswear   │   Menswear   │   Sport  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Photography Categories

### Category Mapping

```typescript
type PhotographyCategory = 'wearable' | 'footwear' | 'accessories' | 'non_wearable';

const PRODUCT_GROUP_TO_CATEGORY: Record<string, PhotographyCategory> = {
  // WEARABLE (7 product groups)
  'Garment Upper body': 'wearable',
  'Garment Lower body': 'wearable',
  'Garment Full body': 'wearable',
  'Nightwear': 'wearable',
  'Swimwear': 'wearable',
  'Underwear': 'wearable',
  'Underwear/nightwear': 'wearable',

  // FOOTWEAR (2 product groups)
  'Shoes': 'footwear',
  'Socks & Tights': 'footwear',

  // ACCESSORIES (2 product groups)
  'Bags': 'accessories',
  'Accessories': 'accessories',

  // NON-WEARABLE (7 product groups)
  'Interior textile': 'non_wearable',
  'Furniture': 'non_wearable',
  'Cosmetic': 'non_wearable',
  'Garment and Shoe care': 'non_wearable',
  'Items': 'non_wearable',
  'Fun': 'non_wearable',
  'Stationery': 'non_wearable',
};
```

### Category Summary

| Category | Product Groups | Front/Back View | Model View |
|----------|---------------|-----------------|------------|
| **Wearable** | Garment Upper/Lower/Full body, Nightwear, Swimwear, Underwear, Underwear/nightwear | Ghost mannequin (flat lay for pants) | Full body wearing |
| **Footwear** | Shoes, Socks & Tights | Product pair shot | Cropped legs |
| **Accessories** | Bags, Accessories | Product shot | Styled with accessory |
| **Non-Wearable** | Interior textile, Furniture, Cosmetic, Garment and Shoe care, Items, Fun, Stationery | Product shot | Lifestyle context |

---

## Customer Segment Mapping

### Model Profile Definition

```typescript
interface ModelProfile {
  gender: 'male' | 'female' | 'unspecified';
  ageGroup: 'child' | 'adult';
  descriptor: string;
}

const SEGMENT_TO_MODEL_PROFILE: Record<string, ModelProfile> = {
  'Baby/Children': {
    gender: 'unspecified',
    ageGroup: 'child',
    descriptor: 'a child model',
  },
  'Divided': {
    gender: 'unspecified',
    ageGroup: 'adult',
    descriptor: 'an adult model',
  },
  'Ladieswear': {
    gender: 'female',
    ageGroup: 'adult',
    descriptor: 'an adult female model',
  },
  'Menswear': {
    gender: 'male',
    ageGroup: 'adult',
    descriptor: 'an adult male model',
  },
  'Sport': {
    gender: 'unspecified',
    ageGroup: 'adult',
    descriptor: 'an adult model',
  },
};

// Default fallback if segment is unknown or null
const DEFAULT_MODEL_PROFILE: ModelProfile = {
  gender: 'unspecified',
  ageGroup: 'adult',
  descriptor: 'an adult model',
};
```

### Model Profile Summary

| Segment | Gender | Age | Model Descriptor |
|---------|--------|-----|------------------|
| **Baby/Children** | Unspecified | Child | "a child model" |
| **Divided** | Unspecified | Adult | "an adult model" |
| **Ladieswear** | Female | Adult | "an adult female model" |
| **Menswear** | Male | Adult | "an adult male model" |
| **Sport** | Unspecified | Adult | "an adult model" |

---

## Prompt Structure

### Design Principle: Consistency Through Shared Product Description

The key to generating visually consistent images across views is using an **identical product description** in all three prompts. The LLM generates structured components that we assemble with a constant quality suffix.

### Prompt Components

```typescript
interface PromptComponents {
  // SHARED - Must be IDENTICAL across all views
  productDescription: string;

  // VIEW-SPECIFIC PREFIXES - Sets up the shot type
  frontPrefix: string;
  backPrefix: string;
  modelPrefix: string;

  // VIEW-SPECIFIC DETAILS - Angle-specific information
  frontDetails: string;
  backDetails: string;
  modelDetails: string;  // Includes complementary styling for wearables
}
```

### Assembly Formula

```typescript
const QUALITY_SUFFIX = "Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.";

function assemblePrompts(components: PromptComponents): GeneratedPrompts {
  return {
    front: `${components.frontPrefix} ${components.productDescription}. ${components.frontDetails}. ${QUALITY_SUFFIX}`,
    back: `${components.backPrefix} ${components.productDescription}. ${components.backDetails}. ${QUALITY_SUFFIX}`,
    model: `${components.modelPrefix} ${components.productDescription}. ${components.modelDetails}. ${QUALITY_SUFFIX}`,
  };
}
```

### Component Guidelines

#### productDescription
- **Content:** Core product identity visible from ANY angle
- **Includes:** Color, material, product type, silhouette, fit, key distinctive features
- **Order:** Most general/important → specific details
- **Example:** `"Navy Blue Wool Blend Slim Fit Trousers with pleated front, mid-rise waist, belt loops, and pressed crease"`

#### frontPrefix / backPrefix / modelPrefix
- **Content:** Photography style and view angle setup
- **Examples:**
  - Front: `"Ghost mannequin fashion photography, front view of"`
  - Back: `"Ghost mannequin fashion photography, back view of"`
  - Model: `"Fashion photography, full body shot of an adult male model wearing"`

#### frontDetails
- **Content:** Front-specific features and composition
- **Includes:** Front pockets, buttons, neckline details, front prints, display arrangement
- **Example:** `"Displaying kangaroo pocket and drawstring hood detail, shown on invisible form"`

#### backDetails
- **Content:** Back-specific features and composition
- **Includes:** Back pockets, back closure, rear vents, back panel design
- **Example:** `"Showing rear panel and hood from behind, no front details visible"`

#### modelDetails
- **Content:** How the model wears/uses the product + complementary styling
- **For Wearables:** Complementary garments that don't distract from main product
- **For Accessories:** How the accessory is worn/carried
- **For Non-Wearables:** Context/setting description
- **Example:** `"Styled with black joggers and white sneakers, standing in a natural pose"`

---

## LLM System Prompt

### System Prompt Structure

The system prompt consists of:
1. **Role and Task Definition**
2. **Output Format Specification**
3. **General Rules**
4. **Category-Specific Rules and Example** (dynamically injected)
5. **Model Profile Information** (dynamically injected)

### Base System Prompt

```
You are a fashion e-commerce image prompt specialist for Z-Image Turbo text-to-image AI.

## YOUR TASK

Generate structured prompt components for three product views (front, back, model). These components will be assembled into final prompts, so you must follow the exact structure specified.

## OUTPUT FORMAT

Return ONLY valid JSON with this exact structure (no markdown, no explanation):

{
  "productDescription": "...",
  "frontPrefix": "...",
  "backPrefix": "...",
  "modelPrefix": "...",
  "frontDetails": "...",
  "backDetails": "...",
  "modelDetails": "..."
}

## CRITICAL RULES

### RULE 1: PRODUCT DESCRIPTION CONSISTENCY
The productDescription must capture the complete product identity. This EXACT text will be used in all three prompts to ensure visual consistency across generated images.

### RULE 2: PRODUCT DESCRIPTION STRUCTURE
Order the productDescription from most important to specific details:
[Color] [Material] [Product Type] with [key distinctive features], [fit/silhouette], [secondary details]

Include ALL provided attributes. Do not omit any details.

### RULE 3: ATTRIBUTE SPLITTING
- productDescription: Features visible from ANY angle (color, material, type, silhouette, fit)
- frontDetails: Features ONLY visible/relevant from front (front pockets, buttons, front prints, neckline)
- backDetails: Features ONLY visible/relevant from back (back pockets, back closure, rear vents)

### RULE 4: PREFIX STRUCTURE
Prefixes must establish the photography style and view. They should end in a way that flows naturally into the productDescription.

Example flow: "[frontPrefix] [productDescription]. [frontDetails]. [suffix]"
Result: "Ghost mannequin fashion photography, front view of Navy Blue Wool Trousers with pleated front. Displaying front crease and side pockets. Plain white..."

### RULE 5: NO QUALITY SUFFIX
Do NOT include any quality/background specifications in your output. The following will be appended automatically:
"Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography."

[CATEGORY_SPECIFIC_RULES]

[MODEL_PROFILE_RULES]
```

---

## Category-Specific Templates

### Category 1: WEARABLE

#### Rules to Inject

```
## WEARABLE CATEGORY RULES

### Front/Back View Style
- Primary: Ghost mannequin (invisible mannequin showing 3D form)
- Exception: Pants/trousers/shorts use flat lay (overhead, laid flat)
- Always include: "Strictly product only, no human skin visible" in details

### Model View Style
- Full body shot of model wearing the garment
- Add complementary styling that doesn't distract from main product:
  - Upper body items: Add neutral bottoms and appropriate footwear
  - Lower body items: Add neutral top
  - Full body items: Add appropriate footwear only
  - Swimwear pieces: Add MATCHING swimwear piece (bikini top → matching bikini bottom)
- Include natural pose description

### Product Groups in This Category
Garment Upper body, Garment Lower body, Garment Full body, Nightwear, Swimwear, Underwear, Underwear/nightwear
```

#### Example: Hoodie (Menswear)

**Input:**
```
Product Group: Garment Upper body
Product Type: Hoodie
Customer Segment: Menswear
Attributes:
  - color: Charcoal Grey
  - material: Cotton Fleece
  - fit: Relaxed
  - style: Pullover
  - neckline: Drawstring Hood
  - pocket: Kangaroo Pocket
  - hem: Ribbed hem
  - cuffs: Ribbed cuffs
```

**Output:**
```json
{
  "productDescription": "Charcoal Grey Cotton Fleece Relaxed Fit Pullover Hoodie with drawstring hood, kangaroo pocket, ribbed hem and ribbed cuffs",
  "frontPrefix": "Ghost mannequin fashion photography, front view of",
  "backPrefix": "Ghost mannequin fashion photography, back view of",
  "modelPrefix": "Fashion photography, full body shot of an adult male model wearing",
  "frontDetails": "Displayed on invisible form showing kangaroo pocket and drawstring hood detail, strictly product only, no human skin visible",
  "backDetails": "Displayed on invisible form showing rear panel and hood from behind, strictly the back side, no front pocket visible",
  "modelDetails": "Styled with black joggers and white sneakers, standing in a natural casual pose"
}
```

**Assembled Prompts:**

Front:
```
Ghost mannequin fashion photography, front view of Charcoal Grey Cotton Fleece Relaxed Fit Pullover Hoodie with drawstring hood, kangaroo pocket, ribbed hem and ribbed cuffs. Displayed on invisible form showing kangaroo pocket and drawstring hood detail, strictly product only, no human skin visible. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.
```

Back:
```
Ghost mannequin fashion photography, back view of Charcoal Grey Cotton Fleece Relaxed Fit Pullover Hoodie with drawstring hood, kangaroo pocket, ribbed hem and ribbed cuffs. Displayed on invisible form showing rear panel and hood from behind, strictly the back side, no front pocket visible. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.
```

Model:
```
Fashion photography, full body shot of an adult male model wearing Charcoal Grey Cotton Fleece Relaxed Fit Pullover Hoodie with drawstring hood, kangaroo pocket, ribbed hem and ribbed cuffs. Styled with black joggers and white sneakers, standing in a natural casual pose. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.
```

---

#### Example: Trousers - Flat Lay (Menswear)

**Input:**
```
Product Group: Garment Lower body
Product Type: Trousers
Customer Segment: Menswear
Attributes:
  - color: Navy Blue
  - material: Wool Blend
  - fit: Slim
  - style: Chino
  - waist: Mid-rise
  - details: Pleated front, belt loops, side pockets
```

**Output:**
```json
{
  "productDescription": "Navy Blue Wool Blend Slim Fit Chino Trousers with mid-rise waist, pleated front, belt loops and side pockets",
  "frontPrefix": "Professional flat lay photography, overhead view of",
  "backPrefix": "Professional flat lay photography, overhead back view of",
  "modelPrefix": "Fashion photography, full body shot of an adult male model wearing",
  "frontDetails": "Laid flat on white surface, neatly pressed, showing front pleats and pocket openings, strictly product only",
  "backDetails": "Laid flat face down on white surface, showing rear panel and back pockets, strictly the back side",
  "modelDetails": "Styled with a white Oxford shirt and brown leather shoes, standing in a natural pose"
}
```

---

#### Example: Bikini Top (Ladieswear)

**Input:**
```
Product Group: Swimwear
Product Type: Bikini top
Customer Segment: Ladieswear
Attributes:
  - color: Coral
  - material: Recycled Lycra
  - style: Triangle
  - closure: Tie back and halter neck
  - details: Gold ring detail at center
```

**Output:**
```json
{
  "productDescription": "Coral Recycled Lycra Triangle Bikini Top with tie back and halter neck closure, featuring gold ring detail at center",
  "frontPrefix": "Ghost mannequin fashion photography, front view of",
  "backPrefix": "Ghost mannequin fashion photography, back view of",
  "modelPrefix": "Fashion photography, full body shot of an adult female model wearing",
  "frontDetails": "Displayed on invisible form showing triangle cups and gold ring detail, strictly product only, no human skin visible",
  "backDetails": "Displayed on invisible form showing tie-back closure and halter strings, strictly the back side",
  "modelDetails": "Styled with matching coral bikini bottom, standing in a confident pose"
}
```

---

#### Example: Kids T-Shirt (Baby/Children)

**Input:**
```
Product Group: Garment Upper body
Product Type: T-shirt
Customer Segment: Baby/Children
Attributes:
  - color: Bright Blue
  - material: Organic Cotton
  - fit: Regular
  - neckline: Crew neck
  - print: Dinosaur graphic
```

**Output:**
```json
{
  "productDescription": "Bright Blue Organic Cotton Regular Fit Children's T-shirt with crew neckline and dinosaur graphic print",
  "frontPrefix": "Ghost mannequin fashion photography, front view of",
  "backPrefix": "Ghost mannequin fashion photography, back view of",
  "modelPrefix": "Fashion photography, full body shot of a child model wearing",
  "frontDetails": "Displayed on invisible child-sized form showing dinosaur graphic, strictly product only, no human skin visible",
  "backDetails": "Displayed on invisible child-sized form showing plain rear panel, strictly the back side",
  "modelDetails": "Styled with navy shorts and white sneakers, standing in a natural playful pose"
}
```

---

### Category 2: FOOTWEAR

#### Rules to Inject

```
## FOOTWEAR CATEGORY RULES

### Front/Back View Style
- Display as a pair of shoes/socks
- Front: Three-quarter angle view, one shoe slightly forward
- Back: View from behind showing heel construction and sole profile

### Model View Style
- Cropped shot showing legs/feet only (typically knee-down or mid-thigh down)
- Include complementary pants/bottoms that show the footwear clearly
- Natural standing or walking pose

### Product Groups in This Category
Shoes, Socks & Tights
```

#### Example: Sneakers (Divided)

**Input:**
```
Product Group: Shoes
Product Type: Sneakers
Customer Segment: Divided
Attributes:
  - color: Neon Green
  - material: Mesh upper
  - style: Running, Low-top
  - sole: Chunky white rubber with green tread
  - closure: Velcro straps
  - details: Padded collar, heel pull tab
```

**Output:**
```json
{
  "productDescription": "Neon Green Mesh Low-top Running Sneakers with dual velcro strap closure, chunky white rubber sole with green tread, padded collar and heel pull tab",
  "frontPrefix": "Professional footwear photography, front three-quarter view of",
  "backPrefix": "Professional footwear photography, back view of",
  "modelPrefix": "Fashion photography, cropped shot from mid-thigh down of an adult model wearing",
  "frontDetails": "Displayed as a pair with one shoe slightly forward, showing velcro straps and mesh upper detail",
  "backDetails": "Pair shown from behind highlighting heel pull tabs, padded collar and chunky sole profile",
  "modelDetails": "Styled with blue jeans with rolled cuffs, standing in a natural pose"
}
```

---

#### Example: Heels (Ladieswear)

**Input:**
```
Product Group: Shoes
Product Type: Heels
Customer Segment: Ladieswear
Attributes:
  - color: Red
  - material: Patent Leather
  - style: Stiletto
  - heel_height: 10cm
  - toe: Pointed
  - closure: Slip-on
```

**Output:**
```json
{
  "productDescription": "Red Patent Leather Pointed Toe Stiletto Heels with 10cm heel, slip-on style with high-shine finish",
  "frontPrefix": "Professional footwear photography, front three-quarter view of",
  "backPrefix": "Professional footwear photography, back view of",
  "modelPrefix": "Fashion photography, cropped shot from knee down of an adult female model wearing",
  "frontDetails": "Displayed as a pair showing pointed toe and patent shine, one shoe slightly angled",
  "backDetails": "Pair shown from behind showcasing slender stiletto heels and curved heel breast",
  "modelDetails": "Styled with black tailored trousers, standing in an elegant pose"
}
```

---

### Category 3: ACCESSORIES

#### Rules to Inject

```
## ACCESSORIES CATEGORY RULES

### Front/Back View Style
- Bags: Three-quarter angle showing structure and hardware
- Small accessories: Flat lay or appropriate product angle
- Show key details: hardware, closures, textures

### Model View Style
- Model styled WITH the accessory (not just holding it)
- Framing depends on the accessory type - use appropriate crop:
  - Bags: Full body shot showing how it's carried
  - Sunglasses/Hats: Head and shoulders
  - Scarves/Necklaces: Upper body
  - Watches/Bracelets: Wrist close-up
  - Belts: Waist area focus
- Use your judgment for the most appropriate framing

### Product Groups in This Category
Bags, Accessories
```

#### Example: Tote Bag (Ladieswear)

**Input:**
```
Product Group: Bags
Product Type: Tote bag
Customer Segment: Ladieswear
Attributes:
  - color: Tan
  - material: Full-grain Leather
  - style: Structured
  - size: Large
  - hardware: Gold-tone
  - handles: Dual shoulder handles
  - closure: Open top with magnetic snap
```

**Output:**
```json
{
  "productDescription": "Tan Full-grain Leather Large Structured Tote Bag with dual shoulder handles, gold-tone hardware and open top with magnetic snap closure",
  "frontPrefix": "Professional product photography, front three-quarter view of",
  "backPrefix": "Professional product photography, back view of",
  "modelPrefix": "Fashion photography, full body shot of an adult female model carrying",
  "frontDetails": "Bag standing upright showing structured silhouette, leather texture and gold hardware details",
  "backDetails": "Showing smooth rear leather panel and handle attachments from behind",
  "modelDetails": "Bag on shoulder, styled with white blouse, blue jeans and nude flats, standing in a natural pose"
}
```

---

#### Example: Sunglasses (Divided)

**Input:**
```
Product Group: Accessories
Product Type: Sunglasses
Customer Segment: Divided
Attributes:
  - color: Black/Gold
  - material: Acetate frame with metal temples
  - style: Aviator
  - lens: Green tinted, UV400
```

**Output:**
```json
{
  "productDescription": "Black and Gold Aviator Sunglasses with acetate frame, metal temples and green tinted UV400 lenses",
  "frontPrefix": "Professional eyewear photography, front view of",
  "backPrefix": "Professional eyewear photography, inside view of",
  "modelPrefix": "Fashion photography, head and shoulders shot of an adult model wearing",
  "frontDetails": "Displayed open and flat showing full frame shape and green lens tint",
  "backDetails": "Showing interior of frame, nose pads, temple hinges and arm details",
  "modelDetails": "Clean minimal styling, confident expression, sunglasses as focal point"
}
```

---

#### Example: Watch (Menswear)

**Input:**
```
Product Group: Accessories
Product Type: Watch
Customer Segment: Menswear
Attributes:
  - color: Silver/Blue
  - material: Stainless Steel
  - style: Dive watch
  - dial: Blue sunburst
  - strap: Steel bracelet
  - details: Rotating bezel, date window
```

**Output:**
```json
{
  "productDescription": "Silver Stainless Steel Dive Watch with blue sunburst dial, steel bracelet, rotating bezel and date window",
  "frontPrefix": "Professional watch photography, front view of",
  "backPrefix": "Professional watch photography, case back view of",
  "modelPrefix": "Fashion photography, wrist close-up shot of an adult male model wearing",
  "frontDetails": "Watch face centered showing dial detail, bezel markings and bracelet links",
  "backDetails": "Showing case back construction, bracelet clasp mechanism",
  "modelDetails": "Wrist and lower forearm visible with subtle shirt cuff, natural hand position"
}
```

---

### Category 4: NON-WEARABLE

#### Rules to Inject

```
## NON-WEARABLE CATEGORY RULES

### Front/Back View Style
- Clean product photography
- Front: Primary product view showing main features
- Back: Alternate angle or detail view showing construction/back panel

### Model View Style
- NOT a person wearing the product
- Lifestyle/context shot showing the product in use or in an appropriate setting
- For home items: Styled in room setting
- For cosmetics: Application context or beauty shot
- For toys: Child interacting with product
- Focus on the product with context providing scale and use-case

### Product Groups in This Category
Interior textile, Furniture, Cosmetic, Garment and Shoe care, Items, Fun, Stationery
```

#### Example: Cushion (Interior textile)

**Input:**
```
Product Group: Interior textile
Product Type: Cushion
Customer Segment: (N/A - Home product)
Attributes:
  - color: Terracotta
  - material: Linen
  - size: 45x45cm
  - style: Square throw cushion
  - fill: Feather
  - closure: Hidden zip
```

**Output:**
```json
{
  "productDescription": "Terracotta Linen Square Throw Cushion, 45x45cm, feather filled with hidden zip closure",
  "frontPrefix": "Professional home textiles photography, front view of",
  "backPrefix": "Professional home textiles photography, back view of",
  "modelPrefix": "Lifestyle interior photography featuring",
  "frontDetails": "Single cushion centered, showing linen texture and plump feather filling",
  "backDetails": "Showing rear panel with hidden zip closure detail and linen weave texture",
  "modelDetails": "Styled on a neutral beige linen sofa with complementary decor, warm natural lighting, product as focal point"
}
```

---

#### Example: Plush Toy (Fun)

**Input:**
```
Product Group: Fun
Product Type: Toy
Customer Segment: Baby/Children
Attributes:
  - color: Multicolor
  - material: Plush fabric
  - style: Stuffed animal (bear)
  - size: 30cm
  - details: Embroidered eyes, machine washable
```

**Output:**
```json
{
  "productDescription": "Multicolor Plush Stuffed Bear, 30cm, with soft plush fabric and embroidered safety eyes",
  "frontPrefix": "Professional toy photography, front view of",
  "backPrefix": "Professional toy photography, back view of",
  "modelPrefix": "Lifestyle photography featuring",
  "frontDetails": "Displayed upright in seated position showing face and embroidered features",
  "backDetails": "Showing back construction, tail detail and plush fabric texture",
  "modelDetails": "A child holding and hugging the stuffed bear, joyful interaction showing toy scale and cuddly nature"
}
```

---

#### Example: Lipstick (Cosmetic)

**Input:**
```
Product Group: Cosmetic
Product Type: Fine cosmetics
Customer Segment: Ladieswear
Attributes:
  - color: Rose Pink
  - material: Metal case
  - style: Bullet lipstick
  - finish: Satin
  - details: Gold cap, twist-up mechanism
```

**Output:**
```json
{
  "productDescription": "Rose Pink Satin Finish Bullet Lipstick in gold-capped metal case with twist-up mechanism",
  "frontPrefix": "Professional cosmetics photography, front view of",
  "backPrefix": "Professional cosmetics photography, detail view of",
  "modelPrefix": "Beauty photography featuring",
  "frontDetails": "Product standing upright with cap removed beside it, showing rose pink shade and bullet shape",
  "backDetails": "Showing metal case construction, twist mechanism base and gold cap detail",
  "modelDetails": "Close-up of lips wearing the rose pink satin lipstick, focus on color payoff and finish, product visible in soft focus beside"
}
```

---

## Implementation

### System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                 INPUT                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│  lockedAttributes      - User-specified attribute values                     │
│  predictedAttributes   - RPT-1 predicted attribute values                    │
│  contextAttributes     - Auto-excluded single-variant attributes             │
└─────────────────────────────────┬────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                       STEP 1: EXTRACT METADATA                               │
├──────────────────────────────────────────────────────────────────────────────┤
│  From attributes, extract:                                                   │
│  ├─ product_group      → e.g., "Garment Upper body"                          │
│  ├─ product_type       → e.g., "Hoodie"                                      │
│  ├─ customer_segment   → e.g., "Menswear"                                    │
│  └─ all visual attributes (color, material, style, fit, details, etc.)       │
└─────────────────────────────────┬────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                      STEP 2: DETERMINE MAPPINGS                              │
├──────────────────────────────────────────────────────────────────────────────┤
│  product_group     →  Photography Category (wearable/footwear/etc.)          │
│  customer_segment  →  Model Profile (gender, age, descriptor)                │
└─────────────────────────────────┬────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                    STEP 3: BUILD LLM SYSTEM PROMPT                           │
├──────────────────────────────────────────────────────────────────────────────┤
│  Combine:                                                                    │
│  ├─ Base system prompt (rules, output format)                                │
│  ├─ Category-specific rules and examples                                     │
│  └─ Model profile information                                                │
└─────────────────────────────────┬────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                     STEP 4: BUILD USER PROMPT                                │
├──────────────────────────────────────────────────────────────────────────────┤
│  Provide:                                                                    │
│  ├─ Product Group                                                            │
│  ├─ Product Type                                                             │
│  ├─ Customer Segment                                                         │
│  └─ All attributes (locked + predicted + context)                            │
└─────────────────────────────────┬────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                      STEP 5: LLM GENERATES COMPONENTS                        │
├──────────────────────────────────────────────────────────────────────────────┤
│  LLM returns PromptComponents:                                               │
│  {                                                                           │
│    productDescription, frontPrefix, backPrefix, modelPrefix,                 │
│    frontDetails, backDetails, modelDetails                                   │
│  }                                                                           │
└─────────────────────────────────┬────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                      STEP 6: ASSEMBLE FINAL PROMPTS                          │
├──────────────────────────────────────────────────────────────────────────────┤
│  front: frontPrefix + productDescription + frontDetails + QUALITY_SUFFIX     │
│  back:  backPrefix + productDescription + backDetails + QUALITY_SUFFIX       │
│  model: modelPrefix + productDescription + modelDetails + QUALITY_SUFFIX     │
└─────────────────────────────────┬────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                    STEP 7: FALLBACK (if LLM fails)                           │
├──────────────────────────────────────────────────────────────────────────────┤
│  Use template-based component generation with same category/profile logic    │
└──────────────────────────────────────────────────────────────────────────────┘
```

### File Structure

```
apps/api-lite/src/services/
├── promptGeneration.ts              # Main orchestration (updated)
├── promptConfig/
│   ├── index.ts                     # Exports all config
│   ├── categoryMapping.ts           # Product group → category mapping
│   ├── modelProfiles.ts             # Customer segment → model profile
│   ├── systemPrompts.ts             # Base + category-specific prompts
│   └── examples.ts                  # Example outputs per category
├── promptAssembly.ts                # Component → final prompt assembly
└── promptFallback.ts                # Template-based fallback generation
```

### Key Types

```typescript
// Photography categories
type PhotographyCategory = 'wearable' | 'footwear' | 'accessories' | 'non_wearable';

// Model profile
interface ModelProfile {
  gender: 'male' | 'female' | 'unspecified';
  ageGroup: 'child' | 'adult';
  descriptor: string;
}

// LLM output structure
interface PromptComponents {
  productDescription: string;
  frontPrefix: string;
  backPrefix: string;
  modelPrefix: string;
  frontDetails: string;
  backDetails: string;
  modelDetails: string;
}

// Final assembled prompts
interface GeneratedPrompts {
  front: string;
  back: string;
  model: string;
}

// Input data structure
interface ProductData {
  productGroup: string;
  productType: string;
  customerSegment: string | null;
  photographyCategory: PhotographyCategory;
  modelProfile: ModelProfile;
  attributes: Record<string, string>;
}
```

### Quality Suffix Constant

```typescript
const QUALITY_SUFFIX = "Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.";
```

---

## Edge Cases and Fallbacks

### Missing Product Group

If `product_group` is null or unknown:
1. Attempt to infer from `product_type` using keyword matching
2. If no match, default to `wearable` category

```typescript
function inferCategoryFromProductType(productType: string): PhotographyCategory {
  const lower = productType.toLowerCase();

  // Footwear indicators
  if (['shoe', 'sneaker', 'boot', 'heel', 'sandal', 'loafer', 'sock', 'tight'].some(k => lower.includes(k))) {
    return 'footwear';
  }

  // Accessories indicators
  if (['bag', 'hat', 'scarf', 'belt', 'watch', 'jewelry', 'sunglasses', 'gloves'].some(k => lower.includes(k))) {
    return 'accessories';
  }

  // Non-wearable indicators
  if (['cushion', 'blanket', 'towel', 'furniture', 'cosmetic', 'toy', 'umbrella'].some(k => lower.includes(k))) {
    return 'non_wearable';
  }

  // Default to wearable
  return 'wearable';
}
```

### Missing Customer Segment

If `customer_segment` is null or unknown:
- Use default model profile: `{ gender: 'unspecified', ageGroup: 'adult', descriptor: 'an adult model' }`

### LLM Failure

If LLM fails after retries:
1. Use template-based fallback that applies same category and model profile logic
2. Generate simpler but structurally consistent components
3. Log the failure for monitoring

### Invalid LLM Response

If LLM returns invalid JSON or missing fields:
1. Attempt to parse and extract what's available
2. Fill missing fields with sensible defaults
3. Fall back to template-based generation if too much is missing

---

## Frontend Display

### View Naming

| Backend Field | Frontend Display Name |
|---------------|----------------------|
| `front` | "Front" |
| `back` | "Back" |
| `model` | "Lifestyle Sample" |

The backend continues to use "model" internally for consistency with existing code. Only the frontend display label changes to "Lifestyle Sample" to better represent non-wearable items and set appropriate user expectations.

---

## Summary

### Category Mapping

| Category | Product Groups | Front/Back | Model View |
|----------|---------------|------------|------------|
| **Wearable** | Garment Upper/Lower/Full body, Nightwear, Swimwear, Underwear, Underwear/nightwear | Ghost mannequin / Flat lay | Full body wearing |
| **Footwear** | Shoes, Socks & Tights | Product pair | Cropped legs |
| **Accessories** | Bags, Accessories | Product shot | Styled with item |
| **Non-Wearable** | Interior textile, Furniture, Cosmetic, Garment and Shoe care, Items, Fun, Stationery | Product shot | Lifestyle context |

### Segment Mapping

| Segment | Model Descriptor |
|---------|------------------|
| **Baby/Children** | "a child model" |
| **Divided** | "an adult model" |
| **Ladieswear** | "an adult female model" |
| **Menswear** | "an adult male model" |
| **Sport** | "an adult model" |

### Key Design Principles

1. **Consistency through shared productDescription** - Identical product description across all three views
2. **Structured component generation** - LLM generates components, we assemble with constant suffix
3. **Category-specific guidance** - Different rules and examples for each photography category
4. **Graceful degradation** - Fallbacks for missing data and LLM failures
