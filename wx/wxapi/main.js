const API_BASE_URL = 'https:111.com'
let subDomain = '/api/v1'

const request = (url, method, data, header = {}) => {
	let _url = API_BASE_URL + subDomain + url
	return new Promise((resolve, reject) => {
		wx.request({
			url: _url,
			method: method,
			data: data,
			header: {
				...header,
				'Content-Type': 'application/json'
			},
			success(request) {
				if(request.data.code === 0) {
					resolve(request.data)
				} else {
					wx.showToast({
						title: request.data.msg,
						icon: 'none'
					})
				}
			},
			fail(error) {
				reject(error)
			},
			complete(aaa) {
				// 加载完成
			}
		})
	})
}

Promise.prototype.finally = function(callback) {
	var Promise = this.constructor;
	return this.then(
		function(value) {
			Promise.resolve(callback()).then(
				function() {
					return value;
				}
			);
		},
		function(reason) {
			Promise.resolve(callback()).then(
				function() {
					throw reason;
				}
			);
		}
	);
}

module.exports = {
	request,
	// 登录
	login: data => request('/homework/login', 'post', data),
	// 获取作业列表
	getHomeworkList: (data) => request('/homework/list', 'post', data),

}
