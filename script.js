var can;
var c;

var lines;

var frame;

var target;

window.onload = function(){
	can = document.getElementById("can");
	can.width = Math.min(window.innerWidth, window.innerHeight);
	can.height = can.width;
	c = can.getContext("2d");

	can.addEventListener("mousedown", function(e){
		var rect = can.getBoundingClientRect();
		var x = (e.clientX - rect.left) / can.width;
		var y = (e.clientY - rect.top) / can.height;
		target = new Target(x, y);
	});

	can.addEventListener("touchstart", function(e){
		var rect = can.getBoundingClientRect();
		var x = (e.touches[0].clientX - rect.left) / can.width;
		var y = (e.touches[0].clientY - rect.top) / can.height;
		target = new Target(x, y);
	});
	
	frame = 1;

	lines = [];
	for(var i=0;i<6;i++){
		lines.push(new Line());
	}

	target = null;


	loop();
}


window.onresize = function(){
	can.width = Math.min(window.innerWidth, window.innerHeight);
	can.height = can.width;
	c = can.getContext("2d");
}


function loop(){
	c.fillStyle = "rgba(0, 0, 0, 1)";
	c.fillRect(0, 0, can.width, can.height);

	for(var i=0;i<lines.length;i++){
		lines[i].update();
		lines[i].render(c, can.width, can.height);
	}

	if(target !== null){
		target.update();
		target.render(c, can.width, can.height);
		for(var i=0;i<lines.length;i++){
			lines[i].target(target);
		}
		if(target.shouldBeRemoved()){
			target = null;
		}
	}

	frame++;
	requestAnimationFrame(loop);
}


function Line(){
	this.noiseSeed = Math.random();
	
	this.x = Math.random();
	this.y = Math.random();
	this.angle = Math.random() * 2 * Math.PI;
	this.speed = 0.01;
	
	this.pointsAmount = 50;
	this.points = [[]];
	for(var i=0;i<this.pointsAmount;i++){
		this.points[0].push([this.x, this.y]);
	}

	this.particles = [];

	this.colorStep = parseInt(Math.random() * 360);
	
	this.update = function(){
		noise.seed(this.noiseSeed);
		this.angle += noise.simplex2(frame/100, 1) * 2 * Math.PI / 50;
		if(this.angle > 2*Math.PI){
			this.angle -= 2*Math.PI;
		}else if(this.angle < 0){
			this.angle += 2*Math.PI;
		}
		this.x += Math.cos(this.angle) * this.speed;
		this.y += Math.sin(this.angle) * this.speed;

		var jumped = this.edgeJump();
		this.updatePoints(jumped);

		this.updateParticles();
	}

	this.updateParticles = function(){
		if(Math.random() < 0.1){
			this.particles.push(new Particle(this.x, this.y, this.colorStep));
		}
		for(var i=0;i<this.particles.length;i++){
			this.particles[i].update();
		}
		if(this.particles.length > 0){
			if(this.particles[0].shouldBeRemoved()){
				this.particles.splice(0, 1);
			}
		}
	}

	this.edgeJump = function(){
		var jumped = false;
		if(this.x < 0){
			this.x += 1;
			jumped = true;
		}else if(this.x > 1){
			this.x -= 1;
			jumped = true;
		}
		if(this.y < 0){
			this.y += 1;
			jumped = true;
		}else if(this.y > 1){
			this.y -= 1;
			jumped = true;
		}
		return jumped;
	}

	this.updatePoints = function(jumped){
		//adding
		if(jumped){
			this.points.push([[this.x, this.y]]);
		}else{
			this.points[this.points.length-1].push([this.x, this.y]);
		}

		//removing
		if(this.points[0].length > 0){
			this.points[0].splice(0, 1);
		}else{
			this.points.splice(0, 1);
			this.points[0].splice(0, 1);
		}
	}

	this.render = function(c, width, height){
		var headSize = width/25;
		var point = 0;
		for(var i=0;i<this.points.length;i++){
			for(var j=0;j<this.points[i].length-1;j++){
				c.strokeStyle = "hsl(" + (this.colorStep + (this.pointsAmount - point)) + ", 100%, 50%)";
				c.globalAlpha = parseFloat(point / this.pointsAmount);
				c.lineWidth = Math.max(1, parseInt(point / this.pointsAmount * headSize));
				c.beginPath();
				c.moveTo(this.points[i][j][0]*width, this.points[i][j][1]*height);
				c.lineTo(this.points[i][j+1][0]*width, this.points[i][j+1][1]*height);
				c.stroke();
				point++;
			}
		}

		for(var i=0;i<this.particles.length;i++){
			this.particles[i].render(c, width, height);
		}

		for(var i=0;i<headSize;i++){
			c.fillStyle = "hsl(" + this.colorStep + ", 100%, 50%)";
			c.globalAlpha = parseFloat(i / headSize);
			c.beginPath();
			c.arc(this.x * width, this.y * height, headSize - i, 0, 2*Math.PI);
			c.fill();
		}

		this.colorStep = (this.colorStep + 1) % 360;
	}

	this.target = function(target){
		var targetAngle = Math.atan2(this.y - target.y, this.x - target.x) + Math.PI;
		this.angle = targetAngle - Math.PI/2;
	}
}



