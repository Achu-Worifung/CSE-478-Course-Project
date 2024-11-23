// Global variables
let selectedYear = "2021";
const svg = d3.select("#my_dataviz"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

// Define projection and path generator
const projection = d3
    .geoMercator()
    .scale(100)
    .center([0, 20])
    .translate([width / 2, height / 2]);
const path = d3.geoPath().projection(projection);

// Define color scale
const colorScale = d3
    .scaleSequential()
    .domain([0, 10])
    .interpolator(d3.interpolateBlues);

// Create tooltip
const tooltip = d3.select(".tooltip");

function loadData(year) {
    console.log("Loading data for year:", year);
    
    // Clear existing map
    svg.selectAll("*").remove();

    // Load GeoJSON and CSV data using d3.queue()
    d3.queue()
        .defer(d3.json, "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
        .defer(d3.csv, "./datasets/world-happiness-report-2005-2021.csv")
        .await(function(error, topo, csvData) {
            if (error) {
                console.error("Error loading data:", error);
                drawBlankMap();
                return;
            }

            // Create a map of country data for the selected year
            const yearData = d3.map();
            csvData.forEach(d => {
                if (d.year === year) {
                    yearData.set(d["Country name"], +d["Ladder score"]);
                }
            });

            ready(null, topo, yearData);
        });
}

function drawBlankMap() {
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson", function(error, geoData) {
        if (error) {
            console.error("Error loading GeoJSON:", error);
            return;
        }

        svg.append("g")
            .selectAll("path")
            .data(geoData.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("class", "Country")
            .style("fill", "lightgray")
            .style("stroke", "black")
            .style("opacity", 0.8)
            .on("mouseover", function(d) {
                d3.select(this).transition().duration(200).style("opacity", 1);
                
                tooltip.html(`
                    <h3 style="color: red; margin: 0; padding: 0;">Dataset failed to load.</h3>
                    <br> Country name: ${d.properties.name} 
                    <br> Ladder score: undefined 
                    <br> Year: ${selectedYear || "N/A"}
                `)
                    .style("left", (d3.event.pageX + 5) + "px")
                    .style("top", (d3.event.pageY - 28) + "px")
                    .style("opacity", 1);
            })
            .on("mouseleave", function() {
                d3.select(this).transition().duration(200).style("opacity", 0.8);
                tooltip.style("opacity", 0);
            });
    });
}

function ready(error, topo, yearData) {
    if (error) {
        console.error("Error:", error);
        drawBlankMap();
        return;
    }

    const mouseOver = function(d) {
        d3.selectAll(".Country")
            .transition()
            .duration(200)
            .style("opacity", 0.5);

        d3.select(this)
            .transition()
            .duration(200)
            .style("opacity", 1)
            .style("stroke", "black");

        const score = yearData.get(d.properties.name) || "No data";
        tooltip
            .style("opacity", 1)
            .html(`
                Country name: ${d.properties.name}
                <br> Ladder score: ${score}
                <br> Year: ${selectedYear}
            `)
            .style("left", (d3.event.pageX + 5) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
    };

    const mouseLeave = function() {
        d3.selectAll(".Country")
            .transition()
            .duration(200)
            .style("opacity", 0.8);

        d3.select(this)
            .transition()
            .duration(200)
            .style("stroke", "transparent");

        tooltip.style("opacity", 0);
    };

    // Draw the map
    svg.append("g")
        .selectAll("path")
        .data(topo.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "Country")
        .attr("fill", function(d) {
            const score = yearData.get(d.properties.name) || 0;
            return colorScale(score);
        })
        .style("stroke", "black")
        .style("opacity", 0.8)
        .on("mouseover", mouseOver)
        .on("mouseleave", mouseLeave);
}

// Create year selector
function createYearSelector() {
    const yearSelector = document.getElementById("yearSelector");
    let html = '<select id="yearSelector">';
    for (let i = 2005; i <= 2021; i++) {
        html += `<option value="${i}" ${i === 2021 ? 'selected' : ''}>${i}</option>`;
    }
    html += '</select>';
    yearSelector.innerHTML = html;

    // Add event listener
    yearSelector.querySelector('select').addEventListener("change", function(e) {
        selectedYear = e.target.value;
        loadData(selectedYear);
    });
}

// Initialize the visualization
createYearSelector();
loadData("2021");