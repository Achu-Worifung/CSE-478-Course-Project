const happiness_factors_5 = ['Income', 'Health', 'Social Support', 'Freedom', 'Corruption', 'Happiness Score'];
const continent_data_5 = ['Asia', 'Africa', 'Europe', 'North America', 'South America', 'Oceania'];

const svg_5 = d3.select('#radial-diagram-5');
let svg_width_5 = +svg_5.node().clientWidth;
let svg_height_5 = +svg_5.node().clientHeight;

const rect_width_5 = 150;
const rect_height_5 = 40;
const spacing_5 = 5;

radius_5 = 200;

selected_factor = null;
selected_continent = null;

current_factor = null;
current_continent = null;

//draw selection rects on start up
svg_5.selectAll(".factor-rect")
    .data(happiness_factors_5)
    .enter()
    .append("rect")
    .attr("class", "rect factor-rect")
    .attr("x", 20)
    .attr("y", (d, i) => i * (rect_height_5 + spacing_5) + (svg_height_5/3))
    .attr("width", rect_width_5)
    .attr("height", rect_height_5)
    .attr("fill", (d, i) => i < 5 ? '#1f78b4' : '#fec44f')
    .on("mouseover", function () {
        svg_5.selectAll(".factor-rect")
            .attr("opacity", 0.5)
            .attr('cursor', 'pointer');
        d3.select(this).attr("opacity", 1);
    })
    .on("mouseout", function () {
        svg_5.selectAll(".factor-rect")
            .attr("opacity", selected_factor ? 0.5 : 1);
        if (selected_factor) {
            d3.select(selected_factor).attr("opacity", 1);
        }
    })
    .on("click", function(event, d) {
        svg_5.selectAll(".factor-rect")
            .attr("opacity", 0.5);
        
        d3.select(this).attr("opacity", 1);
        d3.select(this).attr("stroke", "black").attr("stroke-width", 2);

        if (selected_factor && selected_factor !== this) {
            d3.select(selected_factor).attr("stroke", "none");
        }

        selected_factor = this;
        current_factor = event;

        createTreeMap();
        updateTreeMapLegend();
        if (current_factor != null && current_continent != null) {
            processData();
        }
    });


svg_5.selectAll(".factor-text")
    .data(happiness_factors_5)
    .enter()
    .append("text")
    .attr("class", "text factor-text")
    .attr('cursor', 'pointer')
    .attr("x", 20 + rect_width_5 / 2)
    .attr("y", (d, i) => i * (rect_height_5 + spacing_5) + (svg_height_5/3) + rect_height_5 / 2 + 5)
    .attr("text-anchor", "middle")
    .text(d => d)


//continent rects
svg_5.selectAll(".continent-rect")
    .data(continent_data_5)
    .enter()
    .append("rect")
    .attr("class", "rect continent-rect")
    .attr("x", 300)
    .attr("y", (d, i) => i * (rect_height_5 + spacing_5) + (svg_height_5/3))
    .attr("width", rect_width_5)
    .attr("height", rect_height_5)
    .attr("fill", (d, i) => '#964B00')
    .on("mouseover", function () {
        svg_5.selectAll(".continent-rect")
            .attr("opacity", 0.5)
            .attr('cursor', 'pointer');
        d3.select(this).attr("opacity", 1);
    })
    .on("mouseout", function () {
        svg_5.selectAll(".continent-rect")
            .attr("opacity", selected_continent ? 0.5 : 1);
        if (selected_continent) {
            d3.select(selected_continent).attr("opacity", 1);
        }
    })
    .on("click", function(event, d) {
        svg_5.selectAll(".continent-rect")
          .attr("opacity", 0.5);
        
        d3.select(this).attr("opacity", 1);
        d3.select(this).attr("stroke", "black").attr("stroke-width", 2);
  
        if (selected_continent && selected_continent !== this) {
          d3.select(selected_continent).attr("stroke", "none");
        }
  
        selected_continent = this;
        current_continent = event;

        if (current_factor != null && current_continent != null) {
            processData();
        }
    });

svg_5.selectAll(".continent-text")
    .data(continent_data_5)
    .enter()
    .append("text")
    .attr("class", "text continent-text")
    .attr('cursor', 'pointer')
    .attr("x", 300 + rect_width_5 / 2)
    .attr("y", (d, i) => i * (rect_height_5 + spacing_5) + (svg_height_5/3) + rect_height_5 / 2 + 5)
    .attr("text-anchor", "middle")
    .text(d => d);

//open dataset and call radial
function processData()
{
    d3.csv('./datasets/2021-data.csv')
    .then(data => {
        //console.log("data:", data);

        const countries = regions_5[current_continent];
        const selected_countries = data
            .filter(d => countries.includes(d['Country name']))
            .map(d => ({
                country: d['Country name'],
                value: +d[factor_dict_5[current_factor]]
            }));

        // console.log("filtered countries:", selected_countries);
        createRadialChart(selected_countries);
    })
    .catch(error => {
        console.error(`Error loading CSV: ${error}`);
    });
}

