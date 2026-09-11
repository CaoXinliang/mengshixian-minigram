const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const projectConfig = JSON.parse(fs.readFileSync(path.join(root, 'project.config.json'), 'utf8'));
const runtimeConfig = fs.readFileSync(path.join(root, 'miniapp/services/config.js'), 'utf8');
const appSource = fs.readFileSync(path.join(root, 'miniapp/app.js'), 'utf8');

assert.strictEqual(projectConfig.appid, 'wx27547adf77c95bde', 'the cutover gate must target the confirmed mini-program AppID');
assert.match(runtimeConfig, /provider:\s*'cloudbase'/, 'the verified demonstration build must use CloudBase rather than silently falling back to mock data');
assert.match(runtimeConfig, /cloudEnvId:\s*'cloud1-d8gp843lt5454ada7'/, 'the cutover must use the confirmed CloudBase environment ID');
assert.match(appSource, /runtimeConfig\.provider !== 'cloudbase'/, 'CloudBase initialization must be provider-gated');
assert.match(appSource, /!runtimeConfig\.cloudEnvId/, 'CloudBase initialization must require an explicit environment ID');

console.log('cloudbase cutover guard test: passed');
