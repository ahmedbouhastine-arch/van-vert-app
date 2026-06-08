/**
 * One-off repair for applications whose `userId` was overwritten by the
 * (now-removed) auto account-linking migration in /api/auth/session.
 *
 * That migration could reassign an application's `userId` to a different
 * account's uid, locking the original owner out (storage/unauthorized on
 * uploads, etc). Affected docs were stamped with `updatedByMigration: true`
 * and `_migratedFrom: <original uid>`. This script restores `userId` back
 * to `_migratedFrom` for those docs.
 *
 * Usage:
 *   npx tsx scripts/repair-migrated-applications.ts            (dry run, logs only)
 *   npx tsx scripts/repair-migrated-applications.ts --write    (applies the fix)
 */

import admin from 'firebase-admin';
import { adminFirestore } from '../src/firebase/admin-init';

async function main() {
    const shouldWrite = process.argv.includes('--write');

    const snapshot = await adminFirestore
        .collection('applications')
        .where('updatedByMigration', '==', true)
        .get();

    if (snapshot.empty) {
        console.log('No migrated applications found.');
        return;
    }

    console.log(`Found ${snapshot.size} migrated application(s).`);

    const batch = adminFirestore.batch();
    let pending = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const currentUserId = data.userId;
        const originalUserId = data._migratedFrom;

        if (!originalUserId) {
            console.log(`- ${doc.id}: skipping, no _migratedFrom recorded (currently userId=${currentUserId})`);
            continue;
        }

        if (currentUserId === originalUserId) {
            console.log(`- ${doc.id}: already correct (userId=${currentUserId}), skipping`);
            continue;
        }

        console.log(`- ${doc.id}: userId ${currentUserId} -> ${originalUserId}${shouldWrite ? '' : ' (dry run, not applied)'}`);

        if (shouldWrite) {
            batch.update(doc.ref, {
                userId: originalUserId,
                updatedByMigration: admin.firestore.FieldValue.delete(),
                _migratedFrom: admin.firestore.FieldValue.delete(),
            });
            pending++;
        }
    }

    if (shouldWrite && pending > 0) {
        await batch.commit();
        console.log(`Restored userId on ${pending} application(s).`);
    } else if (!shouldWrite) {
        console.log('\nDry run complete. Re-run with --write to apply these changes.');
    }
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Repair script failed:', err);
        process.exit(1);
    });
