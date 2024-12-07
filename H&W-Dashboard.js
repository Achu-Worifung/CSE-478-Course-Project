// Chart Dimensions
const width3 = 1000;
const height3 = 1200;
const margin3 = 110;

// Create SVG Container
const svg3 = d3
    .select("#chart")
    .append("svg")
    .attr("width", width3)
    .attr("height", height3)
    .append("g")
    .attr(
        "transform",
        "translate(" + width3 / 2 + "," + (height3 / 2) + ")" // Adjusted for horizontal center and slight top shift
    );
// tooltip1 Container for hover
const tooltip1 = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip1")
    .style("display", "none");

// Load Data
d3.csv("datasets/world-happiness-report-2005-2021.csv", function(error3, data3)  {
    // Handle potential error in D3 v4
    if (error3) throw error3;

    console.log("Loaded data:", data3); // Debug data loading

    // Populate Year Dropdown
    const yearFilter3 = d3.select("#year-filter");
    const years3 = d3.set(data3.map(function(d3) { return +d3.year; })).values().sort(d3.descending);
    years3.forEach(function(year3) {
        yearFilter3.append("option")
            .text(year3)
            .attr("value", year3);
    });

    // Populate Country Dropdown
    const countryFilter3 = d3.select("#country-filter");

    // Reference to the #country-info container
    const countryInfoContainer = d3.select("#country-info");

    // Update Chart
    const updateChart3 = function(year3) {
        const filteredData3 = data3.filter(function(d3) { return +d3.year === year3; });

        // Update Country Dropdown
        countryFilter3.html("");
        countryFilter3.append("option")
            .attr("value", "")
            .attr("disabled", true)
            .attr("selected", true)
            .text("Select Country");
        
        filteredData3.forEach(function(d3) {
            countryFilter3.append("option")
                .text(d3["Country name"])
                .attr("value", d3["Country name"]);
        });

        // Define Scales
        const maxLifeExpectancy3 = d3.max(filteredData3, function(d3) { return +d3["Healthy life expectancy at birth"]; });
        const radiusScale3 = d3.scaleLinear().domain([0, maxLifeExpectancy3]).range([0, width3 / 2 - margin3]);
        const colorScale3 = d3.scaleOrdinal(d3.schemeCategory10);

        // Create Radial Bars
        const arc3 = d3.arc()
            .innerRadius(0)
            .outerRadius(function(d3) { return radiusScale3(+d3["Healthy life expectancy at birth"]); })
            .startAngle(function(d3, i3) { return (i3 * 2 * Math.PI) / filteredData3.length; })
            .endAngle(function(d3, i3) { return ((i3 + 1) * 2 * Math.PI) / filteredData3.length; })
            .padAngle(0.01);

        const bars = svg3.selectAll("path")
            .data(filteredData3)
            .enter().append("path")
            .attr("d", arc3)
            .attr("fill", function(d3, i3) { return colorScale3(i3); })
            .attr("stroke", "#fff");

        // Add Labels and Connectors
        const labelRadius = width3 / 2 - margin3 + 50; // Position labels slightly outside the bars
        const labels = svg3.selectAll(".label")
            .data(filteredData3)
            .enter().append("text")
            .attr("class", "label")
            .attr("x", function(d3, i3) {
                const angle = ((i3 + 0.5) * 2 * Math.PI) / filteredData3.length;
                return Math.cos(angle) * labelRadius;
            })
            .attr("y", function(d3, i3) {
                const angle = ((i3 + 0.5) * 2 * Math.PI) / filteredData3.length;
                return Math.sin(angle) * labelRadius;
            })
            .attr("text-anchor", function(d3, i3) {
                const angle = ((i3 + 0.5) * 2 * Math.PI) / filteredData3.length;
                return angle > Math.PI ? "end" : "start";
            })
            .text(function(d3) { return d3["Country name"]; })
            .style("font-size", "12px")
            .style("font-family", "Arial");

        const connectors = svg3.selectAll(".connector")
            .data(filteredData3)
            .enter().append("line")
            .attr("class", "connector")
            .attr("x1", function(d3, i3) {
                const angle = ((i3 + 0.5) * 2 * Math.PI) / filteredData3.length;
                return Math.cos(angle) * radiusScale3(+d3["Healthy life expectancy at birth"]);
            })
            .attr("y1", function(d3, i3) {
                const angle = ((i3 + 0.5) * 2 * Math.PI) / filteredData3.length;
                return Math.sin(angle) * radiusScale3(+d3["Healthy life expectancy at birth"]);
            })
            .attr("x2", function(d3, i3) {
                const angle = ((i3 + 0.5) * 2 * Math.PI) / filteredData3.length;
                return Math.cos(angle) * labelRadius;
            })
            .attr("y2", function(d3, i3) {
                const angle = ((i3 + 0.5) * 2 * Math.PI) / filteredData3.length;
                return Math.sin(angle) * labelRadius;
            })
            .attr("stroke", "#ccc")
            .attr("stroke-width", 1);
        
        // Dropdown Selection Highlight and Update #country-info
        countryFilter3.on("change", function () {
            const selectedCountry3 = this.value;
            const selectedData3 = filteredData3.filter(function(d3) { 
                return d3["Country name"] === selectedCountry3; 
            })[0];

            svg3.selectAll("path").attr("opacity", 1);

            if (selectedData3) {
                svg3.selectAll("path")
                    .filter(function(d3) { return d3["Country name"] === selectedCountry3; })
                    .attr("opacity", 0.8);

                // Update #country-info container with selected country's info
                countryInfoContainer.html(
                    "<p><strong>Country:</strong> " + selectedData3["Country name"] + "</p>" +
                    "<p><strong>Life Expectancy:</strong> " + selectedData3["Healthy life expectancy at birth"] + "</p>" +
                    "<p><strong>Happiness Score:</strong> " + selectedData3["Ladder score"] + "</p>" +
                    "<p><strong>GDP (Log):</strong> " + selectedData3["Log GDP per capita"] + "</p>"
                );
            } else {
                countryInfoContainer.html("<p>Select a country to see details here.</p>");
            }
        });
    };

    yearFilter3.on("change", function () {
        const selectedYear3 = +this.value;
        updateChart3(selectedYear3);
    });

    // Initialize Chart with the default year (2005)
    const defaultYear3 = 2005;

    // Ensure the dropdown defaults to 2005
    yearFilter3.node().value = defaultYear3;

    // Render the chart for the default year
    updateChart3(defaultYear3);
});