import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

// Placeholder data
const data = [
    { label: "A", data: 30 },
    { label: "B", data: 20 },
    { label: "C", data: 15 }
];

function renderGraph(data) {
    const width = 1000;
    const height = 1000;
    const margin = { top: 100, right: 0, bottom: 0, left: 0 };

    const usableArea = {
        top: margin.top,
        left: margin.left,
        right: width - margin.right,
        bottom: height - margin.bottom,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom
    };

    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMinYMin')
        .style('overflow', 'visible')
        .style('width', '50%')
        .style('height', 'auto');

    // Defining the container area
    const container = svg.append('g')
        .attr('transform', `translate(${usableArea.left + usableArea.width / 2}, ${usableArea.top + usableArea.height / 2})`)

    // Settings for the pie chart
    // Slices stores the data and arc visualizes the data on the svg
    const pie = d3.pie().value(d => d.data);
    const radius = width / 2;
    const color = d3.schemeSet1;
    const slices = pie(data);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    // Draws the content
    container.selectAll('path')
        .data(slices)
        .join('path')
        .attr('d', arc)
        .attr('fill', (d, i) => color[i])
        .attr('stroke', 'black')
        .attr('stroke-width', 1);
}

renderGraph(data)