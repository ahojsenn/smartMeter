/**
	plot N Lines of data on the same graph
	this is a more complete version of plotDJ
	the data is expected as N-Dimensional array with
	data.xLabels:
	data.x
	data.y1
	data.y* ...
	data.yn
*/

var plotN = function (data, targetdiv, title) {
	console.log ('in plotN (data, '+targetdiv+', '+title+')');
	var
		title = typeof(title)=="undefined" ? targetdiv : title,
		fminhou = pv.Format.date("%H:%M:%S"),
		y_value = function (d) {return d.Watt = (d.Watt == 0) ? 0.01 : d.Watt; },
		date = new Date()
		mousedown = 0;

		/** the data looks like this...
		{"term":"v39.powerConsumption.3", 	"Watt":204.72226013375186, "timestamp":1362413445121}
		*/

	// put the data into a more hierachical structure grouped by 'term'
	// this way I could put more than just on type of data - distinguished by term - into the plot
	// details are here: http://mbostock.github.com/protovis/jsdoc/symbols/pv.Nest.html
	// the new object has key: term and values {...}
	var nesteddata = pv.nest(data)
	    .key(function(d) {return d.term;})
	    .entries();
	console.log ('in plotN ...');



	/* Sizing and scales. */
	var w = window.innerWidth*0.85,
	    h1 = 300,
		h2 = 40,
		h  = h1 + h2 + 20,
		t_min = pv.min(data, function(d) {return new Date(d.timestamp).getTime()}),
		t_max = pv.max(data, function(d) {return new Date(d.timestamp).getTime()}),
		x = pv.Scale.linear( new Date(t_min), new Date(t_max) ).range(0, w),
		y = pv.Scale.log(1, pv.max(data, function(d) {return d.Watt+0.01}) ).range(0, h2),
		ycolor = pv.Scale.linear(0, pv.max(data, y_value ) ).range("#1f77b4", "#ff7f0e");
		ii = new Array;

	// a general label to inherit from
	var label = new pv.Label()
	    .font("bold 14px sans-serif");

	/* now loop through the number of nested data sets and set ii[setnr] to -1 */
	$.each(nesteddata, function (key, val) { ii[key] =  -1});

	/* Interaction state. Focus scales will have domain set on-render. */
	var i = {dx:100, x: w-100},
	    fx = pv.Scale.linear().range(0, w),
	    fy = pv.Scale.log().range(0, h1);

	/* The root panel. */
	var vis = new pv.Panel()
	    .width(w)
	    .height(h)
	    .bottom(30)
	    .left(40)
	    .right(10)
	    .top(20)
		.strokeStyle("#ccc")
		.fillStyle("rgba(200, 240, 200, .4)")
		.canvas(targetdiv);

	/* Title */
	vis.add(pv.Label)
		.font("bold 14px 'Courier New' monospace")
	    .data([title])
	    .left(w/2)
	    .bottom(h)
	    .textAlign("center");

   	/* Focus panel (zoomed in). */
	var focus = vis.add(pv.Panel)
	    .top(0)
		.fillStyle("rgba(200, 200, 240, .4)")
		.strokeStyle("#ccc")
	    .height(h1)
		.def("init", function() {
			/**
			  * this function will initialize the x and y scale of the focus panel
			  * first d1 and d2 are filled with the corresponding
			  * x-values of the pixel range of the focus area of the context panel
			  */
			var d1 = x.invert(i.x),
		       	d2 = x.invert(i.x + i.dx),
				maxy= 0;
			$.each(nesteddata, function (key, data) {
				var dd = data.values.slice(
					Math.max(0, pv.search.index(data.values, d1, function(d) {return new Date(d.timestamp)} ) - 1),
					pv.search.index(data.values, d2, function(d) {return new Date(d.timestamp)} ) + 1);

			    maxy = maxy > pv.max(dd, y_value ) ? maxy : pv.max(dd, y_value );

			})

			fx.domain(d1, d2);
			// now get the y.domain. y.domain returns the lower and upper boundary of the input domain.
		    fy.domain( [10, maxy*1.1] );
			return nesteddata;
	});

	//
	focus.add(pv.Rule) // the time line in the focus panel
		.visible(function () { return this.parent.index==0 && ii[this.parent.index] >= 0})
		.left(function (){return  vis.mouse().x } )
		.top(-4)
		.bottom(-4)
		.strokeStyle("red")
	.anchor("top").add(pv.Label)
		.font("14px 'Courier New' monospace")
		.top(40)
		.textAlign("right")
		.text(function(d) {return fminhou(fx.invert(vis.mouse().x) ); } );


	/* X-axis ticks. */
    focus.add(pv.Rule)
		.data(function () {return fx.ticks()} )
		.strokeStyle("#ccc")
		.left(fx)
	.anchor("bottom").add(pv.Label)
		.font("14px 'Courier New' monospace")
   		.text(fx.tickFormat);

	/* Y-axis ticks. */
	focus.add(pv.Rule)
	    .data(function () {return fy.ticks()})
		.strokeStyle("#ccc")
	    .bottom(fy)
	  .anchor("left").add(pv.Label)
		.font("14px 'Courier New' monospace")
	    .text(fy.tickFormat);

	/* the hierachy by term */
	var fpanel = focus.add(pv.Panel)
	    .data(function () { return focus.init() })
		.overflow("hidden")

	/* The line. */
	var line = fpanel.add(pv.Line)
		.data(function(d)   { return d.values})
		.left(function(d)   { if (d === undefined) alert("undefined 151" ); return fx(new Date(d.timestamp) ) } )
	    .bottom(function(d) { return fy(parseFloat ( d.Watt+0.01) )  })
	    .lineWidth(2);

	/* The mouseover dots and label. */
   	line.add(pv.Dot)
       	.visible(function _jm01() {return ii[this.parent.index] >= 0} )
		.data( function _jm02(d) { return [d.values[ii[this.parent.index]]] } )
		.fillStyle(function _jm03() {return line.strokeStyle() } )
       	.strokeStyle("#000")
       	.size(20)
       	.lineWidth(1)
    .add(pv.Dot)
       	.left(10)
       	.top(function() { return this.parent.index * 12 + 10} )
    .anchor("right").add(pv.Label)
		.font("14px 'Courier New' monospace")
       	.text(function(d) {
				return d.term+" \t"+Math.round(d.Watt*10)/10
				} );

	/* An invisible bar to capture events (without flickering). */
	fpanel.add(pv.Bar)
	    .fillStyle("rgba(0,0,0,.001)")
	    .event("mouseout", function() {
			for (var lnr=0; lnr<nesteddata.length; lnr++) {
	        	ii[lnr] = -1;
			}
	        return focus;
	      })
	    .event("mousemove", function() {
	        var mx = fx.invert(vis.mouse().x+2),
				lnr;
			for (lnr=0; lnr<nesteddata.length; lnr++) {
				ii[lnr]  = pv.search(nesteddata[lnr].values.map(function(d) {return new Date(d.timestamp) } ), mx);
		    	ii[lnr]  = ii[lnr]  < 0 ? (-ii[lnr]  - 2) : ii[lnr] ;
			}
			return focus;
	      });


	/* Context panel (zoomed out). *********************/
	var context = vis.add(pv.Panel)
	    .bottom(0)
	    .height(h2);

	/* X-axis ticks. */
	context.add(pv.Rule)
	    .data(x.ticks())
	    .left(x)
	    .strokeStyle("#eee")
	  .anchor("bottom").add(pv.Label)
		.font("14px 'Courier New' monospace")
	    .text(x.tickFormat);

	/* Y-axis ticks. */
	context.add(pv.Rule)
	    .bottom(0);

	/* the hierachy by term */
	var panel = context.add(pv.Panel)
		.data(nesteddata);

	/* The line. */
	var contextline = panel.add(pv.Line)
		.data(function(d)   { return d.values})
		.left(function(d)   { return x(new Date(d.timestamp)) } )
	    .bottom(function(d) { return y( parseFloat( d.Watt ) ) })
	    .lineWidth(2);

	/* The selectable, draggable focus region. */
	context.add(pv.Panel)
	    .data([i])
		.cursor("crosshair")
	    .events("all")
	    .event("mousedown", pv.Behavior.select())
	    .event("select", focus)
	  .add(pv.Bar)
	    .left(function(d)  {return d.x })
	    .width(function(d) {return d.dx})
	    .fillStyle("rgba(255, 128, 128, .4)")
	    .cursor("move")
	    .event("mousedown", pv.Behavior.drag())
	    .event("drag", focus)
	/* */


 	vis.render();
	return this;
}

