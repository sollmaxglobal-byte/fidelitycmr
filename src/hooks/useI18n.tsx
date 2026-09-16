import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "fr";

const DICT = {
  en: {
    // Nav
    "nav.home": "Home",
    "nav.invest": "Invest",
    "nav.wallet": "Wallet",
    "nav.profile": "Profile",
    "nav.admin": "Admin",
    "nav.plans": "Plans",
    "nav.about": "About",
    "nav.contact": "Contact",
    "nav.dashboard": "Dashboard",
    "nav.signin": "Sign in",
    "nav.signout": "Sign out",
    "nav.getStarted": "Get started",

    // Common
    "common.loading": "Loading…",
    "common.deposit": "Deposit",
    "common.withdraw": "Withdraw",
    "common.cancel": "Cancel",
    "common.submit": "Submit",
    "common.back": "Back",
    "common.continue": "Continue",
    "common.next": "Next",
    "common.amount": "Amount (XAF)",
    "common.method": "Method",
    "common.date": "Date",
    "common.status": "Status",
    "common.pleaseWait": "Please wait…",
    "common.copied": "Copied",

    // Landing
    "landing.badge": "Trusted by Cameroonian investors",
    "landing.heroTitle1": "Grow your money",
    "landing.heroTitle2": "safely",
    "landing.heroSubtitle":
      "Pick a plan, fund it with Mobile Money, and receive your capital plus profit at the end of the term — all in XAF.",
    "landing.startInvesting": "Start investing",
    "landing.viewPlans": "View plans",
    "landing.plansEyebrow": "Investment plans",
    "landing.plansTitle": "Three plans. One simple promise.",
    "landing.plansSubtitle": "Capital + profit paid at the end of the term.",
    "landing.totalRoi": "total ROI",
    "landing.daysPaidEnd": "days · paid at end of term",
    "landing.min": "Min",
    "landing.max": "Max",
    "landing.momoFunding": "Mobile Money funding",
    "landing.activate": "Activate plan",
    "landing.popular": "Popular",
    "landing.planCapital": "Capital + Profit paid at end of term. Investments carry risk.",
    "landing.howTitle": "How it works",
    "landing.how1.t": "Open account",
    "landing.how1.d": "Register in under a minute with your phone and email.",
    "landing.how2.t": "Fund your wallet",
    "landing.how2.d": "Pay via MTN or Orange Money, upload the screenshot.",
    "landing.how3.t": "Pick a plan",
    "landing.how3.d": "Choose Starter, Growth or Premium and activate.",
    "landing.how4.t": "Receive payout",
    "landing.how4.d": "Capital + profit hit your wallet at end of term.",
    "landing.faqTitle": "Frequently asked questions",
    "landing.faq1.q": "How are payments processed?",
    "landing.faq1.a":
      "Manually. You send money via MTN Mobile Money or Orange Money to our official number, upload your screenshot, and our team approves it within 24 hours.",
    "landing.faq2.q": "When do I receive my profit?",
    "landing.faq2.a":
      "Both your capital and your profit are credited to your wallet at the end of the plan's term (14, 30, or 60 days depending on the plan).",
    "landing.faq3.q": "Can I withdraw any time?",
    "landing.faq3.a":
      "Your wallet balance is always available to withdraw. Funds locked in an active plan are released at the end of the term.",
    "landing.faq4.q": "Is there any fee?",
    "landing.faq4.a":
      "No deposit or withdrawal fees. The amount you deposit is the amount that earns.",
    "landing.faq5.q": "Is this safe?",
    "landing.faq5.a":
      "We are not a licensed financial institution and all investments carry risk. Only invest what you can afford to lose.",
    "landing.ctaTitle": "Ready to grow your money?",
    "landing.ctaSubtitle": "Open your free account in under a minute.",
    "landing.ctaButton": "Create account",

    // Footer
    "footer.tagline":
      "Grow your money safely with transparent, time-locked investment plans paid in XAF.",
    "footer.platform": "Platform",
    "footer.account": "Account",
    "footer.contact": "Contact",
    "footer.investmentPlans": "Investment plans",
    "footer.aboutUs": "About us",
    "footer.location": "Douala, Cameroon",
    "footer.disclaimer":
      "Risk disclosure: Not a licensed financial institution. Investments carry risk. Only invest what you can afford to lose.",
    "footer.rights": "All rights reserved.",

    // Auth
    "auth.signIn": "Sign in",
    "auth.signUp": "Create account",
    "auth.welcomeBack": "Welcome back",
    "auth.createAcc": "Create your account",
    "auth.signInSub": "Sign in to your dashboard.",
    "auth.signUpSub": "Takes less than a minute.",
    "auth.fullName": "Full name",
    "auth.phone": "Phone",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.forgot": "Forgot password?",
    "auth.newHere": "New to Fidelity?",
    "auth.haveAccount": "Already have an account?",
    "auth.createOne": "Create one",
    "auth.disclaimer":
      "Not a licensed financial institution. Investments carry risk. Only invest what you can afford to lose.",
    "auth.heroLine1": "Grow your money",
    "auth.heroLine2": "safely",
    "auth.heroSub":
      "Capital + profit paid at the end of every plan. Manual verification. Real Cameroonian support.",
    "auth.welcomeToast": "Welcome back",
    "auth.created": "Account created — welcome to Fidelity!",
    "auth.loginTitle": "Sign in to your account",
    "auth.registerTitle": "Create your account",
    "auth.forgotTitle": "Reset your password",
    "auth.forgotSub": "Enter the email you signed up with and we'll send you a reset link.",
    "auth.sendReset": "Send reset link",
    "auth.sending": "Sending…",
    "auth.resetSent": "Reset link sent — check your inbox",
    "auth.resetSentBody":
      "We've sent a reset link. Click it from your inbox to set a new password.",
    "auth.backToSignIn": "Back to sign in",
    "auth.invitedBy": "You were invited by",
    "auth.invitedSub": "Create your account to join their team.",
    "auth.referralCode": "Referral code",
    "auth.noAccount": "Don't have an account?",
    "auth.registerLink": "Register",
    "auth.loginLink": "Sign in",

    // Dashboard home
    "home.welcomeBack": "Welcome back",
    "home.investor": "Investor",
    "home.availableBalance": "Available balance",
    "home.totalProfit": "Total profit",
    "home.activePlans": "Active plans",
    "home.profitGrowth": "Profit growth",
    "home.yourPlans": "Your plans",
    "home.newInvestment": "+ New investment",
    "home.noInvestments": "No investments yet.",
    "home.activatePlan": "Activate a plan →",
    "home.ends": "Ends",
    "home.invested": "Invested",
    "home.roi": "ROI",
    "home.earned": "Earned",

    // Wallet
    "wallet.title": "Wallet",
    "wallet.subtitle": "All your money movements in one place.",
    "wallet.balance": "Available balance",
    "wallet.filter.all": "All",
    "wallet.filter.deposits": "Deposits",
    "wallet.filter.withdrawals": "Withdrawals",
    "wallet.filter.profits": "Profits",
    "wallet.empty": "No transactions yet.",
    "wallet.depositSubmitted": "Deposit submitted",
    "wallet.depositApproved": "Deposit approved",
    "wallet.depositRejected": "Deposit rejected",
    "wallet.withdrawalRequested": "Withdrawal requested",
    "wallet.withdrawalRejected": "Withdrawal rejected",
    "wallet.withdrawalPaid": "Withdrawal paid",
    "wallet.profit": "Profit",
    "wallet.investment": "Investment",

    // Deposit (4-step wizard)
    "deposit.title": "Deposit funds",
    "deposit.subtitle": "Four quick steps. Funds confirmed within 24h.",
    "deposit.step": "Step",
    "deposit.of": "of",
    "deposit.step1": "Amount",
    "deposit.step2": "Method",
    "deposit.step3": "Pay",
    "deposit.step4": "Proof",
    "deposit.amountTitle": "How much would you like to deposit?",
    "deposit.amountSub": "Minimum 1,000 XAF.",
    "deposit.amountPlaceholder": "Enter amount",
    "deposit.quickPick": "Quick pick",
    "deposit.methodTitle": "Choose how to pay",
    "deposit.methodSub": "Pick the channel you want to use.",
    "deposit.payTitle": "Send your payment",
    "deposit.paySub": "Use the details below, then continue when you're done.",
    "deposit.sendTo": "Send payment to",
    "deposit.accountName": "Account name",
    "deposit.accountNumber": "Account / Number",
    "deposit.amountToSend": "Amount to send",
    "deposit.instructions": "Instructions",
    "deposit.iHavePaid": "I have sent the payment",
    "deposit.proofTitle": "Upload your payment screenshot",
    "deposit.proofSub": "A clear screenshot of the transfer is the only thing required.",
    "deposit.proofPlaceholder": "Tap to upload your proof of payment",
    "deposit.submit": "Submit deposit",
    "deposit.submitting": "Submitting…",
    "deposit.submitted": "Deposit submitted — pending review",
    "deposit.errNoFile": "Please upload your payment screenshot",
    "deposit.errMin": "Minimum 1,000 XAF",
    "deposit.successTitle": "Deposit submitted successfully",
    "deposit.successDesc":
      "Your deposit is awaiting admin approval. You'll be notified once it's confirmed.",
    "deposit.returnHome": "Return to dashboard",
    "deposit.viewHistory": "View deposit history",
    "status.pending": "Pending",

    // Withdraw
    "withdraw.title": "Withdraw funds",
    "withdraw.subtitle": "Funds are sent within 24h after admin review.",
    "withdraw.available": "Available",
    "withdraw.accountName": "Account name",
    "withdraw.accountNumber": "Account / Phone / Wallet",
    "withdraw.method.mobile": "Mobile Money (MTN/Orange)",
    "withdraw.method.bank": "Bank transfer",
    "withdraw.method.crypto": "Crypto (USDT)",
    "withdraw.submit": "Request withdrawal",
    "withdraw.submitted": "Withdrawal request submitted",
    "withdraw.errExceed": "Amount exceeds your wallet balance",
    "withdraw.recent": "Recent withdrawals",
    "withdraw.empty": "No withdrawals yet.",

    // Plans page
    "plans.activate": "Activate",
    "plans.duration": "Duration",
    "plans.days": "days",

    // Toasts
    "toast.error.generic": "Something went wrong",
  },

  fr: {
    // Nav
    "nav.home": "Accueil",
    "nav.invest": "Investir",
    "nav.wallet": "Portefeuille",
    "nav.profile": "Profil",
    "nav.admin": "Admin",
    "nav.plans": "Plans",
    "nav.about": "À propos",
    "nav.contact": "Contact",
    "nav.dashboard": "Tableau de bord",
    "nav.signin": "Se connecter",
    "nav.signout": "Se déconnecter",
    "nav.getStarted": "Commencer",

    // Common
    "common.loading": "Chargement…",
    "common.deposit": "Dépôt",
    "common.withdraw": "Retrait",
    "common.cancel": "Annuler",
    "common.submit": "Envoyer",
    "common.back": "Retour",
    "common.continue": "Continuer",
    "common.next": "Suivant",
    "common.amount": "Montant (XAF)",
    "common.method": "Méthode",
    "common.date": "Date",
    "common.status": "Statut",
    "common.pleaseWait": "Veuillez patienter…",
    "common.copied": "Copié",

    // Landing
    "landing.badge": "La confiance des investisseurs camerounais",
    "landing.heroTitle1": "Faites fructifier votre argent",
    "landing.heroTitle2": "en toute sécurité",
    "landing.heroSubtitle":
      "Choisissez un plan, financez-le avec Mobile Money, et recevez votre capital plus profit à la fin du terme — entièrement en XAF.",
    "landing.startInvesting": "Commencer à investir",
    "landing.viewPlans": "Voir les plans",
    "landing.plansEyebrow": "Plans d'investissement",
    "landing.plansTitle": "Trois plans. Une promesse simple.",
    "landing.plansSubtitle": "Capital + profit versés à la fin du terme.",
    "landing.totalRoi": "ROI total",
    "landing.daysPaidEnd": "jours · payé à la fin",
    "landing.min": "Min",
    "landing.max": "Max",
    "landing.momoFunding": "Financement Mobile Money",
    "landing.activate": "Activer le plan",
    "landing.popular": "Populaire",
    "landing.planCapital":
      "Capital + profit versés à la fin du terme. Tout investissement comporte des risques.",
    "landing.howTitle": "Comment ça marche",
    "landing.how1.t": "Ouvrir un compte",
    "landing.how1.d": "Inscrivez-vous en moins d'une minute avec votre téléphone et votre email.",
    "landing.how2.t": "Approvisionner",
    "landing.how2.d": "Payez via MTN ou Orange Money et téléchargez la capture.",
    "landing.how3.t": "Choisir un plan",
    "landing.how3.d": "Sélectionnez Starter, Growth ou Premium et activez.",
    "landing.how4.t": "Recevoir le paiement",
    "landing.how4.d": "Capital + profit versés au portefeuille à la fin du terme.",
    "landing.faqTitle": "Questions fréquentes",
    "landing.faq1.q": "Comment les paiements sont-ils traités ?",
    "landing.faq1.a":
      "Manuellement. Vous envoyez l'argent via MTN Mobile Money ou Orange Money à notre numéro officiel, téléversez votre capture, et notre équipe valide sous 24 heures.",
    "landing.faq2.q": "Quand est-ce que je reçois mon profit ?",
    "landing.faq2.a":
      "Le capital et le profit sont crédités sur votre portefeuille à la fin du terme du plan (14, 30 ou 60 jours selon le plan).",
    "landing.faq3.q": "Puis-je retirer à tout moment ?",
    "landing.faq3.a":
      "Le solde de votre portefeuille est toujours disponible. Les fonds bloqués dans un plan actif sont libérés à la fin du terme.",
    "landing.faq4.q": "Y a-t-il des frais ?",
    "landing.faq4.a":
      "Aucun frais de dépôt ou de retrait. Le montant que vous déposez est celui qui rapporte.",
    "landing.faq5.q": "Est-ce sûr ?",
    "landing.faq5.a":
      "Nous ne sommes pas une institution financière agréée et tout investissement comporte des risques. N'investissez que ce que vous pouvez vous permettre de perdre.",
    "landing.ctaTitle": "Prêt à faire fructifier votre argent ?",
    "landing.ctaSubtitle": "Ouvrez votre compte gratuit en moins d'une minute.",
    "landing.ctaButton": "Créer un compte",

    // Footer
    "footer.tagline":
      "Faites fructifier votre argent en toute sécurité avec des plans d'investissement transparents et verrouillés dans le temps, payés en XAF.",
    "footer.platform": "Plateforme",
    "footer.account": "Compte",
    "footer.contact": "Contact",
    "footer.investmentPlans": "Plans d'investissement",
    "footer.aboutUs": "À propos",
    "footer.location": "Douala, Cameroun",
    "footer.disclaimer":
      "Avertissement de risque : Pas une institution financière agréée. Tout investissement comporte des risques. N'investissez que ce que vous pouvez vous permettre de perdre.",
    "footer.rights": "Tous droits réservés.",

    // Auth
    "auth.signIn": "Se connecter",
    "auth.signUp": "Créer un compte",
    "auth.welcomeBack": "Bon retour",
    "auth.createAcc": "Créer votre compte",
    "auth.signInSub": "Connectez-vous à votre tableau de bord.",
    "auth.signUpSub": "Prend moins d'une minute.",
    "auth.fullName": "Nom complet",
    "auth.phone": "Téléphone",
    "auth.email": "Email",
    "auth.password": "Mot de passe",
    "auth.forgot": "Mot de passe oublié ?",
    "auth.newHere": "Nouveau sur Fidelity ?",
    "auth.haveAccount": "Vous avez déjà un compte ?",
    "auth.createOne": "Créer un compte",
    "auth.disclaimer":
      "Pas une institution financière agréée. Tout investissement comporte des risques. N'investissez que ce que vous pouvez vous permettre de perdre.",
    "auth.heroLine1": "Faites fructifier votre argent",
    "auth.heroLine2": "en toute sécurité",
    "auth.heroSub":
      "Capital + profit versés à la fin de chaque plan. Vérification manuelle. Support camerounais réel.",
    "auth.welcomeToast": "Bon retour",
    "auth.created": "Compte créé — bienvenue sur Fidelity !",
    "auth.loginTitle": "Connexion à votre compte",
    "auth.registerTitle": "Créer votre compte",
    "auth.forgotTitle": "Réinitialiser votre mot de passe",
    "auth.forgotSub":
      "Entrez l'email utilisé lors de l'inscription et nous vous enverrons un lien de réinitialisation.",
    "auth.sendReset": "Envoyer le lien",
    "auth.sending": "Envoi…",
    "auth.resetSent": "Lien envoyé — vérifiez votre boîte mail",
    "auth.resetSentBody":
      "Nous avons envoyé un lien de réinitialisation. Cliquez dessus depuis votre boîte mail pour définir un nouveau mot de passe.",
    "auth.backToSignIn": "Retour à la connexion",
    "auth.invitedBy": "Vous avez été invité par",
    "auth.invitedSub": "Créez votre compte pour rejoindre son équipe.",
    "auth.referralCode": "Code de parrainage",
    "auth.noAccount": "Pas encore de compte ?",
    "auth.registerLink": "S'inscrire",
    "auth.loginLink": "Se connecter",

    // Dashboard home
    "home.welcomeBack": "Bon retour",
    "home.investor": "Investisseur",
    "home.availableBalance": "Solde disponible",
    "home.totalProfit": "Profit total",
    "home.activePlans": "Plans actifs",
    "home.profitGrowth": "Croissance du profit",
    "home.yourPlans": "Vos plans",
    "home.newInvestment": "+ Nouvel investissement",
    "home.noInvestments": "Aucun investissement.",
    "home.activatePlan": "Activer un plan →",
    "home.ends": "Fin",
    "home.invested": "Investi",
    "home.roi": "ROI",
    "home.earned": "Gagné",

    // Wallet
    "wallet.title": "Portefeuille",
    "wallet.subtitle": "Tous vos mouvements d'argent au même endroit.",
    "wallet.balance": "Solde disponible",
    "wallet.filter.all": "Tout",
    "wallet.filter.deposits": "Dépôts",
    "wallet.filter.withdrawals": "Retraits",
    "wallet.filter.profits": "Profits",
    "wallet.empty": "Aucune transaction pour le moment.",
    "wallet.depositSubmitted": "Dépôt soumis",
    "wallet.depositApproved": "Dépôt approuvé",
    "wallet.depositRejected": "Dépôt rejeté",
    "wallet.withdrawalRequested": "Retrait demandé",
    "wallet.withdrawalRejected": "Retrait rejeté",
    "wallet.withdrawalPaid": "Retrait payé",
    "wallet.profit": "Profit",
    "wallet.investment": "Investissement",

    // Deposit
    "deposit.title": "Faire un dépôt",
    "deposit.subtitle": "Quatre étapes rapides. Fonds confirmés sous 24h.",
    "deposit.step": "Étape",
    "deposit.of": "sur",
    "deposit.step1": "Montant",
    "deposit.step2": "Méthode",
    "deposit.step3": "Payer",
    "deposit.step4": "Preuve",
    "deposit.amountTitle": "Combien souhaitez-vous déposer ?",
    "deposit.amountSub": "Minimum 1 000 XAF.",
    "deposit.amountPlaceholder": "Saisir le montant",
    "deposit.quickPick": "Choix rapide",
    "deposit.methodTitle": "Choisissez votre moyen de paiement",
    "deposit.methodSub": "Sélectionnez le canal que vous souhaitez utiliser.",
    "deposit.payTitle": "Envoyez votre paiement",
    "deposit.paySub": "Utilisez les détails ci-dessous, puis continuez une fois terminé.",
    "deposit.sendTo": "Envoyer le paiement à",
    "deposit.accountName": "Nom du compte",
    "deposit.accountNumber": "Compte / Numéro",
    "deposit.amountToSend": "Montant à envoyer",
    "deposit.instructions": "Instructions",
    "deposit.iHavePaid": "J'ai envoyé le paiement",
    "deposit.proofTitle": "Téléversez votre capture de paiement",
    "deposit.proofSub": "Seule une capture claire du transfert est requise.",
    "deposit.proofPlaceholder": "Appuyez pour téléverser votre preuve",
    "deposit.submit": "Envoyer le dépôt",
    "deposit.submitting": "Envoi…",
    "deposit.submitted": "Dépôt soumis — en attente de validation",
    "deposit.errNoFile": "Veuillez téléverser votre capture de paiement",
    "deposit.errMin": "Minimum 1 000 XAF",
    "deposit.successTitle": "Dépôt soumis avec succès",
    "deposit.successDesc":
      "Votre dépôt est en attente d'approbation. Vous serez notifié dès sa confirmation.",
    "deposit.returnHome": "Retour au tableau de bord",
    "deposit.viewHistory": "Voir l'historique des dépôts",
    "status.pending": "En attente",

    // Withdraw
    "withdraw.title": "Retirer des fonds",
    "withdraw.subtitle": "Les fonds sont envoyés sous 24h après vérification.",
    "withdraw.available": "Disponible",
    "withdraw.accountName": "Nom du compte",
    "withdraw.accountNumber": "Compte / Téléphone / Wallet",
    "withdraw.method.mobile": "Mobile Money (MTN/Orange)",
    "withdraw.method.bank": "Virement bancaire",
    "withdraw.method.crypto": "Crypto (USDT)",
    "withdraw.submit": "Demander un retrait",
    "withdraw.submitted": "Demande de retrait envoyée",
    "withdraw.errExceed": "Le montant dépasse votre solde",
    "withdraw.recent": "Retraits récents",
    "withdraw.empty": "Aucun retrait pour le moment.",

    // Plans page
    "plans.activate": "Activer",
    "plans.duration": "Durée",
    "plans.days": "jours",

    // Toasts
    "toast.error.generic": "Une erreur est survenue",
  },
} as const;

