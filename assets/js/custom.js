/*
 * custom.js main js file
 */

 /* Main options */
 var setting = {
	lastDate:       '11/21/2014 12:45:00',   //Date format: month/day/year hours:minutes:seconds
	timeZone:        -8,                      //GMT +10 or -5
	style:{
		colorStart: '#4b4d4d',               //Background color start. Any #hex color, only 6 characters
		colorEnd:   '#1e1f1f',               //Background color end. Any #hex color, only 6 characters
		bgStyle:    'circularMiddleCenter',  //Background style
		bgPattern:  'patt-1'                 //Background pattern
	}
};
/* End options  */


$(document).ready(function () {
	/* Style set */
	$('body').css('background-color',setting.style.colorEnd);
	getGradient(setting.style.colorStart, setting.style.colorEnd, setting.style.bgStyle);
	$('.patt').addClass(setting.style.bgPattern);

	/* Language switcher */
	var langs = getParameterValue('lang');
	(langs != "") ? langs : '';
	$('[data-localize]').localize('lang', {
		language: langs,
		pathPrefix: 'lang',
		skipLanguage: /^en/,
		callback: function (data, defaultCallback) {
			document.title = data.name.name_light + ' ' + data.name.name_dark;
			defaultCallback(data);
			window.lName = data.name.name_light;
		}
	});

	/* Counter */
	$('#dig-days, #dig-hours, #dig-mins, #dig-sec, #count-small span').each(function(indx){
		$(this).countdown({
			until: new Date(Date.parse(setting.lastDate)),
			compact: true,
			layout:$(this).html(),
			timezone:setting.timeZone
		});
	});

	/* Validation and ajax post subscribe */
	$("#subscribe-form").validate({
		errorElement: "small",
		onkeyup: false,
		rules: {
			subscribe: {
				required: true,
				email: true
			}
		},
		messages: {
			subscribe: {
				required: $('#tempRequired').text(),
				email: $('#tempMail').text()
			}
		},
		submitHandler: function (form) {
			$.ajax({
				beforeSend:function(){
					$('#send-mail').attr( 'data-loading','' );
				},
				complete:function(){
					$('#send-mail').removeAttr( 'data-loading' );
				},
				success: function (data) {
					if (data == 0) {
						$('#success').html($('#tempSuccess').html())
						.show().delay(2000).fadeOut(500);
					} else if (data == 1) {
						$(form).validate().showErrors({
							subscribe: $('#tempMail').text()
						});
					} else if (data == 2) {
						$(form).validate().showErrors({
							subscribe: $('#tempSubs').text()
						});
					} else {
						$(form).validate().showErrors({
							subscribe: 'Error request!'
						});
					}
				},
				statusCode: {
					404: function () {
						alert('Not found actions.php');
					}
				},
				type: 'POST',
				url: 'assets/php/actions.php',
				cache: false,
				data: $(form).serialize()
			});
		}
	});

	fullBg();

	$('#button-lang').click(function () {
		$('#modal-lang').reveal();
		return false;
	});

	setInterval(function () {
		$('.dark').css('color',getContrast(setting.style.colorStart));
	}, 1000);

	$(window).resize(function(){
		vCenter();
		vAbsolute();
		fullBg();
	});
});


/* Animation effects */
$(window).load(function () {
	$('#preLoad').remove();
	$('.show0').animate({opacity: '1'});
	vAbsolute();
	var dur = (window.innerWidth < 768 || Modernizr.touch)?0:1000;
	$('.container').animate({width:'940px',opacity:'1'},dur,'swing',function(){
		$(this).animate({height:getHeight(this)},{
			duration:dur,
			easing:'swing',
			step:vAbsolute,
			complete:function(){
				vCenter();
				vAbsolute();
				$(this).css({"height":"auto"});
				$('.show1').delay(100).animate({opacity: '1'});
				$('.show2').delay(200).animate({opacity: '0.8'});
				$('.show3').delay(300).animate({opacity: '1'});
				$('.show4').delay(400).animate({opacity: '1'});
			}
		});
	});
});

function getHeight(el){
	el = jQuery(el);
	elem = el.clone().height('auto').appendTo("body");
	height = elem.height();
	elem.remove();
	return height;
}

