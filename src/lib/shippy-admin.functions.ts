import { createServerFn } from "@tanstack/react-start";
import { assertOpsToken } from "@/lib/shippy-auth.server";
import {
  MANAGER_ROLES,
  MANAGER_STATUSES,
  PAYMENT_METHOD_STATUSES,
  PAYMENT_METHOD_TYPES,
  PAYMENT_METHOD_USAGE,
  PAYMENT_OPTIONS,
  type ManagerRole,
  type ManagerStatus,
  type PaymentMethodType,
  type PaymentMethodUsage,
  type PaymentMethodStatus,
  type PaymentOption,
} from "@/data/admin";
import { DEPOSIT_STATUSES, type DepositStatus } from "@/data/deposits";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const text = (value: unknown, max: number) =>
  String(value ?? "")
    .trim()
    .slice(0, max);

const numberValue = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const optionalUrl = (value: unknown, max = 300) => {
  const url = text(value, max);
  if (!url) return "";
  if (!/^https?:\/\//i.test(url) && !url.startsWith("/")) {
    throw new Error("Enter a valid URL (starting with http:// or https://).");
  }
  return url;
};

const imageValue = (value: unknown) => {
  const image = String(value ?? "");
  if (!image) return "";
  if (image.length > 500_000) throw new Error("The uploaded image is too large (max 300 KB).");
  if (
    !/^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,/i.test(image) &&
    !/^https?:\/\//i.test(image) &&
    !image.startsWith("/")
  ) {
    throw new Error("Upload a valid image file.");
  }
  return image;
};

const managerRole = (value: unknown): ManagerRole => {
  if (!MANAGER_ROLES.includes(value as ManagerRole))
    throw new Error("Choose a valid manager role.");
  return value as ManagerRole;
};

const managerStatus = (value: unknown): ManagerStatus => {
  if (!MANAGER_STATUSES.includes(value as ManagerStatus)) throw new Error("Choose a valid status.");
  return value as ManagerStatus;
};

const paymentOption = (value: unknown): PaymentOption => {
  if (!PAYMENT_OPTIONS.includes(value as PaymentOption)) throw new Error("Choose a valid option.");
  return value as PaymentOption;
};

export const opsShipment = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string; number: string }) => ({
    token: text(data.token, 200),
    number: text(data.number, 40).toUpperCase(),
  }))
  .handler(async ({ data }) => {
    await assertOpsToken(data.token);
    const { findShipment } = await import("@/lib/shipments.server");
    return findShipment(data.number);
  });

export const opsCustomers = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string }) => ({ token: text(data.token, 200) }))
  .handler(async ({ data }) => {
    await assertOpsToken(data.token);
    const { adminCustomers } = await import("@/lib/shipments.server");
    return adminCustomers();
  });

export const opsDeposits = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string }) => ({ token: text(data.token, 200) }))
  .handler(async ({ data }) => {
    await assertOpsToken(data.token);
    const { listDeposits } = await import("@/lib/shipments.server");
    return listDeposits();
  });

export const opsUpdateDeposit = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string; id: string; status: string }) => {
    if (!DEPOSIT_STATUSES.includes(data.status as DepositStatus)) {
      throw new Error("Choose a valid deposit status.");
    }
    return {
      token: text(data.token, 200),
      id: text(data.id, 80),
      status: data.status as DepositStatus,
    };
  })
  .handler(async ({ data }) => {
    await assertOpsToken(data.token);
    const { updateDepositStatus } = await import("@/lib/shipments.server");
    return updateDepositStatus(data.id, data.status);
  });

export const opsDeleteDeposit = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string; id: string }) => ({
    token: text(data.token, 200),
    id: text(data.id, 80),
  }))
  .handler(async ({ data }) => {
    await assertOpsToken(data.token);
    const { deleteDeposit } = await import("@/lib/shipments.server");
    return deleteDeposit(data.id);
  });

export const opsManagers = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string }) => ({ token: text(data.token, 200) }))
  .handler(async ({ data }) => {
    await assertOpsToken(data.token);
    const { publicSettings } = await import("@/lib/shippy-settings.server");
    return (await publicSettings()).managers;
  });

