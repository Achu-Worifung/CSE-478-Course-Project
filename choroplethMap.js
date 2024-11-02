// Create the SVG container and set dimensions
var svg = d3.select("#my_dataviz"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

// Define projection and path generator
var projection = d3.geoMercator()
  .scale(100)
  .center([0, 20])
  .translate([width / 2, height / 2]);
var path = d3.geoPath().projection(projection);

// Prepare data container and color scale
var data = d3.map();
var colorScale = d3.scaleSequential()
    .domain([0, 10]) // Set domain based on your data range
    .interpolator(d3.interpolateBlues); // Use a blue gradient



// Load GeoJSON and CSV data
d3.queue()
  .defer(d3.json, "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
  .defer(d3.csv, "./datasets/world-happiness-report-2021.csv", function(d) { 
    data.set(d["Country name"], +d["Ladder score"]); 
  })
  .await(ready);

function ready(error, topo) {
  if (error) throw error;
  const tooltip = d3.select(".tooltip");

  //for hover effect
// Mouse over event
let mouseOver = function(event, d) {
  // console.log('in mouse over', event);
  console.log('event', event.properties.name);
  

  // Set opacity for all countries
  d3.selectAll(".Country")
    .transition()
    .duration(200)
    .style("opacity", 0.5);

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
    .html(`Country name: ${event.properties.name} <br> Ladder score: ${event.total}`)
    .style("left", (event.pageX + 5) + "px") // Adjust tooltip position
    .style("top", (event.pageY - 28) + "px"); // Adjust tooltip position
};

// Mouse leave event
let mouseLeave = function(d) {
  // Reset opacity for all countries
  d3.selectAll(".Country")
    .transition()
    .duration(200)
    .style("opacity", 0.8);

  // Reset the stroke for the hovered country
  d3.select(this)
    .transition()
    .duration(200)
    .style("stroke", "transparent");

  // Hide the tooltip
  tooltip.style("opacity", 0);
};

  // Draw the map
  svg.append("g")
    .selectAll("path")
    .data(topo.features)
    .enter()
    .append("path")
      .attr("d", path)
      .attr("class", function(d){ return "Country" } ) // Assign a class for styling
      .attr("fill", function(d) {
        var countryName = d.properties.name;
        d.total = data.get(countryName) || 0;
        // console.log('total', d.total);
        // console.log('countryName', countryName);

        // console.log('colorScale', colorScale(d.total));
        
        
        
        return colorScale(d.total);
      })
      .style("stroke", "black")
      .style("opacity", 0.8)
      .on("mouseover", mouseOver )
      .on("mouseleave", mouseLeave);
}
