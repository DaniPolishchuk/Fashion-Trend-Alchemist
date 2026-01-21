/**
 * Collections Mock Data Seeding Script
 * Creates sample collections with generated designs for testing the home page visualization
 */

import { db, closeDb } from '../client.js';
import { collections, generatedDesigns, collectionItems, projects } from '../schema/index.js';
import { eq } from 'drizzle-orm';

const HARDCODED_USER_ID = '00000000-0000-0000-0000-000000000000';
const PLACEHOLDER_IMAGE_URL = 'https://via.placeholder.com/400x600/7E57C2/FFFFFF?text=Design';

interface MockCollection {
  name: string;
  itemCount: number;
}

const mockCollections: MockCollection[] = [
  { name: 'Summer 2024 Essentials', itemCount: 8 },
  { name: 'Urban Streetwear Collection', itemCount: 12 },
  { name: 'Minimalist Classics', itemCount: 5 },
  { name: 'Bohemian Vibes', itemCount: 3 },
  { name: 'Athletic Performance', itemCount: 10 },
  { name: 'Evening Elegance', itemCount: 6 },
];

async function seedCollections() {
  try {
    console.log('🌱 Starting collections seeding...');

    // First, check if there are any projects to link generated designs to
    const existingProjects = await db.select().from(projects).limit(1);

    if (existingProjects.length === 0) {
      console.log('⚠️  No projects found. Creating a mock project for generated designs...');

      // Create a mock project for the generated designs
      const [mockProject] = await db
        .insert(projects)
        .values({
          userId: HARDCODED_USER_ID,
          name: 'Mock Project for Collections',
          status: 'active',
          seasonConfig: { season: 'summer', year: 2024 },
          scopeConfig: { productGroups: ['clothing'] },
        })
        .returning();

      console.log(`✅ Created mock project: ${mockProject.id}`);
    }

    // Get the first available project (either existing or newly created)
    const [project] = await db.select().from(projects).limit(1);
    const projectId = project.id;

    console.log(`📦 Using project ID: ${projectId}`);

    // Create collections and their associated designs
    for (const mockCollection of mockCollections) {
      console.log(`\n📁 Creating collection: ${mockCollection.name}`);

      // Insert collection
      const [collection] = await db
        .insert(collections)
        .values({
          userId: HARDCODED_USER_ID,
          name: mockCollection.name,
        })
        .returning();

      console.log(`   ✅ Collection created: ${collection.id}`);

      // Create generated designs for this collection
      const designIds: string[] = [];
      for (let i = 0; i < mockCollection.itemCount; i++) {
        const [design] = await db
          .insert(generatedDesigns)
          .values({
            projectId,
            inputConstraints: {
              style: 'modern',
              category: 'clothing',
              constraints: [`design-${i + 1}`],
            },
            predictedAttributes: {
              color: ['blue', 'white', 'gray'][i % 3],
              material: ['cotton', 'polyester', 'linen'][i % 3],
              size: ['S', 'M', 'L', 'XL'][i % 4],
            },
            generatedImageUrl: PLACEHOLDER_IMAGE_URL,
          })
          .returning();

        designIds.push(design.id);
      }

      console.log(`   🎨 Created ${designIds.length} generated designs`);

      // Link designs to collection
      const collectionItemsData = designIds.map((designId) => ({
        collectionId: collection.id,
        generatedDesignId: designId,
      }));

      await db.insert(collectionItems).values(collectionItemsData);
      console.log(`   🔗 Linked ${collectionItemsData.length} designs to collection`);
    }

    console.log('\n🎉 Collections seeding completed successfully!');
    console.log(
      `📊 Created ${mockCollections.length} collections with a total of ${mockCollections.reduce((sum, c) => sum + c.itemCount, 0)} designs`
    );
  } catch (error) {
    console.error('❌ Error seeding collections:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedCollections();
  } catch (error) {
    console.error('Failed to seed collections:', error);
    process.exit(1);
  } finally {
    await closeDb();
    process.exit(0);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { seedCollections };
