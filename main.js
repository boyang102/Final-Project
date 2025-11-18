import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

async function loadData() {
    const dataset = await d3.csv("./data/spotify-2023.csv");
    const data = dataset.map(row => ({ month: Number(row["released_month"]) }));
    return data;
}

// TODO: need to sort this by Month name, and not by value of counts
function countSongs(data) {
    const songCounts = new Array(12).fill(0);

    for (const row of data) {
        const month = row.month;
        if (month >= 1 && month <= 12) {
            // Subtract 1 to match month to index
            songCounts[month - 1]++;
        }
    }
    const monthArr = songCounts.map((count, i) => ({
        month: i + 1,
        count: count
    }));
    return monthArr;
}

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
    const pie = d3.pie().value(d => d.count);
    const radius = width / 2;
    // Add more colors as needed
    const color = d3.schemeCategory10.concat(["#f5f5f7", "#7018a8ff"]);
    const slices = pie(data);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    // Draws the content
    container.selectAll("path")
        .data(slices)
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", (d, i) => color[i])
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .on("mouseover", function (event, d) {
            const centroid = arc.centroid(d);
            const x = centroid[0];
            const y = centroid[1];
            d3.select(this)
                .transition()
                .duration(200)
                .attr("transform", "translate(" + (x * 0.08) + ", " + (y * 0.08) + ")");
        })
        .on("mouseout", function () {
            d3.select(this)
                .transition()
                .duration(300)
                .attr("transform", "translate(0, 0)");
        });

    // TODO: need to add slice labeling

}

const data = await loadData();
const monthView = countSongs(data);

// This is will need to be in a function to change the parameters and show
// different visualizations based on the interactive portal
renderGraph(monthView);


