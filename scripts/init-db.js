const { Client, Databases, Storage, Permission, Role } = require('node-appwrite');

// You can pass the API Key as a command line argument or set it in the script
// Usage: node scripts/init-db.js <API_KEY>
const API_KEY = process.argv[2];

if (!API_KEY) {
    console.error("Please provide the Appwrite API Key as an argument.");
    console.error("Usage: node scripts/init-db.js <API_KEY>");
    process.exit(1);
}

const client = new Client()
    .setEndpoint('https://syd.cloud.appwrite.io/v1')
    .setProject('69577d8c003876f7d5f4')
    .setKey(API_KEY);

const databases = new Databases(client);

const DB_ID = 'labsync_db'; // Using the ID defined in .env

const setup = async () => {
    try {
        console.log(`Checking database ${DB_ID}...`);
        try {
            await databases.get(DB_ID);
            console.log("Database exists and is accessible.");
        } catch (e) {
            console.log(`Could not access database reference: ${e.message}`);
            console.log("Attempting to proceed with collection creation anyway (assuming Database ID is valid)...");
            // If the error was 404 Not Found, we might want to try creating it.
            // But if it was 401, we might just lack permission to 'read' the DB, but can still write collections.
            if (e.code === 404) {
                try {
                    console.log("Database reported missing. Attempting to create...");
                    await databases.create(DB_ID, 'LabSync Database');
                    console.log("Database created successfully.");
                } catch (createErr) {
                    console.error("Failed to create database:", createErr.message);
                }
            }
        }

        // 1. Users Collection
        console.log("Setting up Users collection...");
        try {
            await databases.createCollection(DB_ID, 'users', 'Users');
            console.log("Users collection created.");
        } catch (e) {
            if (e.code === 409) {
                console.log("Users collection already exists.");
            } else {
                console.error(`Failed to create Users collection: ${e.message}`);
            }
        }

        // Helper function to safely create attribute
        const safeCreateAttr = async (fn, name) => {
            try {
                await fn();
                console.log(`  ✓ Created attribute: ${name}`);
            } catch (e) {
                if (e.code === 409) console.log(`  - Attribute exists: ${name}`);
                else console.log(`  ✗ Failed ${name}: ${e.message}`);
            }
        };

        // Attributes for Users
        console.log("Adding user attributes...");
        await safeCreateAttr(() => databases.createStringAttribute(DB_ID, 'users', 'name', 255, true), 'name');
        await safeCreateAttr(() => databases.createEmailAttribute(DB_ID, 'users', 'email', true), 'email');
        await safeCreateAttr(() => databases.createStringAttribute(DB_ID, 'users', 'role', 50, true), 'role');
        await safeCreateAttr(() => databases.createStringAttribute(DB_ID, 'users', 'hackerRankUsername', 255, false), 'hackerRankUsername');
        await safeCreateAttr(() => databases.createBooleanAttribute(DB_ID, 'users', 'hackerRankVerified', false, false), 'hackerRankVerified');
        // New student-specific fields
        await safeCreateAttr(() => databases.createStringAttribute(DB_ID, 'users', 'branch', 50, false), 'branch');
        await safeCreateAttr(() => databases.createStringAttribute(DB_ID, 'users', 'year', 20, false), 'year');
        await safeCreateAttr(() => databases.createStringAttribute(DB_ID, 'users', 'division', 10, false), 'division');
        await safeCreateAttr(() => databases.createStringAttribute(DB_ID, 'users', 'batch', 10, false), 'batch');
        await safeCreateAttr(() => databases.createIntegerAttribute(DB_ID, 'users', 'rollNo', false), 'rollNo');


        // 2. Labs Collection
        console.log("Setting up Labs collection...");
        try {
            await databases.createCollection(DB_ID, 'labs', 'Labs');
            console.log("Labs collection created.");
        } catch (e) {
            if (e.code === 409) console.log("Labs collection already exists.");
            else console.error(`Failed to create Labs collection: ${e.message}`);
        }

        // Attributes for Labs
        console.log("Adding lab attributes...");
        await safeCreateAttr(() => databases.createStringAttribute(DB_ID, 'labs', 'title', 255, true), 'title');
        await safeCreateAttr(() => databases.createStringAttribute(DB_ID, 'labs', 'description', 5000, false), 'description');
        await safeCreateAttr(() => databases.createIntegerAttribute(DB_ID, 'labs', 'labNumber', true), 'labNumber');
        await safeCreateAttr(() => databases.createStringAttribute(DB_ID, 'labs', 'subject', 255, true), 'subject');
        await safeCreateAttr(() => databases.createDatetimeAttribute(DB_ID, 'labs', 'deadline', false), 'deadline');
        await safeCreateAttr(() => databases.createDatetimeAttribute(DB_ID, 'labs', 'startTime', false), 'startTime');
        await safeCreateAttr(() => databases.createStringAttribute(DB_ID, 'labs', 'createdBy', 255, true), 'createdBy');
        // New lab filtering fields
        await safeCreateAttr(() => databases.createStringAttribute(DB_ID, 'labs', 'branch', 50, false), 'branch');
        await safeCreateAttr(() => databases.createStringAttribute(DB_ID, 'labs', 'year', 20, false), 'year');
        await safeCreateAttr(() => databases.createStringAttribute(DB_ID, 'labs', 'division', 10, false), 'division');
        await safeCreateAttr(() => databases.createStringAttribute(DB_ID, 'labs', 'batch', 10, false), 'batch');


        // 3. Problems Collection
        console.log("Setting up Problems collection...");
        try {
            await databases.createCollection(DB_ID, 'problems', 'Problems');
            console.log("Problems collection created.");
        } catch (e) {
            if (e.code === 409) console.log("Problems collection already exists.");
            else console.error(`Failed to create Problems collection: ${e.message}`);
        }

        try {
            await databases.createStringAttribute(DB_ID, 'problems', 'title', 255, true);
            await databases.createStringAttribute(DB_ID, 'problems', 'hackerRankSlug', 255, true);
            await databases.createStringAttribute(DB_ID, 'problems', 'hackerRankUrl', 1000, true);
            await databases.createStringAttribute(DB_ID, 'problems', 'labId', 255, true);
            await databases.createStringAttribute(DB_ID, 'problems', 'difficulty', 50, true);
            await databases.createIntegerAttribute(DB_ID, 'problems', 'points', false, 0);
        } catch (e) { if (e.code !== 409) console.error("Error creating attributes for problems:", e.message); }

        // 4. Submissions Collection
        console.log("Setting up Submissions collection...");
        try {
            await databases.createCollection(DB_ID, 'submissions', 'Submissions');
            console.log("Submissions collection created.");
        } catch (e) {
            if (e.code === 409) console.log("Submissions collection already exists.");
            else console.error(`Failed to create Submissions collection: ${e.message}`);
        }

        console.log("Adding submission attributes...");
        await safeCreateAttr(() => databases.createStringAttribute(DB_ID, 'submissions', 'userId', 255, true), 'userId');
        await safeCreateAttr(() => databases.createStringAttribute(DB_ID, 'submissions', 'problemId', 255, true), 'problemId');
        await safeCreateAttr(() => databases.createStringAttribute(DB_ID, 'submissions', 'labId', 255, true), 'labId');
        await safeCreateAttr(() => databases.createStringAttribute(DB_ID, 'submissions', 'status', 50, true), 'status');
        await safeCreateAttr(() => databases.createStringAttribute(DB_ID, 'submissions', 'language', 100, false), 'language');
        await safeCreateAttr(() => databases.createStringAttribute(DB_ID, 'submissions', 'code', 100000, false), 'code');
        await safeCreateAttr(() => databases.createStringAttribute(DB_ID, 'submissions', 'submissionUrl', 1000, false), 'submissionUrl');
        await safeCreateAttr(() => databases.createDatetimeAttribute(DB_ID, 'submissions', 'submittedAt', false), 'submittedAt');
        await safeCreateAttr(() => databases.createDatetimeAttribute(DB_ID, 'submissions', 'verifiedAt', false), 'verifiedAt');
        await safeCreateAttr(() => databases.createStringAttribute(DB_ID, 'submissions', 'verifiedBy', 255, false), 'verifiedBy');
        await safeCreateAttr(() => databases.createStringAttribute(DB_ID, 'submissions', 'proofFileId', 255, false), 'proofFileId');
        await safeCreateAttr(() => databases.createStringAttribute(DB_ID, 'submissions', 'submissionUrlHash', 255, false), 'submissionUrlHash');

        // Create Unique Index for submissionUrlHash
        try {
            console.log("Creating unique index for submissionUrlHash...");
            // key, type, attributes, orders
            await databases.createIndex(DB_ID, 'submissions', 'unique_submissionUrlHash', 'unique', ['submissionUrlHash'], ['ASC']);
            console.log("  ✓ Created unique index: unique_submissionUrlHash");
        } catch (e) {
            if (e.code === 409) console.log("  - Index exists: unique_submissionUrlHash");
            else console.log(`  ✗ Failed to create index: ${e.message}`);
        }

        // 5. Storage Bucket for Proofs
        console.log("Setting up Storage bucket...");
        const storage = new Storage(client);
        try {
            await storage.createBucket(
                'submission-proofs',
                'Submission Proofs',
                [
                    Permission.create(Role.users()),
                    Permission.read(Role.users()),
                    Permission.update(Role.users()),
                    Permission.delete(Role.users())
                ],
                false,
                true,
                undefined,
                ['jpg', 'jpeg', 'png', 'pdf']
            );
            console.log("Storage bucket created.");
        } catch (e) {
            if (e.code === 409) console.log("Storage bucket already exists.");
            else console.error(`Failed to create storage bucket: ${e.message}`);
        }

        console.log("Database setup complete!");
        console.log("IMPORTANT: Please check Appwrite Console to set Permissions for each collection manually, as basic SDK usage here assumes admin/standard permissions.");

    } catch (error) {
        console.error("Setup failed:", error);
    }
};

setup();
