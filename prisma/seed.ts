import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function main() {
  const now = new Date();

  // Clear existing data
  await prisma.action.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.application.deleteMany();
  await prisma.entryPoint.deleteMany();
  await prisma.company.deleteMany();

  // Companies: France, Europe, US, UAE
  const mistral = await prisma.company.create({
    data: {
      name: "Mistral AI",
      sizeEstimate: "200-500",
      country: "France",
      city: "Paris",
      careersUrl: "https://mistral.ai/careers",
      linkedinUrl: "https://linkedin.com/company/mistral-ai",
      personalInterest: 9,
      status: "PROCESS_IN_PROGRESS",
      notes: "Priorité haute — stage ML appliqué",
    },
  });

  const datadog = await prisma.company.create({
    data: {
      name: "Datadog",
      sizeEstimate: "5000+",
      country: "France",
      city: "Paris",
      careersUrl: "https://careers.datadoghq.com",
      linkedinUrl: "https://linkedin.com/company/datadog",
      personalInterest: 7,
      status: "FIND_ENTRY_POINT",
      notes: "Deadline dépassée — relancer",
    },
  });

  const deepmind = await prisma.company.create({
    data: {
      name: "Google DeepMind",
      sizeEstimate: "5000+",
      country: "United Kingdom",
      city: "London",
      careersUrl: "https://deepmind.google/careers",
      linkedinUrl: "https://linkedin.com/company/deepmind",
      personalInterest: 10,
      status: "PROCESS_IN_PROGRESS",
      notes: "Entretien technique prévu",
    },
  });

  const openai = await prisma.company.create({
    data: {
      name: "OpenAI",
      sizeEstimate: "500-1000",
      country: "United States",
      city: "San Francisco",
      careersUrl: "https://openai.com/careers",
      linkedinUrl: "https://linkedin.com/company/openai",
      personalInterest: 10,
      status: "FIND_ENTRY_POINT",
      notes: "Cible US — visa à prévoir",
    },
  });

  const g42 = await prisma.company.create({
    data: {
      name: "G42",
      sizeEstimate: "1000-5000",
      country: "United Arab Emirates",
      city: "Abu Dhabi",
      careersUrl: "https://g42.ai/careers",
      linkedinUrl: "https://linkedin.com/company/g42",
      personalInterest: 6,
      status: "PROCESS_IN_PROGRESS",
      notes: "Programme stage international",
    },
  });

  const huggingface = await prisma.company.create({
    data: {
      name: "Hugging Face",
      sizeEstimate: "200-500",
      country: "France",
      city: "Paris",
      careersUrl: "https://huggingface.co/jobs",
      linkedinUrl: "https://linkedin.com/company/huggingface",
      personalInterest: 8,
      status: "CLOSED",
      notes: "Refus — réessayer plus tard",
    },
  });

  // Entry Points
  const epMistralRecruiter = await prisma.entryPoint.create({
    data: {
      companyId: mistral.id,
      type: "RECRUITER",
      personName: "Marie Dupont",
      personRole: "Tech Recruiter",
      linkedinUrl: "https://linkedin.com/in/marie-dupont",
      channel: "LinkedIn",
      status: "CONTACTED",
      notes: "Contact établi via LinkedIn",
    },
  });

  const epMistralJob = await prisma.entryPoint.create({
    data: {
      companyId: mistral.id,
      type: "JOB_POSTING",
      status: "TO_CONTACT",
      notes: "Offre ML Intern 2025",
    },
  });

  await prisma.entryPoint.create({
    data: {
      companyId: datadog.id,
      type: "ALUMNI",
      personName: "Thomas Martin",
      personRole: "Data Engineer",
      linkedinUrl: "https://linkedin.com/in/thomas-martin",
      channel: "LinkedIn",
      status: "TO_CONTACT",
      notes: "Ancien de mon école",
    },
  });

  await prisma.entryPoint.create({
    data: {
      companyId: deepmind.id,
      type: "REFERRAL",
      personName: "Dr. Sarah Chen",
      personRole: "Research Scientist",
      status: "RESPONDED",
      notes: "Referral obtenu",
    },
  });

  await prisma.entryPoint.create({
    data: {
      companyId: openai.id,
      type: "COLD_APPLICATION",
      status: "TO_CONTACT",
    },
  });

  await prisma.entryPoint.create({
    data: {
      companyId: huggingface.id,
      type: "EMPLOYEE",
      personName: "Léa Bernard",
      personRole: "ML Engineer",
      linkedinUrl: "https://linkedin.com/in/lea-bernard",
      channel: "LinkedIn",
      status: "TO_CONTACT",
      notes: "Contact employé via alumni",
    },
  });

  // Applications
  const appMistral = await prisma.application.create({
    data: {
      companyId: mistral.id,
      entryPointId: epMistralRecruiter.id,
      roleTitle: "ML Engineering Intern",
      location: "Paris",
      offerUrl: "https://mistral.ai/careers/intern-ml",
      applicationType: "REFERRAL",
      appliedAt: addDays(now, -10),
      status: "TECHNICAL_INTERVIEW",
      notes: "Bonne avancée",
    },
  });

  await prisma.application.create({
    data: {
      companyId: mistral.id,
      entryPointId: epMistralJob.id,
      roleTitle: "Research Intern",
      location: "Paris",
      applicationType: "CAREERS_SITE",
      status: "PREPARATION",
    },
  });

  const appDatadog = await prisma.application.create({
    data: {
      companyId: datadog.id,
      roleTitle: "Data Engineering Intern",
      location: "Paris",
      applicationType: "COLD_APPLICATION",
      status: "SENT",
      appliedAt: addDays(now, -15),
      notes: "Pas de réponse depuis 2 semaines",
    },
  });

  const appDeepmind = await prisma.application.create({
    data: {
      companyId: deepmind.id,
      roleTitle: "Research Scientist Intern",
      location: "London",
      applicationType: "REFERRAL",
      appliedAt: addDays(now, -7),
      status: "HR_INTERVIEW",
    },
  });

  await prisma.application.create({
    data: {
      companyId: huggingface.id,
      roleTitle: "ML Engineer Intern",
      applicationType: "CAREERS_SITE",
      appliedAt: addDays(now, -30),
      status: "REJECTED",
      notes: "Refus — manque d'expérience",
    },
  });

  // Interviews
  const intMistralTech = await prisma.interview.create({
    data: {
      companyId: mistral.id,
      applicationId: appMistral.id,
      interviewType: "TECHNICAL",
      interviewerName: "Jean-Pierre ML",
      scheduledAt: addDays(now, 4),
      status: "SCHEDULED",
      nextStep: "Préparer system design",
    },
  });

  await prisma.interview.create({
    data: {
      companyId: mistral.id,
      applicationId: appMistral.id,
      interviewType: "HR",
      interviewerName: "Marie Dupont",
      scheduledAt: addDays(now, -5),
      status: "COMPLETED",
      feedback: "Positif, passage au technique",
      strengths: "Projet ML pertinent",
      improvements: "Clarifier les objectifs long terme",
    },
  });

  const intDeepmindHr = await prisma.interview.create({
    data: {
      companyId: deepmind.id,
      applicationId: appDeepmind.id,
      interviewType: "HR",
      scheduledAt: addDays(now, 2),
      status: "SCHEDULED",
      nextStep: "Préparer questions sur la culture",
    },
  });

  // Actions: overdue, due today, upcoming, completed
  await prisma.action.create({
    data: {
      title: "Relancer le recruteur Mistral",
      description: "Pas de réponse depuis 5 jours",
      status: "TODO",
      priority: "HIGH",
      dueDate: addDays(now, -2), // overdue
      companyId: mistral.id,
    },
  });

  await prisma.action.create({
    data: {
      title: "Postuler à l'offre ML Intern",
      status: "TODO",
      priority: "HIGH",
      dueDate: addDays(now, 0), // today
      companyId: mistral.id,
      entryPointId: epMistralJob.id,
    },
  });

  await prisma.action.create({
    data: {
      title: "Demander referral à Thomas Martin",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: addDays(now, -1), // overdue
      companyId: datadog.id,
    },
  });

  await prisma.action.create({
    data: {
      title: "Préparer entretien technique",
      description: "System design + projets ML",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueDate: addDays(now, 4),
      companyId: mistral.id,
      applicationId: appMistral.id,
      interviewId: intMistralTech.id,
    },
  });

  await prisma.action.create({
    data: {
      title: "Préparer entretien RH DeepMind",
      status: "TODO",
      priority: "HIGH",
      dueDate: addDays(now, 2),
      companyId: deepmind.id,
      applicationId: appDeepmind.id,
      interviewId: intDeepmindHr.id,
    },
  });

  await prisma.action.create({
    data: {
      title: "Envoyer message de recommandation",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: addDays(now, 5),
      companyId: openai.id,
    },
  });

  await prisma.action.create({
    data: {
      title: "Revoir la fiche entreprise Mistral",
      status: "TODO",
      priority: "LOW",
      dueDate: addDays(now, 10),
      companyId: mistral.id,
    },
  });

  await prisma.action.create({
    data: {
      title: "Relancer candidature Datadog",
      status: "TODO",
      priority: "HIGH",
      dueDate: addDays(now, -5), // overdue
      companyId: datadog.id,
      applicationId: appDatadog.id,
    },
  });

  await prisma.action.create({
    data: {
      title: "Préparer entretien RH",
      status: "DONE",
      priority: "MEDIUM",
      dueDate: addDays(now, -5),
      completedAt: addDays(now, -4),
      companyId: mistral.id,
      applicationId: appMistral.id,
    },
  });

  await prisma.action.create({
    data: {
      title: "Postuler avant deadline",
      status: "DONE",
      priority: "HIGH",
      dueDate: addDays(now, -10),
      completedAt: addDays(now, -10),
      companyId: mistral.id,
    },
  });

  console.log("Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
