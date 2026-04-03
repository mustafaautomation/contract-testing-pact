import fs from 'fs';
import path from 'path';

const brokerUrl = process.env.PACT_BROKER_URL || 'http://localhost:9292';
const version = process.env.npm_package_version || '1.0.0';

async function publish(): Promise<void> {
  const pactsDir = path.resolve('./pacts');
  if (!fs.existsSync(pactsDir)) {
    console.error('No pacts directory found. Run consumer tests first.');
    process.exit(1);
  }

  const files = fs.readdirSync(pactsDir).filter((f) => f.endsWith('.json'));
  if (files.length === 0) {
    console.error('No pact files found in ./pacts');
    process.exit(1);
  }

  for (const file of files) {
    const pactContent = fs.readFileSync(path.join(pactsDir, file), 'utf-8');
    const pact = JSON.parse(pactContent);
    const consumer = pact.consumer?.name;
    const provider = pact.provider?.name;

    if (!consumer || !provider) {
      console.warn(`Skipping ${file}: missing consumer/provider name`);
      continue;
    }

    const url = `${brokerUrl}/pacts/provider/${provider}/consumer/${consumer}/version/${version}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: pactContent,
    });

    if (res.ok) {
      console.log(`Published ${file} → ${consumer}/${provider} v${version}`);
    } else {
      console.error(`Failed to publish ${file}: ${res.status} ${await res.text()}`);
      process.exit(1);
    }
  }
}

publish();
