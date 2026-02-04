# Image Prompt Templates by Product Group

This document contains prefabricated example prompts for Z-Image Turbo, organized by product group from the database taxonomy.

## Usage

These examples are designed to be injected into the LLM system prompt based on the detected `product_group` of the item being generated. Each product group has tailored photography styles and considerations.

---

## 1. Garment Upper Body (15 product types)

**Product Types:** Blazer, Blouse, Bodysuit, Cardigan, Coat, Hoodie, Jacket, Jumper, Polo shirt, Sweater, T-shirt, Top, Vest, Waistcoat, etc.

**Photography Style:** Ghost mannequin for 3D form visualization

### Example: Hoodie

**Input:**
- Product Type: Hoodie
- Product Group: Garment Upper body
- Customer Segment: Menswear
- Attributes: specific_color=Charcoal Grey, material=Cotton Fleece, fit=Relaxed, style=Pullover, neckline=Drawstring Hood, pocket_type=Kangaroo Pocket, hem_style=Ribbed Hem, sleeve_length=Long Sleeves

**Output:**
```json
{
  "front": "Ghost mannequin fashion photography, front view of a Charcoal Grey Cotton Fleece Hoodie. Relaxed fit pullover style featuring a drawstring hood, kangaroo pocket at the front, and ribbed hem. Long sleeves with ribbed cuffs. Displayed on an invisible body to show natural drape and volume, strictly clothing only, no human skin. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "back": "Ghost mannequin fashion photography, back view of a Charcoal Grey Cotton Fleece Hoodie. Displayed on an invisible body showing the solid rear panel, back of the hood, and ribbed hem. Smooth fleece texture visible. Strictly the back side, no front pocket visible, no drawstrings visible from back. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "model": "Fashion catalog photography, full body shot of a professional adult male model. He is wearing a Charcoal Grey Cotton Fleece Hoodie in relaxed fit with drawstring hood and kangaroo pocket. Styled with neutral black joggers and white sneakers. Standing in a confident casual pose, hands relaxed at sides. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography."
}
```

### Example: Blouse

**Input:**
- Product Type: Blouse
- Product Group: Garment Upper body
- Customer Segment: Womenswear
- Attributes: specific_color=Ivory, material=Silk, fit=Regular, style=Button-front, neckline=V-neck, sleeve_length=3/4 Sleeves, details=Pearl buttons

**Output:**
```json
{
  "front": "Ghost mannequin fashion photography, front view of an Ivory Silk Blouse. Elegant button-front style with V-neckline and 3/4 length sleeves. Features delicate pearl buttons down the front placket. Regular fit with soft drape. Displayed on an invisible body to show natural silk flow and structure, strictly clothing only, no human skin. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "back": "Ghost mannequin fashion photography, back view of an Ivory Silk Blouse. Displayed on an invisible body showing the smooth rear panel, back yoke, and 3/4 sleeve length. Lustrous silk texture visible. Strictly the back side, no buttons visible, no front neckline visible. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "model": "Fashion catalog photography, full body shot of a professional adult female model. She is wearing an Ivory Silk Blouse with V-neckline and pearl buttons. Styled with dark tailored trousers and nude heels. Standing in an elegant office pose, one hand lightly on hip. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography."
}
```

---

## 2. Garment Lower Body (5 product types)

**Product Types:** Leggings/Tights, Outdoor trousers, Shorts, Skirt, Trousers

**Photography Style:** Flat lay for pants/trousers/shorts, Ghost mannequin for skirts

### Example: Trousers (Flat Lay)

**Input:**
- Product Type: Trousers
- Product Group: Garment Lower body
- Customer Segment: Menswear
- Attributes: specific_color=Navy Blue, material=Wool Blend, fit=Slim, style=Chino, waist=Mid-rise, details=Side pockets, belt_loops=Yes

**Output:**
```json
{
  "front": "Professional flat lay photography, overhead view of Navy Blue Wool Blend Trousers. The pants are laid flat on a white surface, neatly pressed and smoothed out. Slim fit chino style with mid-rise waist, visible belt loops, and side pocket openings. Front crease and fly closure clearly visible. Neatly arranged, strictly clothing only. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "back": "Professional flat lay photography, overhead back view of Navy Blue Wool Blend Trousers. The pants are laid flat face down on a white surface, showing the rear panel with back welt pockets. Slim fit silhouette visible from above, smooth wool blend texture. Strictly the back side, no front fly visible, no front pockets visible. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "model": "Fashion catalog photography, full body shot of a professional adult male model. He is wearing Navy Blue Wool Blend Trousers in slim fit chino style. Styled with a crisp white Oxford shirt tucked in and brown leather loafers. Standing in a confident business casual pose. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography."
}
```

