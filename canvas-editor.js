(function($) {


	$.fn.canvasEdit = function(options) {

		var settings = $.extend({
			mousePressed: false,
			lastX: '',
			lastY: '',
			mouse: {
				x: 0,
				y: 0
			},
			startMouse: {
				x: 0,
				y: 0
			},
			lastMouse: {
				x: 0,
				y: 0
			},
			$textarea: '',
			ctx: '',
			canvas: '',
			$canvas: '',
			tmpTxtCtn: '',
			gd: {},
			shifted: false,
			ctrlDown: false,
			cPushArray: [''],
			cStep: -1,
			width: 1024,
			height: 768
		}, options);


		init = function() {
			render();
			drawing();
			initTools();
		}

		_manageCursor = function() {
			if (settings.gd.pushIt == true) {
				if (settings.$canvas.hasClass(settings.gd.lastTool)) {
					settings.$canvas.removeClass(settings.gd.lastTool);
				}
				if (!settings.$canvas.hasClass(settings.gd.tool)) {
					settings.$canvas.addClass(settings.gd.tool);
				}
			} else {
				if (settings.$canvas.hasClass(settings.gd.lastTool)) {
					settings.$canvas.removeClass(settings.gd.lastTool);
				}
				if (settings.$canvas.hasClass(settings.gd.tool)) {
					settings.$canvas.removeClass(settings.gd.tool);
				}
			}
			return true;
		};

		_writeText = function(value) {
			var x = Math.min(settings.mouse.x, settings.startMouse.x),
				y = Math.min(settings.mouse.y, settings.startMouse.y),
				lines = value.split('\n'),
				processed_lines = [];

			settings.ctx.fillStyle = settings.gd.color;
			settings.ctx.font = settings.gd.fontSize + "px arial";
			settings.ctx.textBaseline = "top";

			for (var i = 0; i < lines.length; i++) {
				var chars = lines[i].length;

				for (var j = 0; j < chars; j++) {
					var text_node = document.createTextNode(lines[i][j]);
					settings.tmpTxtCtn.appendChild(text_node);

					settings.tmpTxtCtn.style.position = 'absolute';
					settings.tmpTxtCtn.style.visibility = 'hidden';
					settings.tmpTxtCtn.style.display = 'block';

					var width = settings.tmpTxtCtn.offsetWidth;
					var height = settings.tmpTxtCtn.offsetHeight;

					settings.tmpTxtCtn.style.position = '';
					settings.tmpTxtCtn.style.visibility = '';
					settings.tmpTxtCtn.style.display = 'none';

					if (width > parseInt(settings.$textarea.width())) {
						break;
					}
				}

				processed_lines.push(settings.tmpTxtCtn.textContent);
				settings.tmpTxtCtn.innerHTML = '';
			}

			for (var n = 0; n < processed_lines.length; n++) {
				var processed_line = processed_lines[n];

				settings.ctx.fillText(
					processed_line,
					parseInt(settings.$textarea.position().left),
					parseInt(settings.$textarea.position().top) + n * parseInt(settings.gd.fontSize)
				);
			}

			_cPush();
		}


		_undoRedoBtnActivity = function() {
			var redo = document.getElementById("draw-redo-ico"),
				undo = document.getElementById("draw-undo-ico");

			if (settings.cStep < settings.cPushArray.length - 1) {
				$(redo).removeClass("inactive");
			} else {
				$(redo).addClass("inactive");
			}
			if (settings.cStep > 0) {
				$(undo).removeClass("inactive");
			} else {
				$(undo).addClass("inactive");
			}
		};

		_cPush = function() {
			settings.cStep++;
			if (settings.cStep < settings.cPushArray.length) {
				settings.cPushArray.length = settings.cStep;
			}
			settings.cPushArray.push(document.getElementById('screenshot-canvas').toDataURL());

			_undoRedoBtnActivity();
		};


		_draw = function(x, y, isDown) {
			if (isDown) {
				settings.ctx.beginPath();
				settings.ctx.globalCompositeOperation = "source-over";
				settings.ctx.strokeStyle = settings.gd.color;
				settings.ctx.lineWidth = settings.gd.toolSize;
				settings.ctx.lineJoin = "round";
				settings.ctx.moveTo(settings.lastX, settings.lastY);
				settings.ctx.lineTo(x, y);
				settings.ctx.closePath();
				settings.ctx.stroke();
			}
			settings.lastX = x;
			settings.lastY = y;
		}

		_drawFromMemory = function() {
			var canvasPic = new Image();
			canvasPic.src = settings.cPushArray[settings.cStep];
			canvasPic.onload = function() {
				settings.ctx.drawImage(canvasPic, 0, 0, canvasPic.width, canvasPic.height);
			}
		}

		_erase = function(x, y, isDown) {
			if (isDown) {
				settings.ctx.beginPath();
				settings.ctx.globalCompositeOperation = "destination-out";
				settings.ctx.strokeStyle = "rgba(0,0,0,1)";
				settings.ctx.lineWidth = settings.gd.toolSize;
				settings.ctx.lineJoin = "round";
				settings.ctx.moveTo(settings.lastX, settings.lastY);
				settings.ctx.lineTo(x, y);
				settings.ctx.closePath();
				settings.ctx.stroke();
			}
			settings.lastX = x;
			settings.lastY = y;
		}

		_invisibleCanvas = function(e, _this) {
			var type = e;
			settings.mouseX = e.clientX;
			settings.mouseY = e.clientY;
			el;

			document.getElementById('screenshot-canvas').style.display = "none";
			el = document.elementFromPoint(mouseX, mouseY);
			_this.css("cursor", $(el).css("cursor"));
			document.getElementById('screenshot-canvas').style.display = "block";

			$(el).trigger(type);

			e.preventDefault();
			e.stopPropagation();
			return false;
		};

		_toggleInvisibleCanvas = function(className) {

			if (!settings.$canvas.is(":visible")) {
				settings.$canvas.show();
			}

			settings.gd.pushIt = true;
			settings.$canvas.attr("contentEditable", "true")
			settings.$canvas[0].contentEditable = true;
		};

		_adjustTextArea = function() {
			var xx = Math.min(settings.mouse.x, settings.startMouse.x);
			yy = Math.min(settings.mouse.y, settings.startMouse.y),
				settings.width = Math.abs(settings.mouse.x - settings.startMouse.x),
				settings.height = Math.abs(settings.mouse.y - settings.startMouse.y);

			settings.$textarea.css({
				top: yy + 'px',
				left: xx + 'px',
				width: settings.width + 'px',
				height: settings.height + 'px',
				color: settings.gd.color,
				"font-size": settings.gd.fontSize + "px",
				display: 'block'
			});
		}

		_cUndo = function(toStart) {
			if (toStart) {
				settings.cStep = 0;
				settings.ctx.clearRect(0, 0, settings.width, settings.height);

				_drawFromMemory();
			} else {
				if (settings.cStep > 0) {
					settings.cStep--;
					settings.ctx.clearRect(0, 0, settings.width, settings.height);

					_drawFromMemory();
				}
			}
			_undoRedoBtnActivity();
		}

		_undoRedoBtnActivity = function() {
			var redo = document.getElementById("draw-redo-ico"),
				undo = document.getElementById("draw-undo-ico");

			if (settings.cStep < settings.cPushArray.length - 1) {
				$(redo).removeClass("inactive");
			} else {
				$(redo).addClass("inactive");
			}
			if (settings.cStep > 0) {
				$(undo).removeClass("inactive");
			} else {
				$(undo).addClass("inactive");
			}
		};

		_clearAll = function() {
			settings.cPushArray = [''];
			settings.cStep = 0;

			settings.ctx.clearRect(0, 0, settings.width, settings.height);
			settings.cPushArray.push(document.getElementById('screenshot-canvas').toDataURL());

			_undoRedoBtnActivity();
		}


		_cRedo = function(toEnd) {
			if (toEnd) {
				settings.cStep = settings.cPushArray.length - 1;
				settings.ctx.clearRect(0, 0, settings.width, settings.height);

				_drawFromMemory();
			} else {
				if (settings.cStep < settings.cPushArray.length - 1) {
					settings.cStep++;
					settings.ctx.clearRect(0, 0, settings.width, settings.height);

					_drawFromMemory();
				}
			}
			_undoRedoBtnActivity();
		}

		drawing = function() {
			settings.$canvas = $('#screenshot-canvas');
			canvas = document.getElementById('screenshot-canvas');
			settings.ctx = canvas.getContext("2d");

			settings.tmpTxtCtn = document.getElementById('comment');

			settings.$textarea = $('#text-input');

			canvas.width = settings.width;
			canvas.height = settings.height;

			settings.gd.tool = 'marker';
			settings.gd.lastTool = settings.gd.tool;
			settings.gd.toolSize = 2;
			settings.gd.fontSize = 12;
			settings.gd.color = $('.active-color').attr('id');

			_toggleInvisibleCanvas($('#toggle-drawing').attr("class"));

			settings.$textarea.bind("focus", function(e) {
				settings.$canvas.one("mousedown touchstart", function() {
					if (settings.$textarea.val().length > 0) {
						_writeText(settings.$textarea.val());
					}

					settings.$textarea.val("").hide().css("z-index", 0);
				});
			});


			settings.$canvas.bind("mousedown touchstart", function(e) {
				settings.mousePressed = true;

				settings.lastX = e.pageX - $(this).offset().left;
				settings.lastY = e.pageY - $(this).offset().top;

				if (settings.gd.pushIt == true) {
					if (settings.gd.tool == 'marker') {
						_draw(e.pageX - $(this).offset().left, e.pageY - $(this).offset().top, true);
					}
					if (settings.gd.tool == 'eraser') {
						_erase(e.pageX - $(this).offset().left, e.pageY - $(this).offset().top, true);
					}
				}
				if (settings.gd.pushIt == false) {
					_invisibleCanvas(e, $(this));
				}
				if ($(".multi-item-menu").is(":visible")) {
					$(".multi-item-menu").fadeOut(400);
				}
				if ($("#draw-colors-pallet").is(":visible")) {
					$("#draw-colors-pallet").fadeOut(400);
				}

				if (settings.gd.tool == 'text') {
					settings.mouse.x = typeof e.offsetX !== 'undefined' ? e.offsetX : e.layerX;
					settings.mouse.y = typeof e.offsetY !== 'undefined' ? e.offsetY : e.layerY;

					settings.startMouse.x = settings.mouse.x;
					settings.startMouse.y = settings.mouse.y;
				}
			});

			settings.$canvas.bind("mousemove touchmove", function(e) {
				if (settings.mousePressed == true && settings.gd.pushIt == true) {
					if (settings.gd.tool == 'marker') {
						_draw(e.pageX - $(this).offset().left, e.pageY - $(this).offset().top, true);
					}
					if (settings.gd.tool == 'eraser') {
						_erase(e.pageX - $(this).offset().left, e.pageY - $(this).offset().top, true);
					}

					if (settings.gd.tool == 'text') {
						settings.mouse.x = typeof e.offsetX !== 'undefined' ? e.offsetX : e.layerX;
						settings.mouse.y = typeof e.offsetY !== 'undefined' ? e.offsetY : e.layerY;

						_adjustTextArea();
					}
				}
				if (settings.gd.pushIt == false) {
					var x = e.pageX,
						y = e.pageY;

					settings.mousePressed = false;

					if (x !== settings.lastX || y !== settings.lastY) {
						_invisibleCanvas(e, $(this));
					}

					settings.lastX = x;
					settings.lastY = y;
				}
			});


			settings.$canvas.bind("mouseleave mouseup touchend touchcancel", function(e) {
				if (settings.mousePressed == true && settings.gd.pushIt == true) {
					if (settings.gd.tool !== 'text') {
						_cPush();
					}

					if (settings.$textarea.is(":visible")) {
						settings.$textarea.focus().css({
							"z-index": 10
						});
					}
				}

				settings.mousePressed = false;
			});


			settings.$canvas.bind("mouseenter", function(e) {
				_manageCursor();
			});

			$('#draw-undo-ico').click(function() {
				_cUndo();
			}).mousedown(function(e) {
				clearTimeout(this.downTimer);
				this.downTimer = setTimeout(function() {
					_cUndo(true);
				}, 1400);
			}).mouseup(function(e) {
				clearTimeout(this.downTimer);
			});

			$('#draw-redo-ico').click(function() {
				_cRedo();
			}).mousedown(function(e) {
				clearTimeout(this.downTimer);
				this.downTimer = setTimeout(function() {
					_cRedo(true);
				}, 1500);
			}).mouseup(function(e) {
				clearTimeout(this.downTimer);
			});


			settings.$canvas.keydown(function(e) {
				var ctrlKey = 17,
					yKey = 89,
					zKey = 90,
					mKey = 109,
					eKey = 101,
					tKey = 116;
				e = e || window.event
				settings.ctrlDown = e.ctrlKey || e.metaKey

				if (settings.ctrlDown && e.keyCode == zKey) {
					_cUndo();
				}
				if (settings.ctrlDown && e.keyCode == yKey) {
					_cRedo();
				}
			}).keyup(function(e) {
				var ctrlKey = 17,
					yKey = 89,
					zKey = 90;
				e = e || window.event

				if (e.keyCode == ctrlKey) {
					settings.ctrlDown = false;
				}
			});

			_cPush();
		}

		render = function() {
			textarea = document.createElement('textarea');
			textarea.setAttribute('id', "text-input");
			document.body.appendChild(textarea);

			div = document.createElement('div');
			div.setAttribute('id', 'comment');
			div.setAttribute('class', 'hide');
			document.body.appendChild(div);

			tools = document.createElement('div');
			tools.setAttribute('id', 'draw-tools-block');

			panel = document.createElement('div');
			panel.setAttribute('class', 'draw-panel-title');
			panel.innerHTML = 'Panel';
			tools.appendChild(panel);

			draw_marker_ico = document.createElement('div');
			draw_marker_ico.setAttribute('class', 'draw-tool-ico ion-edit active-tool');
			draw_marker_ico.setAttribute('id', 'draw-marker-ico');
			tools.appendChild(draw_marker_ico);

			draw_eraser_ico = document.createElement('div');
			draw_eraser_ico.setAttribute('class', 'draw-tool-ico ion-ios-trash-outline');
			draw_eraser_ico.setAttribute('id', 'draw-trash-ico');
			tools.appendChild(draw_eraser_ico);

			draw_text_ico = document.createElement('div');
			draw_text_ico.setAttribute('class', 'draw-tool-ico ion-android-textsms');
			draw_text_ico.setAttribute('id', 'draw-text-ico');
			tools.appendChild(draw_text_ico);

			draw_colors_ico = document.createElement('div');
			draw_colors_ico.setAttribute('class', 'draw-tool-ico ion-android-color-palette');
			draw_colors_ico.setAttribute('id', 'draw-colors-ico');
			tools.appendChild(draw_colors_ico);

			draw_colors_pallet = document.createElement('div');
			draw_colors_pallet.setAttribute('id', 'draw-colors-pallet');
			tools.appendChild(draw_colors_pallet);


			draw_undo_ico = document.createElement('div');
			draw_undo_ico.setAttribute('class', 'draw-tool-ico ion-reply');
			draw_undo_ico.setAttribute('id', 'draw-undo-ico');
			tools.appendChild(draw_undo_ico);

			draw_redo_ico = document.createElement('div');
			draw_redo_ico.setAttribute('class', 'draw-tool-ico ion-forward');
			draw_redo_ico.setAttribute('id', 'draw-redo-ico');
			tools.appendChild(draw_redo_ico);

			document.body.appendChild(tools);

		}

		initTools = function() {
			var colorArray = ['#C0C0C0', '#808080', '#000000', '#FF0000', '#800000', '#FFFF00', '#808000', '#008000', '#00FFFF', '#008080', '#0000FF', '#000080', '#FF00FF', '#800080'];
			toggleDrawing = $('#toggle-drawing');
			toolsContainer = $('#draw-tools-block');
			markerIco = $('#draw-marker-ico');
			trashIco = $('#draw-trash-ico');
			eraserIco = $('#draw-eraser-ico');
			TextIco = $('#draw-text-ico');
			colorsIco = $('#draw-colors-ico');
			colorPallet = $("#draw-colors-pallet");

			$.each(colorArray, function(index, value) {
				var active = '';
				if (index == 2) {
					active = " active-color";
				}

				$('<span />', {
						id: value,
					class: "pallet-colors" + active,
						style: 'background-color:' + value + ';'
					})
					.attr("data-color", value)
					.click(function() {
						$('.active-color').removeClass('active-color');
						$(this).addClass('active-color');
						settings.gd.color = value;

						settings.$textarea.css({
							color: settings.gd.color,
							"font-size": settings.gd.fontSize + "px"
						});

						$('.active-tool').click();
						if (settings.$textarea.is(":visible")) {
							settings.$textarea.focus();
						}
					})
					.appendTo(colorPallet);
			});

			colorsIco.click(function() {
				colorPallet.fadeToggle(400);
			});

			$('.draw-tool-ico').click(function() {
				var $this = $(this),
					id = this.id;

				if (id !== "draw-colors-ico" && id !== "draw-undo-ico" && id !== "draw-redo-ico") {
					if (colorPallet.is(":visible")) {
						colorPallet.fadeOut(400);
					}

					if (!$this.hasClass("active-tool")) {
						$(".active-tool").removeClass("active-tool");

						$this.toggleClass("active-tool");
					}
				}

				if (id !== "draw-text-ico" && id !== "draw-colors-ico" && settings.$textarea.is(":visible")) {
					settings.$textarea.val("").hide().css("z-index", 0);
				}
			});

			markerIco.click(function() {
				settings.gd.lastTool = settings.gd.tool;
				settings.gd.tool = "marker";
				settings.gd.toolSize = 2;
				_manageCursor();
			});

			eraserIco.click(function() {
				settings.gd.lastTool = settings.gd.tool;
				settings.gd.tool = "eraser";
				settings.gd.toolSize = 15;
				_manageCursor();
			});

			trashIco.click(function() {
				_clearAll();
			});

			TextIco.click(function() {
				settings.gd.lastTool = settings.gd.tool;
				settings.gd.tool = "text";
				_manageCursor();
			});

			return true;
		};

		return this.each(init);
	};

})(jQuery);