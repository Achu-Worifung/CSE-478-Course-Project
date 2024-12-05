// Chart Dimensions
const width3 = 1000;
const height3 = 1200;
const margin3 = 100;

// Ensure D3 is loaded
console.log("d3:", d3);
console.log("d3.select:", d3.select);

// Create SVG Container
const svg3 = d3
    .select("#chart")
    .append("svg")
    .attr("width", width3 + margin3 * 2)
    .attr("height", height3 + margin3 * 2)
    .append("g")
    .attr("transform", `translate(${width3 / 2 + margin3}, ${height3 / 2 + margin3})`);

// Tooltip Container for hover (not used here)
const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("display", "none");

// Load Data
d3.csv("datasets/happiness_data.csv").then((data3) => {
    console.log("Loaded data:", data3); // Debug data loading

    // Populate Year Dropdown
    const yearFilter3 = d3.select("#year-filter");
    const years3 = [...new Set(data3.map((d3) => +d3.year))].sort((a3, b3) => b3 - a3);
    years3.forEach((year3) => {
        yearFilter3.append("option").text(year3).attr("value", year3);
    });

    // Populate Country Dropdown
    const countryFilter3 = d3.select("#country-filter");

    // Reference to the #country-info container
    const countryInfoContainer = d3.select("#country-info");

    // Update Chart
    const updateChart3 = (year3) => {
        const filteredData3 = data3.filter((d3) => +d3.year === year3);

        // Update Country Dropdown
        countryFilter3.html("");
        countryFilter3.append("option").attr("value", "").attr("disabled", true).attr("selected", true).text("Select Country");
        filteredData3.forEach((d3) => {
            countryFilter3.append("option").text(d3["Country name"]).attr("value", d3["Country name"]);
        });

        // Define Scales
        const maxLifeExpectancy3 = d3.max(filteredData3, (d3) => +d3["Healthy life expectancy at birth"]);
        const radiusScale3 = d3.scaleLinear().domain([0, maxLifeExpectancy3]).range([0, width3 / 2 - margin3]);
        const colorScale3 = d3.scaleOrdinal(d3.schemeCategory10);

        // Create Radial Bars
        const arc3 = d3
            .arc()
            .innerRadius(0)
            .outerRadius((d3) => radiusScale3(+d3["Healthy life expectancy at birth"]))
            .startAngle((d3, i3) => (i3 * 2 * Math.PI) / filteredData3.length)
            .endAngle((d3, i3) => ((i3 + 1) * 2 * Math.PI) / filteredData3.length)
            .padAngle(0.01);

        const bars = svg3.selectAll("path")
            .data(filteredData3)
            .join("path")
            .attr("d", arc3)
            .attr("fill", (d3, i3) => colorScale3(i3))
            .attr("stroke", "#fff");

        // Add Labels and Connectors
        const labelRadius = width3 / 2 - margin3 + 50; // Position labels slightly outside the bars
        const labels = svg3.selectAll(".label")
            .data(filteredData3)
            .join("text")
            .attr("class", "label")
            .attr("x", (d3, i3) => {
                const angle = ((i3 + 0.5) * 2 * Math.PI) / filteredData3.length;
                return Math.cos(angle) * labelRadius;
            })
            .attr("y", (d3, i3) => {
                const angle = ((i3 + 0.5) * 2 * Math.PI) / filteredData3.length;
                return Math.sin(angle) * labelRadius;
            })
            .attr("text-anchor", (d3, i3) => {
                const angle = ((i3 + 0.5) * 2 * Math.PI) / filteredData3.length;
                return angle > Math.PI ? "end" : "start"; // Adjust text anchor based on position
            })
            .text((d3) => d3["Country name"])
            .style("font-size", "12px")
            .style("font-family", "Arial");

        const connectors = svg3.selectAll(".connector")
            .data(filteredData3)
            .join("line")
            .attr("class", "connector")
            .attr("x1", (d3, i3) => {
                const angle = ((i3 + 0.5) * 2 * Math.PI) / filteredData3.length;
                return Math.cos(angle) * radiusScale3(+d3["Healthy life expectancy at birth"]);
            })
            .attr("y1", (d3, i3) => {
                const angle = ((i3 + 0.5) * 2 * Math.PI) / filteredData3.length;
                return Math.sin(angle) * radiusScale3(+d3["Healthy life expectancy at birth"]);
            })
            .attr("x2", (d3, i3) => {
                const angle = ((i3 + 0.5) * 2 * Math.PI) / filteredData3.length;
                return Math.cos(angle) * labelRadius;
            })
            .attr("y2", (d3, i3) => {
                const angle = ((i3 + 0.5) * 2 * Math.PI) / filteredData3.length;
                return Math.sin(angle) * labelRadius;
            })
            .attr("stroke", "#ccc")
            .attr("stroke-width", 1);
        
        // Dropdown Selection Highlight and Update #country-info
        countryFilter3.on("change", function () {
            const selectedCountry3 = this.value;
            const selectedData3 = filteredData3.find((d3) => d3["Country name"] === selectedCountry3);

            svg3.selectAll("path").attr("opacity", 1);

            if (selectedData3) {
                svg3.selectAll("path")
                    .filter((d3) => d3["Country name"] === selectedCountry3)
                    .attr("opacity", 0.8);

                // Update #country-info container with selected country's info
                countryInfoContainer.html(
                    `<p><strong>Country:</strong> ${selectedData3["Country name"]}</p>
                    <p><strong>Life Expectancy:</strong> ${selectedData3["Healthy life expectancy at birth"]}</p>
                    <p><strong>Happiness Score:</strong> ${selectedData3["Ladder score"]}</p>
                    <p><strong>GDP (Log):</strong> ${selectedData3["Log GDP per capita"]}</p>`
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
