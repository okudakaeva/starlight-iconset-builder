const fs = require('fs');

function getDemoColors (colorsSassPath) {
    if (!fs.existsSync(colorsSassPath)) {
        return [];
    }

    const content = fs.readFileSync(colorsSassPath, 'utf8');
    const colorRegex = /^\$sib-([a-z0-9-]+):\s*(#[0-9a-f]{3,8})/gim;
    const matches = [...content.matchAll(colorRegex)];

    return matches.map((match) => ({
        name: match[1].trim(),
        variable: `$sib-${ match[1].trim() }`,
        hex: match[2].trim().toUpperCase(),
    }));
}

module.exports = { getDemoColors };