export const opsSaveManager = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      token: string;
      id?: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      role: string;
      status: string;
      password?: string;
    }) => {
      const email = text(data.email, 120).toLowerCase();
      if (!EMAIL_RE.test(email)) throw new Error("Enter a valid email address.");
      const firstName = text(data.firstName, 60);
      if (!firstName) throw new Error("Enter the manager's first name.");
      const password = String(data.password ?? "");
      if (!data.id && password.length < 6) {
        throw new Error("Set a password with at least 6 characters.");
      }
      if (password && password.length < 6) {
        throw new Error("The password must be at least 6 characters.");
      }
      return {
        token: text(data.token, 200),
        id: text(data.id, 80),
        firstName,
        lastName: text(data.lastName, 60),
        email,
        phone: text(data.phone, 40),
        role: managerRole(data.role),
        status: managerStatus(data.status),
        password,
      };
    },
  )
  .handler(async ({ data }) => {
    await assertOpsToken(data.token);
    const { hashPassword, readSettings, saveSettings, publicSettings } =
      await import("@/lib/shippy-settings.server");
    const settings = await readSettings();
    const managers = [...settings.managers];

    if (data.id) {
      const index = managers.findIndex((manager) => manager.id === data.id);
      if (index < 0) throw new Error("Manager not found.");
      if (
        managers.some(
          (manager) =>
            manager.id !== data.id && manager.email.toLowerCase() === data.email.toLowerCase(),
        )
      ) {
        throw new Error("A manager with that email already exists.");
      }
      managers[index] = {
        ...managers[index],
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        role: data.role,
        status: data.status,
        ...(data.password ? { passwordHash: hashPassword(data.password) } : {}),
      };
    } else {
      if (managers.some((manager) => manager.email.toLowerCase() === data.email.toLowerCase())) {
        throw new Error("A manager with that email already exists.");
      }
      managers.push({
        id: `mgr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        role: data.role,
        status: data.status,
        passwordHash: hashPassword(data.password),
        createdAt: new Date().toISOString(),
      });
    }

    if (
      !managers.some((manager) => manager.role === "Super Admin" && manager.status === "active")
    ) {
      throw new Error("Keep at least one active Super Admin.");
    }

    await saveSettings({ managers });
    return { ok: true as const, managers: (await publicSettings()).managers };
  });

export const opsDeleteManager = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string; id: string }) => ({
    token: text(data.token, 200),
    id: text(data.id, 80),
  }))
  .handler(async ({ data }) => {
    await assertOpsToken(data.token);
    const { readSettings, saveSettings, publicSettings } =
      await import("@/lib/shippy-settings.server");
    const settings = await readSettings();
    const target = settings.managers.find((manager) => manager.id === data.id);
    if (!target) throw new Error("Manager not found.");
    const remaining = settings.managers.filter((manager) => manager.id !== data.id);
    if (
      target.role === "Super Admin" &&
      !remaining.some((manager) => manager.role === "Super Admin" && manager.status === "active")
    ) {
      throw new Error("Keep at least one active Super Admin.");
    }
    await saveSettings({ managers: remaining });
    return { ok: true as const, managers: (await publicSettings()).managers };
  });

export const opsResetManagerPassword = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string; id: string }) => ({
    token: text(data.token, 200),
    id: text(data.id, 80),
  }))
  .handler(async ({ data }) => {
    await assertOpsToken(data.token);
    const { hashPassword, readSettings, saveSettings } =
      await import("@/lib/shippy-settings.server");
    const settings = await readSettings();
    const index = settings.managers.findIndex((manager) => manager.id === data.id);
    if (index < 0) throw new Error("Manager not found.");
    const password = `admin${Math.floor(10000 + Math.random() * 90000)}`;
    const managers = [...settings.managers];
    managers[index] = { ...managers[index], passwordHash: hashPassword(password) };
    await saveSettings({ managers });
    return { ok: true as const, password };
  });

export const opsSaveEmailSettings = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      token: string;
      mailServer: string;
      emailFrom: string;
      emailFromName: string;
      smtpHost: string;
      smtpPort: string;
      smtpEncryption: string;
      smtpUsername: string;
      smtpPassword: string;
    }) => {
      if (data.mailServer !== "sendmail" && data.mailServer !== "smtp") {
        throw new Error("Choose a valid mail server.");
      }
      if (!["ssl", "tls", "none"].includes(data.smtpEncryption)) {
        throw new Error("Choose a valid SMTP encryption.");
      }
      const smtpPort = text(data.smtpPort, 10);
      if (smtpPort && !/^\d{1,5}$/.test(smtpPort)) throw new Error("Enter a valid SMTP port.");
      return {
        token: text(data.token, 200),
        mailServer: data.mailServer as "sendmail" | "smtp",
        emailFrom: text(data.emailFrom, 160),
        emailFromName: text(data.emailFromName, 80),
        smtpHost: text(data.smtpHost, 160),
        smtpPort,
        smtpEncryption: data.smtpEncryption as "ssl" | "tls" | "none",
        smtpUsername: text(data.smtpUsername, 160),
        smtpPassword: String(data.smtpPassword ?? "").slice(0, 200),
      };
    },
  )
  .handler(async ({ data }) => {
    await assertOpsToken(data.token);
    const { saveSettings } = await import("@/lib/shippy-settings.server");
    await saveSettings({
      mailServer: data.mailServer,
      emailFrom: data.emailFrom,
      emailFromName: data.emailFromName,
      smtpHost: data.smtpHost,
      smtpPort: data.smtpPort,
      smtpEncryption: data.smtpEncryption,
      smtpUsername: data.smtpUsername,
      smtpPassword: data.smtpPassword,
    });
    return { ok: true as const };
  });

export const opsSendBroadcast = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      token: string;
      recipients: string[];
      subject: string;
      greeting: string;
      message: string;
    }) => {
      const recipients = Array.from(
        new Set(
          (Array.isArray(data.recipients) ? data.recipients : [])
            .map((email) => text(email, 160).toLowerCase())
            .filter(Boolean),
        ),
      );
      if (!recipients.length) throw new Error("Choose at least one recipient.");
      if (recipients.length > 500) throw new Error("Send to 500 recipients or fewer at a time.");
      const invalid = recipients.find((email) => !EMAIL_RE.test(email));
      if (invalid) throw new Error(`Invalid recipient email: ${invalid}`);
      const subject = text(data.subject, 160);
      if (!subject) throw new Error("Enter a subject.");
      const message = String(data.message ?? "")
        .trim()
        .slice(0, 5000);
      if (message.length < 5) throw new Error("Write a message.");
      return {
        token: text(data.token, 200),
        recipients,
        subject,
        greeting: text(data.greeting, 120),
        message,
      };
    },
  )
  .handler(async ({ data }) => {
    await assertOpsToken(data.token);
    const { sendBroadcast } = await import("@/lib/shipments.server");
    return sendBroadcast({
      recipients: data.recipients,
      subject: data.subject,
      greeting: data.greeting,
      message: data.message,
    });
  });

export const opsSavePaymentSettings = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      token: string;
      depositOption: string;
      withdrawalOption: string;
      minimumDeposit: number;
      paymentMethods: {
        id?: string;
        name: string;
        type: string;
        usedFor: string;
        status: string;
        currency: string;
        minAmount: number;
        maxAmount: number;
        charges: number;
        chargesType: string;
        imageUrl: string;
        bankName: string;
        accountName: string;
        accountNumber: string;
        swiftCode: string;
        walletAddress: string;
        network: string;
        note: string;
      }[];
    }) => {
      const depositOption = paymentOption(data.depositOption);
      const withdrawalOption = paymentOption(data.withdrawalOption);
      const paymentMethods = (Array.isArray(data.paymentMethods) ? data.paymentMethods : []).map(
        (raw) => {
          const name = text(raw.name, 80);
          if (!name) throw new Error("Every payment method needs a name.");
          const type = PAYMENT_METHOD_TYPES.includes(raw.type as PaymentMethodType)
            ? (raw.type as PaymentMethodType)
            : "currency";
          const usedFor = PAYMENT_METHOD_USAGE.includes(raw.usedFor as PaymentMethodUsage)
            ? (raw.usedFor as PaymentMethodUsage)
            : "both";
          const status = PAYMENT_METHOD_STATUSES.includes(raw.status as PaymentMethodStatus)
            ? (raw.status as PaymentMethodStatus)
            : "enabled";
          return {
            id: text(raw.id, 80) || `pm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name,
            type,
            usedFor,
            status,
            currency: text(raw.currency, 20),
            minAmount: numberValue(raw.minAmount),
            maxAmount: numberValue(raw.maxAmount),
            charges: numberValue(raw.charges),
            chargesType: raw.chargesType === "fixed" ? ("fixed" as const) : ("percentage" as const),
            imageUrl: text(raw.imageUrl, 500),
            bankName: text(raw.bankName, 120),
            accountName: text(raw.accountName, 120),
            accountNumber: text(raw.accountNumber, 80),
            swiftCode: text(raw.swiftCode, 80),
            walletAddress: text(raw.walletAddress, 200),
            network: text(raw.network, 80),
            note: text(raw.note, 300),
          };
        },
      );
      if (new Set(paymentMethods.map((method) => method.id)).size !== paymentMethods.length) {
        throw new Error("Payment method IDs must be unique.");
      }
      return {
        token: text(data.token, 200),
        depositOption,
        withdrawalOption,
        minimumDeposit: numberValue(data.minimumDeposit),
        paymentMethods,
      };
    },
  )
  .handler(async ({ data }) => {
    await assertOpsToken(data.token);
    const { saveSettings } = await import("@/lib/shippy-settings.server");
    await saveSettings({
      depositOption: data.depositOption,
      withdrawalOption: data.withdrawalOption,
      minimumDeposit: data.minimumDeposit,
      paymentMethods: data.paymentMethods,
    });
    return { ok: true as const, paymentMethods: data.paymentMethods };
  });

