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

		groupDraggedPositions: {},
		subTypeSelected: false,
		selectedSubType: '',
		selectedGroups: [],
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
				.attr("class", d => `group ${format(d.State)}`)
			.selectAll("rect")
			.data(d => self.keys.map(key => {
				var obj={};
				obj['key']= key;
				obj['value']= d[key];
				obj['group']= d.State;
				return obj;
			}) )
			.enter().append("rect")
				.attr("x", d => self.xScaleBar(d.key))
				.attr("y", d => self.yScale(d.value))
				.attr("width", self.xScaleBar.bandwidth())
				.attr("height", d => { return self.height - self.yScale(d.value); })
				.attr("class", d => `group_${format(d.group)} key_${format(d.key)} bar`)
				.attr("fill", d => self.colorScale(d.key))
				.on('mouseover', function(d) {
					d3.select(this).classed("mouseOver", true);
				})
				.on('mouseout', function(d) {
					if (self.selection.indexOf(d) == -1) {
						d3.select(this).classed("mouseOver", false);
					}
				})
				.on('click', function(d) {
					self.subTypeSelected = true;
					if (self.subTypeSelected) {
						self.selectedSubType = d.key;
					} else {
						self.selectedSubType = '';
					}

					self.targetEle.selectAll(`.bar`).classed("selectedBar", false);
					self.targetEle.selectAll(`.key_${format(d.key)}`).classed("selectedBar", true);
					d3.event.preventDefault();
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
				})
				.on('click', function(d) {
					if (self.selectedGroups.includes(d)) {
						self.selectedGroups.splice(self.selectedGroups.indexOf(d), 1);
						self.targetEle.selectAll(`.group_${format(d)}`).classed("selectedGroupBar", false);
					} else {
						self.selectedGroups.push(d);
						self.targetEle.selectAll(`.group_${format(d)}`).classed("selectedGroupBar", true);
					}
					d3.event.preventDefault();
				})
				.call(d3.drag()
						.on("start", groupDragstarted)
						.on("drag", groupDragged)
						.on("end", groupDragended));

		self.yAxis = self.targetSvg.append("g")
						.attr("transform", `translate(${self.margin.left*0.6},${self.margin.top})`)
						.attr("class", "axis y")
						.call(d3.axisLeft(self.yScale).ticks(null, "s"))
						.append("text")
							.attr("x", -self.margin.left*0.8)
							.attr("y", -self.margin.top/2)
							.attr("class", "axisLabel")
							.attr("fill", "currentColor")
							.attr("text-anchor", "start")
							.text("Population");

		drawLegend();
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
            		self.subTypeSelected = false;
            		self.selectedSubType="";

            		self.targetEle.selectAll(`.bar`).classed("selectedBar", false);

            		self.selectedGroups=[];
            		self.targetEle.selectAll(`.bar`).classed("selectedGroupBar", false);
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

	function format(str) {
		return str.replace(/\W/g, '');
	}

	function groupDragstarted(d) {
		var line = d3.line().x(d => d[0]).y(d => d[1]);

		self.targetEle.selectAll(`.group_${d}`).classed('dragGroup', true)

		if (self.selectedGroups.includes(d)) {
			self.selectedGroups.sort((a, b) => self.xScaleGroup(a)-self.xScaleGroup(b));
			self.maxPosition = self.xScaleGroup(self.selectedGroups[self.selectedGroups.length-1])+self.xScaleGroup.bandwidth()
			self.minPosition = self.xScaleGroup(self.selectedGroups[0])
		} else {
			self.maxPosition = self.xScaleGroup.range()[1]
			self.minPosition = self.xScaleGroup.range()[0]
		}

		self.minPosition -= self.xScaleGroup.padding()*self.xScaleGroup.bandwidth();
		self.maxPosition += self.xScaleGroup.padding()*self.xScaleGroup.bandwidth();

		self.targetEle.append("path")
			.datum([[self.minPosition, self.yScale.range()[0]],
					[self.minPosition, 0]])
			.attr("d", line)
			.attr("class", "boundary")
		self.targetEle.append("path")
			.datum([[self.maxPosition, self.yScale.range()[0]],
					[self.maxPosition, 0]])
			.attr("d", line)
			.attr("class", "boundary")

		self.targetEle.selectAll(`.${d}`).raise();
		self.groupDraggedPositions[d] = self.xScaleGroup(d);
		d3.selectAll(this).raise();
	}

	function groupDragged(d) {
		var curX = d3.event.x-self.margin.left;
		if (curX<self.maxPosition && curX>self.minPosition) {
			self.groupDraggedPositions[d] = d3.event.x-self.margin.left-self.xScaleGroup.bandwidth()/2;
			self.data.sort((a, b) => groupPosition(a.State) - groupPosition(b.State));
			self.xScaleGroup.domain(self.data.map(d => d.State))
			self.targetEle.selectAll('.group')
				.attr('transform', d => `translate(${groupPosition(d.State)},0)`);

			self.targetSvg.selectAll(`.x_tick`)
				.attr("x", d => groupPosition(d)+self.margin.left+self.xScaleGroup.bandwidth()/2);
		}
	}

	function groupDragended(d) {
		var curX = d3.event.x-self.margin.left;
		delete self.groupDraggedPositions[d];
		self.targetEle.selectAll(`.${d}`)
			.transition()
				.duration(500)
				.attr("transform", d => `translate(${groupPosition(d.State)},0)`)

		if (self.subTypeSelected && d==getMaxGroupOfSelectedSubtype(d)) {
			if (curX>self.maxPosition) { 
				sortAndUpdateGroups(d, false);
			} else if (curX<self.minPosition) { 
				sortAndUpdateGroups(d, true);
			}
		}

		self.targetEle.selectAll(`.group_${d}`).classed('dragGroup', false);

		self.targetEle.selectAll('.group')
			.transition().duration(1000)
				.attr('transform', d => `translate(${groupPosition(d.State)},0)`);

		d3.selectAll('.x_tick')
			.transition()
				.duration(500)
				.attr("x", d => self.margin.left+self.xScaleGroup(d)+self.xScaleGroup.bandwidth()/2);


		self.targetEle.selectAll(".boundary")
			.transition()
				.duration(500) 
				.remove();
	}

	/////// Helper method to determine x position of a group /////// 
	function groupPosition(d) {
		var newP = self.groupDraggedPositions[d];
		return newP == null ? self.xScaleGroup(d) : newP;
	}

	function getMaxGroupOfSelectedSubtype(grp) {
		if (self.selectedGroups.includes(grp)) {
			var filteredData = self.data.filter(d => self.selectedGroups.includes(d.State));
			return filteredData[d3.maxIndex(filteredData, d => d[self.selectedSubType])].State;
		} else {
			return self.data[d3.maxIndex(self.data, d => d[self.selectedSubType])].State;
		}
	}

	function sortAndUpdateGroups(curGroup, asc) {
		if (self.selectedGroups.includes(curGroup)) {
			var filteredData = self.data.filter(d => self.selectedGroups.includes(d.State));
			if (asc) {
				filteredData.sort((a, b) => b[self.selectedSubType] - a[self.selectedSubType])
			} else {
				filteredData.sort((a, b) => a[self.selectedSubType] - b[self.selectedSubType])
			}

			var filteredDataGroups = filteredData.map(d => d.State);

			for (var i = 0, j = 0; i < self.data.length; i++) {
				if (filteredDataGroups.includes(self.data[i].State)) {
					self.data[i] = filteredData[j];
					j++;
				}
			}
		} else {
			if (asc) {
				self.data.sort((a, b) => b[self.selectedSubType]-a[self.selectedSubType])
			} else {
				self.data.sort((a, b) => a[self.selectedSubType]-b[self.selectedSubType])
			}
		}

		self.xScaleGroup.domain(self.data.map(d => d.State));

	}

	return{
		data,
		draw,
		clear,
	};
}