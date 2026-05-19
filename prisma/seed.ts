import { PrismaClient } from "../lib/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

async function main() {
  console.log("Seeding HoneyDo...")

  // Tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: "seed-tenant-1" },
    update: {},
    create: {
      id: "seed-tenant-1",
      name: "Alex & Jordan's Wedding",
    },
  })

  // Users
  const alex = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "alex@honeydo.dev" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Alex",
      email: "alex@honeydo.dev",
      hashedPassword: await bcrypt.hash("Password1!", 12),
      role: "COUPLE",
      isAdmin: true,
    },
  })

  const jordan = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "jordan@honeydo.dev" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Jordan",
      email: "jordan@honeydo.dev",
      hashedPassword: await bcrypt.hash("Password1!", 12),
      role: "COUPLE",
    },
  })

  // Wedding — set date ~10 months from now
  const weddingDate = new Date()
  weddingDate.setMonth(weddingDate.getMonth() + 10)

  const wedding = await prisma.wedding.upsert({
    where: { id: "seed-wedding-1" },
    update: {},
    create: {
      id: "seed-wedding-1",
      tenantId: tenant.id,
      name: "Alex & Jordan's Wedding",
      weddingDate,
      venue: "The Hive Venue",
      city: "Salt Lake City",
      state: "UT",
      guestCount: 120,
      budget: 25000,
      style: "TRADITIONAL",
      sunsetTime: "8:15 PM",
    },
  })

  // Wedding members
  await prisma.weddingMember.upsert({
    where: { weddingId_userId: { weddingId: wedding.id, userId: alex.id } },
    update: {},
    create: { weddingId: wedding.id, userId: alex.id, role: "COUPLE" },
  })
  await prisma.weddingMember.upsert({
    where: { weddingId_userId: { weddingId: wedding.id, userId: jordan.id } },
    update: {},
    create: { weddingId: wedding.id, userId: jordan.id, role: "COUPLE" },
  })

  // Checklist items
  const existingItems = await prisma.checklistItem.count({ where: { weddingId: wedding.id } })
  if (existingItems === 0) {
    await prisma.checklistItem.createMany({
      data: CHECKLIST.map((item, i) => ({ ...item, weddingId: wedding.id, order: i })),
    })
  }

  // Vendors
  const venue = await prisma.vendor.upsert({
    where: { id: "seed-vendor-venue" },
    update: {},
    create: {
      id: "seed-vendor-venue",
      weddingId: wedding.id,
      category: "VENUE",
      name: "The Hive Venue",
      contactName: "Events Team",
      email: "events@thehivevenue.com",
      phone: "801-555-0100",
      booked: true,
    },
  })

  const photographer = await prisma.vendor.upsert({
    where: { id: "seed-vendor-photo" },
    update: {},
    create: {
      id: "seed-vendor-photo",
      weddingId: wedding.id,
      category: "PHOTOGRAPHY",
      name: "Golden Hour Photography",
      contactName: "Sarah Mills",
      email: "sarah@goldenhour.photo",
      booked: true,
    },
  })

  await prisma.vendor.upsert({
    where: { id: "seed-vendor-florist" },
    update: {},
    create: {
      id: "seed-vendor-florist",
      weddingId: wedding.id,
      category: "FLORALS",
      name: "Bloom & Co.",
      contactName: "Maya",
      email: "hello@bloomandco.com",
      booked: false,
    },
  })

  // Budget items
  const existingBudget = await prisma.budgetItem.count({ where: { weddingId: wedding.id } })
  if (existingBudget === 0) {
    const depositDue = new Date(weddingDate)
    depositDue.setMonth(depositDue.getMonth() - 6)
    const balanceDue = new Date(weddingDate)
    balanceDue.setDate(balanceDue.getDate() - 30)

    await prisma.budgetItem.createMany({
      data: [
        {
          weddingId: wedding.id,
          vendorId: venue.id,
          category: "VENUE",
          name: "The Hive Venue",
          estimatedCost: 6500,
          depositAmount: 2000,
          depositDueDate: depositDue,
          balanceDueDate: balanceDue,
          paymentStatus: "DEPOSIT_PAID",
        },
        {
          weddingId: wedding.id,
          vendorId: photographer.id,
          category: "PHOTOGRAPHY",
          name: "Golden Hour Photography",
          estimatedCost: 3800,
          depositAmount: 1000,
          depositDueDate: depositDue,
          balanceDueDate: balanceDue,
          paymentStatus: "DEPOSIT_PAID",
        },
        {
          weddingId: wedding.id,
          category: "CATERING",
          name: "Catering estimate",
          estimatedCost: 7200,
          paymentStatus: "UNPAID",
        },
        {
          weddingId: wedding.id,
          category: "FLORALS",
          name: "Florals estimate",
          estimatedCost: 2500,
          paymentStatus: "UNPAID",
        },
        {
          weddingId: wedding.id,
          category: "MUSIC",
          name: "DJ / band estimate",
          estimatedCost: 1800,
          paymentStatus: "UNPAID",
        },
        {
          weddingId: wedding.id,
          category: "ATTIRE",
          name: "Wedding attire",
          estimatedCost: 2200,
          paymentStatus: "UNPAID",
        },
      ],
    })
  }

  console.log("✓ Seed complete")
  console.log("\nDemo credentials:")
  console.log("  alex@honeydo.dev / Password1!")
  console.log("  jordan@honeydo.dev / Password1!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

// ─── Default checklist ────────────────────────────────────────────────────────

const CHECKLIST = [
  { title: "Set your wedding date", category: "LOGISTICS" as const, status: "COMPLETED" as const, dueOffsetDays: -540 },
  { title: "Set your budget", category: "LOGISTICS" as const, status: "COMPLETED" as const, dueOffsetDays: -540 },
  { title: "Create your guest list", category: "LOGISTICS" as const, status: "IN_PROGRESS" as const, dueOffsetDays: -480 },
  { title: "Book your venue", category: "VENUE" as const, status: "COMPLETED" as const, dueOffsetDays: -480 },
  { title: "Hire a photographer", category: "PHOTOGRAPHY" as const, status: "COMPLETED" as const, dueOffsetDays: -420 },
  { title: "Hire a videographer", category: "VIDEOGRAPHY" as const, status: "PENDING" as const, dueOffsetDays: -420 },
  { title: "Book your caterer", category: "CATERING" as const, status: "PENDING" as const, dueOffsetDays: -360 },
  { title: "Book your florist", category: "FLORALS" as const, status: "PENDING" as const, dueOffsetDays: -360 },
  { title: "Book your DJ or band", category: "MUSIC" as const, status: "PENDING" as const, dueOffsetDays: -360 },
  { title: "Order wedding dress / attire", category: "ATTIRE" as const, status: "PENDING" as const, dueOffsetDays: -300 },
  { title: "Send save-the-dates", category: "STATIONERY" as const, status: "PENDING" as const, dueOffsetDays: -270 },
  { title: "Book your officiant", category: "OFFICIANT" as const, status: "PENDING" as const, dueOffsetDays: -270 },
  { title: "Plan your honeymoon", category: "HONEYMOON" as const, status: "PENDING" as const, dueOffsetDays: -240 },
  { title: "Book hair & makeup", category: "BEAUTY" as const, status: "PENDING" as const, dueOffsetDays: -210 },
  { title: "Send wedding invitations", category: "STATIONERY" as const, status: "PENDING" as const, dueOffsetDays: -180 },
  { title: "Book transportation", category: "TRANSPORTATION" as const, status: "PENDING" as const, dueOffsetDays: -120 },
  { title: "Finalize ceremony outline", category: "CEREMONY" as const, status: "PENDING" as const, dueOffsetDays: -60 },
  { title: "Confirm all vendors", category: "LOGISTICS" as const, status: "PENDING" as const, dueOffsetDays: -30 },
  { title: "Get marriage license", category: "LEGAL" as const, status: "PENDING" as const, dueOffsetDays: -30 },
  { title: "Final dress fitting", category: "ATTIRE" as const, status: "PENDING" as const, dueOffsetDays: -14 },
  { title: "Steam/press all attire", category: "ATTIRE" as const, status: "PENDING" as const, dueOffsetDays: -3 },
  { title: "Print vows", category: "CEREMONY" as const, status: "PENDING" as const, dueOffsetDays: -2 },
  { title: "Prepare gratuity envelopes", category: "LOGISTICS" as const, status: "PENDING" as const, dueOffsetDays: -2 },
  { title: "Pack emergency kit", category: "LOGISTICS" as const, status: "PENDING" as const, dueOffsetDays: -1 },
]
