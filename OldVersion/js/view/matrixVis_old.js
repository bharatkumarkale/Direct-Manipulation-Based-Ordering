// View to handle creation of a matrix plot and the interactions on it

/* Authors: Bharat Kale <bkale@niu.edu>
			
   Version: 1.0.0
   Date: 04-15-2020
*/
"use strict"

var App = App || {};

let MatrixView = function(targetID) {
	let self = {
		targetID: "",
		target: null,
		totalWidth: "",
		totalHeight: "",
		width: "",
		height: "",
		margin: "",
		targetSvg: null,
		targetEle: null,

		data: [],
		normalizedData: [],	
		row: '',
		column: '',
		minYear: 0,
		sortedRowsPerColumn: {},
		sortedColumnsPerRow: {},
		draggedPositions: {},
		dragStartPosition: [],
		dragDirection: '',
		isDragged: false,

		color: d3.scaleQuantize(),
		xScale: d3.scaleBand(),
		yScale: d3.scaleBand(),
		xScaleReverse: {},
		yScaleReverse: {},		

		cells: [],
		cellLabels: [],
		rowLabels: [],
		colLabels: [],
		selectedColLabels: new Set(),
		selectedRowLabels: new Set(),

		startPoint_row: [],
		line: d3.line().x(d => d[0]).y(d => d[1]),
	}

	init();

	function init() {
		self.targetID = targetID;
	}

	function data(data) {
		self.data = [];
		var years = Object.keys(data[0]),
			numScale = d3.scaleLinear().range([0,1]);
		self.minYear = d3.min(years, d => +d);		

		data.sort( (a,b) => (a[self.minYear]-b[self.minYear]))

		data.forEach((d) => {
			Object.keys(d).forEach(k => {
				if (k!="Country Name"){
					self.data.push({"year": k, "Country": d["Country Name"], "value": d[k]});
				}
			})
		});
		numScale.domain(d3.extent(self.data, d => d.value));
		self.column = 'year';
		self.row = 'Country';
		self.data.forEach(d => self.normalizedData.push({"year": d.year, "Country": d.Country, "value": numScale(d.value)}));
		return this;
	}

	function draw() {
		target();

		Array.from(d3.group(self.data, d => d[self.column])).forEach(d => {			
			self.sortedRowsPerColumn[d[0]] = d[1].sort((a, b) => a.value - b.value).map(k => k[self.row]);
		})

		Array.from(d3.group(self.data, d => d[[self.row]])).forEach(d => {
			self.sortedColumnsPerRow[d[0]] = d[1].sort((a, b) => a.value - b.value).map(k => k[self.column]);
		})

		self.xScale.range([0, self.width])
					.domain(self.data.map(d => +d[self.column]).sort((a,b) => a-b))
					.padding(0.03);
		self.yScale.range([0, self.height])
					.domain(self.sortedRowsPerColumn[self.minYear])
					.padding(0.05);

		self.color.domain(d3.extent([... new Set(self.data.map(d => +d.value))]))
			.range(d3.range(9).map(function(d) { return "q" + d + "-9"; }));  

		self.cells = self.targetEle.append("g").attr("class", "grid_cells").selectAll("rect")
						.data(self.data)
						.enter().append("rect")
							.attr("class", d => `${self.color(d.value)} grid_cell cell_${d[self.column]} cell_${d[self.row]}`)
							.attr("transform", d => `translate(${self.xScale(d[self.column])}, ${self.yScale(d[self.row])})`)
							.attr("width", self.xScale.bandwidth())
							.attr("height", self.yScale.bandwidth())
							.on('mouseover', function() {
								d3.select(this).classed("mouseOver", true);
							})
							.on('mouseout', function() {
								d3.select(this).classed("mouseOver", false);
							})
							.call(d3.drag()
									.on("start", dragCellStarted)
									.on("drag", draggedCell)
									.on("end", dragCellEnded));

		self.cellLabels = self.targetEle.append("g").attr("class", "cell_labels").selectAll(".cell_label")
							.data(self.data)
							.enter().append("text")
								.attr("transform", d => {
									return `translate(${self.xScale(d[self.column])+self.xScale.bandwidth()/2}, ${self.yScale(d[self.row])+self.yScale.bandwidth()/2})`
								})
								.attr("class", d => `cell_label cell_label_${d[self.column]} cell_label_${d[self.row]}`)
								.text(d => d.value);

		var rowLabelsG = self.targetEle.append("g").attr("class", "row_labels");
		rowLabelsG.append('rect')
			.attr('x', -self.margin.left)
			.attr('y', 0)
			.attr('width', self.margin.left)
			.attr('height', self.height)
			.style('fill', 'black')
			.call(d3.drag()
					.on("start", dragRowLabelsStarted)
					.on("drag", draggedRowLabels)
					.on("end", dragRowLabelsEnded));
		self.rowLabels = rowLabelsG.selectAll(".row_label")
							.data(self.sortedRowsPerColumn[self.minYear])
							.enter().append("text")
								.attr("transform", d => `translate(-5, ${self.yScale(d)+self.yScale.bandwidth()/2})`)
								.attr("class", "row_label")
								.attr("id", d => `row_${d}`)
								.text(d => d)
								.on('mouseover', function() {
									d3.select(this).classed("mouseOverClick", true);
								})
								.on('mouseout', function() {
									d3.select(this).classed("mouseOverClick", false);
								})
								.on("click", UpdateByRow)
								// .call(d3.drag()
								// 	// .subject( (d) => { return {x: self.xScale(d)}; })
								// 	.on("start", dragRowStarted)
								// 	.on("drag", draggedRow)
								// 	.on("end", dragRowEnded));		

		var colLabelsG = self.targetEle.append("g").attr("class", "col_labels");
		colLabelsG.append('rect')
			.attr('x', 0)
			.attr('y', -self.margin.top/2)
			.attr('width', self.width)
			.attr('height', self.margin.top/2)
			.style('fill', 'black')
			.call(d3.drag()
					.on("start", dragColLabelsStarted)
					.on("drag", draggedColLabels)
					.on("end", dragColLabelsEnded));
		self.colLabels = colLabelsG.selectAll(".col_label")
							.data([... new Set(self.data.map(d => d[self.column]))])
							.enter().append("text")
								.attr("transform", d => `translate(${self.xScale(d)+self.xScale.bandwidth()/2}, ${-self.margin.top/4})`)
								.attr("class", "col_label")
								.attr("id", d => `col_${d}`)
								.text(d => d)
								.on('mouseover', function() {
									d3.select(this).classed("mouseOverClick", true);
								})
								.on('mouseout', function() {
									d3.select(this).classed("mouseOverClick", false);
								})
								// .call(d3.drag()
								// 	// .subject( (d) => { return {x: self.xScale(d)}; })
								// 	.on("start", dragColStarted)
								// 	.on("drag", draggedCol)
								// 	.on("end", dragColEnded))								
								.on("click", UpdateByColumn);

	}

	//////////////////// Private Methods ////////////////////

	function target() {
		self.target = d3.select(self.targetID);

        self.totalWidth = self.target.node().getBoundingClientRect().width;
        self.totalHeight = self.target.node().getBoundingClientRect().height;
        
        self.margin = {
                'left':self.totalWidth*0.15, 
                'right':self.totalWidth*0.1, 
                'top':self.totalHeight*0.15, 
                'bottom':self.totalHeight*0.1
              };

        self.width = self.totalWidth-self.margin.left-self.margin.right;
        self.height = self.totalHeight-self.margin.top-self.margin.bottom;

        self.targetSvg = self.target.append("svg")
            .attr("shape-rendering", "geometricPrecision")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", self.totalWidth)
            .attr("height", self.totalHeight);

        self.targetEle = self.targetSvg.append("g")
                			.attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");
	}

	function UpdateByColumn(year) {
		self.yScale.domain(self.sortedRowsPerColumn[year])
		updateMatrix();
	}

	function UpdateByRow(country) {
		self.xScale.domain(self.sortedColumnsPerRow[country])
		updateMatrix();
	}

	function updateMatrix() {
		self.targetEle.selectAll('.grid_cell')
			.transition()
				.duration(2500)
				.attr("transform", d => `translate(${self.xScale(d[self.column])}, ${self.yScale(d[self.row])})`)

		self.targetEle.selectAll(".cell_label")
			.transition()
				.duration(2500)
				.attr("transform", d => {
					return `translate(${self.xScale(d[self.column])+self.xScale.bandwidth()/2}, ${self.yScale(d[self.row])+self.yScale.bandwidth()/2})`
				})

		d3.selectAll(".col_label")
			.transition()
				.duration(2500) 
				.attr("transform", d => `translate(${self.xScale(d)+self.xScale.bandwidth()/2}, ${-self.margin.top/4})`)

		d3.selectAll(".row_label")
			.transition()
				.duration(2500) 
				.attr("transform", d => `translate(-5, ${self.yScale(d)+self.yScale.bandwidth()/2})`)
	}

	// Helper methods to determine x and y positions of a cell and the labels
	function xPosition(d) {
	  	var newP = self.draggedPositions[d];
	  	return newP == null ? self.xScale(d) : newP;
	}

	function yPosition(d) {
	  	var newP = self.draggedPositions[d];
	  	return newP == null ? self.yScale(d) : newP-self.yScale.bandwidth()/2;
	}

	function dragCellStarted(d) {
		d3.select(this).raise().classed("matrixActive", true);
		self.dragStartPosition = [d3.event.x, d3.event.y]
	}

	function draggedCell(d) {
		var curPos = [d3.event.x, d3.event.y];
		if (self.dragDirection == '') {
			if(Math.abs(curPos[0]-self.dragStartPosition[0])>0) {
				self.dragDirection = 'x';
			} else if(Math.abs(curPos[1]-self.dragStartPosition[1])>0) {			
				self.dragDirection = 'y';
			}
		} else {
			if (self.dragDirection == 'x') {
				self.draggedPositions[d[self.column]] = self.xScale(d[self.column])
				d3.selectAll(`.cell_${d[self.column]}`).raise().classed("matrixActive", true);
				d3.selectAll(`.cell_label_${d[self.column]}`).raise().classed("matrixActive", true);

				self.draggedPositions[d[self.column]] = Math.min(self.xScale.range()[1], Math.max(0, d3.event.x))
				var sortedDomain = Object.keys(self.sortedRowsPerColumn).sort((a, b) => xPosition(a) - xPosition(b));
				self.xScale.domain(sortedDomain)
				self.cells.transition().duration(100)
					.attr("transform", d => `translate(${xPosition(d[self.column])}, ${self.yScale(d[self.row])})`)
				self.cellLabels.transition().duration(100)
					.attr("transform", d => {
						return `translate(${xPosition(d[self.column])+self.xScale.bandwidth()/2}, ${self.yScale(d[self.row])+self.yScale.bandwidth()/2})`
					})
				self.colLabels.transition().duration(100)
					.attr("transform", d => `translate(${xPosition(d)+self.xScale.bandwidth()/2}, ${-self.margin.top/4})`)

				d3.selectAll(`.cell_${d[self.column]}`).transition().duration(100)
					.attr("transform", d => `translate(${xPosition(d[self.column])-self.xScale.bandwidth()/2}, ${self.yScale(d[self.row])})`)
				d3.selectAll(`.cell_label_${d[self.column]}`).transition().duration(100)
					.attr("transform", d => {
						return `translate(${xPosition(d[self.column])}, ${self.yScale(d[self.row])+self.yScale.bandwidth()/2})`
					})
				d3.selectAll(`#col_${d[self.column]}`).transition().duration(100)
					.attr("transform", d => `translate(${xPosition(d)}, ${-self.margin.top/4})`)
			} else {
				self.draggedPositions[d[self.row]] = self.xScale(d[self.row])
				d3.selectAll(`.cell_${d[self.row]}`).raise().classed("matrixActive", true);
				d3.selectAll(`.cell_label_${d[self.row]}`).raise().classed("matrixActive", true);

				self.draggedPositions[d[self.row]] = Math.min(self.yScale.range()[1], Math.max(0, d3.event.y))
				var sortedDomain = Object.keys(self.sortedColumnsPerRow).sort((a, b) => yPosition(a) - yPosition(b));
				self.yScale.domain(sortedDomain)
				self.cells.attr("transform", d => `translate(${self.xScale(d[self.column])}, ${yPosition(d[self.row])})`)
				self.cellLabels.attr("transform", d => {
					return `translate(${self.xScale(d[self.column])+self.xScale.bandwidth()/2}, ${yPosition(d[self.row])+self.yScale.bandwidth()/2})`
				})
				self.rowLabels.attr("transform", d => `translate(-5, ${yPosition(d)+self.yScale.bandwidth()/2})`)
			}
		}
	}

	function dragCellEnded(d) {

		self.dragStartPosition = [];
		self.dragDirection = '';
		self.draggedPositions = {};

		self.colLabels.transition()
			.duration(500)
			.attr("transform", d => `translate(${xPosition(d)+self.xScale.bandwidth()/2}, ${-self.margin.top/4})`)

		self.rowLabels.transition()
			.duration(500)
			.attr("transform", d => `translate(-5, ${yPosition(d)+self.yScale.bandwidth()/2})`)

		d3.selectAll(`.grid_cell`).transition()
			.duration(500)
			.attr("transform", d => `translate(${self.xScale(d[self.column])}, ${self.yScale(d[self.row])})`)

		d3.selectAll(`.cell_label`).transition()
			.duration(500)
			.attr("transform", d => {
				return `translate(${self.xScale(d[self.column])+self.xScale.bandwidth()/2}, ${self.yScale(d[self.row])+self.yScale.bandwidth()/2})`
			})

		d3.select(this).classed("matrixActive", false);
		d3.selectAll(`.grid_cell`).raise().classed("matrixActive", false);
		d3.selectAll(`.cell_label`).raise().classed("matrixActive", false);
	}

	function dragColLabelsStarted() {	
		self.xScale.domain().forEach(d => self.xScaleReverse[d]=[self.xScale(d), self.xScale(d)+self.xScale.bandwidth()]);	
		self.startPoint_row = d3.mouse(this);	
		draggedColLabels();
	}

	function draggedColLabels() {	
		for (var key in self.xScaleReverse) {
			if (self.xScaleReverse[key][0] <= d3.event.x && d3.event.x <= self.xScaleReverse[key][1]) {
				self.targetEle.select(`#col_${key}`).classed('selectedLabel', true);
				self.selectedColLabels.add(key);
				// if (null==self.targetEle.selectAll('.horizontalLine')) {
				// 	self.targetEle.append("path")
				// 		.datum([self.startPoint_row, [self.startPoint_row[0]+50, self.startPoint_row[1]]])
				// 			.attr("class", "horizontalLine reorderLine")
				// 			.attr("d", self.line);	
				// 		}	
				// 		console.log(self.targetEle.selectAll('.horizontalLine'))			
				// } else {
				// 	self.targetEle.selectAll('.horizontalLine')
				// 		.datum([self.startPoint_row, [d3.mouse(this)[0], self.startPoint_row[1]]])
				// 		.attr("d", self.line);				
				// }
			}
		}
	}

	function dragColLabelsEnded() {
		var subsetKeys = getOptimalOrder(self.selectedColLabels, 'column'),
			sortedKeys = [],
			i = 0;
		for (var key in self.xScaleReverse) {
			if (subsetKeys.includes(key)) {
				sortedKeys.push(subsetKeys[i]);
				++i;
			} else {
				sortedKeys.push(key);
			}
		}
		self.xScale.domain(sortedKeys);
		updateMatrix();
	}

	function dragRowLabelsStarted() {	
		self.yScale.domain().forEach(d => self.yScaleReverse[d]=[self.yScale(d), self.yScale(d)+self.yScale.bandwidth()]);
		draggedRowLabels(this);
	}

	function draggedRowLabels() {	
		for (var key in self.yScaleReverse) {
			if (self.yScaleReverse[key][0] <= d3.event.y && d3.event.y <= self.yScaleReverse[key][1]) {
				self.targetEle.select(`#row_${key}`).classed('selectedLabel', true);				
				self.selectedRowLabels.add(key);
			}
		}	
	}

	function dragRowLabelsEnded() {
		var subsetKeys = getOptimalOrder(self.selectedRowLabels, 'row'),
			sortedKeys = [],
			i = 0;
		for (var key in self.yScaleReverse) {
			if (subsetKeys.includes(key)) {
				sortedKeys.push(subsetKeys[i]);
				++i;
			} else {
				sortedKeys.push(key);
			}
		}
		self.yScale.domain(sortedKeys);
		updateMatrix();		
	}

	function getOptimalOrder(subset, filterBy) {
		var subsetData;
		if (filterBy=='column') {
			subsetData = d3.nest()
							.key(d => d[self.column])
  							.rollup(v => v.map(k => +k.value))
							.entries(self.normalizedData.filter(d => subset.has(d[self.column])))
		} else {
			subsetData = d3.nest()
							.key(d => d[self.row])
  							.rollup(v => v.map(k => +k.value))
							.entries(self.normalizedData.filter(d => subset.has(d[self.row])))
		}
		
		subsetData.sort((d1, d2) => {
			return Math.sqrt(d1.value.reduce((sum, val) => (sum + Math.pow(val,2)),0)) - Math.sqrt(d2.value.reduce((sum, val) => (sum + Math.pow(val,2)),0));
		})
		
		return subsetData.map(d => d.key);
		// console.log(subset, subsetData.map(d => d.key));

		// var distances = [];
		// for (var i = 0; i < subsetData.length; i++) {
		// 	distances.push([0])
		// 	for (var j = i + 1; j < subsetData.length; j++)
		// 		distances[i].push(Math.sqrt(subsetData[i].value.reduce((sum, val, idx) => (sum+Math.pow(val-subsetData[j].value[idx],2)),0)))
		// }
   		// console.log(distances);
	}

	return{
		data,
		draw
	};
}



