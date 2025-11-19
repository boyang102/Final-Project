import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

let allSongs = [];

/* 
    loadData()
    - Loads the CSV file
    - Right now it ONLY extracts the month column
    - Later we will expand this to include all audio features + streams
*/

async function loadData() {
    // Load full CSV and convert all numeric values
    const dataset = await d3.csv("./data/spotify-2023.csv", d => ({
        track: d["track_name"],
        artist: d["artist(s)_name"],

        // release info
        released_month: +d["released_month"],

        // popularity
        streams: +d["streams"],
        in_spotify_playlists: +d["in_spotify_playlists"],

        // audio features (already % out of 100)
        danceability: +d["danceability_%"],
        energy: +d["energy_%"],
        valence: +d["valence_%"],
        acousticness: +d["acousticness_%"],
        instrumentalness: +d["instrumentalness_%"],
        liveness: +d["liveness_%"],
        speechiness: +d["speechiness_%"]
    }));

    return dataset;
}

// TODO: need to sort this by Month name, and not by value of counts
/*
    countSongs(data)
    - Counts how many songs belong to each month
    - Returns an array of objects: { month: 1..12, count: number }
*/
function countSongs(data) {
    const songCounts = new Array(12).fill(0);

    for (const row of data) {
        const month = row.released_month;
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

/*
    renderGraph(data)
    - Draws your pie chart
    - This stays mostly the same, but later we will add:
        ✓ Click event handler → update month panel
        ✓ Click event handler → update radar chart
*/
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
    })
    // click handler chained correctly, and "click" is lowercase
    .on("click", function (event, d) {
        const selectedMonth = d.data.month;
        updateMonthOverview(selectedMonth);
        updateRadarChart(selectedMonth);
    });

    // --- Add Month Labels ---
    const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    // Label arc slightly larger than the pie
    const labelArc = d3.arc()
        .innerRadius(radius * 0.90)   // inner radius (closer to center)
        .outerRadius(radius * 1.15);  // outer radius (outside the pie)

    container.selectAll(".pie-label")
        .data(slices)
        .enter()
        .append("text")
        .attr("class", "pie-label")
        .attr("transform", d => `translate(${labelArc.centroid(d)})`)
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .style("font-size", "4rem")
        .style("fill", "#f5f5f7")
        .text(d => monthNames[d.data.month - 1]);


}

//Text
function updateMonthOverview(selectedMonth) {

    const container = d3.select("#month-summary");

    if (selectedMonth === null) {
        container.html("<h3>Select a month</h3><p>Click a slice in the chart to explore monthly stats.</p>");
        return;
    }



    // filter songs for selected month
    const monthSongs = allSongs.filter(d => d.released_month === selectedMonth);

    if (monthSongs.length === 0) {
        container.html("<p>No data for this month.</p>");
        return;
    }

    // Compute basic stats
    const avgStreams = d3.mean(monthSongs, d => d.streams);
    const totalStreams = d3.sum(monthSongs, d => d.streams);

    // Compute audio feature averages
    const avgDance = d3.mean(monthSongs, d => d.danceability);
    const avgEnergy = d3.mean(monthSongs, d => d.energy);
    const avgValence = d3.mean(monthSongs, d => d.valence);

    // Find most streamed song
    const topSong = monthSongs.reduce((max, s) =>
        s.streams > max.streams ? s : max
    );

    const monthName = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ][selectedMonth - 1];

    // Write panel HTML
    container.html(`
        <h3>${monthName}</h3>
        <div><strong>${monthSongs.length}</strong> songs released</div>
        <div><strong>${(totalStreams/1e6).toFixed(1)}M</strong> total streams</div>
        <div>Avg streams: <strong>${(avgStreams/1e6).toFixed(1)}M</strong></div>
        <div>Avg danceability: <strong>${avgDance.toFixed(0)}</strong></div>
        <div>Avg energy: <strong>${avgEnergy.toFixed(0)}</strong></div>
        <div>Avg valence: <strong>${avgValence.toFixed(0)}</strong></div>
        <br>
        <div><strong>Top song:</strong> ${topSong.track} – ${topSong.artist}</div>
    `);
}

