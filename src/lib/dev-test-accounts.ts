// Dev-only seed accounts for exercising each permission level locally.
// Never honored in production — gated by isDevTestAccount.
export const DEV_TEST_ACCOUNTS: Record<string, 'user' | 'reviewer' | 'admin' | 'head-admin'> = {
    '1@dev.va': 'user',
    '2@dev.va': 'reviewer',
    '3@dev.va': 'admin',
    '4@dev.va': 'head-admin',
};

export const isDevTestAccount = (email: string): email is keyof typeof DEV_TEST_ACCOUNTS =>
    process.env.NODE_ENV !== 'production' && email in DEV_TEST_ACCOUNTS;
