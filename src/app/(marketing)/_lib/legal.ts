// Verbatim ChadWallet legal copy, transcribed from the live site
// (chadwallet.xyz/privacy + /terms, pulled 2026-06-22 with a browser UA — the
// site 403s plain fetchers) and cross-checked against chadwallet.gitbook.io.
// The live pages obfuscate the contact email behind an anti-scraper placeholder;
// the GitBook source shows the real address: hello@chadwallet.xyz.
//
// Text is the company's own — we only restructure it into typed blocks so the
// page can render numbered sections, sub-sections, and lists consistently.

export const LEGAL_CONTACT_EMAIL = "hello@chadwallet.xyz";

// A block is one renderable unit inside a section.
export type LegalBlock =
  | { kind: "p"; text: string }
  | { kind: "sub"; text: string } // sub-heading (e.g. "5.1 Personal Data")
  | { kind: "list"; items: string[] }
  // term: definition rows ("Identity Data: ..."); rendered with the lead bolded
  | { kind: "terms"; items: { term: string; def: string }[] };

export type LegalSection = {
  id: string; // slug for the in-page anchor / TOC
  num: string; // "1", "Appendix A", …
  title: string;
  blocks: LegalBlock[];
};

export type LegalDoc = {
  title: string;
  // The live site renders "Effective Date" with no concrete date filled in.
  effective: string;
  intro: string; // short plain-language "the gist" line we author (clearly labelled)
  sections: LegalSection[];
};

