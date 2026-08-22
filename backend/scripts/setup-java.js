const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

function hasCommand(cmd) {
  try {
    const res = spawnSync(cmd, ['-version'], { stdio: 'ignore' });
    return res.status === 0;
  } catch {
    return false;
  }
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const request = (targetUrl) => {
      https.get(targetUrl, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          return request(response.headers.location);
        }
        if (response.statusCode !== 200) {
          return reject(new Error(`Failed to download JDK: HTTP ${response.statusCode}`));
        }
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      }).on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    };
    request(url);
  });
}

async function setup() {
  if (process.platform !== 'linux') {
    console.log('[setup-java] Non-Linux platform detected; skipping portable Linux JDK setup.');
    return;
  }

  if (hasCommand('javac') && hasCommand('java')) {
    console.log('[setup-java] System JDK (javac and java) is already available.');
    return;
  }

  const binDir = path.join(__dirname, '..', 'bin');
  const jdkDir = path.join(binDir, 'jdk');
  const javacPath = path.join(jdkDir, 'bin', 'javac');

  if (fs.existsSync(javacPath)) {
    console.log(`[setup-java] Portable JDK already installed at ${jdkDir}`);
    return;
  }

  console.log('[setup-java] System javac not found. Downloading portable OpenJDK 21 for Linux...');
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  const tarballPath = path.join(binDir, 'openjdk.tar.gz');
  const downloadUrl = 'https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.2%2B13/OpenJDK21U-jdk_x64_linux_hotspot_21.0.2_13.tar.gz';

  try {
    console.log(`[setup-java] Downloading from ${downloadUrl}...`);
    await downloadFile(downloadUrl, tarballPath);
    console.log('[setup-java] Download complete. Extracting...');

    const tempExtract = path.join(binDir, 'temp_jdk');
    if (fs.existsSync(tempExtract)) fs.rmSync(tempExtract, { recursive: true, force: true });
    fs.mkdirSync(tempExtract, { recursive: true });

    execSync(`tar -xzf "${tarballPath}" -C "${tempExtract}"`);

    const extractedFolders = fs.readdirSync(tempExtract);
    const innerJdkDir = path.join(tempExtract, extractedFolders[0]);

    if (fs.existsSync(jdkDir)) fs.rmSync(jdkDir, { recursive: true, force: true });
    fs.renameSync(innerJdkDir, jdkDir);

    fs.rmSync(tempExtract, { recursive: true, force: true });
    fs.rmSync(tarballPath, { force: true });

    execSync(`chmod -R +x "${path.join(jdkDir, 'bin')}"`);

    console.log(`[setup-java] Successfully installed OpenJDK 21 to ${jdkDir}`);
  } catch (err) {
    console.warn('[setup-java] Portable JDK download/extraction failed:', err.message);
  }
}

setup();
