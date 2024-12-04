(function(d3) {
    'use strict';
    
    window.HappinessHeatmap = {
        init: function(containerId, options = {}) {
            // Store the specific d3 instance and container ID
            this.d3 = d3;
            this.containerId = containerId;
            
            // Add required styles
            const styles = `
                .happiness-heatmap-cell-hover {
                    position: absolute;
                    background: white;
                    padding: 8px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    pointer-events: none;
                    opacity: 0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    font-size: 14px;
                    z-index: 1000;
                }
                .happiness-heatmap-viz {
                    overflow-x: auto;
                }
                .happiness-heatmap-header-cell {
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 15px;
                }
                .happiness-heatmap-pagination {
                    text-align: center;
                    margin-top: 20px;
                }
                .happiness-heatmap-pagination button {
                    padding: 8px 16px;
                    margin: 0 5px;
                    cursor: pointer;
                }
                .happiness-heatmap-search-container {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .happiness-heatmap-search-container input {
                    padding: 8px 12px;
                    width: 300px;
                    font-size: 14px;
                }
                .happiness-heatmap-error {
                    color: red;
                    text-align: center;
                    padding: 20px;
                }
            `;
            
            const styleSheet = document.createElement('style');
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);

            // Initialize the visualization
            this.container = this.d3.select(`#${containerId}`);
            if (this.container.empty()) {
                console.error(`Container #${containerId} not found`);
                return;
            }

            this.setupLayout();
            this.loadData(options.dataPath || 'datasets/');
        },

        setupLayout: function() {
            const prefix = 'happiness-heatmap';
            this.container.html(`
                <div class="${prefix}-header-container">
                    <h2>Global Happiness Components Heatmap</h2>
                    <div class="${prefix}-search-container">
                        <input type="text" id="${prefix}-searchInput" placeholder="Search countries...">
                    </div>
                </div>
                <div class="${prefix}-viz"></div>
                <div class="${prefix}-pagination">
                    <button id="${prefix}-prevBtn">Previous</button>
                    <span class="${prefix}-page-info">Page <span id="${prefix}-currentPage">1</span> of <span id="${prefix}-totalPages">1</span></span>
                    <button id="${prefix}-nextBtn">Next</button>
                </div>
            `);

            this.margin = { top: 120, right: 40, bottom: 40, left: 200 };
            this.width = Math.min(1200, window.innerWidth - 100) - this.margin.left - this.margin.right;
            this.cellHeight = 40;
            this.rowsPerPage = 20;
            this.currentPage = 0;
            this.blueColors = ['#003366', '#174978', '#2F5F8A', '#46769B', '#5E8CAD', '#75A2BF'];

            this.columns = [
                { key: 'Ladder score', display: 'Happiness Score' },
                { key: 'Log GDP per capita', display: 'GDP per capita' },
                { key: 'Social support', display: 'Social Support' },
                { key: 'Healthy life expectancy at birth', display: 'Healthy Life' },
                { key: 'Freedom to make life choices', display: 'Freedom' },
                { key: 'Generosity', display: 'Generosity' },
                { key: 'Perceptions of corruption', display: 'Corruption' }
            ];

            // Create SVG container
            this.svg = this.container.select(`.${prefix}-viz`)
                .append('svg')
                .attr('width', this.width + this.margin.left + this.margin.right);

            // Create tooltip
            this.tooltip = this.d3.select('body')
                .append('div')
                .attr('class', `${prefix}-cell-hover`);
        },

        loadData: function(dataPath) {
            fetch(`${dataPath}world-happiness-report-2005-2021.csv`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.text();
                })
                .then(csvText => {
                    const happinessData = this.d3.csvParse(csvText);
                    if (!happinessData || !happinessData.length) {
                        throw new Error('No data found in CSV');
                    }
                    this.processData(happinessData);
                    this.setupEventListeners();
                })
                .catch(error => {
                    console.error('Error loading data:', error);
                    this.container.html(`
                        <div class="happiness-heatmap-error">
                            Error loading data. Please check if the data file exists at ${dataPath}
                        </div>
                    `);
                });
        },

        processData: function(happinessData) {
            try {
                const latestYearData = this.d3.group(happinessData, d => d['Country name']);
                this.processedData = Array.from(latestYearData).map(([country, values]) => {
                    const latestYear = this.d3.max(values, d => +d.year);
                    return values.find(d => +d.year === latestYear);
                });

                this.colorScales = new Map();
                this.columns.forEach(col => {
                    const values = this.processedData.map(d => +d[col.key]).filter(v => !isNaN(v));
                    this.colorScales.set(col.key, this.d3.scaleQuantile()
                        .domain(this.d3.extent(values))
                        .range(this.blueColors));
                });

                this.sortedData = [...this.processedData];
                this.filteredData = this.sortedData;
                
                // Initial sort by happiness score
                this.sortData('Ladder score');
            } catch (error) {
                console.error('Error processing data:', error);
                this.container.html(`
                    <div class="happiness-heatmap-error">
                        Error processing data. Please check the console for details.
                    </div>
                `);
            }
        },

        createLegend: function(g) {
            const legendHeight = 20;
            const legendTop = -95;
            
            const legend = g.append('g')
                .attr('transform', `translate(0, ${legendTop})`);

            legend.append('text')
                .attr('x', this.width / 2)
                .attr('y', -10)
                .attr('text-anchor', 'middle')
                .style('font-size', '14px')
                .style('font-weight', 'bold')
                .text('Color Scale');

            const gradientId = `blue-gradient-${Date.now()}`;
            const gradient = legend.append('defs')
                .append('linearGradient')
                .attr('id', gradientId)
                .attr('x1', '0%')
                .attr('x2', '100%');

            this.blueColors.forEach((color, i) => {
                gradient.append('stop')
                    .attr('offset', `${(i * 100) / (this.blueColors.length - 1)}%`)
                    .attr('stop-color', color);
            });

            legend.append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', this.width)
                .attr('height', legendHeight)
                .style('fill', `url(#${gradientId})`);

            legend.append('text')
                .attr('x', 0)
                .attr('y', legendHeight + 15)
                .style('font-size', '12px')
                .text('Lower');

            legend.append('text')
                .attr('x', this.width)
                .attr('y', legendHeight + 12)
                .attr('text-anchor', 'end')
                .style('font-size', '12px')
                .text('Higher');
        },

        updateHeatmap: function() {
            const totalPages = Math.ceil(this.filteredData.length / this.rowsPerPage);
            this.d3.select('#happiness-heatmap-currentPage').text(this.currentPage + 1);
            this.d3.select('#happiness-heatmap-totalPages').text(totalPages);

            const pageData = this.filteredData.slice(
                this.currentPage * this.rowsPerPage,
                (this.currentPage + 1) * this.rowsPerPage
            );

            const height = (pageData.length + 1) * this.cellHeight;
            this.svg.attr('height', height + this.margin.top + this.margin.bottom);

            const xScale = this.d3.scaleBand()
                .domain(this.columns.map(c => c.display))
                .range([0, this.width])
                .padding(0.05);

            const yScale = this.d3.scaleBand()
                .domain(pageData.map(d => d['Country name']))
                .range([0, height])
                .padding(0.05);

            this.svg.selectAll('*').remove();

            const g = this.svg.append('g')
                .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

            this.createLegend(g);

            // Add column headers
            g.selectAll('.happiness-heatmap-header-cell')
                .data(this.columns)
                .enter()
                .append('text')
                .attr('class', 'happiness-heatmap-header-cell')
                .attr('x', d => xScale(d.display) + xScale.bandwidth() / 2)
                .attr('y', -35)
                .attr('text-anchor', 'middle')
                .text(d => d.display)
                .on('click', (event, d) => this.sortData(d.key));

            // Add row headers
            g.selectAll('.happiness-heatmap-row-header')
                .data(pageData)
                .enter()
                .append('text')
                .attr('x', -10)
                .attr('y', d => yScale(d['Country name']) + yScale.bandwidth() / 2)
                .attr('text-anchor', 'end')
                .attr('dominant-baseline', 'middle')
                .style('font-size', '14px')
                .text(d => d['Country name']);

            // Add cells and values
            this.columns.forEach(col => {
                g.selectAll(`.cell-${col.key.replace(/\s+/g, '-')}`)
                    .data(pageData)
                    .enter()
                    .append('rect')
                    .attr('x', xScale(col.display))
                    .attr('y', d => yScale(d['Country name']))
                    .attr('width', xScale.bandwidth())
                    .attr('height', yScale.bandwidth())
                    .attr('fill', d => {
                        const value = +d[col.key];
                        return !isNaN(value) ? this.colorScales.get(col.key)(value) : '#eee';
                    })
                    .on('mouseover', (event, d) => {
                        const value = +d[col.key];
                        this.tooltip.style('opacity', 1)
                            .html(`${d['Country name']}<br>${col.display}: ${!isNaN(value) ? value.toFixed(2) : 'N/A'}`)
                            .style('left', (event.pageX + 10) + 'px')
                            .style('top', (event.pageY - 10) + 'px');
                    })
                    .on('mouseout', () => {
                        this.tooltip.style('opacity', 0);
                    });

                g.selectAll(`.text-${col.key.replace(/\s+/g, '-')}`)
                    .data(pageData)
                    .enter()
                    .append('text')
                    .attr('x', xScale(col.display) + xScale.bandwidth() / 2)
                    .attr('y', d => yScale(d['Country name']) + yScale.bandwidth() / 2)
                    .attr('text-anchor', 'middle')
                    .attr('dominant-baseline', 'middle')
                    .style('fill', 'white')
                    .style('font-size', '13px')
                    .text(d => {
                        const value = +d[col.key];
                        return !isNaN(value) ? value.toFixed(2) : 'N/A';
                    });
            });
        },

        sortData: function(key) {
            this.sortedData = [...this.processedData].sort((a, b) => {
                const valA = +a[key];
                const valB = +b[key];
                if (isNaN(valA) && isNaN(valB)) return 0;
                if (isNaN(valA)) return 1;
                if (isNaN(valB)) return -1;
                return this.d3.descending(valA, valB);
            });
            this.filteredData = this.sortedData;
            this.currentPage = 0;
            this.updateHeatmap();
        },

        setupEventListeners: function() {
            const prefix = 'happiness-heatmap';
            
            this.d3.select(`#${prefix}-searchInput`).on('input', (event) => {
                const searchTerm = event.target.value.toLowerCase();
                this.filteredData = this.sortedData.filter(d => 
                    d['Country name'].toLowerCase().includes(searchTerm)
                );
                this.currentPage = 0;
                this.updateHeatmap();
            });

            this.d3.select(`#${prefix}-prevBtn`).on('click', () => {
                if (this.currentPage > 0) {
                    this.currentPage--;
                    this.updateHeatmap();
                }
            });

            this.d3.select(`#${prefix}-nextBtn`).on('click', () => {
                if ((this.currentPage + 1) * this.rowsPerPage < this.filteredData.length) {
                    this.currentPage++;
                    this.updateHeatmap();
                }
            });

            // Add window resize handler
            window.addEventListener('resize', () => {
                this.width = Math.min(1200, window.innerWidth - 100) - this.margin.left - this.margin.right;
                this.svg.attr('width', this.width + this.margin.left + this.margin.right);
                this.updateHeatmap();
            });
        }
    };
})(d3v7);