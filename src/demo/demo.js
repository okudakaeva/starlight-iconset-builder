class DemoView {
    constructor (data) {
        this.allColors = data.colors || [];
        this.allSets = data.sets || [];
        this.filteredColors = this.allColors;
        this.filteredSets = this.allSets;
        this.activeFill = '#232634';
        this.activeFillName = '$sib-obsidian-mist';
        this.notyTimer = null;
        this.debounceTimer = null;

        this.appNode = document.createElement('div');
        this.searchNode = document.createElement('div');
        this.listNode = document.createElement('div');

        this.appNode.id = 'app';
        this.searchNode.id = 'search';
        this.listNode.id = 'list';

        this.appNode.appendChild(this.searchNode);
        this.appNode.appendChild(this.listNode);
        document.body.appendChild(this.appNode);
    }

    contrastYiq (hex) {
        const cleanHex = hex.replace('#', '');
        const fullHex = cleanHex.length === 3
                ? cleanHex.split('').map((c) => c + c).join('')
                : cleanHex;
        const num = parseInt(fullHex, 16);
        const r = (num >>> 16) & 0xff;
        const g = (num >>> 8) & 0xff;
        const b = num & 0xff;
        const yiq = (r * 299 + g * 587 + b * 114) / 1000;
        return yiq >= 128 ? 'black' : 'white';
    }

    buildIconDataUri (svgTemplate, fillHex) {
        const withFill = svgTemplate.replace(/#\{\$fill}/g, fillHex);
        const encoded = encodeURIComponent(withFill)
                .replace(/'/g, '%27')
                .replace(/"/g, '%22');
        return `url("data:image/svg+xml;charset=utf-8,${ encoded }")`;
    }

    escapeHtml (str) {
        return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
    }

    highlightText (text, query) {
        const safeText = this.escapeHtml(text);
        if (!query) return safeText;
        const safeQuery = this.escapeHtml(query);
        const escapedRegex = safeQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedRegex})`, 'ig');
        return safeText.replace(regex, '<span class="highlight">$1</span>');
    }

    async copyText (text, message) {
        if (!navigator.clipboard) {
            this.showNoty('Clipboard API is unavailable in this browser context');
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            this.showNoty(message);
        } catch {
            this.showNoty('Failed to copy to clipboard');
        }
    }

    showNoty (html) {
        let noty = document.querySelector('#noty-overlay');
        if (!noty) {
            noty = document.createElement('div');
            noty.id = 'noty-overlay';
            noty.className = 'noty-overlay';
            this.appNode.appendChild(noty);
        }
        noty.innerHTML = `<span class="noty">${ html }</span>`;

        if (this.notyTimer) clearTimeout(this.notyTimer);
        this.notyTimer = setTimeout(() => {
            noty?.remove();
            this.notyTimer = null;
        }, 3500);
    }

    setActiveFill (hex, varName) {
        this.activeFill = hex;
        this.activeFillName = varName;
        this.updateSearchIndicator();
        this.renderList(this.searchInput?.value.trim() || '');
        this.showNoty(`Preview fill changed to <b>${ varName }</b> (${ hex })`);
    }

    updateSearchIndicator () {
        if (!this.swatchNode || !this.fillLabelNode) return;
        this.swatchNode.style.backgroundColor = this.activeFill;
        this.fillLabelNode.textContent = `Fill: ${ this.activeFillName }`;
    }

    renderSearch () {
        this.searchNode.className = 'search';

        const searchBox = document.createElement('div');
        searchBox.className = 'search-box';

        this.searchInput = document.createElement('input');
        this.searchInput.id = 'search-input';
        this.searchInput.type = 'text';
        this.searchInput.className = 'search-input';
        this.searchInput.placeholder = 'Search icon name, color name or HEX...';
        this.searchInput.autofocus = true;

        this.searchInput.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            if (this.debounceTimer) clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => this.filterAndRender(value), 180);
        });

        searchBox.appendChild(this.searchInput);

        const fillPill = document.createElement('div');
        fillPill.className = 'active-fill-pill';
        this.swatchNode = document.createElement('span');
        this.swatchNode.className = 'swatch';
        this.fillLabelNode = document.createElement('span');

        fillPill.appendChild(this.swatchNode);
        fillPill.appendChild(this.fillLabelNode);

        this.searchNode.appendChild(searchBox);
        this.searchNode.appendChild(fillPill);
        this.updateSearchIndicator();
    }

    filterAndRender (query) {
        if (!query) {
            this.filteredColors = this.allColors;
            this.filteredSets = this.allSets;
        } else {
            const q = query.toLowerCase();
            this.filteredColors = this.allColors.filter(
                    (c) => c.name.toLowerCase().includes(q) || c.hex.toLowerCase().includes(q)
            );
            this.filteredSets = this.allSets
                    .map((set) => ({
                        ...set,
                        icons: set.icons.filter(
                                (icon) =>
                                        icon.name.toLowerCase().includes(q) ||
                                        set.name.toLowerCase().includes(q)
                        ),
                    }))
                    .filter((set) => set.icons.length > 0);
        }
        this.renderList(query);
    }

    createIconBlock (setName, icon, query) {
        const blockNode = document.createElement('div');
        blockNode.className = 'item icon';

        const wrapper = document.createElement('div');
        wrapper.className = 'icon-wrapper';

        const preview = document.createElement('div');
        preview.style.width = icon.width;
        preview.style.height = icon.height;
        preview.style.backgroundRepeat = 'no-repeat';
        preview.style.backgroundPosition = 'center';
        preview.style.backgroundImage = this.buildIconDataUri(icon.svgTemplate, this.activeFill);

        wrapper.appendChild(preview);
        blockNode.appendChild(wrapper);

        if (icon.isMulticolor) {
            const badge = document.createElement('span');
            badge.className = 'badge-color';
            badge.textContent = 'color';
            blockNode.appendChild(badge);
        }

        const isNonStandard = parseInt(icon.width, 10) !== 24 || parseInt(icon.height, 10) !== 24;
        const labelNode = document.createElement('div');
        labelNode.className = 'label font-black';
        labelNode.innerHTML = `${ setName }/${ this.highlightText(icon.name, query) }
			<br/>
			<span class="size ${ isNonStandard ? 'warning-size' : '' }">(${ icon.width } x ${ icon.height })</span>`;

        labelNode.addEventListener('click', async () => {
            await this.copyText(icon.path, `Copied icon path <b>${ icon.path }</b>`);
        });

        blockNode.appendChild(labelNode);
        return blockNode;
    }

    createColorBlock (color, query) {
        const fontColor = this.contrastYiq(color.hex);
        const blockNode = document.createElement('div');
        blockNode.className = 'item color';
        blockNode.style.backgroundColor = color.hex;

        const applyBtn = document.createElement('button');
        applyBtn.type = 'button';
        applyBtn.className = `apply-fill-btn font-${ fontColor }`;
        applyBtn.textContent = 'Preview fill';
        applyBtn.title = 'Apply this color to monochrome icons';
        applyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.setActiveFill(color.hex, color.variable);
        });

        const nameNode = document.createElement('div');
        nameNode.className = `label font-${ fontColor }`;
        nameNode.innerHTML = `$sib-${ this.highlightText(color.name, query) }`;
        nameNode.addEventListener('click', async () => {
            await this.copyText(color.variable, `Copied variable <b>${ color.variable }</b>`);
        });

        const hexNode = document.createElement('div');
        hexNode.className = `label font-${ fontColor }`;
        hexNode.innerHTML = this.highlightText(color.hex, query);
        hexNode.addEventListener('click', async () => {
            await this.copyText(color.hex, `Copied HEX <b>${ color.hex }</b>`);
        });

        blockNode.appendChild(applyBtn);
        blockNode.appendChild(nameNode);
        blockNode.appendChild(hexNode);
        return blockNode;
    }

    renderList (query = '') {
        this.listNode.innerHTML = '';

        // Icons section
        const iconsSection = document.createElement('div');
        iconsSection.className = 'block';
        iconsSection.innerHTML = '<h1>Icons</h1>';

        if (this.filteredSets.length) {
            this.filteredSets.forEach((set) => {
                const setTitle = document.createElement('h2');
                setTitle.textContent = `${ set.name } (${ set.icons.length })`;
                iconsSection.appendChild(setTitle);

                const wrapper = document.createElement('div');
                wrapper.className = `block-wrapper ${ set.name }`;
                set.icons.forEach((icon) => {
                    wrapper.appendChild(this.createIconBlock(set.name, icon, query));
                });
                iconsSection.appendChild(wrapper);
            });
        } else {
            iconsSection.innerHTML += '<div class="nothing-found">No matching icons found</div>';
        }

        // Colors section
        const colorsSection = document.createElement('div');
        colorsSection.className = 'block';
        colorsSection.innerHTML = '<h1>Colors</h1>';

        if (this.filteredColors.length) {
            const wrapper = document.createElement('div');
            wrapper.className = 'block-wrapper';
            this.filteredColors.forEach((color) => {
                wrapper.appendChild(this.createColorBlock(color, query));
            });
            colorsSection.appendChild(wrapper);
        } else {
            colorsSection.innerHTML += '<div class="nothing-found">No matching colors found</div>';
        }

        this.listNode.appendChild(iconsSection);
        this.listNode.appendChild(colorsSection);
    }

    render () {
        this.renderSearch();
        this.renderList();
    }
}

async function init () {
    try {
        const response = await fetch('./generated/demo-data.json');
        if (!response.ok) {
            renderError('Run "npm run build" first to generate demo-data.json');
            return;
        }
        const data = await response.json();
        const app = new DemoView(data);
        app.render();
    } catch (error) {
        renderError(error.message);
    }
}

function renderError (message) {
    document.body.innerHTML = `<div style="padding: 24px; font-family: sans-serif;">
		<h2>Demo data not built yet</h2>
		<p>${ message }</p>
	</div>`;
}

await init();
