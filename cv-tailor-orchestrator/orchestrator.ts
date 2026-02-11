import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { runAllTests, CheckpointTest, TestResult } from './verifiers/verify-common';

// ═══════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════

interface OrchestratorConfig {
    project_path: string;
    blocks_dir: string;
    templates_dir: string;
    state_dir: string;
    output_dir: string;
    agent_mode: 'clipboard' | 'file' | 'api';
    agent_api_url?: string;
    agent_api_key?: string;
    auto_advance: boolean;
    status_check_interval: number;
    max_retries: number;
}

const CONFIG: OrchestratorConfig = {
    project_path: path.resolve(__dirname, '../cv-tailor-app'),
    blocks_dir: path.resolve(__dirname, 'blocks'),
    templates_dir: path.resolve(__dirname, 'templates'),
    state_dir: path.resolve(__dirname, 'state'),
    output_dir: path.resolve(__dirname, 'output'),
    agent_mode: 'file',
    auto_advance: false,
    status_check_interval: 5,
    max_retries: 3
};

// ═══════════════════════════════════════════
// STATE MANAGEMENT
// ═══════════════════════════════════════════

interface BlockState {
    status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'skipped';
    started_at: string | null;
    completed_at: string | null;
    attempts: number;
    test_results: TestResult[];
    files_created: string[];
    files_modified: string[];
    errors: string[];
}

interface ProjectState {
    project_name: string;
    current_block: string | null;
    started_at: string;
    last_updated: string;
    blocks: Record<string, BlockState>;
    file_registry: Record<string, {
        path: string;
        created_by: string;
        modified_by: string[];
        exists: boolean;
    }>;
}

function loadState(): ProjectState {
    const statePath = path.join(CONFIG.state_dir, 'tracker.json');
    if (fs.existsSync(statePath)) {
        return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    }
    return initState();
}

