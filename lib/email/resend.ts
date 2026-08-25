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

export async function sendContactLeadReplyEmail(input: {
  to: string;
  name: string;
  topic: string;
  originalMessage: string;
  reply: string;
}) {
  const resend = getResendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping contact lead reply email.");
    return;
  }
  try {
    await resend.emails.send({
      from: FROM,
      to: input.to,
      replyTo: "support@shikshaloy.com",
      subject: "Re: Your message to Shikshaloy",
      html: `
        <p>Hi ${input.name},</p>
        <p>${input.reply.replace(/\n/g, "<br/>")}</p>
        <p style="margin-top:24px;padding-left:12px;border-left:2px solid #e4e4e7;color:#71717a;">
          <strong>Your original message:</strong><br/>
          ${input.originalMessage.replace(/\n/g, "<br/>")}
        </p>
      `,
    });
  } catch (err) {
    console.error("Failed to send contact lead reply email:", err);
    throw err;
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

export async function sendSupportRequestReplyToTeamEmail(input: {
  institutionName: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  message: string;
}) {
  const resend = getResendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping support request reply email.");
    return;
  }
  try {
    await resend.emails.send({
      from: FROM,
      to: "support@shikshaloy.com",
      replyTo: input.fromEmail,
      subject: `Re: ${input.subject} — ${input.institutionName}`,
      html: `
        <p><strong>Institution:</strong> ${input.institutionName}</p>
        <p><strong>From:</strong> ${input.fromName} (${input.fromEmail})</p>
        <p><strong>New reply on:</strong> ${input.subject}</p>
        <p>${input.message.replace(/\n/g, "<br/>")}</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send support request reply email:", err);
  }
}

export async function sendSupportRequestReplyToUserEmail(input: {
  to: string;
  subject: string;
  message: string;
}) {
  const resend = getResendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping support request reply email.");
    return;
  }
  try {
    await resend.emails.send({
      from: FROM,
      to: input.to,
      subject: `Re: ${input.subject}`,
      html: `
        <p>You have a new reply on your support request &ldquo;${input.subject}&rdquo;:</p>
        <p>${input.message.replace(/\n/g, "<br/>")}</p>
        <p><a href="${siteUrl()}/dashboard/help">View and reply in Shikshaloy</a></p>
      `,
    });
  } catch (err) {
    console.error("Failed to send support request reply email:", err);
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

// Unlike the senders above, a failed send here must be surfaced to the
// caller (not swallowed) — this code is the only thing standing between a
// kernel click and a permanent institution delete, so the UI needs to know
// whether the OTP genuinely reached an inbox before it accepts an attempt.
export async function sendInstitutionDeleteOtpEmail(input: {
  to: string;
  institutionName: string;
  code: string;
}): Promise<void> {
  const resend = getResendClient();
  if (!resend) throw new Error("Email sending isn't configured (RESEND_API_KEY missing).");

  const { error } = await resend.emails.send({
    from: FROM,
    to: input.to,
    subject: `Confirm deletion of ${input.institutionName}`,
    html: `
      <p>A request was made to permanently delete <strong>${input.institutionName}</strong> and all of its schools, students, staff, and records.</p>
      <p>If this was you, enter this code to confirm:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${input.code}</p>
      <p>This code expires in 10 minutes. If you didn't request this, ignore this email — nothing will be deleted without the code.</p>
    `,
  });
  if (error) throw new Error(`Failed to send verification email: ${error.message}`);
}

export async function sendInstitutionDeletedEmail(input: {
  to: string[];
  institutionName: string;
  schoolNames: string[];
  deletedBy: string;
}) {
  const resend = getResendClient();
  if (!resend || input.to.length === 0) {
    console.warn("RESEND_API_KEY not set (or no recipients) — skipping institution-deleted notice.");
    return;
  }
  try {
    await resend.emails.send({
      from: FROM,
      to: input.to,
      subject: `${input.institutionName} was permanently deleted`,
      html: `
        <p><strong>${input.institutionName}</strong> and its school${input.schoolNames.length === 1 ? "" : "s"}
        (${input.schoolNames.join(", ") || "—"}) ${input.schoolNames.length === 1 ? "was" : "were"} permanently deleted by ${input.deletedBy}.</p>
        <p>Login accounts for staff, students, and parents were kept (in case they're active elsewhere) — only this institution's data was removed.</p>
        <p>This is an automated record — the action can't be undone.</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send institution-deleted notice:", err);
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

export async function sendInstitutionSubmittedEmail(input: {
  to: string;
  institutionName: string;
  isResubmission: boolean;
}) {
  const resend = getResendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping application-received email.");
    return;
  }
  try {
    await resend.emails.send({
      from: FROM,
      to: input.to,
      subject: input.isResubmission
        ? `We've received your resubmission for ${input.institutionName}`
        : `We've received your application for ${input.institutionName}`,
      html: `
        <p>Thanks — your ${input.isResubmission ? "resubmitted " : ""}application for <strong>${input.institutionName}</strong> is now under review.</p>
        <p>We'll email you as soon as a decision is made. No action is needed from you in the meantime.</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send application-received email:", err);
  }
}

export async function sendNewInstitutionSubmittedEmail(input: {
  to: string[];
  institutionId: string;
  institutionName: string;
  institutionType: string;
  city: string;
  state: string;
  ownerEmail: string;
  isResubmission: boolean;
}) {
  const resend = getResendClient();
  if (!resend || input.to.length === 0) {
    console.warn("RESEND_API_KEY not set (or no recipients) — skipping new-institution notice.");
    return;
  }
  try {
    await resend.emails.send({
      from: FROM,
      to: input.to,
      subject: input.isResubmission
        ? `${input.institutionName} resubmitted for review`
        : `New institution submitted — ${input.institutionName}`,
      html: `
        <p><strong>${input.institutionName}</strong> (${input.institutionType}, ${input.city}, ${input.state})
        ${input.isResubmission ? "was resubmitted" : "just applied"} and is awaiting review.</p>
        <p>Submitted by: ${input.ownerEmail}</p>
        <p><a href="${siteUrl()}/dashboard/institutions/${input.institutionId}">Review in the platform dashboard</a></p>
      `,
    });
  } catch (err) {
    console.error("Failed to send new-institution notice:", err);
  }
}