function Particle(x, y, colorStep){
	this.x = x;
	this.y = y;
	this.angle = Math.random() * 2 * Math.PI;
	this.speed = 0.0025;

	this.colorStep = colorStep;

	this.noiseSeed = Math.random();
	this.startLifeTime = 40;
	this.lifeTime = this.startLifeTime;

	this.update = function(){
		noise.seed(this.noiseSeed);
		this.angle += noise.simplex2(frame/100, 1) * Math.PI / 25;
		this.x += Math.cos(this.angle) * this.speed;
		this.y += Math.sin(this.angle) * this.speed;

		this.lifeTime--;
	}

	this.render = function(c, width, height){
		var size = this.lifeTime / this.startLifeTime * (width/25);
		for(var i=0;i<size;i++){
			c.fillStyle = "hsl(" + this.colorStep + ", 100%, 50%)";
			c.globalAlpha = parseFloat(i / size);
			c.beginPath();
			c.arc(this.x * width, this.y * height, size - i, 0, 2*Math.PI);
			c.fill();
		}
	}

	this.shouldBeRemoved = function(){
		return this.lifeTime < 0;
	}
}



function Target(x, y){
	this.x = x;
	this.y = y;

	this.lifeTime = 60;

	this.render = function(c, width, height){
		c.fillStyle = "rgba(255, 255, 255, 0.5)";
		c.beginPath();
		c.arc(this.x * width, this.y * height, width / 100, 0, 2*Math.PI);
		c.fill();
	}

	this.update = function(){
		this.lifeTime--;
	}

	this.shouldBeRemoved = function(){
		return this.lifeTime < 0;
	}
}





/*
source: https://github.com/josephg/noisejs/blob/master/perlin.js
*/


/*
 * A speed-improved perlin and simplex noise algorithms for 2D.
 *
 * Based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 * Converted to Javascript by Joseph Gentle.
 *
 * Version 2012-03-09
 *
 * This code was placed in the public domain by its original author,
 * Stefan Gustavson. You may use it as you see fit, but
 * attribution is appreciated.
 *
 */