### Example: Skirt (Ghost Mannequin)

**Input:**
- Product Type: Skirt
- Product Group: Garment Lower body
- Customer Segment: Womenswear
- Attributes: specific_color=Black, material=Leather, fit=Fitted, style=Pencil, length=Knee-length, waist=High-waisted, details=Back zip

**Output:**
```json
{
  "front": "Ghost mannequin fashion photography, front view of a Black Leather Pencil Skirt. High-waisted fitted style with knee-length hem. Smooth leather surface with subtle sheen. Displayed on an invisible body to show the sleek silhouette and natural structure, strictly clothing only, no human skin. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "back": "Ghost mannequin fashion photography, back view of a Black Leather Pencil Skirt. Displayed on an invisible body showing the rear panel with concealed back zipper and back vent at hem. Fitted silhouette tapering at knee. Strictly the back side, smooth leather finish. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "model": "Fashion catalog photography, full body shot of a professional adult female model. She is wearing a Black Leather Pencil Skirt, high-waisted and knee-length. Styled with a tucked-in white silk blouse and black pointed-toe heels. Standing in a confident professional pose. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography."
}
```

---

## 3. Garment Full Body (5 product types)

**Product Types:** Costumes, Dress, Dungarees, Jumpsuit, Romper

**Photography Style:** Ghost mannequin to show full silhouette

### Example: Dress

**Input:**
- Product Type: Dress
- Product Group: Garment Full body
- Customer Segment: Womenswear
- Attributes: specific_color=Emerald Green, material=Satin, fit=A-line, style=Wrap dress, neckline=V-neck, length=Midi, sleeve_length=Short sleeves, details=Self-tie waist belt

**Output:**
```json
{
  "front": "Ghost mannequin fashion photography, front view of an Emerald Green Satin Wrap Dress. Elegant A-line silhouette with flattering V-neckline and short sleeves. Features a self-tie waist belt creating a defined waistline. Midi length with fluid drape. Lustrous satin finish catching the light. Displayed on an invisible body to show natural movement and structure, strictly clothing only, no human skin. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "back": "Ghost mannequin fashion photography, back view of an Emerald Green Satin Wrap Dress. Displayed on an invisible body showing the smooth rear panel, wrap closure at back waist, and midi-length hem. Short sleeves visible from behind. Elegant satin drape and sheen. Strictly the back side, no front neckline visible. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "model": "Fashion catalog photography, full body shot of a professional adult female model. She is wearing an Emerald Green Satin Wrap Dress with V-neckline and self-tie waist. A-line silhouette falling to midi length. Styled with gold strappy heels and minimal jewelry. Standing in an elegant pose with natural hand placement. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography."
}
```

### Example: Jumpsuit

**Input:**
- Product Type: Jumpsuit
- Product Group: Garment Full body
- Customer Segment: Womenswear
- Attributes: specific_color=Black, material=Crepe, fit=Tailored, style=Wide-leg, neckline=Square neck, sleeve_length=Sleeveless, details=Hidden back zip, waist=Defined waist

**Output:**
```json
{
  "front": "Ghost mannequin fashion photography, front view of a Black Crepe Jumpsuit. Sophisticated tailored style with square neckline and sleeveless design. Defined waist flowing into elegant wide-leg trousers. Clean minimalist aesthetic with structured shoulders. Displayed on an invisible body to show the elongating silhouette, strictly clothing only, no human skin. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "back": "Ghost mannequin fashion photography, back view of a Black Crepe Jumpsuit. Displayed on an invisible body showing the smooth rear panel, concealed back zipper, and wide-leg trouser silhouette. Square back neckline and sleeveless cut visible. Strictly the back side, clean crepe fabric texture. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "model": "Fashion catalog photography, full body shot of a professional adult female model. She is wearing a Black Crepe Jumpsuit with square neckline, defined waist, and flowing wide-leg trousers. Styled with statement gold earrings and black strappy heels. Standing in a confident elegant pose. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography."
}
```

---

## 4. Shoes (16 product types)

**Product Types:** Ballerinas, Bootie, Boots, Flat shoe, Flat shoes, Heels, Loafers, Mules, Pumps, Sandals, Slippers, Sneakers, etc.

**Photography Style:** 3/4 angle product shot showing design details; pair displayed together

### Example: Sneakers

**Input:**
- Product Type: Sneakers
- Product Group: Shoes
- Customer Segment: Unisex
- Attributes: specific_color=White/Navy, material=Leather and Mesh, style=Low-top, sole=Rubber, closure=Lace-up, details=Cushioned insole, brand_detail=Contrast heel tab

