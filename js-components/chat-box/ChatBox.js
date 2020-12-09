import './chat-box.scss'
import '../../css/sass/button.scss'

import * as _ from 'lodash-es'
import {
	addEvent,
	resolveStaticPath
} from '../helper'
import {
	getItem,
	getItemValue
} from '../helper/storageHelper.js'
import TabPanes from '../components/TabPanes'

var rtc_gate = require('../jssdk/rtc_gate.js')

let input_html = '';
let NOTE_MAX = 60;

function _getUserNameHTML(userinfo) {
	userinfo.nick_name = userinfo.nick_name || userinfo.nick || userinfo.uid
	var res = '<span class="user-role-name">' + userinfo.nick_name + '</span>'
	switch (userinfo.identity) {
		case GLOB.USER_ROLE.EZONE_ADMIN:
			res = '<span class="user-role-sign">助教</span><span class="user-role-name">' + userinfo.nick_name + '</span>'
			break;
		case GLOB.USER_ROLE.EZONE_TEACHER:
			res = '<span class="user-role-sign">老师</span><span class="user-role-name">' + userinfo.nick_name + '</span>'
			break;
		default:

	}
	return res
}

let btnEmoticon = null;

export default class ChatBox {
	constructor(options) {
		this.chatShow = false;
		this.unReadedMsg = 0;
		this.readOnly = false;
		this.chatContainter = null;
		this.inputContainter = null;
		this.userWrap = null;
		this.btnSend = null;
		this.chatState = true; //禁言
		this.limitChat = null; //全体禁言
		this.isFrequent = false;
		this.userinfo = getAuthData();
		this.init();
	}
	init() {
		var stateLiatEl = document.getElementById('state-modules');
		var tabPanes = new TabPanes({
			parent: stateLiatEl,
			tabListClassName: 'chat-header'
		})

		_.each(require('../../json/state-tab-group.json'), (tg, i) => {
			var pane = document.createElement('div')
			tabPanes.add({
				tab: {
					name: tg.name,
					title: tg.title
				},
				pane
			})
			if (tg.name === 'chat') {
				this.buildChatWrapperEl(pane);
			} else {
				this.buildUserWrapperEl(pane);
			}
		})
		tabPanes.setActiveTab('chat')

		document.getElementById('state-modules').setAttribute('style', 'display:block;');
	}
	buildChatWrapperEl(pane) {
		var _this = this;

		this.chatContainter = document.createElement('ul');
		this.chatContainter.setAttribute('class', 'chat-containter');
		this.chatContainter.setAttribute('id', 'chat-containter');
		pane.appendChild(this.chatContainter);

		var inputWrap = document.createElement('div');
		inputWrap.setAttribute('class', 'input-content');

		btnEmoticon = document.createElement('a');
		btnEmoticon.setAttribute('class', 'input-btn-list');
		var btnEmoticonImg = document.createElement('img');
		btnEmoticonImg.setAttribute('src', './assets/images/common-icons/btn_expression_nor@2x.png');
		btnEmoticon.appendChild(btnEmoticonImg);
		inputWrap.appendChild(btnEmoticon);

		this.inputContainter = document.createElement('div');
		this.inputContainter.setAttribute('class', 'chat-input');
		this.inputContainter.setAttribute('id', 'chat-input');
		this.inputContainter.setAttribute('contenteditable', 'true');
		this.inputContainter.tabIndex = '1';
		inputWrap.appendChild(this.inputContainter);

		//注册中文的输入事件，
		var isCN = false;
		var text_content = this.inputContainter;
		text_content.addEventListener('compositionstart', function(event) {
			isCN = true;
			//撤销预输入内容，必须否则会替代末尾字符
			if (_this.getByte(text_content.innerHTML) >= NOTE_MAX) {
				event.preventDefault();
			}
		});
		text_content.addEventListener('compositionend', function() {
			isCN = false;
		})
		//注册文本输入事件，获取光标的起止偏移数据,如果是非中文以及超出长度的输入，则撤销本次操作
		var txtAnchorOffset, txtFocusOffset;
		text_content.addEventListener("textInput", function(event) {
			var _sel = document.getSelection();
			txtAnchorOffset = _sel.anchorOffset;
			txtFocusOffset = _sel.focusOffset;
			//必须加上isCN的判断，否则获取不到正确的光标数据
			if (!isCN && _this.getByte(text_content.innerHTML) >= NOTE_MAX) {
				event.preventDefault();
			}
		});
		//注册粘贴事件，获取粘贴数据的长度
		var pastedLength;
		text_content.addEventListener("paste", function(event) {
			if (!event.clipboardData) return;
			_this.textInit(event);
			pastedLength = event.clipboardData.getData('Text').length;
		});

		//注册输入事件，对输入的数据进进行判断
		text_content.addEventListener("input", function(event) {
			setTimeout(function() {
				if (!isCN) {
					if (_this.getByte(text_content.innerHTML) > NOTE_MAX) {
						var data = text_content.textContent;
						var oldDate;
						if (pastedLength > 1) {
							// oldDate = data.slice(0, txtAnchorOffset) + data.slice(txtFocusOffset + pastedLength, data.length);
							text_content.innerHTML = input_html;

							pastedLength = 0;
						} else {
							// oldDate = data.slice(0, txtAnchorOffset) + data.slice(txtFocusOffset, data.length);
							text_content.innerHTML = input_html;
						}
						//再次截取最大长度字符串，防止溢出
						// text_content.textContent = oldDate.slice(0, NOTE_MAX);
						//光标位置
						var range = window.getSelection();
						range.selectAllChildren(text_content);
						range.collapseToEnd();
						// document.getSelection().collapse(text_content.firstChild, txtAnchorOffset);
					} else {
						// console.log('else')
						input_html = text_content.innerHTML;
					}
				}
			}, 0);
		});

		this.btnSend = document.createElement('button');
		this.btnSend.className = 'button button-primary button--mini';
		this.btnSend.textContent = '发送';
		inputWrap.appendChild(this.btnSend);
		pane.appendChild(inputWrap);

		//表情选择框
		var emoticonWrap = document.createElement('div');
		emoticonWrap.setAttribute('class', 'emotion-content');
		emoticonWrap.classList.add('hide');
		var emoticonContainter = document.createElement('ul');
		emoticonWrap.appendChild(emoticonContainter);
		for (var i = 1; i <= 48; i++) {
			let list = document.createElement('li');
			list.setAttribute('data-index', i);
			list.innerHTML = `<img src="${resolveStaticPath('/assets/images/emotion/')}` + i + '.png"></img>';
			emoticonContainter.appendChild(list);
			//绑定聊天点击事件
			addEvent(list, 'click', (e) => {
				var n = list.getAttribute('data-index');
				this.insertImg(resolveStaticPath('/assets/images/emotion/') + n + '.png', n);
				this.toggleClass(emoticonWrap);
			})
		}
		pane.setAttribute('class', 'chat-box');
		pane.appendChild(emoticonWrap);

		//绑定添加聊天表情事件
		document.addEventListener('click', (e) => {
			var e = e || window.event;
			var elem = e.target || e.srcElement;
			if (btnEmoticon.contains(e.target)) {
				this.toggleClass(emoticonWrap);
			} else if (emoticonWrap.contains(e.target)) {
				return;
			} else if (emoticonWrap.classList.contains('show')) {
				this.toggleClass(emoticonWrap);
			}
		})
		//发送框绑定
		addEvent(this.btnSend, 'click', (e) => {
			this.sendMsg();
		})

		document.onkeydown = function(event) {
			var e = event || window.event || arguments.callee.caller.arguments[0];
			if (e.target && e.target.id == 'chat-input') {
				//回车事件
				if (!_this.limitChat && _this.chatState && e.keyCode === 13) {
					e.preventDefault();
					_this.sendMsg();
				}
			}
		}
	}
	toggleClass(div) {
		var sh = div.classList.contains('show');
		if (sh) {
			div.classList.remove('show');
			div.classList.add('hide');
		} else {
			div.classList.remove('hide');
			div.classList.add('show');
		}
	}
	insertImg(src, num) {
		if (this.getByte(this.inputContainter.innerHTML) <= (NOTE_MAX - 5)) {
			if (window.getSelection) {
				var sel = window.getSelection();
				var img = new Image();
				img.src = src;
				img.setAttribute('data-msg', `[:${ num }:]`);
				if (sel.anchorNode !== null && (sel.anchorNode.id == 'chat-input' || sel.anchorNode.parentNode.id == 'chat-input')) {
					var range = sel.getRangeAt(0);
					range.deleteContents();
					range.insertNode(img);

					let contentRange = range.cloneRange(); //克隆选区
					contentRange.setStartAfter(img); //设置光标位置为插入内容的末尾
					contentRange.collapse(true); //移动光标位置到末尾
					sel.removeAllRanges(); //移出所有选区
					sel.addRange(contentRange); //添加修改后的选区
				} else {
					var imgContent = document.createElement('img');
					imgContent.setAttribute('src', src);
					this.inputContainter.appendChild(img);

					// 将获得焦点的光标移动到最后的输入位置
					let range = document.createRange();
					range.selectNodeContents(this.inputContainter);
					range.collapse(false);
					let sel1 = window.getSelection();
					sel1.removeAllRanges();
					sel1.addRange(range);
				}
			}
		}
	}
	addMsg(data, user) {
		var msgdata = data.data;
		if (!msgdata) {
			throw new Error('消息添加失败！')
		}
		//聊天表情加载
		var msg = this.htmlEncodeByRegExp(msgdata.msg).replace(/\[:(.+?):\]/g, function(word) {
			return `<img src="${resolveStaticPath('/assets/images/emotion/')}` + word.replace(/[^0-9]/ig, "") +
				'.png"></img>';
		})
		//聊天消息展示
		var chatList = document.createElement('li');
		chatList.setAttribute('class', 'chat-msg-data');
		chatList.innerHTML =
			`<p>${ _getUserNameHTML(_.find(user, ['uid', msgdata.uid]) || {uid: msgdata.uid}) }</p><br><p>${ msg }</p>`;

		this.chatContainter.appendChild(chatList);
		this.chatContainter.scrollTop = this.chatContainter.scrollHeight;
		chatList.classList.add('animation-fade-in');
	}
	sendMsg() {
		let _this = this;
		let str = this.inputContainter.innerHTML;
		let msg_str = str.replace(/<img[^>]*>/g, function(word) {
			return word.match(/\[:(.+?):\]/g);
		});
		msg_str = _this.htmlDecodeByRegExp(msg_str);

		if (msg_str.trim() != '') {
			if (_this.isFrequent) {
				var myChatList = document.createElement('li');
				myChatList.setAttribute('class', 'chat-msg-data error');
				myChatList.innerHTML = '<p>发送过快！</p>';
				_this.chatContainter.appendChild(myChatList);
				_this.chatContainter.scrollTop = _this.chatContainter.scrollHeight;
				myChatList.classList.add('animation-fade-in');
			} else {
				_this.isFrequent = true;
				setTimeout(function() {
					_this.isFrequent = false;
				}, 5000);

				var myChatList = document.createElement('li');
				myChatList.setAttribute('class', 'chat-msg-data mine');
				myChatList.innerHTML = `<p>${_getUserNameHTML(_this.userinfo)}</p><br><p>${ str }</p>`;

				_this.chatContainter.appendChild(myChatList);
				_this.chatContainter.scrollTop = _this.chatContainter.scrollHeight;
				myChatList.classList.add('animation-fade-in');

				let uid = _.get(_this.userinfo, 'uid');
				rtc_gate.FireIn(rtc_gate.RTCEventID.SendMsg, {
					msgid: rtc_gate.APPMSGID.MsgChat,
					msgdata: {
						srcuid: uid,
						msg: {
							type: 1,
							ver: 1,
							data: {
								uid: uid,
								msg: msg_str,
							},
						},
					},
				})
				_this.inputContainter.innerHTML = "";
			}
		}
	}
	buildUserWrapperEl(pane) {
		pane.setAttribute('class', 'user-box');
		this.userWrap = document.createElement('div');
		this.userWrap.setAttribute('class', 'user-wrapper');
		pane.appendChild(this.userWrap);
	}
	rewriteUser(users) {
		console.dir(users)
		var userList = _.reduce(users, (res, value, key) => {
			//ezone_unknown = 0,ezone_observer = 3,ezone_student = 6,ezone_teacher = 9,ezone_admin = 12
			if (value.identity === GLOB.USER_ROLE.EZONE_TEACHER) {
				res.tea_num += 1;
				res.tea_name = value.nick || value.uid;
			} else if (value.identity === GLOB.USER_ROLE.EZONE_STUDENT) {
				res.stu_num += 1;
				if(_.get(this.userinfo, 'uid') == value.uid) {
					res.stu_names = `<span>${ value.nick || value.uid }</span>` + res.stu_names;
				} else {
					res.stu_names += `<span>${ value.nick || value.uid }</span>`;
				}
			} else if (value.identity === GLOB.USER_ROLE.EZONE_ADMIN) {
				res.assist_num += 1;
				res.assist_names += `<span>${ value.nick || value.uid }</span>`;
			}
			return res;
		}, {
			tea_name: '',
			tea_num: 0,
			stu_names: '',
			stu_num: 0,
			assist_names: '',
			assist_num: 0
		});
		document.getElementById('student-number').textContent = userList.stu_num + userList.assist_num;
		var html = `<p><img src="${resolveStaticPath('/assets/images/common-icons/laoshi.png')}" />教师: </p><span>${userList.tea_name}</span><p><img src="${resolveStaticPath('/assets/images/common-icons/guanliyuan.png')}" />助教: (${userList.assist_num})</p>${userList.assist_names}<p><img src="${resolveStaticPath('/assets/images/common-icons/xuesheng.png')}" />学生: (${userList.stu_num})</p>${userList.stu_names}`;
		this.userWrap.innerHTML = html;
	}
	setChatState(data, sourse) {
		var chatState, limitChat;
		switch (sourse) {
			case 'my_state':
				chatState = _.get(data, 'chat');
				if (this.chatState == chatState) {
					return
				} else {
					this.chatState = chatState;
				}
				break
			case 'room_state':
				limitChat = _.get(_.get(data.msgdata, 'roommode'), 'limitchat');
				if (this.limitChat == limitChat) {
					return
				} else {
					this.limitChat = limitChat;
				}
				break
			case 'join_room':
				this.chatState = _.get(data.userstate, 'chat');
				this.limitChat = _.get(data.roommode, 'limitchat');
				break
			default:
		}

		if (this.chatState == false || this.limitChat == true) {
			this.btnSend.disabled = true;
			this.inputContainter.innerHTML = '<p style="color:#999;">禁言中</p>';
			this.inputContainter.setAttribute('contenteditable', 'false');
			btnEmoticon.classList.add('disabled');
		} else {
			this.btnSend.disabled = false;
			this.inputContainter.innerHTML = '';
			this.inputContainter.setAttribute('contenteditable', 'true');
			btnEmoticon.classList.remove('disabled');
		}
	}
	//转成UTF-8编码之后的字节数,表情占5字节
	getByte(s) {
		var a = s.replace(/<img[^>]*>/g, '\u0061\u0061\u0061\u0061\u0061')
		var b = a.replace(/[\u0000-\u007f]/g, "\u0061");
		var c = b.replace(/[\u0080-\u07ff]/g, "\u0061\u0061");
		var d = c.replace(/[\u0800-\uffff]/g, "\u0061\u0061\u0061");
		return d.length;
	}