function saveState(state: ProjectState): void {
    state.last_updated = new Date().toISOString();
    const statePath = path.join(CONFIG.state_dir, 'tracker.json');
    fs.mkdirSync(CONFIG.state_dir, { recursive: true });
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function initState(): ProjectState {
    const blockFiles = fs.readdirSync(CONFIG.blocks_dir)
        .filter(f => f.endsWith('.yaml'))
        .sort();

    const blocks: Record<string, BlockState> = {};
    for (const file of blockFiles) {
        const blockId = file.replace('.yaml', '');
        blocks[blockId] = {
            status: 'pending',
            started_at: null,
            completed_at: null,
            attempts: 0,
            test_results: [],
            files_created: [],
            files_modified: [],
            errors: []
        };
    }

    return {
        project_name: 'cv-tailor-app',
        current_block: null,
        started_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        blocks,
        file_registry: {}
    };
}

// ═══════════════════════════════════════════
// BLOCK LOADER
// ═══════════════════════════════════════════

interface BlockDefinition {
    id: string;
    name: string;
    phase: number;
    phase_name: string;
    goal: string;
    dependencies: string[];
    files_to_create: { id: string; path: string; content?: string }[];
    files_to_modify?: { id: string; path: string }[];
    files_available?: { id: string; path: string; from_block: string }[];
    commands?: string[];
    instructions?: string;
    checkpoint_tests: CheckpointTest[];
    max_retries: number;
}

function loadBlock(blockId: string): BlockDefinition {
    const blockPath = path.join(CONFIG.blocks_dir, `${blockId}.yaml`);
    if (!fs.existsSync(blockPath)) {
        throw new Error(`Block file not found: ${blockPath}`);
    }
    const content = fs.readFileSync(blockPath, 'utf-8');
    try {
        return yaml.parse(content);
    } catch (e) {
        console.error(`Failed to parse block: ${blockId}`);
        throw e;
    }
}

function getBlockOrder(): string[] {
    return fs.readdirSync(CONFIG.blocks_dir)
        .filter(f => f.endsWith('.yaml'))
        .map(f => f.replace('.yaml', ''))
        .sort((a, b) => {
            const numA = parseInt(a.replace('B', ''));
            const numB = parseInt(b.replace('B', ''));
            return numA - numB;
        });
}

// ═══════════════════════════════════════════
// PROMPT BUILDER
// ═══════════════════════════════════════════

function buildPrompt(block: BlockDefinition, state: ProjectState): string {
    // Use built-in template as fallback if file missing
    let template = '';
    const templatePath = path.join(CONFIG.templates_dir, 'block-prompt.md');
    if (fs.existsSync(templatePath)) {
        template = fs.readFileSync(templatePath, 'utf-8');
    }

    const completedBlocks = Object.entries(state.blocks)
        .filter(([_, s]) => s.status === 'passed')
        .map(([id, s]) => {
            const b = loadBlock(id);
            const files = s.files_created.map(f => `[${f}]`).join(', ');
            return `- ${id} ✅: ${b.name} — Files: ${files}`;
        })
        .join('\n');

    const filesToCreate = block.files_to_create
        .map(f => `[${f.id}] ${f.path}`)
        .join('\n');

    const filesToModify = (block.files_to_modify || []).length > 0
        ? block.files_to_modify!.map(f => `[${f.id}] ${f.path}`).join('\n')
        : 'None';

    const availableFiles = Object.entries(state.file_registry)
        .filter(([_, info]) => info.exists)
        .map(([id, info]) => `[${id}] ${info.path} (from ${info.created_by})`)
        .join('\n') || 'None — this is the first block.';

    const commands = (block.commands || []).length > 0
        ? block.commands!.map(c => `\`\`\`\n${c}\n\`\`\``).join('\n')
        : '';

    const tests = block.checkpoint_tests
        .map(t => `□ [${t.id}] ${t.description}`)
        .join('\n');

    const fileContents = (block.files_to_create || [])
        .filter(f => f.content)
        .map(f => `### [${f.id}] ${f.path}\n\`\`\`typescript\n${f.content}\n\`\`\``)
        .join('\n\n');

    let prompt = `# BLOCK ${block.id}: ${block.name}\n\n`;
    prompt += `## COMPLETED BLOCKS\n${completedBlocks || 'None yet'}\n\n`;
    prompt += `## GOAL\n${block.goal}\n\n`;
    prompt += `## FILES TO CREATE\n${filesToCreate}\n\n`;
    prompt += `## FILES TO MODIFY\n${filesToModify}\n\n`;
    prompt += `## EXISTING FILES YOU MAY IMPORT FROM\n${availableFiles}\n\n`;
    prompt += `## FILES YOU MUST NOT TOUCH\nEverything not listed above.\n\n`;

    if (commands) {
        prompt += `## COMMANDS TO RUN\n${commands}\n\n`;
    }

    if (fileContents) {
        prompt += `## EXACT FILE CONTENTS\n${fileContents}\n\n`;
    }

    if (block.instructions) {
        prompt += `## INSTRUCTIONS\n${block.instructions}\n\n`;
    }
    prompt += `## CHECKPOINT TESTS (verify ALL after completion)\n${tests}\n\n`;

    prompt += `## MANDATORY RULES\n`;
    prompt += `1. Create ONLY the files listed in "FILES TO CREATE"\n`;
    prompt += `2. Modify ONLY the files listed in "FILES TO MODIFY"\n`;
    prompt += `3. NEVER import from files not in "EXISTING FILES"\n`;
    prompt += `4. NEVER reference files that don't exist\n`;
    prompt += `5. After completion, list every file you created/modified with full path\n`;
    prompt += `6. Mark each checkpoint test as ✅ PASS or ❌ FAIL\n`;
    prompt += `7. If unsure about anything, ASK — don't guess\n`;
    prompt += `8. Keep each file under 200 lines\n`;
    prompt += `9. All user-facing text must use i18n (if i18n is set up)\n`;
    prompt += `10. Handle errors gracefully\n`;

    return prompt;
}

function buildFixPrompt(block: BlockDefinition, failedTests: TestResult[]): string {
    let prompt = `# FIX REQUIRED FOR BLOCK ${block.id}\n\n`;
    prompt += `## FAILED TESTS\n`;
    for (const t of failedTests) {
        prompt += `### ❌ [${t.test_id}] ${t.description}\n`;
        if (t.error) prompt += `**Error:** ${t.error}\n`;
        if (t.actual_output) prompt += `**Got:** ${t.actual_output}\n`;
        if (t.expected_output) prompt += `**Expected:** ${t.expected_output}\n`;
        prompt += '\n';
    }
    prompt += `## FILES YOU MAY MODIFY TO FIX\n`;
    const allFiles = [
        ...block.files_to_create.map(f => `[${f.id}] ${f.path}`),
        ...(block.files_to_modify || []).map(f => `[${f.id}] ${f.path}`)
    ];
    prompt += allFiles.join('\n') + '\n\n';
    prompt += `## RULES\n`;
    prompt += `- Fix ONLY the issues listed above\n`;
    prompt += `- Do NOT change any other files\n`;
    prompt += `- Do NOT refactor or improve unrelated code\n`;
    prompt += `- After fixing, re-verify all checkpoint tests\n`;
    return prompt;
}

function buildStatusCheck(state: ProjectState): string {
    const blockOrder = getBlockOrder();
    const completed = blockOrder.filter(id => state.blocks[id]?.status === 'passed');
    const total = blockOrder.length;

    let check = `# STATUS CHECK\n\n`;
    check += `## Completed Blocks (${completed.length}/${total})\n`;
    for (const id of completed) {
        const block = loadBlock(id);
        const blockState = state.blocks[id];
        const files = blockState.files_created.join(', ');
        check += `- ${id} ✅: ${block.name} — [${files}]\n`;
    }
    check += `\n## All Existing Files (${Object.keys(state.file_registry).length} files)\n`;
    for (const [fileId, info] of Object.entries(state.file_registry)) {
        if (info.exists) {
            check += `- [${fileId}] ${info.path}\n`;
        }
    }
    const nextBlock = blockOrder.find(id => state.blocks[id]?.status === 'pending');
    if (nextBlock) {
        const nb = loadBlock(nextBlock);
        check += `\n## Next Block\n${nextBlock}: ${nb.name}\n`;
    }
    check += `\nConfirm this matches your understanding, then I'll give you the next block.\n`;
    return check;
}

// ═══════════════════════════════════════════
// MAIN ORCHESTRATOR LOGIC
// ═══════════════════════════════════════════

function checkDependencies(block: BlockDefinition, state: ProjectState): { satisfied: boolean; missing: string[] } {
    const missing = (block.dependencies || []).filter(dep => state.blocks[dep]?.status !== 'passed');
    return { satisfied: missing.length === 0, missing };
}

function updateFileRegistry(state: ProjectState, block: BlockDefinition): void {
    for (const file of block.files_to_create) {
        state.file_registry[file.id] = {
            path: file.path,
            created_by: block.id,
            modified_by: [],
            exists: true
        };
    }
    for (const file of (block.files_to_modify || [])) {
        if (state.file_registry[file.id]) {
            state.file_registry[file.id].modified_by.push(block.id);
        }
    }
}

async function processBlock(blockId: string): Promise<void> {
    const state = loadState();
    const block = loadBlock(blockId);

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  BLOCK ${block.id}: ${block.name}`);
    console.log(`  Phase ${block.phase}: ${block.phase_name}`);
    console.log(`${'═'.repeat(60)}\n`);

    const deps = checkDependencies(block, state);
    if (!deps.satisfied) {
        console.error(`❌ Dependencies not met: ${deps.missing.join(', ')}`);
        return;
    }
    console.log('✅ Dependencies satisfied');

    const prompt = buildPrompt(block, state);
    fs.mkdirSync(CONFIG.output_dir, { recursive: true });
    const promptPath = path.join(CONFIG.output_dir, `prompt-${blockId}.md`);
    fs.writeFileSync(promptPath, prompt);
    console.log(`📝 Prompt saved to: ${promptPath}`);

    switch (CONFIG.agent_mode) {
        case 'clipboard':
            await copyToClipboard(prompt);
            console.log('📋 Prompt copied to clipboard!');
            break;
        case 'file':
            console.log(`📄 Prompt written to: ${promptPath}`);
            break;
    }

    state.current_block = blockId;
    if (!state.blocks[blockId]) state.blocks[blockId] = { status: 'pending', started_at: null, completed_at: null, attempts: 0, test_results: [], files_created: [], files_modified: [], errors: [] };
    state.blocks[blockId].status = 'in_progress';
    state.blocks[blockId].started_at = new Date().toISOString();
    state.blocks[blockId].attempts += 1;
    saveState(state);
}

async function verifyBlock(blockId: string): Promise<void> {
    const state = loadState();
    const block = loadBlock(blockId);
    console.log(`\n🔍 Verifying Block ${blockId}...\n`);
    const { all_passed, results, summary } = runAllTests(block.checkpoint_tests);
    console.log(summary);
    console.log(`\n${'─'.repeat(40)}`);
    state.blocks[blockId].test_results = results;

    if (all_passed) {
        console.log(`\n✅ BLOCK ${blockId} PASSED!\n`);
        state.blocks[blockId].status = 'passed';
        state.blocks[blockId].completed_at = new Date().toISOString();
        state.blocks[blockId].files_created = block.files_to_create.map(f => f.id);
        state.blocks[blockId].files_modified = (block.files_to_modify || []).map(f => f.id);
        updateFileRegistry(state, block);
        saveState(state);

        const completedCount = Object.values(state.blocks).filter(b => b.status === 'passed').length;
        if (completedCount % CONFIG.status_check_interval === 0) {
            const statusCheck = buildStatusCheck(state);
            const statusPath = path.join(CONFIG.output_dir, `status-check-after-${blockId}.md`);
            fs.writeFileSync(statusPath, statusCheck);
            console.log(`📊 Status check saved to: ${statusPath}`);
        }

        const nextBlock = findNextBlock(state);
        if (nextBlock) {
            console.log(`\n➡️  Next block: ${nextBlock}`);
            if (CONFIG.auto_advance) await processBlock(nextBlock);
        } else {
            console.log(`\n🎉 ALL BLOCKS COMPLETED!`);
        }
    } else {
        const failedTests = results.filter(r => !r.passed);
        console.log(`\n❌ BLOCK ${blockId} FAILED (${failedTests.length} tests failed)\n`);
        state.blocks[blockId].status = 'failed';
        state.blocks[blockId].errors.push(...failedTests.map(t => `[${t.test_id}] ${t.error || t.actual_output}`));
        saveState(state);

        if (state.blocks[blockId].attempts < (block.max_retries || CONFIG.max_retries)) {
            const fixPrompt = buildFixPrompt(block, failedTests);
            const fixPath = path.join(CONFIG.output_dir, `fix-${blockId}-attempt${state.blocks[blockId].attempts}.md`);
            fs.writeFileSync(fixPath, fixPrompt);
            console.log(`🔧 Fix prompt saved to: ${fixPath}`);
            if (CONFIG.agent_mode === 'clipboard') await copyToClipboard(fixPrompt);
        } else {
            console.log(`\n⛔ Max retries reached for ${blockId}`);
        }
    }
}

function findNextBlock(state: ProjectState): string | null {
    const blockOrder = getBlockOrder();
    for (const blockId of blockOrder) {
        if (state.blocks[blockId]?.status === 'pending') {
            const block = loadBlock(blockId);
            const deps = checkDependencies(block, state);
            if (deps.satisfied) return blockId;
        }
    }
    return null;
}

function showDashboard(): void {
    const state = loadState();
    const blockOrder = getBlockOrder();
    console.log(`\n${'═'.repeat(60)}`);
    console.log('  CV TAILOR — ORCHESTRATOR DASHBOARD');
    console.log(`${'═'.repeat(60)}\n`);
    const statusIcons: Record<string, string> = { pending: '⬜', in_progress: '🔨', passed: '✅', failed: '❌', skipped: '⏭️' };
    let currentPhase = -1;
    for (const blockId of blockOrder) {
        const block = loadBlock(blockId);
        if (!block) continue;
        const blockState = state.blocks[blockId];
        const icon = statusIcons[blockState?.status || 'pending'];
        if (block.phase !== currentPhase) {
            currentPhase = block.phase;
            console.log(`\n── Phase ${block.phase}: ${block.phase_name} ──`);
        }
        const attempts = blockState?.attempts ? ` (attempts: ${blockState.attempts})` : '';
        console.log(`  ${icon} ${blockId}: ${block.name}${attempts}`);
    }
    const completed = Object.values(state.blocks).filter(b => b.status === 'passed').length;
    const total = blockOrder.length;
    const percentage = Math.round((completed / total) * 100);
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`  Progress: ${completed}/${total} (${percentage}%)`);
    console.log(`  Files created: ${Object.keys(state.file_registry).length}`);
    const nextBlock = findNextBlock(state);
    if (nextBlock) console.log(`  Next: ${nextBlock}`);
    console.log(`${'═'.repeat(60)}\n`);
}

async function copyToClipboard(text: string): Promise<void> {
    const { execSync } = require('child_process');
    const platform = process.platform;
    try {
        if (platform === 'darwin') execSync('pbcopy', { input: text });
        else if (platform === 'win32') execSync('clip', { input: text });
        else execSync('xclip -selection clipboard', { input: text });
    } catch {
        console.log('⚠️  Could not copy to clipboard. Use the saved file instead.');
    }
}

const command = process.argv[2];
const arg = process.argv[3];

(async () => {
    switch (command) {
        case 'init':
            const freshState = initState();
            saveState(freshState);
            console.log('✅ Orchestrator initialized');
            showDashboard();
            break;
        case 'dashboard':
        case 'status':
            showDashboard();
            break;
        case 'block':
            if (!arg) console.error('Usage: npm run block <blockId>');
            else await processBlock(arg);
            break;
        case 'verify':
            if (!arg) console.error('Usage: npm run verify <blockId>');
            else await verifyBlock(arg);
            break;
        case 'next':
            const nextId = findNextBlock(loadState());
            if (nextId) await processBlock(nextId);
            else console.log('🎉 No next block found or all completed!');
            break;
        default:
            console.log('Usage: npm run [init|dashboard|block|verify|next]');
    }
})();