**Output:**
```json
{
  "front": "Professional footwear photography, front three-quarter view of White and Navy Leather and Mesh Sneakers. Low-top style displayed as a pair at slight angle. Clean white leather upper with navy mesh panels and contrast navy heel tab. White rubber sole with textured grip. Lace-up closure with white flat laces. Sharp detail on stitching and material transitions. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "back": "Professional footwear photography, back view of White and Navy Sneakers. Pair shown from behind highlighting the navy heel tabs, padded collar, and white rubber sole profile. Clean heel counter construction visible. Strictly the back view, showing heel height and back panel design. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "model": "Fashion catalog photography, cropped shot from mid-thigh down of a model wearing White and Navy Sneakers. Styled with dark blue slim jeans with rolled cuffs. Model standing in natural relaxed pose, one foot slightly forward to show shoe profile. Feet clearly visible with full sneaker detail. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography."
}
```

### Example: Heels

**Input:**
- Product Type: Heels
- Product Group: Shoes
- Customer Segment: Womenswear
- Attributes: specific_color=Red, material=Patent Leather, style=Stiletto, heel_height=10cm, toe=Pointed toe, closure=Slip-on

**Output:**
```json
{
  "front": "Professional footwear photography, front three-quarter view of Red Patent Leather Stiletto Heels. Elegant pointed-toe design with high-shine patent finish. Classic silhouette with 10cm stiletto heel. Displayed as a pair with one shoe slightly forward. Sharp reflections on glossy surface highlighting the sleek shape. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "back": "Professional footwear photography, back view of Red Patent Leather Stiletto Heels. Pair shown from behind showcasing the slender 10cm stiletto heels and curved heel breast. Patent leather sheen visible on heel counter. Clean sole edge visible. Strictly the back view. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "model": "Fashion catalog photography, cropped shot from knee down of a professional adult female model wearing Red Patent Leather Stiletto Heels. Styled with black tailored cropped trousers. Model standing in elegant pose, one foot pointed forward to elongate the leg line. Full heel and pointed toe clearly visible. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography."
}
```

---

## 5. Bags (6 product types)

**Product Types:** Backpack, Bumbag, Cross-body bag, Shoulder bag, Tote bag

**Photography Style:** 3/4 angle showing structure, hardware, and interior glimpse if applicable

### Example: Tote Bag

**Input:**
- Product Type: Tote bag
- Product Group: Bags
- Customer Segment: Womenswear
- Attributes: specific_color=Tan, material=Full-grain Leather, style=Structured tote, size=Large, closure=Open top with magnetic snap, details=Gold-tone hardware, interior pockets

**Output:**
```json
{
  "front": "Professional product photography, front three-quarter view of a Tan Full-grain Leather Tote Bag. Large structured silhouette with clean lines. Open top design with subtle magnetic snap closure. Dual shoulder handles with gold-tone hardware attachments. Rich leather texture and natural grain visible. Bag positioned upright showing full height and width. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "back": "Professional product photography, back view of a Tan Full-grain Leather Tote Bag. Smooth rear panel showing full-grain leather quality. Handle attachments visible from behind. Clean stitching along edges. Structured base keeping bag upright. Strictly the back side. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "model": "Fashion catalog photography, full body shot of a professional adult female model carrying a Tan Full-grain Leather Tote Bag on her shoulder. Styled with a white blouse, blue jeans, and nude flats for casual-chic look. Model standing in natural pose, bag resting comfortably on shoulder showing how it drapes. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography."
}
```

### Example: Backpack

**Input:**
- Product Type: Backpack
- Product Group: Bags
- Customer Segment: Unisex
- Attributes: specific_color=Black, material=Nylon with Leather trim, style=Urban, size=Medium, closure=Drawstring with flap, details=Padded laptop compartment, adjustable straps

**Output:**
```json
{
  "front": "Professional product photography, front three-quarter view of a Black Nylon Backpack with Leather trim. Urban style medium-sized bag with drawstring closure under leather flap. Front leather panel detail with subtle texture contrast. Visible top handle and shoulder strap attachments. Clean modern silhouette. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "back": "Professional product photography, back view of a Black Nylon Backpack. Showing padded back panel, adjustable shoulder straps with leather details, and ergonomic design. Straps hanging naturally to show length. Clean nylon fabric with reinforced stitching. Strictly the back side. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "model": "Fashion catalog photography, full body shot of a professional adult male model wearing a Black Nylon Backpack. Both straps on shoulders in natural carrying position. Styled with a grey crewneck sweater, dark jeans, and white sneakers. Model in relaxed standing pose, slight turn to show bag profile. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography."
}
```

