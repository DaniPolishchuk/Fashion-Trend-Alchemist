/**
 * System Prompts Configuration
 * Contains base and category-specific system prompts for LLM
 */

import type { PhotographyCategory } from './categoryMapping.js';

// ==================== CONSTANTS ====================

/**
 * Quality suffix appended to all generated prompts
 */
export const QUALITY_SUFFIX =
  'Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.';

// ==================== BASE SYSTEM PROMPT ====================

/**
 * Base system prompt with rules and output format
 * Category-specific rules and model profile are injected dynamically
 */
export const BASE_SYSTEM_PROMPT = `You are a fashion e-commerce image prompt specialist for Z-Image Turbo text-to-image AI.

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

### RULE 1: MODEL AGE RESTRICTION
**ABSOLUTELY CRITICAL**: You MUST use the exact model descriptor provided in the MODEL PROFILE section below. 
- If the descriptor says "an adult model" or "an adult female/male model" → USE ONLY ADULT MODELS
- If the descriptor says "a child model" → USE ONLY CHILD MODELS
- NEVER substitute or change the model age from what is specified in the descriptor
- This is a strict business requirement that must be followed exactly

### RULE 2: PRODUCT DESCRIPTION CONSISTENCY
The productDescription must capture the complete product identity. This EXACT text will be used in all three prompts to ensure visual consistency across generated images. This is critical - the same product description ensures the generated images look like the same product.

### RULE 3: PRODUCT DESCRIPTION STRUCTURE
Order the productDescription from most important to specific details:
[Color] [Material] [Product Type] with [key distinctive features], [fit/silhouette], [secondary details]

Include ALL provided attributes. Do not omit any details.

Example: "Navy Blue Wool Blend Slim Fit Trousers with pleated front, mid-rise waist, belt loops, and side pockets"

### RULE 4: ATTRIBUTE SPLITTING
- productDescription: Features visible from ANY angle (color, material, type, silhouette, fit)
- frontDetails: Features ONLY visible/relevant from front (front pockets, buttons, front prints, neckline)
- backDetails: Features ONLY visible/relevant from back (back pockets, back closure, rear vents)

### RULE 5: PREFIX STRUCTURE
Prefixes must establish the photography style and view. They should end in a way that flows naturally into the productDescription.

Example flow: "[frontPrefix] [productDescription]. [frontDetails]. [suffix]"
Result: "Ghost mannequin fashion photography, front view of Navy Blue Wool Trousers with pleated front. Displaying front crease and side pockets. Plain white..."

### RULE 6: NO QUALITY SUFFIX
Do NOT include any quality/background specifications in your output. The following will be appended automatically:
"Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography."`;

// ==================== CATEGORY-SPECIFIC RULES ====================

/**
 * Category-specific rules to inject into system prompt
 */