//make radial chart
//tooltip added in html
function createRadialChart(countries)
{
    svg_5.selectAll('g').remove();
    const angle_scale = d3.scaleBand()
        .domain(countries.map(d => d.country))
        .range([0, 2 * Math.PI]);

    const radius_scale = d3.scaleLinear()
        .domain([0, d3.max(countries, d => d.value)])
        .range([radius_5 / 2, radius_5]);

    const color_scale = d3.scaleLinear()
    .domain([d3.min(countries, d => d.value), 0, d3.max(countries, d => d.value)])
    .range(['red', 'white', 'green']);

    gap = 0.015;

    const tooltip = d3.select('#tooltip_5');

    const g = svg_5.append('g')
    .attr('transform', `translate(${800}, ${svg_height_5 / 2})`);

    g.selectAll('.bar')
        .data(countries)
        .enter().append('path')
        .attr('class', 'bar')
        .attr('d', d => {
            const start_angle = angle_scale(d.country) + gap/2;
            const end_angle = start_angle + angle_scale.bandwidth() - gap;
            return d3.arc()
                .innerRadius(radius_5 / 2)
                .outerRadius(radius_scale(d.value))
                .startAngle(start_angle)
                .endAngle(end_angle)();
        })
        .attr('fill', d => color_scale(d.value))
        //d3.schemeCategory10[i % 10]
        .on('mouseover', function (event) {
            tooltip.style('display', 'block')
                .html(`<strong>Country:</strong> ${event.country}<br>
                       <strong>Factor:</strong> ${current_factor}<br>
                       <strong>Value:</strong> ${event.value.toFixed(2)}`);
        })
        .on('mousemove', function () {
            tooltip.style('left', (d3.event.pageX + 10) + 'px')
                .style('top', (d3.event.pageY + 10) + 'px');
        })
        .on('mouseout', function () {
            tooltip.style('display', 'none');
        });
    
    g.selectAll('.label')
    .data(countries)
    .enter().append('text')
    .attr('x', d => {
        const angle = angle_scale(d.country) + angle_scale.bandwidth() / 2;
        return Math.sin(angle) * (radius_5 + 60);
    })
    .attr('y', d => {
        const angle = angle_scale(d.country) + angle_scale.bandwidth() / 2;
        return -Math.cos(angle) * (radius_5 + 60);
    })
    .attr('text-anchor', 'middle')
    .text(d => d.country)
    .style('font-size', '10px');
}

//make treemap only when factor is changed, use same tooltip as radial
function createTreeMap()
{
    d3.csv('./datasets/2021-data.csv')
        .then(data => {
            const countries = [];
            Object.keys(regions_5).forEach(continent => {
                regions_5[continent].forEach(country => {
                    const countryData = data.find(d => d['Country name'] === country);
                    if (countryData) {
                        countries.push({
                            name: country,
                            value: +countryData[factor_dict_5[current_factor]],
                            continent: continent
                        });
                    }
                });
            });

            const width = 1000;
            const height = 350;

            const colorScale = d3.scaleOrdinal()
                .domain(Object.keys(regions_5))
                .range(d3.schemeDark2);

            const root = d3.hierarchy({ children: countries })
                .sum(d => d.value);

            const treemapLayout = d3.treemap()
                .size([width, height])
                .padding(1);

            treemapLayout(root);

            d3.select('#treemap-radial').selectAll('*').remove();
            const treemapSvg = d3.select('#treemap-radial')
                .append('svg')
                .attr('width', width)
                .attr('height', height);

            const nodes = treemapSvg.selectAll('g')
                .data(root.leaves())
                .enter()
                .append('g')
                .attr('transform', d => `translate(${d.x0},${d.y0})`);

            nodes.append('rect')
                .attr('width', d => d.x1 - d.x0)
                .attr('height', d => d.y1 - d.y0)
                .attr('fill', d => colorScale(d.data.continent))
                .attr('stroke', '#fff');

            // nodes.append('text')
            //     .attr('x', 5)
            //     .attr('y', 15)
            //     .text(d => d.data.name)
            //     .style('font-size', '10px')
            //     .style('fill', 'white')
            //     .attr('clip-path', d => `rect(0, ${d.x1 - d.x0}px, ${d.y1 - d.y0}px, 0)`);

            nodes.on('mouseover', function (event, d) {
                const tooltip = d3.select('#tooltip_5');
                tooltip.style('display', 'block')
                    .html(`<strong>Country:</strong> ${d.data.name}<br>
                           <strong>Continent:</strong> ${d.data.continent}<br>
                           <strong>Value:</strong> ${d.data.value.toFixed(2)}`);
            })
            .on('mousemove', function (event) {
                const tooltip = d3.select('#tooltip_5');
                tooltip.style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY + 10) + 'px');
            })
            .on('mouseout', function () {
                d3.select('#tooltip_5').style('display', 'none');
            });
        })
        .catch(error => console.error(`Error loading CSV: ${error}`));
}