---

## 6. Swimwear (6 product types)

**Product Types:** Bikini top, Sarong, Swimsuit, Swimwear bottom, Swimwear set

**Photography Style:** Ghost mannequin or form for structure; emphasis on stretch fabric and coverage

### Example: Bikini Top

**Input:**
- Product Type: Bikini top
- Product Group: Swimwear
- Customer Segment: Womenswear
- Attributes: specific_color=Coral, material=Recycled Lycra, style=Triangle, support=Light padding, closure=Tie back and halter neck, details=Gold ring detail at center

**Output:**
```json
{
  "front": "Professional swimwear photography, front view of a Coral Recycled Lycra Triangle Bikini Top. Displayed on invisible bust form showing cup shape and coverage. Triangle cups with light padding and decorative gold ring detail at center front. Halter neck ties visible at top. Vibrant coral color with subtle fabric sheen. Strictly product only, no human skin visible. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "back": "Professional swimwear photography, back view of a Coral Recycled Lycra Triangle Bikini Top. Displayed showing tie-back closure with adjustable strings. Clean back with halter neck tie at top and band tie at mid-back. Smooth fabric finish. Strictly the back side, no front cups visible. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "model": "Fashion catalog photography, full body shot of a professional adult female model wearing a Coral Triangle Bikini Top. Paired with matching coral bikini bottom for complete look. Model standing in confident relaxed beach pose. Hair styled naturally, minimal jewelry. Full swimwear clearly visible against plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography."
}
```

### Example: Swimsuit (One-piece)

**Input:**
- Product Type: Swimsuit
- Product Group: Swimwear
- Customer Segment: Womenswear
- Attributes: specific_color=Navy with White stripes, material=Chlorine-resistant fabric, style=Classic one-piece, neckline=Scoop neck, back=Low back, details=Built-in shelf bra, leg_cut=Medium

**Output:**
```json
{
  "front": "Professional swimwear photography, front view of a Navy and White Striped One-piece Swimsuit. Classic style with flattering scoop neckline and horizontal stripe pattern. Medium leg cut with built-in support. Chlorine-resistant fabric with smooth finish. Displayed on invisible body form showing the full silhouette and torso coverage. Strictly product only, no human skin visible. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "back": "Professional swimwear photography, back view of a Navy and White Striped One-piece Swimsuit. Showing elegant low back design with clean straps. Horizontal stripes continuing around to back. Medium coverage at bottom. Strictly the back side showing the open back detail. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "model": "Fashion catalog photography, full body shot of a professional adult female model wearing a Navy and White Striped One-piece Swimsuit. Classic styling with scoop neck and low back. Model standing in confident beach pose, one hand on hip. Clean athletic look. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography."
}
```

---

## 7. Underwear (11 product types)

**Product Types:** Bra, Bra extender, Kids Underwear top, Long John, Nipple covers, Briefs, Boxers, etc.

**Photography Style:** Ghost mannequin with soft lighting; emphasis on fit and fabric quality

### Example: Bra

**Input:**
- Product Type: Bra
- Product Group: Underwear
- Customer Segment: Womenswear
- Attributes: specific_color=Blush Pink, material=Lace and Microfiber, style=Balconette, support=Underwire, closure=Back hook-and-eye, details=Scalloped lace edge, padding=Light padding

**Output:**
```json
{
  "front": "Professional lingerie photography, front view of a Blush Pink Lace and Microfiber Balconette Bra. Delicate scalloped lace overlay on cups with smooth microfiber lining. Underwire support with light padding. Adjustable straps with silver-tone hardware. Elegant feminine design. Displayed on invisible bust form showing cup shape and construction. Strictly product only, no human skin visible. Soft diffused lighting on plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "back": "Professional lingerie photography, back view of a Blush Pink Balconette Bra. Showing smooth microfiber band with hook-and-eye closure (3 columns, 3 rows). Adjustable straps and clean back construction. Wing panels for comfortable fit. Strictly the back side, no front lace visible. Soft diffused lighting on plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "model": "Fashion catalog photography, cropped shot from shoulders to hips of a professional adult female model wearing a Blush Pink Lace Balconette Bra. Paired with matching blush pink lace brief for coordinated look. Model in elegant standing pose with arms relaxed. Tasteful intimate apparel styling. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography."
}
```

---

## 8. Nightwear (4 product types)

