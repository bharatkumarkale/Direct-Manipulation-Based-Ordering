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