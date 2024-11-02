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
var colorScale = d3.scaleLinear()
    .domain([0, 10]) // Set the domain based on your data range
    .range(["#f7fbff", "#08306b"]); // Specify a gradient from light blue to dark blue


// Load GeoJSON and CSV data
d3.queue()
  .defer(d3.json, "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
  .defer(d3.csv, "./datasets/world-happiness-report-2021.csv", function(d) { 
    data.set(d["Country name"], +d["Ladder score"]); 
  })
  .await(ready);

function ready(error, topo) {
  if (error) throw error;

  //for hover effect
  let mouseOver = function(d) {
    d3.selectAll(".Country")
      .transition()
      .duration(200)
      .style("opacity", .5)
    d3.select(this)
      .transition()
      .duration(200)
      .style("opacity", 1)
      .style("stroke", "black")
  }

  let mouseLeave = function(d) {
    d3.selectAll(".Country")
      .transition()
      .duration(200)
      .style("opacity", .8)
    d3.select(this)
      .transition()
      .duration(200)
      .style("stroke", "transparent")
  }

  // Draw the map
  svg.append("g")
    .selectAll("path")
    .data(topo.features)
    .enter()
    .append("path")
      .attr("d", path)
      .attr("fill", function(d) {
        var countryName = d.properties.name;
        d.total = data.get(countryName) || 0;
        // console.log('total', d.total);
        // console.log('countryName', countryName);

        console.log('colorScale', colorScale(d.total));
        
        
        
        return colorScale(d.total);
      })
      .style("stroke", "black")
      .style("opacity", 0.8)
      .on("mouseover", mouseOver )
      .on("mouseleave", mouseLeave);
}