**Product Types:** Night gown, Pyjama bottom, Pyjama jumpsuit/playsuit, Pyjama set

**Photography Style:** Soft, warm lighting emphasizing comfort and fabric drape

### Example: Pyjama Set

**Input:**
- Product Type: Pyjama set
- Product Group: Nightwear
- Customer Segment: Womenswear
- Attributes: specific_color=Sage Green, material=Silk Satin, style=Classic button-front shirt and pants, fit=Relaxed, details=Contrast piping, collar=Notch lapel

**Output:**
```json
{
  "front": "Professional sleepwear photography, front view of a Sage Green Silk Satin Pyjama Set. Classic button-front shirt with notch lapel collar and cream contrast piping. Matching relaxed-fit pants with elastic waist. Luxurious satin sheen catching soft light. Both pieces displayed together on invisible forms showing the coordinated set. Strictly clothing only, no human skin visible. Soft warm lighting on plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "back": "Professional sleepwear photography, back view of a Sage Green Silk Satin Pyjama Set. Showing smooth rear panel of shirt with contrast piping detail at yoke. Pants displayed showing the relaxed fit from behind. Satin drape and quality visible. Strictly the back side. Soft warm lighting on plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "model": "Fashion catalog photography, full body shot of a professional adult female model wearing a Sage Green Silk Satin Pyjama Set. Button-front shirt with notch lapel, matching pants. Model in relaxed comfortable pose suggesting restful luxury. Hair loosely styled. Plain white studio background with soft warm lighting, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography."
}
```

---

## 9. Socks & Tights (3 product types)

**Product Types:** Leg warmers, Socks, Underwear Tights

**Photography Style:** Flat lay showing pattern/texture, or on leg form for fitted items

### Example: Socks

**Input:**
- Product Type: Socks
- Product Group: Socks & Tights
- Customer Segment: Unisex
- Attributes: specific_color=Grey with Yellow heel, material=Cotton blend, style=Crew length, details=Cushioned sole, ribbed cuff, pattern=Solid with contrast heel and toe

**Output:**
```json
{
  "front": "Professional hosiery photography, front view of Grey Cotton Blend Crew Socks with Yellow contrast heel and toe. Displayed as a pair laid flat, slightly overlapping to show both socks. Ribbed cuff detail at top, cushioned sole construction visible. Clean solid grey with vibrant yellow accents. Neatly arranged on plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "back": "Professional hosiery photography, back view of Grey Crew Socks. Pair displayed showing the yellow heel cups and grey leg portion. Ribbed texture visible along cuff. Cushioned sole thickness visible from side angle. Strictly the back/heel view. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "model": "Fashion catalog photography, cropped shot from knee down of a model wearing Grey Cotton Blend Crew Socks with Yellow heel. Styled with clean white sneakers (partially visible) and dark rolled-up jeans. Model standing naturally, sock height and fit clearly visible. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography."
}
```

---

## 10. Accessories (38 product types)

**Product Types:** Accessories set, Alice band, Baby Bib, Bag, Beanie, Belt, Bracelet, Earrings, Gloves, Hair clip, Hat, Necklace, Scarf, Sunglasses, Umbrella, Wallet, Watch, etc.

**Photography Style:** Flat lay or styled arrangement; focus on detail and scale

### Example: Scarf

**Input:**
- Product Type: Scarf
- Product Group: Accessories
- Customer Segment: Womenswear
- Attributes: specific_color=Burgundy and Gold, material=Cashmere, style=Oversized blanket scarf, pattern=Paisley print, size=200cm x 70cm, details=Fringed edges

**Output:**
```json
{
  "front": "Professional accessory photography, artistic flat lay of a Burgundy and Gold Cashmere Blanket Scarf. Oversized piece artfully draped to show the paisley print pattern and luxurious cashmere texture. Fringed edges visible along bottom. Rich burgundy base with intricate gold paisley motifs. Arranged to show pattern repeat and fabric quality. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "back": "Professional accessory photography, back view flat lay of a Burgundy and Gold Cashmere Scarf. Showing the reverse side fabric finish and pattern visibility from behind. Fringed edge detail. Cashmere weave texture visible. Neatly arranged. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "model": "Fashion catalog photography, upper body shot of a professional adult female model wearing a Burgundy and Gold Paisley Cashmere Scarf. Draped elegantly around neck and shoulders in classic wrap style, fringed ends hanging naturally. Styled with a simple black turtleneck underneath. Model in sophisticated pose. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography."
}
```

### Example: Sunglasses

