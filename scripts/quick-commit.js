const { execSync } = require('child_process');

function quickCommit() {
    try {
        // Stage all changes
        console.log('Staging changes...');
        execSync('git add .');

        // Get status to see what changed
        const status = execSync('git status --short').toString();
        if (!status) {
            console.log('No changes to commit.');
            return;
        }

        // Generate a basic message based on files
        const lines = status.split('\n').filter(line => line.trim());
        let message = 'Update: ';
        
        if (lines.length > 5) {
            message += `Modified ${lines.length} files including ${lines[0].slice(3)}`;
        } else {
            message += lines.map(line => line.slice(3)).join(', ');
        }

        // Commit
        console.log(`Committing with message: "${message}"`);
        execSync(`git commit -m "${message}"`);
        
        console.log('✅ Changes committed successfully!');
    } catch (error) {
        console.error('❌ Error during commit:', error.message);
    }
}

quickCommit();
