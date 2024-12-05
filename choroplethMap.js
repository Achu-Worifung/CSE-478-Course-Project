let scopedD3; // Variable to hold the scoped D3 instance
let selectedYear = "2021";

function loadScopedD3(callback) {
    const script = document.createElement("script");
    script.src = "https://d3js.org/d3.v5.min.js";
    script.onload = () => {
        scopedD3 = window.d3; // Assign scoped D3 instance
        console.log("Scoped D3 loaded.");
        callback();
    };
    document.head.appendChild(script);
}

function loadData(year) {
    console.log("Loading data for year:", year);
    year = year.toString();
    selectedYear = year;

    const svg = scopedD3.select("#my_dataviz");
    svg.selectAll("*").remove(); // Clear existing map

    Promise.all([
        scopedD3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
        fetch("./datasets/world-happiness-report-2005-2021.csv")
            .then(response => response.text())
            .then(text => scopedD3.csvParse(text))
    ])
        .then(function ([topo, csvData]) {
            console.log("GeoJSON Data Loaded:", topo);
            console.log("CSV Data Loaded:", csvData);

            const yearData = new Map();
            csvData.forEach(d => {
                if (d.year === year) {
                    yearData.set(d["Country name"], +d["Ladder score"]);
                }
            });

            ready(topo, yearData);
        })
        .catch(function (error) {
            console.error("Error loading data:", error);
        });
}

function ready(topo, yearData) {
    const svg = scopedD3.select("#my_dataviz");
    const projection = scopedD3
        .geoMercator()
        .scale(100)
        .center([0, 20])
        .translate([svg.attr("width") / 2, svg.attr("height") / 2]);

    const path = scopedD3.geoPath().projection(projection);
    const colorScale = scopedD3
        .scaleSequential()
        .domain([0, 10])
        .interpolator(scopedD3.interpolateBlues);

    svg.append("g")
        .selectAll("path")
        .data(topo.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "Country")
        .attr("fill", d => {
            const score = yearData.get(d.properties.name) || 0;
            return colorScale(score);
        })
        .style("stroke", "black")
        .style("opacity", 0.8);
}

function addLegend() {
    const legendSvg = scopedD3.select("#chloropleth_legend");
    const legendWidth = 20;
    const legendHeight = 300;

    legendSvg
        .attr("width", legendWidth + 50)
        .attr("height", legendHeight + 30);

    const defs = legendSvg.append("defs");
    const linearGradient = defs.append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%")
        .attr("x2", "0%")
        .attr("y1", "100%")
        .attr("y2", "0%");

    const colorDomain = scopedD3.range(0, 11);
    const colorScale = scopedD3
        .scaleSequential()
        .domain([0, 10])
        .interpolator(scopedD3.interpolateBlues);

    colorDomain.forEach((d, i) => {
        linearGradient.append("stop")
            .attr("offset", `${(i / (colorDomain.length - 1)) * 100}%`)
            .attr("stop-color", colorScale(d));
    });

    legendSvg.append("rect")
        .attr("x", 10)
        .attr("y", 10)
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient)")
        .style("stroke", "black");

    const legendScale = scopedD3.scaleLinear()
        .domain(colorScale.domain())
        .range([legendHeight + 10, 10]);
    const legendAxis = scopedD3.axisRight(legendScale)
        .ticks(5)
        .tickFormat(scopedD3.format(".1f"));

    legendSvg.append("g")
        .attr("transform", `translate(${10 + legendWidth}, 0)`)
        .call(legendAxis);
}

function createRadioButtons() {
    const radioButtons = document.getElementById("radioButtons");
    for (let i = 2005; i <= 2021; i++) {
        const wrapper = document.createElement("div");
        wrapper.className = "radio-wrapper";

        const input = document.createElement("input");
        input.type = "radio";
        input.name = "year";
        input.value = i;
        input.id = `year-${i}`;
        input.addEventListener("change", function () {
            if (this.checked) {
                loadData(i);
            }
        });
        if (i === 2021) input.checked = true;

        const label = document.createElement("label");
        label.htmlFor = `year-${i}`;
        label.className = "radio-custom";
        label.textContent = i;

        wrapper.appendChild(input);
        wrapper.appendChild(label);
        radioButtons.appendChild(wrapper);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadScopedD3(() => {
        console.log("Initializing...");
        addLegend();
        createRadioButtons();
        loadData("2021");
    });
});