**Input:**
- Product Type: Sunglasses
- Product Group: Accessories
- Customer Segment: Unisex
- Attributes: specific_color=Black/Gold, material=Acetate frame with Metal temples, style=Aviator, lens=Green tinted, details=UV400 protection

**Output:**
```json
{
  "front": "Professional eyewear photography, front view of Black and Gold Aviator Sunglasses. Classic aviator shape in black acetate with gold metal temple arms. Green tinted lenses with UV400 protection. Displayed open and flat, showing full frame width and lens shape. Sharp detail on frame construction and hardware. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "back": "Professional eyewear photography, back/inside view of Aviator Sunglasses. Showing the interior of the frame, nose pads, and temple arm hinges. Gold metal temples with acetate tips visible. Frame curvature for comfortable fit. Lens back surface. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "model": "Fashion catalog photography, head and shoulders shot of a professional adult model wearing Black and Gold Aviator Sunglasses. Green tinted lenses complementing the styling. Model facing camera directly with confident expression. Clean minimal styling to keep focus on eyewear. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography."
}
```

---

## 11. Interior Textile (3 product types)

**Product Types:** Blanket, Cushion, Towel

**Photography Style:** Flat lay emphasizing texture, pattern, and size; lifestyle context for model shots

### Example: Cushion

**Input:**
- Product Type: Cushion
- Product Group: Interior textile
- Customer Segment: Home
- Attributes: specific_color=Terracotta, material=Linen, style=Square throw cushion, size=45x45cm, details=Invisible zip closure, insert=Feather filled

**Output:**
```json
{
  "front": "Professional home textiles photography, front view of a Terracotta Linen Square Cushion. 45x45cm throw cushion with natural linen texture and subtle slub weave visible. Plump feather filling creating soft rounded edges. Rich terracotta color evenly displayed. Single cushion centered in frame. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "back": "Professional home textiles photography, back view of a Terracotta Linen Cushion. Showing the rear panel with invisible zip closure detail. Same linen texture and terracotta color as front. Clean construction. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "model": "Lifestyle home photography, a Terracotta Linen Cushion styled on a neutral beige linen sofa. Cushion placed naturally among other neutral-toned pillows to show scale and styling potential. Warm natural lighting suggesting cozy interior setting. Focus on the terracotta cushion while showing context. Clean bright setting, 4K quality, sharp focus, no text, no watermarks, no logos, high-end editorial home photography."
}
```

---

## 12. Cosmetic (2 product types)

**Product Types:** Chem. cosmetics, Fine cosmetics

**Photography Style:** Clean product photography with emphasis on packaging, texture, and finish

### Example: Fine Cosmetics (Lipstick)

**Input:**
- Product Type: Fine cosmetics
- Product Group: Cosmetic
- Customer Segment: Womenswear
- Attributes: specific_color=Rose Pink, material=Metal case, style=Bullet lipstick, finish=Satin, details=Gold cap

**Output:**
```json
{
  "front": "Professional cosmetics photography, front view of a Rose Pink Satin Lipstick. Elegant bullet design in gold-capped metal case. Lipstick extended to show the rose pink shade and smooth satin texture. Product standing upright with cap beside it. Luxurious finish and color payoff visible. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end beauty e-commerce photography.",
  "back": "Professional cosmetics photography, back view of lipstick case and product. Showing the metal tube construction and gold cap detail. Product information area on tube visible. Clean elegant design. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end beauty e-commerce photography.",
  "model": "Professional beauty photography, close-up beauty shot of a female model wearing Rose Pink Satin Lipstick. Focus on lips and lower face showing the color and satin finish on lips. Flawless skin, minimal other makeup to emphasize lip color. The lipstick product visible in soft focus in corner of frame. Clean beauty lighting, 4K quality, sharp focus, no text, no watermarks, no logos, high-end beauty editorial photography."
}
```

---

## 13. Garment and Shoe Care (6 product types)

**Product Types:** Clothing mist, Sewing kit, Stain remover spray, Washing bag, Wood balls

**Photography Style:** Clean product photography showing packaging and use case

### Example: Clothing Mist

**Input:**
- Product Type: Clothing mist
- Product Group: Garment and Shoe care
- Customer Segment: Home
- Attributes: specific_color=Clear bottle with White label, material=Plastic spray bottle, style=Fabric freshener, size=250ml, details=Fine mist spray nozzle