/** Additional keys (checkout, receipts, profile). Merged into DICT below. */
const EXTRA = {
  en: {
    "deposit.iConfirmPaid": "I confirm that I have sent",
    "deposit.tickConfirm": "Tick payment confirmation",
    "deposit.proofStepTitle": "Upload payment proof",
    "deposit.proofStepSub": "Upload a clear screenshot showing your completed transfer.",
    "deposit.selectProof": "Select payment proof",
    "deposit.proofHint": "JPG, PNG or a screenshot from your payment app",
    "deposit.proofTip":
      "Make sure the amount, receiver and reference are visible before submitting.",
    "deposit.summary": "Payment summary",
    "receipt.title": "Official transaction receipt",
    "receipt.download": "Download receipt",
    "receipt.back": "Back to history",
    "receipt.notFound": "Receipt not found.",
    "receipt.amount": "Amount",
    "receipt.issued": "Issued",
    "profile.language": "Language",
  },
  fr: {
    "deposit.iConfirmPaid": "Je confirme avoir envoyé",
    "deposit.tickConfirm": "Cochez la confirmation de paiement",
    "deposit.proofStepTitle": "Téléversez la preuve de paiement",
    "deposit.proofStepSub": "Téléversez une capture claire de votre transfert effectué.",
    "deposit.selectProof": "Choisir la preuve de paiement",
    "deposit.proofHint": "JPG, PNG ou une capture de votre application de paiement",
    "deposit.proofTip":
      "Vérifiez que le montant, le bénéficiaire et la référence sont visibles avant d'envoyer.",
    "deposit.summary": "Récapitulatif du paiement",
    "receipt.title": "Reçu officiel de transaction",
    "receipt.download": "Télécharger le reçu",
    "receipt.back": "Retour à l'historique",
    "receipt.notFound": "Reçu introuvable.",
    "receipt.amount": "Montant",
    "receipt.issued": "Émis le",
    "profile.language": "Langue",
  },
} as const;

