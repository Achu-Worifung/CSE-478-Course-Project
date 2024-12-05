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
    year = year.toString();
    selectedYear = year;
    
    // Clear existing map
    svg.selectAll("*").remove();

    // Use Promise.all instead of d3.queue
    Promise.all([
        d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
        d3.csv("./datasets/world-happiness-report-2005-2021.csv")
    ]).then(function([topo, csvData]) {
        // Create a map of country data for the selected year
        const yearData = new Map();
        csvData.forEach(d => {
            if (d.year === year) {
                yearData.set(d["Country name"], +d["Ladder score"]);
            }
        });

        ready(null, topo, yearData);
    }).catch(function(error) {
        console.error("Error loading data:", error);
        drawBlankMap();
    });
}

function drawBlankMap() {
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
        .then(function(geoData) {
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
                .on("mouseover", function(event, d) {
                    d3.select(this).transition().duration(200).style("opacity", 1);
                    
                    tooltip.html(`
                        <h3 style="color: red; margin: 0; padding: 0;">Dataset failed to load.</h3>
                        <br> Country name: ${d.properties.name} 
                        <br> Ladder score: undefined 
                        <br> Year: ${selectedYear || "N/A"}
                    `)
                        .style("left", (event.pageX + 5) + "px")
                        .style("top", (event.pageY - 28) + "px")
                        .style("opacity", 1);
                })
                .on("mouseleave", function() {
                    d3.select(this).transition().duration(200).style("opacity", 0.8);
                    tooltip.style("opacity", 0);
                });
        })
        .catch(function(error) {
            console.error("Error loading GeoJSON:", error);
        });
}

function ready(error, topo, yearData) {
    if (error) {
        console.error("Error:", error);
        drawBlankMap();
        return;
    }

    const mouseOver = function(event, d) {
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
            .style('border-radius', '5px')
            .html(`
                <strong>${d.properties.name}</strong>
                <br> Ladder score: ${score}
                <br> Year: ${selectedYear}
            `)
            .style("left", (event.pageX + 5) + "px")
            .style("top", (event.pageY - 28) + "px");
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

function createRadioButtons() {
    const radioButtons = document.getElementById("radioButtons");
    for (let i = 2005; i <= 2021; i++) {
        const wrapper = document.createElement('div');
        wrapper.className = 'radio-wrapper';
        
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'year';
        input.value = i;
        input.id = `year-${i}`;
        input.addEventListener('change', function() {
            if (this.checked) {
                loadData(i);
            }
        });
        if (i === 2021) input.checked = true;

        const label = document.createElement('label');
        label.htmlFor = `year-${i}`;
        label.className = 'radio-custom';
        label.textContent = i;

        wrapper.appendChild(input);
        wrapper.appendChild(label);
        radioButtons.appendChild(wrapper);
    }
}

function addLegend() {
    const legendSvg = d3.select("#chloropleth_legend");
    const legendWidth = 20;  
    const legendHeight = 300;

    // Set SVG dimensions
    legendSvg
        .attr("width", legendWidth + 50) 
        .attr("height", legendHeight + 30); 

    // Create a gradient for the legend
    const defs = legendSvg.append("defs");
    const linearGradient = defs.append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%")
        .attr("x2", "0%")
        .attr("y1", "100%")  
        .attr("y2", "0%");

    // Define color stops for the gradient
    const colorDomain = d3.range(0, 11); 
    colorDomain.forEach((d, i) => {
        linearGradient.append("stop")
            .attr("offset", `${(i / (colorDomain.length - 1)) * 100}%`)
            .attr("stop-color", colorScale(d));
    });

    // Add the gradient rectangle
    legendSvg.append("rect")
        .attr("x", 10)
        .attr("y", 10)
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient)")
        .style("stroke", "black");

    // Add scale labels
    const legendScale = d3.scaleLinear()
        .domain(colorScale.domain())
        .range([legendHeight + 10, 10]); 
    const legendAxis = d3.axisRight(legendScale)
        .ticks(5)
        .tickFormat(d3.format(".1f")); 

    // Append axis
    legendSvg.append("g")
        .attr("transform", `translate(${10 + legendWidth}, 0)`) 
        .call(legendAxis);
        
}

// Initialize the visualization
document.addEventListener('DOMContentLoaded', async function() {
    try {
        addLegend();
        createRadioButtons();
        
        // Wait for the SVG element to be ready
        setTimeout(() => {
            const radio2021 = document.querySelector('input[value="2021"]');
            if (radio2021) {
                radio2021.checked = true;
                loadData("2021");
            }
        }, 500);
    } catch (error) {
        console.error("Initialization error:", error);
    }
});