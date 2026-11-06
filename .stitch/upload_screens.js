const fs = require('fs');
const path = require('path');

// Read config to get API key if not provided via env/args
function getApiKey() {
    if (process.env.STITCH_API_KEY) return process.env.STITCH_API_KEY;
    try {
        const configPath = 'C:\\Users\\baobd\\.gemini\\config\\mcp_config.json';
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        return config.mcpServers?.stitch?.headers?.['X-Goog-Api-Key'];
    } catch (e) {
        return null;
    }
}

async function uploadScreen({ projectId, filePath, title, apiKey, apiUrl = 'https://stitch.googleapis.com' }) {
    const fileBuffer = fs.readFileSync(filePath);
    const b64Data = fileBuffer.toString('base64');
    const mimeType = 'text/html';

    const screenObj = {
        htmlCode: {
            fileContentBase64: b64Data,
            mimeType: mimeType
        },
        screenType: 'DOCUMENT',
        isCreatedByClient: true,
        generatedBy: 'stitch::code-to-design',
        title: title
    };

    const payload = {
        parent: `projects/${projectId}`,
        requests: [
            { screen: screenObj }
        ],
        createScreenInstances: true
    };

    const url = `${apiUrl.replace(/\/+$/, '')}/v1/projects/${projectId}/screens:batchCreate`;
    console.log(`Uploading ${title} (${filePath}) to ${url}...`);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP Error ${response.status} (${response.statusText}): ${errText}`);
    }

    const data = await response.json();
    return data;
}

async function main() {
    const args = process.argv.slice(2);
    const projectId = args[0] || '28368742094139923';
    const apiKey = getApiKey();

    if (!apiKey) {
        console.error('Error: Could not find Stitch API Key');
        process.exit(1);
    }

    const loginPath = path.resolve(__dirname, 'login.html');
    const loginAdminPath = path.resolve(__dirname, 'login_admin.html');

    console.log(`Starting sync to project: ${projectId}...`);

    try {
        const res1 = await uploadScreen({
            projectId,
            filePath: loginPath,
            title: 'EVN CDR AS - Đăng nhập Cổng Người dùng (User Login)',
            apiKey
        });
        console.log('Successfully uploaded User Login screen:', JSON.stringify(res1));

        const res2 = await uploadScreen({
            projectId,
            filePath: loginAdminPath,
            title: 'EVN CDR AS - Đăng nhập Cổng Quản trị (Admin Login)',
            apiKey
        });
        console.log('Successfully uploaded Admin Login screen:', JSON.stringify(res2));

        console.log('Sync completed successfully!');
    } catch (err) {
        console.error('Upload failed:', err.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { uploadScreen, getApiKey };