	textInit(e) {
		e.preventDefault();
		var text;
		var clp = (e.originalEvent || e).clipboardData;
		if (clp === undefined || clp === null) {
			text = window.clipboardData.getData("text") || "";
			if (text !== "") {
				if (window.getSelection) {
					var newNode = document.createElement("span");
					newNode.innerHTML = text;
					window.getSelection().getRangeAt(0).insertNode(newNode);
				} else {
					document.selection.createRange().pasteHTML(text);
				}
			}
		} else {
			text = clp.getData('text/plain') || "";
			if (text !== "") {
				document.execCommand('insertText', false, text);
			}
		}
	}

	//用正则表达式实现html转码
	htmlEncodeByRegExp(str) {
		var s = "";
		if (str.length == 0) return "";
		s = str.replace(/&/g, "&amp;");
		s = s.replace(/</g, "&lt;");
		s = s.replace(/>/g, "&gt;");
		s = s.replace(/ /g, "&nbsp;");
		s = s.replace(/\'/g, "&#39;");
		s = s.replace(/\"/g, "&quot;");
		return s;
	}
	//用正则表达式实现html解码
	htmlDecodeByRegExp(str) {
		var s = "";
		if (str.length == 0) return "";
		s = str.replace(/&amp;/g, "&");
		s = s.replace(/&lt;/g, "<");
		s = s.replace(/&gt;/g, ">");
		s = s.replace(/&nbsp;/g, " ");
		s = s.replace(/&#39;/g, "\'");
		s = s.replace(/&quot;/g, "\"");
		return s;
	}
}