const MERGED = {
  en: { ...DICT.en, ...EXTRA.en },
  fr: { ...DICT.fr, ...EXTRA.fr },
};

type Key = keyof (typeof MERGED)["en"];

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string }>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

/** Store the chosen language on the user's profile so emails match their language. */
async function persistLang(l: Lang) {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user?.id;
    if (!uid) return;
    const { error } = await supabase
      .from("profiles")
      .update({ preferred_language: l })
      .eq("id", uid);
    if (error) console.error("Could not save email language preference", error.message);
  } catch (error) {
    console.error("Could not save email language preference", error);
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  // Always start with "en" so SSR and first client render match.
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored =
      (typeof window !== "undefined" && (localStorage.getItem("safegrow-lang") as Lang | null)) ||
      null;
    const browser =
      typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("fr")
        ? "fr"
        : "en";
    const next = stored ?? (browser as Lang);
    if (next !== lang) setLangState(next);
    if (typeof document !== "undefined") document.documentElement.lang = next;
    void persistLang(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("safegrow-lang", l);
    } catch (_) {
      /* ignore */
    }
    if (typeof document !== "undefined") document.documentElement.lang = l;
    void persistLang(l);
  };

  const t = (k: Key) =>
    (MERGED[lang] as Record<string, string>)[k] ?? (MERGED.en as Record<string, string>)[k] ?? k;

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
