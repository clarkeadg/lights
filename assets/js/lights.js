
function Lights(jcont,opts) {
	/*
		Dependencies:
			- jQuery as $
		Notes:
			- jcont should be an empty element positioned non-statically
				- it's position on the page will represent coord (0,0)
			- points is an array of coords
			- imgs.on and imgs.off should have the same dimensions
				- or customize css to position .Lights-light img
			- animation speeds are radians per second over 10 for circle-based anims
				- XXthey are pixels per second for the restXX
			- animation settings can be globally set on construction and individually overidden per call
	*/

	// BEGIN config
	var z = this,
		Light,pfx;
	z.config = {
		key: 'Lights',
		defaults: {
			imgs: {
				on: '/k/assets/fbapp/Lights/on.png',
				off: '/k/assets/fbapp/Lights/off.png'
			},
			animations: {
				whoopAndDoopBlinkyBlink: {
					circle_speed: 80,
					circle_reps: 2,
					blink_delay: 800,
					blink_reps: 3
				},
				lazyFlash: {
					blink_delay: 1000,
					blink_reps: 5
				},
				flashBash: {
					blink_delay: 200,
					blink_reps: 10
				},
				blinkyBash: {
					blink_delay: 200,
					blink_reps: 10
				},
				onsolo: {
					circle_speed: 80,
					circle_reps: 4
				},
				bicycle: {
					circle_speed: 80
				}
			}
		}
	};
	z.$ = {
		cont: jcont
	};
	z.lights = [];
	z._master_timeout = null;
	z.opts = $.extend(true,{},z.config.defaults,opts);
	pfx = z.config.key;
	// END config


	// BEGIN initialize
	z.init = function(opts){
		if (z._inited) {
			console.log(pfx+': Instance already inited');
			return false;
		}
		if (!opts || !opts.points) {
			console.log(pfx+': Missing required options');
		}
		z._inited = true;
		z.points = opts.points;

		z.opts = $.extend(true,{},z.opts,opts);

		z.$.cont.addClass(pfx);
		z._buildImages(z.opts.imgs,function(){
			z._insertLights();
			if (opts.ready) opts.ready();
		});

		return true;
	};

	z._buildImages = function(imgs,cb){
		// Dont cb on error, means image isn't accessible, don't need to continue.
		// Not taking advantage of simultaneous browser downloads cuz
		//	I don't feel like coding against the case of download complete
		//	thread overlapping with handler atm.
		var keys = [],
			index = 0,
			next,done,
			num,k;
		done = function(){
			if (cb) cb();
		};
		next = function(){
			// Placing on page and positioning is hack fix for IE
			$('<img alt="" style="position:absolute;left:-99999px;top:-99999px;" />').appendTo(z.$.cont).bind('load',function(){
				var t = $(this);
				imgs[keys[index]] = {
					src: imgs[keys[index]],
					width: t.width(),
					height: t.height()
				};
				if (++index == num) {
					done();
				} else {
					next();
				}
				t.remove();
			}).attr('src',imgs[keys[index]]);
		};
		for (k in imgs) {
			keys.push(k);
		}
		num = keys.length;
		if (!num) {
			done();
		} else {
			next();
		}
	};

	z._insertLights = function(){
		var light,i,c;
		for (i=0,c=z.points.length;i<c;++i) {
			z.lights.push(light = new Light(z.points[i]));
			light.$.cont.addClass('index-'+i);
		}
	};
	// END initialize


	// BEGIN animations
	z.kill = function(){
		// Note: This will prevent any callbacks from getting fired
		if (z._master_timeout) {
			clearTimeout(z._master_timeout);
		}
		z._master_timeout = null;
		return z;
	};
	z.allOn = function(){
		z.toggleAll(1);
		return z;
	};
	z.allOff = function(){
		z.toggleAll(0);
		return z;
	};
	z.toggleAll = function(on_or_off){
		var i,c;
		for (i=0,c=z.lights.length;i<c;++i) {
			on_or_off ? z.lights[i].on() : z.lights[i].off();
		}
		return z;
	};

	z.whoopAndDoopBlinkyBlink = function(opts,cb){
		// [circle anim] Rotates around leaving trail, rotates around cleaning up, then blinks
		var num_lights = z.lights.length,
			queue = [],
			anim_circle,anim_blink;
		opts = $.extend({},z.opts.animations.whoopAndDoopBlinkyBlink,opts);

		z._fillQueue(queue,anim_circle,opts.circle_reps);
		z._fillQueue(queue,anim_blink,opts.blink_reps);
		z.allOff();
		z._runQueue(queue,opts.repeat||cb);

		function anim_circle(cb) {
			var delay = z._getRadianInterval(num_lights,opts.circle_speed),
				anim;
			anim = function(dir,cb){
				var index = 0,
					next;
				next = function(){
					if (index == num_lights) {
						cb();
						return;
					}
					dir ? z.lights[index].on() : z.lights[index].off();
					index++;
					z._master_timeout = setTimeout(next,delay);
				};
				next();
			};
			anim(1,function(){
				anim(0,function(){
					if (cb) cb();
				});
			});
		}

		function anim_blink(cb) {
			var delay = opts.blink_delay,
				anim;
			anim = function(offset,cb){
				var i;
				for (i=0;i<num_lights;++i) {
					i%2-offset ? z.lights[i].on() : z.lights[i].off();
				}
				z._master_timeout = setTimeout(cb,delay);
			};
			anim(0,function(){
				anim(1,function(){
					if (cb) cb();
				});
			});
		}
	};

	z.lazyFlash = function(opts,cb){
		// Every other one flashes on and off
		var num_lights = z.lights.length,
			queue = [];
		opts = $.extend({},z.opts.animations.lazyFlash,opts);

		z._fillQueue(queue,anim_blink,opts.blink_reps);
		z.allOff();
		z._runQueue(queue,opts.repeat||cb);

		function anim_blink(cb) {
			var delay = opts.blink_delay,
				anim;
			anim = function(offset,cb){
				var i;
				for (i=0;i<num_lights;++i) {
					i%2-offset ? z.lights[i].on() : z.lights[i].off();
				}
				z._master_timeout = setTimeout(cb,delay);
			};
			anim(0,function(){
				anim(1,function(){
					if (cb) cb();
				});
			});
		}
	};

	z.flashBash = function(opts,cb){
		// All on and off quickly
		var num_lights = z.lights.length,
			queue = [],
			anim_blink;
		opts = $.extend({},z.opts.animations.flashBash,opts);

		z._fillQueue(queue,anim_blink,opts.blink_reps);
		z.allOff();
		z._runQueue(queue,opts.repeat||cb);

		function anim_blink(cb) {
			var delay = opts.blink_delay,
				anim;
			anim = function(on_off,cb){
				var i;
				for (i=0;i<num_lights;++i) {
					on_off ? z.lights[i].on() : z.lights[i].off();
				}
				z._master_timeout = setTimeout(cb,delay);
			};
			anim(0,function(){
				anim(1,function(){
					if (cb) cb();
				});
			});
		}
	};

	z.blinkyBash = function(opts,cb){
		// Fast alternating blinky
		var num_lights = z.lights.length,
			queue = [],
			anim_blink;
		opts = $.extend({},z.opts.animations.blinkyBash,opts);

		z._fillQueue(queue,anim_blink,opts.blink_reps);
		z.allOff();
		z._runQueue(queue,opts.repeat||cb);

		function anim_blink(cb) {
			var delay = opts.blink_delay,
				anim;
			anim = function(offset,cb){
				var i;
				for (i=0;i<num_lights;++i) {
					i%2-offset ? z.lights[i].on() : z.lights[i].off();
				}
				z._master_timeout = setTimeout(cb,delay);
			};
			anim(0,function(){
				anim(1,function(){
					if (cb) cb();
				});
			});
		}
	};

	z.onsolo = function(opts,cb){
		// On cycles round and round
		var num_lights = z.lights.length,
			queue = [],
			animate;
		opts = $.extend({},z.opts.animations.onsolo,opts);

		z._fillQueue(queue,animate,opts.circle_reps);
		z.allOff();
		z._runQueue(queue,opts.repeat||cb);

		function animate(cb) {
			var delay = z._getRadianInterval(num_lights,opts.circle_speed),
				index = 0,
				next;
			next = function(){
				if (index == num_lights) {
					cb();
					return;
				}
				z.lights[index].on();
				z.lights[index-1] ? z.lights[index-1].off() : z.lights[num_lights-1].off();
				index++;
				z._master_timeout = setTimeout(next,delay);
			};
			next();
		}
	};

	z.bicycle = function(opts,cb){
		// On cycles round once on its own, then again leaving a trail
		//	then off follows suit
		var num_lights = z.lights.length,
			queue = [],
			animate,all;
		opts = $.extend({},z.opts.animations.bicycle,opts);

		queue = [all];
		z.allOff();
		z._runQueue(queue,opts.repeat||cb);

		function animate(on_off,leaves_trail,cb) {
			var delay = z._getRadianInterval(num_lights,opts.circle_speed),
				index = 0,
				next;
			next = function(){
				if (index == num_lights) {
					cb();
					return;
				}
				on_off ? z.lights[index].on() : z.lights[index].off();
				if (!leaves_trail && z.lights[index-1]) {
					on_off ? z.lights[index-1].off() : z.lights[index-1].on();
				}
				index++;
				z._master_timeout = setTimeout(next,delay);
			};
			next();
		}

		function all(cb) {
			animate(true,false,function(){
				z.lights[num_lights-1].off();
				animate(true,true,function(){
					animate(false,false,function(){
						z.lights[num_lights-1].on();
						animate(false,true,function(){
							if (cb) cb();
						});
					});
				});
			});
		}
	};

	// END animations


	// BEGIN Light
	Light = function(point){
		var l = this;
		l.$ = {};
		l.$.cont = $('<div class="'+pfx+'-light">'
			+ '<img class="'+pfx+'-light-on" src="'+z.opts.imgs.on.src+'" alt="" />'
		+ '</div>');
		l.$.on = l.$.cont.find('img');
		l.$.on.css('display','none');
		l.$.cont.css({
			'background-image': 'url('+z.opts.imgs.off.src+')',
			left: (point[0]-z.opts.imgs.off.width/2)+'px',
			top: (point[1]-z.opts.imgs.off.height/2)+'px',
			width: z.opts.imgs.off.width+'px',
			height: z.opts.imgs.off.height+'px'
		});
		z.$.cont.append(l.$.cont);

		l.on = function(){
			l.$.on.css('display','');
		};
		l.off = function(){
			l.$.on.css('display','none');
		};
	};
	// END Light


	// BEGIN util methods
	z.generateCircle = function(num_points,radius,tl_perspective){
		// If tl_perspective != true then (0,0) is in the center of the circle
		var delta = (2*Math.PI)/num_points,
			rad = Math.PI,
			points = [],
			mod,i;
		mod = tl_perspective ? radius : 0;
		for (i=0;i<num_points;++i) {
			points[i%num_points] = [
				(radius*Math.sin(rad))+mod,
				(radius*Math.cos(rad))+mod
			];
			rad -= delta;
		}
		return points;
	};
	z.generatePolygon = function(corners){
		// The first point is always (0,0), lines drawn in order
		// todo...
	};
	z._fillQueue = function(queue,method,num){
		var i;
		for (i=0;i<num;++i) {
			queue.push(method);
		}
		return queue;
	};
	z._runQueue = function(queue,repeat_or_cb){
		var index = 0,
			length = queue.length,
			next;
		next = function(){
			if (index == length) {
				if (typeof(repeat_or_cb) == 'function') {
					repeat_or_cb();
				} else if (repeat_or_cb) {
					index = 0;
					next();
				}
				return;
			}
			queue[index++](next);
		};
		next();
	};
	z._getRadianInterval = function(num_points,speed){
		return ((2*Math.PI*num_points)/speed)*1000/10;
	};
	// END util methods

}