function vAbsolute(){
	var p = 50;
	var l = $('.logo').is(':visible')?$(".logo").height():0;
	var m = (($(window).height() - l) - $('.container').height()) / 2;
	m = m > 0 ? m : p;
	$('.container').css('margin-top', m);
	$('.logo').css('top',m - p/2);
}

function vCenter(){
	$('.vcenter').each(function(i) {
		var m = Math.round(($(this).parent().height() - $(this).height()) / 2);
		$(this).css('margin-top', m > 0 ? m : 0);
	});
}

function getParameterValue(parameter) {
	parameter = parameter.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
	var regexS = "[\\?&]" + parameter + "=([^&#]*)";
	var regex = new RegExp(regexS);
	var results = regex.exec(window.location.href);
	if (results == null) return "";
	else return results[1];
}

function getContrast(hexcolor){
	var re = /^#((([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})){1,2})$/;
	if(re.test(hexcolor)){
		hexcolor = re.exec(hexcolor);
		if(hexcolor[1].length == 3){
			hex = hexcolor[3]+hexcolor[3]+hexcolor[4]+hexcolor[4]+hexcolor[5]+hexcolor[5];
		} else {
			hex = hexcolor[1];
		}

		var r = parseInt(hex.substr(0,2),16);
		var g = parseInt(hex.substr(2,2),16);
		var b = parseInt(hex.substr(4,2),16);
		var yiq = ((r*299)+(g*587)+(b*114))/1000;
		return (yiq > 60) ? 'black' : 'white';
	} else {
		console.log('Color code is not yet valid');
	}
}

