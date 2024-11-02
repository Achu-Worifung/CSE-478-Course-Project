let selectedYear = "2021";

//selecting the svg element
var svg = d3.select("#my_dataviz"),
  width = +svg.attr("width"),
  height = +svg.attr("height");

// Define projection and path generator
var projection = d3
  .geoMercator()
  .scale(100)
  .center([0, 20])
  .translate([width / 2, height / 2]);
var path = d3.geoPath().projection(projection);

var data = d3.map();
// Define color scale
var colorScale = d3
  .scaleSequential()
  .domain([0, 10]) // Set domain based on your data range
  .interpolator(d3.interpolateBlues);

function loadData(year) {
  console.log("year in loadData", year);

  // Load GeoJSON and CSV data
  d3.queue()
    .defer(
      d3.json,
      "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
    )
    .defer(
      d3.csv,
      `./datasets/world-happiness-report-${year}.csv`,
      function (d) {
        data.set(d["Country name"], +d["Ladder score"]);
      }
    )
    .await(ready);
}

function ready(error, topo) {
  console.log("topo", topo);
  const tooltip = d3.select(".tooltip");

  if (error) {
    console.error("Error loading the datasets:", error);

    // Clear existing map paths
    svg.selectAll("path.Country").remove();

    // Load the GeoJSON data
    d3.json(
      "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson",
      function (geoError, geoData) {
        if (geoError) {
          console.error("Error loading GeoJSON data:", geoError);
          return; // Exit the callback for loading GeoJSON if there's an error
        }

        // Drawing the blank map (outlines only) using GeoJSON data
        svg
          .append("g")
          .selectAll("path")
          .data(geoData.features) // Use the GeoJSON features
          .enter()
          .append("path")
          .attr("d", path)
          .attr("class", "Country")
          .style("fill", "lightgray") // Optional: Set a neutral color for countries
          .style("stroke", "black")
          .style("opacity", 0.8)
          .on("mouseover", function (event, d) {
            console.log("event", event.properties.name);

            d3.select(this).transition().duration(200).style("opacity", 1);

            // Show the tooltip
            tooltip.html(
              `<h3 style="color: red; margin: 0; padding: 0;">Dataset failed to load.</h3>
               <br> Country name: ${event.properties.name} 
               <br> Ladder score: undefined 
               <br> Year: ${selectedYear || "N/A"}`
            )
              .style("left", event.pageX + 5 + "px") // Adjust tooltip position
              .style("top", event.pageY - 28 + "px") // Adjust tooltip position
              .style("opacity", 1); // Make tooltip visible
          })
          .on("mouseleave", function (event, d) {
            d3.select(this).transition().duration(200).style("opacity", 0.8);
            tooltip.style("opacity", 0); // Hide the tooltip on mouse leave
          });
      }
    );

    return; // Exit the ready function here
  }

  //for hover effect
  // Mouse over event
  let mouseOver = function (event, d) {
    // console.log('in mouse over', event);
    console.log("event", event.properties.name);

    // Set opacity for all countries
    d3.selectAll(".Country").transition().duration(200).style("opacity", 0.5);

    // Set opacity for the hovered country
    d3.select(this)
      .transition()
      .duration(200)
      .style("opacity", 1)
      .style("stroke", "black");

    // Update the tooltip text and position
    tooltip
      .style("opacity", 1)
      // .style("background-color", "black")
      .html(
        `Country name: ${event.properties.name} <br> Ladder score: ${event.total} <br> Year: ${selectedYear}`
      )
      .style("left", event.pageX + 5 + "px") // Adjust tooltip position
      .style("top", event.pageY - 28 + "px"); // Adjust tooltip position
  };

  // Mouse leave event
  let mouseLeave = function (d) {
    // Reset opacity for all countries
    d3.selectAll(".Country").transition().duration(200).style("opacity", 0.8);

    // Reset the stroke for the hovered country
    d3.select(this).transition().duration(200).style("stroke", "transparent");

    // Hide the tooltip
    tooltip.style("opacity", 0);
  };

  // Draw the map
  svg
    .append("g")
    .selectAll("path")
    .data(topo.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", function (d) {
      return "Country";
    }) // Assign a class for styling
    .attr("fill", function (d) {
      var countryName = d.properties.name;
      d.total = data.get(countryName) || 0;
      // console.log('total', d.total);
      // console.log('countryName', countryName);

      // console.log('colorScale', colorScale(d.total));

      return colorScale(d.total);
    })
    .style("stroke", "black")
    .style("opacity", 0.8)
    .on("mouseover", mouseOver)
    .on("mouseleave", mouseLeave);
}

// Selecting the year selector
const yearSelector = document.getElementById("yearSelector");
let html = `<select id="yearSelector">`;
for (let i = 2005; i <= 2021; i++) {
  if (i === 2021) {
    html += `<option value="${i}" selected>${i}</option>`;
  } else {
    html += `<option value="${i}">${i}</option>`;
  }
}
html += `</select>`;
yearSelector.innerHTML += html; // Set the inner HTML of the selector

// Attach an event listener to the dropdown
yearSelector.addEventListener("change", (e) => {
  selectedYear = e.target.value; // Get the selected value
  console.log("selectedYear", selectedYear);

  loadData(selectedYear); // Call the loading data function
});

// Initial load for the default year (2021)
loadData("2021");
