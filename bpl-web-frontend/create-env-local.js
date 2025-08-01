/**
 * Script to create .env.local for frontend from backend .env file
 * This script reads the backend .env file and creates a frontend .env.local file
 * with the appropriate NEXT_PUBLIC_ prefixes
 */

const fs = require('fs');
const path = require('path');

// Paths
const backendEnvPath = path.join(__dirname, '..', 'bpl-web-backend', '.env');
const frontendEnvPath = path.join(__dirname, '.env.local');

// Check if backend .env exists
if (!fs.existsSync(backendEnvPath)) {
    console.error('❌ Backend .env file not found at:', backendEnvPath);
    console.log('📝 Please ensure the backend .env file exists with Supabase credentials');
    process.exit(1);
}

try {
    // Read backend .env file
    const backendEnvContent = fs.readFileSync(backendEnvPath, 'utf8');
    
    // Parse environment variables
    const envVars = {};
    backendEnvContent.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
            const [key, ...valueParts] = trimmedLine.split('=');
            if (key && valueParts.length > 0) {
                // Remove quotes if present
                let value = valueParts.join('=').trim();
                if ((value.startsWith('"') && value.endsWith('"')) || 
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                envVars[key.trim()] = value;
            }
        }
    });

    // Create frontend environment variables
    const frontendEnvLines = [
        '# BPL Web Frontend Environment Variables',
        '# Generated from backend .env file',
        '# Do not edit manually - use create-env-local.js script',
        '',
        '# Supabase Configuration'
    ];

    // Map backend variables to frontend variables
    if (envVars.SUPABASE_URL) {
        frontendEnvLines.push(`NEXT_PUBLIC_SUPABASE_URL=${envVars.SUPABASE_URL}`);
    } else {
        console.warn('⚠️  SUPABASE_URL not found in backend .env');
    }

    if (envVars.SUPABASE_KEY) {
        frontendEnvLines.push(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${envVars.SUPABASE_KEY}`);
    } else {
        console.warn('⚠️  SUPABASE_KEY not found in backend .env');
    }

    // Add note about SERVICE_ROLE_KEY
    frontendEnvLines.push('');
    frontendEnvLines.push('# Note: SERVICE_ROLE_KEY is intentionally NOT included');
    frontendEnvLines.push('# as it should never be exposed to the client-side');

    // Write frontend .env.local file
    const frontendEnvContent = frontendEnvLines.join('\n') + '\n';
    fs.writeFileSync(frontendEnvPath, frontendEnvContent);

    console.log('✅ Successfully created .env.local for frontend!');
    console.log('📁 File location:', frontendEnvPath);
    console.log('');
    console.log('📋 Generated environment variables:');
    if (envVars.SUPABASE_URL) {
        console.log(`   NEXT_PUBLIC_SUPABASE_URL=${envVars.SUPABASE_URL}`);
    }
    if (envVars.SUPABASE_KEY) {
        console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY=${envVars.SUPABASE_KEY.substring(0, 20)}...`);
    }
    console.log('');
    console.log('🚀 You can now run: npm run dev');

} catch (error) {
    console.error('❌ Error creating .env.local:', error.message);
    process.exit(1);
}
