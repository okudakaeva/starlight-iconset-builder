const fs = require('fs');
const path = require('path');
const { generateAllSets } = require('./core-generator');
const { getDemoColors } = require('./build-colors');

const ROOT_DIR = path.resolve(__dirname, '..');
const LIB_DIR = path.join(ROOT_DIR, 'src', 'lib');
const SETS_DIR = path.join(LIB_DIR, 'sets');
const DEMO_SRC_DIR = path.join(ROOT_DIR, 'src', 'demo');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const DIST_GENERATED_DIR = path.join(DIST_DIR, 'generated');
const COLORS_SASS_PATH = path.join(LIB_DIR, '_colors.sass');

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function encodeSvgDataUri(svgString, fillHex = '#232634') {
    const withFill = svgString.replace(/#\{\$fill}/g, fillHex);
    const encoded = encodeURIComponent(withFill)
            .replace(/'/g, '%27')
            .replace(/"/g, '%22');
    return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

function run() {
    console.log('🌟 Building Starlight Iconset Builder demo into dist/...');
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
    ensureDir(DIST_GENERATED_DIR);

    if (!fs.existsSync(SETS_DIR)) {
        fs.mkdirSync(SETS_DIR, { recursive: true });
    }

    const generatedSets = generateAllSets(SETS_DIR, LIB_DIR);
    const colors = getDemoColors(COLORS_SASS_PATH);
    console.log(`📦 Processed ${generatedSets.length} icon set(s).`);
    console.log(`🎨 Parsed ${colors.length} pastel color(s).`);

    fs.copyFileSync(path.join(DEMO_SRC_DIR, 'index.html'), path.join(DIST_DIR, 'index.html'));
    fs.copyFileSync(path.join(DEMO_SRC_DIR, 'demo.js'), path.join(DIST_DIR, 'demo.js'));

    const demoPayload = {
        generatedAt: new Date().toISOString(),
        colors,
        sets: generatedSets.map(({ setName, icons }) => ({
            name: setName,
            icons: icons.map((icon) => ({
                name: icon.name,
                path: `${setName}/${icon.name}`,
                width: icon.width,
                height: icon.height,
                isMulticolor: icon.isMulticolor,
                svgTemplate: icon.svg,
                previewUrl: encodeSvgDataUri(icon.svg),
            })),
        })),
    };

    fs.writeFileSync(
            path.join(DIST_GENERATED_DIR, 'demo-data.json'),
            JSON.stringify(demoPayload, null, 2),
            'utf8'
    );

    console.log('✅ Static demo ready in dist/');
}

run();