**Output:**
```json
{
  "front": "Professional product photography, front view of a Clothing Mist Fabric Freshener spray bottle. Clear 250ml plastic bottle with white label and fine mist spray nozzle. Clean minimalist packaging design. Product standing upright showing full bottle shape and label. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "back": "Professional product photography, back view of Clothing Mist bottle. Showing back label with product information area. Clear bottle allowing liquid level visibility. Spray mechanism from behind. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "model": "Lifestyle product photography, Clothing Mist being used in context. A hand holding the spray bottle, misting towards a hanging garment on a clothing rack. Fresh fabric care in action. Clean bright home environment setting. Focus on product with garment softly blurred in background. 4K quality, sharp focus, no text, no watermarks, no logos, lifestyle e-commerce photography."
}
```

---

## 14. Items (5 product types)

**Product Types:** Dog wear, Keychain, Mobile case, Umbrella, Wireless earphone case

**Photography Style:** Clean product photography appropriate to item type

### Example: Umbrella

**Input:**
- Product Type: Umbrella
- Product Group: Items
- Customer Segment: Unisex
- Attributes: specific_color=Navy Blue, material=Water-repellent polyester canopy, style=Compact folding, handle=Rubberized grip, details=Auto open/close, windproof frame

**Output:**
```json
{
  "front": "Professional product photography, Navy Blue Compact Folding Umbrella displayed both open and closed. Open umbrella shown from above at angle displaying the water-repellent polyester canopy and windproof frame structure. Closed umbrella beside it showing compact folded size and rubberized grip handle. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "back": "Professional product photography, back view of Navy Blue Umbrella. Open umbrella from underneath showing the frame construction, runner, and ribs. Quality stitching where canopy meets frame. Handle and auto-open button visible. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "model": "Lifestyle photography, a professional adult model holding an open Navy Blue Umbrella. Model dressed in smart casual attire (trench coat, dark trousers) suggesting rainy day readiness. Umbrella held naturally overhead. Three-quarter body shot showing umbrella scale. Plain white studio background with subtle grey gradient suggesting overcast sky, 4K quality, sharp focus, no text, no watermarks, no logos, lifestyle e-commerce photography."
}
```

---

## 15. Fun (1 product type)

**Product Types:** Toy

**Photography Style:** Bright, playful product photography

### Example: Toy

**Input:**
- Product Type: Toy
- Product Group: Fun
- Customer Segment: Kids
- Attributes: specific_color=Multicolor, material=Plush fabric, style=Stuffed animal, size=30cm, details=Safety embroidered eyes, machine washable

**Output:**
```json
{
  "front": "Professional toy photography, front view of a Multicolor Plush Stuffed Animal. Soft plush fabric in vibrant colors. Friendly expression with safety embroidered eyes. 30cm size displayed upright in seated position. Cuddly and child-safe appearance. Bright clean lighting. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "back": "Professional toy photography, back view of Plush Stuffed Animal. Showing back construction, tail detail if applicable, and fabric quality from behind. Care label area visible. Same plush texture as front. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "model": "Lifestyle photography, a young child (age appropriate, approximately 4-6 years) holding the Multicolor Plush Stuffed Animal. Child seated and hugging the toy showing scale and cuddly nature. Joyful natural expression. Bright playful setting with white background. Focus on child-toy interaction. 4K quality, sharp focus, no text, no watermarks, no logos, lifestyle e-commerce photography."
}
```

---

## 16. Furniture (1 product type)

**Product Types:** Side table

**Photography Style:** Clean product photography with optional lifestyle context

### Example: Side Table

**Input:**
- Product Type: Side table
- Product Group: Furniture
- Customer Segment: Home
- Attributes: specific_color=Natural Oak, material=Solid Oak Wood, style=Scandinavian, size=45cm height x 40cm diameter, details=Round top, three splayed legs

**Output:**
```json
{
  "front": "Professional furniture photography, front three-quarter view of a Natural Oak Side Table. Scandinavian style with round 40cm diameter top and three elegantly splayed solid oak legs. 45cm height. Beautiful natural wood grain visible on top surface. Clean minimalist design. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end furniture e-commerce photography.",
  "back": "Professional furniture photography, back/alternate angle view of Natural Oak Side Table. Showing leg construction and joinery detail. Wood grain pattern on underside of top visible. Quality craftsmanship evident. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end furniture e-commerce photography.",
  "model": "Lifestyle interior photography, Natural Oak Side Table styled in a living room setting. Placed beside a neutral linen sofa with a ceramic vase and book on top. Warm natural lighting from window. Scandinavian interior aesthetic. Table as focal point with surrounding decor providing scale and styling context. 4K quality, sharp focus, no text, no watermarks, no logos, editorial interior photography."
}
```

---

## 17. Stationery (1 product type)

**Product Types:** Marker pen

**Photography Style:** Clean product photography

### Example: Marker Pen