(function(global){
	var module = global.noise = {};
  
	function Grad(x, y, z) {
	  this.x = x; this.y = y; this.z = z;
	}
	
	Grad.prototype.dot2 = function(x, y) {
	  return this.x*x + this.y*y;
	};
  
	Grad.prototype.dot3 = function(x, y, z) {
	  return this.x*x + this.y*y + this.z*z;
	};
  
	var grad3 = [new Grad(1,1,0),new Grad(-1,1,0),new Grad(1,-1,0),new Grad(-1,-1,0),
				 new Grad(1,0,1),new Grad(-1,0,1),new Grad(1,0,-1),new Grad(-1,0,-1),
				 new Grad(0,1,1),new Grad(0,-1,1),new Grad(0,1,-1),new Grad(0,-1,-1)];
  
	var p = [151,160,137,91,90,15,
	131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
	190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
	88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
	77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
	102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
	135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
	5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
	223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
	129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
	251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
	49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
	138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
	// To remove the need for index wrapping, double the permutation table length
	var perm = new Array(512);
	var gradP = new Array(512);
  
	// This isn't a very good seeding function, but it works ok. It supports 2^16
	// different seed values. Write something better if you need more seeds.
	module.seed = function(seed) {
	  if(seed > 0 && seed < 1) {
		// Scale the seed out
		seed *= 65536;
	  }
  
	  seed = Math.floor(seed);
	  if(seed < 256) {
		seed |= seed << 8;
	  }
  
	  for(var i = 0; i < 256; i++) {
		var v;
		if (i & 1) {
		  v = p[i] ^ (seed & 255);
		} else {
		  v = p[i] ^ ((seed>>8) & 255);
		}
  
		perm[i] = perm[i + 256] = v;
		gradP[i] = gradP[i + 256] = grad3[v % 12];
	  }
	};
  
	module.seed(0);
  
	/*
	for(var i=0; i<256; i++) {
	  perm[i] = perm[i + 256] = p[i];
	  gradP[i] = gradP[i + 256] = grad3[perm[i] % 12];
	}*/
  
	// Skewing and unskewing factors for 2, 3, and 4 dimensions
	var F2 = 0.5*(Math.sqrt(3)-1);
	var G2 = (3-Math.sqrt(3))/6;
  
	var F3 = 1/3;
	var G3 = 1/6;
  
	// 2D simplex noise
	module.simplex2 = function(xin, yin) {
	  var n0, n1, n2; // Noise contributions from the three corners
	  // Skew the input space to determine which simplex cell we're in
	  var s = (xin+yin)*F2; // Hairy factor for 2D
	  var i = Math.floor(xin+s);
	  var j = Math.floor(yin+s);
	  var t = (i+j)*G2;
	  var x0 = xin-i+t; // The x,y distances from the cell origin, unskewed.
	  var y0 = yin-j+t;
	  // For the 2D case, the simplex shape is an equilateral triangle.
	  // Determine which simplex we are in.
	  var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
	  if(x0>y0) { // lower triangle, XY order: (0,0)->(1,0)->(1,1)
		i1=1; j1=0;
	  } else {	// upper triangle, YX order: (0,0)->(0,1)->(1,1)
		i1=0; j1=1;
	  }
	  // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
	  // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
	  // c = (3-sqrt(3))/6
	  var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
	  var y1 = y0 - j1 + G2;
	  var x2 = x0 - 1 + 2 * G2; // Offsets for last corner in (x,y) unskewed coords
	  var y2 = y0 - 1 + 2 * G2;
	  // Work out the hashed gradient indices of the three simplex corners
	  i &= 255;
	  j &= 255;
	  var gi0 = gradP[i+perm[j]];
	  var gi1 = gradP[i+i1+perm[j+j1]];
	  var gi2 = gradP[i+1+perm[j+1]];
	  // Calculate the contribution from the three corners
	  var t0 = 0.5 - x0*x0-y0*y0;
	  if(t0<0) {
		n0 = 0;
	  } else {
		t0 *= t0;
		n0 = t0 * t0 * gi0.dot2(x0, y0);  // (x,y) of grad3 used for 2D gradient
	  }
	  var t1 = 0.5 - x1*x1-y1*y1;
	  if(t1<0) {
		n1 = 0;
	  } else {
		t1 *= t1;
		n1 = t1 * t1 * gi1.dot2(x1, y1);
	  }
	  var t2 = 0.5 - x2*x2-y2*y2;
	  if(t2<0) {
		n2 = 0;
	  } else {
		t2 *= t2;
		n2 = t2 * t2 * gi2.dot2(x2, y2);
	  }
	  // Add contributions from each corner to get the final noise value.
	  // The result is scaled to return values in the interval [-1,1].
	  return 70 * (n0 + n1 + n2);
	};
  
	// 3D simplex noise
	module.simplex3 = function(xin, yin, zin) {
	  var n0, n1, n2, n3; // Noise contributions from the four corners
  
	  // Skew the input space to determine which simplex cell we're in
	  var s = (xin+yin+zin)*F3; // Hairy factor for 2D
	  var i = Math.floor(xin+s);
	  var j = Math.floor(yin+s);
	  var k = Math.floor(zin+s);
  
	  var t = (i+j+k)*G3;
	  var x0 = xin-i+t; // The x,y distances from the cell origin, unskewed.
	  var y0 = yin-j+t;
	  var z0 = zin-k+t;
  
	  // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
	  // Determine which simplex we are in.
	  var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
	  var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
	  if(x0 >= y0) {
		if(y0 >= z0)	  { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
		else if(x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
		else			  { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
	  } else {
		if(y0 < z0)	  { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
		else if(x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
		else			 { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
	  }
	  // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
	  // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
	  // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
	  // c = 1/6.
	  var x1 = x0 - i1 + G3; // Offsets for second corner
	  var y1 = y0 - j1 + G3;
	  var z1 = z0 - k1 + G3;
  
	  var x2 = x0 - i2 + 2 * G3; // Offsets for third corner
	  var y2 = y0 - j2 + 2 * G3;
	  var z2 = z0 - k2 + 2 * G3;
  
	  var x3 = x0 - 1 + 3 * G3; // Offsets for fourth corner
	  var y3 = y0 - 1 + 3 * G3;
	  var z3 = z0 - 1 + 3 * G3;
  
	  // Work out the hashed gradient indices of the four simplex corners
	  i &= 255;
	  j &= 255;
	  k &= 255;
	  var gi0 = gradP[i+   perm[j+   perm[k   ]]];
	  var gi1 = gradP[i+i1+perm[j+j1+perm[k+k1]]];
	  var gi2 = gradP[i+i2+perm[j+j2+perm[k+k2]]];
	  var gi3 = gradP[i+ 1+perm[j+ 1+perm[k+ 1]]];
  
	  // Calculate the contribution from the four corners
	  var t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
	  if(t0<0) {
		n0 = 0;
	  } else {
		t0 *= t0;
		n0 = t0 * t0 * gi0.dot3(x0, y0, z0);  // (x,y) of grad3 used for 2D gradient
	  }
	  var t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
	  if(t1<0) {
		n1 = 0;
	  } else {
		t1 *= t1;
		n1 = t1 * t1 * gi1.dot3(x1, y1, z1);
	  }
	  var t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
	  if(t2<0) {
		n2 = 0;
	  } else {
		t2 *= t2;
		n2 = t2 * t2 * gi2.dot3(x2, y2, z2);
	  }
	  var t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
	  if(t3<0) {
		n3 = 0;
	  } else {
		t3 *= t3;
		n3 = t3 * t3 * gi3.dot3(x3, y3, z3);
	  }
	  // Add contributions from each corner to get the final noise value.
	  // The result is scaled to return values in the interval [-1,1].
	  return 32 * (n0 + n1 + n2 + n3);
  
	};
  
	// ##### Perlin noise stuff
  
	function fade(t) {
	  return t*t*t*(t*(t*6-15)+10);
	}
  
	function lerp(a, b, t) {
	  return (1-t)*a + t*b;
	}
  
	// 2D Perlin Noise
	module.perlin2 = function(x, y) {
	  // Find unit grid cell containing point
	  var X = Math.floor(x), Y = Math.floor(y);
	  // Get relative xy coordinates of point within that cell
	  x = x - X; y = y - Y;
	  // Wrap the integer cells at 255 (smaller integer period can be introduced here)
	  X = X & 255; Y = Y & 255;
  
	  // Calculate noise contributions from each of the four corners
	  var n00 = gradP[X+perm[Y]].dot2(x, y);
	  var n01 = gradP[X+perm[Y+1]].dot2(x, y-1);
	  var n10 = gradP[X+1+perm[Y]].dot2(x-1, y);
	  var n11 = gradP[X+1+perm[Y+1]].dot2(x-1, y-1);
  
	  // Compute the fade curve value for x
	  var u = fade(x);
  
	  // Interpolate the four results
	  return lerp(
		  lerp(n00, n10, u),
		  lerp(n01, n11, u),
		 fade(y));
	};
  
	// 3D Perlin Noise
	module.perlin3 = function(x, y, z) {
	  // Find unit grid cell containing point
	  var X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
	  // Get relative xyz coordinates of point within that cell
	  x = x - X; y = y - Y; z = z - Z;
	  // Wrap the integer cells at 255 (smaller integer period can be introduced here)
	  X = X & 255; Y = Y & 255; Z = Z & 255;
  
	  // Calculate noise contributions from each of the eight corners
	  var n000 = gradP[X+  perm[Y+  perm[Z  ]]].dot3(x,   y,	 z);
	  var n001 = gradP[X+  perm[Y+  perm[Z+1]]].dot3(x,   y,   z-1);
	  var n010 = gradP[X+  perm[Y+1+perm[Z  ]]].dot3(x,   y-1,   z);
	  var n011 = gradP[X+  perm[Y+1+perm[Z+1]]].dot3(x,   y-1, z-1);
	  var n100 = gradP[X+1+perm[Y+  perm[Z  ]]].dot3(x-1,   y,   z);
	  var n101 = gradP[X+1+perm[Y+  perm[Z+1]]].dot3(x-1,   y, z-1);
	  var n110 = gradP[X+1+perm[Y+1+perm[Z  ]]].dot3(x-1, y-1,   z);
	  var n111 = gradP[X+1+perm[Y+1+perm[Z+1]]].dot3(x-1, y-1, z-1);
  
	  // Compute the fade curve value for x, y, z
	  var u = fade(x);
	  var v = fade(y);
	  var w = fade(z);
  
	  // Interpolate
	  return lerp(
		  lerp(
			lerp(n000, n100, u),
			lerp(n001, n101, u), w),
		  lerp(
			lerp(n010, n110, u),
			lerp(n011, n111, u), w),
		 v);
	};
  
  })(this);
