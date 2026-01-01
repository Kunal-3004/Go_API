window.typeColors = {
    go: "#00ADD8",
    js: "#f7df1e",
    ts: "#3178c6",
    py: "#3776ab",
    dockerfile: "#384d54",
    html: "#e34c26",
    css: "#264de4",
    dart: "#0175C2",
    json: "#fbc02d",
    yaml: "#ffa000",
    md: "#90a4ae",
    txt: "#cfd8dc",
    default: "#ffffff"
};

const loader = document.getElementById('loader');
if (loader) loader.style.display = 'none';

let isHorizontal = true;

const activeBranch =
    typeof branch !== "undefined" && branch !== "" ? branch : "main";

const githubBase = `https://github.com/${owner}/${repo}/blob/${activeBranch}/`;
const container = document.getElementById("main-canvas");


const svg = d3
    .select("#main-canvas")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%");

const g = svg.append("g");

const zoom = d3
    .zoom()
    .scaleExtent([0.05, 5])
    .on("zoom", e => g.attr("transform", e.transform));

svg.call(zoom);


const treeLayout = d3.tree();

let root = d3.hierarchy(treeData, d => {
    const kids = d.children || d.Children;
    if (!kids) return null;
    return typeof kids === "object" && !Array.isArray(kids)
        ? Object.values(kids)
        : kids;
});


function getExtension(data) {
    const name = data.name || data.Name || "";
    if (!name.includes(".")) return name.toLowerCase();
    return name.split(".").pop().toLowerCase();
}

function getFullPath(d) {
    let path = [];
    while (d && d.parent) {
        path.unshift(d.data.name || d.data.Name);
        d = d.parent;
    }
    return path.join("/");
}

function isFolder(d) {
    return (
        (d.children && d.children.length) ||
        (d._children && d._children.length)
    );
}


function resetLayout(root) {
    root.each(d => {
        d.x = null;
        d.y = null;
        d.x0 = null;
        d.y0 = null;
    });
}

function populateLegend() {
    const container = document.getElementById('dynamic-legend');
    if (!container) return;

    container.innerHTML = '';

    Object.entries(window.typeColors).forEach(([ext, color]) => {
        const item = document.createElement('div');
        item.className = 'legend-item';
        
        const label = ext === 'default' ? 'Other' : ext.toUpperCase();
        
        item.innerHTML = `
            <span style="background: ${color}"></span>
            ${label}
        `;
        container.appendChild(item);
    });
}

populateLegend();

function update(source) {
    if (isHorizontal) {
        treeLayout.nodeSize([45, 220]);
    } else {
        treeLayout.nodeSize([140, 80]);
    }

    treeLayout(root);

    const nodes = root.descendants();
    const links = root.links();

    const link = g.selectAll(".link")
        .data(links, d => d.target.id || (d.target.id = Math.random()));

    link.enter()
        .append("path")
        .attr("class", "link")
        .merge(link)
        .transition()
        .duration(600)
        .attr("d", d =>
            isHorizontal
                ? d3.linkHorizontal().x(d => d.y).y(d => d.x)(d)
                : d3.linkVertical().x(d => d.x).y(d => d.y)(d)
        );

    link.exit().remove();

    const node = g.selectAll(".node")
        .data(nodes, d => d.id || (d.id = Math.random()));

    const nodeEnter = node.enter()
        .append("g")
        .attr("class", "node")
        .on("click", (e, d) => {
            if (isFolder(d)) {
                d.children = d.children ? null : d._children;
                resetLayout(root);
                update(d);
            } else {
                window.open(githubBase + getFullPath(d), "_blank");
            }
        });

    nodeEnter.append("circle").attr("r", 6);

    nodeEnter.append("text")
        .attr("class", "label")
        .attr("dy", "0.35em");

    const nodeUpdate = nodeEnter.merge(node)
        .transition()
        .duration(600)
        .attr("transform", d =>
            isHorizontal
                ? `translate(${d.y},${d.x})`
                : `translate(${d.x},${d.y})`
        );

    nodeUpdate.select("text")
        .text(d =>
            (isFolder(d) ? "📁 " : "📄 ") +
            (d.data.name || d.data.Name || "Unknown")
        )
        .attr("x", 10)
        .attr("text-anchor", "start");

    nodeUpdate.select("circle")
    .style("fill", d => {
        if (isFolder(d)) return "#ffd54f";
        const ext = getExtension(d.data);
        if (ext === "default") console.warn("Extension not found for:", d.data.name);
        
        return window.typeColors[ext] || window.typeColors["default"];
    });

    node.exit().remove();
}


function toggleRotation() {
    isHorizontal = !isHorizontal;
    resetLayout(root);
    update(root);
    resetZoom();
}

function resetZoom() {
    if (!container) return;
    const t = isHorizontal
        ? d3.zoomIdentity.translate(100, container.clientHeight / 2).scale(0.7)
        : d3.zoomIdentity.translate(container.clientWidth / 2, 100).scale(0.7);

    svg.transition().duration(700).call(zoom.transform, t);
}