function getGradient(colorStart, colorEnd, orientation)
{
	var bg = $('.bg');

	switch (orientation) {
		case 'linearBottomRight'     : style="linear"; w3c="to bottom right"; position="top left"; webkit="left top, right bottom"; break;
		case 'linearBottom'		     : style="linear"; w3c="to bottom"; position="top"; webkit="left top, left bottom"; break;
		case 'linearBottomLeft'	     : style="linear"; w3c="to bottom left"; position="top right"; webkit="right top, left bottom"; break;
		case 'linearRight'		     : style="linear"; w3c="to right"; position="left"; webkit="left top, right top"; break;
		case 'linearLeft'		     : style="linear"; w3c="to left"; position="right"; webkit="right top, left top"; break;
		case 'linearTopRight'	     : style="linear"; w3c="to top right"; position="bottom left"; webkit="left bottom, right top"; break;
		case 'linearTop'		     : style="linear"; w3c="to top"; position="bottom"; webkit="left bottom, left top"; break;
		case 'linearTopLeft'	     : style="linear"; w3c="to top left"; position="bottom right"; webkit="right bottom, left top"; break;
		case 'circularTopLeft'		 : style="radial"; w3c="circle farthest-corner at left top"; position="left top, circle farthest-corner"; webkit="left top, 0, left top, 973"; break;
		case 'circularTopCenter'	 : style="radial"; w3c="circle farthest-corner at center top"; position="center top, circle farthest-corner"; webkit="center top, 0, center top, 487"; break;
		case 'circularTopRight'		 : style="radial"; w3c="circle farthest-corner at right top"; position="right top, circle farthest-corner"; webkit="right top, 0, right top, 973"; break;
		case 'circularMiddleLeft'	 : style="radial"; w3c="circle farthest-corner at left center"; position="left center, circle farthest-corner"; webkit="left center, 0, left center, 973"; break;
		case 'circularMiddleCenter'	 : style="radial"; w3c="circle farthest-corner at center"; position="center, circle farthest-corner"; webkit="center center, 0, center center, 487"; break;
		case 'circularMiddleRight'	 : style="radial"; w3c="circle farthest-corner at right center"; position="right center, circle farthest-corner"; webkit="right center, 0, right center"; break;
		case 'circularBottomLeft'	 : style="radial"; w3c="circle farthest-corner at left bottom"; position="left bottom, circle farthest-corner"; webkit="left bottom, 0, left bottom, 973"; break;
		case 'circularBottomCenter'	 : style="radial"; w3c="circle farthest-corner at center bottom"; position="center bottom, circle farthest-corner"; webkit="center bottom, 0, center bottom, 549"; break;
		case 'circularBottomRight'	 : style="radial"; w3c="circle farthest-corner at right bottom"; position="right bottom, circle farthest-corner"; webkit="right bottom, 0, right bottom, 973"; break;
		case 'ellipticalTopLeft'	 : style="radial"; w3c="ellipse farthest-corner at left top"; position="left top, ellipse farthest-corner"; webkit="left top, 0, left top, 973"; break;
		case 'ellipticalTopCenter'	 : style="radial"; w3c="ellipse farthest-corner at center top"; position="center top, ellipse farthest-corner"; webkit="center top, 0, center top, 487"; break;
		case 'ellipticalTopRight'	 : style="radial"; w3c="ellipse farthest-corner at right top"; position="right top, ellipse farthest-corner"; webkit="right top, 0, right top, 973"; break;
		case 'ellipticalMiddleLeft'  : style="radial"; w3c="ellipse farthest-corner at left center"; position="left center, ellipse farthest-corner"; webkit="left center, 0, left center, 973"; break;
		case 'ellipticalMiddleCenter': style="radial"; w3c="ellipse farthest-corner at center"; position="center, ellipse farthest-corner"; webkit="center center, 0, center center, 487"; break;
		case 'ellipticalMiddleRight' : style="radial"; w3c="ellipse farthest-corner at right center"; position="right center, ellipse farthest-corner"; webkit="right center, 0, right center"; break;
		case 'ellipticalBottomLeft'	 : style="radial"; w3c="ellipse farthest-corner at left bottom"; position="left bottom, ellipse farthest-corner"; webkit="left bottom, 0, left bottom, 973"; break;
		case 'ellipticalBottomCenter': style="radial"; w3c="ellipse farthest-corner at center bottom"; position="center bottom, ellipse farthest-corner"; webkit="center bottom, 0, center bottom, 487"; break;
		case 'ellipticalBottomRight' : style="radial"; w3c="ellipse farthest-corner at right bottom"; position="right bottom, ellipse farthest-corner"; webkit="right bottom, 0, right bottom, 973"; break;

		default: style="linear"; w3c="to right"; position="left"; webkit="left top, right top"; break;
	}

	bg.css({'background' : colorStart});
	bg.css({'background' : '-moz-' + style + '-gradient(' + position + ', ' + colorStart + ' 0%, ' + colorEnd + ' 100%)' });
	bg.css({'background' : '-webkit-gradient(' + style + ', ' + webkit + ', color-stop(0, ' + colorStart + '), color-stop(1, ' + colorEnd + '))'});
	bg.css({'background' : '-webkit-' + style + '-gradient(' + position + ', ' + colorStart + ' 0%, ' + colorEnd + ' 100%)'});
	bg.css({'background' : '-o-' + style + '-gradient(' + position + ', ' + colorStart + ' 0%, ' + colorEnd + ' 100%)'});
	bg.css({'background' : '-ms-' + style + '-gradient(' + position + ', ' + colorStart + ' 0%, ' + colorEnd + ' 100%)'});
	bg.css({'background' : style + '-gradient(' + w3c + ', ' + colorStart + ' 0%, ' + colorEnd + ' 100%)'});
	bg.css({'background' : 'filter: progid:DXImageTransform.Microsoft.gradient( startColorstr=\'' + colorStart + '\', endColorstr=\'' + colorEnd + '\',Gradientstyle=1 )'});
}

function fullBg() {
	var windowHeight = $(window).height();
	var windowWidth = $(window).width();

	$('.bg-img, #bg').each(function () {
		var imgHeight = $(this).attr("height");
		var imgWidth = $(this).attr("width");

		var newWidth = windowWidth;
		var newHeight = (windowWidth / imgWidth) * imgHeight;
		var topMargin = ((newHeight - windowHeight) / 2) * -1;
		var leftMargin = 0;

		if (newHeight < windowHeight) {
			var newWidth = (windowHeight / imgHeight) * imgWidth;
			var newHeight = windowHeight;
			var topMargin = 0;
			var leftMargin = ((newWidth - windowWidth) / 2) * -1;
		}

		$(this).css({
			height: newHeight + "px",
			width: newWidth + "px",
			marginLeft: leftMargin + "px",
			marginTop: topMargin + "px",
			display: "block"
		});
	});
}