// ── Privacy Policy ──────────────────────────────────────────────────────────
export const PRIVACY: LegalDoc = {
  title: "Privacy Policy",
  effective: "Effective Date: at posting",
  intro:
    "In short: ChadWallet collects the data needed to run the app and keep it secure, never knowingly collects data from anyone under 16, and gives you rights over your information. The full policy below is the binding version.",
  sections: [
    {
      id: "introduction",
      num: "1",
      title: "Introduction",
      blocks: [
        {
          kind: "p",
          text: "ChadWallet (“Company,” “we,” “us,” or “our”) respects your privacy and is committed to protecting your personal data. This Privacy Policy (“Policy”) explains how we collect, use, disclose, and safeguard your information when you use our Telegram-based cryptocurrency trading bot and related services, including our website located at chadwallet.xyz (collectively, the “Services”). It also informs you about your privacy rights and how the law protects you. This Policy is part of our Terms and Conditions, and by accessing or using our Services, you agree to both this Policy and the Terms and Conditions. If you do not agree with the terms of this Policy, please do not use our Services.",
        },
      ],
    },
    {
      id: "data-controller",
      num: "2",
      title: "Data Controller Contact Information",
      blocks: [
        {
          kind: "p",
          text: "For the purposes of the General Data Protection Regulation (“GDPR”) and other applicable data protection laws, the data controller is:",
        },
        { kind: "p", text: "ChadWallet" },
        { kind: "p", text: `Email: ${LEGAL_CONTACT_EMAIL}` },
      ],
    },
    {
      id: "scope",
      num: "3",
      title: "Scope of This Policy",
      blocks: [
        { kind: "p", text: "This Policy applies to information we collect:" },
        {
          kind: "list",
          items: [
            "Through our Services.",
            "In email, text, and other electronic communications between you and the Services.",
            "Through mobile and desktop applications you download from the Services.",
            "When you interact with our advertising and applications on third-party websites and services.",
          ],
        },
        { kind: "p", text: "This Policy does not apply to information collected by:" },
        {
          kind: "list",
          items: [
            "Us offline or through any other means not specified above.",
            "Any third party, including through any application or content that may link to or be accessible from the Services.",
          ],
        },
      ],
    },
    {
      id: "children",
      num: "4",
      title: "Children Under the Age of 16",
      blocks: [
        {
          kind: "p",
          text: `Our Services are not intended for children under 16 years of age. We do not knowingly collect personal data from children under 16. If you are under 16, do not use or provide any information on our Services. If we learn we have collected or received personal data from a child under 16 without verification of parental consent, we will delete that information. If you believe we might have any information from or about a child under 16, please contact us at ${LEGAL_CONTACT_EMAIL}.`,
        },
      ],
    },
    {
      id: "information-we-collect",
      num: "5",
      title: "Information We Collect About You",
      blocks: [
        { kind: "sub", text: "5.1 Personal Data" },
        {
          kind: "p",
          text: "We may collect, use, store, and transfer different kinds of personal data about you, including:",
        },
        {
          kind: "terms",
          items: [
            { term: "Identity Data", def: "Username, real name, or other identifiers." },
            { term: "Contact Data", def: "Email address, telephone numbers." },
            {
              term: "Technical Data",
              def: "Internet Protocol (IP) address, login data, browser type and version, time zone setting, browser plug-in types, operating system, and platform.",
            },
            { term: "Usage Data", def: "Information about how you use our Services." },
            {
              term: "Transaction Data",
              def: "Details of cryptocurrency transactions you carry out through the Services.",
            },
            {
              term: "Wallet Information",
              def: "Cryptocurrency wallet addresses, keys, and transaction history.",
            },
          ],
        },
        { kind: "sub", text: "5.2 Aggregated Data" },
        {
          kind: "p",
          text: "We also collect, use, and share Aggregated Data such as statistical or demographic data. Aggregated Data may be derived from your personal data but is not considered personal data under the law as it does not directly or indirectly reveal your identity.",
        },
        { kind: "sub", text: "5.3 Special Categories of Personal Data" },
        {
          kind: "p",
          text: "We do not collect any Special Categories of Personal Data about you (e.g., details about your race, religion, sexual orientation, health, or biometric data).",
        },
      ],
    },
    {
      id: "how-we-collect",
      num: "6",
      title: "How We Collect Your Personal Data",
      blocks: [
        { kind: "sub", text: "6.1 Direct Interactions" },
        { kind: "p", text: "You may give us your Identity and Contact Data by:" },
        {
          kind: "list",
          items: [
            "Filling in forms on our Services.",
            "Corresponding with us by email or otherwise.",
            "Registering for an account (if applicable).",
            "Participating in surveys or promotions.",
          ],
        },
        { kind: "sub", text: "6.2 Automated Technologies" },
        {
          kind: "p",
          text: "As you interact with our Services, we may automatically collect Technical Data and Usage Data about your equipment, browsing actions, and patterns. We collect this personal data by using cookies, server logs, and other similar technologies.",
        },
        { kind: "sub", text: "6.3 Third Parties or Public Sources" },
        { kind: "p", text: "We may receive personal data about you from various third parties:" },
        {
          kind: "list",
          items: [
            "Technical Data from analytics providers.",
            "Contact and Transaction Data from providers of technical, payment, and delivery services.",
            "Identity and Contact Data from publicly available sources.",
          ],
        },
      ],
    },
    {
      id: "cookies",
      num: "7",
      title: "Cookies and Similar Technologies",
      blocks: [
        {
          kind: "p",
          text: "We use cookies to distinguish you from other users of our Services and to improve your experience. You can set your browser to refuse all or some browser cookies or to alert you when websites set or access cookies.",
        },
      ],
    },
    {
      id: "how-we-use",
      num: "8",
      title: "How We Use Your Personal Data",
      blocks: [
        { kind: "p", text: "We use your personal data for the following purposes:" },
        {
          kind: "terms",
          items: [
            {
              term: "To Provide Services",
              def: "Facilitate your use of the Services, including processing transactions and providing customer support.",
            },
            {
              term: "Account Management",
              def: "Manage your account, including verifying your identity and maintaining your profile.",
            },
            {
              term: "Improve Services",
              def: "Analyze how you use our Services to improve functionality and user experience.",
            },
            {
              term: "Marketing",
              def: "Provide you with information about goods and services that may interest you.",
            },
            {
              term: "Legal Obligations",
              def: "Comply with legal and regulatory obligations, such as anti-money laundering and fraud prevention.",
            },
            {
              term: "Security",
              def: "Ensure the security of our Services and prevent fraudulent activities.",
            },
          ],
        },
      ],
    },
    {
      id: "disclosure",
      num: "9",
      title: "Disclosure of Your Personal Data",
      blocks: [
        { kind: "p", text: "We may share your personal data with:" },
        {
          kind: "terms",
          items: [
            {
              term: "Service Providers",
              def: "Third parties who provide services on our behalf, such as payment processing, data analysis, and marketing assistance.",
            },
            { term: "Affiliates", def: "Our subsidiaries and affiliates for business purposes." },
            {
              term: "Legal and Regulatory Authorities",
              def: "When required by law or necessary to comply with legal processes.",
            },
            {
              term: "Business Transfers",
              def: "In connection with a merger, sale, or reorganization of all or part of our business.",
            },
          ],
        },
      ],
    },
    {
      id: "international-transfers",
      num: "10",
      title: "International Data Transfers",
      blocks: [
        {
          kind: "p",
          text: "Your personal data may be transferred to and processed in countries outside the European Economic Area (“EEA”). We ensure that appropriate safeguards are in place to protect your personal data in accordance with this Policy and applicable laws.",
        },
      ],
    },
    {
      id: "data-security",
      num: "11",
      title: "Data Security",
      blocks: [
        {
          kind: "p",
          text: "We have implemented appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way. These measures include encryption and access controls. However, no security measures are entirely secure.",
        },
      ],
    },
    {
      id: "data-retention",
      num: "12",
      title: "Data Retention",
      blocks: [
        {
          kind: "p",
          text: "We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, including satisfying any legal, accounting, or reporting requirements.",
        },
      ],
    },
    {
      id: "your-rights",
      num: "13",
      title: "Your Legal Rights",
      blocks: [
        {
          kind: "p",
          text: "Under certain circumstances, you have rights under data protection laws in relation to your personal data, including:",
        },
        {
          kind: "terms",
          items: [
            { term: "Access", def: "Request access to your personal data." },
            {
              term: "Correction",
              def: "Request correction of inaccurate or incomplete personal data.",
            },
            { term: "Erasure", def: "Request deletion of your personal data." },
            { term: "Restriction", def: "Request restriction of processing your personal data." },
            { term: "Objection", def: "Object to processing of your personal data." },
            {
              term: "Data Portability",
              def: "Request transfer of your personal data to you or a third party.",
            },
            {
              term: "Withdraw Consent",
              def: "Withdraw consent where we are relying on consent to process your personal data.",
            },
          ],
        },
      ],
    },
    {
      id: "automated-decisions",
      num: "14",
      title: "Automated Decision-Making",
      blocks: [
        {
          kind: "p",
          text: "We do not use your personal data for automated decision-making processes that have legal or similarly significant effects on you.",
        },
      ],
    },
    {
      id: "third-party-links",
      num: "15",
      title: "Third-Party Links",
      blocks: [
        {
          kind: "p",
          text: "Our Services may include links to third-party websites, plug-ins, and applications. Clicking on those links may allow third parties to collect or share data about you. We do not control these third-party websites and are not responsible for their privacy policies.",
        },
      ],
    },
    {
      id: "do-not-track",
      num: "16",
      title: "Do Not Track Signals",
      blocks: [
        {
          kind: "p",
          text: "Our Services do not respond to Do Not Track (“DNT”) signals. DNT is a preference you can set in your browser to inform websites that you do not want to be tracked.",
        },
      ],
    },
    {
      id: "changes",
      num: "17",
      title: "Changes to This Privacy Policy",
      blocks: [
        {
          kind: "p",
          text: "We may update this Policy from time to time. We will notify you of any significant changes by posting the new Policy on this page and updating the “Effective Date” at the top. Your continued use of the Services after any changes indicates your acceptance of the updated Policy.",
        },
      ],
    },
    {
      id: "contact",
      num: "18",
      title: "Contact Information",
      blocks: [
        {
          kind: "p",
          text: "If you have any questions or concerns about this Policy or our privacy practices, please contact us:",
        },
        { kind: "p", text: `Email: ${LEGAL_CONTACT_EMAIL}` },
      ],
    },
    {
      id: "definitions",
      num: "19",
      title: "Definitions",
      blocks: [
        {
          kind: "terms",
          items: [
            {
              term: "Personal Data",
              def: "Any information relating to an identified or identifiable natural person.",
            },
            {
              term: "Processing",
              def: "Any operation performed on personal data, such as collection, storage, use, disclosure, etc.",
            },
            {
              term: "Controller",
              def: "The entity that determines the purposes and means of processing personal data.",
            },
            {
              term: "Processor",
              def: "The entity that processes personal data on behalf of the controller.",
            },
          ],
        },
      ],
    },
    {
      id: "your-responsibility",
      num: "20",
      title: "Your Responsibility",
      blocks: [
        {
          kind: "p",
          text: "You are responsible for ensuring that any personal data you provide to us is accurate and up to date.",
        },
      ],
    },
    {
      id: "language",
      num: "21",
      title: "Language",
      blocks: [
        {
          kind: "p",
          text: "This Policy is drawn up in English. If it is translated into any other language, the English version shall prevail in the event of any inconsistencies.",
        },
      ],
    },
  ],
};

