/*eslint-env es6*/
/*eslint-env browser*/
/*eslint no-console: 0*/
/*global d3 */

/*Attempted Bonus: Implemented tool tip and used Level 2 map.*/

//Svg Initialization
var w = 1400;
var h = 800;
var svg = d3.select("div#container").append("svg").attr("preserveAspectRatio", "xMinYMin meet").style("background-color","white")
.attr("viewBox", "0 0 " + w + " " + h)
.classed("svg-content", true);
    
//For color range.
var color = d3.scaleThreshold()
              .domain([1, 10, 50, 200, 500, 1000, 2000, 4000])
              .range(d3.schemeReds[9]);

//To map each value and interpolate to a custom domain and range.
var x = d3.scaleSqrt()
    .domain([0, 4500])
    .rangeRound([440, 950]);
 
//Adding scale of color and labelled ticks to show correspondence between population density numbers and color.
var g = svg.append("g")
    .attr("class", "key")
    .attr("transform", "translate(0,40)");

//assigning color, height, and width to every bar in scale.
g.selectAll("rect")
  .data(color.range().map(function(d) {
      d = color.invertExtent(d);
      if (d[0] == null) d[0] = x.domain()[0];
      if (d[1] == null) d[1] = x.domain()[1];
      return d;
    }))
  .enter().append("rect")
    .attr("height", 14)
    .attr("x", function(d) { return x(d[0]); })
    .attr("width", function(d) { return x(d[1]) - x(d[0]); })
    .attr("fill", function(d) { return color(d[0]); });
//Adding text above color scale and fixing its coordinates in the svg.
g.append("text")
    .attr("class", "caption")
    .attr("x", x.range()[0])
    .attr("y", -6)
    .attr("fill", "#000")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .text("Population per square kilometer");

//defining ticks on color scale.
g.call(d3.axisBottom(x)
    .tickSize(13)
    .tickValues(color.domain()))
  .select(".domain")
    .remove();

//customizing look, placement, and scale when Hungary is later rendered on svg element.
var projection = d3.geoMercator().translate([w/2, h/2]).scale(8000).center([18,47]);
var path = d3.geoPath().projection(projection);

//reading in data from geojson file and csv
var hungary = d3.json("gadm36_HUN_2.json");
var subregions = d3.csv("Hungary2013Data.csv"); 
        
//Resolving promises at once for reading geojson and csv file.
Promise.all([hungary, subregions]).then(function(values){            
    var features = values[0].features;
	//looping through geojson data to reverse coordinates for map to be properly displayed in svg.
    features.forEach(function(feature) {
        if(feature.geometry.type == "Polygon") {
            feature.geometry.coordinates.forEach(function(ring) {
                ring.reverse();
            })
        }
    })
    // 
    values[1].forEach(function (d) {
        for (var key in d) {
            if (key === 'Subregion') {
                var subregion = d.Subregion;
            }
            if (key === 'Population') {
                var subregion_population = Number(d.Population);

            }
            if (key === 'Area') {
                var subregion_area = Number(d.Area);
            }
            var pop_density = subregion_population/subregion_area;
            
            features.forEach(function(data) {
                var subregion_name = data.properties.NAME_2;
                if (subregion_name === subregion){
                    data.properties.PD = pop_density;
					data.properties.Population = subregion_population;
					data.properties.Area = subregion_area;
                }
            })
        }
    })
//    console.log(features[42].properties.PD);
//    console.log(features[42].properties.NAME_2)  

//tooltip intialization.
var div = d3.select("body").append("div")	
        .attr("class", "tooltip")				
        .style("opacity", 0);  
	
    //Adding path data to svg. Defining borders color, width, opacity changes.
    svg.append("g")
      .selectAll("path")
      .data(features)
      .enter().append("path")
      .attr("fill", function(d) { return color(d.properties.PD); })
      .attr("d", path)
      .attr('vector-effect', 'non-scaling-stroke')                                          .style('stroke', 'white')                                                              .style('stroke-width', 0.5)                                                         .style("opacity",1)
      //If mouse over subregion, tooltip appears.
      .on("mouseover", function(d) {		
            div.transition()		
                .duration(200)		
                .style("opacity", 0.8);		
            div.html(                                                                
                "<center>" + d.properties.NAME_2 + "</center>" + 
                "<p> Population: " + d.properties.Population + "</p>" +
				"<p> Area: " + d.properties.Area + " km<span>2<span></p>" +  
                "<p> Population Density: " + Math.round(d.properties.PD) + "</p>" 
            )	
                .style("left", (d3.event.pageX) + "px")	
                .style("top", (d3.event.pageY - 28) + "px") 
			d3.select(this)
					.style('opacity', '1')                                                  .style('stroke', 'white')                                                .style('stroke-width', 1.8)                                                         .style("opacity",1.5)
            })	
        //Tooltip disappears when mouse not over subregion.
        .on("mouseout", function(d) {                                               
            div.transition()		
                .duration(500)                                                               .style('pointer-events', 'none')
                .style("opacity", 0);
			d3.select(this)
				.style('opacity', 1)
				.style('stroke','white')
				.style('stroke-width', 0.8)
        });
    });
//        