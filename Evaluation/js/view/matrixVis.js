// View to handle creation of a bar chart and the interactions on it

/* Authors: Bharat Kale <bkale@niu.edu>
			
   Version: 1.0.0
   Date: 04-10-2020
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
		row: '',
		column: '',
		InitialOrderBy: 'GDP ($ per capita)',
		
		xScale: d3.scaleBand(),
		yScale: d3.scaleBand(),	
		cellRadiusScale: d3.scaleLinear(),	

		colLableAngle: -60,
		order: null,
	}

	init();

	function init() {
		self.targetID = targetID;
	}

	function data(data) {
		self.data = [];
		var numScale = d3.scaleLinear().range([0,1]);
		
		var attributeDomain = {};
		Object.keys(data[0]).forEach(k => {
			if (k!="Country"){
				attributeDomain[k] = d3.extent(data.map(d => +d[k]));
			}
		})

		data.forEach((d) => {
			Object.keys(d).forEach(k => {
				if (k!="Country"){
					numScale.domain(attributeDomain[k])
					self.data.push({"columnAttr": k, "Country": d["Country"], "value": d[k], "normalizedValue": numScale(d[k])});
				}
			})
		});

		self.column = "columnAttr";
		self.row = "Country";
		return this;
	}

	function draw() {
		initTarget();

		// self.order = new MatrixVisOrdering();

		// // Array.from(d3.group(self.data, d => d[self.column])).forEach(d => {			
		// // 	self.sortedRowsPerColumn[d[0]] = d[1].sort((a, b) => b.value - a.value).map(k => k[self.row]);
		// // })

		// // Array.from(d3.group(self.data, d => d[[self.row]])).forEach(d => {
		// // 	self.sortedColumnsPerRow[d[0]] = d[1].sort((a, b) => b.value - a.value).map(k => k[self.column]);
		// // })

		self.xScale.range([0, self.width])
					.domain(self.data.map(d => d[self.column]))
					.padding(0.03);
		self.yScale.range([0, self.height])
					.domain(self.data.map(d => d[self.row]))
					.padding(0.05);

		self.cellRadiusScale.range([3,d3.min([self.xScale.bandwidth(), self.yScale.bandwidth()])/2])
					.domain([0,1]);

		self.targetEle.append("g").attr("class", "grid_cells").selectAll("circle")
			.data(self.data)
			.enter().append("circle")
				.attr("transform", d => {
					return `translate(${self.xScale(d[self.column])+self.xScale.bandwidth()/2}, ${self.yScale(d[self.row])+self.yScale.bandwidth()/2})`
				})
				.attr('r', d => self.cellRadiusScale(d.normalizedValue))
				.attr("class", d => `grid_cell cell_${format(d[self.column])} cell_${format(d[self.row])}`)
				.on('mouseover', function() {
					d3.select(this).classed("mouseOver", true);
				})
				.on('mouseout', function() {
					d3.select(this).classed("mouseOver", false);
				})
				// .call(d3.drag()
				// 		.on("start", self.order.dragCellStarted)
				// 		.on("drag", self.order.draggedCell)
				// 		.on("end", self.order.dragCellEnded));

		var rowLabelsG = self.targetEle.append("g").attr("class", "row_labels");
		rowLabelsG.append('rect')
			.attr('x', -self.margin.left)
			.attr('y', 0)
			.attr('width', self.margin.left)
			.attr('height', self.height)
			.style('fill', 'black')
			// .call(d3.drag()
			// 	.on("start", self.order.dragRowLabelsStarted)
			// 	.on("drag", self.order.draggedRowLabels)
			// 	.on("end", self.order.dragRowLabelsEnded));

		rowLabelsG.selectAll(".row_label")
			.data([... new Set(self.data.map(d => d[self.row]))])
			.enter().append("text")
				.attr("transform", d => `translate(-5, ${self.yScale(d)+self.yScale.bandwidth()/2})`)
				.attr("class", "row_label")
				.attr("id", d => `row_${format(d)}`)
				.text(d => d)
				.on('mouseover', function() {
					d3.select(this).classed("mouseOverClick", true);
				})
				.on('mouseout', function() {
					d3.select(this).classed("mouseOverClick", false);
				});		

		var colLabelsG = self.targetEle.append("g").attr("class", "col_labels");
		colLabelsG.append('rect')
			.attr('x', 0)
			.attr('y', -self.margin.top/2)
			.attr('width', self.width)
			.attr('height', self.margin.top/2)
			.style('fill', 'black')
			// .call(d3.drag()
			// 	.on("start", self.order.dragColLabelsStarted)
			// 	.on("drag", self.order.draggedColLabels)
			// 	.on("end", self.order.dragColLabelsEnded));
			
		colLabelsG.selectAll(".col_label")
			.data([... new Set(self.data.map(d => d[self.column]))])
			.enter().append("text")
				.attr("transform", d => `translate(${self.xScale(d)+self.xScale.bandwidth()/2}, ${-self.margin.top*0.08})rotate(${self.colLableAngle})`)
				.attr("class", "col_label")
				.attr("id", d => `col_${format(d)}`)
				.text(d => d)
				.on('mouseover', function() {
					d3.select(this).classed("mouseOverClick", true);
				})
				.on('mouseout', function() {
					d3.select(this).classed("mouseOverClick", false);
				});

		// self.order.setTargetId(self.targetID.substring(1,self.targetID.length))
		// 			.setData(self.data)
		// 			.setMargin(self.margin)
		// 			.setXScale(self.xScale)
		// 			.setRowAttribute("Country")
		// 			.setYScale(self.yScale)
		// 			.setColumnAttribute("columnAttr")
		// 			.setRowLabelClass("row_label")
		// 			.setColLabelClass("col_label")
		// 			.setCellClass("grid_cell")
		// 			.setColumnLabelRotation(self.colLableAngle);
	}

	function clear() {
		document.getElementById(targetID.slice(1)).innerHTML = '';
	}


	function initTarget() {
		self.target = d3.select(self.targetID);

		self.totalWidth = self.target.node().getBoundingClientRect().width;
		self.totalHeight = self.target.node().getBoundingClientRect().height;

		self.margin = {
			'left':self.totalWidth*0.15, 
			'right':self.totalWidth*0.05, 
			'top':self.totalHeight*0.32, 
			'bottom':self.totalHeight*0.05
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

	function format(str) {
		return str.replace(/\W/g, '');
	}

	return{
		data,
		draw,
		clear,
	};
}