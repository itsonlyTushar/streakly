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
  Font,
} from "@react-email/components";

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
  const INTERVALS = [1, 3, 7, 30];

  return (
    <Html>
      <Head>
        <Font
          fontFamily="Outfit"
          fallbackFontFamily="Verdana"
          webFont={{
            url: "https://fonts.gstatic.com/s/outfit/v11/Q_N07pPkpY_9Q8LwD8H_O00D.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="Outfit"
          fallbackFontFamily="Verdana"
          webFont={{
            url: "https://fonts.gstatic.com/s/outfit/v11/Q_N07pPkpY_9Q8LwD8H_Oh7D.woff2",
            format: "woff2",
          }}
          fontWeight={900}
          fontStyle="normal"
        />
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo Header */}
          <Section style={logoSection}>
            <Img
              src={LOGO_URL}
              width="40"
              height="40"
              alt="Streakly"
              style={logo}
            />
            <Text style={logoText}>STREAKLY</Text>
          </Section>

          <Text style={badgeHeader}>ACTIVE LEARNING</Text>
          <Heading style={h1}>Time for Revision</Heading>
          <Text style={text}>
            Your brain is about to let go of these topics. A quick review now
            will lock them into your long-term memory.
          </Text>

          <Section style={itemsContainer}>
            {topics.map((item, index) => (
              <Section key={index} style={itemCard}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td style={{ verticalAlign: "top" }}>
                      <Text style={itemSubHeader}>TOPIC</Text>
                      <Heading style={h3}>{item.topic}</Heading>
                      {item.details && (
                        <Text style={details}>{item.details}</Text>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ paddingTop: "20px" }}>
                      <Text style={itemSubHeader}>LEARNING PATH</Text>
                      <div style={milestonesContainer}>
                        {INTERVALS.map((day, idx) => {
                          const isDone = item.reviewCount > idx;
                          const isCurrent = item.reviewCount === idx;

                          return (
                            <div
                              key={idx}
                              style={{
                                display: "inline-block",
                                textAlign: "center",
                                marginRight: "16px",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "9px",
                                  fontWeight: "900",
                                  marginBottom: "4px",
                                  color: isCurrent
                                    ? "#f59e0b"
                                    : isDone
                                      ? "#1c1c1e"
                                      : "#8e8e93",
                                }}
                              >
                                {day}
                                {day === 1 ? "ST" : day === 3 ? "RD" : "TH"}
                              </div>
                              <div
                                style={{
                                  ...dot,
                                  backgroundColor: isDone
                                    ? "#1c1c1e"
                                    : isCurrent
                                      ? "#f59e0b"
                                      : "#e5e7eb",
                                  border: isCurrent
                                    ? "2px solid #f59e0b"
                                    : "none",
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                </table>
              </Section>
            ))}
          </Section>

          <Section style={btnSection}>
            <Button style={button} href={`${baseUrl}/srs`}>
              OPEN YOUR DASHBOARD
            </Button>
            <Text style={subText}>
              Reviewing takes less than 2 minutes. Consistency is everything.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerHeading}>STREAKLY SYSTEM</Text>
            <Text style={footerText}>
              This email was sent because you enabled Spaced Repetition
              reminders for your learning journey.
            </Text>
            <div style={footerLinks}>
              <Link href={`${baseUrl}/profile`} style={footerLink}>
                Notification Settings
              </Link>
              <span style={footerDivider}> • </span>
              <Link href={`${baseUrl}/srs`} style={footerLink}>
                View Topics
              </Link>
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
    'Outfit, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: "40px auto",
  padding: "40px",
  backgroundColor: "#ffffff",
  borderRadius: "32px",
  maxWidth: "580px",
  border: "1px solid #d1d1d6",
};

const logoSection = {
  marginBottom: "40px",
  textAlign: "center" as const,
};

const logo = {
  margin: "0 auto",
  borderRadius: "10px",
};

const logoText = {
  fontSize: "12px",
  fontWeight: "900",
  letterSpacing: "0.25em",
  color: "#1c1c1e",
  marginTop: "12px",
  marginRight: "-0.25em",
};

const badgeHeader = {
  fontSize: "10px",
  fontWeight: "900",
  letterSpacing: "0.2em",
  color: "#1c1c1e",
  textAlign: "center" as const,
  margin: "0 0 8px",
};

const h1 = {
  color: "#1c1c1e",
  fontSize: "36px",
  fontWeight: "900",
  letterSpacing: "-0.05em",
  lineHeight: "1.1",
  margin: "0 0 16px",
  textAlign: "center" as const,
};

const text = {
  color: "#4b5563",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 40px",
  textAlign: "center" as const,
};

const itemsContainer = {
  marginBottom: "32px",
};

const itemCard = {
  backgroundColor: "#ffffff",
  padding: "24px",
  marginBottom: "16px",
  borderRadius: "20px",
  border: "1px solid #d1d1d6",
};

const itemSubHeader = {
  fontSize: "9px",
  fontWeight: "900",
  letterSpacing: "0.15em",
  color: "#8e8e93",
  margin: "0 0 8px",
  textTransform: "uppercase" as const,
};

const milestonesContainer = {
  display: "flex",
  alignItems: "center",
};

const dot = {
  height: "12px",
  width: "12px",
  borderRadius: "50%",
};

const h3 = {
  color: "#1c1c1e",
  fontSize: "20px",
  fontWeight: "800",
  letterSpacing: "-0.02em",
  margin: "0 0 4px",
};

const details = {
  color: "#8e8e93",
  fontSize: "14px",
  lineHeight: "1.4",
  margin: "0",
};

const btnSection = {
  textAlign: "center" as const,
  marginTop: "40px",
};

const button = {
  backgroundColor: "#1c1c1e",
  borderRadius: "16px",
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: "900",
  letterSpacing: "0.15em",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "20px 40px",
};

const subText = {
  color: "#8e8e93",
  fontSize: "12px",
  marginTop: "20px",
  fontWeight: "600",
};

const hr = {
  borderColor: "#d1d1d6",
  margin: "40px 0 32px",
  opacity: "0.4",
};

const footer = {
  textAlign: "center" as const,
};

const footerHeading = {
  fontSize: "9px",
  fontWeight: "900",
  color: "#8e8e93",
  letterSpacing: "0.2em",
  marginBottom: "12px",
};

const footerText = {
  color: "#8e8e93",
  fontSize: "11px",
  lineHeight: "16px",
  marginBottom: "20px",
};

const footerLinks = {
  marginBottom: "20px",
};

const footerLink = {
  color: "#1c1c1e",
  fontSize: "11px",
  fontWeight: "800",
  textDecoration: "underline",
};

const footerDivider = {
  color: "#d1d1d6",
  margin: "0 8px",
};

const copyright = {
  color: "#d1d1d6",
  fontSize: "10px",
  fontWeight: "600",
};
