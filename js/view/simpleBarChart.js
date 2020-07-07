// View to handle creation of a bar chart and the interactions on it

/* Authors: Bharat Kale <bkale@niu.edu>
			
   Version: 1.0.0
   Date: 04-10-2020
*/
"use strict"

var App = App || {};

let SimpleBarChartView = function(targetID) {
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
		rects: null,

		order: null,
		selection: [],
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
		initTarget();

		self.order = new SimpleBarChartOrdering();
		self.rects = self.targetEle.selectAll('g')
						.data(self.data)
						.enter().append("rect")
							.attr("transform", (d) => {
									return `translate(${self.xScale(d.letter)},${self.yScale(d.frequency)})`;
								})
							.attr("id", d => `bar_${d.letter}`)
							.attr("class", "barRect")
							.attr("height", d => self.yScale(0) - self.yScale(d.frequency))
							.attr("width", self.xScale.bandwidth() )
							.on('mouseover', function(d) {
									d3.select(this).classed("mouseOver", true);
							})
							.on('mouseout', function(d) {
								if (self.selection.indexOf(d) == -1) {
									d3.select(this).classed("mouseOver", false);
								}
							})
							.on("click", function(d) {
								if(self.selection.indexOf(d) == -1) {
									self.selection.push(d); 
									d3.select(this).classed("mouseOver", true);
								}
								else {
									self.selection.splice(self.selection.indexOf(d), 1);
									d3.select(`#bar_${d.letter}`).classed("mouseOver", false);
								}

								if (self.selection.length>0) {
									self.order.setSelection(self.selection);
								} else {
									self.order.setSelection(self.data);
								}
								d3.event.stopPropagation();
							})
							.call(d3.drag()
								.on("start", self.order.dragstarted)
								.on("drag", self.order.dragged)
								.on("end", self.order.dragended));

		self.targetSvg.append('rect')
			.attr('x', self.margin.left)
			.attr('y', self.totalHeight - self.margin.bottom*0.95)
			.attr('width', self.width)
			.attr('height', self.margin.bottom)
			.style('fill', 'black');

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
						.attr("transform", `translate(${self.margin.left*0.7},${self.margin.top})`)
						.attr('class', 'axis y')
						.call(d3.axisLeft(self.yScale).ticks(null, '%'))
						.append("text")
							.attr("x", -self.margin.left*0.8)
							.attr("y", -self.margin.top/2)
							.attr("class", "axisLabel")
							.attr("fill", "currentColor")
							.attr("text-anchor", "start")
							.text("↑ Frequency")
	
		self.order.setTargetId(self.targetID.substring(1,self.targetID.length))
					.setData(self.data)
					.setBars(self.rects)
					.setMargin(self.margin)
					.setXScale(self.xScale)
					.setXAttribute("letter")
					.setYScale(self.yScale)
					.setYAttribute("frequency")
					.setXTickClass("x_tick");
	}

	function clear() {
		document.getElementById(targetID.slice(1)).innerHTML = '';
	}

	function initTarget() {
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
            .attr("height", self.totalHeight)
            .on("click", function(d) {
        		self.targetEle.selectAll('.barRect').classed("mouseOver", false);
        		self.targetEle.selectAll('.barRect').classed("barActive", false);
        		self.targetEle.selectAll('.barRect').classed("barSemiActive", false);

        		self.selection = [];
        		if (self.order) {
					self.order.setSelection(self.data);
				}           	
            });
        self.targetEle = self.targetSvg.append("g")
                			.attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");

		self.xScale.range([0, self.width])
					.domain(self.data.map(d => d.letter))
					.padding(0.1);

		self.yScale.domain([0, d3.max(self.data, d => d.frequency)]).nice()
					.range([self.height, 0]);
	}

	return{
		data,
		draw,
		clear,
	};
}