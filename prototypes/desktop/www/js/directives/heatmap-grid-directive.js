angular.module("heatmap-grid-directive", [])

.directive("heatmapGrid", ["d3Service", "moment", "$state", "$window", function(d3Service, moment, $state, $window){
    return {
        restrict: "E",
        scope: {
            vizData: "=",
            canvasWidth: "=",
            canvasHeight: "=",
            useLabels: "="
        },
        link: function(scope, element, attrs){
            
            // set up the dom node to attach the d3 to
            // this could be any valid d3 selector like a class
            var domNode = element[0];
            
            // set sizes from attributes in html element
            // if not attributes present - use default
            var width = parseInt(attrs.canvasWidth) || 400;
            var height = parseInt(attrs.canvasHeight) || width;
            var steps = parseInt(attrs.steps) || 5;
            
            // set other layout attributes
            var gutter = 0.1;
            var useLabelVal = attrs.useLabels || true;
			var useLabel = useLabelVal == "false" ? false : true;
            var steps = 5;
            var transition = {
                time: 3000
            };
            
            //get d3 promise
            d3Service.d3().then(function(d3) {
                
                ///////////////////////////////////////////////
                /////////////// d3 SET-UP START ///////////////
                ///////////////////////////////////////////////
                
                // format the date
                // d3 wants very specific date format and this is easiest way to get there
                var parseDate = d3.time.format("%Y-%m-%dT%H:%M:%S").parse;
                
                // x-scale
                //var xScale = d3.scale.ordinal(); 
                var xScale = d3.time.scale();
                
                // y-scale
                var yScale = d3.scale.ordinal();
                
                // color scale
                var cScale = d3.scale.quantile()
                    .range([0.2, 0.4, 0.6, 0.8, 1]);
                
                // create svg canvas
                var canvas = d3.select(domNode)
                    .append("svg")
                    .attr({
                        viewBox: "0 0 " + width + " " + height
                    });
                
                /////////////////////////////////////////////
                /////////////// d3 SET-UP END ///////////////
                /////////////////////////////////////////////
                
                // bind data
                scope.$watch("vizData", function(newData, oldData) {
                    
                    // async check
                    if (newData !== undefined) {
                        
                        ///////////////////////////////////////////////
                        /////////////// d3 RENDER START ///////////////
                        ///////////////////////////////////////////////
                        
                        function draw(data) {
                            
                            function getStyleValue(style, value) {
                                return parseFloat(style.getPropertyValue(value).split("px")[0]);
                            };
                            
                            // unest values for easy calculations later
                            var unest = [];
                            
                            data.forEach(function(o) {
                                
                                o.values.forEach(function(d) {
                                    
                                    unest.push(d);
                                    
                                });
                                
                            });
                            
                            // format date so d3 don't yell at you
                            data.forEach(function(o) {
                                
                                o.values.forEach(function(d) {
                                    
                                    // map new values to data
                                    d.date = parseDate(d.timestamp);
                                    
                                });
                                
                            });
                            
                            // calc max/min scales
                            var style = $window.getComputedStyle(element.find("svg")[0]);
                            var fontSize = getStyleValue(style, "font-size");
                            var labelWidth = d3.max(data, function(d) { return d.name.length; }) * (fontSize * 0.6);
                            var maxPadding = d3.max([fontSize, gutter], function(d) { return d; });
                            var xScaleMin = useLabel ? labelWidth : 0;
                            var xScaleMax = width;
                            var minDate = new Date("2014-01-01");console.log(minDate);
                            var maxDate = new Date("2014-01-02");console.log(maxDate);
                                                     
                            // add data to x-scale layout algorithm
                            xScale.domain([minDate, maxDate]);console.log("min", xScaleMin); console.log("max",xScaleMax);
                            //.ticks(d3.time.minute, 15);
                            xScale.range([0, xScaleMax])
                            
                            // add data to y-scale layout algorithm
                            yScale.domain(data.map(function(d) { return d.name; }));
                            yScale.range([height, 0])
                            yScale.rangeRoundBands([height, 0], gutter);
                            
                            // add data to color layout algorithm
                            cScale.domain([0, steps, d3.max(unest, function(d) { return d.value; })]);
                            
                            // GRID
                            canvas
                                .selectAll("g")
                                .data(data)
                                .enter()
                                .append("g")
                            
                                // each group
                                .each(function(d) {
                                
                                    var groupD = d;
                                    var group = d3.select(this);
                                
                                    // LABEL
								
									// check setting
									if (useLabel) {
                                
										// set selection
										var label = group
											.selectAll("text")
											.data([groupD]);

										// update selection
										label
											.transition()
											.duration(transition.time)
											.text(function(d) { return d.name });

										// enter selection
										label
											.enter()
											.append("text")
											.attr({
												x: gutter * 100,
												y: yScale(groupD.name) + (yScale.rangeBand() / 2),
												dy: "0.3em"
											})
											.text(function(d) { return d.name });

										// exit selection
										label
											.exit()
											.transition()
											.duration(transition.time)
											.remove();

									};
                                
                                    // CELL
                                
                                    // set selection
                                    var cell = group
                                        .selectAll("rect")
                                        .data(d.values);
                                
                                    // update selection
                                    cell
                                        .transition()
                                        .duration(transition.time)
                                        .attr({
                                            x: function(d) { return xScale(d.date); },
                                            y: yScale(groupD.name),
                                            //width: xScale.rangeBand(),
                                            width: 4,
                                            height: yScale.rangeBand()
                                        })
                                        .style({
                                            opacity: function(d) { return cScale(d.value); }
                                        });
                                
                                    // enter selection
                                    cell
                                        .enter()
                                        .append("rect")
                                        .transition()
                                        .duration(transition.time)
                                        .attr({
                                            x: function(d) { console.log(d.date);return xScale(d.date); },
                                            y: yScale(groupD.name),
                                            //width: xScale.rangeBand(),
                                            //width: function() { return fakeOrdinalXScale.rangeBand(); },
                                            width: 4,
                                            height: yScale.rangeBand()
                                        })
                                        .style({
                                            opacity: function(d) { return cScale(d.value); }
                                        });
                                
                                    // exit selection
                                    cell
                                        .exit()
                                        .transition()
                                        .duration(transition.time)
                                        .remove();
                                                                
                                });
                            
                        };
                        
                        draw(newData);
                        
                        /////////////////////////////////////////////
                        /////////////// d3 RENDER END ///////////////
                        /////////////////////////////////////////////
                        
                    };
                    
                }); 
                
            });
            
        }
    }
    
}]);
