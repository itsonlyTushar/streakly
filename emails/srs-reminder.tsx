import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
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

export const SRSReminderEmail = ({
  topics = [],
  baseUrl = "https://streakly-tau.vercel.app",
}: SRSReminderEmailProps) => {
  const previewText = `${topics.length} revision${topics.length > 1 ? "s" : ""} for today! Track your progress on Streakly.`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Revision Time</Heading>
          <Text style={text}>
            Keep your knowledge sharp. Here are your topics due for review
            today:
          </Text>

          <Section style={itemsContainer}>
            {topics.map((item, index) => (
              <Section key={index} style={itemCard}>
                <Text style={badge}>STEP {item.reviewCount + 1} OF 4</Text>
                <Heading style={h3}>{item.topic}</Heading>
                {item.details && <Text style={details}>{item.details}</Text>}
              </Section>
            ))}
          </Section>

          <Section style={btnSection}>
            <Button style={button} href={`${baseUrl}/srs`}>
              Open Dashboard
            </Button>
          </Section>

          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              Built for builders. Honesty above all.
            </Text>
            <Link href={baseUrl} style={footerLink}>
              streakly-tau.vercel.app
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default SRSReminderEmail;

const main = {
  backgroundColor: "#f9fafb",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  paddingTop: "40px",
  paddingBottom: "40px",
};

const container = {
  margin: "0 auto",
  padding: "48px 32px",
  backgroundColor: "#ffffff",
  borderRadius: "24px",
  border: "1px solid #e5e7eb",
  maxWidth: "600px",
};

const h1 = {
  color: "#111827",
  fontSize: "32px",
  fontWeight: "800",
  letterSpacing: "-0.05em",
  lineHeight: "1.1",
  margin: "0 0 12px",
  textAlign: "left" as const,
};

const h3 = {
  color: "#111827",
  fontSize: "20px",
  fontWeight: "700",
  margin: "0 0 8px",
};

const text = {
  color: "#4b5563",
  fontSize: "18px",
  lineHeight: "24px",
  margin: "0 0 32px",
};

const itemsContainer = {
  marginBottom: "40px",
};

const itemCard = {
  backgroundColor: "#ffffff",
  padding: "24px",
  marginBottom: "16px",
  borderRadius: "16px",
  border: "1px solid #f3f4f6",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
};

const badge = {
  color: "#3b82f6",
  textTransform: "uppercase" as const,
  fontSize: "10px",
  fontWeight: "800",
  letterSpacing: "0.15em",
  margin: "0 0 4px",
};

const details = {
  color: "#6b7280",
  fontSize: "15px",
  lineHeight: "1.5",
  margin: "8px 0 0",
};

const btnSection = {
  textAlign: "center" as const,
  marginTop: "40px",
};

const button = {
  backgroundColor: "#000000",
  borderRadius: "14px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "700",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "20px 40px",
};

const hr = {
  borderColor: "#f3f4f6",
  margin: "48px 0 24px",
};

const footer = {
  textAlign: "center" as const,
};

const footerText = {
  color: "#9ca3af",
  fontSize: "12px",
  fontWeight: "500",
  margin: "0 0 8px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.1em",
};

const footerLink = {
  color: "#3b82f6",
  fontSize: "12px",
  textDecoration: "none",
};
