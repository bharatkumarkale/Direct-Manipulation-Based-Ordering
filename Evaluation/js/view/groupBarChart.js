// View to handle creation of a bar chart and the interactions on it

/* Authors: Bharat Kale <bkale@niu.edu>
			
   Version: 1.0.0
   Date: 04-10-2020
*/
"use strict"

var App = App || {};

let GroupBarChartView = function(targetID) {
	let self = {
		targetID: "",
		target: null,
		totalWidth: "",
		totalHeight: "",
		width: "",
		height: "",
		margin: "",
		data: null,
		keys: [],
		targetSvg: null,
		targetEle: null,

		xScaleGroup: d3.scaleBand().paddingInner(0.1),
		xScaleBar: d3.scaleBand().padding(0.05),
		yScale: d3.scaleLinear(),
		colorScale: d3.scaleOrdinal().range(['#ffffcc','#c7e9b4','#7fcdbb','#41b6c4','#1d91c0','#225ea8','#0c2c84']),
			// ['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69']),
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
		self.keys = data.columns.slice(1);
		return this;
	}

	function draw() {
		initTarget();

		self.targetEle.append("g")
			.selectAll("g")
			.data(self.data)
			.enter().append("g")
				.attr("transform", d => "translate(" + self.xScaleGroup(d.State) + ",0)")
			.selectAll("rect")
			.data(d => self.keys.map(key => {
				var obj={};
				obj['key']= key;
				obj['value']= d[key];
				return obj;
			}) )
			.enter().append("rect")
				.attr("x", d => self.xScaleBar(d.key))
				.attr("y", d => self.yScale(d.value))
				.attr("width", self.xScaleBar.bandwidth())
				.attr("height", d => { return self.height - self.yScale(d.value); })
				.attr("fill", d => self.colorScale(d.key))
				.on('mouseover', function(d) {
					d3.select(this).classed("mouseOver", true);
				})
				.on('mouseout', function(d) {
					if (self.selection.indexOf(d) == -1) {
						d3.select(this).classed("mouseOver", false);
					}
				});

		self.xAxis = self.targetSvg.append('g')
						.attr("transform", `translate(${self.margin.left},${self.totalHeight - self.margin.bottom*0.95})`)
						.attr('class', 'axis x')
			    		.call(d3.axisBottom(self.xScaleGroup).tickFormat(i => "").tickSizeOuter(0)) //i
			    		.append("text")
							.attr("x", self.width)
							.attr("y", self.margin.bottom*0.3)
							.attr("class", "axisLabel")
							.attr("fill", "currentColor")
							.attr("text-anchor", "end")
							.attr("alignment-baseline", "hanging")
							.text("State");

		self.targetSvg.append("g").attr("class", "x_ticks").selectAll(".x_tick")
			.data(self.xScaleGroup.domain())
			.enter().append("text")
				.attr("x", d => self.margin.left+self.xScaleGroup(d)+self.xScaleGroup.bandwidth()/2)
				.attr("y", self.totalHeight-self.margin.bottom*0.75)
				.attr("class", "x_tick")
				.text(d => d)
				.on('mouseover', function() {
					d3.select(this).classed("mouseOver", true);
				})
				.on('mouseout', function() {
					d3.select(this).classed("mouseOver", false);
				});

		self.yAxis = self.targetSvg.append("g")
						.attr("transform", `translate(${self.margin.left*0.9},${self.margin.top})`)
						.attr("class", "axis y")
						.call(d3.axisLeft(self.yScale).ticks(null, "s"))
						.append("text")
							.attr("x", -self.margin.left*0.8)
							.attr("y", -self.margin.top/2)
							.attr("class", "axisLabel")
							.attr("fill", "currentColor")
							.attr("text-anchor", "start")
							.text("Population");

		drawLegend()
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
            	if (!d3.event.defaultPrevented) {
            		self.targetEle.selectAll('.barRect').classed("mouseOver", false);
            		self.targetEle.selectAll('.barRect').classed("barActive", false);
            		self.targetEle.selectAll('.barRect').classed("barSemiActive", false);

            		self.selection = [];
            		if (self.order) {
						self.order.setSelection(self.data);
					}
            	}
            });
        self.targetEle = self.targetSvg.append("g")
                			.attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");

		self.xScaleGroup.range([0, self.width])
			.domain(self.data.map(d => d.State));

		self.xScaleBar.rangeRound([0, self.xScaleGroup.bandwidth()])
					.domain(self.keys);

		self.yScale.domain([0, d3.max(self.data, d => d3.max(self.keys, key => +d[key]) )]).nice()
					.range([self.height, 0]);

	}

	function drawLegend() {
		var legend = self.targetEle.append("g")
						.attr("font-size", 10)
						.attr("text-anchor", "end")
						.selectAll("g")
						.data(self.keys.slice().reverse())
						.enter().append("g")
							.attr("transform", (d, i) => "translate(0," + i * 20 + ")");

		legend.append("rect")
			.attr("x", self.width - 19)
			.attr("width", 19)
			.attr("height", 19)
			.attr("fill", self.colorScale);

		legend.append("text")
			.attr("x", self.width - 24)
			.attr("y", 9.5)
			.attr("dy", "0.32em")
			.attr("fill", "white")
			.text(d => d);
	}

	return{
		data,
		draw,
		clear,
	};
}