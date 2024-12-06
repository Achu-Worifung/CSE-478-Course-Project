// ===========================================================================================
//  Max Schumacher
//  Scatterplot
// ===========================================================================================

(function () {
  let data = [];
  let rawData = [];
  let selectedYearScatterplot = "2021";
  let selectedX = "Log GDP per capita";
  let selectedY = "Ladder score";
  let selectedCountry = "All Countries";
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  // SVG dimensions and margins
  const margin = { top: 100, right: 30, bottom: 50, left: 70 },
    width = 800 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

  const svgScatterplot = d3
    .select("#scatterplot_svg")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const tooltipScatterplot = d3.select("#tooltipScatterplot");

  // ===========================================================================================
  //  Loading data and updating scatterplot
  // ===========================================================================================

  function initializeData() {
    d3.csv(
      "./datasets/world-happiness-report-2005-2021.csv",
      function (error, loadedData) {
        if (error) {
          console.error("Error loading initial data:", error);
          return;
        }

        rawData = loadedData;
        loadScatterplotData(selectedYearScatterplot, selectedX, selectedY);
      }
    );
  }
  // load and process data based on the selected year
  function loadScatterplotData(
    year,
    xAttr,
    yAttr,
    selectedCountry = "All Countries"
  ) {
    try {
      let filteredData;
      if (selectedCountry === "All Countries") {
        filteredData = rawData.filter((d) => d.year === year);
      } else {
        filteredData = rawData.filter(
          (d) => d["Country name"] === selectedCountry
        );
      }

      // parse and map data
      filteredData.forEach((d) => {
        d.country = d["Country name"];
        d.xValue = parseFloat(d[xAttr]) || null;
        d.yValue = parseFloat(d[yAttr]) || null;
        d.year = d.year;
      });

      // filter out data points with null values
      const validData = filteredData.filter(
        (d) => d.xValue !== null && d.yValue !== null
      );

      // update country dropdown with all available countries
      const yearData = rawData.filter((d) => d.year === year);
      updateCountryDropdown(yearData, selectedCountry);

      updateScatterplot(validData, xAttr, yAttr, selectedCountry);
    } catch (err) {
      console.error("Error processing data:", err);
    }
  }

  // update with new data
  function updateScatterplot(
    data,
    xAttr,
    yAttr,
    selectedCountry = "All Countries"
  ) {
    // clear previous points/axes
    svgScatterplot.selectAll("*").remove();

    console.log("Year:", selectedYearScatterplot);
    console.log("X Attribute:", xAttr, "Y Attribute:", yAttr);
    console.log("Filtered Data:", data);
    console.log("Selected Country:", selectedCountry);

    if (data.length === 0) {
      console.warn("No valid data to display for this year.");
      return;
    }

    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.xValue))
      .range([0, width])
      .nice();

    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.yValue))
      .range([height, 0])
      .nice();

    // year labels if viewing single country
    if (selectedCountry !== "All Countries") {
      svgScatterplot
        .selectAll(".year-label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "year-label")
        .attr("x", (d) => xScale(d.xValue) + 8)
        .attr("y", (d) => yScale(d.yValue) + 4)
        .text((d) => d.year)
        .style("font-size", "10px")
        .style("fill", "#666");
    }

    // X axis
    svgScatterplot
      .append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(xScale))
      .append("text")
      .attr("x", width / 2)
      .attr("y", 40)
      .attr("fill", "black")
      .style("font-size", "14px")
      .text(xAttr);

    // Y axis
    svgScatterplot
      .append("g")
      .call(d3.axisLeft(yScale))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -50)
      .attr("fill", "black")
      .style("font-size", "14px")
      .text(yAttr);

    // calculate regression line
    const regression = calculateRegression(data);

    // add regression line
    const line = d3
      .line()
      .x((d) => xScale(d.x))
      .y((d) => yScale(regression.slope * d.x + regression.intercept));

    // create points for the regression line
    const xDomain = d3.extent(data, (d) => d.xValue);
    const regressionPoints = [{ x: xDomain[0] }, { x: xDomain[1] }];

    // add the regression line to the plot
    svgScatterplot
      .append("path")
      .datum(regressionPoints)
      .attr("class", "regression-line")
      .attr("d", line)
      .style("stroke", "red")
      .style("stroke-width", 2)
      .style("stroke-dasharray", "4,4")
      .style("fill", "none");

    // add regression equation text
    svgScatterplot
      .append("text")
      .attr("class", "regression-text")
      .attr("x", width - 200)
      .attr("y", -margin.top + 25)
      .style("font-size", "12px")
      .text(
        `y = ${regression.slope.toFixed(3)}x + ${regression.intercept.toFixed(
          3
        )}`
      )
      .style("fill", "red");

    // add R-squared value
    svgScatterplot
      .append("text")
      .attr("class", "r-squared-text")
      .attr("x", width - 200)
      .attr("y", -margin.top + 45)
      .style("font-size", "12px")
      .text(`R² = ${regression.rSquared.toFixed(3)}`)
      .style("fill", "red");

    // plot data points
    svgScatterplot
      .selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.xValue))
      .attr("cy", (d) => yScale(d.yValue))
      .attr("r", 5)
      .attr("fill", (d) => colorScale(d.country))
      .attr("opacity", 0.7)
      .style("cursor", "pointer")
      .on("mouseover", mouseOver)
      .on("mouseout", mouseOut)
      .on("mousemove", mouseMove)
      .on("click", (d) => {
        const countryDropdown = document.getElementById("scatterplot-country");
        if (countryDropdown.value === d.country) {
          countryDropdown.value = "All Countries";
          loadScatterplotData(
            selectedYearScatterplot,
            selectedX,
            selectedY,
            "All Countries"
          );
          highlightCountry("All Countries");
        } else {
          countryDropdown.value = d.country;
          loadScatterplotData(
            selectedYearScatterplot,
            selectedX,
            selectedY,
            d.country
          );
          highlightCountry(d.country);
        }
      });

    // calculate linear regression
    function calculateRegression(data) {
      const xMean = d3.mean(data, (d) => d.xValue);
      const yMean = d3.mean(data, (d) => d.yValue);

      // slope and intercept
      let numerator = 0;
      let denominator = 0;

      data.forEach((d) => {
        numerator += (d.xValue - xMean) * (d.yValue - yMean);
        denominator += Math.pow(d.xValue - xMean, 2);
      });

      const slope = numerator / denominator;
      const intercept = yMean - slope * xMean;

      // R-squared
      const yPred = data.map((d) => slope * d.xValue + intercept);
      const ssRes = d3.sum(
        data.map((d, i) => Math.pow(d.yValue - yPred[i], 2))
      );
      const ssTot = d3.sum(data.map((d) => Math.pow(d.yValue - yMean, 2)));
      const rSquared = 1 - ssRes / ssTot;

      return {
        slope: slope,
        intercept: intercept,
        rSquared: rSquared,
      };
    }

    // ===========================================================================================
    //  Mouse movement events
    // ===========================================================================================

    function mouseOver(d) {
      // opacity for all circles
      d3.selectAll("circle").transition().duration(200).style("opacity", 0.5);

      // opacity and style for the hovered circle
      d3.select(this)
        .transition()
        .duration(200)
        .style("opacity", 1)
        .attr("r", 8)
        .style("stroke", "black");

      const tooltipBox = document
        .getElementById("tooltipScatterplot")
        .getBoundingClientRect();

      // calculate position in SVG coordinates
      const tooltipX = xScale(d.xValue) - tooltipBox.width / 2;
      const tooltipY = yScale(d.yValue) - tooltipBox.height;

      // show tooltip
      tooltipScatterplot
        .html(
          `
                    <strong>Country:</strong> ${d.country}<br>
                    <strong>${xAttr}:</strong> ${d.xValue.toFixed(2)}<br>
                    <strong>${yAttr}:</strong> ${d.yValue.toFixed(2)}
                `
        )
        .style("left", tooltipX + "px")
        .style("top", tooltipY + "px")
        .transition()
        .duration(200)
        .style("opacity", 0.9);
    }

    // define mouseout function for removing hover effect
    function mouseOut(d) {
      // clear existing transitions
      d3.selectAll("circle")
        .interrupt() // This stops any running transitions
        .transition()
        .duration(200)
        .style("opacity", 0.7);

      // clear transition on the specific circle being moused out
      d3.select(this)
        .interrupt()
        .transition()
        .duration(200)
        .attr("r", 5)
        .style("stroke", "none");

      // hide tooltip
      tooltipScatterplot
        .interrupt()
        .transition()
        .duration(200)
        .style("opacity", 0);
    }

    function mouseMove(d) {
      const tooltipBox = document
        .getElementById("tooltipScatterplot")
        .getBoundingClientRect();

      const tooltipX = xScale(d.xValue) - tooltipBox.width / 2;
      const tooltipY = yScale(d.yValue);

      tooltipScatterplot
        .style("left", tooltipX + "px")
        .style("top", tooltipY + "px");
    }

    // plot data points
    svgScatterplot
      .selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.xValue))
      .attr("cy", (d) => yScale(d.yValue))
      .attr("r", 5)
      .attr("fill", "steelblue")
      .attr("opacity", 0.7)
      .on("mouseover", mouseOver)
      .on("mouseout", mouseOut)
      .on("mousemove", mouseMove);
  }

  // highlight selected country
  function highlightCountry(country) {
    svgScatterplot
      .selectAll("circle")
      .transition()
      .duration(200)
      .style("opacity", (d) =>
        country === "All Countries" || d.country === country ? 0.7 : 0.1
      )
      .style("stroke", (d) => (d.country === country ? "black" : "none"))
      .style("stroke-width", (d) => (d.country === country ? 2 : 0));
  }

  // get countries from the data
  function updateCountryDropdown(data, selectedCountry = "All Countries") {
    const countries = [...new Set(data.map((d) => d.country))].sort();
    countries.unshift("All Countries");

    const currentSelection = selectedCountry || "All Countries";
    fillOption("scatterplot-country", countries);

    const countryDropdown = document.getElementById("scatterplot-country");
    countryDropdown.value = currentSelection;

    const hoverList = document.getElementById("country-hover-list");
    hoverList.querySelectorAll(".country-option").forEach((el) => {
      if (el.textContent === currentSelection) {
        el.classList.add("selected");
      } else {
        el.classList.remove("selected");
      }
    });
  }

  // fill dropdown options
  function fillOption(selectId, options) {
    if (selectId === "scatterplot-country") {
      const hoverList = document.getElementById("country-hover-list");
      const select = document.getElementById(selectId);
      hoverList.innerHTML = "";
      select.innerHTML = "";

      options.forEach((option) => {
        const div = document.createElement("div");
        div.className = "country-option";
        div.textContent = option;

        const selectOption = document.createElement("option");
        selectOption.value = option;
        selectOption.textContent = option;
        select.appendChild(selectOption);

        if (option === selectedCountry) {
          div.classList.add("selected");
          selectOption.selected = true;
        }

        div.addEventListener("mouseenter", () => {
          highlightCountry(option);
        });

        div.addEventListener("mouseleave", () => {
          const currentCountry = document.getElementById(
            "scatterplot-country"
          ).value;
          highlightCountry(currentCountry);
        });

        div.addEventListener("click", () => {
          // update both hover list and dropdown
          hoverList.querySelectorAll(".country-option").forEach((el) => {
            el.classList.remove("selected");
          });
          div.classList.add("selected");
          select.value = option;
          selectedCountry = option;

          loadScatterplotData(
            selectedYearScatterplot.toString(),
            selectedX,
            selectedY,
            option
          );

          // only highlight if it's not "All Countries"
          if (option !== "All Countries") {
            highlightCountry(option);
          } else {
            d3.selectAll("circle")
              .transition()
              .duration(200)
              .style("opacity", 0.7)
              .style("stroke", "none")
              .style("stroke-width", 0);
          }
        });

        hoverList.appendChild(div);
      });
    } else {
      const select = document.getElementById(selectId);
      select.innerHTML = "";
      options.forEach((option) => {
        const selectOption = document.createElement("option");
        selectOption.value = option;
        selectOption.textContent = option;
        select.appendChild(selectOption);
      });
    }
  }

  // ===========================================================================================
  //  Filling out options menus
  // ===========================================================================================
  // prepare years and attributes
  const yearsArray = Array.from(
    { length: 2021 - 2005 + 1 },
    (_, i) => 2005 + i
  );

  const quantitativeAttributes = [
    "Ladder score",
    "Log GDP per capita",
    "Social support",
    "Healthy life expectancy at birth",
    "Freedom to make life choices",
    "Generosity",
    "Perceptions of corruption",
    "Positive affect",
    "Negative affect",
  ];

  // fill dropdowns
  fillOption("scatterplotYearDropdown", yearsArray);
  fillOption("scatterplot-x-attribute", quantitativeAttributes);
  fillOption("scatterplot-y-attribute", quantitativeAttributes);

  // set default selections
  document.getElementById("scatterplotYearDropdown").value =
    selectedYearScatterplot;
  document.getElementById("scatterplot-x-attribute").value = selectedX;
  document.getElementById("scatterplot-y-attribute").value = selectedY;

  // add event listeners to update the scatterplot
  document
    .getElementById("scatterplotYearDropdown")
    .addEventListener("change", (e) => {
      selectedYearScatterplot = e.target.value;
      const selectedCountry = document.getElementById(
        "scatterplot-country"
      ).value;
      loadScatterplotData(
        selectedYearScatterplot,
        selectedX,
        selectedY,
        selectedCountry
      );
    });

  document
    .getElementById("scatterplot-x-attribute")
    .addEventListener("change", (e) => {
      selectedX = e.target.value;
      const selectedCountry = document.getElementById(
        "scatterplot-country"
      ).value;
      loadScatterplotData(
        selectedYearScatterplot,
        selectedX,
        selectedY,
        selectedCountry
      );
    });

  document
    .getElementById("scatterplot-y-attribute")
    .addEventListener("change", (e) => {
      selectedY = e.target.value;
      const selectedCountry = document.getElementById(
        "scatterplot-country"
      ).value;
      loadScatterplotData(
        selectedYearScatterplot,
        selectedX,
        selectedY,
        selectedCountry
      );
    });

  // event listener for country selection
  document
    .getElementById("scatterplot-country")
    .addEventListener("change", (e) => {
      const selectedCountry = e.target.value;

      const hoverList = document.getElementById("country-hover-list");
      hoverList.querySelectorAll(".country-option").forEach((el) => {
        if (el.textContent === selectedCountry) {
          el.classList.add("selected");
        } else {
          el.classList.remove("selected");
        }
      });

      loadScatterplotData(
        selectedYearScatterplot,
        selectedX,
        selectedY,
        selectedCountry
      );
      highlightCountry(selectedCountry);
    });

  // load page
  initializeData();
  loadScatterplotData(selectedYearScatterplot, selectedX, selectedY);
})();