export const opsSaveAppSettings = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      token: string;
      adminEmail: string;
      emailFrom: string;
      contactEmail: string;
      tawkEnabled: boolean;
      tawkPropertyId: string;
      tawkWidgetId: string;
      tidioPublicKey: string;
      websiteName: string;
      websiteTitle: string;
      websiteUrl: string;
      officeAddress: string;
      whatsappNumber: string;
      yearStarted: string;
      websiteCurrency: string;
      homepageUrl: string;
      logoUrl: string;
      faviconUrl: string;
      newPassword: string;
    }) => {
      const adminEmail = text(data.adminEmail, 120).toLowerCase();
      if (!EMAIL_RE.test(adminEmail)) throw new Error("Enter a valid admin email address.");
      const contactEmail = text(data.contactEmail, 120).toLowerCase();
      if (contactEmail && !EMAIL_RE.test(contactEmail)) {
        throw new Error("Enter a valid contact email address.");
      }
      const newPassword = String(data.newPassword ?? "");
      if (newPassword && newPassword.length < 6) {
        throw new Error("The new password must be at least 6 characters.");
      }
      return {
        token: text(data.token, 200),
        adminEmail,
        emailFrom: text(data.emailFrom, 160),
        contactEmail,
        tawkEnabled: data.tawkEnabled === true,
        tawkPropertyId: text(data.tawkPropertyId, 60),
        tawkWidgetId: text(data.tawkWidgetId, 60),
        tidioPublicKey: text(data.tidioPublicKey, 120),
        websiteName: text(data.websiteName, 80) || "Shippy Express",
        websiteTitle: text(data.websiteTitle, 160),
        websiteUrl: optionalUrl(data.websiteUrl),
        officeAddress: text(data.officeAddress, 200),
        whatsappNumber: text(data.whatsappNumber, 40),
        yearStarted: text(data.yearStarted, 4),
        websiteCurrency: text(data.websiteCurrency, 30),
        homepageUrl: optionalUrl(data.homepageUrl),
        logoUrl: imageValue(data.logoUrl),
        faviconUrl: imageValue(data.faviconUrl),
        newPassword,
      };
    },
  )
  .handler(async ({ data }) => {
    await assertOpsToken(data.token);
    const { hashPassword, opsToken, readSettings, saveSettings, publicSettings } =
      await import("@/lib/shippy-settings.server");
    const current = await readSettings();
    const managers = current.managers.map((manager) =>
      manager.role === "Super Admin" &&
      manager.email.toLowerCase() === current.adminEmail.toLowerCase()
        ? { ...manager, email: data.adminEmail }
        : manager,
    );

    await saveSettings({
      adminEmail: data.adminEmail,
      emailFrom: data.emailFrom,
      contactEmail: data.contactEmail,
      tawkEnabled: data.tawkEnabled,
      tawkPropertyId: data.tawkPropertyId,
      tawkWidgetId: data.tawkWidgetId,
      tidioPublicKey: data.tidioPublicKey,
      websiteName: data.websiteName,
      websiteTitle: data.websiteTitle,
      websiteUrl: data.websiteUrl,
      officeAddress: data.officeAddress,
      whatsappNumber: data.whatsappNumber,
      yearStarted: data.yearStarted,
      websiteCurrency: data.websiteCurrency,
      homepageUrl: data.homepageUrl,
      logoUrl: data.logoUrl,
      faviconUrl: data.faviconUrl,
      managers,
      ...(data.newPassword ? { adminPasswordHash: hashPassword(data.newPassword) } : {}),
    });

    return { ok: true as const, token: await opsToken(), settings: await publicSettings() };
  });

export const getSiteBranding = createServerFn({ method: "GET" }).handler(async () => {
  const { readSettings } = await import("@/lib/shippy-settings.server");
  const settings = await readSettings();
  return {
    websiteName: settings.websiteName || "Shippy Express",
    websiteTitle: settings.websiteTitle,
    websiteUrl: settings.websiteUrl,
    officeAddress: settings.officeAddress,
    whatsappNumber: settings.whatsappNumber,
    contactEmail: settings.contactEmail,
    logoUrl: settings.logoUrl,
    faviconUrl: settings.faviconUrl,
  };
});