function updateTreeMapLegend()
{   
    const continents = Object.keys(regions_5);
    const colorScale = d3.scaleOrdinal()
        .domain(continents)
        .range(d3.schemeDark2);

    d3.select('#horizontal-legend').selectAll('*').remove();

    const legendRectSize = 20;
    const legendSpacing = 10;
    const itemWidth = 150;

    const legendSvg = d3.select('#horizontal-legend');

    const legend = legendSvg.selectAll('.legend-item')
        .data(continents)
        .enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(${i * itemWidth + 10}, 10)`); // Adjust horizontal positioning

    legend.append('rect')
        .attr('width', legendRectSize)
        .attr('height', legendRectSize)
        .attr('fill', d => colorScale(d))
        .attr('stroke', 'black');

    legend.append('text')
        .attr('x', legendRectSize + legendSpacing)
        .attr('y', legendRectSize / 2)
        .attr('dy', '0.35em')
        .text(d => d)
        .style('font-size', '12px');
}

//declare dicts for easy mapping/retrieval

const factor_dict_5 = {
    'Income': 'Log GDP per capita',
    'Health': 'Healthy life expectancy at birth',
    'Social Support': 'Social support',
    'Freedom': 'Freedom to make life choices',
    'Generosity': 'Generosity',
    'Corruption': 'Perceptions of corruption',
    'Happiness Score': 'Ladder score'
}

const regions_5 = {
    "Asia": [
        "Afghanistan", "Armenia", "Azerbaijan", "Bahrain", "Bangladesh", "Bhutan", "Brunei", 
        "Cambodia", "China", "Cyprus", "Georgia", "India", "Indonesia", "Iran", "Iraq", 
        "Israel", "Japan", "Jordan", "Kazakhstan", "Kuwait", "Kyrgyzstan", "Laos", "Lebanon", 
        "Malaysia", "Maldives", "Mongolia", "Myanmar", "Nepal", "North Korea", 
        "Oman", "Pakistan", "Palestinian Territories", "Philippines", "Qatar", "Saudi Arabia", 
        "Singapore", "South Korea", "Sri Lanka", "Syria", "Tajikistan", "Thailand", 
        "Timor-Leste", "Turkey", "Turkmenistan", "United Arab Emirates", "Uzbekistan", 
        "Vietnam", "Yemen"
    ],
    "Africa": [
        "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cabo Verde", 
        "Cameroon", "Chad", "Comoros", "Congo (Brazzaville)", "Djibouti", "Egypt", 
        "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia", "Ghana", 
        "Guinea", "Guinea-Bissau", "Ivory Coast", "Kenya", "Lesotho", "Liberia", "Libya", 
        "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", 
        "Namibia", "Niger", "Nigeria", "Rwanda", "Senegal", "Seychelles", "Sierra Leone", 
        "Somalia", "South Africa", "South Sudan", "Sudan", "Tanzania", "Togo", "Tunisia", 
        "Uganda", "Zambia", "Zimbabwe"
    ],
    "Europe": [
        "Albania", "Andorra", "Austria", "Belarus", "Belgium", "Bosnia and Herzegovina", 
        "Bulgaria", "Croatia", "Czech Republic", "Denmark", "Estonia", "Finland", "France", 
        "Germany", "Greece", "Hungary", "Iceland", "Ireland", "Italy", "Kosovo", "Latvia", 
        "Liechtenstein", "Lithuania", "Luxembourg", "Malta", "Moldova", "Monaco", "Montenegro", 
        "Netherlands", "North Macedonia", "Norway", "Poland", "Portugal", "Romania", "Russia", 
        "San Marino", "Serbia", "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland", 
        "Ukraine", "United Kingdom", "Vatican City"
    ],
    "North America": [
        "Antigua and Barbuda", "Bahamas", "Barbados", "Belize", "Canada", "Costa Rica", 
        "Cuba", "Dominica", "Dominican Republic", "El Salvador", "Grenada", "Guatemala", 
        "Haiti", "Honduras", "Jamaica", "Mexico", "Nicaragua", "Panama", "Saint Kitts and Nevis", 
        "Saint Lucia", "Saint Vincent and the Grenadines", "Trinidad and Tobago", "USA"
    ],
    "South America": [
        "Argentina", "Bolivia", "Brazil", "Chile", "Colombia", "Ecuador", 
        "Paraguay", "Peru", "Uruguay", "Venezuela"
    ],
    "Oceania": [
        "Australia", "Fiji", "Kiribati", "Marshall Islands", "Micronesia", "Nauru", 
        "New Zealand", "Palau", "Papua New Guinea", "Samoa", "Solomon Islands", 
        "Tonga", "Tuvalu", "Vanuatu"
    ]
};

const conteinent_colors_5 = {
    "Asia": "#ff9e4a",
    "Africa": "#f3e079",
    "Europe": "#b9d86c",
    "North America": "#d49ea2",
    "South America": "#aa87d0",
    "Oceania": "#c49268"
};
