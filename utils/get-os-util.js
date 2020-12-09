const detectOS = function() {
	var u = navigator.userAgent;
	var w = window.screen.width;

	var isWin = (navigator.platform == "Win32") || (navigator.platform == "Windows");
	var isMac = (navigator.platform == "Mac68K") || (navigator.platform == "MacPPC") || (navigator.platform == "Macintosh") || (navigator.platform == "MacIntel");
	var isMobile = !! u.match(/AppleWebKit.*Mobile.*/) || !! u.match(/AppleWebKit/);	//移动终端
	var isIOS = !! u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);		//ios终端
	var isAndroid = u.indexOf('Android') > -1 || u.indexOf('Linux') > -1;	//android终端或者uc浏览器
	var isIPhone = u.indexOf('iPhone') > -1 || u.indexOf('Mac') > -1;	//iPhone或者QQHD浏览器
	var isIPad = u.indexOf('iPad') > -1;
	var isXiaomi = u.indexOf('XiaoMi') > -1;

	if (isWin) return "Windows";
	if (isMac) {
		if(w == '1024') {
			return "iPadOS";
		}
		return "macOS";
	}
	if (isAndroid || isXiaomi) {
		if(w == '768' || w == '1024' || w == '600' || w == '960' || w == '800' || w == '640') {
			return "AndroidPad";
		}
		return "Android";
	}
	if (isIPad) return "iPadOS";
	if (isIPhone) return "iOS";
	return "Windows";
}

export {
	detectOS
}