// ── Terms of Service ─────────────────────────────────────────────────────────
export const TERMS: LegalDoc = {
  title: "Terms of Service",
  effective: "Effective immediately upon posting",
  intro:
    "In short: you must be 18+, outside the restricted jurisdictions, and responsible for your own keys and trades. ChadWallet routes to third-party services, gives no financial advice, and disclaims liability for market losses. The full terms below are the binding version.",
  sections: [
    {
      id: "introduction",
      num: "1",
      title: "Introduction",
      blocks: [
        {
          kind: "p",
          text: "Welcome to ChadWallet (“Company,” “we,” “us,” or “our”). These Terms and Conditions (“Terms”) govern your access to and use of our Telegram-based cryptocurrency trading bot and related services, including our website located at chadwallet.xyz (collectively, the “Services”). By accessing or using our Services, you agree to be bound by these Terms. If you do not agree with any part of these Terms, you must not access or use our Services.",
        },
      ],
    },
    {
      id: "eligibility",
      num: "2",
      title: "Eligibility and Acceptance",
      blocks: [
        { kind: "p", text: "By using our Services, you represent and warrant that:" },
        {
          kind: "list",
          items: [
            "You are at least 18 years old or of legal age to form a binding contract in your jurisdiction.",
            "You have full legal capacity and authority to enter into these Terms.",
            "Your use of the Services does not violate any applicable laws, regulations, or agreements.",
            "You are not a resident or located in any Restricted Jurisdiction (as defined below).",
          ],
        },
      ],
    },
    {
      id: "restricted-jurisdictions",
      num: "3",
      title: "Restricted Jurisdictions",
      blocks: [
        { kind: "sub", text: "3.1 Prohibited Jurisdictions" },
        {
          kind: "p",
          text: "Our Services are not intended for use by individuals or entities who are located in, incorporated in, or have a registered office in any jurisdiction where the use of our Services would be illegal or otherwise violate any applicable law or regulation. This includes, but is not limited to, the following countries and regions: United Kingdom, Algeria, Belarus, Bolivia, Cuba, Crimea Region, Democratic Republic of Congo, Iran, Iraq, Ivory Coast, Liberia, Libya, North Korea, Somalia, Sudan, Syria, Venezuela, Yemen, Zimbabwe.",
        },
        { kind: "sub", text: "3.2 Representation and Warranties" },
        { kind: "p", text: "By accessing or using our Services, you represent and warrant that:" },
        {
          kind: "list",
          items: [
            "You are not a resident or located in any Restricted Jurisdiction.",
            "You are not a person or entity subject to any sanctions or restrictions imposed by the European Union, United Nations, or any other applicable governmental authority.",
            "You will not use any technology (e.g., VPN) to circumvent the restrictions set forth herein.",
          ],
        },
        { kind: "sub", text: "3.3 Prohibition on Restricted Persons" },
        { kind: "p", text: "You agree not to:" },
        {
          kind: "list",
          items: [
            "Use the Services if you are a Restricted Person.",
            "Make the Services available to any Restricted Person.",
            "Modify, disassemble, decompile, reverse engineer, or create derivative works of the Services to make them available to any Restricted Person.",
          ],
        },
      ],
    },
    {
      id: "account-registration",
      num: "4",
      title: "Account Registration",
      blocks: [
        { kind: "sub", text: "4.1 Account Creation" },
        {
          kind: "p",
          text: "To access certain features of the Services, you may need to create an account (“Account”). You agree to:",
        },
        {
          kind: "list",
          items: [
            "Provide accurate, current, and complete information during the registration process.",
            "Update your information promptly to keep it accurate and complete.",
            "Maintain the security and confidentiality of your Account credentials.",
            "Accept responsibility for all activities that occur under your Account.",
          ],
        },
        { kind: "sub", text: "4.2 Account Security" },
        {
          kind: "p",
          text: "You are solely responsible for safeguarding your Account credentials, including private keys, seed phrases, and any other authentication information. We are not liable for any loss or damage arising from your failure to protect your credentials.",
        },
        { kind: "sub", text: "4.3 Unauthorized Access" },
        {
          kind: "p",
          text: `You agree to notify us immediately at ${LEGAL_CONTACT_EMAIL} if you suspect any unauthorized access to or use of your Account.`,
        },
      ],
    },
    {
      id: "use-of-services",
      num: "5",
      title: "Use of the Services",
      blocks: [
        { kind: "sub", text: "5.1 Third-Party Services" },
        {
          kind: "p",
          text: "Our Services may allow you to interact with third-party decentralized exchanges (“DEXs”), protocols, and other blockchain technologies (“Third-Party Services”). You acknowledge that:",
        },
        {
          kind: "list",
          items: [
            "We do not control or operate any Third-Party Services accessible through the Services.",
            "All transactions are executed by Third-Party Services not controlled by us.",
            "We are not responsible for any issues, losses, or damages arising from your use of Third-Party Services.",
          ],
        },
        { kind: "sub", text: "5.2 No Control Over Transactions" },
        {
          kind: "p",
          text: "We do not have control over the transactions executed via Third-Party Services. You acknowledge and agree that:",
        },
        {
          kind: "list",
          items: [
            "Transactions are irreversible once initiated.",
            "We do not guarantee the identity of any user, receiver, or other party in any transaction.",
            "You are solely responsible for verifying the accuracy and legality of your transactions.",
          ],
        },
        { kind: "sub", text: "5.3 Compliance with Third-Party Terms" },
        {
          kind: "p",
          text: "Your use of Third-Party Services is subject to their respective terms and conditions. You are responsible for reviewing and complying with those terms.",
        },
      ],
    },
    {
      id: "fees",
      num: "6",
      title: "Fees and Payments",
      blocks: [
        { kind: "sub", text: "6.1 Service Fees" },
        {
          kind: "p",
          text: "We may charge fees for certain transactions or services provided through the Services (“Service Fees”). Any applicable Service Fees will be disclosed to you before you complete a transaction.",
        },
        { kind: "sub", text: "6.2 Third-Party Fees" },
        {
          kind: "p",
          text: "You acknowledge that Third-Party Services may charge additional fees (e.g., network transaction fees, gas fees). You are solely responsible for paying all such fees.",
        },
        { kind: "sub", text: "6.3 Changes to Fees" },
        {
          kind: "p",
          text: "All fees are subject to change at our discretion. We will make reasonable efforts to notify you of any changes in fees.",
        },
      ],
    },
    {
      id: "referral",
      num: "7",
      title: "Referral Program",
      blocks: [
        { kind: "sub", text: "7.1 Program Participation" },
        {
          kind: "p",
          text: "We may offer referral programs that allow you to earn rewards by referring new users to the Services (“Referral Program”). Participation is subject to:",
        },
        {
          kind: "list",
          items: [
            "Compliance with additional terms provided separately.",
            "Our right to modify or cancel the Referral Program at any time without notice.",
          ],
        },
        { kind: "sub", text: "7.2 No Liability" },
        {
          kind: "p",
          text: "We are not liable for any issues arising from the Referral Program, including but not limited to:",
        },
        {
          kind: "list",
          items: [
            "Technical malfunctions.",
            "Inaccuracies in tracking referrals.",
            "Changes or discontinuation of the Referral Program.",
          ],
        },
      ],
    },
    {
      id: "intellectual-property",
      num: "8",
      title: "Intellectual Property Rights",
      blocks: [
        { kind: "sub", text: "8.1 Ownership" },
        {
          kind: "p",
          text: "All content, materials, and services provided through the Services—including text, graphics, logos, software, and trademarks—are the property of ChadWallet or its licensors and are protected by intellectual property laws.",
        },
        { kind: "sub", text: "8.2 Limited License" },
        {
          kind: "p",
          text: "We grant you a limited, non-exclusive, non-transferable license to access and use the Services for your personal use, subject to these Terms.",
        },
        { kind: "sub", text: "8.3 Restrictions" },
        { kind: "p", text: "You agree not to:" },
        {
          kind: "list",
          items: [
            "Reproduce, distribute, modify, or create derivative works of the Services without our prior written consent.",
            "Use any of our trademarks without our prior written permission.",
            "Reverse engineer, decompile, or disassemble any part of the Services.",
          ],
        },
      ],
    },
    {
      id: "feedback",
      num: "9",
      title: "Feedback",
      blocks: [
        {
          kind: "p",
          text: "By submitting feedback, comments, or suggestions (“Feedback”) to us, you grant us a non-exclusive, worldwide, perpetual, irrevocable, royalty-free license to use, reproduce, modify, and distribute such Feedback for any purpose, without compensation to you.",
        },
      ],
    },
    {
      id: "prohibited-uses",
      num: "10",
      title: "Prohibited Uses",
      blocks: [
        { kind: "sub", text: "10.1 Compliance with Laws" },
        {
          kind: "p",
          text: "You agree not to use the Services in any way that violates any applicable federal, state, local, or international laws or regulations.",
        },
        { kind: "sub", text: "10.2 Prohibited Activities" },
        { kind: "p", text: "You agree not to:" },
        {
          kind: "list",
          items: [
            "Engage in fraudulent, deceptive, or manipulative activities.",
            "Introduce viruses, trojan horses, worms, or other malicious code.",
            "Gain unauthorized access to our systems or data.",
            "Use automated means (e.g., bots, spiders) to access the Services without authorization.",
            "Participate in market manipulation or any form of illegal trading activities.",
            "Use the Services to promote or engage in terrorist financing or money laundering.",
            "Use the Services in or from any Restricted Jurisdiction.",
            "Assist any Restricted Person or entity in accessing the Services.",
          ],
        },
      ],
    },
    {
      id: "security-risks",
      num: "11",
      title: "Security Risks and Disclaimers",
      blocks: [
        { kind: "sub", text: "11.1 No Guarantee of Security" },
        {
          kind: "p",
          text: "We do not guarantee the security of the Services or your digital assets. You acknowledge and accept the risks associated with transmitting information over the internet.",
        },
        { kind: "sub", text: "11.2 Transmission of Keys" },
        {
          kind: "p",
          text: "You acknowledge that private keys and seed phrases may be transmitted unencrypted over the internet, and you accept the associated risks.",
        },
        { kind: "sub", text: "11.3 Release of Liability" },
        {
          kind: "p",
          text: "You hereby release and hold harmless ChadWallet and its affiliates from any losses or damages arising from:",
        },
        {
          kind: "list",
          items: [
            "Unauthorized access to your Account.",
            "Loss or theft of your private keys or seed phrases.",
            "Security breaches or vulnerabilities in the Services.",
          ],
        },
      ],
    },
    {
      id: "third-party-content",
      num: "12",
      title: "Third-Party Services and Content",
      blocks: [
        {
          kind: "p",
          text: "We do not endorse or assume responsibility for any Third-Party Services or content accessible through the Services.",
        },
      ],
    },
    {
      id: "no-financial-advice",
      num: "13",
      title: "No Financial or Investment Advice",
      blocks: [
        { kind: "sub", text: "13.1 Informational Purposes Only" },
        {
          kind: "p",
          text: "All information provided through the Services is for informational purposes only and should not be construed as financial, investment, or legal advice.",
        },
        { kind: "sub", text: "13.2 No Fiduciary Relationship" },
        {
          kind: "p",
          text: "Your use of the Services does not create any fiduciary or advisory relationship between you and ChadWallet.",
        },
        { kind: "sub", text: "13.3 Professional Advice" },
        {
          kind: "p",
          text: "You should consult qualified professionals before making any investment decisions.",
        },
      ],
    },
    {
      id: "trading-risks",
      num: "14",
      title: "Risks Associated with Cryptocurrency Trading",
      blocks: [
        { kind: "sub", text: "14.1 Market Volatility" },
        { kind: "p", text: "You acknowledge that:" },
        {
          kind: "list",
          items: [
            "Cryptocurrency markets are highly volatile.",
            "Prices can fluctuate significantly in a short period.",
            "Trading involves a significant risk of loss.",
          ],
        },
        { kind: "sub", text: "14.2 Sole Responsibility" },
        {
          kind: "p",
          text: "You are solely responsible for your trading decisions and assume all risks associated with cryptocurrency trading.",
        },
        { kind: "sub", text: "14.3 No Liability for Losses" },
        {
          kind: "p",
          text: "We are not liable for any losses incurred due to market fluctuations, trading activities, or your use of the Services.",
        },
      ],
    },
    {
      id: "taxes",
      num: "15",
      title: "Taxes",
      blocks: [
        { kind: "sub", text: "15.1 Tax Obligations" },
        { kind: "p", text: "You are responsible for:" },
        {
          kind: "list",
          items: [
            "Determining your tax obligations related to your use of the Services.",
            "Reporting and paying any applicable taxes to the appropriate tax authorities.",
          ],
        },
        { kind: "sub", text: "15.2 No Tax Advice" },
        {
          kind: "p",
          text: "We do not provide tax advice and are not responsible for determining whether taxes apply to your transactions.",
        },
      ],
    },
    {
      id: "privacy-policy",
      num: "16",
      title: "Privacy Policy",
      blocks: [
        {
          kind: "p",
          text: "Your use of the Services is also subject to our Privacy Policy, which is available at chadwallet.gitbook.io. By using the Services, you consent to the practices described in the Privacy Policy.",
        },
      ],
    },
    {
      id: "disclaimer-warranties",
      num: "17",
      title: "Disclaimer of Warranties",
      blocks: [
        { kind: "sub", text: "17.1 “AS IS” and “AS AVAILABLE”" },
        {
          kind: "p",
          text: "The Services are provided on an “AS IS” and “AS AVAILABLE” basis, without warranties of any kind, express or implied.",
        },
        { kind: "sub", text: "17.2 Disclaimed Warranties" },
        {
          kind: "p",
          text: "We expressly disclaim all warranties, including but not limited to:",
        },
        {
          kind: "list",
          items: [
            "Merchantability",
            "Fitness for a particular purpose",
            "Non-infringement",
            "Accuracy",
            "Quiet enjoyment",
          ],
        },
        { kind: "sub", text: "17.3 No Warranty of Uninterrupted Use" },
        { kind: "p", text: "We do not warrant that:" },
        {
          kind: "list",
          items: [
            "The Services will meet your requirements.",
            "The Services will be uninterrupted, timely, secure, or error-free.",
            "Any errors or defects will be corrected.",
          ],
        },
      ],
    },
    {
      id: "limitation-of-liability",
      num: "18",
      title: "Limitation of Liability",
      blocks: [
        { kind: "sub", text: "18.1 Exclusion of Certain Damages" },
        {
          kind: "p",
          text: "To the fullest extent permitted by law, in no event shall ChadWallet or its affiliates be liable for any:",
        },
        {
          kind: "list",
          items: [
            "Indirect, incidental, special, consequential, or punitive damages.",
            "Loss of profits, data, use, goodwill, or other intangible losses.",
          ],
        },
        { kind: "sub", text: "18.2 Cap on Liability" },
        {
          kind: "p",
          text: "Our total liability to you shall not exceed the amount you have paid us in the twelve (12) months preceding the event giving rise to the liability.",
        },
        { kind: "sub", text: "18.3 No Liability for Third Parties" },
        { kind: "p", text: "We shall not be liable for any damages resulting from:" },
        {
          kind: "list",
          items: [
            "Unauthorized access to or alteration of your transmissions or data.",
            "Statements or conduct of any third party on the Services.",
            "Any Third-Party Services or content.",
          ],
        },
      ],
    },
    {
      id: "indemnification",
      num: "19",
      title: "Indemnification",
      blocks: [
        {
          kind: "p",
          text: "You agree to defend, indemnify, and hold harmless ChadWallet and its affiliates, officers, directors, employees, agents, and licensors from and against any claims, liabilities, damages, losses, and expenses, including reasonable legal and accounting fees, arising out of or in any way connected with:",
        },
        {
          kind: "list",
          items: [
            "Your access to or use of the Services.",
            "Your violation of these Terms.",
            "Your violation of any third-party rights, including intellectual property rights.",
          ],
        },
      ],
    },
    {
      id: "termination",
      num: "20",
      title: "Termination and Suspension",
      blocks: [
        { kind: "sub", text: "20.1 Termination by Us" },
        { kind: "p", text: "We reserve the right to:" },
        {
          kind: "list",
          items: [
            "Suspend or terminate your access to the Services at any time, with or without cause, and with or without notice.",
            "Terminate your Account for any violation of these Terms or applicable laws.",
          ],
        },
        { kind: "sub", text: "20.2 Effect of Termination" },
        { kind: "p", text: "Upon termination:" },
        {
          kind: "list",
          items: [
            "Your right to access and use the Services will immediately cease.",
            "Any provisions of these Terms that by their nature should survive termination shall remain in effect.",
          ],
        },
        { kind: "sub", text: "20.3 No Liability" },
        {
          kind: "p",
          text: "We are not liable for any losses or damages arising from the termination or suspension of your access to the Services.",
        },
      ],
    },
    {
      id: "changes",
      num: "21",
      title: "Changes to the Terms and Services",
      blocks: [
        { kind: "sub", text: "21.1 Modification of Terms" },
        {
          kind: "p",
          text: "We may modify these Terms at any time by posting the updated Terms on our website or through the Services. Changes are effective immediately upon posting.",
        },
        { kind: "sub", text: "21.2 Notification of Changes" },
        {
          kind: "p",
          text: "We will make reasonable efforts to notify you of significant changes, but it is your responsibility to review the Terms regularly.",
        },
        { kind: "sub", text: "21.3 Acceptance of Changes" },
        {
          kind: "p",
          text: "Your continued use of the Services after any changes to the Terms constitutes your acceptance of the new Terms.",
        },
        { kind: "sub", text: "21.4 Modification of Services" },
        {
          kind: "p",
          text: "We may modify or discontinue any part of the Services at any time without prior notice or liability.",
        },
      ],
    },
    {
      id: "governing-law",
      num: "22",
      title: "Governing Law and Jurisdiction",
      blocks: [
        { kind: "sub", text: "22.1 Governing Law" },
        {
          kind: "p",
          text: "These Terms are governed by and construed in accordance with the laws of the European Union and the laws of Canada, without regard to its conflict of law principles.",
        },
        { kind: "sub", text: "22.2 Jurisdiction" },
        {
          kind: "p",
          text: "Subject to the arbitration provisions below, you agree to submit to the exclusive jurisdiction of the courts located in Canada to resolve any legal matter arising from these Terms or the Services.",
        },
      ],
    },
    {
      id: "dispute-resolution",
      num: "23",
      title: "Dispute Resolution and Arbitration",
      blocks: [
        { kind: "sub", text: "23.1 Amicable Resolution" },
        {
          kind: "p",
          text: "In the event of any dispute, controversy, or claim arising out of or relating to these Terms or the Services, the parties shall first attempt to resolve the dispute amicably through good-faith negotiations within sixty (60) days of notification.",
        },
        { kind: "sub", text: "23.2 Binding Arbitration" },
        {
          kind: "p",
          text: "If the dispute is not resolved through amicable negotiations, it shall be finally settled under the Rules of Arbitration of the International Chamber of Commerce (“ICC”) by one or more arbitrators appointed in accordance with said Rules.",
        },
        { kind: "sub", text: "23.3 Arbitration Details" },
        {
          kind: "terms",
          items: [
            { term: "Seat of Arbitration", def: "Canada" },
            { term: "Language", def: "English" },
            {
              term: "Confidentiality",
              def: "All arbitration proceedings shall be confidential.",
            },
          ],
        },
        { kind: "sub", text: "23.4 Final and Binding" },
        {
          kind: "p",
          text: "The arbitration award shall be final and binding on both parties and may be entered as a judgment in any court of competent jurisdiction.",
        },
      ],
    },
    {
      id: "class-action-waiver",
      num: "24",
      title: "Class Action Waiver",
      blocks: [
        {
          kind: "p",
          text: "You agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action. You waive any right to participate in a class action lawsuit or class-wide arbitration.",
        },
      ],
    },
    {
      id: "time-to-file",
      num: "25",
      title: "Limitation on Time to File Claims",
      blocks: [
        {
          kind: "p",
          text: "Any claim related to these Terms or the Services must be filed within 6 (six) months after the cause of action accrues. Failure to file a claim within this period shall result in the claim being permanently barred.",
        },
      ],
    },
    {
      id: "severability",
      num: "26",
      title: "Severability",
      blocks: [
        {
          kind: "p",
          text: "If any provision of these Terms is held to be invalid, illegal, or unenforceable, such provision shall be modified to the minimum extent necessary to make it enforceable, and the remaining provisions shall remain in full force and effect.",
        },
      ],
    },
    {
      id: "waiver",
      num: "27",
      title: "Waiver",
      blocks: [
        {
          kind: "p",
          text: "Our failure to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision.",
        },
      ],
    },
    {
      id: "entire-agreement",
      num: "28",
      title: "Entire Agreement",
      blocks: [
        {
          kind: "p",
          text: "These Terms, along with our Privacy Policy and any additional agreements or policies incorporated by reference, constitute the entire agreement between you and ChadWallet regarding the Services and supersede all prior agreements.",
        },
      ],
    },
    {
      id: "assignment",
      num: "29",
      title: "Assignment",
      blocks: [
        {
          kind: "p",
          text: "You may not assign or transfer any of your rights or obligations under these Terms without our prior written consent. We may assign or transfer our rights and obligations under these Terms at any time without notice or consent.",
        },
      ],
    },
    {
      id: "force-majeure",
      num: "30",
      title: "Force Majeure",
      blocks: [
        {
          kind: "p",
          text: "We shall not be liable for any delay or failure to perform resulting from causes outside our reasonable control, including acts of God, war, terrorism, riots, embargoes, acts of civil or military authorities, or any other force majeure event.",
        },
      ],
    },
    {
      id: "language",
      num: "31",
      title: "Language",
      blocks: [
        {
          kind: "p",
          text: "These Terms are drawn up in English. If they are translated into any other language, the English version shall prevail in the event of any inconsistencies.",
        },
      ],
    },
    {
      id: "contact",
      num: "32",
      title: "Contact Information",
      blocks: [
        {
          kind: "p",
          text: "If you have any questions or concerns about these Terms, please contact us at:",
        },
        { kind: "p", text: `Email: ${LEGAL_CONTACT_EMAIL}` },
      ],
    },
    {
      id: "acknowledgment",
      num: "33",
      title: "Acknowledgment",
      blocks: [
        {
          kind: "p",
          text: "By accessing or using the Services, you acknowledge that you have read, understood, and agree to be bound by these Terms. Please read these Terms carefully before using the Services. Your use of the Services signifies your acceptance of these Terms.",
        },
      ],
    },
    {
      id: "appendix-a",
      num: "Appendix A",
      title: "Definitions",
      blocks: [
        {
          kind: "terms",
          items: [
            {
              term: "Account",
              def: "means a unique account created for you to access our Services.",
            },
            {
              term: "Affiliate",
              def: "means any entity that directly or indirectly controls, is controlled by, or is under common control with ChadWallet.",
            },
            { term: "ChadWallet", def: "refers to the Company offering the Services." },
            {
              term: "Confidential Information",
              def: "means all non-public information disclosed by us, including but not limited to business plans, technology, and customer information.",
            },
            {
              term: "Digital Assets",
              def: "means cryptocurrencies or other blockchain-based assets.",
            },
            {
              term: "Restricted Jurisdictions",
              def: "has the meaning set forth in Section 3.",
            },
            { term: "Services", def: "has the meaning set forth in Section 1." },
            {
              term: "Third-Party Services",
              def: "has the meaning set forth in Section 5.1.",
            },
          ],
        },
      ],
    },
    {
      id: "appendix-b",
      num: "Appendix B",
      title: "Risk Disclosure",
      blocks: [
        { kind: "sub", text: "B.1 Market Risks" },
        {
          kind: "terms",
          items: [
            { term: "Volatility", def: "The prices of Digital Assets are highly volatile." },
            { term: "Liquidity", def: "Markets may lack sufficient liquidity." },
            {
              term: "Regulatory Risk",
              def: "Regulatory changes could adversely affect Digital Assets.",
            },
          ],
        },
        { kind: "sub", text: "B.2 Technological Risks" },
        {
          kind: "terms",
          items: [
            { term: "Security Flaws", def: "Digital Assets may have vulnerabilities." },
            {
              term: "Network Forks",
              def: "Protocol changes can affect the value of Digital Assets.",
            },
            { term: "Cyber Attacks", def: "Risk of hacking and theft." },
          ],
        },
        { kind: "sub", text: "B.3 Legal Risks" },
        {
          kind: "terms",
          items: [
            {
              term: "Legal Uncertainty",
              def: "Laws and regulations regarding Digital Assets are evolving.",
            },
            { term: "Tax Obligations", def: "Tax treatment of Digital Assets may vary." },
          ],
        },
        { kind: "sub", text: "B.4 Operational Risks" },
        {
          kind: "terms",
          items: [
            { term: "Human Error", def: "Mistakes can result in loss." },
            { term: "System Failures", def: "Technical issues may disrupt Services." },
          ],
        },
        {
          kind: "p",
          text: "By using our Services, you acknowledge and accept the risks associated with Digital Assets and blockchain technology.",
        },
      ],
    },
  ],
};
