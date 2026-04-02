import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface SRSReminderEmailProps {
  topics: Array<{
    topic: string;
    details?: string;
    reviewCount: number;
  }>;
  baseUrl?: string;
}

const DOMAIN = "streakly.online";
const LOGO_URL = `https://${DOMAIN}/apple-touch-icon.png`;

export const SRSReminderEmail = ({
  topics = [],
  baseUrl = `https://${DOMAIN}`,
}: SRSReminderEmailProps) => {
  const previewText = `${topics.length} revision${topics.length > 1 ? "s" : ""} for today! Track your progress on Streakly.`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo Header */}
          <Section style={logoSection}>
            <Img
              src={LOGO_URL}
              width="48"
              height="48"
              alt="Streakly"
              style={logo}
            />
            <Text style={logoText}>STREAKLY</Text>
          </Section>

          <Heading style={h1}>Time for Revision</Heading>
          <Text style={text}>
            Your brain is about to let go of these topics. A quick review now 
            will lock them into your long-term memory forever.
          </Text>

          <Section style={itemsContainer}>
            {topics.map((item, index) => (
              <Section key={index} style={itemCard}>
                <div style={badgeContainer}>
                   <Text style={badge}>Step {item.reviewCount + 1} of 4</Text>
                   <div style={milestonesContainer}>
                     {[1, 3, 7, 30].map((step, idx) => (
                       <div key={idx} style={{
                         ...dot,
                         backgroundColor: item.reviewCount > idx ? "#22c55e" : item.reviewCount === idx ? "#f59e0b" : "#e5e7eb"
                       }} />
                     ))}
                   </div>
                </div>
                <Heading style={h3}>{item.topic}</Heading>
                {item.details && <Text style={details}>{item.details}</Text>}
              </Section>
            ))}
          </Section>

          <Section style={btnSection}>
            <Button style={button} href={`${baseUrl}/srs`}>
              Open Your Dashboard
            </Button>
            <Text style={subText}>
              Reviewing takes less than 2 minutes. Consistency is everything.
            </Text>
          </Section>

          <Hr style={hr} />
          
          <Section style={footer}>
            <Text style={footerHeading}>STREAKLY SYSTEM</Text>
            <Text style={footerText}>
              This email was sent to you because you enabled Spaced Repetition 
              reminders to help with your learning journey.
            </Text>
            <div style={footerLinks}>
              <Link href={`${baseUrl}/profile`} style={footerLink}>Notification Settings</Link>
              <span style={footerDivider}> • </span>
              <Link href={`${baseUrl}/srs`} style={footerLink}>View Topics</Link>
            </div>
            <Text style={copyright}>
              © {new Date().getFullYear()} Streakly. Built for builders.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default SRSReminderEmail;

const main = {
  backgroundColor: "#FEFDF5",
  fontFamily:
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: "40px auto 120px",
  padding: "48px",
  backgroundColor: "#ffffff",
  borderRadius: "24px",
  maxWidth: "600px",
  border: "1px solid #d1d1d6",
};

const logoSection = {
  marginBottom: "48px",
  textAlign: "center" as const,
};

const logo = {
  margin: "0 auto",
  borderRadius: "8px",
};

const logoText = {
  fontSize: "13px",
  fontWeight: "800",
  letterSpacing: "0.2em",
  color: "#1c1c1e",
  marginTop: "16px",
  marginRight: "-0.2em",
};

const h1 = {
  color: "#1c1c1e",
  fontSize: "32px",
  fontWeight: "800",
  letterSpacing: "-0.04em",
  lineHeight: "1.2",
  margin: "0 0 16px",
  textAlign: "center" as const,
};

const text = {
  color: "#4b5563",
  fontSize: "17px",
  lineHeight: "26px",
  margin: "0 0 40px",
  textAlign: "center" as const,
};

const itemsContainer = {
  marginBottom: "40px",
};

const itemCard = {
  backgroundColor: "#F7F6F0",
  padding: "24px 32px",
  marginBottom: "12px",
  borderRadius: "16px",
  border: "1px solid #e5e7eb",
};

const badgeContainer = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "12px",
};

const badge = {
  color: "#1c1c1e",
  fontSize: "10px",
  fontWeight: "900",
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  margin: "0",
};

const milestonesContainer = {
  display: "flex",
  gap: "4px",
};

const dot = {
  height: "6px",
  width: "6px",
  borderRadius: "50%",
};

const h3 = {
  color: "#1c1c1e",
  fontSize: "20px",
  fontWeight: "800",
  margin: "0 0 6px",
};

const details = {
  color: "#8e8e93",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0",
};

const btnSection = {
  textAlign: "center" as const,
  marginTop: "48px",
};

const button = {
  backgroundColor: "#1c1c1e",
  borderRadius: "12px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "700",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "20px 40px",
};

const subText = {
  color: "#8e8e93",
  fontSize: "12px",
  marginTop: "20px",
  fontWeight: "500",
};

const hr = {
  borderColor: "#d1d1d6",
  margin: "48px 0 32px",
  opacity: "0.5",
};

const footer = {
  textAlign: "center" as const,
};

const footerHeading = {
  fontSize: "10px",
  fontWeight: "900",
  color: "#8e8e93",
  letterSpacing: "0.15em",
  marginBottom: "12px",
};

const footerText = {
  color: "#8e8e93",
  fontSize: "12px",
  lineHeight: "18px",
  marginBottom: "20px",
};

const footerLinks = {
  marginBottom: "20px",
};

const footerLink = {
  color: "#1c1c1e",
  fontSize: "12px",
  fontWeight: "700",
  textDecoration: "underline",
};

const footerDivider = {
  color: "#d1d1d6",
  margin: "0 8px",
};

const copyright = {
  color: "#d1d1d6",
  fontSize: "11px",
  fontWeight: "500",
};