// Radar chart config
let radarSvg, radarGroup;
const radarSize = 260;
const radarRadius = 100;

function initRadarChart() {
    radarSvg = d3.select("#radar-chart")
        .append("svg")
        .attr("width", radarSize)
        .attr("height", radarSize);

    radarGroup = radarSvg.append("g")
        .attr("transform", `translate(${radarSize/2}, ${radarSize/2})`);

    const levels = [25, 50, 75, 100];

    // Draw background grid circles
    levels.forEach(level => {
        radarGroup.append("circle")
            .attr("r", radarRadius * (level / 100))
            .attr("fill", "none")
            .attr("stroke", "#444")
            .attr("stroke-width", 0.7);
    });

    // Feature axis names
    const features = [
        "Dance", "Energy", "Valence", "Acoustic",
        "Instr.", "Liveness", "Speech"
    ];

    features.forEach((feat, i) => {
        const angle = (Math.PI * 2) / features.length;
        const x = Math.cos(i * angle - Math.PI/2) * (radarRadius + 12);
        const y = Math.sin(i * angle - Math.PI/2) * (radarRadius + 12);

        radarGroup.append("text")
            .attr("x", x)
            .attr("y", y)
            .attr("text-anchor", "middle")
            .style("fill", "#fff")
            .style("font-size", "0.75rem")
            .text(feat);
    });
    // Compute overall average stats once
    const overall = {
        danceability: d3.mean(allSongs, d => d.danceability),
        energy: d3.mean(allSongs, d => d.energy),
        valence: d3.mean(allSongs, d => d.valence),
        acousticness: d3.mean(allSongs, d => d.acousticness),
        instrumentalness: d3.mean(allSongs, d => d.instrumentalness),
        liveness: d3.mean(allSongs, d => d.liveness),
        speechiness: d3.mean(allSongs, d => d.speechiness)
    };

    // Add overall profile (grey background shape)
    radarGroup.append("path")
        .attr("d", radarPath(overall))
        .attr("stroke", "#777")
        .attr("stroke-width", 1.2)
        .attr("fill", "rgba(200,200,200,0.15)");
    }

// Convert stats → polygon path
function radarPath(stats) {
    const features = [
        stats.danceability,
        stats.energy,
        stats.valence,
        stats.acousticness,
        stats.instrumentalness,
        stats.liveness,
        stats.speechiness
    ];

    const angleSlice = (Math.PI * 2) / features.length;
    const rScale = d3.scaleLinear().domain([0, 100]).range([0, radarRadius]);

    const line = d3.lineRadial()
        .radius((d) => rScale(d))
        .angle((d, i) => i * angleSlice)
        .curve(d3.curveCardinalClosed);

    return line(features);
}

function updateRadarChart(selectedMonth) {
    if (selectedMonth === null) {
    return; // do nothing until a month is clicked
}
    const monthSongs = allSongs.filter(d => d.released_month === selectedMonth);

    const stats = {
        danceability: d3.mean(monthSongs, d => d.danceability),
        energy: d3.mean(monthSongs, d => d.energy),
        valence: d3.mean(monthSongs, d => d.valence),
        acousticness: d3.mean(monthSongs, d => d.acousticness),
        instrumentalness: d3.mean(monthSongs, d => d.instrumentalness),
        liveness: d3.mean(monthSongs, d => d.liveness),
        speechiness: d3.mean(monthSongs, d => d.speechiness)
    };

    const path = radarPath(stats);

    // Update or create polygon
    const shape = radarGroup.selectAll("path").data([path]);

    shape.enter()
        .append("path")
        .merge(shape)
        .transition()
        .duration(500)
        .attr("fill", "rgba(79,140,255,0.4)")
        .attr("stroke", "#b3c6ff")
        .attr("stroke-width", 2)
        .attr("d", path);
}

allSongs = await loadData();
const monthView = countSongs(allSongs);

initRadarChart();
updateMonthOverview(null); // show nothing at start

// This is will need to be in a function to change the parameters and show
// different visualizations based on the interactive portal
renderGraph(monthView);