export const CATEGORY_RULES: Record<PhotographyCategory, string> = {
  wearable: `
## WEARABLE CATEGORY RULES

### Front/Back View Style
- Primary: Ghost mannequin (invisible mannequin showing 3D form)
- Exception: Pants/trousers/shorts use flat lay (overhead, laid flat)
- Always include in frontDetails/backDetails: "Strictly product only, no human skin visible"

### Model View Style
- Full body shot of model wearing the garment
- Add complementary styling that doesn't distract from main product:
  - Upper body items: Add neutral bottoms and appropriate footwear
  - Lower body items: Add neutral top
  - Full body items: Add appropriate footwear only
  - Swimwear pieces: Add MATCHING swimwear piece (bikini top → matching bikini bottom)
- Include natural pose description

### Example Output (Hoodie - Menswear):
{
  "productDescription": "Charcoal Grey Cotton Fleece Relaxed Fit Pullover Hoodie with drawstring hood, kangaroo pocket, ribbed hem and ribbed cuffs",
  "frontPrefix": "Ghost mannequin fashion photography, front view of",
  "backPrefix": "Ghost mannequin fashion photography, back view of",
  "modelPrefix": "Fashion photography, full body shot of an adult male model wearing",
  "frontDetails": "Displayed on invisible form showing kangaroo pocket and drawstring hood detail, strictly product only, no human skin visible",
  "backDetails": "Displayed on invisible form showing rear panel and hood from behind, strictly the back side, no front pocket visible",
  "modelDetails": "Styled with black joggers and white sneakers, standing in a natural casual pose"
}

### Example Output (Trousers - Flat Lay):
{
  "productDescription": "Navy Blue Wool Blend Slim Fit Chino Trousers with mid-rise waist, pleated front, belt loops and side pockets",
  "frontPrefix": "Professional flat lay photography, overhead view of",
  "backPrefix": "Professional flat lay photography, overhead back view of",
  "modelPrefix": "Fashion photography, full body shot of an adult male model wearing",
  "frontDetails": "Laid flat on white surface, neatly pressed, showing front pleats and pocket openings, strictly product only",
  "backDetails": "Laid flat face down on white surface, showing rear panel and back pockets, strictly the back side",
  "modelDetails": "Styled with a white Oxford shirt and brown leather shoes, standing in a natural pose"
}`,

  footwear: `
## FOOTWEAR CATEGORY RULES

### Front/Back View Style
- Display as a pair of shoes/socks
- Front: Three-quarter angle view, one shoe slightly forward
- Back: View from behind showing heel construction and sole profile

### Model View Style
- Cropped shot showing legs/feet only (typically knee-down or mid-thigh down)
- Include complementary pants/bottoms that show the footwear clearly
- Natural standing or walking pose

### Example Output (Sneakers):
{
  "productDescription": "Neon Green Mesh Low-top Running Sneakers with dual velcro strap closure, chunky white rubber sole with green tread, padded collar and heel pull tab",
  "frontPrefix": "Professional footwear photography, front three-quarter view of",
  "backPrefix": "Professional footwear photography, back view of",
  "modelPrefix": "Fashion photography, cropped shot from mid-thigh down of an adult model wearing",
  "frontDetails": "Displayed as a pair with one shoe slightly forward, showing velcro straps and mesh upper detail",
  "backDetails": "Pair shown from behind highlighting heel pull tabs, padded collar and chunky sole profile",
  "modelDetails": "Styled with blue jeans with rolled cuffs, standing in a natural pose"
}`,

  accessories: `
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

### Example Output (Tote Bag):
{
  "productDescription": "Tan Full-grain Leather Large Structured Tote Bag with dual shoulder handles, gold-tone hardware and open top with magnetic snap closure",
  "frontPrefix": "Professional product photography, front three-quarter view of",
  "backPrefix": "Professional product photography, back view of",
  "modelPrefix": "Fashion photography, full body shot of an adult female model carrying",
  "frontDetails": "Bag standing upright showing structured silhouette, leather texture and gold hardware details",
  "backDetails": "Showing smooth rear leather panel and handle attachments from behind",
  "modelDetails": "Bag on shoulder, styled with white blouse, blue jeans and nude flats, standing in a natural pose"
}

### Example Output (Sunglasses):
{
  "productDescription": "Black and Gold Aviator Sunglasses with acetate frame, metal temples and green tinted UV400 lenses",
  "frontPrefix": "Professional eyewear photography, front view of",
  "backPrefix": "Professional eyewear photography, inside view of",
  "modelPrefix": "Fashion photography, head and shoulders shot of an adult model wearing",
  "frontDetails": "Displayed open and flat showing full frame shape and green lens tint",
  "backDetails": "Showing interior of frame, nose pads, temple hinges and arm details",
  "modelDetails": "Clean minimal styling, confident expression, sunglasses as focal point"
}`,

  non_wearable: `
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
- For lifestyle items: Appropriate context showing product use
- Focus on the product with context providing scale and use-case

### Example Output (Cushion):
{
  "productDescription": "Terracotta Linen Square Throw Cushion, 45x45cm, feather filled with hidden zip closure",
  "frontPrefix": "Professional home textiles photography, front view of",
  "backPrefix": "Professional home textiles photography, back view of",
  "modelPrefix": "Lifestyle interior photography featuring",
  "frontDetails": "Single cushion centered, showing linen texture and plump feather filling",
  "backDetails": "Showing rear panel with hidden zip closure detail and linen weave texture",
  "modelDetails": "Styled on a neutral beige linen sofa with complementary decor, warm natural lighting, product as focal point"
}

### Example Output (Lipstick):
{
  "productDescription": "Rose Pink Satin Finish Bullet Lipstick in gold-capped metal case with twist-up mechanism",
  "frontPrefix": "Professional cosmetics photography, front view of",
  "backPrefix": "Professional cosmetics photography, detail view of",
  "modelPrefix": "Beauty photography featuring",
  "frontDetails": "Product standing upright with cap removed beside it, showing rose pink shade and bullet shape",
  "backDetails": "Showing metal case construction, twist mechanism base and gold cap detail",
  "modelDetails": "Close-up of lips wearing the rose pink satin lipstick, focus on color payoff and finish, product visible in soft focus beside"
}`,
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Build complete system prompt with category-specific rules and model profile
 */
export function buildSystemPrompt(category: PhotographyCategory, modelDescriptor: string): string {
  const categoryRules = CATEGORY_RULES[category];

  const modelProfileRules = `
## MODEL PROFILE - STRICTLY ENFORCED

**CRITICAL**: You MUST use EXACTLY this model descriptor for ALL model view prompts: "${modelDescriptor}"

${modelDescriptor.includes('adult') ? '⚠️ This product requires an ADULT model. DO NOT use child models under any circumstances.' : ''}
${modelDescriptor.includes('child') ? '⚠️ This product requires a CHILD model. Use appropriate child model in the generated prompt.' : ''}

Incorporate the model descriptor naturally into the modelPrefix. For example:
- "Fashion photography, full body shot of ${modelDescriptor} wearing"
- "Fashion photography, cropped shot from mid-thigh down of ${modelDescriptor} wearing"
- "Fashion photography, head and shoulders shot of ${modelDescriptor} wearing"

Remember: The model age (adult vs child) is determined by the customer segment attribute in the product data and MUST be strictly followed.`;

  return `${BASE_SYSTEM_PROMPT}

${categoryRules}

${modelProfileRules}`;
}