function getExportStyles() {
    let colorStyles = "";
    Object.entries(window.typeColors || {}).forEach(([ext, color]) => {
        colorStyles += `.node-${ext} { fill: ${color}; } `;
    });

    return `
        text { font-family: sans-serif; font-size: 12px; fill: #333; }
        .link { stroke: #ccc; stroke-width: 1.5px; fill: none; opacity: 0.6; }
        circle { stroke-width: 1.5px; stroke: #555; }
        ${colorStyles}
    `;
}

function downloadPNG() {
    const mainGroup = g.node();
    const svgElement = svg.node();
    if (!mainGroup || !svgElement) return;

    const bbox = mainGroup.getBBox();
    const padding = 50;
    const exportWidth = bbox.width + padding * 2;
    const exportHeight = bbox.height + padding * 2;

    const clone = svgElement.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    
    clone.setAttribute("width", exportWidth);
    clone.setAttribute("height", exportHeight);
    clone.setAttribute("viewBox", `${bbox.x - padding} ${bbox.y - padding} ${exportWidth} ${exportHeight}`);

    const cloneGroup = clone.querySelector("g");
    if (cloneGroup) cloneGroup.setAttribute("transform", "");

    const style = document.createElement("style");
    style.innerHTML = getExportStyles();
    clone.insertBefore(style, clone.firstChild);

    const svgData = new XMLSerializer().serializeToString(clone);
    const canvas = document.createElement("canvas");
    const scale = 2;
    canvas.width = exportWidth * scale;
    canvas.height = exportHeight * scale;
    
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
        setTimeout(() => {
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const a = document.createElement("a");
            a.download = `${window.repo || 'repo'}-map.png`;
            a.href = canvas.toDataURL("image/png");
            a.click();
            URL.revokeObjectURL(img.src);
        }, 150);
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
}

function downloadSVG() {
    const mainGroup = g.node(); 
    const svgElement = svg.node();
    if (!mainGroup || !svgElement) return;
    
    const bbox = mainGroup.getBBox();
    const padding = 50;
    
    const svgClone = svgElement.cloneNode(true);
    
    const gClone = svgClone.querySelector("g");
    if (gClone) {
        gClone.removeAttribute("transform"); 
    }

    svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svgClone.setAttribute("width", bbox.width + padding * 2);
    svgClone.setAttribute("height", bbox.height + padding * 2);
    svgClone.setAttribute("viewBox", `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding * 2} ${bbox.height + padding * 2}`);

    let colorCSS = "";
    Object.entries(window.typeColors || {}).forEach(([ext, color]) => {
        colorCSS += `.node-${ext} { fill: ${color}; } `;
    });

    const style = document.createElement("style");
    style.innerHTML = `
        text { font-family: sans-serif; font-size: 12px; fill: #333; }
        .link { stroke: #ccc; stroke-width: 1.5px; fill: none; opacity: 0.6; }
        circle { stroke-width: 1.5px; stroke: #555; }
        .node-folder { fill: #ffd54f; }
        ${colorCSS}
    `;
    svgClone.insertBefore(style, svgClone.firstChild);

    const svgString = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([svgString], {type: "image/svg+xml;charset=utf-8"});
    const link = document.createElement("a");
    link.href = URL.createObjectURL(svgBlob);
    link.download = `${window.repo || 'repository'}-map.svg`;
    link.click();
}

function searchNode() {
    const term = document.getElementById('search-input').value.toLowerCase();
    if (!term) return;

    d3.selectAll(".node").classed("match", false);
    root.each(d => {
        const name = (d.data.name || d.data.Name || "").toLowerCase();
        if (name.includes(term)) {
            let curr = d;
            while (curr.parent) {
                if (curr.parent._children) {
                    curr.parent.children = curr.parent._children;
                    curr.parent._children = null;
                }
                curr = curr.parent;
            }
        }
    });

    resetLayout(root);
    update(root);

    setTimeout(() => {
        const matches = d3.selectAll(".node").filter(d => {
            const name = (d.data.name || d.data.Name || "").toLowerCase();
            return name.includes(term);
        });

        matches.classed("match", true);

        if (!matches.empty()) {
            const d = matches.datum();
            const targetX = isHorizontal ? d.y : d.x;
            const targetY = isHorizontal ? d.x : d.y;
            
            const t = d3.zoomIdentity
                .translate(container.clientWidth / 2 - targetX, container.clientHeight / 2 - targetY)
                .scale(1.2);
            svg.transition().duration(750).call(zoom.transform, t);
        }
    }, 500);
}

function clearSearch() {
    const statsDiv = document.getElementById('stats');
    document.getElementById('search-input').value = '';
    
    if (statsDiv) statsDiv.style.display = 'none';
    d3.selectAll(".node").classed("match", false);
    
    collapseAll(); 
}



function collapse(d) {
    if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
    }
}

function expandAll() {
    root.each(d => {
        if (d._children) {
            d.children = d._children;
            d._children = null;
        }
    });
    resetLayout(root);
    update(root);
}

function collapseAll() {

    const hideChildren = (d) => {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(hideChildren); 
            d.children = null;
        }
    };

    if (root.children) {
        root.children.forEach(hideChildren);
    } else if (root._children) {
        root._children.forEach(hideChildren);
    }

    resetLayout(root);
    update(root);
    resetZoom();
}

if (root.children) {
    root.children.forEach(collapse);
    resetLayout(root);
}

update(root);
resetZoom();
