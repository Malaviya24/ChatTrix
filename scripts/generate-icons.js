#!/usr/bin/env node

/**
 * Icon Generation Script for ChatTrix PWA
 * 
 * This script helps generate the required PNG icons for the PWA manifest.
 * You'll need to have ImageMagick or similar tools installed to convert SVG to PNG.
 * 
 * Prerequisites:
 * - Install ImageMagick: https://imagemagick.org/script/download.php
 * - Or use online converters like: https://convertio.co/svg-png/
 */

const fs = require('fs');
const path = require('path');

const ICON_SIZES = [
  { name: 'icon-192', size: 192 },
  { name: 'icon-512', size: 512 },
  { name: 'icon-512-maskable', size: 512 }
];

const ICONS_DIR = path.join(__dirname, '../public/icons');
const SOURCE_SVG = path.join(__dirname, '../public/globe.svg'); // Using globe.svg as base

console.log('🎨 ChatTrix PWA Icon Generator');
console.log('================================');

// Check if icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  console.log('📁 Creating icons directory...');
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

console.log('📋 Required icon files:');
ICON_SIZES.forEach(icon => {
  const filePath = path.join(ICONS_DIR, `${icon.name}.png`);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${icon.name}.png (${icon.size}x${icon.size}) - exists`);
  } else {
    console.log(`❌ ${icon.name}.png (${icon.size}x${icon.size}) - missing`);
  }
});

console.log('\n🔧 To generate missing icons:');
console.log('1. Use ImageMagick (if installed):');
ICON_SIZES.forEach(icon => {
  console.log(`   magick "${SOURCE_SVG}" -resize ${icon.size}x${icon.size} "${path.join(ICONS_DIR, `${icon.name}.png`)}"`);
});

console.log('\n2. Or use online converters:');
console.log('   - https://convertio.co/svg-png/');
console.log('   - https://cloudconvert.com/svg-to-png');
console.log('   - https://www.icoconverter.com/');

console.log('\n3. For maskable icons, ensure proper padding:');
console.log('   - The icon should have safe zones for different shapes');
console.log('   - Use tools like https://maskable.app/editor to test');

console.log('\n📝 Note: Replace the placeholder README.md in public/icons/ with actual PNG files');
console.log('   The manifest.json has been updated to reference these new icon files.');