**Input:**
- Product Type: Marker pen
- Product Group: Stationery
- Customer Segment: General
- Attributes: specific_color=Assorted set, material=Plastic barrel, style=Fine tip permanent markers, size=Set of 12, details=Quick-dry ink, fade-resistant

**Output:**
```json
{
  "front": "Professional stationery photography, front view of Assorted Fine Tip Permanent Marker Set. 12 markers arranged in rainbow color order, laid diagonally across frame. Caps on showing color indicators. Plastic barrels with clear labeling area. Clean organized arrangement. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "back": "Professional stationery photography, detail view of marker tips and construction. Several markers uncapped showing fine tips and ink saturation. Barrel clip detail visible. Product information area on barrels. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end e-commerce photography.",
  "model": "Lifestyle photography, a hand using a marker from the Assorted Fine Tip Set to write on paper. Writing surface visible with colorful marks showing ink quality. Other markers from set visible nearby. Creative workspace setting with clean white desk surface. Focus on product in use. 4K quality, sharp focus, no text, no watermarks, no logos, lifestyle e-commerce photography."
}
```

---

## 18. Underwear/Nightwear (2 product types)

**Product Types:** Sleep Bag, Sleeping sack

**Photography Style:** Soft lighting emphasizing comfort and functionality

### Example: Sleeping Sack (Baby)

**Input:**
- Product Type: Sleeping sack
- Product Group: Underwear/nightwear
- Customer Segment: Baby
- Attributes: specific_color=Soft Grey with White stars, material=Organic Cotton, style=Sleeveless sleep sack, size=6-18 months, details=Two-way zip, TOG rating 2.5

**Output:**
```json
{
  "front": "Professional baby product photography, front view of a Soft Grey Organic Cotton Sleeping Sack with White star print. Sleeveless design for safe baby sleep. Two-way zipper visible from neckline to hem. Cozy 2.5 TOG rating for warmth. Sized for 6-18 months. Laid flat showing full shape and pattern. Soft warm lighting. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end baby e-commerce photography.",
  "back": "Professional baby product photography, back view of Grey Star Print Sleeping Sack. Showing smooth rear panel with star pattern continuing around. Quality stitching at seams. Organic cotton texture visible. Strictly the back side. Soft warm lighting. Plain white studio background, shadowless, 4K quality, sharp focus, no text, no watermarks, no logos, high-end baby e-commerce photography.",
  "model": "Lifestyle baby photography, an infant (approximately 9-12 months) wearing the Soft Grey Star Print Sleeping Sack. Baby lying safely in crib setting, peaceful and cozy. Sleep sack fit clearly visible showing ease of movement. Soft warm nursery lighting. Gentle safe sleep environment context. 4K quality, sharp focus, no text, no watermarks, no logos, lifestyle baby e-commerce photography."
}
```

---

## Implementation Notes

### Selecting the Right Template

When generating prompts, the system should:

1. **Extract product_group from the article data** (from DB or enriched attributes)
2. **Match to the closest template category** using the groups above
3. **Inject the relevant example** into the LLM system prompt
4. **Fall back to Garment Upper body** style if product group is unknown

### Template Interpolation Points

Each template can be customized by replacing:
- `[COLOR]` - specific_color attribute
- `[MATERIAL]` - material/fabric attribute
- `[PRODUCT_TYPE]` - product type name
- `[STYLE]` - style attribute
- `[DETAILS]` - concatenated detail attributes
- `[GENDER]` - inferred from customer_segment

### Photography Style Summary by Group

| Product Group | Front View | Back View | Model View |
|--------------|------------|-----------|------------|
| Garment Upper body | Ghost mannequin | Ghost mannequin | Full body |
| Garment Lower body | Flat lay (pants) / Ghost mannequin (skirts) | Flat lay / Ghost mannequin | Full body |
| Garment Full body | Ghost mannequin | Ghost mannequin | Full body |
| Shoes | 3/4 angle pair | Back view pair | Cropped legs |
| Bags | 3/4 angle | Back view | Full body carrying |
| Swimwear | Form/mannequin | Form/mannequin | Full body beach pose |
| Underwear | Soft lit mannequin | Back construction | Cropped torso |
| Nightwear | Soft lit display | Back view | Full body relaxed |
| Socks & Tights | Flat lay pair | Heel view | Cropped legs |
| Accessories | Flat lay/styled | Back/detail | Upper body/head |
| Interior textile | Flat lay texture | Back/detail | Lifestyle context |
| Cosmetic | Product upright | Back/detail | Beauty close-up |
| Other (Items, Fun, etc.) | Clean product | Detail view | Lifestyle/in-use |
