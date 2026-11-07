#!/usr/bin/env node
// Validates version metadata before a Play release. Run: node scripts/check-release-version.mjs
// Exit 1 on any inconsistency. Does NOT know the Play Console/EAS versionCode (it is managed
// remotely by EAS: appVersionSource=remote + autoIncrement) — verify that step in the checklist.
import fs from 'node:fs';
const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const app = JSON.parse(read('app.json')).expo;
const pkg = JSON.parse(read('package.json'));
const eas = JSON.parse(read('eas.json'));
const gradle = read('android/app/build.gradle');
const errs = [];
const semver = /^\d+\.\d+\.\d+$/;

if (!semver.test(app.version)) errs.push(`app.json version "${app.version}" is not MAJOR.MINOR.PATCH`);
if (pkg.version !== app.version) errs.push(`package.json version ${pkg.version} != app.json version ${app.version}`);
if (app.android?.package !== 'com.transvigo.driver') errs.push(`android.package must stay com.transvigo.driver (got ${app.android?.package})`);
const name = gradle.match(/versionName\s+"([^"]+)"/)?.[1];
if (name !== app.version) errs.push(`android/app/build.gradle versionName ${name} != app.json version ${app.version}`);
if (eas.cli?.appVersionSource !== 'remote' || !eas.build?.production?.autoIncrement)
  errs.push('eas.json must keep appVersionSource=remote and production.autoIncrement=true (otherwise versionCode will not increase)');
if (!eas.build?.production?.env?.EXPO_PUBLIC_API_URL?.startsWith('https://'))
  errs.push('production EXPO_PUBLIC_API_URL must be https');
if (/10\.0\.2\.2|localhost/.test(JSON.stringify(eas.build.production))) errs.push('production profile points at a local URL');

if (errs.length) { console.error('Release version check FAILED:\n - ' + errs.join('\n - ')); process.exit(1); }
console.log(`OK  version ${app.version} · package ${app.android.package} · versionCode managed by EAS remote`);