/*
	function dragColStarted(d) {
		self.draggedPositions[d] = self.xScale(d)
		d3.select(this).raise().classed("matrixActive", true);
		d3.selectAll(`.cell_${d}`).raise().classed("matrixActive", true);
		d3.selectAll(`.cell_label_${d}`).raise().classed("matrixActive", true);
	}

	function draggedCol(d) {
		self.draggedPositions[d] = Math.min(self.xScale.range()[1], Math.max(0, d3.event.x))
		var sortedDomain = Object.keys(self.sortOrderbyRow).sort((a, b) => xPosition(a) - xPosition(b));
		self.xScale.domain(sortedDomain)
		self.cells.attr("transform", d => `translate(${xPosition(d.year)}, ${self.yScale(d.Country)})`)
		self.cellLabels.attr("transform", d => {
			return `translate(${xPosition(d.year)+self.xScale.bandwidth()/2}, ${self.yScale(d.Country)+self.yScale.bandwidth()/2})`
		})
		self.colLabels.attr("transform", d => `translate(${xPosition(d)+self.xScale.bandwidth()/2}, -15)`)

		self.isDragged = true;
	}

	function dragColEnded(d) {	
		if (self.isDragged) {
			delete self.draggedPositions[d];
			d3.select(this).transition()
				.duration(500)
				.attr("transform", d => `translate(${self.xScale(d)+self.xScale.bandwidth()/2}, -15)`)

			d3.selectAll(`.cell_${d}`).transition()
				.duration(500)
				.attr("transform", d => `translate(${self.xScale(d.year)}, ${self.yScale(d.Country)})`)

			d3.selectAll(`.cell_label_${d}`).transition()
				.duration(500)
				.attr("transform", d => {
					return `translate(${self.xScale(d.year)+self.xScale.bandwidth()/2}, ${self.yScale(d.Country)+self.yScale.bandwidth()/2})`
				})

			d3.select(this).classed("matrixActive", false);
			d3.selectAll(`.cell_${d}`).raise().classed("matrixActive", false);
			d3.selectAll(`.cell_label_${d}`).raise().classed("matrixActive", false);
		} else {
			UpdateByColumn(d);
			self.isDragged = false;
		}
	}

	function dragRowStarted(d) {
		self.draggedPositions[d] = self.yScale(d)
		d3.select(this).raise().classed("matrixActive", true);
		d3.selectAll(`.cell_${d}`).raise().classed("matrixActive", true);
		d3.selectAll(`.cell_label_${d}`).raise().classed("matrixActive", true);
	}

	function draggedRow(d) {
		self.draggedPositions[d] = Math.min(self.yScale.range()[1], Math.max(0, d3.event.y))
		var sortedDomain = Object.keys(self.sortOrderbyColumn).sort((a, b) => yPosition(a) - yPosition(b));
		self.yScale.domain(sortedDomain)
		self.cells.attr("transform", d => `translate(${self.xScale(d.year)}, ${yPosition(d.Country)})`)
		self.cellLabels.attr("transform", d => {
			return `translate(${self.xScale(d.year)+self.xScale.bandwidth()/2}, ${yPosition(d.Country)+self.yScale.bandwidth()/2})`
		})
		self.rowLabels.attr("transform", d => `translate(-5, ${yPosition(d)+self.yScale.bandwidth()/2})`)

		self.isDragged = true;
	}

	function dragRowEnded(d) {
		if (self.isDragged) {
			delete self.draggedPositions[d];
			d3.select(this).transition()
				.duration(500)
				.attr("transform", d => `translate(-5, ${yPosition(d)+self.yScale.bandwidth()/2})`)

			d3.selectAll(`.cell_${d}`).transition()
				.duration(500)
				.attr("transform", d => `translate(${self.xScale(d.year)}, ${self.yScale(d.Country)})`)

			d3.selectAll(`.cell_label_${d}`).transition()
				.duration(500)
				.attr("transform", d => {
					return `translate(${self.xScale(d.year)+self.xScale.bandwidth()/2}, ${self.yScale(d.Country)+self.yScale.bandwidth()/2})`
				})

			d3.select(this).classed("matrixActive", false);
			d3.selectAll(`.cell_${d}`).raise().classed("matrixActive", false);
			d3.selectAll(`.cell_label_${d}`).raise().classed("matrixActive", false);
		} else {
			UpdateByRow(d);
			self.isDragged = false;
		}
	}
*/

/*function selectColLabels(selection) {
	var drawLine = false,
		startPoint = null,
		line = d3.line().x(d => d[0]).y(d => d[1]),
		xScaleReverse = {};

	self.xScale.domain().forEach(d => xScaleReverse[d]=[self.xScale(d), self.xScale(d)+self.xScale.bandwidth()]);
	console.log(xScaleReverse);

	selection.on('mousedown', function () {
		console.log('down', d3.event.x, d3.event.x-self.width);
		drawLine = true;
		startPoint = d3.mouse(this);

		self.targetEle.selectAll('.horizontalLine').remove();

		self.targetEle.append("path")
			.datum([startPoint, startPoint])
			.attr("class", "horizontalLine sortLine")
			.attr("d", line);
	})
	.on('mousemove', function () {
		if (drawLine) {
			var curPos = d3.mouse(this);
			self.targetEle.selectAll('.horizontalLine')
				.datum([startPoint, [curPos[0], startPoint[1]]])
				.attr("d", line);
		}
	})
	.on('mouseup', function () {
		console.log('up');
		drawLine = false;
	})
}*/
