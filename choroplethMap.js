// Global variables
let selectedYear = "2021";
const svg = d3.select("#my_dataviz"),
    width = +svg.attr("width"),
    height = +svg.attr("height");
let loaded_data, topo_data;
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
const tooltip = d3.select(".tooltipchoropleth");

function refreshData(year) {
    year = year.toString();
    selectedYear = year;
    svg.selectAll("*").remove();
    console.log('loaded_data:', loaded_data);

    // Create a native JavaScript Map for the selected year
    const yearData = new Map();
    loaded_data.forEach(d => {
        if (d.year === year) {
            yearData.set(d["Country name"], +d["Ladder score"]);
        }
    });

    console.log("Year data:", yearData);

    // Call ready function with the filtered data
    ready(null, topo_data, yearData);
}




function loadData(year) {
    console.log("Loading data for year:", year);
    year = year.toString();
    selectedYear = year;
    // Load GeoJSON and CSV data using d3.queue()
   
    
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
            loaded_data = csvData
            topo_data = topo

            // Create a map of country data for the selected year
            const yearData = d3.map();
            csvData.forEach(d => {
                if (d.year === year) {
                    yearData.set(d["Country name"], +d["Ladder score"]);
                }
            });
            console.log("Year data:", yearData);
            

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
            .style('border-radius', '5px')
            .html(`
                <strong>${d.properties.name}</strong>
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

// // Create year selector
// function createYearSelector() {
//     const yearSelector = document.getElementById("yearSelector");
//     let html = '<select id="yearSelector">';
//     for (let i = 2005; i <= 2021; i++) {
//         html += `<option value="${i}" ${i === 2021 ? 'selected' : ''}>${i}</option>`;
//     }
//     html += '</select>';
//     yearSelector.innerHTML = html;

//     // Add event listener
//     yearSelector.querySelector('select').addEventListener("change", function(e) {
//         selectedYear = e.target.value;
//         loadData(selectedYear);
//     });
    //radio button
// } 
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
        input.onclick = () => refreshData(i);
        if (i === 2021) input.checked = true;

        const label = document.createElement('label');
        label.htmlFor = `year-${i}`;
        label.className = 'radio-custom';
        label.textContent = i;

        wrapper.appendChild(input);
        wrapper.appendChild(label);
        radioButtons.appendChild(wrapper);
    }

    // Add click event to show selected year (optional)
    // radioButtons.addEventListener('click', (e) => {
    //     if (e.target.classList.contains('radio-custom')) {
    //         const selectedYear = e.target.previousElementSibling.value;
    //         console.log(`Selected Year: ${selectedYear}`);
    //         loadData(selectedYear);
    //     }
    // });
}

// legend
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
        .domain(colorScale.domain()) // [0, 10]
        .range([legendHeight + 10, 10]); 
    const legendAxis = d3.axisRight(legendScale)
        .ticks(5)
        .tickFormat(d3.format(".1f")); 

    // Append axis
    legendSvg.append("g")
        .attr("transform", `translate(${10 + legendWidth}, 0)`) 
        .call(legendAxis);
}





addLegend();
loadData("2021");
createRadioButtons();
