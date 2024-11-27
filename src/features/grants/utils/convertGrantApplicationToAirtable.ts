import { type GrantApplication } from '@prisma/client';

interface GrantApplicationWithUserAndGrant extends GrantApplication {
  grant: {
    airtableId: string | null;
  };
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    discord: string | null;
  };
}

interface GrantApplicationAirtableSchema {
  ContribiumApplicationId: string;
  Title: string;
  Status: string;
  Summary: string;
  Funding: number;
  KPI: string | undefined;
  'Proof of Work': string;
  Name: string;
  'Contact Email': string;
  'Twitter URL': string | undefined;
  'SOL Wallet': string;
  Milestones: string | undefined;
  Grants: string[];
  Description: string;
  'Discord Handle': string | undefined;
  Deadline: string;
}

export function convertGrantApplicationToAirtable(
  grantApplication: GrantApplicationWithUserAndGrant,
): GrantApplicationAirtableSchema {
  let status;
  switch (grantApplication.applicationStatus) {
    case 'Pending':
      status = 'Undecided';
      break;
    case 'Approved':
      status = 'Accepted';
      break;
    case 'Rejected':
      status = 'Rejected';
      break;
    default:
      status = grantApplication.applicationStatus;
  }
  return {
    ContribiumApplicationId: grantApplication.id,
    Title: grantApplication.projectTitle,
    Status: status,
    Summary: grantApplication.projectOneLiner,
    Funding: grantApplication.approvedAmount || grantApplication.ask,
    KPI: grantApplication.kpi ?? undefined,
    'Proof of Work': grantApplication.proofOfWork,
    Name: `${grantApplication.user.firstName} ${grantApplication.user.lastName}`,
    'Contact Email': grantApplication.user.email,
    'Twitter URL': grantApplication.twitter ?? undefined,
    'SOL Wallet': grantApplication.walletAddress,
    Milestones: grantApplication.milestones ?? undefined,
    Grants: [grantApplication.grant.airtableId!],
    Description: grantApplication.projectDetails,
    'Discord Handle': grantApplication.user.discord ?? undefined,
    Deadline: grantApplication.projectTimeline,
  };
}
