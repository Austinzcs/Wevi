import { PrismaClient, TripStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo users
  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      name: "Alice Chen",
      email: "alice@example.com",
      passwordHash: await bcrypt.hash("password123", 10),
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      name: "Bob Wang",
      email: "bob@example.com",
      passwordHash: await bcrypt.hash("password123", 10),
    },
  });

  // Create a demo trip
  const trip = await prisma.trip.create({
    data: {
      title: "Tokyo Summer Trip 🇯🇵",
      description: "Our annual friend reunion trip to Tokyo!",
      status: TripStatus.SCHEDULING,
      ownerId: alice.id,
      members: {
        create: [
          { userId: alice.id, role: "OWNER" },
          { userId: bob.id, role: "MEMBER" },
        ],
      },
    },
  });

  console.log(`✅ Created trip: ${trip.title}`);
  console.log(`✅ Created users: ${alice.email}, ${bob.email}`);
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
