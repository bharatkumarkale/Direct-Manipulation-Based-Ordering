// View to handle creation of a bar chart and the interactions on it

/* Authors: Bharat Kale <bkale@niu.edu>
			
   Version: 1.0.0
   Date: 04-10-2020
*/
"use strict"

var App = App || {};

let BarChartView = function(targetID) {
	let self = {
		targetID: "",
		target: null,
		totalWidth: "",
		totalHeight: "",
		width: "",
		height: "",
		margin: "",
		data: null,
		targetSvg: null,
		targetEle: null,

		xScale: d3.scaleBand(),
		yScale: d3.scaleLinear(),
		xAxis: null,
		yAxis: null,

		draggedPositions: {},
		rects: null,
	}

	init();

	function init() {
		self.targetID = targetID;
	}

	function data(data) {
		self.data=data;
		return this;
	}

	function draw() {
		target();

		self.rects = self.targetEle.selectAll('g')
						.data(self.data)
						.enter().append("g")
							.attr("transform", (d) => {
									return `translate(${self.xScale(d.letter)},${self.yScale(d.frequency)})`;
								})
							.attr("class", d => {
								return d.frequency==d3.max(self.data.map(k => k.frequency)) ? "max rect" : "rect";
							})
							.call(d3.drag()
								.subject( (d) => { return {x: self.xScale(d.letter)}; })
								.on("start", dragstarted)
								.on("drag", dragged)
								.on("end", dragended));

		self.rects.append("rect")
			.attr("class", "barRect")
			.attr("height", d => self.yScale(0) - self.yScale(d.frequency))
			.attr("width", self.xScale.bandwidth() )
			.on('mouseover', function(d) {
					d3.select(this).classed("mouseOver", true);
			})
			.on('mouseout', function(d) {
					d3.select(this).classed("mouseOver", false);
			});

		self.targetSvg.append('rect')
			.attr('x', self.margin.left)
			.attr('y', self.totalHeight - self.margin.bottom*0.95)
			.attr('width', self.width)
			.attr('height', self.margin.bottom)
			.style('fill', 'black')
			.call(drawLine);

		self.xAxis = self.targetSvg.append('g')
						.attr("transform", `translate(${self.margin.left},${self.totalHeight - self.margin.bottom*0.95})`)
						.attr('class', 'axis x')
			    		.call(d3.axisBottom(self.xScale).tickFormat(i => "").tickSizeOuter(0)) //i
			    		.append("text")
							.attr("x", self.width)
							.attr("y", self.margin.bottom*0.3)
							.attr("class", "axisLabel")
							.attr("fill", "currentColor")
							.attr("text-anchor", "end")
							.attr("alignment-baseline", "hanging")
							.text("Alphabet");

		var xAxisTicks = self.targetSvg.append("g").attr("class", "x_ticks").selectAll(".x_tick")
							.data(self.xScale.domain())
							.enter().append("text")
								.attr("x", d => self.margin.left+self.xScale(d)+self.xScale.bandwidth()/2)
								.attr("y", self.totalHeight-self.margin.bottom*0.75)
								.attr("class", "x_tick")
								.text(d => d)
								.on('mouseover', function() {
									d3.select(this).classed("mouseOver", true);
								})
								.on('mouseout', function() {
									d3.select(this).classed("mouseOver", false);
								});

		self.yAxis = self.targetSvg.append('g')
						.attr("transform", `translate(${self.margin.left*0.9},${self.margin.top})`)
						.attr('class', 'axis y')
						.call(d3.axisLeft(self.yScale).ticks(null, '%'))
						.append("text")
							.attr("x", -self.margin.left*0.8)
							.attr("y", -self.margin.top/2)
							.attr("class", "axisLabel")
							.attr("fill", "currentColor")
							.attr("text-anchor", "start")
							.text("↑ Frequency")
	}


	//////////////////// Private Methods ////////////////////

	function target() {
		self.target = d3.select(self.targetID);

        self.totalWidth = self.target.node().getBoundingClientRect().width;
        self.totalHeight = self.target.node().getBoundingClientRect().height;
        
        self.margin = {
                'left':self.totalWidth*0.1, 
                'right':self.totalWidth*0.05, 
                'top':self.totalHeight*0.05, 
                'bottom':self.totalHeight*0.15
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

		self.xScale.range([0, self.width])
					.domain(self.data.map(d => d.letter))
					.padding(0.1);

		self.yScale.domain([0, d3.max(self.data, d => d.frequency)]).nice()
					.range([self.height, 0]);
	}

	function dragstarted(d) {
		self.draggedPositions[d.letter] = self.xScale(d.letter)
		d3.select(this).raise().classed("barActive", true);
	}

	function dragged(d) {
		self.draggedPositions[d.letter] = Math.min(self.xScale.range()[1], Math.max(0, d3.event.x))
		self.data.sort((a, b) => position(a) - position(b));
		self.xScale.domain(self.data.map(k => k.letter))
		self.rects.attr('transform', d => `translate(${position(d)},${self.yScale(d.frequency)})`);

		self.targetSvg.selectAll(".x_tick")
				.attr("x", d => self.margin.left+self.xScale(d)+self.xScale.bandwidth()/2);
	}

	function dragended(d,i) {
		delete self.draggedPositions[d.letter];
		d3.select(this).transition()
			.duration(500)
			.attr("transform", d => `translate(${position(d)},${self.yScale(d.frequency)})`);
		d3.select(this).classed("barActive", false);

		if (d3.event.x>self.xScale.range()[1]) { 
			d3.select(this).select('rect').classed("mouseOver", false);
			if (d3.select(this).attr('class')=='max rect') {
				sortAndUpdateRects(false)
			}
		} else if (d3.event.x<self.xScale.range()[0]) { 
			d3.select(this).select('rect').classed("mouseOver", false);
			if (d3.select(this).attr('class')=='max rect') {
				sortAndUpdateRects(true)
			}
		}

		self.targetSvg.selectAll(".x_tick")
			.transition()
				.duration(1000) 
				.attr("x", d => self.margin.left+self.xScale(d)+self.xScale.bandwidth()/2);
	}

	/////// Helper method to determine x position of a given rectangle /////// 
	function position(d) {
	  	var newP = self.draggedPositions[d.letter];
	  	return newP == null ? self.xScale(d.letter) : newP;
	}

	/////// Sorts the entire dataset and updates the visualization /////// 
	function sortAndUpdateRects(asc) {
		if (asc) {
			self.data.sort((a, b) => b.frequency - a.frequency);
		} else {
			self.data.sort((a, b) => a.frequency - b.frequency);
		}
		self.xScale.domain(self.data.map(d => d.letter))
		var g = self.targetEle.selectAll('g')
					.data(self.data, d => d.letter)
					.transition().duration(1000)
						.attr("transform", (d) => {
								return `translate(${self.xScale(d.letter)},${self.yScale(d.frequency)})`;
							})
						.attr("class", d => {
							return d.frequency==d3.max(self.data.map(k => k.frequency)) ? "max rect" : "rect";
						})

		g.selectAll("rect")
			.attr("height", d => {
				return self.yScale(0) - self.yScale(d.frequency);
			})
	}

	function drawLine(selection) {
	// 	var xy0, 
	// 		path='', 
	// 		keep = false, 
	// 		line = d3.line()
	// 					.x(d => d[0])
	// 					.y(d => d[1]);

	// 		selection
	// 			.on('mousedown', function(){ 
	// 				keep = true;
	// 				xy0 = d3.mouse(this);
	// 				path = self.targetSvg
	// 							.append('path')
	// 							// .attr('d', line([xy0, xy0]))
	// 							.attr("x1", xy0[0])
	// 							.attr("y1", xy0[1])
	// 							.attr("x2", xy0[0])
	// 							.attr("y2", xy0[1])
	// 							.style({'stroke': 'white', 'stroke-width': '1px'});
	// 				// console.log(xy0);
	// 			})
	// 			.on('mouseup', () => keep = false)
	// 			.on('mousemove', function(){ 
	// 				if (keep) {

	// 					var xy1 = d3.mouse(this);
	// 					var Line = line([xy0, d3.mouse(this)]);
	// 					console.log(path);
	// 					self.targetSvg.selectAll('path')
	// 						.attr("x2", xy1[0])
	// 						.attr("y2", xy1[1]);
	// 				}
	// 			});
	}

	return{
		data,
		draw
	};
}
