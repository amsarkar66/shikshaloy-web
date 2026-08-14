import { Resend } from "resend";

const FROM = "Shikshaloy <onboarding@shikshaloy.com>";

// Resend's constructor throws synchronously if given a falsy key, which would
// crash every route that imports this module before RESEND_API_KEY is set up
// (see Phase 10 manual setup). Create the client lazily, only once a send is
// actually attempted, and skip sending (rather than crash) if unconfigured.
function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function sendPrincipalCredentialsEmail(input: {
  to: string;
  principalName: string;
  schoolName: string;
  loginEmail: string;
  loginPassword: string;
}) {
  const resend = getResendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping principal credentials email.");
    return;
  }
  const loginUrl = `${siteUrl()}/login`;
  try {
    await resend.emails.send({
      from: FROM,
      to: input.to,
      subject: `Your Shikshaloy admin login for ${input.schoolName}`,
      html: `
        <p>Hi ${input.principalName},</p>
        <p>An account has been created for you as the admin for <strong>${input.schoolName}</strong> on Shikshaloy.</p>
        <p><strong>Login email:</strong> ${input.loginEmail}<br/>
        <strong>Temporary password:</strong> ${input.loginPassword}</p>
        <p><a href="${loginUrl}">Sign in to Shikshaloy</a> and change your password once you're in.</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send principal credentials email:", err);
  }
}

export async function sendTeamInviteEmail(input: {
  to: string;
  fullName: string;
  loginEmail: string;
  loginPassword: string;
  permissionLabel: string;
}) {
  const resend = getResendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping team invite email.");
    return;
  }
  const loginUrl = `${siteUrl()}/login`;
  try {
    await resend.emails.send({
      from: FROM,
      to: input.to,
      subject: "You've been added to the Shikshaloy platform team",
      html: `
        <p>Hi ${input.fullName},</p>
        <p>You've been added to Shikshaloy's platform team with <strong>${input.permissionLabel}</strong> access.</p>
        <p><strong>Login email:</strong> ${input.loginEmail}<br/>
        <strong>Temporary password:</strong> ${input.loginPassword}</p>
        <p><a href="${loginUrl}">Sign in to Shikshaloy</a> and change your password once you're in.</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send team invite email:", err);
  }
}

export async function sendStaffInviteEmail(input: {
  to: string;
  fullName: string;
  loginEmail: string;
  loginPassword: string;
}) {
  const resend = getResendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping staff invite email.");
    return;
  }
  const loginUrl = `${siteUrl()}/login`;
  try {
    await resend.emails.send({
      from: FROM,
      to: input.to,
      subject: "You've been added to your school's staff on Shikshaloy",
      html: `
        <p>Hi ${input.fullName},</p>
        <p>An account has been created for you on Shikshaloy.</p>
        <p><strong>Login email:</strong> ${input.loginEmail}<br/>
        <strong>Temporary password:</strong> ${input.loginPassword}</p>
        <p><a href="${loginUrl}">Sign in to Shikshaloy</a> and change your password once you're in.</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send staff invite email:", err);
  }
}

export async function sendSupportRequestEmail(input: {
  institutionName: string;
  fromName: string;
  fromEmail: string;
  category: string;
  subject: string;
  message: string;
}) {
  const resend = getResendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping support request email.");
    return;
  }
  try {
    await resend.emails.send({
      from: FROM,
      to: "support@shikshaloy.com",
      replyTo: input.fromEmail,
      subject: `[${input.category}] ${input.subject} — ${input.institutionName}`,
      html: `
        <p><strong>Institution:</strong> ${input.institutionName}</p>
        <p><strong>From:</strong> ${input.fromName} (${input.fromEmail})</p>
        <p><strong>Category:</strong> ${input.category}</p>
        <p><strong>Subject:</strong> ${input.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${input.message.replace(/\n/g, "<br/>")}</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send support request email:", err);
  }
}

export async function sendOfflinePaymentSubmittedEmail(input: {
  institutionName: string;
  planName: string;
  amount: number;
  reference: string;
}) {
  const resend = getResendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping offline payment submitted email.");
    return;
  }
  try {
    await resend.emails.send({
      from: FROM,
      to: "billing@shikshaloy.com",
      subject: `Offline payment awaiting verification — ${input.institutionName}`,
      html: `
        <p><strong>Institution:</strong> ${input.institutionName}</p>
        <p><strong>Plan:</strong> ${input.planName}</p>
        <p><strong>Amount:</strong> ₹${input.amount.toLocaleString("en-IN")}</p>
        <p><strong>Reference:</strong> ${input.reference}</p>
        <p><a href="${siteUrl()}/dashboard/subscriptions">Review in the platform dashboard</a></p>
      `,
    });
  } catch (err) {
    console.error("Failed to send offline payment submitted email:", err);
  }
}

export async function sendOfflinePaymentDecisionEmail(input: {
  to: string;
  schoolName: string;
  planName: string;
  decision: "verified" | "rejected";
  reason?: string | null;
}) {
  const resend = getResendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping offline payment decision email.");
    return;
  }
  const verified = input.decision === "verified";
  try {
    await resend.emails.send({
      from: FROM,
      to: input.to,
      subject: verified
        ? `Your ${input.planName} payment is verified — ${input.schoolName}`
        : `Update on your ${input.planName} payment — ${input.schoolName}`,
      html: verified
        ? `
          <p>Your offline payment for <strong>${input.planName}</strong> has been verified and your subscription is now active.</p>
          <p><a href="${siteUrl()}/dashboard/billing">View your billing details</a></p>
        `
        : `
          <p>We reviewed your offline payment submission for <strong>${input.planName}</strong> and were unable to verify it.</p>
          ${input.reason ? `<p><strong>Reason:</strong> ${input.reason}</p>` : ""}
          <p>Please resubmit with a valid reference and receipt, or reach out to our support team.</p>
        `,
    });
  } catch (err) {
    console.error("Failed to send offline payment decision email:", err);
  }
}

export async function sendInstitutionDecisionEmail(input: {
  to: string;
  schoolName: string;
  decision: "active" | "rejected";
}) {
  const resend = getResendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping institution decision email.");
    return;
  }
  const loginUrl = `${siteUrl()}/login`;
  const approved = input.decision === "active";
  try {
    await resend.emails.send({
      from: FROM,
      to: input.to,
      subject: approved
        ? `${input.schoolName} is approved on Shikshaloy!`
        : `Update on your Shikshaloy application`,
      html: approved
        ? `
          <p>Good news — <strong>${input.schoolName}</strong> has been approved on Shikshaloy.</p>
          <p><a href="${loginUrl}">Sign in</a> to get started.</p>
        `
        : `
          <p>We reviewed your application for <strong>${input.schoolName}</strong> and are unable to approve it at this time.</p>
          <p>If you have questions, please reach out to our support team.</p>
        `,
    });
  } catch (err) {
    console.error("Failed to send institution decision email:", err);
  }
}
